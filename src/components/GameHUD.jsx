import { usePlayerStore } from "../store/playerStore";
import { useWorldStore } from "../store/worldStore";

const NOVA_TARGET = { x: 3, z: -4 };
const AGENT_ORDER = ["DATAFLOW", "PRISME", "SCRIBE", "SIGNAL", "SPIDER", "CODEFORGE"];
const AGENT_LABELS = {
  DATAFLOW: "Dataflow · Data Ops",
  PRISME: "Prisme · Analyste",
  SCRIBE: "Scribe · Rédacteur",
  SIGNAL: "Signal · Comm",
  SPIDER: "Spider · Scraper",
  CODEFORGE: "Codeforge · Dev",
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

function Compass({ playerX, playerZ }) {
  const dx = NOVA_TARGET.x - playerX;
  const dz = NOVA_TARGET.z - playerZ;
  const angle = Math.atan2(dx, -dz);
  const deg = (angle * 180 / Math.PI + 360) % 360;
  const dist = Math.hypot(dx, dz);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-14 h-14 rounded-full border border-synth-primary/40 bg-black/50 flex items-center justify-center relative">
        <div
          className="absolute w-0.5 h-5 bg-gradient-to-t from-synth-primary to-synth-teal rounded-full origin-bottom"
          style={{
            top: "6px", left: "50%",
            transform: `translateX(-50%) rotate(${deg}deg)`,
            transformOrigin: "bottom center",
          }}
        />
        <span className="text-[7px] text-gray-600 font-mono absolute top-0.5 left-1/2 -translate-x-1/2">N</span>
        <span className="text-[7px] text-gray-600 font-mono absolute bottom-0.5 left-1/2 -translate-x-1/2">S</span>
        <span className="text-[7px] text-gray-600 font-mono absolute left-0.5 top-1/2 -translate-y-1/2">O</span>
        <span className="text-[7px] text-gray-600 font-mono absolute right-0.5 top-1/2 -translate-y-1/2">E</span>
      </div>
      <p className="text-[8px] text-gray-500 font-mono tracking-wider">NOVA</p>
      {dist < 8 && <p className="text-[7px] text-synth-cyan font-mono animate-pulse">PROCHE</p>}
    </div>
  );
}

function AgentHealthBar({ name, label, agents, sick, health }) {
  const a = agents.find((x) => x.name === name);
  const status = a?.status ?? "idle";
  const color = AGENT_COLORS[name] || "#888";
  const healthPct = Math.round(health * 100);

  return (
    <div className="flex items-center gap-1.5 group">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: sick ? "#ef4444" : color,
          boxShadow: status === "active" ? `0 0 6px ${color}` : "none",
          animation: status === "active" ? "pulse 2s infinite" : "none",
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[8px] font-mono text-gray-400 truncate">{label}</span>
          {sick && <span className="text-[7px] text-red-400 font-mono">ALERTE</span>}
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${healthPct}%`,
              backgroundColor: sick ? "#ef4444" : color,
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ZoneProgress({ totalMissions }) {
  const unlockedCount = MISSIONS_TO_UNLOCK.filter((m) => totalMissions >= m).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-gray-500 font-mono uppercase tracking-wider">Zones</span>
        <span className="text-[9px] text-synth-primary font-mono font-bold">{unlockedCount}/{ZONE_COUNT}</span>
      </div>
      <div className="flex gap-0.5">
        {MISSIONS_TO_UNLOCK.map((req, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-500"
            style={{
              backgroundColor: totalMissions >= req ? "#ff6b35" : "rgba(255,255,255,0.06)",
              opacity: totalMissions >= req ? 0.8 : 0.4,
            }}
          />
        ))}
      </div>
      {unlockedCount < ZONE_COUNT && (
        <p className="text-[7px] text-gray-600 font-mono mt-0.5">
          Prochaine : {MISSIONS_TO_UNLOCK.find((m) => totalMissions < m) - totalMissions} mission{MISSIONS_TO_UNLOCK.find((m) => totalMissions < m) - totalMissions > 1 ? "s" : ""} restante{MISSIONS_TO_UNLOCK.find((m) => totalMissions < m) - totalMissions > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export default function GameHUD({ agents = [] }) {
  const position = usePlayerStore((s) => s.position);
  const isAgentSick = useWorldStore((s) => s.isAgentSick);
  const getAgentHealth = useWorldStore((s) => s.getAgentHealth);
  const totalMissions = useWorldStore((s) => s.totalMissionsCompleted);

  const objective = totalMissions === 0
    ? "Explore la colonie et rejoins NOVA pour le guide. Lance une mission depuis le tableau de bord."
    : totalMissions < 5
    ? "Continue les missions pour débloquer de nouvelles zones et faire progresser l'équipage."
    : "Gère ton équipage, optimise les workflows et débloque toutes les zones.";

  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-end gap-3 pointer-events-none max-w-[420px]">
      <div className="flex flex-col gap-2 flex-1">
        <div className="synth-panel px-3 py-2">
          <p className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1">Mission</p>
          <p className="text-[10px] text-gray-300 font-jetbrains leading-relaxed">{objective}</p>
        </div>

        <div className="synth-panel px-3 py-2">
          <ZoneProgress totalMissions={totalMissions} />
        </div>

        <div className="synth-panel px-3 py-2">
          <p className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1.5">Équipage</p>
          <div className="flex flex-col gap-1">
            {AGENT_ORDER.map((name) => (
              <AgentHealthBar
                key={name}
                name={name}
                label={AGENT_LABELS[name]}
                agents={agents}
                sick={isAgentSick(name)}
                health={getAgentHealth(name)}
              />
            ))}
          </div>
        </div>
      </div>

      <Compass playerX={position.x} playerZ={position.z} />
    </div>
  );
}
