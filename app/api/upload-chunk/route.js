// Relay a single chunk of a Gemini resumable upload.
// Browser → Netlify (≤4 MB) → Gemini, sidestepping the CORS block on
// the Gemini upload endpoint that prevents direct browser → Gemini PUTs.
export const maxDuration = 30;

export async function POST(request) {
  const formData   = await request.formData();
  const chunk      = formData.get("chunk");               // Blob
  const uploadUrl  = formData.get("uploadUrl");           // Gemini session URL
  const offset     = formData.get("offset");              // byte offset (string)
  const isFinal    = formData.get("isFinal") === "true";

  const chunkBytes = Buffer.from(await chunk.arrayBuffer());

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(chunkBytes.length),
      "X-Goog-Upload-Offset": offset,
      "X-Goog-Upload-Command": isFinal ? "upload, finalize" : "upload",
    },
    body: chunkBytes,
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json(
      { error: `Chunk upload failed (${res.status}): ${err}` },
      { status: 500 }
    );
  }

  if (isFinal) {
    const data = await res.json();
    console.log("[upload-chunk] Gemini finalization:", JSON.stringify(data).slice(0, 300));
    // Gemini returns a flat object — uri/name are top-level
    const fileUri  = data.uri  ?? data.file?.uri;
    const fileName = data.name ?? data.file?.name;
    if (!fileUri) {
      return Response.json(
        { error: "Gemini did not return a file URI after finalization" },
        { status: 500 }
      );
    }
    return Response.json({ fileUri, fileName });
  }

  return Response.json({ ok: true });
}
