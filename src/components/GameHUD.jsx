/**
 * HUD type jeu : objectif court, statut équipage, boussole vers NOVA.
 */
import { usePlayerStore } from "../store/playerStore";
import { useWorldStore } from "../store/worldStore";

const NOVA_TARGET = { x: 3, z: -4 };
const AGENT_ORDER = ["SENTINEL", "CIPHER", "ARCHIVIST", "HERALD", "PHANTOM", "FORGE"];
const AGENT_LABELS = {
  SENTINEL: "Sentinel",
  CIPHER: "Cipher",
  ARCHIVIST: "Archivist",
  HERALD: "Herald",
  PHANTOM: "Phantom",
  FORGE: "Forge",
};

function Compass({ playerX, playerZ }) {
  const dx = NOVA_TARGET.x - playerX;
  const dz = NOVA_TARGET.z - playerZ;
  const angle = Math.atan2(dx, -dz);
  const deg = (angle * 180 / Math.PI + 360) % 360;
  const dist = Math.hypot(dx, dz);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-16 h-16 rounded-full border border-synth-copper/50 bg-black/40 flex items-center justify-center relative">
        <div
          className="absolute w-1 h-6 bg-synth-copper rounded-full top-1 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-150"
          style={{ transform: `translate(-50%, -100%) rotate(${deg}deg)` }}
        />
        <span className="text-[8px] text-gray-500 font-mono absolute top-0">N</span>
      </div>
      <p className="text-[9px] text-gray-500 font-mono">NOVA</p>
      {dist < 8 && <p className="text-[8px] text-synth-cyan font-mono">À proximité</p>}
    </div>
  );
}

export default function GameHUD({ agents = [] }) {
  const position = usePlayerStore((s) => s.position);
  const isAgentSick = useWorldStore((s) => s.isAgentSick);
  const totalMissions = useWorldStore((s) => s.totalMissionsCompleted);

  const agentStatusList = AGENT_ORDER.map((name) => {
    const a = agents.find((x) => x.name === name);
    const status = a?.status ?? "idle";
    const sick = isAgentSick(name);
    return { name, label: AGENT_LABELS[name] || name, status, sick };
  });

  const objective = totalMissions === 0
    ? "Explore la colonie et rejoins NOVA (orbe) pour le guide. Puis lance une mission depuis le tableau de bord."
    : "Lance des missions pour débloquer les zones et voir l’équipage évoluer (workflows, XP, erreurs = feedback).";

  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
      <div className="synth-panel px-3 py-2 max-w-[200px]">
        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-1">Objectif</p>
        <p className="text-xs text-gray-200 font-jetbrains">{objective}</p>
      </div>
      <div className="synth-panel px-2 py-2">
        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-1.5 text-center">Équipage</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {agentStatusList.map(({ name, label, status, sick }) => (
            <div
              key={name}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                sick ? "border-red-500/60 bg-red-500/10 text-red-300" : "border-white/20 bg-white/5 text-gray-300"
              }`}
              title={sick ? `${label} · en alerte` : `${label} · ${status}`}
            >
              {label.slice(0, 3)}
              {sick && " ⚠"}
            </div>
          ))}
        </div>
      </div>
      <Compass playerX={position.x} playerZ={position.z} />
    </div>
  );
}
