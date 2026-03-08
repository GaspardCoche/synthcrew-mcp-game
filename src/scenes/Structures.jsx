/**
 * Structures — 7 zone structures with rich geometry, zone labels,
 * lock indicators, holographic displays, server racks, telescopes, etc.
 * Damage system and progressive unlock preserved from original.
 */
import { Suspense, useRef, useMemo } from "react";
import { useGLTF, Text, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useThrottledFrame } from "../lib/useThrottledFrame";
import * as THREE from "three";
import { getTerrainHeightAt } from "./Terrain";
import { useWorldStore } from "../store/worldStore";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive helpers
// ─────────────────────────────────────────────────────────────────────────────
function Box({ pos, size, color, emissive, emissiveIntensity = 0.14, damage = 0, metalness = 0.15, roughness = 0.7 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z) + size[1] / 2;
  const d = Math.max(0, Math.min(1, damage));
  const em = emissiveIntensity * (1 - d * 0.7);
  const col = d > 0.5 ? "#2a1515" : color;
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={col} emissive={emissive} emissiveIntensity={em} roughness={roughness + d * 0.2} metalness={metalness} />
    </mesh>
  );
}

function Cylinder({ pos, r, h, color, emissive, emissiveIntensity = 0.14, damage = 0, segs = 12 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z) + h / 2;
  const d = Math.max(0, Math.min(1, damage));
  const em = emissiveIntensity * (1 - d * 0.7);
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <cylinderGeometry args={[r, r * 1.08, h, segs]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={em} roughness={0.65} metalness={0.25} />
    </mesh>
  );
}

function Crystal({ pos, scale = 1, color, rotY = 0, damage = 0 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  const d = Math.max(0, Math.min(1, damage));
  const em = 0.55 * (1 - d * 0.8);
  return (
    <mesh position={[x, y, z]} rotation={[0, rotY, 0.15]} castShadow>
      <coneGeometry args={[0.22 * scale, 1.4 * scale, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={em} roughness={0.1} metalness={0.8} transparent opacity={0.88 - d * 0.3} />
    </mesh>
  );
}

function Pylon({ pos, color, damage = 0 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  const d = Math.max(0, Math.min(1, damage));
  return (
    <group position={[x, y, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.09, 2.0, 8]} />
        <meshStandardMaterial color="#1a1820" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2 * (1 - d)} roughness={0.1} />
      </mesh>
      {(1 - d) > 0.1 && <pointLight position={[0, 1.1, 0]} color={color} intensity={0.6 * (1 - d)} distance={8} decay={2} />}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone floor circle + floating label
// ─────────────────────────────────────────────────────────────────────────────
function ZoneFloor({ cx, cz, radius, color, name, locked }) {
  const ref = useRef();
  const y = getTerrainHeightAt(cx, cz) + 0.03;

  useThrottledFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = locked ? 0.04 : 0.08 + 0.04 * Math.sin(clock.elapsedTime * 1.5);
    }
  }, 15);

  return (
    <group>
      <mesh ref={ref} position={[cx, y, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} transparent opacity={locked ? 0.15 : 0.35} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Outer ring */}
      <mesh position={[cx, y + 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.12, radius, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={locked ? 0.1 : 0.4} transparent opacity={locked ? 0.2 : 0.7} />
      </mesh>
      {/* Floating label */}
      <Billboard position={[cx, y + 6.5, cz]}>
        <Text
          fontSize={0.55}
          color={locked ? "#555566" : color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          font={undefined}
        >
          {locked ? `🔒 ${name}` : name}
        </Text>
      </Billboard>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lock indicator — visual cage when zone not yet unlocked
// ─────────────────────────────────────────────────────────────────────────────
function LockIndicator({ cx, cz, color }) {
  const ref = useRef();
  const y = getTerrainHeightAt(cx, cz);

  useThrottledFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.3;
  }, 15);

  return (
    <group position={[cx, y + 1.5, cz]} ref={ref}>
      <mesh>
        <torusGeometry args={[1.2, 0.05, 8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.05, 8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLTF helpers
// ─────────────────────────────────────────────────────────────────────────────
function GltfModel({ path, pos, scale = 1, rotY = 0 }) {
  const { scene } = useGLTF(path);
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  return (
    <primitive
      object={scene.clone()}
      position={[x, y, z]}
      scale={[scale, scale, scale]}
      rotation={[0, rotY, 0]}
      castShadow receiveShadow
    />
  );
}

function RotatingPlanet({ path, pos, scale = 6 }) {
  const ref = useRef();
  const { scene } = useGLTF(path);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.025;
    ref.current.position.y = pos[1] + Math.sin(s.clock.elapsedTime * 0.15) * 1.2;
  });
  return <primitive ref={ref} object={scene.clone()} position={pos} scale={[scale, scale, scale]} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 0 — NEXUS: Command hub with holographic table + console displays
// ─────────────────────────────────────────────────────────────────────────────
function HolographicTable({ x, z, color }) {
  const displayRef = useRef();
  const ringRef = useRef();
  const y = getTerrainHeightAt(x, z);

  useThrottledFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (displayRef.current) {
      displayRef.current.material.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 2);
      displayRef.current.material.opacity = 0.18 + 0.08 * Math.sin(t * 3 + 1);
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.8;
    }
  }, 24);

  return (
    <group position={[x, y, z]}>
      {/* Table base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 1.0, 16]} />
        <meshStandardMaterial color="#1a1530" emissive={color} emissiveIntensity={0.25} roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Table top */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Holographic display projection */}
      <mesh ref={displayRef} position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.9, 24, 1, true]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Spinning ring */}
      <group ref={ringRef} position={[0, 1.85, 0]}>
        <mesh>
          <torusGeometry args={[0.8, 0.025, 8, 48]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      </group>
      <pointLight position={[0, 2.0, 0]} color={color} intensity={1.2} distance={10} decay={2} />
    </group>
  );
}

function ZoneHub() {
  const level = useWorldStore((s) => s.getZoneLevel("hub"));
  const damage = useWorldStore((s) => s.getZoneDamage("hub"));
  const locked = level < 1;
  const x0 = 0, z0 = -8;
  const color = "#ff6b35";

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={9} color={color} name="NEXUS" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          {/* Central platform */}
          <Box pos={[x0, 0, z0]} size={[8, 0.4, 8]} color="#151224" emissive="#1e1840" emissiveIntensity={0.2} damage={damage} />
          <Box pos={[x0, 0, z0]} size={[3.5, 0.8, 3.5]} color="#1a1530" emissive="#241e48" emissiveIntensity={0.25} damage={damage} />
          {/* Holographic command table */}
          <HolographicTable x={x0} z={z0} color={color} />
          {/* Console terminals around the table */}
          {[[-2, -1.5], [2, -1.5], [-2, 1.5], [2, 1.5]].map(([dx, dz], i) => {
            const bx = x0 + dx, bz = z0 + dz;
            const by = getTerrainHeightAt(bx, bz) + 0.6;
            return (
              <group key={i} position={[bx, by, bz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.6, 0.8, 0.1]} />
                  <meshStandardMaterial color="#0d0b18" emissive={color} emissiveIntensity={0.3 * (1 - damage)} roughness={0.4} metalness={0.6} />
                </mesh>
                <mesh position={[0, 0, 0.07]}>
                  <planeGeometry args={[0.5, 0.65]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7 * (1 - damage)} transparent opacity={0.4} />
                </mesh>
              </group>
            );
          })}
          {/* Corner pylons */}
          {[[-3.5, -4.5], [-3.5, -11.5], [3.5, -4.5], [3.5, -11.5]].map(([px, pz], i) => {
            const by = getTerrainHeightAt(px, pz);
            return (
              <group key={i} position={[px, by, pz]}>
                <mesh position={[0, 1.6, 0]} castShadow>
                  <cylinderGeometry args={[0.18, 0.22, 3.2, 12]} />
                  <meshStandardMaterial color="#1a1530" emissive={color} emissiveIntensity={0.35 * (1 - damage * 0.7)} roughness={0.65} metalness={0.35} />
                </mesh>
                <mesh position={[0, 3.5, 0]}>
                  <sphereGeometry args={[0.22, 12, 12]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5 * (1 - damage)} />
                </mesh>
                <pointLight position={[0, 3.5, 0]} color={color} intensity={0.8 * (1 - damage * 0.8)} distance={12} decay={2} />
              </group>
            );
          })}
          {[[-6, -8], [6, -8], [0, -2], [0, -14]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 1 — DATAFLOW: Server racks + data cables running between them
// ─────────────────────────────────────────────────────────────────────────────
function ServerRack({ x, z, h = 3, color, damage = 0 }) {
  const y = getTerrainHeightAt(x, z);
  const ledRef = useRef();
  useThrottledFrame(({ clock }) => {
    if (ledRef.current) {
      ledRef.current.material.emissiveIntensity = damage > 0.5 ? 0 : 0.5 + 0.4 * Math.sin(clock.elapsedTime * 5 + x);
    }
  }, 20);
  return (
    <group position={[x, y, z]}>
      {/* Rack body */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[1.0, h, 0.55]} />
        <meshStandardMaterial color="#0d1015" emissive={color} emissiveIntensity={0.1 * (1 - damage)} roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Drive slots */}
      {Array.from({ length: Math.floor(h * 1.5) }, (_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.55, 0.29]}>
          <boxGeometry args={[0.85, 0.3, 0.02]} />
          <meshStandardMaterial color="#151a20" emissive={color} emissiveIntensity={0.15 * (1 - damage)} roughness={0.4} metalness={0.8} />
        </mesh>
      ))}
      {/* LED strip */}
      <mesh ref={ledRef} position={[0.42, h / 2, 0]}>
        <boxGeometry args={[0.06, h * 0.85, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function ZoneData() {
  const level = useWorldStore((s) => s.getZoneLevel("data"));
  const damage = useWorldStore((s) => s.getZoneDamage("data"));
  const locked = level < 1;
  const x0 = -35, z0 = -28;
  const color = "#4ecdc4";

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={8} color={color} name="DATAFLOW" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          <Box pos={[x0, 0, z0]}     size={[7, 1.2, 6]}   color="#0d1a1f" emissive={color} emissiveIntensity={0.12} damage={damage} />
          <Box pos={[x0, 0, z0 + 3]} size={[5, 1.8, 1.2]} color="#0d1418" emissive={color} emissiveIntensity={0.15} damage={damage} />
          {/* Server racks in two rows */}
          {[[-38, -25, 3.2], [-36.5, -25, 2.8], [-35, -25, 3.5], [-33.5, -25, 2.6], [-32, -25, 3.0],
            [-38, -31, 2.8], [-36.5, -31, 3.2], [-35, -31, 2.5], [-33.5, -31, 3.0], [-32, -31, 3.4]].map(([sx, sz, sh], i) => (
            <ServerRack key={i} x={sx} z={sz} h={sh} color={color} damage={damage} />
          ))}
          {/* Data cables between racks (decorative arcs) */}
          {[[-38, -25, -38, -31], [-35, -25, -35, -31], [-32, -25, -32, -31]].map(([ax, az, bx, bz], i) => {
            const ay = getTerrainHeightAt(ax, az) + 2.5;
            const by = getTerrainHeightAt(bx, bz) + 2.5;
            const midY = Math.max(ay, by) + 0.8;
            const pts = [new THREE.Vector3(ax, ay, az), new THREE.Vector3((ax+bx)/2, midY, (az+bz)/2), new THREE.Vector3(bx, by, bz)];
            const curve = new THREE.CatmullRomCurve3(pts);
            const geo = new THREE.TubeGeometry(curve, 12, 0.025, 6, false);
            return (
              <mesh key={i} geometry={geo}>
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4 * (1 - damage)} />
              </mesh>
            );
          })}
          {/* Tall antenna tower */}
          <Cylinder pos={[x0 - 7, 0, z0 - 6]} r={0.6} h={5.5} color="#0d1418" emissive={color} emissiveIntensity={0.25} damage={damage} />
          <mesh position={[x0 - 7, getTerrainHeightAt(x0 - 7, z0 - 6) + 5.8, z0 - 6]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2 * (1 - damage)} />
          </mesh>
          <pointLight position={[x0 - 7, getTerrainHeightAt(x0 - 7, z0 - 6) + 5.8, z0 - 6]} color={color} intensity={2 * (1 - damage * 0.8)} distance={20} decay={2} />
          {[[-30, -20, 1.2], [-32, -18, 0.9], [-38, -19, 1.0], [-40, -21, 1.4]].map(([px, pz, s], i) => (
            <Crystal key={i} pos={[px, 0, pz]} scale={s} color={color} rotY={i * 0.7} damage={damage} />
          ))}
          {[[-33, -26], [-37, -30], [-30, -32], [-42, -28]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 2 — PRISME: Telescope + sensor array
// ─────────────────────────────────────────────────────────────────────────────
function Telescope({ x, z, color, damage = 0 }) {
  const dishRef = useRef();
  const y = getTerrainHeightAt(x, z);
  useThrottledFrame(({ clock }) => {
    if (dishRef.current) {
      dishRef.current.rotation.x = -Math.PI / 4 + Math.sin(clock.elapsedTime * 0.2) * 0.1;
      dishRef.current.rotation.y = clock.elapsedTime * 0.08;
    }
  }, 15);
  return (
    <group position={[x, y, z]}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 1.0, 8]} />
        <meshStandardMaterial color="#14101e" emissive={color} emissiveIntensity={0.2 * (1 - damage)} roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Tube */}
      <mesh ref={dishRef} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 2.5, 8]} />
        <meshStandardMaterial color="#14101e" emissive={color} emissiveIntensity={0.25 * (1 - damage)} roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Lens glow */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5 * (1 - damage)} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function ZoneAnalysis() {
  const level = useWorldStore((s) => s.getZoneLevel("analysis"));
  const damage = useWorldStore((s) => s.getZoneDamage("analysis"));
  const locked = level < 1;
  const x0 = 32, z0 = -35;
  const color = "#6c5ce7";

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={8} color={color} name="PRISME" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          <Box pos={[x0, 0, z0]}     size={[6, 0.5, 6]} color="#14101e" emissive={color} emissiveIntensity={0.14} damage={damage} />
          <Cylinder pos={[x0, 0, z0]} r={1.2} h={6.5}   color="#14101e" emissive={color} emissiveIntensity={0.2} damage={damage} />
          <mesh position={[x0, getTerrainHeightAt(x0, z0) + 7, z0]}>
            <octahedronGeometry args={[0.65, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2 * (1 - damage)} transparent opacity={0.9} />
          </mesh>
          <pointLight position={[x0, getTerrainHeightAt(x0, z0) + 7, z0]} color={color} intensity={3 * (1 - damage * 0.8)} distance={25} decay={2} />
          {/* Telescope array */}
          <Telescope x={x0 + 5} z={z0 - 4} color={color} damage={damage} />
          <Telescope x={x0 - 5} z={z0 - 3} color={color} damage={damage} />
          {/* Sensor panels */}
          {[[x0 + 3, z0 + 4], [x0 - 3, z0 + 5], [x0 + 6, z0 + 2]].map(([sx, sz], i) => {
            const sy = getTerrainHeightAt(sx, sz) + 1.2;
            return (
              <group key={i} position={[sx, sy, sz]} rotation={[0, i * 0.8, 0]}>
                <mesh>
                  <boxGeometry args={[1.5, 0.05, 1.0]} />
                  <meshStandardMaterial color="#14101e" emissive={color} emissiveIntensity={0.35 * (1 - damage)} roughness={0.3} metalness={0.8} />
                </mesh>
                {/* Panel stand */}
                <mesh position={[0, -1.0, 0]}>
                  <cylinderGeometry args={[0.06, 0.08, 2.0, 6]} />
                  <meshStandardMaterial color="#14101e" roughness={0.7} />
                </mesh>
              </group>
            );
          })}
          {[[28, -30, 1.3], [30, -28, 0.8], [34, -28, 1.1], [38, -30, 1.4], [36, -33, 0.9], [26, -34, 1.0], [38, -40, 1.2], [28, -40, 0.9]].map(([px, pz, s], i) => (
            <Crystal key={i} pos={[px, 0, pz]} scale={s} color={i % 2 === 0 ? color : "#5b4bd4"} rotY={i * 0.55} damage={damage} />
          ))}
          {[[x0 + 6, z0 - 5], [x0 - 6, z0 - 5]].map(([px, pz], i) => (
            <Box key={i} pos={[px, 0, pz]} size={[2.5, 2, 2]} color="#14101e" emissive={color} emissiveIntensity={0.3} damage={damage} />
          ))}
          {[[26, -30], [38, -28], [30, -42], [36, -42]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 3 — SCRIBE: Bookshelf-like structure with glowing data crystals
// ─────────────────────────────────────────────────────────────────────────────
function DataShelf({ x, z, color, damage = 0, rows = 4, cols = 3 }) {
  const y = getTerrainHeightAt(x, z);
  const slotRef = useRef([]);
  useThrottledFrame(({ clock }) => {
    slotRef.current.forEach((m, i) => {
      if (m) m.material.emissiveIntensity = (0.3 + 0.25 * Math.sin(clock.elapsedTime * 2 + i * 1.1)) * (1 - damage * 0.8);
    });
  }, 20);
  return (
    <group position={[x, y, z]}>
      {/* Frame */}
      <mesh position={[0, rows * 0.4, 0]} castShadow>
        <boxGeometry args={[cols * 0.7 + 0.15, rows * 0.8, 0.5]} />
        <meshStandardMaterial color="#1e1500" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Crystal slots */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const idx = r * cols + c;
          const cx = (c - (cols - 1) / 2) * 0.7;
          const cy = 0.4 + r * 0.8;
          return (
            <mesh
              key={idx}
              ref={(el) => { slotRef.current[idx] = el; }}
              position={[cx, cy, 0.15]}
            >
              <coneGeometry args={[0.12, 0.5, 6]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.1} metalness={0.8} transparent opacity={0.85 - damage * 0.3} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function ZoneArchive() {
  const level = useWorldStore((s) => s.getZoneLevel("archive"));
  const damage = useWorldStore((s) => s.getZoneDamage("archive"));
  const locked = level < 1;
  const x0 = -28, z0 = -52;
  const color = "#f59e0b";

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={8} color={color} name="SCRIBE" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          <Box pos={[x0, 0, z0]}     size={[8, 0.6, 7]}  color="#1a1200" emissive={color} emissiveIntensity={0.1} damage={damage} />
          <Box pos={[x0, 0, z0]}     size={[4, 2.5, 4]}  color="#1e1500" emissive="#d97706" emissiveIntensity={0.15} damage={damage} />
          {/* Data shelves */}
          <DataShelf x={x0 - 3} z={z0 - 2} color={color} damage={damage} rows={5} cols={3} />
          <DataShelf x={x0 + 3} z={z0 - 2} color={color} damage={damage} rows={4} cols={3} />
          <DataShelf x={x0}     z={z0 + 3} color={color} damage={damage} rows={3} cols={4} />
          {/* Support columns */}
          {[[-22, -46], [-34, -46], [-22, -58], [-34, -58], [-28, -46], [-28, -58]].map(([px, pz], i) => (
            <Cylinder key={i} pos={[px, 0, pz]} r={0.55} h={4 + i * 0.2} color="#1e1200" emissive={color} emissiveIntensity={0.18} damage={damage} />
          ))}
          {/* Archive doorway arch */}
          <Box pos={[x0, 0, z0 - 7]} size={[6, 3.5, 0.4]} color="#1e1500" emissive={color} emissiveIntensity={0.12} damage={damage} />
          <Box pos={[x0 - 4, 0, z0 - 7]} size={[0.4, 3.5, 0.4]} color="#1e1500" emissive={color} emissiveIntensity={0.12} damage={damage} />
          <Box pos={[x0 + 4, 0, z0 - 7]} size={[0.4, 3.5, 0.4]} color="#1e1500" emissive={color} emissiveIntensity={0.12} damage={damage} />
          {[[-20, -48, 1.0], [-36, -48, 1.1], [-24, -60, 0.8], [-32, -60, 0.9]].map(([px, pz, s], i) => (
            <Crystal key={i} pos={[px, 0, pz]} scale={s} color={color} rotY={i * 0.9} damage={damage} />
          ))}
          <pointLight position={[x0, getTerrainHeightAt(x0, z0) + 3, z0]} color={color} intensity={2 * (1 - damage * 0.8)} distance={18} decay={2} />
          {[[-22, -54], [-34, -54], [-28, -44], [-28, -62]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 4 — SIGNAL: Rotating satellite dishes
// ─────────────────────────────────────────────────────────────────────────────
function SatelliteDish({ x, z, color, damage = 0, size = 1, rotSpeed = 0.15, tiltAngle = -0.6 }) {
  const dishRef = useRef();
  const y = getTerrainHeightAt(x, z);
  useThrottledFrame(({ clock }) => {
    if (dishRef.current) {
      dishRef.current.rotation.y = clock.elapsedTime * rotSpeed;
    }
  }, 15);
  return (
    <group position={[x, y, z]}>
      {/* Mast */}
      <mesh position={[0, size * 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.07 * size, 0.1 * size, size * 2.0, 8]} />
        <meshStandardMaterial color="#0a1a0d" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Rotating dish assembly */}
      <group ref={dishRef} position={[0, size * 2.2, 0]}>
        <mesh rotation={[tiltAngle, 0, 0]}>
          <sphereGeometry args={[size * 0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#0d1f10" emissive={color} emissiveIntensity={0.3 * (1 - damage)} roughness={0.4} metalness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* Feed horn */}
        <mesh position={[0, size * 0.2, size * 0.4]} rotation={[tiltAngle, 0, 0]}>
          <cylinderGeometry args={[0.05 * size, 0.08 * size, size * 0.35, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1 * (1 - damage)} />
        </mesh>
        <pointLight position={[0, size * 0.3, 0]} color={color} intensity={0.4 * (1 - damage * 0.8)} distance={6} decay={2} />
      </group>
    </group>
  );
}

function ZoneComms() {
  const level = useWorldStore((s) => s.getZoneLevel("comms"));
  const damage = useWorldStore((s) => s.getZoneDamage("comms"));
  const locked = level < 1;
  const x0 = 42, z0 = -18;
  const color = "#22c55e";

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={7} color={color} name="SIGNAL" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          <Box pos={[x0, 0, z0]}     size={[6, 0.5, 6]} color="#0a1a0d" emissive={color} emissiveIntensity={0.12} damage={damage} />
          {/* Main tower */}
          <Cylinder pos={[x0, 0, z0]}   r={1.0} h={8}   color="#0d1f10" emissive={color} emissiveIntensity={0.18} damage={damage} />
          <mesh position={[x0, getTerrainHeightAt(x0, z0) + 8.5, z0]}>
            <torusGeometry args={[0.55, 0.12, 8, 24]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2 * (1 - damage)} />
          </mesh>
          <pointLight position={[x0, getTerrainHeightAt(x0, z0) + 8.5, z0]} color={color} intensity={2.5 * (1 - damage * 0.8)} distance={22} decay={2} />
          {/* Multiple satellite dishes */}
          <SatelliteDish x={x0 + 6}  z={z0 - 4} color={color} damage={damage} size={1.2} rotSpeed={0.12} tiltAngle={-0.5} />
          <SatelliteDish x={x0 - 6}  z={z0 - 3} color={color} damage={damage} size={0.9} rotSpeed={0.18} tiltAngle={-0.7} />
          <SatelliteDish x={x0 + 4}  z={z0 + 5} color={color} damage={damage} size={1.4} rotSpeed={0.08} tiltAngle={-0.4} />
          <SatelliteDish x={x0 - 4}  z={z0 + 5} color={color} damage={damage} size={0.8} rotSpeed={0.22} tiltAngle={-0.6} />
          {/* Antenna rods */}
          {[[48, -12, 3], [50, -16, 2.5], [50, -22, 2], [46, -8, 3.5]].map(([px, pz, h], i) => (
            <Cylinder key={i} pos={[px, 0, pz]} r={0.1} h={h} color="#0d1a10" emissive={color} emissiveIntensity={0.5} damage={damage} />
          ))}
          {[[38, -14], [44, -26], [48, -10], [52, -20]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 5 — SPIDER: Web-like structure connecting crystals
// ─────────────────────────────────────────────────────────────────────────────
function WebStrand({ from, to, color, damage = 0 }) {
  const ref = useRef();
  useThrottledFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = (0.4 + 0.2 * Math.sin(clock.elapsedTime * 1.5 + from[0])) * (1 - damage * 0.7);
  }, 15);
  const pts = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), []);
  return (
    <line ref={ref} geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={0.4} />
    </line>
  );
}

function ZonePhantom() {
  const level = useWorldStore((s) => s.getZoneLevel("phantom"));
  const damage = useWorldStore((s) => s.getZoneDamage("phantom"));
  const locked = level < 1;
  const x0 = 18, z0 = -58;
  const color = "#ef4444";

  // Crystal positions for web
  const crystalPositions = useMemo(() => [
    [12, -52], [24, -52], [14, -64], [22, -64], [10, -56], [26, -60], [18, -68]
  ], []);

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={8} color={color} name="SPIDER" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          <Box pos={[x0, 0, z0]}     size={[5, 0.35, 5]}  color="#1a0808" emissive={color} emissiveIntensity={0.1} damage={damage} />
          <Box pos={[x0 + 4, 0, z0 - 6]} size={[3, 1.5, 2.5]} color="#1a0a0a" emissive={color} emissiveIntensity={0.2} damage={damage} />
          <Box pos={[x0 - 4, 0, z0 + 4]} size={[2.5, 1.2, 3]} color="#1a0a0a" emissive="#dc2626" emissiveIntensity={0.18} damage={damage} />
          {/* Web strands between crystals */}
          {crystalPositions.map(([ax, az], i) => {
            const ay = getTerrainHeightAt(ax, az) + 1.0;
            return crystalPositions.slice(i + 1).map(([bx, bz], j) => {
              const dist = Math.hypot(ax - bx, az - bz);
              if (dist > 16) return null;
              const by = getTerrainHeightAt(bx, bz) + 1.0;
              return (
                <WebStrand
                  key={`${i}-${j}`}
                  from={[ax, ay, az]}
                  to={[bx, by, bz]}
                  color={color}
                  damage={damage}
                />
              );
            });
          })}
          {/* Hub web strand to centre */}
          {crystalPositions.map(([ax, az], i) => {
            const ay = getTerrainHeightAt(ax, az) + 1.0;
            const cy = getTerrainHeightAt(x0, z0) + 1.0;
            return (
              <WebStrand
                key={`c-${i}`}
                from={[ax, ay, az]}
                to={[x0, cy, z0]}
                color={color}
                damage={damage}
              />
            );
          })}
          <Suspense fallback={null}>
            <GltfModel path="/models/environment/Rock_Large_1.gltf" pos={[x0 - 5, 0, z0 - 4]} scale={0.9} rotY={0.4} />
            <GltfModel path="/models/environment/Rock_Large_2.gltf" pos={[x0 + 6, 0, z0 + 2]} scale={0.75} rotY={1.8} />
            <GltfModel path="/models/environment/Rock_Large_1.gltf" pos={[x0, 0, z0 - 8]}     scale={1.1} rotY={2.5} />
          </Suspense>
          {crystalPositions.map(([px, pz], i) => (
            <Crystal key={i} pos={[px, 0, pz]} scale={0.8 + (i % 3) * 0.2} color={color} rotY={i * 0.6} damage={damage} />
          ))}
          <pointLight position={[x0, getTerrainHeightAt(x0, z0) + 2, z0]} color={color} intensity={1.5 * (1 - damage * 0.8)} distance={15} decay={2} />
          {[[14, -54], [22, -54], [16, -62], [20, -62]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE 6 — CODEFORGE: Rotating gear/cog machinery
// ─────────────────────────────────────────────────────────────────────────────
function Gear({ x, z, y, radius, teeth = 12, color, damage = 0, speed = 0.5, axis = "y" }) {
  const ref = useRef();
  useThrottledFrame(({ clock }) => {
    if (ref.current) {
      const angle = clock.elapsedTime * speed;
      if (axis === "y") ref.current.rotation.y = angle;
      else if (axis === "x") ref.current.rotation.x = angle;
      else ref.current.rotation.z = angle;
    }
  }, 24);

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const innerR = radius * 0.55;
    const outerR = radius;
    const toothH = radius * 0.28;
    const toothW = (Math.PI * 2) / (teeth * 4);
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = a0 + toothW;
      const a2 = a0 + toothW * 2;
      const a3 = a0 + toothW * 3;
      if (i === 0) shape.moveTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
      else shape.lineTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
      shape.lineTo(Math.cos(a1) * (outerR + toothH), Math.sin(a1) * (outerR + toothH));
      shape.lineTo(Math.cos(a2) * (outerR + toothH), Math.sin(a2) * (outerR + toothH));
      shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, { depth: radius * 0.25, bevelEnabled: false });
  }, [radius, teeth]);

  return (
    <mesh ref={ref} geometry={geo} position={[x, y, z]} castShadow>
      <meshStandardMaterial color="#1e0d18" emissive={color} emissiveIntensity={0.35 * (1 - damage * 0.7)} roughness={0.4} metalness={0.8} />
    </mesh>
  );
}

function ZoneForge() {
  const level = useWorldStore((s) => s.getZoneLevel("forge"));
  const damage = useWorldStore((s) => s.getZoneDamage("forge"));
  const locked = level < 1;
  const x0 = -15, z0 = -62;
  const color = "#ec4899";

  return (
    <group>
      <ZoneFloor cx={x0} cz={z0} radius={9} color={color} name="CODEFORGE" locked={locked} />
      {locked ? (
        <LockIndicator cx={x0} cz={z0} color={color} />
      ) : (
        <>
          <Box pos={[x0, 0, z0]}     size={[8, 0.5, 7]}  color="#1a0815" emissive={color} emissiveIntensity={0.1} damage={damage} />
          <Box pos={[x0, 0, z0]}     size={[5, 2, 4]}    color="#1e0d18" emissive={color} emissiveIntensity={0.15} damage={damage} />
          {/* Gear machinery */}
          {(() => {
            const baseY = getTerrainHeightAt(x0, z0);
            return (
              <>
                <Gear x={x0}     z={z0}     y={baseY + 2.5} radius={1.4} teeth={14} color={color} damage={damage} speed={0.35} axis="y" />
                <Gear x={x0 + 3} z={z0}     y={baseY + 1.8} radius={0.9} teeth={10} color={color} damage={damage} speed={-0.6} axis="y" />
                <Gear x={x0 - 3} z={z0}     y={baseY + 1.8} radius={0.9} teeth={10} color={color} damage={damage} speed={-0.5} axis="y" />
                <Gear x={x0 + 5} z={z0 - 3} y={baseY + 2.2} radius={1.1} teeth={12} color={color} damage={damage} speed={0.25} axis="z" />
                <Gear x={x0 - 5} z={z0 - 3} y={baseY + 1.5} radius={0.7} teeth={8}  color={color} damage={damage} speed={-0.45} axis="x" />
              </>
            );
          })()}
          {/* Forge blocks */}
          {[[-8, -56], [-22, -56], [-8, -68], [-22, -68], [-15, -56], [-15, -68]].map(([px, pz], i) => (
            <Box key={i} pos={[px, 0, pz]} size={[2, 1.5 + i * 0.2, 1.5]} color="#1e0d18" emissive={color} emissiveIntensity={0.25 + i * 0.04} damage={damage} />
          ))}
          {/* Chimneys / vents */}
          {[[-12, -58], [-18, -58], [-10, -64], [-20, -64]].map(([px, pz], i) => (
            <Cylinder key={i} pos={[px, 0, pz]} r={0.15} h={2.5} color="#120810" emissive={color} emissiveIntensity={0.4} damage={damage} />
          ))}
          {[[-8, -58, 0.9], [-22, -58, 1.1], [-8, -66, 0.8], [-22, -66, 1.0], [-15, -70, 1.2]].map(([px, pz, s], i) => (
            <Crystal key={i} pos={[px, 0, pz]} scale={s} color={color} rotY={i * 0.8} damage={damage} />
          ))}
          <pointLight position={[x0, getTerrainHeightAt(x0, z0) + 2.5, z0]} color={color} intensity={2 * (1 - damage * 0.8)} distance={18} decay={2} />
          {[[-10, -58], [-20, -58], [-10, -66], [-20, -66]].map(([px, pz], i) => (
            <Pylon key={i} pos={[px, 0, pz]} color={color} damage={damage} />
          ))}
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorldDecoration — preserved from original
// ─────────────────────────────────────────────────────────────────────────────
function WorldDecoration() {
  return (
    <group>
      <Suspense fallback={null}>
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[-3, 0, -9]}   scale={0.9} rotY={0} />
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[5, 0, -10]}   scale={0.75} rotY={1.2} />
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[-12, 0, -42]} scale={0.8} rotY={0.6} />
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[22, 0, -48]}  scale={0.85} rotY={2.0} />
        <GltfModel path="/models/environment/Tree_Blob_1.gltf"     pos={[-18, 0, -15]} scale={1.0} rotY={0.5} />
        <GltfModel path="/models/environment/Tree_Blob_1.gltf"     pos={[20, 0, -14]}  scale={0.85} rotY={2.1} />
        <GltfModel path="/models/environment/Tree_Blob_3.gltf"     pos={[-5, 0, -30]}  scale={1.1} rotY={0.8} />
        <GltfModel path="/models/environment/Tree_Blob_3.gltf"     pos={[8, 0, -44]}   scale={0.9} rotY={1.8} />
        <GltfModel path="/models/environment/Tree_Blob_3.gltf"     pos={[-45, 0, -38]} scale={1.0} rotY={1.2} />
        <GltfModel path="/models/environment/Tree_Blob_1.gltf"     pos={[55, 0, -32]}  scale={1.1} rotY={0.3} />
        <GltfModel path="/models/environment/Building_L.gltf"      pos={[-55, 0, -12]} scale={0.55} rotY={Math.PI * 0.25} />
        <GltfModel path="/models/environment/Building_L.gltf"      pos={[52, 0, -48]}  scale={0.5} rotY={Math.PI * 0.75} />
        <GltfModel path="/models/environment/Base_Large.gltf"      pos={[0, 0, -82]}   scale={0.65} rotY={0} />
        <GltfModel path="/models/environment/Base_Large.gltf"      pos={[-60, 0, -55]} scale={0.55} rotY={1.0} />
        <GltfModel path="/models/environment/Rock_Large_2.gltf"    pos={[-20, 0, -20]} scale={1.2} rotY={0.3} />
        <GltfModel path="/models/environment/Rock_Large_1.gltf"    pos={[14, 0, -20]}  scale={1.0} rotY={1.1} />
        <GltfModel path="/models/environment/Rock_Large_2.gltf"    pos={[5, 0, -38]}   scale={1.3} rotY={2.4} />
        <GltfModel path="/models/environment/Rock_Large_1.gltf"    pos={[-50, 0, -46]} scale={1.4} rotY={0.7} />
        <GltfModel path="/models/environment/Rock_Large_2.gltf"    pos={[56, 0, -42]}  scale={1.1} rotY={1.5} />
        <RotatingPlanet path="/models/environment/Planet_2.gltf"   pos={[50, 22, -90]} scale={10} />
      </Suspense>
      {[
        [-14, -4, 0.8, "#ff6b35"], [12, -4, 0.7, "#4ecdc4"], [-2, -18, 1.0, "#6c5ce7"], [20, -4, 0.9, "#22c55e"],
        [-22, -34, 1.1, "#4ecdc4"], [0, -50, 0.9, "#6c5ce7"], [42, -8, 0.8, "#22c55e"], [-40, -18, 1.0, "#4ecdc4"],
        [35, -22, 0.7, "#6c5ce7"], [-8, -76, 1.2, "#ec4899"], [26, -72, 0.9, "#ef4444"], [-50, -70, 1.0, "#4ecdc4"],
      ].map(([px, pz, s, c], i) => (
        <Crystal key={i} pos={[px, 0, pz]} scale={s} color={c} rotY={i * 0.7} />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function Structures() {
  return (
    <group>
      <ZoneHub />
      <ZoneData />
      <ZoneAnalysis />
      <ZoneArchive />
      <ZoneComms />
      <ZonePhantom />
      <ZoneForge />
      <WorldDecoration />
    </group>
  );
}

const ALL_MODELS = [
  "/models/environment/Tree_Floating_1.gltf",
  "/models/environment/Tree_Blob_1.gltf",
  "/models/environment/Tree_Blob_3.gltf",
  "/models/environment/Rock_Large_1.gltf",
  "/models/environment/Rock_Large_2.gltf",
  "/models/environment/Building_L.gltf",
  "/models/environment/Base_Large.gltf",
  "/models/environment/Planet_2.gltf",
];
ALL_MODELS.forEach((p) => useGLTF.preload(p));
