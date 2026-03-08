export default function GuideOverlay({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-[#0d0a18]/98 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderLeftColor: "#fbbf24", borderLeftWidth: "4px" }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-amber-500/20 border border-amber-500/40">
            ◆
          </div>
          <div>
            <h2 className="font-bold text-lg text-amber-400">NOVA</h2>
            <p className="text-sm text-gray-400">Ton guide · Toujours à tes côtés</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Je suis ton guide dans SynthCrew. <strong className="text-amber-200">Clique sur un agent</strong> pour voir son rôle (Data, Analyse, Coms, Code…) et ce qu’il apporte à tes workflows. Passe par le <strong className="text-cyan-300">Tableau de bord</strong> pour lancer des missions et suivre l’équipage.
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Projet pro & éducatif : la colonie reflète l’état réel de tes missions et de tes agents.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 hover:bg-white/5 text-sm"
          >
            Continuer l’exploration
          </button>
          <a
            href="#/classic"
            className="px-4 py-2 rounded-lg bg-amber-500 text-black font-medium text-sm inline-block hover:bg-amber-400"
          >
            Ouvrir le Village
          </a>
          <a
            href="#/classic/ops"
            className="px-4 py-2 rounded-lg border border-cyan-500/40 text-cyan-400 text-sm inline-block hover:bg-cyan-500/10"
          >
            Aller à l’Atelier
          </a>
        </div>
      </div>
    </div>
  );
}
