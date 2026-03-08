import { useState } from "react";
import { hasDoneOnboarding, setOnboardingDone } from "../lib/onboarding";

function WelcomeScreen({ onEnter3D, onEnterDashboard }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-[#0c0a12]">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-transparent to-amber-900/10" />
      <div className="relative max-w-lg w-full flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center mb-2">
          <svg viewBox="0 0 32 32" className="w-10 h-10">
            <defs>
              <linearGradient id="sc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <polygon points="16,4 20,13 28,13 22,19 24,27 16,23 8,27 10,19 4,13 12,13" fill="url(#sc)" opacity="0.9" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-[0.2em] mb-2">Plateforme éducative</p>
          <h1 className="font-orbitron text-2xl font-black text-white tracking-wider mb-2">SYNTHCREW</h1>
          <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            Apprends l'orchestration d'agents IA en explorant un monde interactif.
            Chaque agent a un rôle, chaque mission est un workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mt-2">
          <button
            onClick={onEnter3D}
            className="group relative px-5 py-4 rounded-xl border border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/15 transition-all text-left"
          >
            <p className="text-sm font-bold text-cyan-400 mb-1">Explorer le monde</p>
            <p className="text-[11px] text-gray-500 leading-snug">Parcours la colonie en 3D, rencontre les agents, découvre les zones.</p>
          </button>
          <button
            onClick={onEnterDashboard}
            className="group relative px-5 py-4 rounded-xl border border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 transition-all text-left"
          >
            <p className="text-sm font-bold text-amber-400 mb-1">Tableau de bord</p>
            <p className="text-[11px] text-gray-500 leading-snug">Gère ton équipage, lance des missions, consulte les stats.</p>
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4 text-[10px] text-gray-600 font-mono">
          <span>6 agents spécialisés</span>
          <span>7 zones à débloquer</span>
          <span>XP & achievements</span>
          <span>Missions = workflows</span>
        </div>
      </div>
    </div>
  );
}

function ReturningOnboarding({ onClose }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-[#0d0a18]/98 p-6 shadow-2xl text-center">
        <p className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider mb-1">Plateforme éducative</p>
        <h2 className="font-orbitron text-lg font-bold text-cyan-400 mb-2">Bienvenue sur SynthCrew</h2>
        <p className="text-sm text-gray-400 mb-3">
          SynthCrew <strong className="text-gray-300">gamifie l'usage des agents IA</strong> : tu visualises ton équipage, tu lances des missions (workflows) et tu vois la progression en temps réel.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Explore la colonie 3D, clique sur les <strong className="text-cyan-300">agents</strong> pour voir leurs rôles, et sur l'orbe <strong className="text-amber-400">NOVA</strong> pour le guide.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold text-sm"
        >
          C'est parti
        </button>
      </div>
    </div>
  );
}

export default function OnboardingOverlay({ onClose }) {
  const [isFirstVisit] = useState(() => !hasDoneOnboarding());

  const handleEnter3D = () => {
    setOnboardingDone();
    onClose?.();
  };

  const handleEnterDashboard = () => {
    setOnboardingDone();
    onClose?.();
    window.location.hash = "#/classic";
  };

  if (isFirstVisit) {
    return <WelcomeScreen onEnter3D={handleEnter3D} onEnterDashboard={handleEnterDashboard} />;
  }

  return <ReturningOnboarding onClose={handleEnter3D} />;
}
