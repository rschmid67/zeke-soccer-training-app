// Returns the Gemini API key so the browser can upload video directly to Google.
// This bypasses Netlify's 6 MB function body limit for large video files.
// Acceptable for a personal family app over HTTPS.
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }
  return Response.json({ key });
}
