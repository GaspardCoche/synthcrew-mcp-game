import { hasDoneOnboarding, setOnboardingDone } from "../lib/onboarding";

export default function OnboardingOverlay({ onClose }) {
  const handleStart = () => {
    setOnboardingDone();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-[#0d0a18]/98 p-6 shadow-2xl text-center">
        <h2 className="font-orbitron text-lg font-bold text-cyan-400 mb-2">Bienvenue sur SynthCrew</h2>
        <p className="text-sm text-gray-400 mb-4">
          Tu es dans ton <strong className="text-gray-300">univers d’agents IA</strong>. Explore avec la souris, clique sur les <strong className="text-cyan-300">orbes colorés</strong> pour découvrir chaque agent, ou sur l’orbe <strong className="text-amber-400">doré (NOVA)</strong> si tu es perdu.
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Utilise les <strong>templates de mission</strong> pour automatiser l’automatisation : une mission = un plan multi-étapes exécuté par ton équipage. Niveau, XP et achievements se débloquent au fil de l’eau.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold text-sm"
        >
          C’est parti
        </button>
      </div>
    </div>
  );
}
