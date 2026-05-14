// Netlify Edge Function — relays one chunk of a Gemini resumable upload.
// Must be an edge function: regular Netlify functions cap at 6 MB but
// Gemini requires 8 MB chunk granularity. Edge functions allow 50 MB.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (request) => {
  try {
    const formData  = await request.formData();
    const chunk     = formData.get("chunk");
    const uploadUrl = formData.get("uploadUrl");
    const offset    = formData.get("offset");
    const isFinal   = formData.get("isFinal") === "true";

    if (!chunk || !uploadUrl) {
      return json({ error: "Missing chunk or uploadUrl in request" }, 400);
    }

    const body = await chunk.arrayBuffer();

    // Note: do NOT set Content-Length — it is a forbidden header in Deno's
    // fetch implementation and will throw, killing the function silently.
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "X-Goog-Upload-Offset": String(offset),
        "X-Goog-Upload-Command": isFinal ? "upload, finalize" : "upload",
      },
      body,
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
        return json({ error: `Gemini returned no file URI. Response: ${JSON.stringify(data).slice(0, 200)}` }, 500);
      }
      return json({ fileUri, fileName });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: `Edge function error: ${err?.message ?? String(err)}` }, 500);
  }
};

export const config = { path: "/api/upload-chunk" };
