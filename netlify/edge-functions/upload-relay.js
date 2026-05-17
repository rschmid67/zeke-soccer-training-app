// Netlify Edge Function — relays one Gemini resumable upload chunk.
// Lives at /upload-relay (not /api/*) to avoid Next.js routing conflicts.
// Edge functions allow 50 MB request bodies; regular functions cap at 6 MB,
// which is less than Gemini's required 8 MB chunk granularity.

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
      return json({ error: "Missing chunk or uploadUrl" }, 400);
    }

    const body = await chunk.arrayBuffer();

    // Content-Length is a forbidden header in Deno fetch — omit it.
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
      return json({ error: `Gemini chunk PUT failed (${res.status}): ${err}` }, 500);
    }

    if (isFinal) {
      const data = await res.json();
      const fileUri  = data.uri  ?? data.file?.uri;
      const fileName = data.name ?? data.file?.name;
      if (!fileUri) {
        return json({ error: `No file URI in Gemini response: ${JSON.stringify(data).slice(0, 200)}` }, 500);
      }
      return json({ fileUri, fileName });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: `Relay error: ${err?.message ?? String(err)}` }, 500);
  }
};

export const config = { path: "/upload-relay" };
