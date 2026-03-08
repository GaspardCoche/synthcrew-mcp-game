/**
 * Détails monde : chemins entre zones, balises, panneaux.
 * Les chemins et balises apparaissent quand la zone cible a level >= 1.
 */
import { getTerrainHeightAt } from "./Terrain";
import { useWorldStore } from "../store/worldStore";

const HUB = [0, 0, -8];
const ZONES = [
  { key: "data", center: [-35, 0, -28], color: "#00f0ff" },
  { key: "analysis", center: [32, 0, -35], color: "#a855f7" },
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
    const y = getTerrainHeightAt(mx, mz) + 0.02;
    const len = Math.hypot(x1 - x0, z1 - z0) || 1;
    const angle = Math.atan2(z1 - z0, x1 - x0);
    segments.push(
      <mesh
        key={i}
        position={[mx, y, mz]}
        rotation={[0, -angle, 0]}
        receiveShadow
      >
        <boxGeometry args={[len + 0.5, 0.04, 0.8]} />
        <meshStandardMaterial
          color="#0a0a12"
          emissive={color}
          emissiveIntensity={0.06}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
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
        <cylinderGeometry args={[0.04, 0.06, 1.2, 6]} />
        <meshStandardMaterial color="#0f0e14" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight
        position={[0, 0.7, 0]}
        color={color}
        intensity={0.15}
        distance={6}
        decay={2}
      />
    </group>
  );
}

function SignPost({ pos, color }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 6]} />
        <meshStandardMaterial color="#1a1820" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.5, 0.02, 0.25]} />
        <meshStandardMaterial
          color="#0d0d12"
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.8}
        />
      </mesh>
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

export default function WorldDetails() {
  const getZoneLevel = useWorldStore((s) => s.getZoneLevel);

  return (
    <group>
      {ZONES.map((zone) => {
        const level = getZoneLevel(zone.key);
        if (level < 1) return null;
        const from = HUB;
        const to = zone.center;
        const dx = to[0] - from[0];
        const dz = to[2] - from[2];
        const dist = Math.hypot(dx, dz);
        const pylonCount = Math.max(2, Math.floor(dist / 8));
        const pylons = [];
        for (let i = 1; i < pylonCount; i++) {
          const t = i / pylonCount;
          pylons.push([
            from[0] + dx * t,
            from[2] + dz * t,
          ]);
        }
        return (
          <group key={zone.key}>
            <PathSegment from={from} to={to} color={zone.color} steps={Math.max(12, Math.floor(dist / 2.5))} />
            {pylons.map(([px, pz], i) => (
              <PathPylon key={i} pos={[px, 0, pz]} color={zone.color} />
            ))}
            <SignPost
              pos={[to[0] * 0.4, 0, to[2] * 0.4]}
              color={zone.color}
            />
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
