'use client';
import { useState, useEffect, useRef } from "react";

// ── Static data ──────────────────────────────────────────────────────────────
const SKILLS = [
  { id: "dribbling", label: "Dribbling", icon: "⚡", color: "#00e676" },
  { id: "shooting", label: "Shooting", icon: "🎯", color: "#ffd600" },
  { id: "passing", label: "Passing", icon: "🔄", color: "#00bcd4" },
  { id: "speed", label: "Speed", icon: "💨", color: "#ff9800" },
  { id: "agility", label: "Agility", icon: "🔀", color: "#e040fb" },
  { id: "defending", label: "Defending", icon: "🛡️", color: "#f44336" },
  { id: "heading", label: "Heading", icon: "🧠", color: "#4caf50" },
  { id: "positioning", label: "Positioning", icon: "📍", color: "#26c6da" },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊", section: "MAIN" },
  { id: "training", label: "My Training", icon: "🏃", section: "MAIN" },
  { id: "video", label: "Video Analysis", icon: "🎥", section: "MAIN" },
  { id: "progress", label: "My Progress", icon: "📈", section: "MAIN" },
  { id: "calendar", label: "Calendar", icon: "📅", section: "PLAN" },
  { id: "plan", label: "Training Plan", icon: "📋", section: "PLAN" },
  { id: "chat", label: "Coach AI", icon: "💬", section: "COACHING" },
  { id: "highlights", label: "Highlights & CV", icon: "🌟", section: "SHARE" },
  { id: "share", label: "Share & Export", icon: "🔗", section: "SHARE" },
  { id: "settings", label: "My Profile", icon: "👤", section: "ACCOUNT" },
];

const SAMPLE_SESSIONS = [];

const WEEKLY_PLAN = [
  { day: "Mon", focus: "Dribbling & Ball Mastery", drills: ["Cone weave (10 cones, 1 yd apart)", "Inside/outside touches – 2 min each foot", "Cruyff turn + V-pullback combo"], duration: 45, intensity: "Medium" },
  { day: "Tue", focus: "Passing & Creative Play", drills: ["Wall passes – 50 reps each foot", "1-2 combo drill with cone target", "Long switch passes across 20 yds"], duration: 45, intensity: "Medium" },
  { day: "Wed", focus: "Rest / Active Recovery", drills: ["Light juggling (100 touches)", "Hip flexor & hamstring stretch"], duration: 20, intensity: "Low" },
  { day: "Thu", focus: "Shooting & Finishing", drills: ["Driven shots from 18 yds – 15 reps", "1-touch finish off low cross", "Penalty practice – 10 shots"], duration: 50, intensity: "Medium" },
  { day: "Fri", focus: "Speed & Agility Games", drills: ["Ladder footwork (4 patterns × 5 reps)", "20-yd sprint with ball – 8 sets", "Reaction start bursts from standing"], duration: 40, intensity: "High" },
  { day: "Sat", focus: "Match / Scrimmage", drills: ["Full scrimmage or match play", "Focus: finding space as the #10"], duration: 60, intensity: "High" },
  { day: "Sun", focus: "Rest Day", drills: ["Full rest – no training"], duration: 0, intensity: "Low" },
];

const CHAT_INIT = [
  { role: "coach", text: "Hey Zeke! I'm your Coach AI — here to guide you every step toward making the CONCACAF U15 Cup team in 2029. You're 11 right now and you've got 3 years to build the game of your life. Every session counts. What do you want to work on today?" },
];

const DEFAULT_PROFILE = {
  name: "Zeke Schmid", age: "11", position: "Attacking Mid",
  height: "", weight: "",
  goal: "Make the U15 CONCACAF Cup team in 2029",
  targetYear: 2029,
  idols: [],
  club: "", coachEmail: "",
};

const DEFAULT_SKILLS = {
  dribbling: 0, shooting: 0, passing: 0, speed: 0,
  agility: 0, defending: 0, heading: 0, positioning: 0,
};

// Bump this string any time you need to force a full localStorage + DB reset for all users.
const DATA_VERSION = "v3";

// ── Radar Chart Component ─────────────────────────────────────────────────────
function RadarChart({ data, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, v) => {
    const a = angle(i), rv = (v / 100) * r;
    return [cx + rv * Math.cos(a), cy + rv * Math.sin(a)];
  };
  const gridPts = (v) => data.map((_, i) => pt(i, v)).map(([x, y]) => `${x},${y}`).join(" ");
  const dataPts = data.map(([, v], i) => pt(i, v)).map(([x, y]) => `${x},${y}`).join(" ");
  const targetPts = data.map(([, , t], i) => pt(i, t)).map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg width={size} height={size} className="radar-svg" viewBox={`0 0 ${size} ${size}`}>
      {[20, 40, 60, 80, 100].map(v => (
        <polygon key={v} points={gridPts(v)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      <polygon points={targetPts} fill="rgba(255,214,0,0.06)" stroke="rgba(255,214,0,0.4)" strokeWidth="1.5" strokeDasharray="4,3" />
      <polygon points={dataPts} fill="rgba(0,200,83,0.15)" stroke="#00e676" strokeWidth="2" />
      {data.map(([label, val], i) => {
        const [x, y] = pt(i, 100);
        const lx = cx + (r + 20) * Math.cos(angle(i));
        const ly = cy + (r + 20) * Math.sin(angle(i));
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill="#00e676" opacity={0.4} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#7a8faa" fontFamily="Barlow Condensed">{label}</text>
            <text x={lx} y={ly + 11} textAnchor="middle" fontSize="8" fill="#00e676" fontFamily="Bebas Neue">{val}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Progress Line Chart ────────────────────────────────────────────────────────
function LineChart({ data, color = "#00e676", width = 320, height = 80 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`lg${color.replace("#","")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#lg${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / (max - min)) * height;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

// ── Chat Page (top-level so React never unmounts it on re-render) ─────────────
function ChatPage({ chatMessages, chatInput, setChatInput, chatLoading, chatLoadingMsg, sendChat, fileRef }) {
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card" style={{ marginBottom: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--grass), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🧑‍🏫</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Coach AI</div>
          <div style={{ fontSize: 11, color: "var(--grass2)" }}>● Online · Knows your full profile & training history</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>📹 Attach Video</button>
        </div>
      </div>

      <div className="card">
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className={`chat-avatar ${m.role}`}>{m.role === "coach" ? "🧑‍🏫" : "⚽"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "75%" }}>
                  <div className={`chat-bubble ${m.role}`}>{m.text}</div>
                  {m.role === "coach" && m.videos?.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {m.videos.map((v, vi) => (
                        <a key={vi} href={v.url} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "center", gap: 8,
                          background: "rgba(255,30,30,0.12)", border: "1px solid rgba(255,80,80,0.3)",
                          borderRadius: 8, padding: "7px 12px", textDecoration: "none",
                          color: "var(--white)", fontSize: 12, fontWeight: 600,
                        }}>
                          <span style={{ color: "#ff4444", fontSize: 14 }}>▶</span>
                          <span>Watch: {v.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-msg">
                <div className="chat-avatar coach">🧑‍🏫</div>
                <div className="chat-bubble coach" style={{ color: "var(--muted)" }}>{chatLoadingMsg || "Coach is thinking..."}</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask your coach anything... or upload a video to analyze"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat(chatInput)}
            />
            <button className="btn btn-primary" onClick={() => sendChat(chatInput)}>Send</button>
          </div>
        </div>

        <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["How am I progressing?", "What should I work on today?", "How can I shoot like Beckham?", "Analyze my speed drill video"].map(q => (
            <button key={q} className="btn btn-secondary btn-sm" onClick={() => sendChat(q)} style={{ fontSize: 11 }}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, loading }) {
  const [code, setCode] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pitch1)" }}>
      <div style={{ background: "var(--pitch2)", border: "1px solid var(--border)", borderRadius: 16, padding: 40, maxWidth: 400, width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>⚽</div>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, color: "var(--grass2)", letterSpacing: 3, marginBottom: 8 }}>My Path</div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 14, color: "var(--muted)", marginBottom: 28, lineHeight: 1.7 }}>
          Enter your access code to load your training data on this device.<br />
          New here? Just enter any code to create your account.
        </div>
        <input
          className="form-input"
          placeholder="Access code (e.g. zeke2025)"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && code.trim() && onLogin(code.trim().toLowerCase())}
          style={{ marginBottom: 14, fontSize: 15, textAlign: "center", letterSpacing: 2 }}
          autoFocus
        />
        <button
          className="btn btn-primary"
          style={{ width: "100%", fontSize: 15, padding: "12px 0" }}
          onClick={() => code.trim() && onLogin(code.trim().toLowerCase())}
          disabled={!code.trim() || loading}
        >
          {loading ? "Loading your data..." : "Enter App →"}
        </button>
        <div style={{ marginTop: 20, fontSize: 11, color: "var(--muted)", lineHeight: 1.8 }}>
          Use the same code on every device to sync your data.
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function SoccerApp() {
  const [page, setPage] = useState("dashboard");
  const [userId, setUserId] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [sessions, setSessions] = useState([]);
  const [chatMessages, setChatMessages] = useState(CHAT_INIT);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [modal, setModal] = useState(null); // "addSession" | "editProfile" | "shareModal"
  const [activeTab, setActiveTab] = useState(0);
  const [calMonth, setCalMonth] = useState(new Date());
  const [videoAnalysis, setVideoAnalysis] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [pendingVideo, setPendingVideo] = useState(null); // File waiting for player description
  const [chatLoadingMsg, setChatLoadingMsg] = useState("Coach is thinking...");
  const fileRef = useRef();
  const chatFileRef = useRef();

  // ── Data sync ────────────────────────────────────────────────────────────
  const dbPost = (action, data) => {
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId, data }),
    }).catch(() => {});
  };

  const loadFromDb = async (uid) => {
    setDbLoading(true);
    try {
      await fetch(`/api/db?userId=${encodeURIComponent(uid)}&action=init`);
      const res = await fetch(`/api/db?userId=${encodeURIComponent(uid)}`);
      const d = await res.json();
      if (d.profile) {
        const p = {
          name: d.profile.name || DEFAULT_PROFILE.name,
          age: d.profile.age || DEFAULT_PROFILE.age,
          position: d.profile.position || DEFAULT_PROFILE.position,
          height: d.profile.height || "",
          weight: d.profile.weight || "",
          goal: d.profile.goal || DEFAULT_PROFILE.goal,
          targetYear: d.profile.target_year || DEFAULT_PROFILE.targetYear,
          idols: d.profile.idols || [],
          club: d.profile.club || "",
          coachEmail: d.profile.coach_email || "",
        };
        setProfile(p);
        localStorage.setItem("zeke_profile", JSON.stringify(p));
      }
      if (d.skills) {
        const sk = {
          dribbling: d.skills.dribbling ?? 0,
          shooting: d.skills.shooting ?? 0,
          passing: d.skills.passing ?? 0,
          speed: d.skills.speed ?? 0,
          agility: d.skills.agility ?? 0,
          defending: d.skills.defending ?? 0,
          heading: d.skills.heading ?? 0,
          positioning: d.skills.positioning ?? 0,
        };
        setSkills(sk);
        localStorage.setItem("zeke_skills", JSON.stringify(sk));
      }
      if (d.sessions && d.sessions.length > 0) {
        const se = d.sessions.map(s => ({
          id: s.id,
          date: typeof s.date === "string" ? s.date.slice(0, 10) : new Date(s.date).toISOString().slice(0, 10),
          type: s.type,
          duration: s.duration,
          source: s.source,
          notes: s.notes || "",
          score: s.score,
        }));
        setSessions(se);
        localStorage.setItem("zeke_sessions", JSON.stringify(se));
      }
    } catch {
      // DB unavailable — fall back to localStorage cache
      try {
        const p = localStorage.getItem("zeke_profile");
        if (p) {
          const parsed = JSON.parse(p);
          setProfile({
            ...parsed,
            name: parsed.name || DEFAULT_PROFILE.name,
            age: parsed.age || DEFAULT_PROFILE.age,
            position: parsed.position || DEFAULT_PROFILE.position,
            goal: parsed.goal || DEFAULT_PROFILE.goal,
            targetYear: parsed.targetYear || DEFAULT_PROFILE.targetYear,
          });
        }
        const sk = localStorage.getItem("zeke_skills");
        if (sk) setSkills(JSON.parse(sk));
        const se = localStorage.getItem("zeke_sessions");
        if (se) setSessions(JSON.parse(se));
      } catch {}
    }
    setUserId(uid);
    localStorage.setItem("zeke_user_id", uid);
    setDbLoading(false);
  };

  useEffect(() => {
    const storedVersion = localStorage.getItem("zeke_data_version");
    const storedId = localStorage.getItem("zeke_user_id");

    if (storedVersion !== DATA_VERSION) {
      // Wipe every cached key so stale data can't bleed through
      ["zeke_profile", "zeke_skills", "zeke_sessions"].forEach(k => localStorage.removeItem(k));
      localStorage.setItem("zeke_data_version", DATA_VERSION);

      if (storedId) {
        // Reset DB to clean defaults, then reload fresh
        fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resetAll", userId: storedId, data: DEFAULT_PROFILE }),
        }).catch(() => {}).finally(() => loadFromDb(storedId));
      }
      return;
    }

    if (storedId) loadFromDb(storedId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { localStorage.setItem("zeke_profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem("zeke_skills", JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem("zeke_sessions", JSON.stringify(sessions)); }, [sessions]);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    dbPost("deleteSession", { id: sessionId });
  };

  // ── API Chat ──────────────────────────────────────────────────────────────
  const sendChat = async (msg) => {
    if (!msg.trim()) return;

    // ── Video analysis flow — user just provided the player description ───────
    if (pendingVideo) {
      const description = msg.trim();
      const file = pendingVideo;
      setPendingVideo(null);

      setChatMessages(prev => [...prev, { role: "user", text: description }]);
      setChatInput("");
      setChatLoading(true);

      try {
        // Phase 1 — Server creates a Gemini resumable upload session.
        // Server reads the CORS-blocked X-Goog-Upload-URL header and returns
        // it as JSON so the client knows where to send chunks.
        setChatLoadingMsg("Creating upload session...");
        const sessionRes  = await fetch("/api/analyze-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mimeType: file.type || "video/mp4", filename: file.name, fileSize: file.size }),
        });
        const sessionText = await sessionRes.text();
        console.log("[chat] /api/analyze-upload raw:", sessionRes.status, sessionText.slice(0, 300));
        let sessionData;
        try { sessionData = JSON.parse(sessionText); }
        catch { throw new Error(`Session init failed (HTTP ${sessionRes.status}): ${sessionText.slice(0, 200)}`); }
        if (sessionData.error) throw new Error(`Session: ${sessionData.error}`);
        const { uploadUrl } = sessionData;

        // Phase 2 — Relay video chunks through /upload-relay (Netlify Edge Function,
        // 50 MB body limit). Path is outside /api/ to avoid Next.js route conflicts.
        // Gemini requires 8 MB chunk granularity for non-final chunks.
        const CHUNK  = 8 * 1024 * 1024;
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        const total  = Math.ceil(file.size / CHUNK);
        let fileUri, fileName;

        for (let i = 0; i < total; i++) {
          const start   = i * CHUNK;
          const isFinal = i === total - 1;
          setChatLoadingMsg(`Uploading ${sizeMB} MB — ${Math.round((i / total) * 100)}%...`);

          const chunkForm = new FormData();
          chunkForm.append("chunk",      file.slice(start, Math.min(start + CHUNK, file.size)));
          chunkForm.append("uploadUrl",  uploadUrl);
          chunkForm.append("offset",     String(start));
          chunkForm.append("isFinal",    String(isFinal));

          const chunkRes  = await fetch("/upload-relay", { method: "POST", body: chunkForm });
          const chunkText = await chunkRes.text();
          console.log(`[chat] /upload-relay chunk ${i+1}/${total} raw:`, chunkRes.status, chunkText.slice(0, 300));
          let chunkData;
          try { chunkData = JSON.parse(chunkText); }
          catch { throw new Error(`Chunk ${i+1}/${total} non-JSON (HTTP ${chunkRes.status}): ${chunkText.slice(0, 200)}`); }
          if (chunkData.error) throw new Error(`Chunk ${i+1}/${total}: ${chunkData.error}`);

          if (isFinal) { fileUri = chunkData.fileUri; fileName = chunkData.fileName; }
        }

        if (!fileUri) throw new Error("Upload finished but Gemini returned no file URI");

        // Phase 3 — Server polls for ACTIVE then runs generateContent on the full video
        setChatLoadingMsg("Video uploaded! Gemini is watching the full video...");
        const analyzeRes  = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUri, fileName, mimeType: file.type || "video/mp4", description, profile, skills }),
        });
        const analyzeText = await analyzeRes.text();
        console.log("[chat] /api/analyze raw:", analyzeRes.status, analyzeText.slice(0, 300));
        let payload;
        try { payload = JSON.parse(analyzeText); }
        catch { throw new Error(`Analyze step non-JSON (HTTP ${analyzeRes.status}): ${analyzeText.slice(0, 200)}`); }
        if (payload.error) throw new Error(payload.error);
        if (!payload.text) throw new Error("Gemini returned an empty response — try a shorter clip");

        setChatMessages(prev => [...prev, {
          role: "coach",
          text: payload.text,
          videos: [],
        }]);
      } catch (err) {
        setChatMessages(prev => [...prev, {
          role: "coach",
          text: `Video analysis failed: ${err.message || "check your connection and try again."}`,
        }]);
      }

      setChatLoading(false);
      setChatLoadingMsg("Coach is thinking...");
      return;
    }

    // ── Normal Claude chat ────────────────────────────────────────────────────
    const userMsg = { role: "user", text: msg };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setChatLoading(true);

    const skillSummary = Object.entries(skills).map(([k, v]) => `${k}: ${v}/100`).join(", ");
    const recentSessions = sessions.slice(-3).map(s => `${s.date} ${s.type} (${s.duration}min, score ${s.score})`).join("; ");

    const systemPrompt = `You are Coach AI — a passionate, motivating soccer coach persona blending the wisdom of Pep Guardiola with the personal experience of training players like Messi and Beckham. You speak with authority, warmth, and urgency. You know your player's profile:
Name: ${profile.name}, Age: ${profile.age}, Position: ${profile.position}
Goal: ${profile.goal}
Current skill scores — ${skillSummary}
Recent sessions: ${recentSessions}
Idols: ${profile.idols.join(", ")}
All advice uses imperial units (yards, feet, lbs, mph).
Keep responses under 200 words. Be direct, motivating, and specific. Reference their stats when relevant. Occasionally reference what Messi or Beckham did at their age.`;

    try {
      // Anthropic requires messages to start with 'user', so strip any leading coach messages
      const apiMessages = newHistory.map(m => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.text,
      }));
      const firstUserIdx = apiMessages.findIndex(m => m.role === "user");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: apiMessages.slice(firstUserIdx),
        }),
      });
      const { text, videos } = await res.json();
      setChatMessages([...newHistory, { role: "coach", text: text || "Let's keep grinding — you've got this!", videos: videos || [] }]);
    } catch {
      setChatMessages([...newHistory, { role: "coach", text: "Connection issue — but remember: Messi never let obstacles stop him either. Keep going!" }]);
    }
    setChatLoading(false);
  };

  // ── Video Analysis ────────────────────────────────────────────────────────
  const analyzeVideo = async (file) => {
    setVideoLoading(true);
    setVideoAnalysis(null);

    try {
      const formData = new FormData();
      if (file) formData.append("video", file);
      formData.append("profile", JSON.stringify(profile));
      formData.append("skills", JSON.stringify(skills));

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const { text, error } = await res.json();
      if (error) throw new Error(error);
      setVideoAnalysis(text);
    } catch (err) {
      setVideoAnalysis(`Analysis failed: ${err.message || "Check your connection and try again."}`);
    }
    setVideoLoading(false);
  };

  // ── Video-in-Chat ─────────────────────────────────────────────────────────
  const sendVideoToChat = (file) => {
    if (!file) return;
    setPendingVideo(file);
    const playerName = profile.name || "Zeke";
    setChatMessages(prev => [...prev,
      { role: "user", text: `📹 Uploaded: ${file.name}` },
      {
        role: "coach",
        text: `Got the video! Before I start the analysis, help me find ${playerName}.\n\nWhat jersey color and number is he wearing? Any other standout details (bright cleats, hair, height)?\n\nAlso: is this game footage or a training/solo session? Type your answer and hit Send.`,
      },
    ]);
  };

  // ── Pages ─────────────────────────────────────────────────────────────────
  const totalHours = sessions.reduce((s, x) => s + x.duration, 0) / 60;
  const avgScore = sessions.length ? Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length) : 0;
  const daysToGoal = profile.targetYear ? Math.max(0, Math.floor((new Date(`${profile.targetYear}-06-01`) - new Date()) / 86400000)) : 0;

  const targetBySkill = { dribbling: 88, shooting: 85, passing: 87, speed: 90, agility: 88, defending: 80, heading: 78, positioning: 86 };

  const radarData = SKILLS.map(s => [s.label, skills[s.id] || 0, targetBySkill[s.id] || 85]);

  const progressHistory = {
    dribbling: [skills.dribbling],
    shooting: [skills.shooting],
    speed: [skills.speed],
    passing: [skills.passing],
  };

  const streak = (() => {
    if (!sessions.length) return 0;
    const dates = new Set(sessions.map(s => s.date));
    let d = new Date(), count = 0;
    while (dates.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  function DashboardPage() {
    const today = WEEKLY_PLAN[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    return (
      <div>
        {/* Hero */}
        <div className="hero-banner">
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase" }}>Welcome back,</div>
            <div className="hero-name">{profile.name}</div>
            <div className="hero-goal">🎯 {profile.goal}</div>
            <div className="hero-idols">
              {profile.idols.map(idol => (
                <div key={idol} className="idol-chip">
                  <span>⭐</span>
                  <span style={{ fontWeight: 700 }}>Play like {idol}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 64, color: "var(--grass2)", lineHeight: 1 }}>{daysToGoal}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase" }}>Days to CONCACAF Goal</div>
            <div style={{ marginTop: 10 }}><span className="badge badge-green">On Track 🔥</span></div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: "Total Hours", value: totalHours.toFixed(1), unit: "hrs", icon: "⏱️" },
            { label: "Sessions", value: sessions.length, unit: "total", icon: "📋" },
            { label: "Avg Score", value: avgScore, unit: "/100", icon: "🎯" },
            { label: "Current Streak", value: streak, unit: "days", icon: "🔥" },
          ].map(s => (
            <div className="card" key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div className="card-title">{s.label}</div>
              <div className="card-value">{s.value}<span className="card-unit"> {s.unit}</span></div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Radar */}
          <div className="card">
            <div className="card-title">Skill Radar — Current vs Target</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RadarChart data={radarData} size={240} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center", fontSize: 11 }}>
              <span style={{ color: "var(--grass2)" }}>● Current</span>
              <span style={{ color: "var(--gold)", opacity: .7 }}>● Target (CONCACAF ready)</span>
            </div>
          </div>

          {/* Today's Plan */}
          <div className="card">
            <div className="card-title">Today's Training — {today?.day}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 6 }}>{today?.focus}</div>
            <span className="badge badge-red" style={{ marginBottom: 14 }}>{today?.intensity} Intensity · {today?.duration} min</span>
            <div>
              {today?.drills.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <span style={{ color: "var(--grass)", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setPage("video"); notify("Session started! 🔥"); }}>▶ Start Session</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal("addSession")}>+ Log Manually</button>
            </div>
          </div>
        </div>

        {/* Skill progress vs target */}
        <div className="card">
          <div className="card-title">Skill Progress vs CONCACAF Target</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px" }}>
            {SKILLS.map(s => {
              const cur = skills[s.id] || 0;
              const tgt = targetBySkill[s.id] || 85;
              const pct = Math.round((cur / tgt) * 100);
              return (
                <div className="progress-row" key={s.id}>
                  <div className="progress-label">
                    <span>{s.icon} {s.label}</span>
                    <span>{cur} / {tgt}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function TrainingPage() {
    const [tab, setTab] = useState(0);
    const [newSession, setNewSession] = useState({ date: new Date().toISOString().slice(0,10), type: "Dribbling", duration: 45, source: "Manual", notes: "", score: 70 });

    const addSession = async () => {
      const sessionData = { ...newSession, score: parseInt(newSession.score), duration: parseInt(newSession.duration) };
      notify("Training session logged! ✅");
      try {
        const res = await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "addSession", userId, data: sessionData }),
        });
        const result = await res.json();
        setSessions(prev => [...prev, { id: result.session?.id || Date.now(), ...sessionData }]);
      } catch {
        setSessions(prev => [...prev, { id: Date.now(), ...sessionData }]);
      }
    };

    return (
      <div>
        <div className="tabs">
          {["Log Book", "Weekly Plan", "Add Session"].map((t, i) => (
            <div key={t} className={`tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</div>
          ))}
        </div>

        {tab === 0 && (
          <div className="card">
            <div className="card-title">All Training Sessions ({sessions.length})</div>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Duration</th><th>Source</th><th>Score</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {[...sessions].reverse().map(s => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td><span className="badge badge-green">{s.type}</span></td>
                    <td>{s.duration} min</td>
                    <td><span className={`badge ${s.source === "XbotGo" ? "badge-blue" : "badge-gold"}`}>{s.source}</span></td>
                    <td style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: s.score >= 75 ? "var(--grass2)" : "var(--gold)" }}>{s.score}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{s.notes}</td>
                    <td><button style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "2px 6px" }} onClick={() => deleteSession(s.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {WEEKLY_PLAN.map((d, i) => (
              <div className="plan-item" key={i}>
                <div className="plan-item-icon" style={{ background: d.intensity === "High" ? "rgba(244,67,54,.15)" : d.intensity === "Low" ? "rgba(0,188,212,.15)" : "rgba(0,200,83,.15)" }}>
                  {d.intensity === "High" ? "🔥" : d.intensity === "Low" ? "😴" : "⚽"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="plan-item-title">{d.day} — {d.focus}</div>
                    <span className={`badge ${d.intensity === "High" ? "badge-red" : d.intensity === "Low" ? "badge-blue" : "badge-green"}`}>{d.intensity}</span>
                  </div>
                  <div className="plan-item-meta">{d.duration} min · {d.drills.join(" · ")}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 2 && (
          <div className="card" style={{ maxWidth: 480 }}>
            <div className="card-title">Log a Training Session</div>
            {["date", "type", "duration", "source", "score", "notes"].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                {field === "type" ? (
                  <select className="form-input" value={newSession.type} onChange={e => setNewSession(p => ({ ...p, type: e.target.value }))}>
                    {SKILLS.map(s => <option key={s.id}>{s.label}</option>)}
                    <option>Full Session</option><option>Match</option><option>Fitness</option>
                  </select>
                ) : field === "source" ? (
                  <select className="form-input" value={newSession.source} onChange={e => setNewSession(p => ({ ...p, source: e.target.value }))}>
                    <option>Manual</option><option>App</option><option>XbotGo</option><option>Coach Upload</option>
                  </select>
                ) : (
                  <input className="form-input" type={field === "date" ? "date" : "text"} value={newSession[field]} onChange={e => setNewSession(p => ({ ...p, [field]: e.target.value }))} />
                )}
              </div>
            ))}
            <button className="btn btn-primary" onClick={addSession}>✅ Log Session</button>
          </div>
        )}
      </div>
    );
  }

  function VideoPage() {
    return (
      <div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-title">Upload & Analyze Video</div>
            <div style={{ marginBottom: 14, fontSize: 13, color: "var(--muted)" }}>Supports: MP4, MOV, AVI · XbotGo exports · Coach uploads</div>
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>🎥</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>Drop your video here</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>or click to browse · XbotGo compatible</div>
              {uploadedVideo && <div style={{ marginTop: 12, color: "var(--grass2)", fontWeight: 700 }}>📁 {uploadedVideo}</div>}
            </div>
            <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => {
              const f = e.target.files[0];
              if (f) { setUploadedVideo(f.name); analyzeVideo(f); }
            }} />
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>📤 Upload Video</button>
              <button className="btn btn-secondary" onClick={() => analyzeVideo(null)}>🤖 Demo Analysis</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Recording Tips</div>
            <div className="timeline">
              {[
                { t: "Camera Position", s: "Set camera 15–20 yards away at knee height on a tripod or cone", done: true },
                { t: "Full Body Frame", s: "Ensure your full body is visible, especially feet and ball", done: true },
                { t: "Good Lighting", s: "Shoot in daylight or well-lit indoor facility", done: false },
                { t: "XbotGo Setup", s: "Export at 1080p from XbotGo app, use 'training clip' mode", done: false },
                { t: "Multiple Angles", s: "Front + side angle gives best analysis results", done: false },
              ].map((item, i) => (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-dot ${item.done ? "done" : "future"}`} />
                  <div>
                    <div className="timeline-title">{item.t}</div>
                    <div className="timeline-sub">{item.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {videoLoading && (
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 1s linear infinite" }}>⚽</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, letterSpacing: 2 }}>Uploading & analyzing your video...</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Gemini is watching the full clip — this may take 30–60 seconds</div>
          </div>
        )}

        {videoAnalysis && !videoLoading && (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 28 }}>🎯</div>
              <div>
                <div className="card-title" style={{ marginBottom: 2 }}>AI Video Analysis Report</div>
                <div style={{ fontSize: 12, color: "var(--grass2)" }}>📁 {uploadedVideo || "demo_session.mp4"}</div>
              </div>
              <span className="badge badge-green" style={{ marginLeft: "auto" }}>Analysis Complete</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, color: "var(--white)" }}>{videoAnalysis}</div>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setPage("chat"); notify("Opening Coach AI with your analysis..."); }}>💬 Discuss with Coach AI</button>
              <button className="btn btn-secondary btn-sm" onClick={() => notify("Analysis saved to your training log ✅")}>💾 Save to Log</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ProgressPage() {
    return (
      <div>
        {/* Skill trend cards */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {Object.entries(progressHistory).map(([skill, hist]) => {
            const s = SKILLS.find(x => x.id === skill);
            const cur = hist[hist.length - 1];
            const tgt = targetBySkill[skill];
            const pct = Math.round((cur / tgt) * 100);
            return (
              <div className="card" key={skill}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div className="card-title">{s?.icon} {s?.label}</div>
                    <div className="card-value" style={{ fontSize: 36 }}>{cur}<span className="card-unit" style={{ fontSize: 14 }}>/{tgt}</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>To Target</div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: pct >= 80 ? "var(--grass2)" : "var(--gold)" }}>{pct}%</div>
                  </div>
                </div>
                <LineChart data={hist} color={s?.color || "#00e676"} width={280} height={60} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                  <span>Jan</span><span>Feb</span><span>Mar</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full skill breakdown */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Complete Skill Assessment vs CONCACAF U15 Standard</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 40px", marginTop: 6 }}>
            {SKILLS.map(s => {
              const cur = skills[s.id];
              const tgt = targetBySkill[s.id];
              const gap = tgt - cur;
              return (
                <div key={s.id}>
                  <div className="progress-label">
                    <span>{s.icon} {s.label}</span>
                    <span style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>Gap: {gap}</span>
                      <span>{cur}</span>
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${cur}%`, background: s.color }} />
                    </div>
                    <div style={{ position: "absolute", top: 0, left: `${tgt}%`, width: 2, height: 7, background: "var(--gold)", transform: "translateX(-50%)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 11 }}>
            <span>▐ Current level</span>
            <span style={{ color: "var(--gold)" }}>| CONCACAF U15 Target</span>
          </div>
        </div>

        {/* Timeline to goal */}
        <div className="card">
          <div className="card-title">Road to CONCACAF U15 — Milestones</div>
          <div className="timeline">
            {[
              { t: "Phase 1 — Foundation (May–Oct 2026, Age 11)", s: "4x/week, 45 min. Master ball control, first touch, cone dribbling, wall passing. Targets: Dribbling 65 · Passing 65 · Positioning 65 · Speed 70.", done: false },
              { t: "Phase 2 — Technical Development (Nov 2026–Apr 2027, Age 12)", s: "4–5x/week. Shooting technique, 1v1 attacking, creative combinations. Targets: Dribbling 73 · Shooting 70 · Passing 73 · Positioning 73.", done: false },
              { t: "Phase 3 — Competitive Growth (May 2027–Oct 2028, Age 12–13)", s: "5x/week + match day. Join competitive club, enter regional tournaments, work all 8 skills to 78+. Scout exposure begins.", done: false },
              { t: "Phase 4 — Elite Prep (Nov 2028–Jun 2029, Age 13–14)", s: "5–6x/week + tournaments. All skills at CONCACAF target. High-pressure match reps. U15 selection trials.", done: false },
            ].map((item, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-dot future" />
                <div>
                  <div className="timeline-title">{item.t}</div>
                  <div className="timeline-sub">{item.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function CalendarPage() {
    const [selectedDay, setSelectedDay] = useState(null);
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const sessionDays = new Set(sessions.map(s => {
      const d = new Date(s.date);
      if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
      return null;
    }).filter(Boolean));

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const daySessions = selectedDay ? sessions.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    }) : [];

    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    return (
      <div className="grid-2">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>{MONTHS[month]} {year}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCalMonth(new Date(year, month - 1, 1))}>◀</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setCalMonth(new Date(year, month + 1, 1))}>▶</button>
            </div>
          </div>
          <div className="cal-grid">
            {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} className="cal-header-day">{d}</div>)}
            {cells.map((d, i) => (
              <div key={i} className={`cal-cell ${!d ? "other-month" : ""} ${d === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? "today" : ""} ${d && sessionDays.has(d) ? "has-training" : ""}`}
                onClick={() => d && setSelectedDay(d)}>
                {d || ""}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 11, color: "var(--muted)" }}>
            <span>🟢 Training logged</span>
            <span style={{ color: "var(--grass2)" }}>◼ Today</span>
          </div>
        </div>

        <div className="card">
          {selectedDay ? (
            <>
              <div className="card-title">{MONTHS[month]} {selectedDay}, {year}</div>
              {daySessions.length > 0 ? daySessions.map(s => (
                <div key={s.id} className="plan-item">
                  <div className="plan-item-icon" style={{ background: "rgba(0,200,83,.1)" }}>⚽</div>
                  <div>
                    <div className="plan-item-title">{s.type}</div>
                    <div className="plan-item-meta">{s.duration} min · Score: {s.score} · {s.source}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{s.notes}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>No sessions logged for this day.</div>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setModal("addSession")} style={{ marginTop: 10 }}>+ Add Session</button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: "var(--muted)", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
              <div>Select a day to view or add sessions</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function PlanPage() {
    const ROADMAP = [
      {
        phase: "Phase 1", name: "Foundation", period: "May–Oct 2026", age: "Age 11",
        color: "var(--grass)",
        summary: "Build the technical base every elite #10 needs. Ball mastery, first touch, basic dribbling patterns, and positional awareness.",
        frequency: "4x/week · 45–50 min sessions",
        skillTargets: "Dribbling 65 · Passing 65 · Positioning 65 · Speed 70",
        drills: [
          { icon: "⚡", title: "Cone Weave – Tight Control", detail: "10 cones, 1 yd apart · 5 sets each foot · Focus on soft touches", skill: "Dribbling", intensity: "Medium" },
          { icon: "🔄", title: "Wall Pass – Both Feet", detail: "50 reps per foot against wall · Plant foot pointed at target", skill: "Passing", intensity: "Medium" },
          { icon: "📍", title: "Shadow Positioning Runs", detail: "Move without ball into pockets of space · 10 min w/ coach/parent calling directions", skill: "Positioning", intensity: "Low" },
          { icon: "💨", title: "Dribble & Sprint (20 yds)", detail: "Dribble 10 yds, explode last 10 yds · 8 sets · 45 sec rest", skill: "Speed", intensity: "High" },
        ],
      },
      {
        phase: "Phase 2", name: "Technical Development", period: "Nov 2026–Apr 2027", age: "Age 12",
        color: "var(--gold)",
        summary: "Add shooting power and accuracy, expand passing range, develop 1v1 attacking ability. Establish yourself as a creative threat in the #10 role.",
        frequency: "4–5x/week · 50 min sessions",
        skillTargets: "Dribbling 73 · Shooting 70 · Passing 73 · Positioning 73",
        drills: [
          { icon: "🎯", title: "Driven Shot – 18 Yard Box", detail: "15 shots per session · Lock ankle, hit through center · Track success rate", skill: "Shooting", intensity: "Medium" },
          { icon: "⚡", title: "Cruyff Turn + Explosive Dribble", detail: "Set up 5 defenders (cones) · Beat each with turn, burst past", skill: "Dribbling", intensity: "High" },
          { icon: "🔄", title: "Through-Ball Timing Drill", detail: "Pass between two moving targets 25 yds apart · Weight and timing", skill: "Passing", intensity: "Medium" },
          { icon: "📍", title: "Half-Space Attack Runs", detail: "Attack from deep left/right half-spaces · Receive, turn, shoot – 10 reps each side", skill: "Positioning", intensity: "High" },
        ],
      },
      {
        phase: "Phase 3", name: "Competitive Growth", period: "May 2027–Oct 2028", age: "Age 12–13",
        color: "var(--accent)",
        summary: "Enter competitive club soccer and regional tournaments. Work all 8 skill areas to 78+. Build match fitness, decision-making under pressure, and scout readiness.",
        frequency: "5x/week · 55–60 min · + match day",
        skillTargets: "All 8 skills at 78+ · Competitive match experience",
        drills: [
          { icon: "🛡️", title: "Press & Win It Back", detail: "Pressing from the front as #10 · 2v2 pressing box (20×20 yds) · 5 min rounds", skill: "Defending", intensity: "High" },
          { icon: "🧠", title: "Heading Technique", detail: "15 headed clearances + 10 attacking headers per session · Eyes open, attack the ball", skill: "Heading", intensity: "Medium" },
          { icon: "💨", title: "Agility Ladder Complex", detail: "6 ladder patterns · 3 sets each · Rest 60 sec between patterns", skill: "Agility", intensity: "High" },
          { icon: "⚽", title: "11v11 Positional Scrimmage", detail: "Full-sided game with positional instructions for #10 · Focus on finding pockets", skill: "Positioning", intensity: "High" },
        ],
      },
      {
        phase: "Phase 4", name: "Elite Prep", period: "Nov 2028–Jun 2029", age: "Age 13–14",
        color: "#e040fb",
        summary: "All skills must reach CONCACAF U15 target levels. High-pressure tournament play, leadership in the team, and preparation for U15 selection trials.",
        frequency: "5–6x/week · 60+ min · + tournament weekends",
        skillTargets: "CONCACAF targets: Dribbling 88 · Shooting 85 · Passing 87 · Speed 90 · Agility 88 · Defending 80 · Heading 78 · Positioning 86",
        drills: [
          { icon: "🎯", title: "Free Kick Curler – Both Feet", detail: "20 shots from 22 yds with curve · Left and right foot · Must clear wall", skill: "Shooting", intensity: "Medium" },
          { icon: "⚡", title: "1v1 Pressure Dribble Circuit", detail: "Beat live defender in tight space · 6 cones, defender starts 2 yds away · 10 reps", skill: "Dribbling", intensity: "High" },
          { icon: "💨", title: "High-Speed Agility Combine", detail: "Pro-agility (5-10-5) + 40-yd dash · Track & improve personal bests each week", skill: "Speed", intensity: "High" },
          { icon: "📍", title: "Elite Positioning – Rondo 5v2", detail: "5v2 in 15×15 yd box · Max 2 touches · Win ball back within 5 passes", skill: "Passing", intensity: "High" },
        ],
      },
    ];

    const [activePhase, setActivePhase] = useState(0);
    const phase = ROADMAP[activePhase];

    return (
      <div>
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div className="card-title">3-Year Development Roadmap</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>Zeke Schmid · Age 11 · Attacking Mid · Goal: CONCACAF U15 Cup 2029</div>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => { setPage("share"); notify("Opening share options..."); }}>📤 Share with Coach</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {ROADMAP.map((p, i) => (
              <div key={p.phase} onClick={() => setActivePhase(i)} style={{ background: activePhase === i ? "var(--pitch2)" : "var(--pitch3)", border: `1px solid ${activePhase === i ? p.color : "var(--border)"}`, borderRadius: 10, padding: 14, borderTop: `3px solid ${p.color}`, cursor: "pointer" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginBottom: 3 }}>{p.phase}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", margin: "3px 0" }}>{p.period}</div>
                <div style={{ fontSize: 10, color: p.color }}>{p.age}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18, borderTop: `3px solid ${phase.color}` }}>
          <div className="card-title" style={{ color: phase.color }}>{phase.phase}: {phase.name} — {phase.period}</div>
          <div style={{ fontSize: 13, color: "var(--white)", marginBottom: 12, lineHeight: 1.6 }}>{phase.summary}</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
            <span className="badge badge-green">{phase.frequency}</span>
            <span className="badge badge-gold" style={{ fontSize: 10 }}>Targets: {phase.skillTargets}</span>
          </div>
          <div className="card-title" style={{ marginTop: 4, fontSize: 12 }}>Key Drills This Phase</div>
          {phase.drills.map((d, i) => (
            <div className="plan-item" key={i}>
              <div className="plan-item-icon" style={{ background: "rgba(0,200,83,.1)", fontSize: 22 }}>{d.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="plan-item-title">{d.title}</div>
                  <span className={`badge ${d.intensity === "High" ? "badge-red" : d.intensity === "Low" ? "badge-blue" : "badge-green"}`}>{d.intensity}</span>
                </div>
                <div className="plan-item-meta">{d.detail}</div>
                <span className="badge badge-blue" style={{ marginTop: 6, fontSize: 9 }}>{d.skill}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

// ChatPage is defined outside SoccerApp (see top of file)

  function HighlightsPage() {
    const clips = [];
    return (
      <div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-title">Highlight Videos</div>
            {clips.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "28px 0 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
                No highlights yet. Upload your first training video to start building your reel!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {clips.map(c => (
                  <div className="hl-card" key={c.name}>
                    <div className="hl-thumb">{c.icon}</div>
                    <div className="hl-info">
                      <div className="hl-name">{c.name}</div>
                      <div className="hl-meta">{c.date} · {c.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => notify("🎬 Creating highlight reel...")}>✨ Create Highlight Reel</button>
              <button className="btn btn-secondary btn-sm" onClick={() => notify("📤 Share link copied!")}>📤 Share</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">My Player CV</div>
            <div style={{ background: "var(--pitch3)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: "var(--grass2)", letterSpacing: 2 }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Age {profile.age} · {profile.position} · {profile.club}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12, marginBottom: 10 }}>
                <span>📏 Height: {profile.height}</span>
                <span>⚖️ Weight: {profile.weight}</span>
                <span>⚡ Speed: {skills.speed}/100</span>
                <span>🎯 Shooting: {skills.shooting}/100</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>GOAL</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{profile.goal}</div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>SESSIONS: {sessions.length} · HOURS: {totalHours.toFixed(1)}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gold btn-sm" onClick={() => notify("📄 CV generated as PDF!")}>📄 Generate CV PDF</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal("shareModal")}>🔗 Share CV</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SharePage() {
    const [emailTo, setEmailTo] = useState(profile.coachEmail || "");

    const buildReportText = () => {
      const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const skillLines = SKILLS.map(s => {
        const cur = skills[s.id] || 0;
        const tgt = targetBySkill[s.id];
        const gap = tgt - cur;
        return `  ${s.label.padEnd(12)}: ${String(cur).padStart(3)}/100  (target ${tgt}, gap ${gap > 0 ? "+" + gap : gap})`;
      }).join("\n");
      const recentSessions = sessions.length
        ? [...sessions].reverse().slice(0, 10).map(s =>
            `  ${s.date}  ${s.type.padEnd(14)}  ${String(s.duration).padStart(3)} min  Score: ${s.score}${s.notes ? "  — " + s.notes : ""}`
          ).join("\n")
        : "  No sessions logged yet.";
      const totalHrs = (sessions.reduce((a, s) => a + s.duration, 0) / 60).toFixed(1);
      const avgSc = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
      const daysLeft = profile.targetYear ? Math.max(0, Math.floor((new Date(`${profile.targetYear}-06-01`) - new Date()) / 86400000)) : "—";

      return `TRAINING REPORT — ${profile.name}
Generated: ${date}
${"─".repeat(50)}

PLAYER PROFILE
  Name        : ${profile.name}
  Age         : ${profile.age}
  Position    : ${profile.position}
  Club        : ${profile.club || "—"}
  Goal        : ${profile.goal}
  Target Year : ${profile.targetYear}  (${daysLeft} days to go)

TRAINING SUMMARY
  Total Sessions : ${sessions.length}
  Total Hours    : ${totalHrs} hrs
  Average Score  : ${avgSc}/100

CURRENT SKILL SCORES vs CONCACAF U15 TARGET
${skillLines}

RECENT SESSIONS (last 10)
${recentSessions}

${"─".repeat(50)}
Sent via My Path — Zeke's Soccer Training App`;
    };

    const sendEmail = () => {
      const to = emailTo.trim();
      if (!to) { notify("Enter a coach email address first"); return; }
      const subject = `Training Report — ${profile.name} — ${new Date().toLocaleDateString()}`;
      const body = buildReportText();
      window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      notify("📧 Opening your email client...");
    };

    const copyLink = () => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => notify("🔗 App link copied to clipboard!"))
        .catch(() => notify("Copy failed — paste this URL manually: " + window.location.href));
    };

    const exportPrint = (title) => {
      const prev = document.title;
      document.title = `${title} — ${profile.name} — ${new Date().toLocaleDateString()}`;
      window.print();
      document.title = prev;
    };

    const downloadText = () => {
      const text = buildReportText();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Training-Report-${profile.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      notify("📄 Report downloaded!");
    };

    const exportOptions = [
      {
        label: "Training Summary PDF",
        desc: "Full session log, skill scores, progress — print or save as PDF",
        icon: "📄",
        action: () => exportPrint("Training Summary"),
      },
      {
        label: "Download Report (.txt)",
        desc: "Plain-text report you can paste into any email or document",
        icon: "📝",
        action: downloadText,
      },
      {
        label: "Player CV",
        desc: "Professional player profile — print or save as PDF",
        icon: "👤",
        action: () => exportPrint("Player CV"),
      },
      {
        label: "Progress Report",
        desc: "Skill scores and development timeline — print or save as PDF",
        icon: "📈",
        action: () => exportPrint("Progress Report"),
      },
    ];

    return (
      <div style={{ maxWidth: 600 }}>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-title">Send Report to Coach</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            Generates a full report with your profile, skill scores, and session history and opens it in your email client ready to send.
          </div>
          <div className="form-group">
            <label className="form-label">Coach's Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="coach@example.com"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={sendEmail}>📧 Send Report</button>
            <button className="btn btn-secondary" onClick={copyLink}>🔗 Copy App Link</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-title">Export Options</div>
          {exportOptions.map(e => (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <span style={{ fontSize: 24 }}>{e.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{e.desc}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={e.action}>Export</button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Report Preview</div>
          <pre style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0, fontFamily: "monospace" }}>
            {buildReportText()}
          </pre>
        </div>
      </div>
    );
  }

  function SettingsPage() {
    const [form, setForm] = useState({ ...profile });
    const [skillForm, setSkillForm] = useState({ ...skills });
    const fields = [
      { key: "name", label: "Full Name" },
      { key: "age", label: "Age" },
      { key: "position", label: "Position" },
      { key: "height", label: "Height (ft/in)" },
      { key: "weight", label: "Weight (lbs)" },
      { key: "club", label: "Club / Team" },
      { key: "goal", label: "Main Goal" },
      { key: "targetYear", label: "Goal Target Year" },
      { key: "coachEmail", label: "Coach Email" },
    ];
    return (
      <div style={{ maxWidth: 520 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">My Profile</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--grass), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>⚽</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: "var(--white)", letterSpacing: 2 }}>{profile.name || "Your Name"}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{profile.position || "Position"} · Age {profile.age || "?"} · {profile.club || "Club"}</div>
            </div>
          </div>
          {fields.map(f => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input className="form-input" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Player Idols</label>
            <input className="form-input" value={form.idols?.join(", ")} onChange={e => setForm(p => ({ ...p, idols: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }))} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setProfile(form);
            notify("Profile saved ✅");
            dbPost("saveProfile", form);
          }}>Save Profile</button>
        </div>

        <div className="card">
          <div className="card-title">Skill Scores (0–100)</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Set your current skill levels to track progress over time.</div>
          {SKILLS.map(s => (
            <div className="form-group" key={s.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>{s.icon} {s.label}</label>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: s.color }}>{skillForm[s.id]}</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={skillForm[s.id]}
                onChange={e => setSkillForm(p => ({ ...p, [s.id]: parseInt(e.target.value) }))}
                style={{ width: "100%", accentColor: s.color }}
              />
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => {
            setSkills(skillForm);
            notify("Skills saved ✅");
            dbPost("saveSkills", skillForm);
          }}>Save Skills</button>
        </div>
      </div>
    );
  }

  // ── Add Session Modal ──────────────────────────────────────────────────────
  function AddSessionModal() {
    const [ns, setNs] = useState({ date: new Date().toISOString().slice(0,10), type: "Dribbling", duration: 45, source: "Manual", notes: "", score: 70 });
    return (
      <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title">Log Training Session</div>
          {["date","type","duration","source","notes","score"].map(f => (
            <div className="form-group" key={f}>
              <label className="form-label">{f}</label>
              {f === "type" ? (
                <select className="form-input" value={ns.type} onChange={e => setNs(p => ({ ...p, type: e.target.value }))}>
                  {SKILLS.map(s => <option key={s.id}>{s.label}</option>)}
                  <option>Full Session</option><option>Match</option>
                </select>
              ) : f === "source" ? (
                <select className="form-input" value={ns.source} onChange={e => setNs(p => ({ ...p, source: e.target.value }))}>
                  <option>Manual</option><option>App</option><option>XbotGo</option><option>Coach Upload</option>
                </select>
              ) : (
                <input className="form-input" type={f === "date" ? "date" : "text"} value={ns[f]} onChange={e => setNs(p => ({ ...p, [f]: e.target.value }))} />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={async () => {
              const sessionData = { ...ns, score: parseInt(ns.score), duration: parseInt(ns.duration) };
              setModal(null);
              notify("Session logged! ✅");
              try {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "addSession", userId, data: sessionData }),
                });
                const result = await res.json();
                setSessions(prev => [...prev, { id: result.session?.id || Date.now(), ...sessionData }]);
              } catch {
                setSessions(prev => [...prev, { id: Date.now(), ...sessionData }]);
              }
            }}>✅ Save Session</button>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const PAGES = {
    dashboard: { title: "Dashboard", sub: "Your daily overview & quick stats", comp: <DashboardPage /> },
    training: { title: "Training Log", sub: "All sessions, weekly plan, manual entry", comp: <TrainingPage /> },
    video: { title: "Video Analysis", sub: "Upload & get AI-powered technique feedback", comp: <VideoPage /> },
    progress: { title: "My Progress", sub: "Skill development vs CONCACAF target", comp: <ProgressPage /> },
    calendar: { title: "Calendar", sub: "View & schedule all training sessions", comp: <CalendarPage /> },
    plan: { title: "Training Plan", sub: "AI-personalized path to your goals", comp: <PlanPage /> },
    chat: { title: "Coach AI", sub: "Your personal AI coaching assistant", comp: <ChatPage chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading} chatLoadingMsg={chatLoadingMsg} sendChat={sendChat} fileRef={chatFileRef} /> },
    highlights: { title: "Highlights & CV", sub: "Create and share your player profile", comp: <HighlightsPage /> },
    share: { title: "Share & Export", sub: "Send reports and highlights to coaches & scouts", comp: <SharePage /> },
    settings: { title: "My Profile", sub: "Update your details, goals & preferences", comp: <SettingsPage /> },
  };

  const sections = [...new Set(NAV.map(n => n.section))];

  if (!userId || dbLoading) {
    return <LoginScreen onLogin={loadFromDb} loading={dbLoading} />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">⚽</span>
          <div>
            <div className="sidebar-logo-text">My Path</div>
          </div>
        </div>
        <div className="sidebar-nav">
          {sections.map(sec => (
            <div key={sec}>
              <div className="nav-section">{sec}</div>
              {NAV.filter(n => n.section === sec).map(n => (
                <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                  <span className="icon">{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)" }}>
          <div style={{ fontWeight: 700, color: "var(--white)", fontSize: 13 }}>{profile.name || "My Profile"}</div>
          <div>{profile.club || <span style={{ opacity: 0.5 }}>{userId}</span>}</div>
          <div style={{ marginTop: 4 }}><span className="badge badge-green" style={{ fontSize: 9 }}>🎯 {daysToGoal}d to goal</span></div>
          <button
            style={{ marginTop: 10, background: "none", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 10, padding: "4px 10px", borderRadius: 6, width: "100%" }}
            onClick={() => {
              ["zeke_user_id", "zeke_profile", "zeke_skills", "zeke_sessions", "zeke_data_version"].forEach(k => localStorage.removeItem(k));
              setUserId(null);
              setProfile(DEFAULT_PROFILE);
              setSkills(DEFAULT_SKILLS);
              setSessions([]);
            }}
          >Sign out</button>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{PAGES[page]?.title}</div>
            <div className="page-sub">{PAGES[page]?.sub}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal("addSession")}>+ Log Session</button>
            <button className="btn btn-primary btn-sm" onClick={() => setPage("chat")}>💬 Ask Coach</button>
          </div>
        </div>
        <div className="page-body">
          {PAGES[page]?.comp}
        </div>
      </main>

      {/* Modals */}
      {modal === "addSession" && <AddSessionModal />}
      {modal === "shareModal" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Share Your CV</div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--muted)" }}>Share your player profile with coaches, scouts, and teams.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => { setModal(null); notify("📧 CV emailed to coach!"); }}>📧 Email to Coach</button>
              <button className="btn btn-secondary" onClick={() => { setModal(null); notify("🔗 CV link copied!"); }}>🔗 Copy Share Link</button>
              <button className="btn btn-gold" onClick={() => { setModal(null); notify("📱 Shared to social media!"); }}>📱 Share on Social</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat video input — always mounted so chatFileRef is never null */}
      <input
        ref={chatFileRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files[0]; e.target.value = ""; if (f) sendVideoToChat(f); }}
      />

      {/* Notification */}
      {notification && <div className="notif">{notification}</div>}
    </div>
  );
}
