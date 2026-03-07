/**
 * Agent humanoïde stylisé (capsules/cylindres) — remplace les sphères.
 * Silhouette lisible : tête, torse, jambes, bras. Sans dépendance GLTF.
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";

function HumanoidSilhouette({ color, emissiveIntensity = 0.4, selected }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={selected ? 0.6 : emissiveIntensity}
      roughness={0.4}
      metalness={0.3}
      envMapIntensity={0.6}
    />
  );

  return (
    <group ref={groupRef} scale={[0.9, 0.9, 0.9]}>
      {/* Tête */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        {mat}
      </mesh>
      {/* Torse (capsule verticale) */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
        {mat}
      </mesh>
      {/* Jambe gauche */}
      <mesh position={[-0.12, 0.35, 0]} rotation={[0.05, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        {mat}
      </mesh>
      {/* Jambe droite */}
      <mesh position={[0.12, 0.35, 0]} rotation={[0.05, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        {mat}
      </mesh>
      {/* Bras gauche */}
      <mesh position={[-0.38, 1.0, 0]} rotation={[0, 0, Math.PI / 2 + 0.1]} castShadow>
        <capsuleGeometry args={[0.06, 0.32, 4, 8]} />
        {mat}
      </mesh>
      {/* Bras droit */}
      <mesh position={[0.38, 1.0, 0]} rotation={[0, 0, -Math.PI / 2 - 0.1]} castShadow>
        <capsuleGeometry args={[0.06, 0.32, 4, 8]} />
        {mat}
      </mesh>
    </group>
  );
}

const AGENT_COLORS = {
  CONDUCTOR: "#eab308",
  SENTINEL: "#00f0ff",
  CIPHER: "#a855f7",
  ARCHIVIST: "#f59e0b",
  HERALD: "#22c55e",
  PHANTOM: "#ef4444",
  FORGE: "#ec4899",
};

export default function HumanoidAgent({ agent, onClick, selected }) {
  const color = AGENT_COLORS[agent.name] || agent.color || "#888";

  return (
    <group position={agent.position || [0, 0, 0]}>
      <Float speed={1.2} floatIntensity={0.08} rotationIntensity={0.05}>
        <group
          onClick={(e) => (e.stopPropagation(), onClick(agent))}
          onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          <HumanoidSilhouette color={color} selected={selected} />
        </group>
      </Float>
      <Text
        position={[0, -0.75, 0]}
        fontSize={0.1}
        color="#e5e7eb"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
      >
        {agent.name}
      </Text>
    </group>
  );
}
