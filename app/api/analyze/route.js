import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  const { filename, profile, skills, frames } = await request.json();

  const skillSummary = Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(", ");

  const hasFrames = frames && frames.length > 0;

  const textPrompt = hasFrames
    ? `You are an elite soccer performance analyst. I'm sending you ${frames.length} frames extracted from a training video of ${profile.name} (age ${profile.age}, ${profile.position}).

Current skill scores: ${skillSummary}
Goal: ${profile.goal}

Look carefully at each frame and analyze what you actually observe — body position, footwork, ball contact, posture, balance, and movement. Then provide:

1. TECHNIQUE OBSERVATIONS (3-4 specific points based on what you see in the frames)
2. STRENGTHS IDENTIFIED (2-3 positives visible in the footage)
3. AREAS TO IMPROVE (2-3 specific weaknesses with drills to address them)
4. SKILL SCORE ADJUSTMENTS (suggest +/- for relevant skills based on what you observed)
5. NEXT SESSION FOCUS (1 priority drill with reps/sets in imperial units)

Be specific and technical. Reference elite player comparisons where fitting. Use imperial units.`
    : `You are an elite soccer performance analyst and coach. Provide a detailed training analysis for:

Player: ${profile.name}, Age: ${profile.age}, Position: ${profile.position}
Current skill scores: ${skillSummary}
Goal: ${profile.goal}

Generate position-specific coaching feedback:
1. TECHNIQUE FOCUS (3-4 key technical areas for a ${profile.position} at age ${profile.age})
2. STRENGTHS TO BUILD ON (2-3 positives based on their skill scores)
3. AREAS TO IMPROVE (2-3 specific weaknesses with drills to address them)
4. SKILL SCORE ADJUSTMENTS (suggest +/- for relevant skills)
5. NEXT SESSION FOCUS (1 priority drill with reps/sets in imperial units)

Be specific, technical, and reference elite player comparisons. Use imperial units.`;

  const content = [];

  if (hasFrames) {
    for (const frame of frames) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: frame },
      });
    }
  }

  content.push({ type: 'text', text: textPrompt });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content }],
  });

  const text = response.content[0]?.text ?? "Analysis complete.";
  return Response.json({ text });
}
