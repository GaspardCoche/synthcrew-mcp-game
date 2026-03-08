import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { STATUS_CONFIG } from "../lib/constants";

const LIEUX = [
  { id: "village", name: "Centre du village", icon: "◈", path: "/classic", desc: "Vue d’ensemble, missions rapides" },
  { id: "equipe", name: "Équipe", icon: "◎", path: "/classic/quarters", desc: "Recruter et gérer les agents" },
  { id: "outils", name: "Outils", icon: "⬡", path: "/classic/armory", desc: "MCPs et outils connectés" },
  { id: "atelier", name: "Atelier", icon: "▣", path: "/classic/ops", desc: "Lancer des missions, voir l’exécution" },
  { id: "chroniques", name: "Chroniques", icon: "≡", path: "/classic/log", desc: "Historique et achievements" },
];

export default function VueCarte({ onBackTo3D }) {
  const { agents, missionLog } = useStore();
  const recentLog = missionLog.slice(-12).reverse();

  return (
    <div className="min-h-screen bg-[#0c0a12] text-gray-200 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="font-orbitron text-lg font-bold text-cyan-400 tracking-wide">Vue carte · Village</h1>
          <button type="button" onClick={onBackTo3D} className="font-jetbrains text-xs text-gray-500 hover:text-cyan-400">
            Retour 3D
          </button>
        </header>

        <section>
          <h2 className="font-jetbrains text-xs font-semibold text-gray-500 mb-3">LIEUX</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LIEUX.map((lieu) => (
              <Link
                key={lieu.id}
                to={lieu.path}
                className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
              >
                <span className="text-2xl block mb-1">{lieu.icon}</span>
                <div className="font-jetbrains font-semibold text-sm text-white">{lieu.name}</div>
                <div className="font-jetbrains text-[10px] text-gray-500 mt-0.5">{lieu.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-jetbrains text-xs font-semibold text-gray-500 mb-3">ÉQUIPE</h2>
          <div className="flex flex-wrap gap-2">
            {agents.map((a) => {
              const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.idle;
              return (
                <div
                  key={a.id}
                  className="rounded-lg border px-3 py-2 flex items-center gap-2 font-jetbrains text-xs"
                  style={{ borderColor: cfg.border, background: cfg.bg }}
                >
                  <span className="text-lg">{a.avatar || "◆"}</span>
                  <span style={{ color: a.color }}>{a.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-jetbrains text-xs font-semibold text-gray-500 mb-3">FLUX D’ACTIVITÉ (en direct)</h2>
          <div className="rounded-xl border border-synth-cyan/20 bg-black/30 p-4 min-h-[200px]">
            {recentLog.length === 0 ? (
              <p className="font-jetbrains text-xs text-gray-500">Aucune activité récente. Lance une mission depuis l’Atelier.</p>
            ) : (
              <ul className="space-y-2 font-jetbrains text-[11px]">
                {recentLog.map((entry, i) => (
                  <li key={i} className="flex gap-2 items-start border-b border-white/5 pb-2 last:border-0">
                    <span className="text-gray-500 shrink-0">{entry.time}</span>
                    <span className="font-semibold shrink-0" style={{ color: entry.agent === "SYSTÈME" ? "#4ecdc4" : "#6c5ce7" }}>
                      {entry.agent}
                    </span>
                    <span className="text-gray-400">{entry.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="font-jetbrains text-[10px] text-gray-600 mt-2">
            Comme Pixel Agent : chaque action des agents s’affiche ici en temps réel pendant une mission.
          </p>
        </section>
      </div>
    </div>
  );
}
