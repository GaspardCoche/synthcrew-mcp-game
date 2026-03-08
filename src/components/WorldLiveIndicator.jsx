/**
 * Indicateur "Monde synchronisé" — rendu live des événements (missions, stats).
 */
import { useWorldStore } from "../store/worldStore";

export default function WorldLiveIndicator() {
  const lastWorldUpdateAt = useWorldStore((s) => s.lastWorldUpdateAt);
  const totalMissionsCompleted = useWorldStore((s) => s.totalMissionsCompleted);

  if (lastWorldUpdateAt == null) return null;

  const date = new Date(lastWorldUpdateAt);
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div
      className="synth-panel px-2 py-1.5 flex items-center gap-2"
      title="Le monde 3D se met à jour en direct avec les missions et les stats."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-synth-cyan animate-pulse" />
      <span className="text-[10px] font-mono text-synth-cyan">
        Monde live · {timeStr}
      </span>
      <span className="text-[9px] text-gray-500 font-mono">{totalMissionsCompleted} missions</span>
    </div>
  );
}
