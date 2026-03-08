export default function GuideOverlay({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded-xl border border-amber-500/20 bg-[#0a0818]/98 p-0 shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent px-6 py-4 border-b border-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
              <span className="text-xl text-amber-400">◆</span>
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-amber-400 tracking-wide">NOVA</h2>
              <p className="text-[10px] text-gray-500 font-mono">Intelligence de guidage · v2.0</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="text-amber-500 text-sm mt-0.5">▸</span>
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-amber-200">Clique sur un agent</strong> pour voir son rôle (Data, Analyse, Coms, Code...) et ses capacités.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-cyan-500 text-sm mt-0.5">▸</span>
              <p className="text-sm text-gray-300 leading-relaxed">
                Accède au <strong className="text-cyan-300">Tableau de bord</strong> pour lancer des missions et observer la progression en temps réel.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-500 text-sm mt-0.5">▸</span>
              <p className="text-sm text-gray-300 leading-relaxed">
                Chaque mission réussie <strong className="text-purple-300">débloque des zones</strong> et fait évoluer l'équipage.
              </p>
            </div>
          </div>

          <div className="bg-white/3 rounded-lg px-3 py-2 border border-white/5">
            <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
              SynthCrew est un projet éducatif : la colonie reflète l'état réel de tes missions et agents IA.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 text-xs font-mono transition-colors"
          >
            Explorer
          </button>
          <a
            href="#/classic"
            className="px-4 py-2 rounded-lg bg-amber-500/90 text-black font-bold text-xs font-mono inline-block hover:bg-amber-400 transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#/classic/ops"
            className="px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono inline-block hover:bg-cyan-500/10 transition-colors"
          >
            Ops Room
          </a>
        </div>
      </div>
    </div>
  );
}
