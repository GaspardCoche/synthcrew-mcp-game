import { useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import { useWorldStore } from "../store/worldStore";

const AGENT_ORDER = ["DATAFLOW", "PRISME", "SCRIBE", "SIGNAL", "SPIDER", "CODEFORGE"];
const AGENT_LABELS = {
  DATAFLOW: "Dataflow",
  PRISME: "Prisme",
  SCRIBE: "Scribe",
  SIGNAL: "Signal",
  SPIDER: "Spider",
  CODEFORGE: "Codeforge",
};
const AGENT_COLORS = {
  DATAFLOW: "#6c5ce7",
  PRISME: "#74b9ff",
  SCRIBE: "#ffd93d",
  SIGNAL: "#00b894",
  SPIDER: "#ff6b6b",
  CODEFORGE: "#fd79a8",
};

const ZONE_COUNT = 7;
const MISSIONS_TO_UNLOCK = [0, 2, 5, 8, 12, 15, 20];

function AgentDot({ name, agents, sick, health }) {
  const a = agents.find((x) => x.name === name);
  const status = a?.status ?? "idle";
  const color = AGENT_COLORS[name] || "#888";
  const healthPct = Math.round(health * 100);

  return (
    <div className="group relative flex items-center gap-1" title={`${AGENT_LABELS[name]} — ${healthPct}% HP`}>
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
        style={{
          backgroundColor: sick ? "#ef4444" : color,
          boxShadow: status === "active" ? `0 0 8px ${color}` : "none",
          animation: status === "active" ? "pulse 2s infinite" : "none",
        }}
      />
      <span className="text-[8px] font-mono text-gray-500 hidden group-hover:inline">{AGENT_LABELS[name]}</span>
      {sick && <span className="text-[6px] text-red-400 font-mono">!</span>}
    </div>
  );
}

export default function GameHUD({ agents = [], cliOpen = false }) {
  const [expanded, setExpanded] = useState(false);
  const isAgentSick = useWorldStore((s) => s.isAgentSick);
  const getAgentHealth = useWorldStore((s) => s.getAgentHealth);
  const totalMissions = useWorldStore((s) => s.totalMissionsCompleted);

  if (cliOpen) return null;

  const unlockedCount = MISSIONS_TO_UNLOCK.filter((m) => totalMissions >= m).length;
  const activeAgents = agents.filter((a) => a.status === "active").length;

  return (
    <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
      {expanded ? (
        <div className="synth-panel px-3 py-2.5 w-52 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">Équipage</span>
            <button onClick={() => setExpanded(false)} className="text-[8px] text-gray-600 hover:text-gray-400 font-mono">
              ▾ Réduire
            </button>
          </div>
          <div className="space-y-1.5 mb-2">
            {AGENT_ORDER.map((name) => {
              const health = getAgentHealth(name);
              const sick = isAgentSick(name);
              const a = agents.find((x) => x.name === name);
              const color = AGENT_COLORS[name] || "#888";
              return (
                <div key={name} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: sick ? "#ef4444" : color,
                      boxShadow: a?.status === "active" ? `0 0 6px ${color}` : "none",
                    }}
                  />
                  <span className="text-[9px] font-mono text-gray-400 flex-1">{AGENT_LABELS[name]}</span>
                  <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.round(health * 100)}%`, backgroundColor: sick ? "#ef4444" : color, opacity: 0.7 }}
                    />
                  </div>
                  <span className="text-[7px] font-mono" style={{ color: sick ? "#ef4444" : "#555" }}>
                    {Math.round(health * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/5 pt-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-gray-500 font-mono">Zones</span>
              <span className="text-[9px] text-synth-primary font-mono font-bold">{unlockedCount}/{ZONE_COUNT}</span>
            </div>
            <div className="flex gap-0.5 mt-0.5">
              {MISSIONS_TO_UNLOCK.map((req, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    backgroundColor: totalMissions >= req ? "#ff6b35" : "rgba(255,255,255,0.06)",
                    opacity: totalMissions >= req ? 0.8 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="synth-panel px-3 py-2 flex items-center gap-2 hover:border-synth-primary/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1">
            {AGENT_ORDER.map((name) => (
              <AgentDot
                key={name}
                name={name}
                agents={agents}
                sick={isAgentSick(name)}
                health={getAgentHealth(name)}
              />
            ))}
          </div>
          <div className="border-l border-white/10 pl-2 ml-1">
            <span className="text-[8px] font-mono text-gray-500">
              {activeAgents > 0 ? (
                <span className="text-green-400">{activeAgents} actif{activeAgents > 1 ? "s" : ""}</span>
              ) : (
                `${unlockedCount}/${ZONE_COUNT} zones`
              )}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
