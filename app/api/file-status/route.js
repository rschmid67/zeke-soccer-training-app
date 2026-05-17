export const maxDuration = 10;

const GEMINI_API = "https://generativelanguage.googleapis.com";

export async function GET(request) {
  const API_KEY  = process.env.GEMINI_API_KEY;
  const fileName = new URL(request.url).searchParams.get("fileName");

  if (!API_KEY)   return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  if (!fileName)  return Response.json({ error: "Missing fileName param" }, { status: 400 });

  try {
    const res  = await fetch(`${GEMINI_API}/v1beta/${fileName}?key=${API_KEY}`);
    const data = await res.json();
    const state = data.state ?? data.file?.state ?? "UNKNOWN";
    return Response.json({ state });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
