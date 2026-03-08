import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { AGENT_ROLE_LABELS, STATUS_CONFIG } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

function AgentCard({ agent, selected, onClick, mcps }) {
  const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const mcpNames = (mcps || [])
    .filter((m) => agent.mcpIds?.includes(m.id))
    .map((m) => m.name);

  return (
    <div
      onClick={() => onClick(agent)}
      className={`rounded-xl p-4 cursor-pointer transition-all border relative overflow-hidden ${
        selected ? "border-current" : ""
      }`}
      style={{
        background: selected ? `linear-gradient(135deg, ${agent.color}15, ${agent.color}08)` : cfg.bg,
        borderColor: selected ? agent.color : cfg.border,
      }}
    >
      {cfg.pulse && (
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
          style={{ background: cfg.dot }}
        />
      )}
      {!cfg.pulse && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
      )}
      <div className="flex items-center gap-2.5 mb-2">
        <AgentAvatar agent={agent} size="sm" />
        <div>
          <div className="font-mono text-sm font-bold tracking-wide" style={{ color: agent.color }}>
            {agent.name}
          </div>
          <div className="text-xs text-gray-400">
            {AGENT_ROLE_LABELS[agent.role] || agent.role} · Nv.{agent.level}
          </div>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap mb-2">
        {mcpNames.map((name) => (
          <span
            key={name}
            className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5"
          >
            {name}
          </span>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-gray-500">
          {agent.missions} missions · {agent.successRate}%
        </span>
        <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${agent.xp}%`,
              background: `linear-gradient(90deg, ${agent.color}80, ${agent.color})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Bridge() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [time, setTime] = useState(new Date());
  const { agents, missionLog, currentMissionDag, mcps, getPlanLimit, missions } = useStore();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((s, a) => s + (a.missions || 0), 0);
  const connectedMcps = mcps.filter((m) => m.connected).length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="text-synth-teal font-semibold">{activeCount} actifs</span>
        <span className="w-px h-3 bg-white/10" />
        <span>{totalMissions} missions</span>
        <span className="w-px h-3 bg-white/10" />
        <span className="text-synth-emerald">Système OK</span>
        <span className="ml-auto text-synth-primary tracking-wider font-mono">{time.toLocaleTimeString("fr-FR", { hour12: false })}</span>
      </div>

      {/* CTA Mission */}
      <Link
        to="/classic/ops"
        className="block rounded-xl border border-synth-primary/20 bg-gradient-to-r from-synth-primary/8 to-transparent p-4 hover:border-synth-primary/30 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-synth-primary/15 flex items-center justify-center text-synth-primary text-lg group-hover:scale-105 transition-transform">
            ▶
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-200">Lancer une nouvelle mission</p>
            <p className="text-[11px] text-gray-500">NEXUS décompose ta demande et coordonne l'équipe</p>
          </div>
          <span className="text-xs font-bold bg-gradient-to-r from-synth-primary to-synth-teal text-white px-4 py-2 rounded-lg">
            MISSIONS
          </span>
        </div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          {/* Active mission DAG */}
          <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-bold text-synth-teal tracking-wide font-mono">MISSION ACTIVE</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {currentMissionDag?.title || "Aucune mission en cours"}
                </div>
              </div>
              {currentMissionDag && (
                <span className="text-[10px] px-2 py-1 rounded bg-synth-primary/10 border border-synth-primary/30 text-synth-primary font-mono">
                  {currentMissionDag.tasks.filter((t) => t.status === "done").length}/{currentMissionDag.tasks.length}
                </span>
              )}
            </div>
            {!currentMissionDag && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500 mb-3">Aucune mission en cours</p>
                <p className="text-[11px] text-gray-600 mb-4">Décris ce que tu veux accomplir et NEXUS s'en occupe.</p>
                <Link to="/classic/ops" className="text-xs px-4 py-2 rounded-lg bg-synth-primary/10 border border-synth-primary/30 text-synth-primary inline-block mr-2 font-mono">Missions</Link>
                <Link to="/classic/integrations" className="text-xs px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white inline-block font-mono">CLI</Link>
              </div>
            )}
            {currentMissionDag && (
              <div className="p-2 h-40">
                <svg viewBox="0 0 100 80" className="w-full h-full">
                  {currentMissionDag.connections?.map((conn) => {
                    const from = currentMissionDag.tasks.find((t) => t.id === conn.from);
                    const to = currentMissionDag.tasks.find((t) => t.id === conn.to);
                    if (!from || !to) return null;
                    return (
                      <line key={`${conn.from}-${conn.to}`} x1={from.x + 10} y1={from.y + 5} x2={to.x} y2={to.y + 5} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                    );
                  })}
                  {currentMissionDag.tasks.map((task) => {
                    const colors = { done: "#00b894", active: "#4ecdc4", queued: "#ffd93d80" };
                    const c = colors[task.status] || colors.queued;
                    return (
                      <g key={task.id}>
                        <rect x={task.x} y={task.y} width={20} height={10} rx={2} fill={`${c}20`} stroke={c} strokeWidth="0.3" />
                        {task.status === "done" && <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle" fill="#00b894" fontSize="3.5" fontFamily="monospace">✓</text>}
                        {task.status === "active" && (
                          <circle cx={task.x + 10} cy={task.y + 5} r="1.5" fill="#4ecdc4"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" /></circle>
                        )}
                        <text x={task.x + 10} y={task.y + 16} textAnchor="middle" fill={c} fontSize="2.2" fontFamily="monospace">{task.label?.slice(0, 12)}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Live feed */}
          <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden h-72 flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-synth-emerald animate-pulse" />
              <span className="text-[10px] font-bold text-synth-emerald tracking-wide font-mono">LIVE FEED</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
              {missionLog.length === 0 && (
                <div className="text-gray-600 text-center py-8">En attente...</div>
              )}
              {missionLog.map((log, i) => {
                const agent = agents.find((a) => a.name === log.agent);
                const typeColors = { tool_call: "#ffd93d", output: "#00b894", thinking: "#6c5ce7" };
                const tc = typeColors[log.type] || "#9ca3af";
                return (
                  <div key={i} className="py-1.5 border-b border-white/5 animate-fade-in">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-600 shrink-0">{log.time}</span>
                      <span className="font-semibold shrink-0" style={{ color: agent?.color || "#dfe6e9" }}>{log.agent}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border shrink-0" style={{ background: `${tc}15`, color: tc, borderColor: `${tc}30` }}>{log.type}</span>
                    </div>
                    <div className="text-gray-300 mt-0.5">{log.action}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agents */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-synth-primary tracking-wide font-mono">
              ÉQUIPAGE ({agents.length}/{getPlanLimit("agents")})
            </span>
            <Link
              to="/classic/quarters"
              className="text-[10px] px-3 py-1.5 rounded-lg bg-synth-primary/10 border border-synth-primary/30 text-synth-primary font-mono"
            >
              + Recruter
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                mcps={mcps}
                selected={selectedAgent?.id === agent.id}
                onClick={setSelectedAgent}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "MISSIONS / 24H", value: String(missions?.length ?? 0), color: "text-synth-teal", sub: "ce mois" },
          { label: "TAUX SUCCÈS", value: `${Math.round(agents.reduce((s, a) => s + (a.successRate || 0), 0) / Math.max(agents.length, 1))}%`, color: "text-synth-emerald", sub: "moyenne" },
          { label: "MCPs CONNECTÉS", value: String(connectedMcps), color: "text-synth-primary", sub: `${mcps.reduce((s, m) => s + (m.connected ? m.tools?.length || 0 : 0), 0)} tools` },
          { label: "PLAN", value: "Explorer", color: "text-gray-400", sub: `${getPlanLimit("agents")} agents max` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/6 bg-white/2 p-4">
            <div className="font-mono text-[9px] text-gray-500 tracking-wide mb-1">{stat.label}</div>
            <div className={`font-orbitron text-xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="font-mono text-[10px] text-gray-600 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
