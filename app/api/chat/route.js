export async function POST(request) {
  const { system, messages } = await request.json();

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
      messages,
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "Let's keep grinding — you've got this!";
  return Response.json({ text });
}
