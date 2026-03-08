/**
 * Colliders cylindriques alignés avec les structures visibles dans Structures.jsx.
 * Format : { x, z, r } — centre et rayon en unités monde.
 */

export const WORLD_COLLIDERS = [
  // Zone centrale (Hub NEXUS)
  { x: 0,    z: -8,   r: 2.8 },

  // Zone Data (DATAFLOW)
  { x: -34,  z: -28,  r: 3.2 },
  { x: -28,  z: -22,  r: 1.2 },
  { x: -40,  z: -22,  r: 1.2 },

  // Zone Analyse (PRISME)
  { x: 32,   z: -35,  r: 3.0 },
  { x: 38,   z: -28,  r: 1.0 },
  { x: 26,   z: -28,  r: 1.0 },

  // Zone Archive (SCRIBE)
  { x: -28,  z: -52,  r: 3.2 },
  { x: -20,  z: -46,  r: 1.0 },
  { x: -36,  z: -46,  r: 1.0 },

  // Zone Comms (SIGNAL)
  { x: 42,   z: -18,  r: 3.0 },
  { x: 48,   z: -12,  r: 1.5 },

  // Zone Rôdeur (SPIDER)
  { x: 18,   z: -58,  r: 2.5 },

  // Zone Forge (CODEFORGE)
  { x: -15,  z: -62,  r: 3.2 },
  { x: -8,   z: -56,  r: 1.2 },
  { x: -22,  z: -56,  r: 1.2 },
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
