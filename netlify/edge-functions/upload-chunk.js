// Netlify Edge Function — relays one chunk of a Gemini resumable upload.
// Edge functions have a 50 MB body limit, so 8 MB chunks fit fine.
// Regular Netlify functions cap at 6 MB, which is less than Gemini's
// required 8 MB chunk granularity — that's why this must be an edge function.

export default async (request) => {
  const formData  = await request.formData();
  const chunk     = formData.get("chunk");
  const uploadUrl = formData.get("uploadUrl");
  const offset    = formData.get("offset");
  const isFinal   = formData.get("isFinal") === "true";

  const body = await chunk.arrayBuffer();

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(body.byteLength),
      "X-Goog-Upload-Offset": offset,
      "X-Goog-Upload-Command": isFinal ? "upload, finalize" : "upload",
    },
    body,
  });

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (!res.ok) {
    const err = await res.text();
    return json({ error: `Chunk upload failed (${res.status}): ${err}` }, 500);
  }

  if (isFinal) {
    const data = await res.json();
    const fileUri  = data.uri  ?? data.file?.uri;
    const fileName = data.name ?? data.file?.name;
    if (!fileUri) {
      return json({ error: "Gemini did not return a file URI after finalization" }, 500);
    }
    return json({ fileUri, fileName });
  }

  return json({ ok: true });
};

export const config = { path: "/api/upload-chunk" };
