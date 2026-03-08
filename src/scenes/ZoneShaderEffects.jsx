/**
 * ZoneShaderEffects — Uses custom GLSL shaders to add visual flair per zone.
 * Holographic data screens, neon grid floors, plasma cores, data stream panels.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeightAt } from "./Terrain";
import {
  HolographicMaterial,
  NeonGridMaterial,
  DataStreamMaterial,
  PlasmaMaterial,
} from "./ShaderMaterials";

const ZONES = {
  NEXUS:     { pos: [0, -8],    color: "#ff6b35" },
  DATAFLOW:  { pos: [-35, -28], color: "#6c5ce7" },
  PRISME:    { pos: [32, -35],  color: "#74b9ff" },
  SCRIBE:    { pos: [-28, -52], color: "#ffd93d" },
  SIGNAL:    { pos: [42, -18],  color: "#00b894" },
  SPIDER:    { pos: [18, -58],  color: "#ff6b6b" },
  CODEFORGE: { pos: [-15, -62], color: "#fd79a8" },
};

function HolographicScreen({ position, color, rotation = [0, 0, 0], width = 1.6, height = 1.0 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <HolographicMaterial color={color} opacity={0.6} />
    </mesh>
  );
}

function DataStreamPanel({ position, color, rotation = [0, 0, 0], width = 0.8, height = 2.0 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <DataStreamMaterial color={color} speed={0.5} density={12} />
    </mesh>
  );
}

function PlasmaCore({ position, radius = 0.3, colorA, colorB, colorC }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.5;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.2;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[radius, 3]} />
      <PlasmaMaterial colorA={colorA} colorB={colorB} colorC={colorC} />
    </mesh>
  );
}

function NeonFloor({ position, size = 8, color }) {
  const y = getTerrainHeightAt(position[0], position[2]) + 0.03;
  return (
    <mesh position={[position[0], y, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <NeonGridMaterial color={color} gridSize={8} lineWidth={0.03} pulse={0.6} />
    </mesh>
  );
}

function FloatingDataRing({ position, color, radius = 2.5 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.4;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.08;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <torusGeometry args={[radius, 0.015, 8, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[radius * 0.7, 0.01, 8, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export default function ZoneShaderEffects() {
  return (
    <group>
      {/* NEXUS Hub — neon grid floor + holographic command screens */}
      <NeonFloor position={[0, 0, -8]} size={12} color="#ff6b35" />
      <FloatingDataRing
        position={[0, getTerrainHeightAt(0, -8) + 5, -8]}
        color="#ff6b35"
        radius={3}
      />
      <HolographicScreen
        position={[3.5, getTerrainHeightAt(3.5, -10) + 2.5, -10]}
        color="#ff6b35"
        rotation={[0, -0.4, 0]}
      />
      <HolographicScreen
        position={[-3.5, getTerrainHeightAt(-3.5, -10) + 2.5, -10]}
        color="#ff6b35"
        rotation={[0, 0.4, 0]}
      />

      {/* DATAFLOW — data stream waterfalls + plasma core */}
      <DataStreamPanel
        position={[-37, getTerrainHeightAt(-37, -26) + 2, -26]}
        color="#6c5ce7"
        rotation={[0, 0.5, 0]}
        width={1.0}
        height={3}
      />
      <DataStreamPanel
        position={[-33, getTerrainHeightAt(-33, -30) + 2, -30]}
        color="#7b6ef7"
        rotation={[0, -0.3, 0]}
        width={0.8}
        height={2.5}
      />
      <PlasmaCore
        position={[-35, getTerrainHeightAt(-35, -28) + 3.5, -28]}
        radius={0.35}
        colorA="#6c5ce7"
        colorB="#a29bfe"
        colorC="#00e5ff"
      />

      {/* PRISME — analysis holographic displays */}
      <NeonFloor position={[32, 0, -35]} size={9} color="#74b9ff" />
      <HolographicScreen
        position={[34, getTerrainHeightAt(34, -33) + 2.2, -33]}
        color="#74b9ff"
        rotation={[0, -0.6, 0]}
        width={1.8}
        height={1.2}
      />
      <FloatingDataRing
        position={[32, getTerrainHeightAt(32, -35) + 4, -35]}
        color="#74b9ff"
        radius={2}
      />

      {/* SCRIBE — archive data streams */}
      <DataStreamPanel
        position={[-26, getTerrainHeightAt(-26, -50) + 2, -50]}
        color="#ffd93d"
        rotation={[0, 0.2, 0]}
        width={1.2}
        height={2.8}
      />
      <HolographicScreen
        position={[-30, getTerrainHeightAt(-30, -53) + 1.8, -53]}
        color="#ffd93d"
        rotation={[0, 0.4, 0]}
      />

      {/* SIGNAL — comms neon floor + floating rings */}
      <NeonFloor position={[42, 0, -18]} size={8} color="#00b894" />
      <FloatingDataRing
        position={[42, getTerrainHeightAt(42, -18) + 4.5, -18]}
        color="#00b894"
        radius={2.5}
      />

      {/* SPIDER — web plasma core */}
      <PlasmaCore
        position={[18, getTerrainHeightAt(18, -58) + 3, -58]}
        radius={0.4}
        colorA="#ff6b6b"
        colorB="#ff4444"
        colorC="#ff9999"
      />
      <DataStreamPanel
        position={[20, getTerrainHeightAt(20, -56) + 1.5, -56]}
        color="#ff6b6b"
        rotation={[0, -0.5, 0]}
        width={0.7}
        height={2}
      />

      {/* CODEFORGE — forge neon grid + plasma */}
      <NeonFloor position={[-15, 0, -62]} size={9} color="#fd79a8" />
      <PlasmaCore
        position={[-15, getTerrainHeightAt(-15, -62) + 3.5, -62]}
        radius={0.3}
        colorA="#fd79a8"
        colorB="#e056a0"
        colorC="#ff99cc"
      />
    </group>
  );
}
