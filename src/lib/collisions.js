/**
 * Colliders cylindriques alignés avec les structures visibles dans Structures.jsx.
 * Format : { x, z, r } — centre et rayon en unités monde.
 */

export const WORLD_COLLIDERS = [
  // Zone centrale (Hub NEXUS)
  { x: 0,    z: -8,   r: 3.5 },

  // Zone Data (DATAFLOW, -35, -28)
  { x: -34,  z: -28,  r: 4.5 },
  { x: -28,  z: -22,  r: 1.5 },
  { x: -40,  z: -22,  r: 1.5 },

  // Zone Analyse (PRISME, 32, -35)
  { x: 32,   z: -35,  r: 3.5 },
  { x: 38,   z: -28,  r: 1.2 },
  { x: 26,   z: -28,  r: 1.2 },

  // Zone Archive (SCRIBE, -28, -52)
  { x: -28,  z: -52,  r: 4.0 },
  { x: -20,  z: -46,  r: 1.2 },
  { x: -36,  z: -46,  r: 1.2 },

  // Zone Comms (SIGNAL, 42, -18)
  { x: 42,   z: -18,  r: 3.5 },
  { x: 48,   z: -12,  r: 2.0 },

  // Zone Rôdeur (SPIDER, 18, -58)
  { x: 18,   z: -58,  r: 3.0 },

  // Zone Forge (CODEFORGE, -15, -62)
  { x: -15,  z: -62,  r: 4.0 },
  { x: -8,   z: -56,  r: 1.5 },
  { x: -22,  z: -56,  r: 1.5 },
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
