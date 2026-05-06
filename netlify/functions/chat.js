import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Extract drill names from coach response using regex — no extra API call, no timeout risk
function extractDrills(text) {
  const drills = [];
  const seen = new Set();

  const add = (raw) => {
    // Strip leading non-letter chars (emojis, symbols) and trailing whitespace
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

  // Pattern 4: **1. Drill Name** or **1) Drill Name** (numbered bold items)
  for (const m of text.matchAll(/\*\*\d+[.)]\s*([A-Za-z][^*\n]{2,45})\*\*/g)) add(m[1]);
  if (drills.length >= 3) return drills.slice(0, 3);

  // Pattern 5: **Drill Name**: or **Drill Name** -
  for (const m of text.matchAll(/\*\*([A-Z][A-Za-z0-9 &'/\-]{3,45})\*\*\s*[:–-]/g)) add(m[1]);

  return drills.slice(0, 3);
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { system, messages } = await request.json();

    // Anthropic requires messages to start with 'user'
    const firstUserIdx = messages.findIndex((m) => m.role === "user");
    const trimmed = messages.slice(firstUserIdx);

    // Get coach response
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: trimmed,
    });

    const text = response.content[0]?.text ?? "Let's keep grinding — you've got this!";

    // Extract drills and build YouTube links (regex, instant)
    const drillNames = extractDrills(text);
    const videos = drillNames.map((name) => ({
      name,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " youth soccer tutorial")}`,
    }));

    return Response.json({ text, videos });
  } catch (err) {
    console.error("Chat function error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: "/api/chat" };
