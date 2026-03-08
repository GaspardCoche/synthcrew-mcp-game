/**
 * Terrain procédural — carte 260×260, relief dramatique, texture multi-zone.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { fbm } from "../lib/noise";

export const TERRAIN_SIZE = 260;
const SEGMENTS    = 180;
const HEIGHT_SCALE = 6.5;
const NOISE_SCALE  = 0.032;
const SEED         = 42;

// Zones plates autour des quartiers agents
const FLAT_ZONES = [
  { x: 0,    z: 0,    r: 18, flatY: 0.05 },
  { x: -35,  z: 28,   r: 14, flatY: 0.3  },
  { x: 32,   z: 35,   r: 14, flatY: 0.4  },
  { x: -28,  z: 52,   r: 14, flatY: 0.5  },
  { x: 42,   z: 18,   r: 12, flatY: 0.2  },
  { x: 18,   z: 58,   r: 12, flatY: 0.6  },
  { x: -15,  z: 62,   r: 13, flatY: 0.7  },
];

function rawHeight(lx, lz) {
  const nx = lx * NOISE_SCALE;
  const nz = lz * NOISE_SCALE;
  let h = fbm(nx, nz, 6, 2.1, 0.52, SEED);
  h += 0.22 * fbm(nx * 2.5 + 5, nz * 2.5, 4, 2, 0.5, SEED + 1);
  h += 0.08 * fbm(nx * 6 + 12, nz * 6 + 3, 2, 2, 0.5, SEED + 2);
  return h;
}

function createTerrainGeometry() {
  const geo  = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
  const pos  = geo.attributes.position;
  const half = TERRAIN_SIZE / 2;

  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i) + half;
    const lz = pos.getY(i) + half;
    const wx = pos.getX(i);
    const wz = -pos.getY(i);

    let h = rawHeight(lx, lz);
    const dist = Math.sqrt((lx - half) ** 2 + (lz - half) ** 2);
    const falloff = Math.max(0, 1 - (dist / (half * 0.88)) ** 1.6);
    h = h * falloff * HEIGHT_SCALE;

    for (const fz of FLAT_ZONES) {
      const d = Math.sqrt((wx - fz.x) ** 2 + (wz + fz.z) ** 2);
      const blend = Math.max(0, 1 - d / fz.r);
      const smooth = blend * blend * (3 - 2 * blend);
      h = h * (1 - smooth) + fz.flatY * smooth;
    }
    pos.setZ(i, h);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createGroundTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0,    "#090810");
  base.addColorStop(0.5,  "#130f22");
  base.addColorStop(1,    "#090810");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(0, 240, 255, 0.055)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 48) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(168, 85, 247, 0.025)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= size; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }

  const patches = [
    { x: 0.5,  y: 0.5,  r: 0.18, color: "rgba(0,240,255,0.06)"  },
    { x: 0.2,  y: 0.4,  r: 0.12, color: "rgba(0,240,255,0.05)"  },
    { x: 0.8,  y: 0.4,  r: 0.11, color: "rgba(168,85,247,0.07)" },
    { x: 0.2,  y: 0.7,  r: 0.11, color: "rgba(245,158,11,0.05)" },
    { x: 0.85, y: 0.6,  r: 0.10, color: "rgba(34,197,94,0.06)"  },
    { x: 0.7,  y: 0.75, r: 0.10, color: "rgba(239,68,68,0.05)"  },
    { x: 0.35, y: 0.78, r: 0.12, color: "rgba(236,72,153,0.06)" },
  ];
  for (const p of patches) {
    const grd = ctx.createRadialGradient(p.x*size, p.y*size, 0, p.x*size, p.y*size, p.r*size);
    grd.addColorStop(0, p.color);
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.sin(i * 0.01) * 0.5 + 0.5) * 4;
    data[i]     = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n * 0.5));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n * 0.3));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

export function getTerrainHeightAt(worldX, worldZ) {
  const half = TERRAIN_SIZE / 2;
  const lx = worldX + half;
  const lz = half - worldZ;
  let h = rawHeight(lx, lz);
  const dist = Math.sqrt((lx - half) ** 2 + (lz - half) ** 2);
  const falloff = Math.max(0, 1 - (dist / (half * 0.88)) ** 1.6);
  h = h * falloff * HEIGHT_SCALE;
  for (const fz of FLAT_ZONES) {
    const d = Math.sqrt((worldX - fz.x) ** 2 + (worldZ + fz.z) ** 2);
    const blend = Math.max(0, 1 - d / fz.r);
    const smooth = blend * blend * (3 - 2 * blend);
    h = h * (1 - smooth) + fz.flatY * smooth;
  }
  return h;
}

export default function Terrain() {
  const geometry = useMemo(createTerrainGeometry, []);
  const texture  = useMemo(createGroundTexture, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} geometry={geometry} receiveShadow>
      <meshStandardMaterial map={texture} color="#14111e" roughness={0.94} metalness={0.04} envMapIntensity={0.3} />
    </mesh>
  );
}
