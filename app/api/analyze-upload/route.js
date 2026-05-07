export const maxDuration = 30;

const GEMINI_API = "https://generativelanguage.googleapis.com";

// Creates a Gemini resumable upload session.
// Returns the upload URL so the client can PUT the video directly to Gemini
// (the API key never leaves the server).
export async function POST(request) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const { mimeType, filename, fileSize } = await request.json();

  const res = await fetch(
    `${GEMINI_API}/upload/v1beta/files?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(fileSize),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: filename } }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `Failed to start Gemini upload: ${err}` }, { status: 500 });
  }

  const uploadUrl = res.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    return Response.json({ error: "Gemini did not return an upload URL" }, { status: 500 });
  }

  return Response.json({ uploadUrl });
}
