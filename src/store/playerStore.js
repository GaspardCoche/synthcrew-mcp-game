/**
 * Position du joueur (caméra) — mise à jour par FirstPersonController pour boussole / objectifs.
 */
import { create } from "zustand";

export const usePlayerStore = create((set) => ({
  position: { x: 0, z: 0 },
  setPosition: (x, z) => set({ position: { x, z } }),
}));
