import { useState, useEffect } from "react";
import { hasDoneOnboarding, setOnboardingDone } from "../lib/onboarding";

function TypewriterText({ text, speed = 30, onDone }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);
  return <>{displayed}<span className="animate-pulse">_</span></>;
}

function WelcomeScreen({ onEnter3D, onEnterDashboard }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-[#060510] overflow-hidden">
      <div className="absolute inset-0 scanlines" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/8 via-transparent to-amber-900/8" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"
            style={{
              left: `${(i / 30) * 100}%`,
              top: `-${Math.random() * 50}%`,
              height: `${60 + Math.random() * 80}%`,
              animationDelay: `${i * 0.2}s`,
              animation: `fall ${8 + Math.random() * 8}s linear infinite`,
              opacity: 0.1 + Math.random() * 0.15,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-lg w-full flex flex-col items-center gap-5">
        <div
          className="transition-all duration-1000"
          style={{ opacity: phase >= 0 ? 1 : 0, transform: `translateY(${phase >= 0 ? 0 : 20}px)` }}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-amber-500/15 border border-cyan-500/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-br from-cyan-500/5 to-amber-500/5" />
            <svg viewBox="0 0 32 32" className="w-10 h-10 relative z-10">
              <defs>
                <linearGradient id="sc-onboard" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <polygon points="16,4 20,13 28,13 22,19 24,27 16,23 8,27 10,19 4,13 12,13" fill="url(#sc-onboard)" opacity="0.9" />
            </svg>
          </div>
        </div>

        <div
          className="text-center transition-all duration-1000 delay-300"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: `translateY(${phase >= 1 ? 0 : 15}px)` }}
        >
          <p className="text-[9px] text-cyan-400/70 font-mono uppercase tracking-[0.3em] mb-3">
            Initialisation du système
          </p>
          <h1 className="synth-title-text text-3xl font-black tracking-wider mb-3">SYNTHCREW</h1>
          <div className="text-sm text-gray-400 font-jetbrains max-w-sm mx-auto leading-relaxed h-12">
            {phase >= 1 && (
              <TypewriterText
                text="Plateforme éducative pour l'orchestration d'agents IA. Explore, apprends, déploie."
                speed={25}
              />
            )}
          </div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mt-3 transition-all duration-700"
          style={{ opacity: phase >= 2 ? 1 : 0, transform: `translateY(${phase >= 2 ? 0 : 15}px)` }}
        >
          <button
            onClick={onEnter3D}
            className="group relative px-5 py-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/15 hover:border-cyan-500/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <p className="text-xs text-gray-600 font-mono mb-1">MODE 3D</p>
              <p className="text-sm font-bold text-cyan-400 mb-1">Explorer le monde</p>
              <p className="text-[10px] text-gray-500 leading-snug">Parcours la colonie, rencontre les agents, découvre les zones.</p>
            </div>
          </button>
          <button
            onClick={onEnterDashboard}
            className="group relative px-5 py-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <p className="text-xs text-gray-600 font-mono mb-1">DASHBOARD</p>
              <p className="text-sm font-bold text-amber-400 mb-1">Tableau de bord</p>
              <p className="text-[10px] text-gray-500 leading-snug">Gère l'équipage, lance des missions, consulte les stats.</p>
            </div>
          </button>
        </div>

        <div
          className="transition-all duration-700"
          style={{ opacity: phase >= 3 ? 1 : 0, transform: `translateY(${phase >= 3 ? 0 : 10}px)` }}
        >
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2 text-[9px] text-gray-600 font-mono">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />6 agents IA</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />7 zones</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />Missions DAG</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />XP & progression</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReturningOnboarding({ onClose }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="max-w-sm w-full rounded-xl border border-cyan-500/20 bg-[#0a0818]/98 p-6 shadow-2xl text-center">
        <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-[0.2em] mb-2">Système en ligne</p>
        <h2 className="font-orbitron text-lg font-bold text-white mb-3">Bienvenue, Commandant</h2>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          Ton équipage t'attend. Explore la colonie, consulte les agents, et lance des missions.
        </p>
        <button
          onClick={onClose}
          className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-black font-bold text-sm hover:from-cyan-500 hover:to-cyan-400 transition-all"
        >
          Reprendre
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
