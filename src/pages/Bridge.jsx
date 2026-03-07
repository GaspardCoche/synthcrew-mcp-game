import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { STATUS_CONFIG } from "../lib/constants";
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
          <div className="font-jetbrains text-sm font-bold tracking-wide" style={{ color: agent.color }}>
            {agent.name}
          </div>
          <div className="font-jetbrains text-xs text-gray-400">
            {agent.role} · LVL {agent.level}
          </div>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap mb-2">
        {mcpNames.map((name) => (
          <span
            key={name}
            className="font-jetbrains text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5"
          >
            {name}
          </span>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="font-jetbrains text-[10px] text-gray-500">
          {agent.missions} missions · {agent.successRate}%
        </span>
        <div className="w-12 h-1 bg-white/5 rounded overflow-hidden">
          <div
            className="h-full rounded transition-all duration-1000"
            style={{
              width: `${agent.xp}%`,
              background: `linear-gradient(90deg, ${agent.color}99, ${agent.color})`,
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="flex gap-4 font-jetbrains text-xs text-gray-500 mb-2">
        <span className="text-synth-cyan">⚡ {activeCount} actifs</span>
        <span>◈ {totalMissions} missions</span>
        <span className="text-synth-green">● Système OK</span>
        <span className="ml-auto tracking-wider">{time.toLocaleTimeString("fr-FR", { hour12: false })}</span>
      </div>

      <Link
        to="/classic/ops"
        className="block mb-6 rounded-xl border border-synth-cyan/20 bg-white/[0.02] p-1 flex items-center gap-2"
      >
        <span className="font-orbitron text-xs font-bold text-synth-cyan tracking-wide px-3">MISSION ›</span>
        <span className="flex-1 font-jetbrains text-sm text-gray-400 py-3">Lancer une mission depuis l&apos;Atelier...</span>
        <span className="font-orbitron text-xs font-bold bg-gradient-to-r from-synth-cyan to-blue-500 text-black px-4 py-2 rounded-lg">ATELIER →</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mission active + Live log */}
        <div className="space-y-5">
          <div className="rounded-xl border border-synth-border bg-synth-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-synth-border flex justify-between items-center">
              <div>
                <div className="font-orbitron text-xs font-bold text-synth-cyan tracking-wide">MISSION ACTIVE</div>
                <div className="font-jetbrains text-[10px] text-gray-500 mt-0.5">
                  {currentMissionDag?.title || "Aucune mission en cours"}
                </div>
              </div>
              {currentMissionDag && (
                <span className="font-jetbrains text-[10px] px-2 py-1 rounded bg-synth-cyan/10 border border-synth-cyan/20 text-synth-cyan">
                  {currentMissionDag.tasks.filter((t) => t.status === "done").length}/{currentMissionDag.tasks.length}
                </span>
              )}
            </div>
            {!currentMissionDag && (
              <div className="p-6 text-center">
                <p className="font-jetbrains text-sm text-gray-500 mb-3">Aucune mission en cours</p>
                <p className="font-jetbrains text-[11px] text-gray-600 mb-4">Lance une mission depuis l’Atelier ou envoie-en une via la CLI.</p>
                <Link to="/classic/ops" className="font-jetbrains text-xs px-4 py-2 rounded-lg bg-synth-cyan/10 border border-synth-cyan/30 text-synth-cyan inline-block mr-2">Atelier</Link>
                <Link to="/classic/integrations" className="font-jetbrains text-xs px-4 py-2 rounded-lg bg-white/5 border border-synth-border text-gray-400 hover:text-white inline-block">Connecter la CLI</Link>
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
                      <line
                        key={`${conn.from}-${conn.to}`}
                        x1={from.x + 10}
                        y1={from.y + 5}
                        x2={to.x}
                        y2={to.y + 5}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="0.5"
                        strokeDasharray={to.status === "queued" ? "2,2" : "none"}
                      />
                    );
                  })}
                  {currentMissionDag.tasks.map((task) => {
                    const colors = { done: "#22c55e", active: "#00f0ff", queued: "#f59e0b80" };
                    const c = colors[task.status] || colors.queued;
                    return (
                      <g key={task.id}>
                        <rect
                          x={task.x}
                          y={task.y}
                          width={20}
                          height={10}
                          rx={2}
                          fill={`${c}20`}
                          stroke={c}
                          strokeWidth="0.3"
                        />
                        {task.status === "done" && (
                          <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle" fill="#22c55e" fontSize="3.5" fontFamily="monospace">
                            ✓
                          </text>
                        )}
                        {task.status === "active" && (
                          <circle cx={task.x + 10} cy={task.y + 5} r="1.5" fill="#00f0ff" opacity="0.8">
                            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {task.status === "queued" && (
                          <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle" fill="#f59e0b" fontSize="3" fontFamily="monospace">
                            ⏳
                          </text>
                        )}
                        <text x={task.x + 10} y={task.y + 16} textAnchor="middle" fill={c} fontSize="2.2" fontFamily="monospace">
                          {task.label?.slice(0, 12)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-synth-border bg-synth-panel overflow-hidden h-72 flex flex-col">
            <div className="px-4 py-3 border-b border-synth-border flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-synth-green animate-pulse" />
              <span className="font-orbitron text-xs font-bold text-synth-green tracking-wide">LIVE FEED</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-jetbrains text-[11px]">
              {missionLog.length === 0 && (
                <div className="text-gray-500 text-center py-8">En attente de la prochaine mission...</div>
              )}
              {missionLog.map((log, i) => {
                const agent = agents.find((a) => a.name === log.agent);
                const typeColors = { tool_call: "#f59e0b", output: "#22c55e", thinking: "#a855f7" };
                const tc = typeColors[log.type] || "#9ca3af";
                return (
                  <div key={i} className="py-1.5 border-b border-white/5 animate-fade-in">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 shrink-0">{log.time}</span>
                      <span className="font-semibold shrink-0 min-w-[70px]" style={{ color: agent?.color || "#fff" }}>
                        {log.agent}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border shrink-0" style={{ background: `${tc}15`, color: tc, borderColor: `${tc}30` }}>
                        {log.type}
                      </span>
                    </div>
                    <div className="text-gray-300 mt-0.5 pl-0">{log.action}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Équipage */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-orbitron text-xs font-bold text-gray-400 tracking-wide">
              ÉQUIPAGE ({agents.length}/{getPlanLimit("agents")})
            </span>
            <Link
              to="/classic/quarters"
              className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg bg-synth-purple/10 border border-synth-purple/30 text-synth-purple"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: "MISSIONS / 24H", value: String(missions?.length ?? 0), color: "text-synth-cyan", sub: "ce mois" },
          { label: "TAUX SUCCÈS", value: "95%", color: "text-synth-green", sub: "moyenne" },
          { label: "MCPs CONNECTÉS", value: String(connectedMcps), color: "text-synth-amber", sub: "tools actifs" },
          { label: "PLAN", value: "Explorer", color: "text-gray-400", sub: "3 agents max" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-synth-border bg-synth-panel p-4">
            <div className="font-jetbrains text-[9px] text-gray-500 tracking-wide mb-1">{stat.label}</div>
            <div className={`font-orbitron text-xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="font-jetbrains text-[10px] text-gray-600 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>
    </>
  );
}
