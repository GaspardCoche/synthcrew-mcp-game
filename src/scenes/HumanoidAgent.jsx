/**
 * Agent 3D — charge le modèle GLTF du pack Quaternius.
 * Fallback sur silhouette procédurale si le modèle n'est pas disponible.
 */
import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float, Text } from "@react-three/drei";

// Mapping agent → modèle GLTF
const AGENT_MODELS = {
  CONDUCTOR:  "/models/agents/Mech_FinnTheFrog.gltf",
  SENTINEL:   "/models/agents/George.gltf",
  CIPHER:     "/models/agents/Leela.gltf",
  ARCHIVIST:  "/models/agents/Stan.gltf",
  HERALD:     "/models/agents/Mike.gltf",
  PHANTOM:    "/models/agents/Mech_RaeTheRedPanda.gltf",
  FORGE:      "/models/agents/Mech_BarbaraTheBee.gltf",
};

const AGENT_COLORS = {
  CONDUCTOR: "#eab308",
  SENTINEL:  "#00f0ff",
  CIPHER:    "#a855f7",
  ARCHIVIST: "#f59e0b",
  HERALD:    "#22c55e",
  PHANTOM:   "#ef4444",
  FORGE:     "#ec4899",
};

// Silhouette procédurale (fallback)
function FallbackSilhouette({ color, selected }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });
  const mat = (
    <meshStandardMaterial
      color={color} emissive={color}
      emissiveIntensity={selected ? 0.7 : 0.35}
      roughness={0.3} metalness={0.5}
    />
  );
  return (
    <group ref={groupRef} scale={[0.9, 0.9, 0.9]}>
      <mesh position={[0, 1.42, 0]} castShadow><sphereGeometry args={[0.2, 16, 16]} />{mat}</mesh>
      <mesh position={[0, 0.95, 0]} castShadow><capsuleGeometry args={[0.22, 0.5, 8, 16]} />{mat}</mesh>
      <mesh position={[-0.12, 0.35, 0]} castShadow><capsuleGeometry args={[0.08, 0.4, 4, 8]} />{mat}</mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow><capsuleGeometry args={[0.08, 0.4, 4, 8]} />{mat}</mesh>
      <mesh position={[-0.38, 1.0, 0]} rotation={[0, 0, Math.PI / 2 + 0.1]} castShadow><capsuleGeometry args={[0.06, 0.32, 4, 8]} />{mat}</mesh>
      <mesh position={[0.38, 1.0, 0]} rotation={[0, 0, -Math.PI / 2 - 0.1]} castShadow><capsuleGeometry args={[0.06, 0.32, 4, 8]} />{mat}</mesh>
    </group>
  );
}

// Modèle GLTF chargé
function GltfAgent({ modelPath, color, selected }) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    // Idle bob + rotate slowly
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
  });

  return (
    <group ref={groupRef} scale={[0.012, 0.012, 0.012]}>
      <primitive object={scene.clone()} castShadow />
      {selected && (
        <pointLight position={[0, 50, 0]} color={color} intensity={2} distance={200} />
      )}
    </group>
  );
}

// Halo de sélection
function SelectionRing({ color }) {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.72, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

export default function HumanoidAgent({ agent, onClick, selected }) {
  const color = AGENT_COLORS[agent.name] || agent.color || "#888888";
  const modelPath = AGENT_MODELS[agent.name];

  return (
    <group position={agent.position || [0, 0, 0]}>
      <Float speed={0.8} floatIntensity={0.06} rotationIntensity={0.02}>
        <group
          onClick={(e) => { e.stopPropagation(); onClick(agent); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        >
          {/* Selected ring */}
          {selected && <SelectionRing color={color} />}

          {/* GLTF model with fallback */}
          {modelPath ? (
            <Suspense fallback={<FallbackSilhouette color={color} selected={selected} />}>
              <GltfAgent modelPath={modelPath} color={color} selected={selected} />
            </Suspense>
          ) : (
            <FallbackSilhouette color={color} selected={selected} />
          )}

          {/* Color glow point light */}
          <pointLight
            color={color}
            intensity={selected ? 0.8 : 0.3}
            distance={4}
            decay={2}
            position={[0, 1, 0]}
          />
        </group>
      </Float>

      {/* Name tag */}
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {agent.name}
      </Text>
    </group>
  );
}

// Préchargement des modèles
Object.values(AGENT_MODELS).forEach((path) => useGLTF.preload(path));
