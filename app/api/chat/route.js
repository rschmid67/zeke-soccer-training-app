function extractDrills(text) {
  const drills = [];
  const seen = new Set();

  const add = (raw) => {
    const name = raw.trim().replace(/^[^A-Za-z]+/, "").trim();
    if (name.length >= 4 && name.length <= 50 && !seen.has(name)) {
      seen.add(name);
      drills.push(name);
    }
  };

  // Pattern 1: ## 1. [emoji] Drill Name  (numbered section headers)
  for (const m of text.matchAll(/^##\s+\d+\.\s*(.+)/gm)) add(m[1]);
  if (drills.length >= 3) return drills.slice(0, 3);

  // Pattern 2: ## Drill Name  (plain section headers, skip generic ones)
  const skip = /^(beginner|intermediate|advanced|tips|setup|note|important|drill|level)/i;
  for (const m of text.matchAll(/^##\s+([^#\n]{4,50})/gm)) {
    if (!skip.test(m[1].trim())) add(m[1]);
  }
  if (drills.length >= 3) return drills.slice(0, 3);

  // Pattern 3: - **Drill Name** or * **Drill Name**
  for (const m of text.matchAll(/^[-*]\s+\*\*([^*\n]{3,50})\*\*/gm)) add(m[1]);
  if (drills.length >= 3) return drills.slice(0, 3);

  // Pattern 4: **1. Drill Name** or **1) Drill Name**  (numbered bold items)
  for (const m of text.matchAll(/\*\*\d+[.)]\s*([A-Za-z][^*\n]{2,45})\*\*/g)) add(m[1]);
  if (drills.length >= 3) return drills.slice(0, 3);

  // Pattern 5: **Drill Name**: or **Drill Name** -
  for (const m of text.matchAll(/\*\*([A-Z][A-Za-z0-9 &'/\-]{3,45})\*\*\s*[:–-]/g)) add(m[1]);

  return drills.slice(0, 3);
}

export async function POST(request) {
  const { system, messages } = await request.json();

  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  const trimmed = messages.slice(firstUserIdx);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: trimmed,
    }),
  });

  const data = await res.json();
  console.log("[chat] Anthropic status:", res.status, "content:", JSON.stringify(data).slice(0, 300));

  if (!res.ok) {
    const reason = data.error?.message || JSON.stringify(data);
    return Response.json({ error: `Anthropic API error (${res.status}): ${reason}` }, { status: 500 });
  }

  const text = data.content?.[0]?.text ?? "Let's keep grinding — you've got this!";

  const drillNames = extractDrills(text);
  const videos = drillNames.map((name) => ({
    name,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " youth soccer tutorial")}`,
  }));

  return Response.json({ text, videos });
}
