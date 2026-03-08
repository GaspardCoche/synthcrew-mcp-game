import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { AGENT_ROLE_LABELS, STATUS_CONFIG, MCP_CATEGORIES } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

function AgentRadarCard({ agent, mcps, onClick }) {
  const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const mcpNames = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id)).map((m) => m.name);

  return (
    <button
      onClick={() => onClick(agent)}
      className="rounded-xl p-3 transition-all border text-left hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, ${agent.color}08, transparent)`,
        borderColor: `${agent.color}25`,
      }}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5 -translate-y-4 translate-x-4" style={{ background: agent.color }} />

      <div className="flex items-center gap-2.5 mb-2">
        <div className="relative">
          <AgentAvatar agent={agent} size="sm" />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080c15]"
            style={{ backgroundColor: cfg.dot, boxShadow: cfg.pulse ? `0 0 6px ${cfg.dot}` : "none" }}
          />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold truncate" style={{ color: agent.color }}>{agent.name}</p>
          <p className="text-[9px] text-gray-500">{AGENT_ROLE_LABELS[agent.role] || agent.role}</p>
        </div>
        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${cfg.dot}15`, color: cfg.dot }}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${agent.xp || 0}%`, background: `linear-gradient(90deg, ${agent.color}80, ${agent.color})` }}
          />
        </div>
        <span className="text-[9px] font-mono text-gray-500">Nv.{agent.level || 1}</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {mcpNames.slice(0, 3).map((name) => (
          <span key={name} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">{name}</span>
        ))}
        {mcpNames.length > 3 && <span className="text-[8px] text-gray-600 font-mono">+{mcpNames.length - 3}</span>}
      </div>

      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
        <span className="text-[9px] text-gray-600 font-mono">{agent.missions || 0} missions</span>
        <span className="text-[9px] font-mono" style={{ color: agent.color }}>{agent.successRate || 0}%</span>
      </div>
    </button>
  );
}

function MissionProgress({ dag }) {
  if (!dag) return null;
  const done = dag.tasks.filter((t) => t.status === "done").length;
  const total = dag.tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const current = dag.tasks.find((t) => t.status === "active");

  return (
    <div className="rounded-xl border border-synth-teal/20 bg-synth-teal/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-synth-teal animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-synth-teal">MISSION EN COURS</span>
        </div>
        <span className="text-[10px] font-mono text-synth-teal">{done}/{total}</span>
      </div>
      <p className="text-sm text-gray-300 mb-2 font-semibold">{dag.title}</p>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full bg-gradient-to-r from-synth-teal to-synth-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {current && (
        <p className="text-[10px] text-gray-500 font-mono">
          En cours : <span className="text-gray-300">{current.label}</span> → <span style={{ color: "#4ecdc4" }}>{current.agentName}</span>
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {dag.tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-lg"
            style={{
              background: task.status === "done" ? "rgba(0,184,148,0.1)" : task.status === "active" ? "rgba(78,205,196,0.1)" : "rgba(255,255,255,0.03)",
              color: task.status === "done" ? "#00b894" : task.status === "active" ? "#4ecdc4" : "#6b7280",
              border: `1px solid ${task.status === "done" ? "rgba(0,184,148,0.2)" : task.status === "active" ? "rgba(78,205,196,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {task.status === "done" ? "✓" : task.status === "active" ? "●" : "○"} {task.label?.slice(0, 20)}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveFeed({ log, agents }) {
  const typeColors = { tool_call: "#ffd93d", output: "#00b894", thinking: "#6c5ce7", error: "#ff6b6b" };
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden flex flex-col h-64">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-synth-emerald animate-pulse" />
        <span className="text-[10px] font-bold text-synth-emerald tracking-wide font-mono">ACTIVITÉ EN DIRECT</span>
        <span className="ml-auto text-[9px] text-gray-600 font-mono">{log.length} événements</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
        {log.length === 0 ? (
          <div className="text-gray-600 text-center py-8 text-[11px]">
            Lance une mission pour voir l'activité des agents
          </div>
        ) : (
          log.slice(-20).map((entry, i) => {
            const agent = agents.find((a) => a.name === entry.agent);
            const tc = typeColors[entry.type] || "#9ca3af";
            return (
              <div key={i} className="py-1 border-b border-white/3 last:border-0">
                <div className="flex gap-2 items-center">
                  <span className="text-gray-600 shrink-0 text-[9px]">{entry.time}</span>
                  <span className="font-bold shrink-0" style={{ color: agent?.color || "#dfe6e9" }}>{entry.agent}</span>
                  <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${tc}15`, color: tc }}>{entry.type}</span>
                </div>
                <p className="text-gray-400 text-[10px] mt-0.5 truncate">{entry.action}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Bridge() {
  const [time, setTime] = useState(new Date());
  const [selectedAgent, setSelectedAgent] = useState(null);
  const { agents, missionLog, currentMissionDag, mcps, getPlanLimit, missions } = useStore();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((s, a) => s + (a.missions || 0), 0);
  const connectedMcps = mcps.filter((m) => m.connected);
  const totalTools = connectedMcps.reduce((s, m) => s + (m.tools?.length || 0), 0);
  const avgSuccess = Math.round(agents.reduce((s, a) => s + (a.successRate || 0), 0) / Math.max(agents.length, 1));

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Status Bar */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-synth-emerald" style={{ boxShadow: "0 0 8px #00b894" }} />
          <span className="text-synth-emerald font-semibold">Système opérationnel</span>
        </div>
        <span className="w-px h-3 bg-white/10" />
        <span className="text-gray-500"><span className="text-synth-teal font-semibold">{activeCount}</span> agents actifs</span>
        <span className="w-px h-3 bg-white/10" />
        <span className="text-gray-500">{totalMissions} missions</span>
        <span className="ml-auto text-synth-primary tracking-wider font-mono font-bold">{time.toLocaleTimeString("fr-FR", { hour12: false })}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-synth-primary/20 bg-gradient-to-br from-synth-primary/8 to-transparent p-4">
          <p className="text-[9px] text-gray-500 font-mono tracking-wide">AGENTS</p>
          <p className="text-2xl font-black text-synth-primary font-orbitron">{agents.length}</p>
          <p className="text-[10px] text-gray-600 font-mono">{activeCount} en mission</p>
        </div>
        <div className="rounded-xl border border-synth-teal/20 bg-gradient-to-br from-synth-teal/8 to-transparent p-4">
          <p className="text-[9px] text-gray-500 font-mono tracking-wide">MISSIONS</p>
          <p className="text-2xl font-black text-synth-teal font-orbitron">{totalMissions}</p>
          <p className="text-[10px] text-gray-600 font-mono">{avgSuccess}% succès</p>
        </div>
        <div className="rounded-xl border border-synth-indigo/20 bg-gradient-to-br from-synth-indigo/8 to-transparent p-4">
          <p className="text-[9px] text-gray-500 font-mono tracking-wide">MCPs</p>
          <p className="text-2xl font-black text-synth-indigo font-orbitron">{connectedMcps.length}</p>
          <p className="text-[10px] text-gray-600 font-mono">{totalTools} tools actifs</p>
        </div>
        <div className="rounded-xl border border-synth-gold/20 bg-gradient-to-br from-synth-gold/8 to-transparent p-4">
          <p className="text-[9px] text-gray-500 font-mono tracking-wide">PLAN</p>
          <p className="text-2xl font-black text-synth-gold font-orbitron">Free</p>
          <p className="text-[10px] text-gray-600 font-mono">{getPlanLimit("agents")} agents max</p>
        </div>
      </div>

      {/* Mission CTA */}
      <Link
        to="/classic/ops"
        className="block rounded-xl border border-synth-primary/20 bg-gradient-to-r from-synth-primary/10 via-transparent to-synth-teal/5 p-5 hover:border-synth-primary/30 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-synth-primary to-synth-teal flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform shadow-lg">
            ▶
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-200">Nouvelle mission</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Décris ce que tu veux accomplir, parle à ton équipage</p>
          </div>
          <span className="text-xs font-bold bg-gradient-to-r from-synth-primary to-synth-teal text-white px-5 py-2.5 rounded-xl opacity-90 group-hover:opacity-100">
            LANCER
          </span>
        </div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Mission + Feed */}
        <div className="lg:col-span-2 space-y-4">
          {currentMissionDag ? (
            <MissionProgress dag={currentMissionDag} />
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/2 p-6 text-center">
              <p className="text-gray-500 text-sm mb-2">Aucune mission en cours</p>
              <p className="text-gray-600 text-[11px]">Lance une mission pour voir la progression ici</p>
            </div>
          )}
          <LiveFeed log={missionLog} agents={agents} />
        </div>

        {/* Right: Agents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-synth-primary tracking-wide font-mono">ÉQUIPAGE</span>
            <Link to="/classic/quarters" className="text-[10px] px-2.5 py-1 rounded-lg bg-synth-primary/10 border border-synth-primary/25 text-synth-primary font-mono hover:bg-synth-primary/20 transition-colors">
              + Recruter
            </Link>
          </div>
          <div className="space-y-2">
            {agents.map((agent) => (
              <AgentRadarCard key={agent.id} agent={agent} mcps={mcps} onClick={setSelectedAgent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
