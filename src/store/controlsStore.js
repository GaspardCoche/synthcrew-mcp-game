import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_BINDINGS = {
  forward: "KeyW",
  backward: "KeyS",
  left: "KeyA",
  right: "KeyD",
  jump: "Space",
  run: "ShiftLeft",
  interact: "KeyE",
  menu: "Escape",
};

const ARROW_KEYS = {
  forward: ["ArrowUp"],
  backward: ["ArrowDown"],
  left: ["ArrowLeft"],
  right: ["ArrowRight"],
};

const KEY_LABELS = {
  KeyW: "W",
  KeyS: "S",
  KeyA: "A",
  KeyD: "D",
  KeyE: "E",
  Space: "Espace",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  ControlLeft: "Ctrl",
  Escape: "Échap",
  KeyQ: "Q",
  KeyZ: "Z",
  KeyR: "R",
  KeyF: "F",
  KeyC: "C",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

export function getKeyLabel(code) {
  return KEY_LABELS[code] || code?.replace("Key", "") || code;
}

export const useControlsStore = create(
  persist(
    (set) => ({
      keyBindings: DEFAULT_BINDINGS,
      mouseSensitivity: 0.002,
      moveSpeed: 12,
      runMultiplier: 2.2,
      invertY: false,
      setKeyBinding: (action, code) =>
        set((s) => ({
          keyBindings: { ...s.keyBindings, [action]: code },
        })),
      setMouseSensitivity: (v) => set({ mouseSensitivity: v }),
      setMoveSpeed: (v) => set({ moveSpeed: v }),
      setRunMultiplier: (v) => set({ runMultiplier: v }),
      setInvertY: (v) => set({ invertY: v }),
      resetKeys: () => set({ keyBindings: { ...DEFAULT_BINDINGS } }),
    }),
    { name: "synthcrew-controls" }
  )
);

/** Construit la map pour KeyboardControls (drei) à partir des keyBindings. */
export function buildKeyboardMap(keyBindings) {
  const b = keyBindings || DEFAULT_BINDINGS;
  return [
    { name: "forward", keys: [b.forward, "ArrowUp"] },
    { name: "backward", keys: [b.backward, "ArrowDown"] },
    { name: "left", keys: [b.left, "ArrowLeft"] },
    { name: "right", keys: [b.right, "ArrowRight"] },
    { name: "jump", keys: [b.jump], up: true },
    { name: "run", keys: [b.run], up: true },
    { name: "interact", keys: [b.interact], up: true },
    { name: "menu", keys: [b.menu], up: true },
  ];
}

export function getKeyboardMap() {
  const { keyBindings } = useControlsStore.getState();
  return buildKeyboardMap(keyBindings);
}
