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

const SAMPLE_SESSIONS = [
  { id: 1, date: "2025-02-10", type: "Dribbling", duration: 45, source: "App", notes: "Cone drills 5 sets", score: 78 },
  { id: 2, date: "2025-02-12", type: "Shooting", duration: 30, source: "Manual", notes: "Free kicks practice", score: 71 },
  { id: 3, date: "2025-02-14", type: "Speed", duration: 60, source: "App", notes: "Sprint intervals x10", score: 82 },
  { id: 4, date: "2025-02-17", type: "Agility", duration: 40, source: "XbotGo", notes: "Ladder drills uploaded", score: 75 },
  { id: 5, date: "2025-02-20", type: "Passing", duration: 35, source: "Manual", notes: "Wall passes", score: 68 },
  { id: 6, date: "2025-02-22", type: "Full Session", duration: 90, source: "App", notes: "Match simulation", score: 80 },
  { id: 7, date: "2025-02-26", type: "Shooting", duration: 45, source: "XbotGo", notes: "Penalty & long-range", score: 77 },
  { id: 8, date: "2025-03-01", type: "Dribbling", duration: 50, source: "App", notes: "1v1 scenarios", score: 83 },
];

const WEEKLY_PLAN = [
  { day: "Mon", focus: "Dribbling & Ball Control", drills: ["Figure-8 cones", "Inside/outside touch", "Messi turn drill"], duration: 45, intensity: "Medium" },
  { day: "Tue", focus: "Speed & Agility", drills: ["Sprint ladders", "Shuttle runs (20 yds)", "Explosive starts"], duration: 40, intensity: "High" },
  { day: "Wed", focus: "Shooting Technique", drills: ["Driven shots (18 yd box)", "Curled free kicks (Beckham drill)", "1-touch finishing"], duration: 50, intensity: "Medium" },
  { day: "Thu", focus: "Rest / Light Recovery", drills: ["Yoga & stretching", "Light juggling"], duration: 20, intensity: "Low" },
  { day: "Fri", focus: "Passing & Vision", drills: ["Rondo 4v2", "Long-range switch passes", "Through-ball timing"], duration: 45, intensity: "Medium" },
  { day: "Sat", focus: "Full Match Intensity", drills: ["Scrimmage or match", "Position-specific drills"], duration: 90, intensity: "High" },
  { day: "Sun", focus: "Rest Day", drills: ["Light stretching only"], duration: 15, intensity: "Low" },
];

const CHAT_INIT = [
  { role: "coach", text: "Hola! I'm Coach AI — your personal soccer mentor inspired by the greats like Messi and Beckham. I've analyzed your recent sessions and I'm here to guide you every step toward that CONCACAF U15 goal. What's on your mind today?" },
];

const DEFAULT_PROFILE = {
  name: "Alex Rivera", age: 11, position: "Midfielder",
  height: "4'8\"", weight: "88 lbs",
  goal: "Play in CONCACAF U15 Cup in 3 years",
  targetYear: 2028, idols: ["Messi", "Beckham"],
  club: "FC Stars U12", coachEmail: "coach@fcstars.com",
};

const DEFAULT_SKILLS = {
  dribbling: 68, shooting: 62, passing: 71, speed: 74,
  agility: 70, defending: 55, heading: 48, positioning: 65,
};

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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function SoccerApp() {
  const [page, setPage] = useState("dashboard");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [sessions, setSessions] = useState(SAMPLE_SESSIONS);
  const [chatMessages, setChatMessages] = useState(CHAT_INIT);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [modal, setModal] = useState(null); // "addSession" | "editProfile" | "shareModal"
  const [activeTab, setActiveTab] = useState(0);
  const [calMonth, setCalMonth] = useState(new Date(2025, 2, 1));
  const [videoAnalysis, setVideoAnalysis] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const fileRef = useRef();

  // ── localStorage persistence ────────────────────────────────────────────
  useEffect(() => {
    try {
      const p = localStorage.getItem("zeke_profile");
      if (p) setProfile(JSON.parse(p));
      const sk = localStorage.getItem("zeke_skills");
      if (sk) setSkills(JSON.parse(sk));
      const se = localStorage.getItem("zeke_sessions");
      if (se) setSessions(JSON.parse(se));
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem("zeke_profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem("zeke_skills", JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem("zeke_sessions", JSON.stringify(sessions)); }, [sessions]);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ── API Chat ──────────────────────────────────────────────────────────────
  const sendChat = async (msg) => {
    if (!msg.trim()) return;
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: newHistory.map(m => ({
            role: m.role === "coach" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });
      const { text } = await res.json();
      setChatMessages([...newHistory, { role: "coach", text: text || "Let's keep grinding — you've got this!" }]);
    } catch {
      setChatMessages([...newHistory, { role: "coach", text: "Connection issue — but remember: Messi never let obstacles stop him either. Keep going!" }]);
    }
    setChatLoading(false);
  };

  // ── Video Analysis ────────────────────────────────────────────────────────
  const analyzeVideo = async (filename) => {
    setVideoLoading(true);
    setVideoAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, profile, skills }),
      });
      const { text } = await res.json();
      setVideoAnalysis(text);
    } catch {
      setVideoAnalysis("Analysis complete. Upload a video to see detailed AI feedback on your technique, speed, and positioning.");
    }
    setVideoLoading(false);
  };

  // ── Pages ─────────────────────────────────────────────────────────────────
  const totalHours = sessions.reduce((s, x) => s + x.duration, 0) / 60;
  const avgScore = Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length);
  const daysToGoal = Math.max(0, Math.floor((new Date(`${profile.targetYear}-06-01`) - new Date()) / 86400000));

  const radarData = SKILLS.map(s => [s.label, skills[s.id] || 50, Math.min(100, (skills[s.id] || 50) + 20)]);

  const progressHistory = {
    dribbling: [55, 58, 60, 63, 65, 68],
    shooting: [50, 52, 55, 58, 60, 62],
    speed: [65, 67, 70, 71, 73, 74],
    passing: [60, 63, 65, 68, 70, 71],
  };

  const targetBySkill = { dribbling: 88, shooting: 85, passing: 87, speed: 90, agility: 88, defending: 80, heading: 78, positioning: 86 };

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
            { label: "Current Streak", value: 5, unit: "days", icon: "🔥" },
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
              const cur = skills[s.id] || 50;
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

    const addSession = () => {
      setSessions(prev => [...prev, { id: Date.now(), ...newSession, score: parseInt(newSession.score), duration: parseInt(newSession.duration) }]);
      notify("Training session logged! ✅");
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
              <thead><tr><th>Date</th><th>Type</th><th>Duration</th><th>Source</th><th>Score</th><th>Notes</th></tr></thead>
              <tbody>
                {[...sessions].reverse().map(s => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td><span className="badge badge-green">{s.type}</span></td>
                    <td>{s.duration} min</td>
                    <td><span className={`badge ${s.source === "XbotGo" ? "badge-blue" : "badge-gold"}`}>{s.source}</span></td>
                    <td style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: s.score >= 75 ? "var(--grass2)" : "var(--gold)" }}>{s.score}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{s.notes}</td>
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
              if (f) { setUploadedVideo(f.name); analyzeVideo(f.name); }
            }} />
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>📤 Upload Video</button>
              <button className="btn btn-secondary" onClick={() => analyzeVideo("demo_xbotgo_session.mp4")}>🤖 Demo Analysis</button>
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
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, letterSpacing: 2 }}>Analyzing your video...</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>AI is studying your technique, speed, and positioning</div>
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
              { t: "Foundation (Now–6mo)", s: "Build dribbling to 78, shooting to 72, speed to 80. Core fitness base. 4x/week training.", done: false },
              { t: "Development (6–18mo)", s: "Reach 85+ in top 3 skills. Join competitive club. Enter regional tournaments.", done: false },
              { t: "Pre-Elite (18–30mo)", s: "All core skills at 80+. Scout exposure. Tryouts for U13/U14 competitive programs.", done: false },
              { t: "CONCACAF Ready (30–36mo)", s: "All skills at target levels. Tournament experience. Ready for U15 selection trials.", done: false },
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
    return (
      <div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div className="card-title">Personalized Training Plan</div>
              <div style={{ fontSize: 14, color: "var(--white)", fontWeight: 700 }}>12-Week Block — Foundation Phase</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>Adapted to {profile.name} · Age {profile.age} · Targeting CONCACAF U15 in {Math.ceil(daysToGoal / 365 * 10) / 10} years</div>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => { setPage("share"); notify("Opening share options..."); }}>📤 Share with Coach</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { phase: "Phase 1", name: "Foundation", weeks: "Weeks 1–4", focus: "Ball control, first touch, basic dribbling", color: "var(--grass)" },
              { phase: "Phase 2", name: "Development", weeks: "Weeks 5–8", focus: "Shooting, passing combinations, speed", color: "var(--gold)" },
              { phase: "Phase 3", name: "Match Prep", weeks: "Weeks 9–12", focus: "Positional play, game situations, 1v1", color: "var(--accent)" },
            ].map(p => (
              <div key={p.phase} style={{ background: "var(--pitch3)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, borderTop: `3px solid ${p.color}` }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginBottom: 4 }}>{p.phase}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0" }}>{p.weeks}</div>
                <div style={{ fontSize: 12, color: p.color }}>{p.focus}</div>
              </div>
            ))}
          </div>

          <div className="card-title" style={{ marginTop: 8 }}>This Week's Drills — Messi & Beckham Inspired</div>
          {[
            { icon: "⚡", title: "Messi Cone Dribble Circuit", detail: "7 cones set 2 yds apart · 5 sets · Rest 90 sec", skill: "Dribbling", intensity: "High" },
            { icon: "🎯", title: "Beckham Free Kick Technique", detail: "15 shots from 22 yds, both feet · Focus on curve", skill: "Shooting", intensity: "Medium" },
            { icon: "💨", title: "20-Yard Sprint Intervals", detail: "10x 20-yd sprints with 30 sec rest · Track best time", skill: "Speed", intensity: "High" },
            { icon: "🔄", title: "Rondo 4v2 Possession", detail: "10-min session · First touch only · Limit: 2 touches", skill: "Passing", intensity: "Medium" },
          ].map((d, i) => (
            <div className="plan-item" key={i}>
              <div className="plan-item-icon" style={{ background: "rgba(0,200,83,.1)", fontSize: 22 }}>{d.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="plan-item-title">{d.title}</div>
                  <span className={`badge ${d.intensity === "High" ? "badge-red" : "badge-green"}`}>{d.intensity}</span>
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

  function ChatPage() {
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
                  <div className={`chat-bubble ${m.role}`}>{m.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg">
                  <div className="chat-avatar coach">🧑‍🏫</div>
                  <div className="chat-bubble coach" style={{ color: "var(--muted)" }}>Coach is thinking...</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input className="chat-input" placeholder="Ask your coach anything... or upload a video to analyze" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat(chatInput)} />
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

  function HighlightsPage() {
    const clips = [
      { name: "Dribbling Showcase", date: "Feb 2025", duration: "0:45", icon: "⚡" },
      { name: "Best Goals Reel", date: "Jan 2025", duration: "1:20", icon: "🎯" },
      { name: "Speed & Agility", date: "Feb 2025", duration: "0:55", icon: "💨" },
    ];
    return (
      <div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-title">Highlight Videos</div>
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
    return (
      <div style={{ maxWidth: 600 }}>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-title">Share with Your Coach</div>
          <div className="form-group">
            <label className="form-label">Coach's Email</label>
            <input className="form-input" type="email" defaultValue={profile.coachEmail} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => notify("📧 Training report sent to coach!")}>📧 Send Full Report</button>
            <button className="btn btn-secondary" onClick={() => notify("🔗 Share link copied!")}>🔗 Copy Share Link</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-title">Export Options</div>
          {[
            { label: "Training Summary PDF", desc: "Full session log, skill scores, progress charts", icon: "📄" },
            { label: "Player CV", desc: "Professional player profile for scouts/coaches", icon: "👤" },
            { label: "Highlight Reel", desc: "Best clips compiled into shareable video", icon: "🎬" },
            { label: "Progress Report", desc: "Week-by-week skill development with graphs", icon: "📈" },
          ].map(e => (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <span style={{ fontSize: 24 }}>{e.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{e.desc}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => notify(`📤 ${e.label} exported!`)}>Export</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function SettingsPage() {
    const [form, setForm] = useState({ ...profile });
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
        <div className="card">
          <div className="card-title">My Profile</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--grass), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>⚽</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: "var(--white)", letterSpacing: 2 }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{profile.position} · Age {profile.age} · {profile.club}</div>
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
            <input className="form-input" value={form.idols?.join(", ")} onChange={e => setForm(p => ({ ...p, idols: e.target.value.split(",").map(x => x.trim()) }))} />
          </div>
          <button className="btn btn-primary" onClick={() => { setProfile(form); notify("Profile saved ✅"); }}>Save Profile</button>
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
            <button className="btn btn-primary" onClick={() => { setSessions(prev => [...prev, { id: Date.now(), ...ns, score: parseInt(ns.score), duration: parseInt(ns.duration) }]); setModal(null); notify("Session logged! ✅"); }}>✅ Save Session</button>
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
    chat: { title: "Coach AI", sub: "Your personal AI coaching assistant", comp: <ChatPage /> },
    highlights: { title: "Highlights & CV", sub: "Create and share your player profile", comp: <HighlightsPage /> },
    share: { title: "Share & Export", sub: "Send reports and highlights to coaches & scouts", comp: <SharePage /> },
    settings: { title: "My Profile", sub: "Update your details, goals & preferences", comp: <SettingsPage /> },
  };

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">⚽</span>
          <div>
            <div className="sidebar-logo-text">EliteFC</div>
            <div className="sidebar-logo-sub">Training</div>
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
          <div style={{ fontWeight: 700, color: "var(--white)", fontSize: 13 }}>{profile.name}</div>
          <div>{profile.club}</div>
          <div style={{ marginTop: 4 }}><span className="badge badge-green" style={{ fontSize: 9 }}>🎯 {daysToGoal}d to goal</span></div>
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

      {/* Notification */}
      {notification && <div className="notif">{notification}</div>}
    </div>
  );
}
