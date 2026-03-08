/**
 * ShaderMaterials — Custom GLSL materials for SynthCrew world.
 * HolographicMaterial, NeonGridMaterial, PlasmaMaterial,
 * DataStreamMaterial, TerrainMaterial.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// HolographicMaterial — blue-cyan hologram with scan lines + transparency
// ─────────────────────────────────────────────────────────────────────────────
const holographicVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holographicFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;
  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vPosition;

  void main() {
    // Scan lines
    float scanLine = step(0.5, fract(vUv.y * 40.0 + uTime * 0.8));
    // Fresnel rim glow
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.5);
    // Data flicker
    float flicker = 0.85 + 0.15 * sin(uTime * 12.0 + vUv.y * 80.0);
    // Horizontal glitch bars
    float glitch = step(0.98, fract(sin(uTime * 3.0 + vUv.y * 5.0) * 43.0)) * 0.4;
    float alpha = (0.15 + fresnel * 0.6 + scanLine * 0.08 + glitch) * uOpacity * flicker;
    vec3 col = uColor * (1.0 + fresnel * 1.2 + scanLine * 0.4);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function HolographicMaterial({ color = "#00e5ff", opacity = 0.7, children, ...props }) {
  const ref = useRef();
  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uColor:   { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
  }), [color, opacity]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={holographicVert}
      fragmentShader={holographicFrag}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NeonGridMaterial — dark surface with glowing grid lines (Tron style)
// ─────────────────────────────────────────────────────────────────────────────
const neonGridVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const neonGridFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uLineColor;
  uniform float uGridSize;
  uniform float uLineWidth;
  uniform float uPulse;
  varying vec2  vUv;

  void main() {
    vec2 grid = fract(vUv * uGridSize);
    float lx = step(1.0 - uLineWidth, grid.x) + step(grid.x, uLineWidth);
    float ly = step(1.0 - uLineWidth, grid.y) + step(grid.y, uLineWidth);
    float line = clamp(lx + ly, 0.0, 1.0);
    float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + (vUv.x + vUv.y) * 8.0);
    // Moving highlight strip
    float strip = smoothstep(0.02, 0.0, abs(fract(vUv.y - uTime * 0.15) - 0.5) - 0.48);
    vec3 col = uLineColor * line * pulse * (1.0 + uPulse * 0.5);
    col += uLineColor * strip * 0.25;
    float alpha = line * 0.85 + strip * 0.1;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function NeonGridMaterial({ color = "#0ff", gridSize = 12.0, lineWidth = 0.04, pulse = 0.5, ...props }) {
  const ref = useRef();
  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uLineColor: { value: new THREE.Color(color) },
    uGridSize:  { value: gridSize },
    uLineWidth: { value: lineWidth },
    uPulse:     { value: pulse },
  }), [color, gridSize, lineWidth, pulse]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={neonGridVert}
      fragmentShader={neonGridFrag}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlasmaMaterial — animated plasma / lava-lamp for special structures
// ─────────────────────────────────────────────────────────────────────────────
const plasmaVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const plasmaFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  varying vec2  vUv;
  varying vec3  vNormal;

  float plasma(vec2 uv, float t) {
    float v = sin(uv.x * 6.0 + t);
    v += sin(uv.y * 6.0 + t * 1.3);
    v += sin((uv.x + uv.y) * 6.0 + t * 0.8);
    float cx = uv.x + 0.5 * sin(t * 0.5);
    float cy = uv.y + 0.5 * cos(t * 0.3);
    v += sin(sqrt(cx*cx + cy*cy) * 10.0 + t);
    return (v + 4.0) / 8.0;
  }

  void main() {
    float p = plasma(vUv, uTime * 0.9);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.3, 0.6, p));
    col = mix(col, uColorC, smoothstep(0.6, 0.9, p));
    // Rim lighting
    vec3 view = vec3(0.0, 0.0, 1.0);
    float rim = pow(1.0 - max(0.0, dot(vNormal, view)), 2.0);
    col += uColorC * rim * 0.4;
    gl_FragColor = vec4(col, 0.92);
  }
`;

export function PlasmaMaterial({ colorA = "#6c5ce7", colorB = "#ff6b6b", colorC = "#00e5ff", ...props }) {
  const ref = useRef();
  const uniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
    uColorC: { value: new THREE.Color(colorC) },
  }), [colorA, colorB, colorC]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={plasmaVert}
      fragmentShader={plasmaFrag}
      uniforms={uniforms}
      transparent
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DataStreamMaterial — flowing data stream (animated UV scrolling)
// ─────────────────────────────────────────────────────────────────────────────
const dataStreamVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const dataStreamFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uSpeed;
  uniform float uDensity;
  varying vec2  vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    // Column-based streams
    float col = floor(uv.x * uDensity);
    float speed = 0.5 + rand(vec2(col, 0.0)) * 1.5;
    float offset = rand(vec2(col, 1.0));
    float y = fract(uv.y + uTime * uSpeed * speed + offset);
    // Char-like blips
    float charW = 1.0 / uDensity;
    float charH = 0.05;
    float inChar = step(fract(uv.x / charW), 0.7) * step(fract(y / charH), 0.6);
    // Fade trail
    float trail = (1.0 - y) * (1.0 - y);
    float bright = rand(vec2(col, floor(y * 20.0) + uTime * 0.5)) > 0.7 ? 1.0 : 0.0;
    float alpha = inChar * trail * (0.3 + bright * 0.7);
    vec3 c = uColor * (0.5 + bright * 0.5 + trail * 0.3);
    gl_FragColor = vec4(c, clamp(alpha, 0.0, 1.0));
  }
`;

export function DataStreamMaterial({ color = "#00ff88", speed = 0.4, density = 16.0, ...props }) {
  const ref = useRef();
  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uColor:   { value: new THREE.Color(color) },
    uSpeed:   { value: speed },
    uDensity: { value: density },
  }), [color, speed, density]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={dataStreamVert}
      fragmentShader={dataStreamFrag}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TerrainZoneMaterial — multi-zone terrain with different colors per zone
// Used as a standalone mesh overlay on terrain
// ─────────────────────────────────────────────────────────────────────────────
const terrainZoneVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const terrainZoneFrag = /* glsl */ `
  uniform float uTime;
  varying vec2  vUv;
  varying vec3  vWorldPos;

  // Zone centres in world XZ
  const vec2 zones[7] = vec2[7](
    vec2(0.0,   -8.0),   // NEXUS
    vec2(-35.0, -28.0),  // DATAFLOW
    vec2(32.0,  -35.0),  // PRISME
    vec2(-28.0, -52.0),  // SCRIBE
    vec2(42.0,  -18.0),  // SIGNAL
    vec2(18.0,  -58.0),  // SPIDER
    vec2(-15.0, -62.0)   // CODEFORGE
  );
  const vec3 zoneColors[7] = vec3[7](
    vec3(1.0, 0.42, 0.21),   // orange
    vec3(0.27, 0.73, 0.77),  // cyan
    vec3(0.42, 0.36, 0.91),  // purple
    vec3(0.96, 0.62, 0.04),  // amber
    vec3(0.13, 0.72, 0.58),  // green
    vec3(0.94, 0.27, 0.27),  // red
    vec3(0.93, 0.29, 0.60)   // pink
  );

  void main() {
    vec3 col = vec3(0.055, 0.04, 0.085);
    float totalWeight = 0.0;
    vec3 zoneCol = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      float d = length(vWorldPos.xz - zones[i]);
      float w = exp(-d * d * 0.003);
      zoneCol += zoneColors[i] * w;
      totalWeight += w;
    }
    if (totalWeight > 0.001) {
      zoneCol /= totalWeight;
      float blend = clamp(totalWeight * 0.5, 0.0, 0.25);
      float pulse = 0.8 + 0.2 * sin(uTime * 1.5 + vWorldPos.x * 0.1 + vWorldPos.z * 0.1);
      col = mix(col, zoneCol, blend * pulse);
    }
    // Fine grid overlay
    vec2 grid = fract(vUv * 80.0);
    float gl = step(0.96, grid.x) + step(0.96, grid.y);
    col += vec3(0.0, 0.8, 1.0) * clamp(gl, 0.0, 1.0) * 0.03;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function TerrainZoneMaterial({ ...props }) {
  const ref = useRef();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={terrainZoneVert}
      fragmentShader={terrainZoneFrag}
      uniforms={uniforms}
      {...props}
    />
  );
}
