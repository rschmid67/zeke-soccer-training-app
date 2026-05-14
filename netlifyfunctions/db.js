const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

// Create tables if they don't exist
async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS profile (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS chat_history (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    await initDB();

    const { action, payload } = JSON.parse(event.body || "{}");
    const userId = "default"; // Single user for now

    // ── PROFILE ────────────────────────────────────────────────
    if (action === "getProfile") {
      const rows = await sql`SELECT data FROM profile WHERE user_id = ${userId} LIMIT 1`;
      return { statusCode: 200, headers, body: JSON.stringify(rows[0]?.data || null) };
    }

    if (action === "saveProfile") {
      const existing = await sql`SELECT id FROM profile WHERE user_id = ${userId} LIMIT 1`;
      if (existing.length > 0) {
        await sql`UPDATE profile SET data = ${JSON.stringify(payload)}, updated_at = NOW() WHERE user_id = ${userId}`;
      } else {
        await sql`INSERT INTO profile (user_id, data) VALUES (${userId}, ${JSON.stringify(payload)})`;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // ── SKILLS ─────────────────────────────────────────────────
    if (action === "getSkills") {
      const rows = await sql`SELECT data FROM skills WHERE user_id = ${userId} LIMIT 1`;
      return { statusCode: 200, headers, body: JSON.stringify(rows[0]?.data || null) };
    }

    if (action === "saveSkills") {
      const existing = await sql`SELECT id FROM skills WHERE user_id = ${userId} LIMIT 1`;
      if (existing.length > 0) {
        await sql`UPDATE skills SET data = ${JSON.stringify(payload)}, updated_at = NOW() WHERE user_id = ${userId}`;
      } else {
        await sql`INSERT INTO skills (user_id, data) VALUES (${userId}, ${JSON.stringify(payload)})`;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // ── SESSIONS ───────────────────────────────────────────────
    if (action === "getSessions") {
      const rows = await sql`SELECT id, data, created_at FROM sessions WHERE user_id = ${userId} ORDER BY created_at ASC`;
      return { statusCode: 200, headers, body: JSON.stringify(rows.map(r => ({ ...r.data, dbId: r.id }))) };
    }

    if (action === "addSession") {
      await sql`INSERT INTO sessions (user_id, data) VALUES (${userId}, ${JSON.stringify(payload)})`;
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (action === "deleteSession") {
      await sql`DELETE FROM sessions WHERE id = ${payload.dbId} AND user_id = ${userId}`;
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // ── CHAT HISTORY ───────────────────────────────────────────
    if (action === "getChatHistory") {
      const rows = await sql`SELECT role, text FROM chat_history WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 100`;
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    if (action === "addChatMessage") {
      await sql`INSERT INTO chat_history (user_id, role, text) VALUES (${userId}, ${payload.role}, ${payload.text})`;
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (action === "clearChatHistory") {
      await sql`DELETE FROM chat_history WHERE user_id = ${userId}`;
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    console.error("DB error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Database error", detail: err.message }),
    };
  }
};
