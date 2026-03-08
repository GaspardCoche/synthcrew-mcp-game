import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Preload } from "@react-three/drei";
import { buildKeyboardMap } from "./store/controlsStore";
import { useControlsStore } from "./store/controlsStore";
import { useStore } from "./store/useStore";
import { useSynthCrewSync } from "./hooks/useSynthCrewSync";
import { useWorldStore } from "./store/worldStore";
import World from "./scenes/World";
import FirstPersonController from "./components/FirstPersonController";
import AgentOverlay from "./components/AgentOverlay";
import GuideOverlay from "./components/GuideOverlay";
import ProgressionHUD from "./components/ProgressionHUD";
import GameHUD from "./components/GameHUD";
import WorldLiveIndicator from "./components/WorldLiveIndicator";
import AchievementToast from "./components/AchievementToast";
import QuickLaunchModal from "./components/QuickLaunchModal";
import OnboardingOverlay from "./components/OnboardingOverlay";
import ControlsHelp from "./components/ControlsHelp";
import SettingsModal from "./components/SettingsModal";
import VueCarte from "./components/VueCarte";
import Crosshair from "./components/Crosshair";
import Minimap from "./components/Minimap";
import AmbientAudio from "./components/AmbientAudio";
import { hasDoneOnboarding } from "./lib/onboarding";
import { BuildId } from "./components/BuildId";
import CLITerminal from "./components/CLITerminal";

const API_BASE = "";

function Loader() {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#0c0a12]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-amber-500/50 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-mono">Chargement de l’univers...</p>
      </div>
    </div>
  );
}

const GUIDE_BUBBLE_DELAY_MS = 5500;

export default function AppImmersive() {
  useSynthCrewSync();
  const storeAgents = useStore((s) => s.agents);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [guideSelected, setGuideSelected] = useState(false);
  const [showGuideBubble, setShowGuideBubble] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [achievementToast, setAchievementToast] = useState(null);
  const [showQuickLaunch, setShowQuickLaunch] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [showControlsHelp, setShowControlsHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState("3d");
  const [showCLI, setShowCLI] = useState(false);

  const keyBindings = useControlsStore((s) => s.keyBindings);
  const keyboardMap = useMemo(() => buildKeyboardMap(keyBindings), [keyBindings]);

  useEffect(() => {
    setShowOnboarding(!hasDoneOnboarding());
  }, []);

  useEffect(() => {
    if (storeAgents && storeAgents.length > 0) setAgents(storeAgents);
    else {
      fetch(`${API_BASE}/api/agents`)
        .then((r) => r.json())
        .then(setAgents)
        .catch(() => setAgents([]));
    }
  }, [storeAgents]);

  useEffect(() => {
    const t = setInterval(() => useWorldStore.getState().tickRecovery(), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (selectedAgent || guideSelected) {
      setShowGuideBubble(false);
      return;
    }
    const t = setTimeout(() => setShowGuideBubble(true), GUIDE_BUBBLE_DELAY_MS);
    return () => clearTimeout(t);
  }, [selectedAgent, guideSelected]);

  const onGuideClick = useCallback(() => {
    setGuideSelected(true);
    setShowGuideBubble(false);
  }, []);

  const closeGuide = useCallback(() => setGuideSelected(false), []);

  // CLI keyboard shortcut: backtick ` or ctrl+`
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === "`" || (e.ctrlKey && e.key === "`")) && !showOnboarding) {
        e.preventDefault();
        setShowCLI((v) => !v);
        if (!showCLI && pointerLocked && typeof document !== "undefined") {
          document.exitPointerLock();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showCLI, showOnboarding, pointerLocked]);

  const hasOverlay = !!(selectedAgent || guideSelected || showQuickLaunch || showControlsHelp || showSettings || showOnboarding || achievementToast);
  useEffect(() => {
    if (hasOverlay && typeof document !== "undefined") document.exitPointerLock();
  }, [hasOverlay]);

  return (
    <div className="fixed inset-0 bg-[#0c0a12]">
      {/* CSS vignette — zero GPU cost */}
      <div className="pointer-events-none fixed inset-0 z-[15]" style={{ boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.65)" }} />

      <KeyboardControls map={keyboardMap}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-start justify-between px-4 pt-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="synth-title-text text-sm font-black tracking-widest">SYNTHCREW</h1>
            <p className="text-[9px] text-gray-500 font-jetbrains">AI Agent Orchestration</p>
            <BuildId className="mt-0.5" />
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <a href="#/classic" className="synth-btn-ghost text-[9px]">Dashboard</a>
            <button type="button" onClick={() => setShowCLI((v) => !v)} className={`synth-btn-ghost text-[9px] ${showCLI ? "!border-cyan-400/50 !text-cyan-400 !bg-cyan-400/10" : ""}`}>
              Terminal
            </button>
            <button type="button" onClick={() => setShowQuickLaunch(true)} className="synth-btn-primary text-[9px]">
              + Mission
            </button>
            <button type="button" onClick={() => setViewMode((m) => (m === "3d" ? "2d" : "3d"))} className="synth-btn-ghost text-[9px]">
              {viewMode === "3d" ? "Carte" : "3D"}
            </button>
            <button type="button" onClick={() => setShowSettings(true)} className="synth-btn-ghost text-[9px]">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </div>

      <Crosshair visible={pointerLocked} />
      {viewMode === "3d" && <Minimap />}

      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
        <ProgressionHUD onAchievement={setAchievementToast} />
        <WorldLiveIndicator />
      </div>
      <GameHUD agents={agents} />

      {showGuideBubble && !pointerLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-fade-in pointer-events-none">
          <div className="synth-panel px-4 py-3 max-w-xs text-center">
            <p className="text-xs text-gray-200">
              Clique sur <span className="font-semibold text-synth-primary">NOVA</span> (orbe) ou un agent · ou ouvre la <span className="font-semibold text-synth-primary">Vue carte</span>.
            </p>
          </div>
        </div>
      )}

      {viewMode === "2d" ? (
        <VueCarte onBackTo3D={() => setViewMode("3d")} />
      ) : (
      <Suspense fallback={<Loader />}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 18], fov: 60, near: 0.5, far: 200 }}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
          performance={{ min: 0.3 }}
          dpr={[1, 1.5]}
        >
          <World
            agents={agents}
            onSelectAgent={setSelectedAgent}
            selectedAgent={selectedAgent}
            onGuideClick={onGuideClick}
            guideSelected={guideSelected}
          />
          <FirstPersonController
            onLock={() => setPointerLocked(true)}
            onUnlock={() => setPointerLocked(false)}
            enabled={true}
          />
          <Preload all />
        </Canvas>
      </Suspense>
      )}

      {!pointerLocked && viewMode === "3d" && !showOnboarding && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="synth-panel px-6 py-4 font-jetbrains text-sm text-gray-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-synth-primary/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-synth-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Clique pour entrer</p>
              <p className="text-[10px] text-gray-600"><span className="text-synth-primary">WASD</span> déplacer · <span className="text-synth-primary">Souris</span> regarder · <span className="text-synth-primary">Échap</span> libérer</p>
            </div>
          </div>
        </div>
      )}

      {showControlsHelp && <ControlsHelp onClose={() => setShowControlsHelp(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {selectedAgent && (
        <AgentOverlay agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {guideSelected && <GuideOverlay onClose={closeGuide} />}

      {showOnboarding && <OnboardingOverlay onClose={() => setShowOnboarding(false)} />}
      {achievementToast && (
        <AchievementToast achievement={achievementToast} onDismiss={() => setAchievementToast(null)} />
      )}
      {showQuickLaunch && (
        <QuickLaunchModal
          onClose={() => setShowQuickLaunch(false)}
          onMissionLaunched={() => {}}
          onAchievement={setAchievementToast}
          onGoToOpsRoom={() => { window.location.href = "#/classic/ops"; }}
        />
      )}
      </KeyboardControls>
      <AmbientAudio />
      <CLITerminal open={showCLI} onClose={() => setShowCLI(false)} />
    </div>
  );
}
