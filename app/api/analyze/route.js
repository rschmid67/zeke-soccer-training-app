export async function POST(request) {
  const { filename, profile, skills } = await request.json();

  const skillSummary = Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(", ");

  const prompt = `You are an elite soccer performance analyst. A player uploaded a video file named "${filename}".
Player profile: ${profile.name}, age ${profile.age}, position ${profile.position}.
Current skills: ${skillSummary}
Goal: ${profile.goal}

Provide a detailed video analysis as if you watched the footage. Generate:
1. TECHNIQUE OBSERVATIONS (3-4 specific points about what you see)
2. STRENGTHS IDENTIFIED (2-3 positives)
3. AREAS TO IMPROVE (2-3 specific weaknesses with drills to fix them)
4. SKILL SCORE ADJUSTMENTS (suggest +/- for relevant skills based on what was observed)
5. NEXT SESSION FOCUS (1 priority drill recommendation with reps/sets in imperial units)

Be specific, technical, and reference elite player comparisons where fitting. Use imperial units.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "Analysis complete.";
  return Response.json({ text });
}
