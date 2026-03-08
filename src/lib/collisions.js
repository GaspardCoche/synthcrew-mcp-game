/**
 * Colliders cylindriques pour le monde SynthCrew.
 * Utilisés par FirstPersonController pour bloquer le passage.
 * Format : { x, z, r } — centre et rayon en unités monde.
 */

export const WORLD_COLLIDERS = [
  // ── Zone centrale (Hub NEXUS) ──────────────────────
  { x: 0,    z: -8,   r: 4.5 },   // hub central
  { x: -4,   z: -4,   r: 1.2 },   // pylône N-O
  { x: 4,    z: -4,   r: 1.2 },   // pylône N-E
  { x: -4,   z: -12,  r: 1.2 },   // pylône S-O
  { x: 4,    z: -12,  r: 1.2 },   // pylône S-E

  // ── Zone Data (DATAFLOW, -35, -28) ──────────────────────
  { x: -34,  z: -28,  r: 5.5 },   // citadelle data
  { x: -28,  z: -22,  r: 2.0 },   // serveur A
  { x: -40,  z: -22,  r: 1.8 },   // serveur B
  { x: -42,  z: -34,  r: 2.5 },   // tour antenne

  // ── Zone Analyse (PRISME, 32, -35) ──────────────────────
  { x: 32,   z: -35,  r: 4.5 },   // spire d'analyse
  { x: 38,   z: -28,  r: 1.8 },   // cristal A
  { x: 26,   z: -28,  r: 1.5 },   // cristal B
  { x: 38,   z: -42,  r: 2.2 },   // tour de calcul

  // ── Zone Archive (SCRIBE, -28, -52) ──────────────────
  { x: -28,  z: -52,  r: 5.0 },   // bibliothèque
  { x: -20,  z: -46,  r: 1.6 },   // colonne A
  { x: -36,  z: -46,  r: 1.6 },   // colonne B
  { x: -22,  z: -58,  r: 1.8 },   // colonne C
  { x: -34,  z: -58,  r: 1.8 },   // colonne D

  // ── Zone Comms (SIGNAL, 42, -18) ───────────────────────
  { x: 42,   z: -18,  r: 4.0 },   // tour comms
  { x: 48,   z: -12,  r: 2.5 },   // antenne haute
  { x: 36,   z: -12,  r: 1.5 },   // relais
  { x: 50,   z: -24,  r: 1.8 },   // dish

  // ── Zone Rôdeur (SPIDER, 18, -58) ─────────────────────
  { x: 18,   z: -58,  r: 3.5 },   // base cachée
  { x: 12,   z: -52,  r: 1.5 },   // rocher A
  { x: 24,   z: -52,  r: 1.3 },   // rocher B
  { x: 22,   z: -64,  r: 2.0 },   // bunker

  // ── Zone Forge (CODEFORGE, -15, -62) ───────────────────────
  { x: -15,  z: -62,  r: 5.0 },   // atelier principal
  { x: -8,   z: -56,  r: 1.8 },   // machine A
  { x: -22,  z: -56,  r: 1.8 },   // machine B
  { x: -8,   z: -68,  r: 1.5 },   // générateur
  { x: -22,  z: -68,  r: 1.5 },   // réservoir

  // ── Rochers / obstacles naturels ────────────────────────
  { x: -18,  z: -18,  r: 2.8 },
  { x: 16,   z: -22,  r: 2.5 },
  { x: 5,    z: -38,  r: 3.0 },
  { x: -50,  z: -45,  r: 3.5 },
  { x: 55,   z: -40,  r: 2.8 },
  { x: -5,   z: -78,  r: 4.0 },
  { x: 45,   z: -60,  r: 2.5 },
  { x: -45,  z: -65,  r: 3.0 },
  // ── Murs / bordures bâtiments (éviter de traverser) ─────
  { x: -6,   z: -8,   r: 0.8 },
  { x: 6,    z: -8,   r: 0.8 },
  { x: 0,    z: -2,   r: 0.8 },
  { x: 0,    z: -14,  r: 0.8 },
  // ── Bâtiments GLTF arrière-plan ──────────────────────
  { x: -55,  z: -12,  r: 4.0 },
  { x: 52,   z: -48,  r: 4.0 },
  { x: 0,    z: -82,  r: 5.0 },
  { x: -60,  z: -55,  r: 4.5 },
  // ── Rochers GLTF ─────────────────────────────────────
  { x: -20,  z: -20,  r: 2.0 },
  { x: 14,   z: -20,  r: 1.8 },
  { x: 5,    z: -38,  r: 2.2 },
  // ── Arbres épais ─────────────────────────────────────
  { x: -3,   z: -9,   r: 1.2 },
  { x: 5,    z: -10,  r: 1.0 },
  { x: -12,  z: -42,  r: 1.2 },
  { x: 22,   z: -48,  r: 1.2 },
];

/** Teste si une position (x, z) entre en collision. dynamicCircles = [{ x, z, r }] (ex: agents). */
export function isBlocked(x, z, playerRadius = 0.45, dynamicCircles = []) {
  for (const c of WORLD_COLLIDERS) {
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < (c.r + playerRadius) ** 2) return true;
  }
  for (const c of dynamicCircles) {
    if (!c || typeof c.x !== "number") continue;
    const dx = x - c.x;
    const dz = z - (c.z ?? 0);
    const r = c.r ?? 0.6;
    if (dx * dx + dz * dz < (r + playerRadius) ** 2) return true;
  }
  return false;
}
