import { useState } from "react";
import { useControlsStore, getKeyLabel } from "../store/controlsStore";

const ACTIONS = [
  { key: "forward", label: "Avancer" },
  { key: "backward", label: "Reculer" },
  { key: "left", label: "Gauche" },
  { key: "right", label: "Droite" },
  { key: "jump", label: "Sauter" },
  { key: "run", label: "Sprint" },
  { key: "interact", label: "Interagir" },
  { key: "menu", label: "Menu / Débloquer souris" },
];

const INTERFACE_SHORTCUTS = [
  { key: "`", label: "Terminal CLI" },
  { key: "?", label: "Aide (cette fenêtre)" },
  { key: "H", label: "Aide (identique à ?)" },
  { key: "D", label: "Dashboard" },
  { key: "A", label: "Agents (si souris non verrouillée)" },
  { key: "M", label: "Mission rapide" },
  { key: "C", label: "Carte 2D / 3D" },
];

export default function ControlsHelp({ onClose }) {
  const { keyBindings } = useControlsStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rounded-2xl border border-cyan-500/30 bg-[#0c0a14] p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-orbitron text-sm font-bold text-cyan-400">Raccourcis clavier</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white font-mono text-lg leading-none"
          >
            ×
          </button>
        </div>
        <p className="font-jetbrains text-xs text-gray-400 mb-4">
          Clique sur la scène pour verrouiller la souris et te déplacer en première personne. Tu peux aussi utiliser les <strong>flèches du clavier</strong> (↑ ↓ ← →) comme alternative à WASD.
        </p>
        <p className="font-jetbrains text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Déplacement</p>
        <ul className="space-y-2 mb-4">
          {ACTIONS.map(({ key, label }) => (
            <li key={key} className="flex justify-between items-center font-jetbrains text-sm">
              <span className="text-gray-300">{label}</span>
              <kbd className="px-2 py-1 rounded bg-white/10 border border-cyan-500/30 text-cyan-300 text-xs">
                {getKeyLabel(keyBindings[key]) || keyBindings[key]}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="font-jetbrains text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Interface</p>
        <ul className="space-y-2">
          {INTERFACE_SHORTCUTS.map(({ key, label }) => (
            <li key={key} className="flex justify-between items-center font-jetbrains text-sm">
              <span className="text-gray-300">{label}</span>
              <kbd className="px-2 py-1 rounded bg-white/10 border border-cyan-500/30 text-cyan-300 text-xs">
                {key === "`" ? "`" : key}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="font-jetbrains text-[10px] text-gray-500 mt-4">
          Personnalise les touches de déplacement dans Réglages (icône engrenage).
        </p>
      </div>
    </div>
  );
}
