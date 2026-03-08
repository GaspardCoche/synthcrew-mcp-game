/**
 * SpecialEffects — cinematic special effects for SynthCrew world.
 * LightningBolt, HologramProjector, EnergyField, MissionBeam,
 * ZoneActivationEffect, AgentSpawnEffect.
 */
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useThrottledFrame } from "../lib/useThrottledFrame";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeightAt } from "./Terrain";

// ─────────────────────────────────────────────────────────────────────────────
// LightningBolt — random arcing bolt between two points
// ─────────────────────────────────────────────────────────────────────────────
function buildLightningPoints(start, end, segments = 12, jitter = 0.8) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const base = new THREE.Vector3().lerpVectors(start, end, t);
    if (i > 0 && i < segments) {
      base.x += (Math.random() - 0.5) * jitter;
      base.y += (Math.random() - 0.5) * jitter * 0.5;
      base.z += (Math.random() - 0.5) * jitter;
    }
    pts.push(base);
  }
  return pts;
}

export function LightningBolt({ start, end, color = "#88eeff", visible = true }) {
  const lineRef = useRef();
  const matRef = useRef();
  const geoRef = useRef();

  const geometry = useMemo(() => {
    const pts = buildLightningPoints(
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
      14, 0.9
    );
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
  }, [start, end]);

  useEffect(() => {
    geoRef.current = geometry;
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!matRef.current || !visible) return;
    const t = clock.elapsedTime;
    const active = Math.sin(t * 42) > 0.6 || Math.sin(t * 17 + 1) > 0.75;
    matRef.current.opacity = active ? 0.6 + Math.random() * 0.4 : 0;
    if (active && geoRef.current) {
      const pts = buildLightningPoints(
        new THREE.Vector3(...start),
        new THREE.Vector3(...end),
        14, 0.9
      );
      const curve = new THREE.CatmullRomCurve3(pts);
      const positions = curve.getPoints(40).flatMap(p => [p.x, p.y, p.z]);
      const attr = geoRef.current.attributes.position;
      if (attr && attr.array.length === positions.length) {
        for (let i = 0; i < positions.length; i++) attr.array[i] = positions[i];
        attr.needsUpdate = true;
      }
    }
  });

  if (!visible) return null;
  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial ref={matRef} color={color} transparent opacity={0} linewidth={1} />
    </line>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HologramProjector — spinning hologram disc + avatar ring
// ─────────────────────────────────────────────────────────────────────────────
export function HologramProjector({ position = [0, 0, 0], color = "#00e5ff", label = "AGENT", size = 1 }) {
  const ringRef = useRef();
  const coneRef = useRef();
  const discRef = useRef();

  useThrottledFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 1.2;
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
    if (coneRef.current) {
      coneRef.current.rotation.y = -t * 0.8;
    }
    if (discRef.current) {
      discRef.current.material.opacity = 0.2 + 0.15 * Math.sin(t * 3);
    }
  }, 24);

  const [px, py, pz] = position;

  return (
    <group position={[px, py, pz]}>
      {/* Base projector disc */}
      <mesh>
        <cylinderGeometry args={[size * 0.5, size * 0.6, size * 0.1, 32]} />
        <meshStandardMaterial color="#111" emissive={color} emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Projection cone */}
      <mesh ref={coneRef} position={[0, size * 0.8, 0]}>
        <coneGeometry args={[size * 0.35, size * 1.4, 6, 1, true]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Hologram disc at top */}
      <mesh ref={discRef} position={[0, size * 1.6, 0]}>
        <cylinderGeometry args={[size * 0.4, size * 0.4, 0.02, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} transparent opacity={0.25} />
      </mesh>
      {/* Spinning ring */}
      <group ref={ringRef} position={[0, size * 1.6, 0]}>
        <mesh>
          <torusGeometry args={[size * 0.4, size * 0.025, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 0.3, size * 0.015, 8, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
      </group>
      {/* Label */}
      <Billboard position={[0, size * 2.4, 0]}>
        <Text fontSize={size * 0.18} color={color} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000">
          {label}
        </Text>
      </Billboard>
      <pointLight position={[0, size * 1.6, 0]} color={color} intensity={0.6} distance={8} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EnergyField — translucent dome around agent zone
// ─────────────────────────────────────────────────────────────────────────────
export function EnergyField({ position = [0, 0, 0], radius = 12, color = "#4ecdc4", active = false }) {
  const ref = useRef();

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const base = active ? 0.08 : 0.02;
    ref.current.material.opacity = base + 0.04 * Math.sin(t * 2.0);
    ref.current.material.color.set(color);
    // Pulse scale when active
    const s = active ? 1 + 0.02 * Math.sin(t * 3) : 1;
    ref.current.scale.setScalar(s);
  }, 20);

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={active ? 0.08 : 0.02}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MissionBeam — vertical light column (shows when mission starts/ends)
// ─────────────────────────────────────────────────────────────────────────────
export function MissionBeam({ position = [0, 0, 0], color = "#fff", active = false, height = 40 }) {
  const beamRef = useRef();
  const glowRef = useRef();

  useThrottledFrame(({ clock }) => {
    if (!beamRef.current || !glowRef.current) return;
    const t = clock.elapsedTime;
    const alpha = active ? 0.15 + 0.1 * Math.sin(t * 4) : 0;
    beamRef.current.material.opacity = alpha;
    glowRef.current.material.opacity = active ? 0.35 + 0.2 * Math.sin(t * 3 + 1) : 0;
    // Slow rotation
    if (glowRef.current) glowRef.current.rotation.y = t * 0.5;
  }, 24);

  if (!active) return null;

  const [px, py, pz] = position;
  return (
    <group position={[px, py, pz]}>
      {/* Core beam */}
      <mesh ref={beamRef} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.3, height, 16, 1, true]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Outer glow cone */}
      <mesh ref={glowRef} position={[0, height / 2, 0]}>
        <coneGeometry args={[1.5, height, 16, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 1, 0]} color={color} intensity={3} distance={15} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZoneActivationEffect — expanding ring ripple when zone unlocks
// ─────────────────────────────────────────────────────────────────────────────
export function ZoneActivationEffect({ position = [0, 0, 0], color = "#fff", trigger = false }) {
  const ringsRef = useRef([]);
  const progressRef = useRef(trigger ? 0 : 1);
  const activeRef = useRef(trigger);

  useEffect(() => {
    if (trigger) {
      progressRef.current = 0;
      activeRef.current = true;
    }
  }, [trigger]);

  const [px, py, pz] = position;

  useFrame((_, delta) => {
    if (!activeRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 0.4);
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const t = Math.max(0, progressRef.current - i * 0.2);
      const scale = 1 + t * 14;
      ring.scale.setScalar(scale);
      ring.material.opacity = Math.max(0, 0.6 * (1 - t));
    });
    if (progressRef.current >= 1) activeRef.current = false;
  });

  if (!trigger && progressRef.current >= 1) return null;

  return (
    <group position={[px, py + 0.05, pz]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => { ringsRef.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.0, 1.25, 48]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AgentSpawnEffect — portal ring + arrival animation when agent spawns
// ─────────────────────────────────────────────────────────────────────────────
export function AgentSpawnEffect({ position = [0, 0, 0], color = "#a855f7", active = false }) {
  const portalRef = useRef();
  const particlesRef = useRef();
  const timeRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!active) return;
    timeRef.current += delta;
    const t = timeRef.current;
    if (portalRef.current) {
      portalRef.current.rotation.z = t * 2.5;
      portalRef.current.rotation.x = Math.sin(t * 1.2) * 0.3;
      const scale = Math.min(1, t * 2);
      portalRef.current.scale.setScalar(scale);
      portalRef.current.material.opacity = Math.max(0, 0.7 - Math.max(0, t - 1.5) * 0.5);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 1.8;
    }
  });

  useEffect(() => {
    if (active) timeRef.current = 0;
  }, [active]);

  if (!active) return null;

  const [px, py, pz] = position;
  return (
    <group position={[px, py, pz]}>
      {/* Portal ring */}
      <mesh ref={portalRef}>
        <torusGeometry args={[1.2, 0.08, 12, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.7} />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <circleGeometry args={[1.1, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {/* Particle orbit ring */}
      <group ref={particlesRef}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 1.2, Math.sin(angle) * 0.2, Math.sin(angle) * 1.2]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
          );
        })}
      </group>
      <pointLight color={color} intensity={4} distance={10} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorldPylonLightning — lightning between energy pylons in a zone
// Takes an array of pylon world positions and draws arcs between neighbours
// ─────────────────────────────────────────────────────────────────────────────
export function WorldPylonLightning({ pylons = [], color = "#88eeff", active = true }) {
  if (!active || pylons.length < 2) return null;
  // Only draw between consecutive pylons
  const pairs = [];
  for (let i = 0; i < pylons.length - 1; i++) {
    pairs.push([pylons[i], pylons[i + 1]]);
  }
  return (
    <>
      {pairs.map(([a, b], i) => {
        const midH = getTerrainHeightAt((a[0] + b[0]) / 2, (a[2] + b[2]) / 2) + 3;
        const startVec = [a[0], getTerrainHeightAt(a[0], a[2]) + 2, a[2]];
        const endVec = [b[0], getTerrainHeightAt(b[0], b[2]) + 2, b[2]];
        return (
          <LightningBolt
            key={i}
            start={startVec}
            end={endVec}
            color={color}
            visible={active}
          />
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export — composite scene-level effects manager
// ─────────────────────────────────────────────────────────────────────────────
const ZONE_POSITIONS = {
  NEXUS:     [0, 0, -8],
  DATAFLOW:  [-35, 0, -28],
  PRISME:    [32, 0, -35],
  SCRIBE:    [-28, 0, -52],
  SIGNAL:    [42, 0, -18],
  SPIDER:    [18, 0, -58],
  CODEFORGE: [-15, 0, -62],
};

const ZONE_COLORS = {
  NEXUS:     "#ff6b35",
  DATAFLOW:  "#4ecdc4",
  PRISME:    "#6c5ce7",
  SCRIBE:    "#f59e0b",
  SIGNAL:    "#22c55e",
  SPIDER:    "#ef4444",
  CODEFORGE: "#ec4899",
};

export default function SpecialEffects({ activeZones = [], missionActive = false, missionZone = "NEXUS" }) {
  return (
    <>
      {/* Energy fields around every zone */}
      {Object.entries(ZONE_POSITIONS).map(([name, pos]) => {
        const groundY = getTerrainHeightAt(pos[0], pos[2]);
        return (
          <EnergyField
            key={name}
            position={[pos[0], groundY, pos[2]]}
            radius={14}
            color={ZONE_COLORS[name]}
            active={activeZones.includes(name)}
          />
        );
      })}

      {/* Mission beam on active zone */}
      {missionActive && ZONE_POSITIONS[missionZone] && (() => {
        const pos = ZONE_POSITIONS[missionZone];
        const groundY = getTerrainHeightAt(pos[0], pos[2]);
        return (
          <MissionBeam
            position={[pos[0], groundY, pos[2]]}
            color={ZONE_COLORS[missionZone]}
            active={missionActive}
            height={45}
          />
        );
      })()}

      {/* Hologram projectors at each zone hub */}
      {Object.entries(ZONE_POSITIONS).map(([name, pos]) => {
        const groundY = getTerrainHeightAt(pos[0], pos[2]);
        return (
          <HologramProjector
            key={`holo-${name}`}
            position={[pos[0] + 3, groundY, pos[2] - 3]}
            color={ZONE_COLORS[name]}
            label={name}
            size={0.7}
          />
        );
      })}
    </>
  );
}
