import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      name TEXT, age INTEGER, position TEXT, height TEXT, weight TEXT,
      goal TEXT, target_year INTEGER, idols TEXT[], club TEXT,
      coach_email TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      user_id TEXT PRIMARY KEY,
      dribbling INTEGER DEFAULT 0, shooting INTEGER DEFAULT 0,
      passing INTEGER DEFAULT 0, speed INTEGER DEFAULT 0,
      agility INTEGER DEFAULT 0, defending INTEGER DEFAULT 0,
      heading INTEGER DEFAULT 0, positioning INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY, user_id TEXT, date DATE, type TEXT,
      duration INTEGER, source TEXT, notes TEXT, score INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const action = searchParams.get("action");

    if (action === "init") {
      await initSchema();
      return Response.json({ ok: true });
    }

    const [profileRows, skillRows, sessionRows] = await Promise.all([
      sql`SELECT * FROM profiles WHERE user_id = ${userId}`,
      sql`SELECT * FROM skills   WHERE user_id = ${userId}`,
      sql`SELECT * FROM sessions WHERE user_id = ${userId} ORDER BY date DESC`,
    ]);

    return Response.json({
      profile: profileRows[0] || null,
      skills: skillRows[0] || null,
      sessions: sessionRows,
    });
  } catch (err) {
    console.error("DB GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId = "default", data } = body;

    if (action === "saveProfile") {
      await sql`
        INSERT INTO profiles (user_id, name, age, position, height, weight, goal, target_year, idols, club, coach_email, updated_at)
        VALUES (${userId}, ${data.name}, ${data.age ? parseInt(data.age) : null}, ${data.position},
                ${data.height}, ${data.weight}, ${data.goal}, ${data.targetYear ? parseInt(data.targetYear) : null},
                ${data.idols || []}, ${data.club}, ${data.coachEmail}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          name = EXCLUDED.name, age = EXCLUDED.age, position = EXCLUDED.position,
          height = EXCLUDED.height, weight = EXCLUDED.weight, goal = EXCLUDED.goal,
          target_year = EXCLUDED.target_year, idols = EXCLUDED.idols,
          club = EXCLUDED.club, coach_email = EXCLUDED.coach_email, updated_at = NOW()
      `;
      return Response.json({ ok: true });
    }

    if (action === "saveSkills") {
      await sql`
        INSERT INTO skills (user_id, dribbling, shooting, passing, speed, agility, defending, heading, positioning, updated_at)
        VALUES (${userId}, ${data.dribbling}, ${data.shooting}, ${data.passing}, ${data.speed},
                ${data.agility}, ${data.defending}, ${data.heading}, ${data.positioning}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          dribbling = EXCLUDED.dribbling, shooting = EXCLUDED.shooting, passing = EXCLUDED.passing,
          speed = EXCLUDED.speed, agility = EXCLUDED.agility, defending = EXCLUDED.defending,
          heading = EXCLUDED.heading, positioning = EXCLUDED.positioning, updated_at = NOW()
      `;
      return Response.json({ ok: true });
    }

    if (action === "addSession") {
      const [row] = await sql`
        INSERT INTO sessions (user_id, date, type, duration, source, notes, score)
        VALUES (${userId}, ${data.date}, ${data.type}, ${data.duration}, ${data.source}, ${data.notes || ""}, ${data.score})
        RETURNING *
      `;
      return Response.json({ ok: true, session: row });
    }

    if (action === "deleteSession") {
      await sql`DELETE FROM sessions WHERE id = ${data.id} AND user_id = ${userId}`;
      return Response.json({ ok: true });
    }

    if (action === "resetAll") {
      await Promise.all([
        sql`DELETE FROM sessions WHERE user_id = ${userId}`,
        sql`UPDATE skills SET dribbling=0, shooting=0, passing=0, speed=0, agility=0, defending=0, heading=0, positioning=0, updated_at=NOW() WHERE user_id = ${userId}`,
        sql`UPDATE profiles SET name=${data.name||''}, age=${data.age ? parseInt(data.age) : null}, position=${data.position||''}, goal=${data.goal||''}, target_year=${data.targetYear ? parseInt(data.targetYear) : null}, height='', weight='', idols='{}', club='', coach_email='', updated_at=NOW() WHERE user_id = ${userId}`,
      ]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("DB POST error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
