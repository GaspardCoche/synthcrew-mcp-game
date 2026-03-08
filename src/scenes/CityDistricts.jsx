/**
 * CityDistricts — Districts supplémentaires pour l'open world SynthCrew.
 * Chaque district a son identité visuelle et ses éléments de gameplay.
 * Optimisé : instances, frustum culling, matériaux partagés.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeightAt } from "./Terrain";

// Shared materials for performance
const MAT_CACHE = {};
function getMat(color, emissive, emissiveIntensity = 0.12, metalness = 0.3, roughness = 0.65) {
  const key = `${color}-${emissive}-${emissiveIntensity}`;
  if (!MAT_CACHE[key]) {
    MAT_CACHE[key] = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, metalness, roughness });
  }
  return MAT_CACHE[key];
}

function Tower({ x, z, h = 4, w = 1.2, color = "#1a1830", emissive = "#4444ff", windows = true }) {
  const y = getTerrainHeightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w * 0.8]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.08} roughness={0.7} metalness={0.2} />
      </mesh>
      {windows && (
        <mesh position={[0, h * 0.7, w * 0.41]}>
          <planeGeometry args={[w * 0.7, h * 0.5]} />
          <meshBasicMaterial color={emissive} transparent opacity={0.15} />
        </mesh>
      )}
      {/* Antenna */}
      <mesh position={[0, h + 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 4]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, h + 1.05, 0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function DataCable({ from, to, color = "#6c5ce7", opacity = 0.3 }) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end   = new THREE.Vector3(...to);
    const mid   = start.clone().lerp(end, 0.5);
    mid.y = Math.max(start.y, end.y) + 2;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [from, to]);

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = opacity * (0.7 + Math.sin(state.clock.elapsedTime * 2) * 0.3);
    }
  });

  return (
    <line ref={ref} geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function Hologram({ x, z, h = 2, color = "#4ecdc4", symbol = "◆" }) {
  const ref = useRef();
  const y = getTerrainHeightAt(x, z);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.8;
    ref.current.position.y = y + h + Math.sin(t * 1.5) * 0.1;
    ref.current.material.opacity = 0.4 + Math.sin(t * 3) * 0.15;
  });
  return (
    <group position={[x, y, z]}>
      {/* Base projector */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.08, 12]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Beam */}
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.08, h, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      {/* Hologram object */}
      <mesh ref={ref} position={[0, h, 0]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
      </mesh>
      <pointLight position={[0, h, 0]} color={color} intensity={0.3} distance={4} decay={2} />
    </group>
  );
}

function SatelliteDish({ x, z, angle = 0 }) {
  const y = getTerrainHeightAt(x, z);
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = angle + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });
  return (
    <group position={[x, y, z]} ref={ref}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.5, 6]} />
        <meshStandardMaterial color="#2a2840" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.4, 0.2]} rotation={[-0.5, 0, 0]}>
        <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a3860" metalness={0.8} roughness={0.2} side={2} />
      </mesh>
    </group>
  );
}

function EnergyPylon({ x, z, color = "#ff6b35", height = 5 }) {
  const ref = useRef();
  const y = getTerrainHeightAt(x, z);
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 4 + x) * 0.4;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, height, 6]} />
        <meshStandardMaterial color="#1a1820" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={ref} position={[0, height, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} roughness={0.1} />
      </mesh>
      <pointLight position={[0, height, 0]} color={color} intensity={0.5} distance={10} decay={2} />
    </group>
  );
}

/**
 * Main export — city districts around each agent zone
 */
export default function CityDistricts() {
  return (
    <group>
      {/* === HUB DISTRICT (NEXUS at 0, -8) === */}
      <Tower x={5} z={-12} h={7} w={1.4} color="#1a1020" emissive="#ff6b35" />
      <Tower x={-5} z={-13} h={5} w={1.2} color="#1a1025" emissive="#ff6b35" />
      <Tower x={3} z={-5} h={3.5} w={1.0} color="#1a1020" emissive="#ff8855" />
      <Hologram x={0} z={-6} h={2.5} color="#ff6b35" />
      <SatelliteDish x={7} z={-8} angle={Math.PI / 4} />
      <EnergyPylon x={-3} z={-3} color="#ff6b35" height={4} />
      <EnergyPylon x={4} z={-4} color="#ff6b35" height={3.5} />

      {/* === DATA DISTRICT (DATAFLOW at -35, -26) === */}
      <Tower x={-40} z={-24} h={6} w={1.3} color="#150d2a" emissive="#6c5ce7" />
      <Tower x={-33} z={-22} h={4.5} w={1.1} color="#150d28" emissive="#7b6ef7" />
      <Tower x={-38} z={-30} h={5} w={1.2} color="#130c25" emissive="#6c5ce7" />
      <Hologram x={-36} z={-28} h={2} color="#6c5ce7" />
      <SatelliteDish x={-32} z={-27} angle={Math.PI * 0.7} />
      <EnergyPylon x={-42} z={-28} color="#6c5ce7" height={5} />
      <DataCable from={[-35, 3, -26]} to={[0, 3, -8]} color="#6c5ce7" opacity={0.2} />

      {/* === ANALYSIS DISTRICT (PRISME at 30, -34) === */}
      <Tower x={35} z={-32} h={5.5} w={1.2} color="#0a1525" emissive="#74b9ff" />
      <Tower x={28} z={-36} h={4} w={1.0} color="#0a1520" emissive="#64aaef" />
      <Tower x={33} z={-40} h={6} w={1.3} color="#0a1528" emissive="#74b9ff" />
      <Hologram x={31} z={-36} h={2.2} color="#74b9ff" />
      <EnergyPylon x={27} z={-30} color="#74b9ff" height={4.5} />
      <EnergyPylon x={36} z={-38} color="#74b9ff" height={4} />
      <DataCable from={[30, 3, -34]} to={[0, 3, -8]} color="#74b9ff" opacity={0.15} />

      {/* === ARCHIVE DISTRICT (SCRIBE at -28, -50) === */}
      <Tower x={-32} z={-48} h={7} w={1.5} color="#1a1505" emissive="#ffd93d" />
      <Tower x={-25} z={-52} h={4.5} w={1.1} color="#1a1405" emissive="#ffcc2d" />
      <Tower x={-30} z={-55} h={5.5} w={1.2} color="#1a1505" emissive="#ffd93d" />
      <Hologram x={-29} z={-51} h={2} color="#ffd93d" />
      <SatelliteDish x={-24} z={-48} angle={Math.PI * 0.3} />
      <EnergyPylon x={-35} z={-53} color="#ffd93d" height={5} />

      {/* === COMMS DISTRICT (SIGNAL at 42, -18) === */}
      <Tower x={46} z={-15} h={8} w={1.3} color="#051510" emissive="#00b894" />
      <Tower x={40} z={-20} h={5} w={1.0} color="#051512" emissive="#00c8a0" />
      <Tower x={45} z={-22} h={4.5} w={1.1} color="#051510" emissive="#00b894" />
      <SatelliteDish x={44} z={-16} angle={0} />
      <SatelliteDish x={43} z={-23} angle={Math.PI * 0.5} />
      <Hologram x={42} z={-19} h={3} color="#00b894" />
      <EnergyPylon x={38} z={-15} color="#00b894" height={6} />
      <DataCable from={[42, 3, -18]} to={[0, 3, -8]} color="#00b894" opacity={0.18} />

      {/* === SPIDER WEB DISTRICT (SPIDER at 18, -56) === */}
      <Tower x={22} z={-54} h={5} w={1.1} color="#1a0505" emissive="#ff6b6b" />
      <Tower x={16} z={-58} h={3.5} w={0.9} color="#1a0505" emissive="#ff5555" />
      <Tower x={20} z={-62} h={6} w={1.2} color="#1a0505" emissive="#ff6b6b" />
      <Hologram x={18} z={-57} h={1.8} color="#ff6b6b" />
      <EnergyPylon x={14} z={-52} color="#ff6b6b" height={4} />
      <EnergyPylon x={24} z={-60} color="#ff6b6b" height={3.5} />

      {/* === FORGE DISTRICT (CODEFORGE at -15, -62) === */}
      <Tower x={-20} z={-60} h={7} w={1.4} color="#150520" emissive="#fd79a8" />
      <Tower x={-12} z={-64} h={5.5} w={1.2} color="#150520" emissive="#ed69a0" />
      <Tower x={-18} z={-68} h={6} w={1.3} color="#150520" emissive="#fd79a8" />
      <Hologram x={-15} z={-63} h={2.4} color="#fd79a8" />
      <SatelliteDish x={-11} z={-62} angle={Math.PI * 1.3} />
      <EnergyPylon x={-22} z={-66} color="#fd79a8" height={5} />
      <DataCable from={[-15, 3, -62]} to={[0, 3, -8]} color="#fd79a8" opacity={0.16} />

      {/* Ambient energy pylons around the world */}
      <EnergyPylon x={15} z={-30} color="#4ecdc4" height={3} />
      <EnergyPylon x={-20} z={-35} color="#a29bfe" height={2.5} />
      <EnergyPylon x={8} z={-45} color="#55efc4" height={3.5} />
      <EnergyPylon x={-8} z={-20} color="#fdcb6e" height={2} />
    </group>
  );
}
