import { useState, useEffect } from "react";
import { useControlsStore, getKeyLabel } from "../store/controlsStore";

const ACTIONS = [
  { key: "forward", label: "Avancer" },
  { key: "backward", label: "Reculer" },
  { key: "left", label: "Gauche" },
  { key: "right", label: "Droite" },
  { key: "jump", label: "Sauter" },
  { key: "run", label: "Sprint" },
  { key: "interact", label: "Interagir" },
  { key: "menu", label: "Menu" },
];

export default function SettingsModal({ onClose }) {
  const {
    keyBindings,
    mouseSensitivity,
    moveSpeed,
    runMultiplier,
    invertY,
    setKeyBinding,
    setMouseSensitivity,
    setMoveSpeed,
    setRunMultiplier,
    setInvertY,
    resetKeys,
  } = useControlsStore();

  const [listeningFor, setListeningFor] = useState(null);

  useEffect(() => {
    if (!listeningFor) return;
    const onKeyDown = (e) => {
      e.preventDefault();
      setKeyBinding(listeningFor, e.code);
      setListeningFor(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [listeningFor, setKeyBinding]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rounded-2xl border border-amber-500/30 bg-[#0c0a14] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-sm font-bold text-amber-400">Réglages</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white font-mono text-lg leading-none">
            ×
          </button>
        </div>

        <section className="mb-6">
          <h4 className="font-jetbrains text-xs font-semibold text-gray-400 mb-3">Touches</h4>
          <ul className="space-y-2">
            {ACTIONS.map(({ key, label }) => (
              <li key={key} className="flex justify-between items-center font-jetbrains text-sm gap-4">
                <span className="text-gray-300">{label}</span>
                <button
                  type="button"
                  onClick={() => setListeningFor(listeningFor === key ? null : key)}
                  className={`px-3 py-1.5 rounded-lg border text-xs min-w-[80px] ${
                    listeningFor === key
                      ? "border-amber-400 bg-amber-500/20 text-amber-300 animate-pulse"
                      : "border-white/20 bg-white/5 text-cyan-300 hover:border-cyan-500/50"
                  }`}
                >
                  {listeningFor === key ? "Appuie sur une touche…" : getKeyLabel(keyBindings[key]) || keyBindings[key]}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={resetKeys}
            className="mt-3 font-jetbrains text-[10px] text-gray-500 hover:text-cyan-400"
          >
            Réinitialiser les touches
          </button>
        </section>

        <section className="mb-6">
          <h4 className="font-jetbrains text-xs font-semibold text-gray-400 mb-3">Souris & déplacement</h4>
          <div className="space-y-4">
            <div>
              <label className="font-jetbrains text-[10px] text-gray-500 block mb-1">Sensibilité souris</label>
              <input
                type="range"
                min="0.0005"
                max="0.008"
                step="0.00025"
                value={mouseSensitivity}
                onChange={(e) => setMouseSensitivity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="font-jetbrains text-[10px] text-gray-500">{mouseSensitivity.toFixed(4)}</span>
            </div>
            <div>
              <label className="font-jetbrains text-[10px] text-gray-500 block mb-1">Vitesse de déplacement</label>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={moveSpeed}
                onChange={(e) => setMoveSpeed(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500"
              />
              <span className="font-jetbrains text-[10px] text-gray-500">{moveSpeed}</span>
            </div>
            <div>
              <label className="font-jetbrains text-[10px] text-gray-500 block mb-1">Multiplicateur sprint</label>
              <input
                type="range"
                min="1.2"
                max="3.5"
                step="0.1"
                value={runMultiplier}
                onChange={(e) => setRunMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="font-jetbrains text-[10px] text-gray-500">×{runMultiplier.toFixed(1)}</span>
            </div>
            <label className="flex items-center gap-2 font-jetbrains text-sm text-gray-300">
              <input
                type="checkbox"
                checked={invertY}
                onChange={(e) => setInvertY(e.target.checked)}
                className="rounded accent-amber-500"
              />
              Inverser l’axe Y (souris)
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
