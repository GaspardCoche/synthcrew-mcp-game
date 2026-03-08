import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
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
import { hasDoneOnboarding } from "./lib/onboarding";
import { BuildId } from "./components/BuildId";

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

  const hasOverlay = !!(selectedAgent || guideSelected || showQuickLaunch || showControlsHelp || showSettings || showOnboarding || achievementToast);
  useEffect(() => {
    if (hasOverlay && typeof document !== "undefined") document.exitPointerLock();
  }, [hasOverlay]);

  return (
    <div className="fixed inset-0 bg-[#0c0a12]">
      <KeyboardControls map={keyboardMap}>
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1">
        <h1 className="synth-title-text text-sm font-black tracking-widest">SYNTHCREW</h1>
        <p className="text-[10px] text-gray-500 font-jetbrains">Plateforme éducative — Gamifier l’orchestration d’agents IA</p>
        <p className="text-[10px] text-gray-600 font-jetbrains mt-0.5">WASD · Clique pour verrouiller · Échap pour libérer</p>
        <BuildId className="sm:inline mt-1" />
      </div>
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end pointer-events-auto">
        <a href="#/classic" className="font-jetbrains text-[10px] text-gray-500 hover:text-synth-copper transition-colors">
          Tableau de bord →
        </a>
        <button type="button" onClick={() => setShowQuickLaunch(true)} className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg border border-synth-copper/40 text-synth-copper hover:bg-synth-copper-bg">
          Lancer une mission
        </button>
        <button type="button" onClick={() => setShowControlsHelp(true)} className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg border border-white/20 text-gray-400 hover:text-white">
          Raccourcis
        </button>
        <button type="button" onClick={() => setShowSettings(true)} className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg border border-white/20 text-gray-400 hover:text-white" title="Réglages">
          Réglages
        </button>
        <button type="button" onClick={() => setViewMode((m) => (m === "3d" ? "2d" : "3d"))} className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg border border-synth-copper/30 text-synth-copper hover:bg-synth-copper-bg">
          {viewMode === "3d" ? "Vue carte" : "Vue 3D"}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
        <ProgressionHUD onAchievement={setAchievementToast} />
        <WorldLiveIndicator />
      </div>
      <GameHUD agents={agents} />

      {showGuideBubble && !pointerLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-fade-in pointer-events-none">
          <div className="synth-panel px-4 py-3 max-w-xs text-center">
            <p className="text-xs text-gray-200">
              Clique sur <span className="font-semibold text-synth-copper">NOVA</span> (orbe) ou un agent · ou ouvre la <span className="font-semibold text-synth-copper">Vue carte</span>.
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
          camera={{ position: [0, 2, 18], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
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
          <EffectComposer>
            <Bloom intensity={0.35} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
            <Vignette offset={0.35} darkness={0.45} blendFunction={BlendFunction.NORMAL} />
            <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0004, 0.0004]} />
          </EffectComposer>
          <Preload all />
        </Canvas>
      </Suspense>
      )}

      {!pointerLocked && viewMode === "3d" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="synth-panel px-6 py-4 font-jetbrains text-sm text-gray-200">
            Clique sur la scène · <span className="text-synth-copper">WASD</span> pour avancer · Souris pour regarder
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
    </div>
  );
}
