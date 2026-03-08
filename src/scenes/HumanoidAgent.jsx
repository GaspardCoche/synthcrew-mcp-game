import { useRef, useState, Suspense, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Text, Billboard, Html } from "@react-three/drei";
import { getTerrainHeightAt } from "./Terrain";
import { useWorldStore } from "../store/worldStore";
import { agentCollidersRef } from "../lib/agentColliders";
import { AGENT_ROLE_LABELS } from "../lib/constants";

const AGENT_MODELS = {
  NEXUS:     "/models/agents/Mech_FinnTheFrog.gltf",
  DATAFLOW:  "/models/agents/George.gltf",
  PRISME:    "/models/agents/Leela.gltf",
  SCRIBE:    "/models/agents/Stan.gltf",
  SIGNAL:    "/models/agents/Mike.gltf",
  SPIDER:    "/models/agents/Mech_RaeTheRedPanda.gltf",
  CODEFORGE: "/models/agents/Mech_BarbaraTheBee.gltf",
};

const AGENT_COLORS = {
  NEXUS:     "#ff6b35",
  DATAFLOW:  "#6c5ce7",
  PRISME:    "#74b9ff",
  SCRIBE:    "#ffd93d",
  SIGNAL:    "#00b894",
  SPIDER:    "#ff6b6b",
  CODEFORGE: "#fd79a8",
};

const PATROL_CONFIG = {
  active:   { radius: 5.5, speedX: 0.35, speedZ: 0.22, bobAmp: 0.12 },
  queued:   { radius: 2.5, speedX: 0.28, speedZ: 0.18, bobAmp: 0.07 },
  idle:     { radius: 2.0, speedX: 0.12, speedZ: 0.08, bobAmp: 0.04 },
  sleeping: { radius: 0.4, speedX: 0.04, speedZ: 0.03, bobAmp: 0.01 },
  error:    { radius: 1.5, speedX: 0.55, speedZ: 0.35, bobAmp: 0.08 },
};
const SICK_SPEED_MULT = 0.4;
const AGENT_COLLIDER_RADIUS = 0.7;
const PROXIMITY_THRESHOLD = 10;
const HIT_BOX_RADIUS = 1.2;
const HIT_BOX_HEIGHT = 3;

function FallbackAgent({ color, selected, sick }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * (sick ? 0.15 : 0.4);
  });
  const dim = sick ? 0.5 : 1;
  const mat = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={(selected ? 0.7 : 0.3) * dim} roughness={sick ? 0.6 : 0.3} metalness={0.6} />;
  return (
    <group ref={ref} scale={[0.85, 0.85, 0.85]}>
      <mesh position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.21, 16, 16]} />{mat}</mesh>
      <mesh position={[0, 0.9, 0]} castShadow><capsuleGeometry args={[0.23, 0.55, 8, 16]} />{mat}</mesh>
      <mesh position={[-0.13, 0.33, 0]} castShadow><capsuleGeometry args={[0.08, 0.42, 4, 8]} />{mat}</mesh>
      <mesh position={[0.13, 0.33, 0]} castShadow><capsuleGeometry args={[0.08, 0.42, 4, 8]} />{mat}</mesh>
      <mesh position={[-0.4, 0.98, 0]} rotation={[0, 0, Math.PI / 2 + 0.12]} castShadow><capsuleGeometry args={[0.06, 0.33, 4, 8]} />{mat}</mesh>
      <mesh position={[0.4, 0.98, 0]} rotation={[0, 0, -Math.PI / 2 - 0.12]} castShadow><capsuleGeometry args={[0.06, 0.33, 4, 8]} />{mat}</mesh>
    </group>
  );
}

function GltfAgent({ modelPath, color, selected, sick }) {
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = Math.sin(t * 1.5) * 0.0003;
    groupRef.current.scale.set(0.013 + breathe, 0.013 + breathe * 0.5, 0.013 + breathe);
    groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.02;
  });

  return (
    <group ref={groupRef} scale={[0.013, 0.013, 0.013]}>
      <primitive object={clone} castShadow />
      {selected && <pointLight position={[0, 50, 0]} color={color} intensity={3} distance={250} />}
    </group>
  );
}

function SickRing() {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.8;
  });
  return (
    <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ref}>
        <ringGeometry args={[0.5, 0.75, 32]} />
        <meshBasicMaterial color="#ff6b6b" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function SickParticles() {
  const ref = useRef();
  const offsets = useMemo(() => Array.from({ length: 5 }, () => [Math.random() * Math.PI * 2, Math.random() * 0.6 + 0.5]), []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      const [phase, dist] = offsets[i];
      c.position.y = 0.6 + Math.sin(t * 0.8 + phase) * 0.5;
      c.position.x = Math.cos(t * 0.6 + phase) * dist;
      c.position.z = Math.sin(t * 0.5 + phase * 1.3) * dist * 0.7;
    });
  });
  return (
    <group ref={ref}>
      {offsets.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshBasicMaterial color="#ff6b6b" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function SelectionRing({ color }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 1.2;
    ref.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
  });
  return (
    <group position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ref}>
        <ringGeometry args={[0.62, 0.82, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.45, 0.52, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function AgentPlatform({ color, selected }) {
  return (
    <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.15 : 0.06} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.55, 0.62, 32]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.4 : 0.12} />
      </mesh>
    </group>
  );
}

const AGENT_GREETINGS = {
  NEXUS:     "Centre de commande. Je coordonne l'équipe.",
  DATAFLOW:  "Flux de données stables. Besoin d'un pipeline ?",
  PRISME:    "Analyse multi-angle. Que veux-tu comprendre ?",
  SCRIBE:    "Prêt à documenter. Rapport ou synthèse ?",
  SIGNAL:    "Canaux ouverts. Slack, mail ou notif ?",
  SPIDER:    "En veille web. Quelle info cherches-tu ?",
  CODEFORGE: "Atelier code actif. PR, deploy ou review ?",
};

function ProximityBubble({ agentName, agentRole, color }) {
  const greeting = AGENT_GREETINGS[agentName] || "...";
  const roleLabel = AGENT_ROLE_LABELS[agentRole] || "";
  return (
    <Html position={[0, 3.8, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
      <div
        className="px-3 py-2 rounded-lg max-w-[200px] text-center animate-fade-in"
        style={{
          background: "rgba(8,12,21,0.94)",
          border: `1px solid ${color}40`,
          borderLeft: `3px solid ${color}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 20px ${color}20`,
        }}
      >
        <p className="text-[9px] font-mono font-bold mb-0.5" style={{ color }}>{agentName} · {roleLabel}</p>
        <p className="text-[10px] text-gray-300 leading-relaxed">{greeting}</p>
        <p className="text-[8px] font-mono mt-1.5 opacity-60 text-gray-400">[ Clique pour interagir ]</p>
      </div>
    </Html>
  );
}

export default function HumanoidAgent({ agent, onClick, selected }) {
  const groupRef = useRef();
  const [isNear, setIsNear] = useState(false);
  const color = AGENT_COLORS[agent.name] || agent.color || "#888";
  const modelPath = AGENT_MODELS[agent.name];
  const home = agent.position || [0, 0, 0];
  const sick = useWorldStore((s) => s.isAgentSick(agent.name));
  const { camera } = useThree();

  const phase = useMemo(() => {
    const id = parseInt(agent.id ?? "0") || 0;
    return id * 1.618 * Math.PI;
  }, [agent.id]);

  const baseCfg = PATROL_CONFIG[agent.status] || PATROL_CONFIG.idle;
  const zoneRadius = agent.patrolRadius ?? 6;
  const cfg = sick
    ? { ...baseCfg, radius: Math.min(baseCfg.radius * 0.7, zoneRadius), speedX: baseCfg.speedX * SICK_SPEED_MULT, speedZ: baseCfg.speedZ * SICK_SPEED_MULT, bobAmp: baseCfg.bobAmp * 0.5 }
    : { ...baseCfg, radius: Math.min(baseCfg.radius, zoneRadius) };

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    const nx = home[0] + Math.cos(t * cfg.speedX + phase) * cfg.radius;
    const nz = home[2] + Math.sin(t * cfg.speedZ + phase * 0.7) * cfg.radius * 0.65;
    const ny = getTerrainHeightAt(nx, nz) + cfg.bobAmp * Math.sin(t * 2.4 + phase);

    g.position.x = nx;
    g.position.y = ny;
    g.position.z = nz;

    const key = `${agent.id || agent.name}-${Math.round(home[0])}-${Math.round(home[2])}`;
    agentCollidersRef.current[key] = { x: nx, z: nz, r: AGENT_COLLIDER_RADIUS };

    const vx = -Math.sin(t * cfg.speedX + phase) * cfg.radius * cfg.speedX;
    const vz = Math.cos(t * cfg.speedZ + phase * 0.7) * cfg.radius * 0.65 * cfg.speedZ;
    if (Math.abs(vx) + Math.abs(vz) > 0.002) {
      const targetY = Math.atan2(vx, vz);
      g.rotation.y += (targetY - g.rotation.y) * 0.08;
    }

    const dx = camera.position.x - nx;
    const dz = camera.position.z - nz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const near = dist < PROXIMITY_THRESHOLD;
    if (near !== isNear) setIsNear(near);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(agent);
  };

  return (
    <group
      ref={groupRef}
      position={home}
    >
      {/* Invisible hit box for easier clicking */}
      <mesh
        visible={false}
        position={[0, HIT_BOX_HEIGHT / 2, 0]}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <cylinderGeometry args={[HIT_BOX_RADIUS, HIT_BOX_RADIUS, HIT_BOX_HEIGHT, 8]} />
      </mesh>

      <AgentPlatform color={color} selected={selected} />

      {sick && <SickRing />}
      {sick && <SickParticles />}
      {selected && <SelectionRing color={color} />}

      {modelPath ? (
        <Suspense fallback={<FallbackAgent color={color} selected={selected} sick={sick} />}>
          <GltfAgent modelPath={modelPath} color={color} selected={selected} sick={sick} />
        </Suspense>
      ) : (
        <FallbackAgent color={color} selected={selected} sick={sick} />
      )}

      <pointLight color={sick ? "#ff6b6b" : color} intensity={selected ? 1.2 : sick ? 0.25 : 0.45} distance={5} decay={2} position={[0, 1.2, 0]} />

      <Billboard position={[0, 2.5, 0]}>
        <Text fontSize={0.2} color={color} anchorX="center" outlineWidth={0.02} outlineColor="#000000" fontWeight="bold">
          {agent.name}
        </Text>
      </Billboard>

      <Billboard position={[0, 2.2, 0]}>
        <Text fontSize={0.1} color="#9ca3af" anchorX="center" outlineWidth={0.01} outlineColor="#000000">
          {AGENT_ROLE_LABELS[agent.role] || "Agent"}
        </Text>
      </Billboard>

      {isNear && !selected && <ProximityBubble agentName={agent.name} agentRole={agent.role} color={color} />}
    </group>
  );
}

Object.values(AGENT_MODELS).forEach((p) => useGLTF.preload(p));
