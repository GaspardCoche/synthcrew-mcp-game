/**
 * GroundDetails — micro-details on the ground level.
 * Small rocks (instanced), hexagonal floor tiles (instanced), data cables,
 * small bushes & grass tufts (instanced), footprint paths between zones.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeightAt } from "./Terrain";

// ─────────────────────────────────────────────────────────────────────────────
// Seeded pseudo-random
// ─────────────────────────────────────────────────────────────────────────────
function seededRand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ─────────────────────────────────────────────────────────────────────────────
// SmallRocks — instanced scattered rocks
// ─────────────────────────────────────────────────────────────────────────────
function SmallRocks({ count = 180, spread = 80 }) {
  const meshRef = useRef();

  const { geometry, positions } = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.18, 0);
    const poss = [];
    let placed = 0, attempt = 0;
    while (placed < count && attempt < count * 10) {
      attempt++;
      const seed = attempt * 3.7;
      const x = (seededRand(seed)     - 0.5) * spread * 2;
      const z = (seededRand(seed + 1) - 0.5) * spread * 2;
      // Avoid agent zone centres
      const zoneCentres = [[0,-8],[-35,-28],[32,-35],[-28,-52],[42,-18],[18,-58],[-15,-62]];
      const tooClose = zoneCentres.some(([zx, zz]) => Math.hypot(x - zx, z - zz) < 9);
      if (tooClose) continue;
      poss.push({ x, z, seed });
      placed++;
    }
    return { geometry: geo, positions: poss };
  }, [count, spread]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    positions.forEach(({ x, z, seed }, i) => {
      const y = getTerrainHeightAt(x, z);
      const s = 0.4 + seededRand(seed + 5) * 1.2;
      dummy.position.set(x, y + 0.08 * s, z);
      dummy.rotation.set(
        seededRand(seed + 6) * Math.PI,
        seededRand(seed + 7) * Math.PI * 2,
        seededRand(seed + 8) * Math.PI
      );
      dummy.scale.set(s, s * (0.7 + seededRand(seed + 9) * 0.6), s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, count]} castShadow receiveShadow>
      <meshStandardMaterial color="#1a1624" roughness={0.9} metalness={0.05} />
    </instancedMesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HexTiles — hexagonal floor tiles instanced around agent zones
// ─────────────────────────────────────────────────────────────────────────────
const ZONE_CONFIGS = [
  { x: 0,    z: -8,   r: 10, color: "#ff6b35", name: "NEXUS" },
  { x: -35,  z: -28,  r:  8, color: "#4ecdc4", name: "DATAFLOW" },
  { x: 32,   z: -35,  r:  8, color: "#6c5ce7", name: "PRISME" },
  { x: -28,  z: -52,  r:  8, color: "#f59e0b", name: "SCRIBE" },
  { x: 42,   z: -18,  r:  7, color: "#22c55e", name: "SIGNAL" },
  { x: 18,   z: -58,  r:  7, color: "#ef4444", name: "SPIDER" },
  { x: -15,  z: -62,  r:  8, color: "#ec4899", name: "CODEFORGE" },
];

function HexTiles() {
  const groups = useMemo(() => {
    const hexW = 0.95, hexH = 0.82;
    const results = [];
    ZONE_CONFIGS.forEach((zone) => {
      const tiles = [];
      const rows = Math.ceil(zone.r / hexH) * 2 + 2;
      const cols = Math.ceil(zone.r / hexW) * 2 + 2;
      for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
          const xOff = col * hexW + (row % 2) * hexW * 0.5;
          const zOff = row * hexH * 0.75;
          const wx = zone.x + xOff;
          const wz = zone.z + zOff;
          const d = Math.hypot(xOff, zOff);
          if (d > zone.r) continue;
          const fade = 1 - d / zone.r;
          tiles.push({ wx, wz, fade });
        }
      }
      results.push({ ...zone, tiles });
    });
    return results;
  }, []);

  return (
    <>
      {groups.map((zone) => {
        const count = zone.tiles.length;
        const meshRef = { current: null };
        const geo = new THREE.CylinderGeometry(0.44, 0.44, 0.04, 6);
        const dummy = new THREE.Object3D();

        return (
          <instancedMesh
            key={zone.name}
            ref={(el) => {
              if (el && zone.tiles.length > 0) {
                zone.tiles.forEach(({ wx, wz, fade }, i) => {
                  const y = getTerrainHeightAt(wx, wz) + 0.005;
                  dummy.position.set(wx, y, wz);
                  dummy.rotation.set(0, 0, 0);
                  dummy.scale.setScalar(0.92);
                  dummy.updateMatrix();
                  el.setMatrixAt(i, dummy.matrix);
                });
                el.instanceMatrix.needsUpdate = true;
              }
            }}
            args={[geo, null, count]}
            receiveShadow
          >
            <meshStandardMaterial
              color={zone.color}
              emissive={zone.color}
              emissiveIntensity={0.12}
              roughness={0.5}
              metalness={0.3}
              transparent
              opacity={0.6}
            />
          </instancedMesh>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DataCables — glowing tubes on ground connecting zones
// ─────────────────────────────────────────────────────────────────────────────
function DataCable({ from, to, color = "#00e5ff", animated = true }) {
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (matRef.current && animated) {
      matRef.current.emissiveIntensity = 0.3 + 0.2 * Math.sin(clock.elapsedTime * 2 + from[0]);
    }
  });

  const curve = useMemo(() => {
    const pts = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from[0] + (to[0] - from[0]) * t;
      const z = from[1] + (to[1] - from[1]) * t;
      const y = getTerrainHeightAt(x, z) + 0.06;
      // Slight arc
      const arc = Math.sin(t * Math.PI) * 0.5;
      pts.push(new THREE.Vector3(x, y + arc, z));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [from, to]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 30, 0.04, 6, false), [curve]);

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.5}
        metalness={0.4}
      />
    </mesh>
  );
}

function DataCables() {
  const connections = [
    { from: [0, -8],    to: [-35, -28], color: "#ff6b35" },
    { from: [0, -8],    to: [32, -35],  color: "#6c5ce7" },
    { from: [0, -8],    to: [42, -18],  color: "#22c55e" },
    { from: [-35, -28], to: [-28, -52], color: "#4ecdc4" },
    { from: [32, -35],  to: [18, -58],  color: "#6c5ce7" },
    { from: [-28, -52], to: [-15, -62], color: "#f59e0b" },
    { from: [18, -58],  to: [-15, -62], color: "#ef4444" },
  ];

  return (
    <>
      {connections.map((c, i) => (
        <DataCable key={i} from={c.from} to={c.to} color={c.color} animated />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GrassTufts — instanced small grass blades
// ─────────────────────────────────────────────────────────────────────────────
function GrassTufts({ count = 300, spread = 90 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const poss = [];
    let placed = 0, attempt = 0;
    while (placed < count && attempt < count * 8) {
      attempt++;
      const seed = attempt * 5.3 + 77;
      const x = (seededRand(seed)     - 0.5) * spread * 2;
      const z = (seededRand(seed + 1) - 0.5) * spread * 2;
      const zoneCentres = [[0,-8],[-35,-28],[32,-35],[-28,-52],[42,-18],[18,-58],[-15,-62]];
      const tooClose = zoneCentres.some(([zx, zz]) => Math.hypot(x - zx, z - zz) < 6);
      if (tooClose) continue;
      poss.push({ x, z, seed });
      placed++;
    }
    return poss;
  }, [count, spread]);

  const geometry = useMemo(() => {
    // Simple crossed planes for a tuft
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -0.1, 0, 0,  0.1, 0, 0,  0, 0.3, 0,
       0, 0, -0.1,  0, 0, 0.1,  0, 0.3, 0,
    ]);
    const idx = new Uint16Array([0,1,2, 3,4,5]);
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    return geo;
  }, []);

  useMemo(() => {
    if (!meshRef.current) return;
    positions.forEach(({ x, z, seed }, i) => {
      const y = getTerrainHeightAt(x, z);
      const s = 0.5 + seededRand(seed + 10) * 1.0;
      dummy.position.set(x, y, z);
      dummy.rotation.y = seededRand(seed + 11) * Math.PI * 2;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, count]}>
      <meshStandardMaterial color="#1a2a1a" emissive="#0a1a0a" emissiveIntensity={0.1} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PathBetweenZones — dirt/glow footpath
// ─────────────────────────────────────────────────────────────────────────────
function ZonePath({ from, to, color = "#ffffff", width = 0.5 }) {
  const curve = useMemo(() => {
    const pts = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from[0] + (to[0] - from[0]) * t;
      const z = from[1] + (to[1] - from[1]) * t;
      const y = getTerrainHeightAt(x, z) + 0.02;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [from, to]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 24, width * 0.5, 4, false), [curve, width]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.04} roughness={0.95} metalness={0.0} transparent opacity={0.35} />
    </mesh>
  );
}

function FootpathNetwork() {
  const paths = [
    { from: [0, -8],    to: [-35, -28], color: "#1a1530" },
    { from: [0, -8],    to: [32, -35],  color: "#1a1530" },
    { from: [0, -8],    to: [42, -18],  color: "#1a1530" },
    { from: [-35, -28], to: [-28, -52], color: "#1a1530" },
    { from: [32, -35],  to: [18, -58],  color: "#1a1530" },
    { from: [-28, -52], to: [-15, -62], color: "#1a1530" },
  ];

  return (
    <>
      {paths.map((p, i) => (
        <ZonePath key={i} from={p.from} to={p.to} color={p.color} width={0.7} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SmallBushes — instanced dark decorative bush blobs
// ─────────────────────────────────────────────────────────────────────────────
function SmallBushes({ count = 120 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.28, 0), []);

  const positions = useMemo(() => {
    const poss = [];
    let placed = 0, attempt = 0;
    while (placed < count && attempt < count * 8) {
      attempt++;
      const seed = attempt * 9.1 + 42;
      const x = (seededRand(seed)     - 0.5) * 140;
      const z = (seededRand(seed + 1) - 0.5) * 140;
      const zoneCentres = [[0,-8],[-35,-28],[32,-35],[-28,-52],[42,-18],[18,-58],[-15,-62]];
      const tooClose = zoneCentres.some(([zx, zz]) => Math.hypot(x - zx, z - zz) < 7);
      if (tooClose) continue;
      poss.push({ x, z, seed });
      placed++;
    }
    return poss;
  }, [count]);

  useMemo(() => {
    if (!meshRef.current) return;
    positions.forEach(({ x, z, seed }, i) => {
      const y = getTerrainHeightAt(x, z);
      const s = 0.5 + seededRand(seed + 20) * 1.5;
      dummy.position.set(x, y + 0.12 * s, z);
      dummy.rotation.y = seededRand(seed + 21) * Math.PI * 2;
      dummy.scale.set(s, s * (0.6 + seededRand(seed + 22) * 0.8), s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[geo, null, count]} castShadow receiveShadow>
      <meshStandardMaterial color="#0f1a10" roughness={0.95} metalness={0.0} />
    </instancedMesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GroundDetails — compose all sub-components
// ─────────────────────────────────────────────────────────────────────────────
export default function GroundDetails() {
  return (
    <group>
      <FootpathNetwork />
      <HexTiles />
      <DataCables />
      <SmallRocks count={160} spread={80} />
      <SmallBushes count={110} />
      <GrassTufts count={250} spread={85} />
    </group>
  );
}
