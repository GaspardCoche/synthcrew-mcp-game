import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { AGENT_ROLE_LABELS, STATUS_CONFIG, MCP_CATEGORIES } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

// ── Animated counter hook ────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const start = prevTarget.current;
    prevTarget.current = target;
    if (start === target) return;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ── System Metric Card ───────────────────────────────────────
function MetricCard({ label, value, unit, sub, color, icon }) {
  const animated = useCountUp(Number(value) || 0, 1400);
  return (
    <div
      className="cyber-panel p-4 relative overflow-hidden"
      style={{ borderColor: `${color}18` }}
    >
      {/* Background glow orb */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4"
        style={{ background: `radial-gradient(circle, ${color}, transparent)` }}
      />
      <div className="relative z-10">
        <div
          className="text-[8px] font-mono tracking-[0.25em] uppercase mb-2 flex items-center gap-1.5"
          style={{ color: `${color}60` }}
        >
          {icon && <span>{icon}</span>}
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="metric-counter text-3xl font-black"
            style={{
              color,
              textShadow: `0 0 20px ${color}40`,
            }}
          >
            {animated}
          </span>
          {unit && <span className="text-xs font-mono" style={{ color: `${color}50` }}>{unit}</span>}
        </div>
        {sub && <div className="text-[9px] font-mono mt-1" style={{ color: "#374151" }}>{sub}</div>}
      </div>
      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
        style={{ width: "60%", background: `linear-gradient(90deg, ${color}60, transparent)` }}
      />
    </div>
  );
}

// ── World Status Panel ───────────────────────────────────────
function WorldStatusPanel({ agents, mcps }) {
  const connectedMcps = mcps.filter((m) => m.connected).length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const idleAgents = agents.filter((a) => a.status === "idle").length;

  const indicators = [
    { label: "NEXUS CORE", status: "nominal", color: "#00ff88" },
    { label: "MCP BRIDGE", status: connectedMcps > 0 ? "active" : "standby", color: connectedMcps > 0 ? "#00f5ff" : "#374151" },
    { label: "AGENT MESH", status: activeAgents > 0 ? "engaged" : "idle", color: activeAgents > 0 ? "#ff6b35" : "#4b5563" },
    { label: "DATA STREAM", status: "live", color: "#a855f7" },
  ];

  return (
    <div className="cyber-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse 2s infinite" }} />
        <span className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(0,255,136,0.7)" }}>
          World Status
        </span>
        <span className="ml-auto text-[8px] font-mono" style={{ color: "#1f2937" }}>SYS-01</span>
      </div>
      <div className="space-y-2.5">
        {indicators.map((ind) => (
          <div key={ind.label} className="flex items-center gap-3">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: ind.color, boxShadow: `0 0 6px ${ind.color}` }}
            />
            <span className="text-[9px] font-mono flex-1" style={{ color: "#374151" }}>{ind.label}</span>
            <span
              className="text-[8px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${ind.color}10`, color: ind.color, border: `1px solid ${ind.color}20` }}
            >
              {ind.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-4 pt-3 grid grid-cols-3 gap-2 text-center"
        style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}
      >
        <div>
          <div className="text-lg font-black font-mono" style={{ color: "#00f5ff" }}>{agents.length}</div>
          <div className="text-[7px] font-mono" style={{ color: "#374151" }}>TOTAL</div>
        </div>
        <div>
          <div className="text-lg font-black font-mono" style={{ color: "#ff6b35" }}>{activeAgents}</div>
          <div className="text-[7px] font-mono" style={{ color: "#374151" }}>ACTIVE</div>
        </div>
        <div>
          <div className="text-lg font-black font-mono" style={{ color: "#4b5563" }}>{idleAgents}</div>
          <div className="text-[7px] font-mono" style={{ color: "#374151" }}>IDLE</div>
        </div>
      </div>
    </div>
  );
}

// ── Mission Pipeline Visual ──────────────────────────────────
function MissionPipeline({ dag, missions }) {
  if (!dag) {
    const recent = missions?.slice(0, 5) || [];
    return (
      <div className="cyber-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(0,245,255,0.5)" }}>
            Mission Pipeline
          </span>
          <span className="ml-auto text-[8px] font-mono" style={{ color: "#1f2937" }}>STANDBY</span>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-[10px] font-mono" style={{ color: "#1f2937" }}>No missions executed</div>
            <div className="text-[9px] font-mono mt-1" style={{ color: "#111827" }}>Launch a mission to see pipeline</div>
          </div>
        ) : (
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {recent.map((m, i) => (
              <div key={m.id || i} className="flex items-center gap-1 shrink-0">
                <div
                  className="px-2 py-1.5 rounded text-center shrink-0"
                  style={{
                    background: "rgba(0,255,136,0.05)",
                    border: "1px solid rgba(0,255,136,0.15)",
                    minWidth: 80,
                  }}
                >
                  <div className="text-[7px] font-mono" style={{ color: "rgba(0,255,136,0.5)" }}>DONE</div>
                  <div className="text-[9px] font-mono truncate max-w-[70px] mt-0.5" style={{ color: "#4b5563" }}>
                    {m.title?.slice(0, 12) || "Mission"}
                  </div>
                </div>
                {i < recent.length - 1 && (
                  <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none" style={{ color: "#1f2937" }}>
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const tasks = dag.tasks || [];
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="cyber-panel-orange p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#ff6b35", boxShadow: "0 0 8px #ff6b35", animation: "pulse 1.5s infinite" }}
          />
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,107,53,0.8)" }}>
            Live Mission
          </span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,107,53,0.5)" }}>
          {done}/{total} tasks
        </span>
      </div>

      <div className="text-sm font-bold mb-3 truncate" style={{ color: "#e2e8f0" }}>{dag.title}</div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,107,53,0.1)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff6b35, #ffd93d)",
            boxShadow: "0 0 8px rgba(255,107,53,0.5)",
          }}
        />
      </div>

      {/* Task flow */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tasks.map((task, i) => {
          const isDone = task.status === "done";
          const isActive = task.status === "active";
          return (
            <div key={task.id || i} className="flex items-center gap-1 shrink-0">
              <div
                className={`px-2 py-1.5 rounded text-center shrink-0 ${isActive ? "pipeline-node active" : "pipeline-node"}`}
                style={{
                  background: isDone
                    ? "rgba(0,255,136,0.08)"
                    : isActive
                    ? "rgba(0,245,255,0.1)"
                    : "rgba(255,255,255,0.03)",
                  border: isDone
                    ? "1px solid rgba(0,255,136,0.2)"
                    : isActive
                    ? "1px solid rgba(0,245,255,0.3)"
                    : "1px solid rgba(255,255,255,0.05)",
                  minWidth: 72,
                }}
              >
                <div
                  className="text-[7px] font-mono"
                  style={{
                    color: isDone ? "#00ff88" : isActive ? "#00f5ff" : "#1f2937",
                  }}
                >
                  {isDone ? "DONE" : isActive ? "RUNNING" : "QUEUED"}
                </div>
                <div className="text-[8px] font-mono truncate max-w-[60px] mt-0.5" style={{ color: isDone ? "#4b5563" : isActive ? "#9ca3af" : "#1f2937" }}>
                  {task.label?.slice(0, 10)}
                </div>
              </div>
              {i < tasks.length - 1 && (
                <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none" style={{ color: isDone ? "rgba(0,255,136,0.3)" : "#1f2937" }}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Live Activity Feed (terminal-style) ──────────────────────
function LiveActivityFeed({ log, agents }) {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [log]);

  const typeColors = {
    tool_call: { bg: "rgba(255,217,61,0.08)", border: "#ffd93d", label: "TOOL" },
    output: { bg: "rgba(0,255,136,0.06)", border: "#00ff88", label: "OUT" },
    thinking: { bg: "rgba(168,85,247,0.06)", border: "#a855f7", label: "THINK" },
    error: { bg: "rgba(255,45,85,0.08)", border: "#ff2d55", label: "ERR" },
    system: { bg: "rgba(255,107,53,0.06)", border: "#ff6b35", label: "SYS" },
  };

  return (
    <div className="cyber-panel flex flex-col" style={{ height: 280 }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
      >
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88", animation: "pulse 2s infinite" }} />
        </div>
        <span className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(0,245,255,0.5)" }}>
          Agent Activity Feed
        </span>
        <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(0,245,255,0.06)", color: "#374151" }}>
          {log.length} events
        </span>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1">
        {log.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-[24px] opacity-10">◈</div>
            <div className="text-[9px] font-mono" style={{ color: "#1f2937" }}>Waiting for agent activity...</div>
            <div className="text-[8px] font-mono" style={{ color: "#111827" }}>Launch a mission to see live events</div>
          </div>
        ) : (
          log.slice(-30).map((entry, i) => {
            const agent = agents.find((a) => a.name === entry.agent);
            const tc = typeColors[entry.type] || typeColors.system;
            return (
              <div
                key={i}
                className="log-entry animate-fade-in"
                style={{ borderLeftColor: tc.border }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ color: "#374151" }}>{entry.time}</span>
                  <span className="font-bold" style={{ color: agent?.color || "#6b7280" }}>
                    {entry.agent}
                  </span>
                  <span
                    className="text-[7px] px-1 py-0.5 rounded font-bold"
                    style={{ background: tc.bg, color: tc.border, border: `1px solid ${tc.border}18` }}
                  >
                    {tc.label}
                  </span>
                </div>
                <div className="truncate" style={{ color: "#4b5563" }}>{entry.action}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Nexus Briefing Panel ─────────────────────────────────────
function NexusBriefing({ agents, missions }) {
  const completedMissions = missions?.filter((m) => m.status === "completed") || [];
  const successRate = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + (a.successRate || 0), 0) / agents.length)
    : 0;

  const briefLines = [
    `> CREW SIZE: ${agents.length} agents operational`,
    `> MISSION HISTORY: ${completedMissions.length} completed`,
    `> AVG SUCCESS RATE: ${successRate}%`,
    `> STATUS: ${agents.some((a) => a.status === "active") ? "MISSION IN PROGRESS" : "STANDBY — READY TO DEPLOY"}`,
    `> ORCHESTRATOR: NEXUS [LVL 99] — ONLINE`,
  ];

  return (
    <div className="cyber-panel-purple p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">◈</span>
        <span className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(168,85,247,0.7)" }}>
          Nexus Briefing
        </span>
        <span
          className="ml-auto text-[7px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: "rgba(168,85,247,0.08)", color: "rgba(168,85,247,0.5)", border: "1px solid rgba(168,85,247,0.15)" }}
        >
          STRATEGIC
        </span>
      </div>
      <div className="space-y-1.5">
        {briefLines.map((line, i) => (
          <div
            key={i}
            className="text-[10px] font-mono animate-fade-in"
            style={{ color: "#4b5563", animationDelay: `${i * 80}ms` }}
          >
            <span style={{ color: "rgba(168,85,247,0.4)" }}>{line.split(":")[0]}:</span>
            {line.includes(":") ? line.slice(line.indexOf(":") + 1) : ""}
          </div>
        ))}
      </div>
      <div
        className="mt-4 pt-3 text-[9px] font-mono leading-relaxed"
        style={{
          borderTop: "1px solid rgba(168,85,247,0.08)",
          color: "#374151",
        }}
      >
        NEXUS ASSESSMENT: Your crew is {agents.length >= 3 ? "well-staffed" : "understaffed"} for complex multi-agent missions.
        {agents.some((a) => a.status === "active")
          ? " Active operations in progress — monitoring all task nodes."
          : " All systems nominal. Ready to receive mission objectives."}
      </div>
    </div>
  );
}

// ── Agent Radar Card ─────────────────────────────────────────
function AgentRadarCard({ agent, mcps, onClick }) {
  const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const agentMcps = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id));

  // Simulated "combat stats"
  const power = Math.min(100, (agent.level || 1) * 5 + 10);
  const efficiency = agent.successRate || 0;
  const speed = Math.min(100, 40 + (agent.missions || 0) / 3);

  return (
    <button
      onClick={() => onClick(agent)}
      className="agent-card text-left w-full p-3 group"
      style={{
        background: `linear-gradient(135deg, ${agent.color}06, rgba(8,12,21,0.98))`,
        border: `1px solid ${agent.color}15`,
      }}
    >
      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-8 h-8 opacity-20"
        style={{
          background: `linear-gradient(225deg, ${agent.color}, transparent)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="relative shrink-0">
          <AgentAvatar agent={agent} size="sm" />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              borderColor: "#080c15",
              backgroundColor: cfg.dot,
              boxShadow: cfg.pulse ? `0 0 6px ${cfg.dot}` : "none",
              animation: cfg.pulse ? "pulse 2s infinite" : "none",
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold truncate" style={{ color: agent.color }}>
            {agent.name}
          </p>
          <p className="text-[8px]" style={{ color: "#374151" }}>
            {AGENT_ROLE_LABELS[agent.role] || agent.role}
          </p>
        </div>
        <span
          className="text-[7px] font-mono px-1.5 py-0.5 rounded shrink-0"
          style={{
            background: `${cfg.dot}10`,
            color: cfg.dot,
            border: `1px solid ${cfg.dot}20`,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Stat bars */}
      <div className="space-y-1.5 mb-2.5">
        {[
          { label: "PWR", value: power, color: agent.color },
          { label: "EFF", value: efficiency, color: "#00ff88" },
          { label: "SPD", value: speed, color: "#a855f7" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[7px] font-mono w-6 shrink-0" style={{ color: "#374151" }}>{label}</span>
            <div className="stat-bar flex-1">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${value}%`,
                  background: `linear-gradient(90deg, ${color}40, ${color})`,
                }}
              />
            </div>
            <span className="text-[7px] font-mono w-6 text-right shrink-0" style={{ color: "#374151" }}>
              {Math.round(value)}
            </span>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 xp-bar">
          <div
            className="xp-bar-fill"
            style={{
              width: `${agent.xp || 0}%`,
              background: `linear-gradient(90deg, ${agent.color}60, ${agent.color})`,
            }}
          />
        </div>
        <span className="text-[7px] font-mono" style={{ color: "#374151" }}>LV.{agent.level || 1}</span>
      </div>

      {/* MCP Tools */}
      <div className="flex gap-1 flex-wrap">
        {agentMcps.slice(0, 3).map((m) => (
          <span key={m.id} className="class-badge">{m.icon} {m.name}</span>
        ))}
        {agentMcps.length > 3 && (
          <span className="text-[7px] font-mono" style={{ color: "#374151" }}>+{agentMcps.length - 3}</span>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-2 pt-1.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span className="text-[8px] font-mono" style={{ color: "#374151" }}>{agent.missions || 0} missions</span>
        <span className="text-[8px] font-mono font-bold" style={{ color: agent.successRate >= 95 ? "#00ff88" : "#ffd93d" }}>
          {agent.successRate || 0}%
        </span>
      </div>
    </button>
  );
}

// ── Quick Action Button ──────────────────────────────────────
function QuickAction({ to, icon, label, sub, color, pulse }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg transition-all group"
      style={{
        background: `${color}06`,
        border: `1px solid ${color}15`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110"
        style={{
          background: `${color}12`,
          border: `1px solid ${color}25`,
          boxShadow: `0 0 12px ${color}15`,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold font-mono tracking-wider" style={{ color }}>
          {label}
        </div>
        <div className="text-[8px] font-mono truncate" style={{ color: "#374151" }}>{sub}</div>
      </div>
      {pulse && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}`, animation: "pulse 2s infinite" }}
        />
      )}
    </Link>
  );
}

// ── Quick Mission Input ──────────────────────────────────────
function QuickMissionInput() {
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const launch = async () => {
    const text = prompt.trim();
    if (!text || sending) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/mission/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, title: text.slice(0, 80) }),
      });
      const data = await res.json();
      if (data.error) setFeedback({ ok: false, msg: data.error });
      else { setFeedback({ ok: true, msg: data.message || "Mission lancée" }); setPrompt(""); }
    } catch { setFeedback({ ok: false, msg: "Serveur inaccessible" }); }
    finally { setSending(false); }
  };

  return (
    <div className="cyber-panel p-3">
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && launch()}
          placeholder="Décris une mission pour l'équipage..."
          disabled={sending}
          className="flex-1 bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-[11px] text-gray-200 font-mono placeholder-gray-700 outline-none focus:border-synth-primary/30 transition-colors"
        />
        <button
          onClick={launch}
          disabled={!prompt.trim() || sending}
          className="synth-btn-primary text-[10px] disabled:opacity-40 whitespace-nowrap"
        >
          {sending ? "..." : "Lancer"}
        </button>
      </div>
      {feedback && (
        <p className={`text-[9px] font-mono mt-1.5 ${feedback.ok ? "text-emerald-400" : "text-red-400"}`}>
          {feedback.msg}
        </p>
      )}
    </div>
  );
}

// ── Main Bridge Page ─────────────────────────────────────────
export default function Bridge() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const { agents, missionLog, currentMissionDag, mcps, missions } = useStore();

  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((s, a) => s + (a.missions || 0), 0);
  const connectedMcps = mcps.filter((m) => m.connected);
  const totalTools = connectedMcps.reduce((s, m) => s + (m.tools?.length || 0), 0);
  const avgSuccess = Math.round(agents.reduce((s, a) => s + (a.successRate || 0), 0) / Math.max(agents.length, 1));

  return (
    <div className="space-y-4 max-w-[1400px] relative">

      {/* ── Quick Mission ──────────────────────────────────── */}
      <QuickMissionInput />

      {/* ── Top Status Bar ─────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded"
          style={{
            background: "rgba(0,255,136,0.05)",
            border: "1px solid rgba(0,255,136,0.12)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse 2s infinite" }}
          />
          <span className="text-[9px] font-mono font-bold tracking-wider" style={{ color: "rgba(0,255,136,0.7)" }}>
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-mono">
          <span style={{ color: "#374151" }}>
            ACTIVE: <span style={{ color: "#00f5ff" }}>{activeCount}</span>
          </span>
          <span style={{ color: "#374151" }}>|</span>
          <span style={{ color: "#374151" }}>
            MISSIONS: <span style={{ color: "#ff6b35" }}>{totalMissions}</span>
          </span>
        </div>
      </div>

      {/* ── System Metrics ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Crew Size"
          value={agents.length}
          sub={`${activeCount} on mission`}
          color="#00f5ff"
          icon="◎"
        />
        <MetricCard
          label="Missions"
          value={totalMissions}
          sub={`${avgSuccess}% success rate`}
          color="#ff6b35"
          icon="▣"
        />
        <MetricCard
          label="MCP Tools"
          value={totalTools}
          sub={`${connectedMcps.length} servers active`}
          color="#a855f7"
          icon="⬡"
        />
        <MetricCard
          label="Avg Success"
          value={avgSuccess}
          unit="%"
          sub="Fleet average"
          color="#00ff88"
          icon="◈"
        />
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction
          to="/classic/ops"
          icon="▶"
          label="LAUNCH MISSION"
          sub="Deploy agents with NLP command"
          color="#ff6b35"
          pulse={activeCount > 0}
        />
        <QuickAction
          to="/classic/quarters"
          icon="◎"
          label="RECALL AGENTS"
          sub="Manage crew & assignments"
          color="#00f5ff"
        />
        <QuickAction
          to="/classic/armory"
          icon="⬡"
          label="VIEW ARSENAL"
          sub="MCP tools & integrations"
          color="#a855f7"
        />
      </div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Left sidebar: World Status + Nexus Briefing */}
        <div className="xl:col-span-3 space-y-4">
          <WorldStatusPanel agents={agents} mcps={mcps} />
          <NexusBriefing agents={agents} missions={missions} />
        </div>

        {/* Center: Pipeline + Live Feed */}
        <div className="xl:col-span-6 space-y-4">
          <MissionPipeline dag={currentMissionDag} missions={missions} />
          <LiveActivityFeed log={missionLog} agents={agents} />
        </div>

        {/* Right: Agent Roster */}
        <div className="xl:col-span-3">
          <div
            className="flex items-center justify-between mb-3 px-1"
          >
            <span className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(0,245,255,0.4)" }}>
              Crew Roster
            </span>
            <Link
              to="/classic/quarters"
              className="text-[8px] font-mono px-2 py-1 rounded transition-all"
              style={{
                background: "rgba(0,245,255,0.05)",
                border: "1px solid rgba(0,245,255,0.12)",
                color: "rgba(0,245,255,0.5)",
              }}
            >
              + RECRUIT
            </Link>
          </div>
          <div className="space-y-2">
            {agents.map((agent) => (
              <AgentRadarCard
                key={agent.id}
                agent={agent}
                mcps={mcps}
                onClick={setSelectedAgent}
              />
            ))}
            {agents.length === 0 && (
              <div className="cyber-panel p-6 text-center">
                <div className="text-2xl opacity-10 mb-2">◎</div>
                <div className="text-[9px] font-mono" style={{ color: "#1f2937" }}>No agents deployed</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Agent Detail Modal ──────────────────────────────── */}
      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="cyber-panel p-6 w-full max-w-md animate-fade-in"
            style={{ borderColor: `${selectedAgent.color}25` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-5">
              <AgentAvatar agent={selectedAgent} size="lg" />
              <div>
                <div className="font-mono text-lg font-black" style={{ color: selectedAgent.color }}>
                  {selectedAgent.name}
                </div>
                <div className="text-[10px] font-mono" style={{ color: "#374151" }}>
                  {AGENT_ROLE_LABELS[selectedAgent.role] || selectedAgent.role} — LV.{selectedAgent.level || 1}
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="ml-auto text-gray-700 hover:text-gray-400 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { label: "POWER", value: Math.min(100, (selectedAgent.level || 1) * 5 + 10), color: selectedAgent.color },
                { label: "EFFICIENCY", value: selectedAgent.successRate || 0, color: "#00ff88" },
                { label: "EXPERIENCE", value: selectedAgent.xp || 0, color: "#a855f7" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-mono" style={{ color: "#374151" }}>{label}</span>
                    <span className="text-[9px] font-mono" style={{ color }}>{value}</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}40, ${color})` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono leading-relaxed mb-4" style={{ color: "#4b5563" }}>
              {selectedAgent.personality || "No personality directive set."}
            </div>

            <div className="flex gap-2">
              <Link
                to="/classic/quarters"
                className="flex-1 py-2 text-center text-[10px] font-mono font-bold rounded transition-all"
                style={{
                  background: "rgba(0,245,255,0.08)",
                  border: "1px solid rgba(0,245,255,0.2)",
                  color: "#00f5ff",
                }}
                onClick={() => setSelectedAgent(null)}
              >
                MANAGE AGENT
              </Link>
              <Link
                to="/classic/ops"
                className="flex-1 py-2 text-center text-[10px] font-mono font-bold rounded transition-all"
                style={{
                  background: "rgba(255,107,53,0.08)",
                  border: "1px solid rgba(255,107,53,0.2)",
                  color: "#ff6b35",
                }}
                onClick={() => setSelectedAgent(null)}
              >
                DEPLOY NOW
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
