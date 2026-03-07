import { useMemo, useRef } from "react";
import * as THREE from "three";
import { fbm } from "../lib/noise";

const TERRAIN_SIZE = 140;
const SEGMENTS = 128;
const HEIGHT_SCALE = 2.8;
const NOISE_SCALE = 0.04;
const SEED = 42;

function createTerrainGeometry() {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
  const pos = geo.attributes.position;
  const centerX = TERRAIN_SIZE / 2;
  const centerZ = TERRAIN_SIZE / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + centerX;
    const z = pos.getY(i) + centerZ;
    const nx = x * NOISE_SCALE;
    const nz = z * NOISE_SCALE;
    let h = fbm(nx, nz, 5, 2, 0.5, SEED);
    h += 0.3 * fbm(nx * 2 + 5, nz * 2, 3, 2, 0.5, SEED + 1);
    const dist = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
    const falloff = Math.max(0, 1 - dist / (TERRAIN_SIZE * 0.45));
    h *= falloff * HEIGHT_SCALE;
    pos.setZ(i, h);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createGroundTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#0d0a14");
  g.addColorStop(0.3, "#12101c");
  g.addColorStop(0.5, "#16132a");
  g.addColorStop(0.7, "#12101c");
  g.addColorStop(1, "#0d0a14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

/** Retourne la hauteur du terrain en un point (x, z) en coordonnées monde. */
export function getTerrainHeightAt(worldX, worldZ) {
  const center = TERRAIN_SIZE / 2;
  const lx = worldX + center;
  const lz = center - worldZ;
  const nx = lx * NOISE_SCALE;
  const nz = lz * NOISE_SCALE;
  let h = fbm(nx, nz, 5, 2, 0.5, SEED);
  h += 0.3 * fbm(nx * 2 + 5, nz * 2, 3, 2, 0.5, SEED + 1);
  const dist = Math.sqrt((lx - center) ** 2 + (lz - center) ** 2);
  const falloff = Math.max(0, 1 - dist / (TERRAIN_SIZE * 0.45));
  return h * falloff * HEIGHT_SCALE;
}

export default function Terrain() {
  const geometry = useMemo(createTerrainGeometry, []);
  const texture = useMemo(createGroundTexture, []);
  const meshRef = useRef();

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      geometry={geometry}
      receiveShadow
    >
      <meshStandardMaterial
        map={texture}
        color="#13101c"
        roughness={0.92}
        metalness={0.06}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}

export { TERRAIN_SIZE };
