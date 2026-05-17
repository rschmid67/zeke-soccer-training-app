// Allow up to 300 s — large videos can take 2-3 min to become ACTIVE in Gemini
export const maxDuration = 300;

const GEMINI_API = "https://generativelanguage.googleapis.com";

// Poll until the uploaded file is ACTIVE (ready for inference)
async function waitForActive(fileName, apiKey, maxMs = 240_000) {
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

  // ── JSON body — post-upload analysis (Coach AI Gemini File API flow) ─────
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
  try {
    const { fileUri, fileName, mimeType: fileMime, description, profile, skills } = await request.json();

    const skillSummary = Object.entries(skills || {})
      .map(([k, v]) => `${k}: ${v}/100`)
      .join(", ");

    await waitForActive(fileName, API_KEY);

    const prompt =
`You are an elite youth soccer development coach conducting a video performance review.

PLAYER TO FIND: ${description}
Focus exclusively on this player throughout the entire video. Ignore all other players.

Player profile:
  Name     : ${profile.name || "Zeke"}
  Age      : ${profile.age || 11}
  Position : ${profile.position || "Attacking Mid"}
  Goal     : ${profile.goal || "Make CONCACAF U15 Cup team in 2029"}
  Current skill scores: ${skillSummary}

STEP 1 — VIDEO TYPE: Determine if this is:
• GAME FOOTAGE — a match with multiple players on a full field
• TRAINING FOOTAGE — individual drills, solo practice, or skills work
State which it is at the very start.

STEP 2 — FULL COACHING ANALYSIS:

1. TECHNICAL SKILLS (with timestamps where possible):
   - First touch: quality, direction, setting up next action
   - Passing: accuracy, weight, choice of target
   - Dribbling: close control, change of direction, speed on the ball
   - Shooting: mechanics, placement, decision to shoot

2. MOVEMENT & POSITIONING:
   - Movement off the ball, ability to find pockets of space
   - Body shape when receiving under pressure
   - Timing of runs (game: runs in behind, across, checking in; training: body shape across reps)

3. DECISION MAKING & SOCCER IQ:
   - When to pass vs dribble vs shoot
   - Pressing triggers and defensive work-rate
   - Vision — can the player play forward or see the next pass early?

4. PHYSICAL ATTRIBUTES:
   - Speed with and without the ball (reference yards/mph where possible)
   - Agility and quickness of direction changes
   - Physical presence in duels (game footage)

5. IF GAME FOOTAGE — Performance under pressure:
   - Composure when pressed by opponents
   - Link-up play and combination passing with teammates
   - Moments that created danger or where opportunities were missed

   IF TRAINING FOOTAGE — Technique quality:
   - Consistency of technique across repetitions
   - Training intensity and intentionality
   - Which technical flaws repeat across reps

6. STRENGTHS — 2-3 genuine positives visible in this footage

7. AREAS TO IMPROVE — 2-3 specific weaknesses, each with:
   - A named drill to address it
   - Sets/reps in imperial units

8. CONCACAF U15 2029 READINESS:
   - What does an elite ${profile.age || 11}-year-old Attacking Mid targeting U15 national selection look like?
   - What specific gaps exist between this player and that standard?
   - The single most important thing to improve right now

Quote specific timestamps for key moments. Be honest, technical, and direct. Use imperial units throughout.`;

    const res = await fetch(
      `${GEMINI_API}/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { fileData: { mimeType: fileMime || "video/mp4", fileUri } },
              { text: prompt },
            ],
          }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini analysis failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    console.log("[analyze] JSON body flow — Gemini raw response:", JSON.stringify(data).slice(0, 500));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const finishReason = data.candidates?.[0]?.finishReason;
      const reason = data.error?.message
        || (finishReason && finishReason !== "STOP" ? `Finish reason: ${finishReason}` : null)
        || data.promptFeedback?.blockReason
        || JSON.stringify(data).slice(0, 300);
      return Response.json({ error: `Gemini returned no analysis text: ${reason}` }, { status: 500 });
    }

    fetch(`${GEMINI_API}/v1beta/${fileName}?key=${API_KEY}`, { method: "DELETE" }).catch(() => {});

    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
  }

  // ── FormData body — Video Analysis tab or frames from chat ────────────────
  const formData = await request.formData();
  const video       = formData.get("video");   // File | null
  const profile     = JSON.parse(formData.get("profile")     || "{}");
  const skills      = JSON.parse(formData.get("skills")      || "{}");
  const frames      = JSON.parse(formData.get("frames")      || "[]");
  const description = formData.get("description") || ""; // user's description of Zeke

  const skillSummary = Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(", ");

  // ── Frames mode — inline Gemini vision (from Coach AI after description) ─
  if (!video && frames.length > 0) {
    const playerID = description
      ? `PLAYER TO FIND: ${description}\nFocus exclusively on this player in every frame. Ignore all other players.`
      : `Focus on player #13 wearing a white jersey and blue cleats.`;

    const framesPrompt =
`You are an elite youth soccer development coach analyzing ${frames.length} frames extracted from a soccer video.

${playerID}

Player profile:
  Name     : ${profile.name || "Zeke"}
  Age      : ${profile.age || 11}
  Position : ${profile.position || "Attacking Mid"}
  Goal     : ${profile.goal || "Make CONCACAF U15 Cup team in 2029"}
  Current skill scores: ${skillSummary}

STEP 1 — VIDEO TYPE: From the frames, determine if this is:
• GAME FOOTAGE — a match with multiple players on a full field
• TRAINING FOOTAGE — individual drills, solo practice, or skills work
State which at the start.

STEP 2 — COACHING ANALYSIS (base everything on what you can actually observe):

1. TECHNICAL SKILLS:
   - First touch: quality, body shape, direction it sets up
   - Passing: accuracy, weight, choice of target
   - Dribbling: close control, ability to change direction under pressure
   - Shooting: mechanics, body shape, placement (if visible)

2. MOVEMENT & POSITIONING:
   - Movement off the ball, ability to find space
   - Body shape when receiving — can the player play forward?
   - Timing and quality of runs (game: runs in behind or across; training: repetition quality)

3. DECISION MAKING & SOCCER IQ:
   - Pass vs dribble vs shoot choices
   - Defensive pressure awareness and pressing work-rate
   - Vision — does the player look before receiving?

4. PHYSICAL ATTRIBUTES:
   - Speed with and without the ball
   - Agility, quickness of direction change
   - Physical presence in challenges (game footage)

5. IF GAME FOOTAGE — Under-pressure performance:
   - Composure when closed down
   - Link-up play with teammates
   - Moments that created or wasted chances

   IF TRAINING FOOTAGE — Technique quality:
   - Consistency across repetitions
   - Training intensity and focus
   - Recurring technical flaws

6. STRENGTHS — 2-3 genuine positives visible in these frames

7. AREAS TO IMPROVE — 2-3 specific weaknesses, each with:
   - A named drill to fix it
   - Sets/reps in imperial units

8. CONCACAF U15 2029 READINESS:
   - What does an elite ${profile.age || 11}-year-old Attacking Mid targeting U15 national selection look like?
   - What are the specific gaps between this player and that standard?
   - The single most important thing to improve right now

Be honest, direct, and technical. Use imperial units throughout.`;

    const imageParts = frames.map(b64 => ({
      inlineData: { mimeType: "image/jpeg", data: b64 },
    }));
    const res = await fetch(
      `${GEMINI_API}/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [...imageParts, { text: framesPrompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
        }),
      }
    );
    const data = await res.json();
    console.log("[analyze] Frames flow — Gemini raw response:", JSON.stringify(data).slice(0, 500));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const finishReason = data.candidates?.[0]?.finishReason;
      const reason = data.error?.message
        || (finishReason && finishReason !== "STOP" ? `Finish reason: ${finishReason}` : null)
        || data.promptFeedback?.blockReason
        || JSON.stringify(data).slice(0, 300);
      return Response.json({ error: `Gemini returned no analysis text: ${reason}` }, { status: 500 });
    }
    return Response.json({ text });
  }

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data.error?.message || data.promptFeedback?.blockReason || JSON.stringify(data);
      throw new Error(`Gemini returned no analysis: ${reason}`);
    }
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
  console.log("[analyze] FormData video flow — Gemini raw response:", JSON.stringify(analysisData).slice(0, 500));
  const text = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finishReason = analysisData.candidates?.[0]?.finishReason;
    const reason = analysisData.error?.message
      || (finishReason && finishReason !== "STOP" ? `Finish reason: ${finishReason}` : null)
      || analysisData.promptFeedback?.blockReason
      || JSON.stringify(analysisData).slice(0, 300);
    throw new Error(`Gemini returned no analysis text: ${reason}`);
  }

  // Step 4 — Delete the uploaded file (fire-and-forget cleanup)
  fetch(`${GEMINI_API}/v1beta/${fileName}?key=${API_KEY}`, { method: "DELETE" }).catch(() => {});

  return Response.json({ text });
}
