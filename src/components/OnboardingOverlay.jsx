import { useState, useCallback } from "react";
import { hasDoneOnboarding, setOnboardingDone } from "../lib/onboarding";
import { useProfileStore, PROJECT_TYPES, EXPERIENCE_LEVELS, GOALS } from "../store/profileStore";

function StepDots({ current, total, accent }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            backgroundColor: i === current ? accent : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

function ProfileStep({ profile, onChange }) {
  const toggleGoal = useCallback(
    (g) => {
      const next = profile.goals.includes(g)
        ? profile.goals.filter((x) => x !== g)
        : [...profile.goals, g];
      onChange({ ...profile, goals: next });
    },
    [profile, onChange]
  );

  return (
    <div className="w-full max-w-sm space-y-4">
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
          Ton prénom ou pseudo
        </label>
        <input
          type="text"
          value={profile.username}
          onChange={(e) => onChange({ ...profile, username: e.target.value })}
          placeholder="Ex: Alex"
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/40 transition-colors"
          autoFocus
        />
      </div>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
          Nom du projet (optionnel)
        </label>
        <input
          type="text"
          value={profile.projectName}
          onChange={(e) => onChange({ ...profile, projectName: e.target.value })}
          placeholder="Ex: Mon app, Ma startup..."
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/40 transition-colors"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">
          Type de projet
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(PROJECT_TYPES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...profile, projectType: key })}
              className="text-left text-[10px] font-mono px-3 py-2 rounded-lg border transition-all"
              style={
                profile.projectType === key
                  ? { borderColor: "rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.08)" }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "#9ca3af", background: "transparent" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">
          Ton niveau
        </label>
        <div className="flex gap-2">
          {Object.entries(EXPERIENCE_LEVELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...profile, experienceLevel: key })}
              className="flex-1 text-[10px] font-mono px-3 py-2 rounded-lg border transition-all text-center"
              style={
                profile.experienceLevel === key
                  ? { borderColor: "rgba(255,107,53,0.4)", color: "#ff6b35", background: "rgba(255,107,53,0.08)" }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "#9ca3af", background: "transparent" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">
          Tes objectifs (choisis-en 1 ou plus)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(GOALS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleGoal(key)}
              className="text-left text-[10px] font-mono px-3 py-2 rounded-lg border transition-all"
              style={
                profile.goals.includes(key)
                  ? { borderColor: "rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.08)" }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "#9ca3af", background: "transparent" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onEnter3D, onEnterDashboard }) {
  const setProfileStore = useProfileStore((s) => s.setProfile);
  const existingProfile = useProfileStore((s) => s.getProfile());

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    username: existingProfile.username || "",
    projectName: existingProfile.projectName || "",
    projectType: existingProfile.projectType || "",
    experienceLevel: existingProfile.experienceLevel || "",
    goals: existingProfile.goals || [],
  });

  const STEPS = [
    {
      title: "Bienvenue sur SynthCrew",
      desc: "SynthCrew est un outil d'orchestration d'agents IA. Chaque agent a un rôle, des compétences et s'adapte à ton projet.",
      accent: "#00f5ff",
      icon: (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <defs>
            <linearGradient id="ob-g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <polygon points="16,4 20,13 28,13 22,19 24,27 16,23 8,27 10,19 4,13 12,13" fill="url(#ob-g1)" opacity="0.9" />
        </svg>
      ),
    },
    {
      title: "Parle-nous de toi",
      desc: "Ces infos permettent aux agents de personnaliser leurs réponses et suggestions selon ton contexte.",
      accent: "#a855f7",
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#a855f7" strokeWidth="1.5">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      isProfile: true,
    },
    {
      title: "Ce que tu peux faire",
      desc: "Explore le monde 3D, lance des missions, connecte des outils MCP. Les agents s'adaptent à ton profil.",
      accent: "#ff6b35",
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#ff6b35" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      features: [
        { label: "Monde 3D", desc: "WASD + souris", color: "#00f5ff" },
        { label: "Missions", desc: "Ops Room / CLI", color: "#ff6b35" },
        { label: "Agents", desc: "Clic pour parler", color: "#a855f7" },
        { label: "Outils MCP", desc: "Armurerie", color: "#00ff88" },
      ],
    },
    {
      title: "Comment commencer",
      desc: "Lance ta première mission ou explore la colonie en 3D. Les agents te proposeront des actions adaptées à ton projet.",
      accent: "#00ff88",
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#00ff88" strokeWidth="1.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      shortcuts: [
        { key: "WASD", label: "Déplacer" },
        { key: "`", label: "Terminal" },
        { key: "M", label: "Mission" },
        { key: "?", label: "Aide" },
      ],
    },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isProfileStep = !!current.isProfile;
  const canProceed = !isProfileStep || (profile.username.trim() && profile.projectType && profile.experienceLevel);

  const saveProfile = useCallback(() => {
    if (profile.username.trim()) {
      setProfileStore(profile);
    }
  }, [profile, setProfileStore]);

  const handleNext = () => {
    if (isProfileStep) saveProfile();
    if (isLast) return;
    setStep(step + 1);
  };

  const handleFinish3D = () => {
    saveProfile();
    setOnboardingDone();
    onEnter3D?.();
  };

  const handleFinishDashboard = () => {
    saveProfile();
    setOnboardingDone();
    onEnterDashboard?.();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-[#050810] overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      <div className="relative max-w-md w-full flex flex-col items-center gap-5 py-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 flex-shrink-0"
          style={{ borderColor: `${current.accent}25`, background: `${current.accent}08` }}
        >
          {current.icon}
        </div>

        <div className="text-center space-y-2">
          <h1 className="font-orbitron text-xl font-bold tracking-wide" style={{ color: current.accent }}>
            {current.title}
          </h1>
          <p className="text-sm text-gray-400 font-jetbrains leading-relaxed max-w-sm mx-auto">
            {current.desc}
          </p>
        </div>

        {isProfileStep && <ProfileStep profile={profile} onChange={setProfile} />}

        {current.features && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            {current.features.map((f) => (
              <div key={f.label} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                <p className="text-[10px] font-mono font-bold" style={{ color: f.color }}>{f.label}</p>
                <p className="text-[9px] text-gray-500 font-mono">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {current.shortcuts && (
          <div className="flex items-center gap-3">
            {current.shortcuts.map((s) => (
              <div key={s.key} className="flex flex-col items-center gap-1">
                <span className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[10px] font-mono text-gray-300 font-bold">
                  {s.key}
                </span>
                <span className="text-[8px] text-gray-600 font-mono">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <StepDots current={step} total={STEPS.length} accent={current.accent} />

        <div className="flex items-center gap-3 w-full max-w-xs">
          {!isLast ? (
            <>
              <button
                onClick={handleFinish3D}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 text-xs font-mono transition-all"
              >
                Passer
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: `${current.accent}20`, color: current.accent, border: `1px solid ${current.accent}40` }}
              >
                Suivant
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFinish3D}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold text-xs font-mono transition-all"
                style={{ backgroundColor: "#00f5ff15", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.3)" }}
              >
                Explorer en 3D
              </button>
              <button
                onClick={handleFinishDashboard}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold text-xs font-mono transition-all"
                style={{ backgroundColor: "#ff6b3515", color: "#ff6b35", border: "1px solid rgba(255,107,53,0.3)" }}
              >
                Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReturningOnboarding({ onClose }) {
  const username = useProfileStore((s) => s.username);
  const greeting = username ? `Content de te revoir, ${username}.` : "Ton équipage t'attend.";

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="max-w-sm w-full rounded-xl border border-white/10 bg-[#080c15]/98 p-5 shadow-2xl text-center">
        <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-[0.2em] mb-2">Système en ligne</p>
        <h2 className="font-orbitron text-lg font-bold text-white mb-2">Bienvenue</h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">{greeting}</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          {[
            { key: "WASD", label: "Déplacer" },
            { key: "`", label: "Terminal" },
            { key: "?", label: "Aide" },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 text-[9px] font-mono text-gray-400 font-bold">
                {s.key}
              </span>
              <span className="text-[8px] text-gray-600 font-mono">{s.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="px-8 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-black font-bold text-sm hover:from-cyan-500 hover:to-cyan-400 transition-all"
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
