// Allow up to 60 s — Gemini video upload + processing + inference
export const maxDuration = 60;

const GEMINI_API = "https://generativelanguage.googleapis.com";

// Poll until the uploaded file is ACTIVE (ready for inference)
async function waitForActive(fileName, apiKey, maxMs = 45_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${GEMINI_API}/v1beta/${fileName}?key=${apiKey}`
    );
    const data = await res.json();
    const state = data.state ?? data.file?.state;
    if (state === "ACTIVE") return;
    if (state === "FAILED") throw new Error("Gemini video processing failed");
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Gemini video processing timed out — try a shorter clip");
}

export async function POST(request) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const video    = formData.get("video");   // File | null
  const profile  = JSON.parse(formData.get("profile") || "{}");
  const skills   = JSON.parse(formData.get("skills")  || "{}");
  const frames   = JSON.parse(formData.get("frames")  || "[]"); // base64 JPEGs from client

  const skillSummary = Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(", ");

  const coachingPrompt =
`You are an expert youth soccer coach reviewing training footage of player #13 wearing a white jersey and blue cleats.

Player profile:
  Name     : ${profile.name}
  Age      : ${profile.age}
  Position : ${profile.position}
  Goal     : ${profile.goal}
  Current skill scores: ${skillSummary}

Provide specific coaching feedback:

1. TECHNIQUE OBSERVATIONS — Footwork, first touch, ball control, shooting mechanics, passing technique.
2. POSITIONING & MOVEMENT — How #13 finds space, times runs, and shapes as an attacking mid off the ball.
3. DECISION MAKING — Quality of decisions in possession and pressing moments.
4. STRENGTHS — 2-3 genuine positives you can see in this footage.
5. AREAS TO IMPROVE — 2-3 specific weaknesses, each with a named drill to address it.
6. SKILL SCORE ADJUSTMENTS — Suggest a +/- adjustment for: dribbling, shooting, passing, speed, agility, positioning.
7. NEXT SESSION PRIORITY — The single most important drill, with sets/reps in imperial units.

Be technical and specific to what you actually observe. Reference what elite attacking mids do at age ${profile.age}. Use imperial units throughout.`;

  // ── Frames mode — inline Gemini vision (from Coach AI) ─────────────────
  if (!video && frames.length > 0) {
    const imageParts = frames.map(b64 => ({
      inlineData: { mimeType: "image/jpeg", data: b64 },
    }));
    const res = await fetch(
      `${GEMINI_API}/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [...imageParts, { text: coachingPrompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
        }),
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Analysis complete.";
    return Response.json({ text });
  }

  // ── No video — profile-based text analysis ─────────────────────────────
  if (!video) {
    const noVideoPrompt = `You are an expert soccer coach. Provide detailed position-specific coaching feedback for:

Player: ${profile.name}, Age: ${profile.age}, Position: ${profile.position}
Goal: ${profile.goal}
Current skill scores: ${skillSummary}

Give:
1. TECHNIQUE FOCUS (3-4 key areas for a ${profile.position} at age ${profile.age})
2. STRENGTHS TO BUILD ON
3. AREAS TO IMPROVE (with a specific drill for each)
4. SKILL SCORE ADJUSTMENTS (suggest +/- based on the profile)
5. NEXT SESSION PRIORITY (1 drill, reps/sets, imperial units)

Be direct and technical. Use imperial units throughout.`;

    const res = await fetch(
      `${GEMINI_API}/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: noVideoPrompt }] }] }),
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Analysis complete.";
    return Response.json({ text });
  }

  // ── With video — Gemini File API flow ───────────────────────────────────
  const videoBytes = Buffer.from(await video.arrayBuffer());
  const mimeType   = video.type || "video/mp4";
  const filename   = video.name || "training.mp4";

  // Step 1 — Upload video to Gemini File API (multipart)
  const boundary = `GeminiBoundary${Date.now()}`;
  const metaPart = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify({ file: { displayName: filename } })}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  const endPart  = Buffer.from(`\r\n--${boundary}--`);
  const body     = Buffer.concat([metaPart, videoBytes, endPart]);

  const uploadRes = await fetch(
    `${GEMINI_API}/upload/v1beta/files?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Gemini upload failed (${uploadRes.status}): ${err}`);
  }

  const uploadData = await uploadRes.json();
  const fileUri  = uploadData.file?.uri;
  const fileName = uploadData.file?.name; // e.g. "files/abc123"

  if (!fileUri) throw new Error("Gemini upload returned no file URI");

  // Step 2 — Wait for the file to finish processing
  await waitForActive(fileName, API_KEY);

  // Step 3 — Analyse with Gemini 1.5 Pro (native video understanding)
  const analysisRes = await fetch(
    `${GEMINI_API}/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { fileData: { mimeType, fileUri } },
            { text: `Watch the full video. Quote specific timestamps where possible.\n\n${coachingPrompt}` },
          ],
        }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }),
    }
  );

  if (!analysisRes.ok) {
    const err = await analysisRes.text();
    throw new Error(`Gemini analysis failed (${analysisRes.status}): ${err}`);
  }

  const analysisData = await analysisRes.json();
  const text = analysisData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Analysis complete.";

  // Step 4 — Delete the uploaded file (fire-and-forget cleanup)
  fetch(`${GEMINI_API}/v1beta/${fileName}?key=${API_KEY}`, { method: "DELETE" }).catch(() => {});

  return Response.json({ text });
}
