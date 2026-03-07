/**
 * Bruit 2D simple (style Perlin/Simplex) pour terrain procédural.
 * Pas de dépendance externe.
 */
function hash2(x, y) {
  const n = x + y * 57;
  return Math.sin(n * 12.9898) * 43758.5453;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

/** Bruit 2D type valeur, répétable (seed). Retourne 0..1. */
export function noise2D(x, y, seed = 0) {
  const xi = Math.floor(x) + seed * 1000;
  const yi = Math.floor(y) + seed * 1000;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const h = (v) => ((v % 1) + 1) % 1;
  const aa = h(hash2(xi, yi));
  const ab = h(hash2(xi, yi + 1));
  const ba = h(hash2(xi + 1, yi));
  const bb = h(hash2(xi + 1, yi + 1));
  const x1 = mix(aa, ba, u);
  const x2 = mix(ab, bb, u);
  return mix(x1, x2, v);
}

/** Fractal brownian motion pour relief naturel. */
export function fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5, seed = 0) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency, seed + i * 7);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return value / maxValue;
}
