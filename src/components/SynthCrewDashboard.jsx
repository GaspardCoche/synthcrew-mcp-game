import { useState, useEffect, useRef } from "react";

const AGENTS = [
  { id: 1, name: "SENTINEL", role: "Data Ops", avatar: "🛡️", level: 12, xp: 78, mcps: ["Zendesk", "HubSpot"], status: "active", color: "#00f0ff", missions: 147, successRate: 96 },
  { id: 2, name: "CIPHER", role: "Analyst", avatar: "🔮", level: 8, xp: 45, mcps: ["PostgreSQL", "BigQuery"], status: "active", color: "#a855f7", missions: 89, successRate: 94 },
  { id: 3, name: "ARCHIVIST", role: "Writer", avatar: "📜", level: 15, xp: 92, mcps: ["Notion", "Google Docs"], status: "idle", color: "#f59e0b", missions: 203, successRate: 98 },
  { id: 4, name: "HERALD", role: "Communicator", avatar: "📡", level: 6, xp: 33, mcps: ["Slack", "Gmail"], status: "queued", color: "#22c55e", missions: 56, successRate: 91 },
  { id: 5, name: "PHANTOM", role: "Scraper", avatar: "👻", level: 10, xp: 61, mcps: ["Web Search", "LinkedIn"], status: "idle", color: "#ef4444", missions: 112, successRate: 88 },
  { id: 6, name: "FORGE", role: "Developer", avatar: "⚒️", level: 19, xp: 87, mcps: ["GitHub", "Jira", "Linear"], status: "sleeping", color: "#ec4899", missions: 267, successRate: 97 },
];

const MISSION_LOG = [
  { time: "14:32:07", agent: "SENTINEL", action: "Fetching 50 latest Zendesk tickets...", type: "tool_call" },
  { time: "14:32:12", agent: "SENTINEL", action: "Retrieved 50 tickets. Categorizing by urgency...", type: "output" },
  { time: "14:32:15", agent: "CIPHER", action: "Analyzing sentiment distribution across tickets...", type: "thinking" },
  { time: "14:32:19", agent: "CIPHER", action: "Pattern detected: 34% of tickets relate to billing issues", type: "output" },
  { time: "14:32:22", agent: "ARCHIVIST", action: "Creating Notion report page...", type: "tool_call" },
  { time: "14:32:28", agent: "ARCHIVIST", action: "Report created: 'Weekly Support Analysis — W10'", type: "output" },
  { time: "14:32:30", agent: "HERALD", action: "Composing Slack summary for #support-team...", type: "thinking" },
  { time: "14:32:33", agent: "HERALD", action: "Message sent to #support-team ✓", type: "output" },
];

const TASKS_DAG = [
  { id: "t1", label: "Fetch Tickets", agent: "SENTINEL", status: "done", x: 10, y: 40 },
  { id: "t2", label: "Analyze & Categorize", agent: "CIPHER", status: "done", x: 35, y: 40 },
  { id: "t3", label: "Create Report", agent: "ARCHIVIST", status: "active", x: 60, y: 25 },
  { id: "t4", label: "Notify Team", agent: "HERALD", status: "queued", x: 60, y: 55 },
];

const CONNECTIONS = [
  { from: "t1", to: "t2" },
  { from: "t2", to: "t3" },
  { from: "t2", to: "t4" },
];

const STATUS_CONFIG = {
  active: { label: "EN MISSION", bg: "rgba(0,240,255,0.1)", border: "#00f0ff", dot: "#00f0ff", pulse: true },
  idle: { label: "EN VEILLE", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)", dot: "#6b7280", pulse: false },
  queued: { label: "EN ATTENTE", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", dot: "#f59e0b", pulse: true },
  sleeping: { label: "SOMMEIL", bg: "rgba(255,255,255,0.01)", border: "rgba(255,255,255,0.05)", dot: "#374151", pulse: false },
  error: { label: "ERREUR", bg: "rgba(239,68,68,0.1)", border: "#ef4444", dot: "#ef4444", pulse: true },
};

function AgentCard({ agent, selected, onClick }) {
  const cfg = STATUS_CONFIG[agent.status];
  return (
    <div
      onClick={() => onClick(agent)}
      style={{
        background: selected ? `linear-gradient(135deg, ${agent.color}15, ${agent.color}08)` : cfg.bg,
        border: `1px solid ${selected ? agent.color : cfg.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {cfg.pulse && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.dot,
          animation: "pulse 2s infinite",
        }} />
      )}
      {!cfg.pulse && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.dot,
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          border: `1px solid ${agent.color}40`,
        }}>
          {agent.avatar}
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: agent.color, letterSpacing: 1 }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace" }}>
            {agent.role} · LVL {agent.level}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {agent.mcps.map(mcp => (
          <span key={mcp} style={{
            fontSize: 9, padding: "2px 6px", borderRadius: 4,
            background: "rgba(255,255,255,0.06)", color: "#9ca3af",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>{mcp}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>
          {agent.missions} missions · {agent.successRate}%
        </div>
        <div style={{
          width: 50, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2,
          overflow: "hidden",
        }}>
          <div style={{
            width: `${agent.xp}%`, height: "100%",
            background: `linear-gradient(90deg, ${agent.color}60, ${agent.color})`,
            borderRadius: 2,
            transition: "width 1s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

function MissionDAG() {
  return (
    <svg viewBox="0 0 100 80" style={{ width: "100%", height: "100%" }}>
      {CONNECTIONS.map(conn => {
        const from = TASKS_DAG.find(t => t.id === conn.from);
        const to = TASKS_DAG.find(t => t.id === conn.to);
        return (
          <line key={`${conn.from}-${conn.to}`}
            x1={from.x + 10} y1={from.y + 5}
            x2={to.x} y2={to.y + 5}
            stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"
            strokeDasharray={to.status === "queued" ? "2,2" : "none"}
          />
        );
      })}
      {TASKS_DAG.map(task => {
        const agent = AGENTS.find(a => a.name === task.agent);
        const colors = {
          done: { fill: "#22c55e20", stroke: "#22c55e", text: "#22c55e" },
          active: { fill: "#00f0ff15", stroke: "#00f0ff", text: "#00f0ff" },
          queued: { fill: "#f59e0b10", stroke: "#f59e0b50", text: "#f59e0b80" },
        };
        const c = colors[task.status];
        return (
          <g key={task.id}>
            <rect x={task.x} y={task.y} width={20} height={10} rx={2}
              fill={c.fill} stroke={c.stroke} strokeWidth="0.3" />
            {task.status === "done" && (
              <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle"
                fill="#22c55e" fontSize="3.5" fontFamily="monospace">✓</text>
            )}
            {task.status === "active" && (
              <circle cx={task.x + 10} cy={task.y + 5} r="1.5"
                fill="#00f0ff" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            {task.status === "queued" && (
              <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle"
                fill="#f59e0b80" fontSize="3" fontFamily="monospace">⏳</text>
            )}
            <text x={task.x + 10} y={task.y + 15} textAnchor="middle"
              fill={c.text} fontSize="2.5" fontFamily="monospace" fontWeight="600">
              {task.label}
            </text>
            <text x={task.x + 10} y={task.y + 18.5} textAnchor="middle"
              fill="rgba(255,255,255,0.3)" fontSize="2" fontFamily="monospace">
              {task.agent}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LiveLog() {
  const [visibleLogs, setVisibleLogs] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < MISSION_LOG.length) {
        setVisibleLogs(prev => [...prev, MISSION_LOG[i]]);
        i++;
      } else {
        i = 0;
        setVisibleLogs([]);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [visibleLogs]);

  const typeColors = {
    tool_call: "#f59e0b",
    output: "#22c55e",
    thinking: "#a855f7",
  };

  return (
    <div ref={logRef} style={{
      height: "100%", overflowY: "auto", padding: "8px 12px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
    }}>
      {visibleLogs.map((log, i) => {
        const agent = AGENTS.find(a => a.name === log.agent);
        return (
          <div key={i} style={{
            padding: "6px 0",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            animation: "fadeSlideIn 0.3s ease",
            opacity: 1,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#4b5563", flexShrink: 0 }}>{log.time}</span>
              <span style={{
                color: agent?.color || "#fff",
                fontWeight: 600, flexShrink: 0, minWidth: 70,
              }}>{log.agent}</span>
              <span style={{
                fontSize: 9, padding: "1px 5px", borderRadius: 3,
                background: `${typeColors[log.type]}15`,
                color: typeColors[log.type],
                border: `1px solid ${typeColors[log.type]}30`,
                flexShrink: 0,
              }}>{log.type}</span>
            </div>
            <div style={{ color: "#d1d5db", marginTop: 3, paddingLeft: 0, lineHeight: 1.5 }}>
              {log.action}
            </div>
          </div>
        );
      })}
      {visibleLogs.length === 0 && (
        <div style={{ color: "#4b5563", textAlign: "center", paddingTop: 30 }}>
          En attente de la prochaine mission...
        </div>
      )}
    </div>
  );
}

export default function SynthCrewDashboard() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState("bridge");
  const [missionInput, setMissionInput] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: "bridge", label: "PONT", icon: "◈" },
    { id: "quarters", label: "QUARTIERS", icon: "◎" },
    { id: "armory", label: "ARMURERIE", icon: "⬡" },
    { id: "ops", label: "OPS ROOM", icon: "▣" },
    { id: "log", label: "JOURNAL", icon: "≡" },
  ];

  const activeAgents = AGENTS.filter(a => a.status === "active").length;
  const totalMissions = AGENTS.reduce((s, a) => s + a.missions, 0);

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "#0a0b0f",
      color: "#e5e7eb",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes gridPulse { 0%, 100% { opacity: 0.03; } 50% { opacity: 0.06; } }
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #1f2937 transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }
      `}</style>

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        animation: "gridPulse 8s ease infinite",
      }} />

      {/* Scanline effect */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.008) 2px, rgba(0,240,255,0.008) 4px)",
      }} />

      {/* Top Bar */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: "1px solid rgba(0,240,255,0.08)",
        background: "rgba(10,11,15,0.95)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 18, fontWeight: 900,
            background: "linear-gradient(135deg, #00f0ff, #a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 3,
          }}>
            SYNTHCREW
          </div>
          <div style={{
            height: 20, width: 1,
            background: "rgba(255,255,255,0.1)",
          }} />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: "#6b7280", letterSpacing: 1,
          }}>
            v0.1.0-alpha · VAISSEAU: NEBULA-7
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            display: "flex", gap: 16,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          }}>
            <span style={{ color: "#00f0ff" }}>⚡ {activeAgents} actifs</span>
            <span style={{ color: "#6b7280" }}>◈ {totalMissions} missions</span>
            <span style={{ color: "#22c55e" }}>● Système OK</span>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, color: "#4b5563",
            letterSpacing: 2,
          }}>
            {time.toLocaleTimeString("fr-FR", { hour12: false })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", position: "relative", zIndex: 5 }}>
        {/* Side Nav */}
        <div style={{
          width: 64, minHeight: "calc(100vh - 49px)",
          borderRight: "1px solid rgba(0,240,255,0.06)",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 16, gap: 4,
          background: "rgba(10,11,15,0.8)",
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: 44, height: 44,
                borderRadius: 10,
                border: activeTab === tab.id ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent",
                background: activeTab === tab.id ? "rgba(0,240,255,0.08)" : "transparent",
                color: activeTab === tab.id ? "#00f0ff" : "#4b5563",
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2,
                transition: "all 0.2s ease",
                fontSize: 16,
              }}
              title={tab.label}
            >
              <span>{tab.icon}</span>
              <span style={{ fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto", maxHeight: "calc(100vh - 49px)" }}>
          
          {/* Mission Input */}
          <div style={{
            marginBottom: 24,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(0,240,255,0.1)",
            borderRadius: 14,
            padding: 3,
            display: "flex", alignItems: "center",
          }}>
            <div style={{
              padding: "0 14px", color: "#00f0ff",
              fontFamily: "'Orbitron', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: 1,
              flexShrink: 0,
            }}>
              MISSION ›
            </div>
            <input
              type="text"
              value={missionInput}
              onChange={e => setMissionInput(e.target.value)}
              placeholder="Décris ta mission... ex: Analyse mes 50 derniers tickets et crée un rapport"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#e5e7eb", padding: "14px 8px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              }}
            />
            <button style={{
              padding: "10px 20px", borderRadius: 11,
              background: "linear-gradient(135deg, #00f0ff, #0080ff)",
              border: "none", color: "#000", cursor: "pointer",
              fontFamily: "'Orbitron', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: 1,
              flexShrink: 0,
            }}>
              LANCER ▶
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            
            {/* Left Column — Mission DAG */}
            <div>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Orbitron', monospace", fontSize: 11,
                      color: "#00f0ff", fontWeight: 700, letterSpacing: 1,
                    }}>
                      MISSION ACTIVE
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: "#6b7280", marginTop: 2,
                    }}>
                      Analyse Zendesk → Rapport + Notification
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: "rgba(0,240,255,0.1)",
                    border: "1px solid rgba(0,240,255,0.2)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, color: "#00f0ff",
                  }}>
                    75% ████████░░
                  </div>
                </div>
                <div style={{ padding: "10px 0", height: 200 }}>
                  <MissionDAG />
                </div>
              </div>

              {/* Live Log */}
              <div style={{
                marginTop: 20,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, overflow: "hidden",
                height: 280,
              }}>
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#22c55e",
                    animation: "pulse 2s infinite",
                  }} />
                  <span style={{
                    fontFamily: "'Orbitron', monospace", fontSize: 11,
                    color: "#22c55e", fontWeight: 700, letterSpacing: 1,
                  }}>
                    LIVE FEED
                  </span>
                </div>
                <LiveLog />
              </div>
            </div>

            {/* Right Column — Agents */}
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12,
              }}>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontSize: 11,
                  color: "#9ca3af", fontWeight: 700, letterSpacing: 1,
                }}>
                  ÉQUIPAGE ({AGENTS.length} AGENTS)
                </div>
                <button style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "#a855f7", cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  letterSpacing: 0.5,
                }}>
                  + Recruter
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AGENTS.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    selected={selectedAgent?.id === agent.id}
                    onClick={setSelectedAgent}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div style={{
            marginTop: 24,
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
          }}>
            {[
              { label: "MISSIONS / 24H", value: "23", color: "#00f0ff", sub: "+12% vs hier" },
              { label: "TOKENS UTILISÉS", value: "847K", color: "#a855f7", sub: "~2.14€ aujourd'hui" },
              { label: "TAUX DE SUCCÈS", value: "95.2%", color: "#22c55e", sub: "↑ 1.3% cette semaine" },
              { label: "MCPs CONNECTÉS", value: "8", color: "#f59e0b", sub: "12 tools actifs" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, color: "#6b7280", letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 26, fontWeight: 900,
                  color: stat.color,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: "#4b5563",
                  marginTop: 4,
                }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
