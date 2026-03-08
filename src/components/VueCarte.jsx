import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useWorldStore } from "../store/worldStore";
import { STATUS_CONFIG } from "../lib/constants";

const ZONES = [
  { id: "hub",      name: "Hub Central",  agent: "NEXUS",     role: "Orchestrateur", x: 300, y: 200, color: "#ff6b35", path: "/classic",         icon: "◈" },
  { id: "data",     name: "Data Center",  agent: "DATAFLOW",  role: "Data Ops",      x: 140, y: 100, color: "#6c5ce7", path: "/classic/quarters", icon: "◎" },
  { id: "analysis", name: "Labo Analyse", agent: "PRISME",    role: "Analyste",      x: 460, y: 100, color: "#74b9ff", path: "/classic/quarters", icon: "◉" },
  { id: "archive",  name: "Archives",     agent: "SCRIBE",    role: "Rédacteur",     x: 100, y: 300, color: "#ffd93d", path: "/classic/log",      icon: "▣" },
  { id: "comms",    name: "Tour Comms",   agent: "SIGNAL",    role: "Communicant",   x: 500, y: 220, color: "#00b894", path: "/classic/quarters", icon: "◇" },
  { id: "phantom",  name: "Zone Rôdeur",  agent: "SPIDER",    role: "Scraper",       x: 380, y: 350, color: "#ff6b6b", path: "/classic/armory",   icon: "◆" },
  { id: "forge",    name: "Forge Code",   agent: "CODEFORGE", role: "Développeur",   x: 200, y: 370, color: "#fd79a8", path: "/classic/ops",      icon: "⬡" },
];

const LINKS = [
  ["hub", "data"], ["hub", "analysis"], ["hub", "comms"],
  ["hub", "archive"], ["hub", "phantom"], ["hub", "forge"],
  ["data", "archive"], ["analysis", "comms"], ["phantom", "forge"],
];

function getZone(id) {
  return ZONES.find((z) => z.id === id);
}

export default function VueCarte({ onBackTo3D, onSelectAgent }) {
  const { agents, missionLog, missions } = useStore();
  const getZoneLevel = useWorldStore((s) => s.getZoneLevel);
  const [hoveredZone, setHoveredZone] = useState(null);
  const recentLog = missionLog.slice(-8).reverse();

  const activeMission = useMemo(() => {
    return missions.find((m) => m.status === "running" || m.status === "pending");
  }, [missions]);

  const agentByName = useMemo(() => {
    const map = {};
    agents.forEach((a) => { map[a.name] = a; });
    return map;
  }, [agents]);

  return (
    <div className="fixed inset-0 bg-[#050810] text-gray-200 flex flex-col overflow-hidden z-10">
      {/* SVG Map */}
      <div className="flex-1 relative overflow-hidden">
        <svg viewBox="0 0 600 450" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0d1424" />
              <stop offset="100%" stopColor="#050810" />
            </radialGradient>
          </defs>

          <rect width="600" height="450" fill="url(#bgGrad)" />

          {/* Grid dots */}
          {Array.from({ length: 15 }).map((_, ix) =>
            Array.from({ length: 11 }).map((_, iy) => (
              <circle key={`${ix}-${iy}`} cx={40 * ix + 20} cy={40 * iy + 25} r="0.5" fill="rgba(255,255,255,0.03)" />
            ))
          )}

          {/* Links between zones */}
          {LINKS.map(([fromId, toId]) => {
            const from = getZone(fromId);
            const to = getZone(toId);
            if (!from || !to) return null;
            const isActive = hoveredZone === fromId || hoveredZone === toId;
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray={isActive ? "none" : "4,6"}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Zones */}
          {ZONES.map((zone) => {
            const level = getZoneLevel(zone.id);
            const locked = level < 1 && zone.id !== "hub";
            const agent = agentByName[zone.agent];
            const isHovered = hoveredZone === zone.id;
            const statusCfg = agent ? (STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle) : STATUS_CONFIG.idle;

            return (
              <g
                key={zone.id}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer"
                onClick={() => {
                  if (agent && onSelectAgent) onSelectAgent(agent);
                }}
                style={{ opacity: locked ? 0.35 : 1 }}
              >
                {/* Zone pulse ring */}
                {agent?.status === "active" && (
                  <circle cx={zone.x} cy={zone.y} r={isHovered ? 38 : 32} fill="none" stroke={zone.color} strokeWidth="0.5" opacity="0.3">
                    <animate attributeName="r" from="32" to="44" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Zone circle */}
                <circle
                  cx={zone.x} cy={zone.y}
                  r={isHovered ? 30 : 26}
                  fill={locked ? "rgba(255,255,255,0.02)" : `${zone.color}10`}
                  stroke={locked ? "rgba(255,255,255,0.08)" : zone.color}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={isHovered ? 1 : 0.8}
                  className="transition-all duration-200"
                  filter={isHovered ? "url(#glow)" : undefined}
                />

                {/* Icon */}
                <text x={zone.x} y={zone.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill={locked ? "#333" : zone.color}>
                  {locked ? "?" : zone.icon}
                </text>

                {/* Zone name */}
                <text x={zone.x} y={zone.y + 42} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono" fill={locked ? "#333" : "#9ca3af"} fontWeight="600">
                  {locked ? "Verrouillée" : zone.name}
                </text>

                {/* Agent name + status */}
                {!locked && agent && (
                  <>
                    <text x={zone.x} y={zone.y + 53} textAnchor="middle" fontSize="7" fontFamily="JetBrains Mono" fill={zone.color} opacity="0.8">
                      {zone.agent}
                    </text>
                    <circle cx={zone.x + 22} cy={zone.y - 22} r="3" fill={statusCfg.dot} />
                  </>
                )}

                {/* Hover tooltip */}
                {isHovered && !locked && (
                  <g>
                    <rect x={zone.x - 60} y={zone.y - 55} width="120" height="24" rx="4" fill="rgba(8,12,21,0.95)" stroke={`${zone.color}30`} strokeWidth="1" />
                    <text x={zone.x} y={zone.y - 40} textAnchor="middle" fontSize="8" fontFamily="JetBrains Mono" fill={zone.color}>
                      {zone.role} · Clic pour parler
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active mission indicator */}
          {activeMission && (
            <g>
              <rect x="200" y="5" width="200" height="22" rx="4" fill="rgba(255,107,53,0.1)" stroke="rgba(255,107,53,0.3)" strokeWidth="1" />
              <circle cx="212" cy="16" r="3" fill="#ff6b35">
                <animate attributeName="opacity" from="1" to="0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x="220" y="19" fontSize="8" fontFamily="JetBrains Mono" fill="#ff6b35">
                Mission : {(activeMission.title || "").slice(0, 25)}...
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom panel: Activity feed + Navigation */}
      <div className="flex-shrink-0 border-t border-white/5 bg-[#080c15]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-4">
          {/* Quick nav */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-wider mb-0.5">Navigation</p>
            {[
              { label: "Dashboard", path: "/classic", color: "#ff6b35" },
              { label: "Ops Room", path: "/classic/ops", color: "#00f5ff" },
              { label: "Armurerie", path: "/classic/armory", color: "#a855f7" },
              { label: "Journal", path: "/classic/log", color: "#ffd93d" },
            ].map((nav) => (
              <Link
                key={nav.path}
                to={nav.path}
                className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all"
                style={{ color: nav.color }}
              >
                {nav.label}
              </Link>
            ))}
          </div>

          {/* Activity feed */}
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-wider mb-1.5">Activité récente</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {recentLog.length === 0 ? (
                <p className="text-[10px] text-gray-600 font-mono">Aucune activité. Lance une mission depuis l'Ops Room.</p>
              ) : (
                recentLog.map((entry, i) => (
                  <div key={i} className="flex gap-2 items-baseline text-[10px] font-mono">
                    <span className="text-gray-600 shrink-0">{entry.time}</span>
                    <span className="font-bold shrink-0" style={{ color: entry.agent === "SYSTÈME" ? "#4ecdc4" : "#6c5ce7" }}>
                      {entry.agent}
                    </span>
                    <span className="text-gray-500 truncate">{entry.action}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Crew summary */}
          <div className="flex-shrink-0">
            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-wider mb-1.5">Équipe</p>
            <div className="flex flex-col gap-1">
              {agents.slice(0, 7).map((a) => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.idle;
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectAgent?.(a)}
                    className="flex items-center gap-1.5 text-left hover:bg-white/5 rounded px-1.5 py-0.5 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                    <span className="text-[9px] font-mono" style={{ color: a.color }}>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
