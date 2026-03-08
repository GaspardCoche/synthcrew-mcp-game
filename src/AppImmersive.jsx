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
import AgentQuickPicker from "./components/AgentQuickPicker";
import { hasDoneOnboarding } from "./lib/onboarding";
import { BuildId } from "./components/BuildId";
import CLITerminal from "./components/CLITerminal";

const API_BASE = "";

function Loader() {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#050810]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-synth-primary/50 border-t-synth-primary rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-mono">Chargement...</p>
      </div>
    </div>
  );
}

const GUIDE_BUBBLE_DELAY_MS = 6000;

function ClickToEnterOverlay({ onActivate }) {
  const [pressed, setPressed] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleClick = useCallback(() => {
    if (activating) return;
    setPressed(true);
    setActivating(true);
    setTimeout(() => {
      onActivate?.();
      setTimeout(() => {
        setPressed(false);
        setActivating(false);
      }, 100);
    }, 120);
  }, [onActivate, activating]);

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => !activating && setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      <div
        className={`synth-panel px-6 py-4 font-mono text-sm flex items-center gap-4 transition-all duration-150 select-none ${
          pressed ? "scale-95 opacity-90 border-synth-primary/50 bg-synth-primary/10" : "hover:border-synth-primary/40 hover:bg-white/5"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
            pressed ? "bg-synth-primary/30 border-synth-primary/60" : "border border-synth-primary/30 bg-synth-primary/5"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-synth-primary" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          </svg>
        </div>
        <div>
          <p className={`text-sm font-semibold transition-colors ${pressed ? "text-synth-primary" : "text-gray-300"}`}>
            {activating ? "Entrée..." : "Clique pour entrer"}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            <span className="text-synth-primary">WASD</span> déplacer · <span className="text-synth-primary">Souris</span> regarder · <span className="text-synth-primary">ESC</span> libérer
          </p>
        </div>
      </div>
    </div>
  );
}

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
  const [showAgentPicker, setShowAgentPicker] = useState(false);

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

  const selectAgent = useCallback((agent) => {
    setSelectedAgent(agent);
    setShowAgentPicker(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (showOnboarding) return;

      // ` = Toggle CLI
      if (e.key === "`" || (e.ctrlKey && e.key === "`")) {
        e.preventDefault();
        setShowCLI((v) => !v);
        if (!showCLI && pointerLocked) document.exitPointerLock?.();
      }
      // M = Quick mission launch
      if (e.key === "m" && !showCLI && !selectedAgent && !e.ctrlKey && !e.metaKey) {
        if (!pointerLocked) {
          e.preventDefault();
          setShowQuickLaunch((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showCLI, showOnboarding, pointerLocked, selectedAgent]);

  const hasOverlay = !!(selectedAgent || guideSelected || showQuickLaunch || showControlsHelp || showSettings || showOnboarding || achievementToast);
  useEffect(() => {
    if (hasOverlay) document.exitPointerLock?.();
  }, [hasOverlay]);

  return (
    <div className="fixed inset-0 bg-[#050810]">
      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-[15]" style={{ boxShadow: "inset 0 0 100px 30px rgba(0,0,0,0.6)" }} />

      <KeyboardControls map={keyboardMap}>
        {/* ── Top Bar ── */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="synth-title-text text-xs font-black tracking-widest leading-none">SYNTHCREW</h1>
                <BuildId className="mt-0.5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                className={`synth-btn-ghost text-[9px] ${showAgentPicker ? "!border-cyan-400/40 !text-cyan-400" : ""}`}
                title="Parler à un agent"
              >
                <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                Agents
              </button>
              <button
                type="button"
                onClick={() => setShowCLI((v) => !v)}
                className={`synth-btn-ghost text-[9px] ${showCLI ? "!border-cyan-400/40 !text-cyan-400 !bg-cyan-400/8" : ""}`}
              >
                Terminal
              </button>
              <button
                type="button"
                onClick={() => setShowQuickLaunch(true)}
                className="synth-btn-primary text-[9px]"
              >
                + Mission
              </button>
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === "3d" ? "2d" : "3d"))}
                className="synth-btn-ghost text-[9px]"
              >
                {viewMode === "3d" ? "Carte" : "3D"}
              </button>
              <a href="#/classic" className="synth-btn-ghost text-[9px]">Dashboard</a>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="synth-btn-ghost text-[9px] px-2"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Agent picker dropdown ── */}
        {showAgentPicker && (
          <AgentQuickPicker onSelect={selectAgent} onClose={() => setShowAgentPicker(false)} />
        )}

        {/* ── Crosshair + Minimap (only in 3D, hidden when overlays) ── */}
        {viewMode === "3d" && !showCLI && <Crosshair visible={pointerLocked} />}
        {viewMode === "3d" && !showCLI && !hasOverlay && <Minimap />}

        {/* ── Bottom-left: Progression + Live indicator (hidden when CLI open) ── */}
        {!showCLI && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
            <ProgressionHUD onAchievement={setAchievementToast} />
            <WorldLiveIndicator />
          </div>
        )}

        {/* ── GameHUD (compact, bottom-right, hidden when CLI open) ── */}
        <GameHUD agents={agents} cliOpen={showCLI} />

        {/* ── Guide bubble (only when idle, not locked, no overlay) ── */}
        {showGuideBubble && !pointerLocked && !showCLI && !hasOverlay && viewMode === "3d" && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-fade-in pointer-events-none">
            <div className="synth-panel px-4 py-2.5 max-w-xs text-center">
              <p className="text-[10px] text-gray-300 font-mono">
                Clique sur un <span className="text-synth-primary font-bold">agent</span> ou utilise le bouton <span className="text-cyan-400 font-bold">Agents</span> en haut.
              </p>
            </div>
          </div>
        )}

        {/* ── Main view (3D or 2D) ── */}
        {viewMode === "2d" ? (
          <VueCarte onBackTo3D={() => setViewMode("3d")} onSelectAgent={selectAgent} />
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

        {/* ── "Click to enter" prompt (clickable, with visual feedback) ── */}
        {!pointerLocked && viewMode === "3d" && !showOnboarding && !showCLI && !hasOverlay && (
          <ClickToEnterOverlay onActivate={() => document.querySelector("canvas")?.click()} />
        )}

        {/* ── Overlays (proper z-index order) ── */}
        {showControlsHelp && <ControlsHelp onClose={() => setShowControlsHelp(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {selectedAgent && <AgentOverlay agent={selectedAgent} onClose={() => setSelectedAgent(null)} />}
        {guideSelected && <GuideOverlay onClose={closeGuide} />}
        {showOnboarding && <OnboardingOverlay onClose={() => setShowOnboarding(false)} />}
        {achievementToast && <AchievementToast achievement={achievementToast} onDismiss={() => setAchievementToast(null)} />}
        {showQuickLaunch && (
          <QuickLaunchModal
            onClose={() => setShowQuickLaunch(false)}
            onMissionLaunched={() => {}}
            onAchievement={setAchievementToast}
            onGoToOpsRoom={() => { window.location.href = "#/classic/ops"; }}
          />
        )}
      </KeyboardControls>

      {/* ── CLI Terminal (on top of everything except onboarding) ── */}
      <AmbientAudio />
      <CLITerminal open={showCLI} onClose={() => setShowCLI(false)} />
    </div>
  );
}
