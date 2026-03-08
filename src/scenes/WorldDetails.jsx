import { useRef } from "react";
import { useThrottledFrame } from "../lib/useThrottledFrame";
import { getTerrainHeightAt } from "./Terrain";
import { useWorldStore } from "../store/worldStore";

const HUB = [0, 0, -8];
const ZONES = [
  { key: "data", center: [-35, 0, -28], color: "#4ecdc4" },
  { key: "analysis", center: [32, 0, -35], color: "#6c5ce7" },
  { key: "archive", center: [-28, 0, -52], color: "#f59e0b" },
  { key: "comms", center: [42, 0, -18], color: "#22c55e" },
  { key: "phantom", center: [18, 0, -58], color: "#ef4444" },
  { key: "forge", center: [-15, 0, -62], color: "#ec4899" },
];

function PathSegment({ from, to, color, steps = 14 }) {
  const segments = [];
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const x0 = from[0] + (to[0] - from[0]) * t0;
    const z0 = from[2] + (to[2] - from[2]) * t0;
    const x1 = from[0] + (to[0] - from[0]) * t1;
    const z1 = from[2] + (to[2] - from[2]) * t1;
    const mx = (x0 + x1) / 2;
    const mz = (z0 + z1) / 2;
    const y = getTerrainHeightAt(mx, mz) + 0.06;
    const len = Math.hypot(x1 - x0, z1 - z0) || 1;
    const angle = Math.atan2(z1 - z0, x1 - x0);
    segments.push(
      <group key={i}>
        <mesh position={[mx, y, mz]} rotation={[0, -angle, 0]} receiveShadow>
          <boxGeometry args={[len + 0.5, 0.06, 1.2]} />
          <meshStandardMaterial color="#141822" emissive={color} emissiveIntensity={0.2} roughness={0.7} metalness={0.15} />
        </mesh>
        <mesh position={[mx, y + 0.04, mz]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[len + 0.3, 0.02, 0.15]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }
  return <group>{segments}</group>;
}

function PathPylon({ pos, color }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 8]} />
        <meshStandardMaterial color="#1a1828" emissive={color} emissiveIntensity={0.15} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.15} />
      </mesh>
      <pointLight position={[0, 0.9, 0]} color={color} intensity={0.5} distance={8} decay={2} />
    </group>
  );
}

function SignPost({ pos, color }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.6, 8]} />
        <meshStandardMaterial color="#1a1828" emissive={color} emissiveIntensity={0.1} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.8, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.6, 0.03, 0.3]} />
        <meshStandardMaterial color="#141822" emissive={color} emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      <pointLight position={[0, 1.8, 0.3]} color={color} intensity={0.3} distance={5} decay={2} />
    </group>
  );
}

function Crate({ pos, scale = 1 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z) + 0.25 * scale;
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[0.5 * scale, 0.5 * scale, 0.5 * scale]} />
      <meshStandardMaterial color="#1a1510" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function EnergyBeam({ from, to, color }) {
  const ref = useRef();
  const mx = (from[0] + to[0]) / 2;
  const mz = (from[2] + to[2]) / 2;
  const midY = Math.max(getTerrainHeightAt(mx, mz), getTerrainHeightAt(from[0], from[2]), getTerrainHeightAt(to[0], to[2]));
  const beamHeight = midY + 3;
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const dist = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);

  useThrottledFrame((state) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
  }, 15);

  return (
    <group>
      <mesh
        ref={ref}
        position={[mx, beamHeight, mz]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[dist, 0.04, 0.25]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh position={[mx, beamHeight, mz]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[dist, 0.15, 0.6]} />
        <meshBasicMaterial color={color} transparent opacity={0.03} />
      </mesh>
    </group>
  );
}

function LockedZoneMarker({ pos, color }) {
  const ref = useRef();
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);

  useThrottledFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.4;
    ref.current.position.y = y + 2.0 + Math.sin(state.clock.elapsedTime * 0.8) * 0.4;
  }, 15);

  return (
    <group position={[x, y, z]}>
      <mesh ref={ref}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.35} wireframe />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <pointLight position={[0, 2.0, 0]} color={color} intensity={0.4} distance={8} decay={2} />
    </group>
  );
}

export default function WorldDetails() {
  const getZoneLevel = useWorldStore((s) => s.getZoneLevel);

  return (
    <group>
      {ZONES.map((zone) => {
        const level = getZoneLevel(zone.key);
        const from = HUB;
        const to = zone.center;
        const dx = to[0] - from[0];
        const dz = to[2] - from[2];
        const dist = Math.hypot(dx, dz);

        if (level < 1) {
          return (
            <group key={zone.key}>
              <LockedZoneMarker pos={to} color={zone.color} />
            </group>
          );
        }

        const pylonCount = Math.max(2, Math.floor(dist / 8));
        const pylons = [];
        for (let i = 1; i < pylonCount; i++) {
          const t = i / pylonCount;
          pylons.push([from[0] + dx * t, from[2] + dz * t]);
        }

        return (
          <group key={zone.key}>
            <PathSegment from={from} to={to} color={zone.color} steps={Math.max(12, Math.floor(dist / 2.5))} />
            <EnergyBeam from={from} to={to} color={zone.color} />
            {pylons.map(([px, pz], i) => (
              <PathPylon key={i} pos={[px, 0, pz]} color={zone.color} />
            ))}
            <SignPost pos={[to[0] * 0.4, 0, to[2] * 0.4]} color={zone.color} />
            {[0.3, 0.55, 0.8].map((t, i) => {
              const cx = from[0] + dx * t + (i - 1) * 1.2;
              const cz = from[2] + dz * t + (i % 2) * 0.6;
              return <Crate key={i} pos={[cx, 0, cz]} scale={0.5 + i * 0.2} />;
            })}
          </group>
        );
      })}
    </group>
  );
}
