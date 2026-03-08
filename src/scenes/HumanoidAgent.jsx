import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Text, Billboard, Html } from "@react-three/drei";
import { useThrottledFrame } from "../lib/useThrottledFrame";
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
  useThrottledFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * (sick ? 0.15 : 0.4);
  }, 20);
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

  useThrottledFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = Math.sin(t * 1.5) * 0.0003;
    groupRef.current.scale.set(0.013 + breathe, 0.013 + breathe * 0.5, 0.013 + breathe);
    groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.02;
  }, 20);

  return (
    <group ref={groupRef} scale={[0.013, 0.013, 0.013]}>
      <primitive object={clone} castShadow />
      {selected && <pointLight position={[0, 50, 0]} color={color} intensity={3} distance={250} />}
    </group>
  );
}

function SickRing() {
  const ref = useRef();
  useThrottledFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.8;
  }, 15);
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
  useThrottledFrame((state) => {
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
  useThrottledFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 1.2;
    ref.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
  }, 24);
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

const AGENT_WORKING_PHRASES = {
  NEXUS:     ["Décomposition en sous-tâches…", "Coordination équipe…", "Analyse du DAG…", "Synchronisation…"],
  DATAFLOW:  ["Récupération données…", "Pipeline ETL actif…", "Streaming records…", "Index en cours…"],
  PRISME:    ["Pattern détecté…", "Corrélation +87%…", "Insights extraits…", "Clustering…"],
  SCRIBE:    ["Rédaction en cours…", "Structure générée…", "Formatage doc…", "Synthèse prête…"],
  SIGNAL:    ["Message envoyé…", "Slack notifié…", "Email drafté…", "Notification OK"],
  SPIDER:    ["Crawl actif…", "Page analysée…", "Données extraites…", "Veille OK…"],
  CODEFORGE: ["Review PR…", "Tests passés…", "Deploy en cours…", "Merge validé…"],
};

// Workstation positions — agent goes here when active
const AGENT_WORKSTATIONS = {
  NEXUS:     [2,   0, -10],
  DATAFLOW:  [-37, 0, -28],
  PRISME:    [32,  0, -36],
  SCRIBE:    [-30, 0, -52],
  SIGNAL:    [44,  0, -20],
  SPIDER:    [20,  0, -58],
  CODEFORGE: [-17, 0, -64],
};

// Holographic workstation terminal
function WorkstationTerminal({ color, active }) {
  const ref = useRef();
  const screenRef = useRef();
  useThrottledFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    if (screenRef.current) {
      screenRef.current.material.opacity = active ? 0.7 + Math.sin(t * 8) * 0.15 : 0.2;
    }
  }, 24);
  return (
    <group ref={ref} position={[0, 0, 0.8]}>
      {/* Screen */}
      <mesh position={[0, 1.1, 0]} ref={screenRef}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={2} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 1.1, -0.01]}>
        <planeGeometry args={[0.65, 0.45]} />
        <meshBasicMaterial color="#111" transparent opacity={0.9} side={2} />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.1, 8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.05, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.4 : 0.1} metalness={0.6} roughness={0.3} />
      </mesh>
      {active && <pointLight position={[0, 1.1, 0.1]} color={color} intensity={0.4} distance={3} decay={2} />}
    </group>
  );
}

// Floating activity indicator (what the agent is doing right now)
function ActivityBubble({ agentName, status, color }) {
  const phraseIdx = useRef(0);
  const [phrase, setPhrase] = useState("");
  const phrases = AGENT_WORKING_PHRASES[agentName] || ["En cours…"];

  useEffect(() => {
    if (status !== "active") { setPhrase(""); return; }
    setPhrase(phrases[0]);
    const interval = setInterval(() => {
      phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
      setPhrase(phrases[phraseIdx.current]);
    }, 1800);
    return () => clearInterval(interval);
  }, [status, agentName]);

  if (status !== "active" || !phrase) return null;

  return (
    <Html position={[0, 4.2, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
      <div
        className="px-2 py-1 rounded font-mono text-[9px] whitespace-nowrap animate-pulse"
        style={{
          background: "rgba(5,8,15,0.92)",
          border: `1px solid ${color}60`,
          color,
          boxShadow: `0 0 12px ${color}40`,
        }}
      >
        ▶ {phrase}
      </div>
    </Html>
  );
}

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

  const isActive = agent.status === "active";
  const isQueued = agent.status === "queued";

  // Workstation target when active
  const workstationBase = AGENT_WORKSTATIONS[agent.name];
  const workstationTarget = useMemo(() => {
    if (!workstationBase) return null;
    return [workstationBase[0], getTerrainHeightAt(workstationBase[0], workstationBase[2]) + 0.15, workstationBase[2]];
  }, [workstationBase]);

  const baseCfg = PATROL_CONFIG[agent.status] || PATROL_CONFIG.idle;
  const zoneRadius = agent.patrolRadius ?? 6;
  const cfg = sick
    ? { ...baseCfg, radius: Math.min(baseCfg.radius * 0.7, zoneRadius), speedX: baseCfg.speedX * SICK_SPEED_MULT, speedZ: baseCfg.speedZ * SICK_SPEED_MULT, bobAmp: baseCfg.bobAmp * 0.5 }
    : { ...baseCfg, radius: Math.min(baseCfg.radius, zoneRadius) };

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    let tx, ty, tz;

    if (isActive && workstationTarget) {
      // Move to workstation when active — smooth lerp
      tx = workstationTarget[0];
      tz = workstationTarget[2];
      ty = workstationTarget[1];
      // Working bob at workstation
      ty += Math.sin(t * 4 + phase) * 0.03;
      // Smooth approach
      g.position.x += (tx - g.position.x) * 0.04;
      g.position.y += (ty - g.position.y) * 0.04;
      g.position.z += (tz - g.position.z) * 0.04;
      // Face the terminal
      const targetAngle = Math.atan2(0, 1); // face forward
      g.rotation.y += (targetAngle - g.rotation.y) * 0.05;
    } else if (isQueued) {
      // Move toward home but jitter nervously
      const nx = home[0] + Math.cos(t * cfg.speedX * 1.5 + phase) * cfg.radius * 0.4;
      const nz = home[2] + Math.sin(t * cfg.speedZ * 1.5 + phase * 0.7) * cfg.radius * 0.3;
      const ny = getTerrainHeightAt(nx, nz) + cfg.bobAmp * Math.sin(t * 3 + phase);
      g.position.x += (nx - g.position.x) * 0.06;
      g.position.y += (ny - g.position.y) * 0.06;
      g.position.z += (nz - g.position.z) * 0.06;
    } else {
      // Normal patrol
      const nx = home[0] + Math.cos(t * cfg.speedX + phase) * cfg.radius;
      const nz = home[2] + Math.sin(t * cfg.speedZ + phase * 0.7) * cfg.radius * 0.65;
      const ny = getTerrainHeightAt(nx, nz) + cfg.bobAmp * Math.sin(t * 2.4 + phase);

      g.position.x = nx;
      g.position.y = ny;
      g.position.z = nz;

      // Face direction of movement
      const vx = -Math.sin(t * cfg.speedX + phase) * cfg.radius * cfg.speedX;
      const vz = Math.cos(t * cfg.speedZ + phase * 0.7) * cfg.radius * 0.65 * cfg.speedZ;
      if (Math.abs(vx) + Math.abs(vz) > 0.002) {
        const targetY = Math.atan2(vx, vz);
        g.rotation.y += (targetY - g.rotation.y) * 0.08;
      }
    }

    const currentX = g.position.x;
    const currentZ = g.position.z;
    const key = `${agent.id || agent.name}-${Math.round(home[0])}-${Math.round(home[2])}`;
    agentCollidersRef.current[key] = { x: currentX, z: currentZ, r: AGENT_COLLIDER_RADIUS };

    const dx = camera.position.x - currentX;
    const dz = camera.position.z - currentZ;
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

      <pointLight color={sick ? "#ff6b6b" : isActive ? color : color} intensity={selected ? 1.4 : isActive ? 0.9 : sick ? 0.25 : 0.45} distance={isActive ? 8 : 5} decay={2} position={[0, 1.2, 0]} />

      <Billboard position={[0, 2.5, 0]}>
        <Text fontSize={0.2} color={color} anchorX="center" outlineWidth={0.02} outlineColor="#000000" fontWeight="bold">
          {agent.name}
        </Text>
      </Billboard>

      <Billboard position={[0, 2.2, 0]}>
        <Text fontSize={0.1} color={isActive ? "#4ade80" : "#9ca3af"} anchorX="center" outlineWidth={0.01} outlineColor="#000000">
          {isActive ? "● ACTIVE" : isQueued ? "◌ QUEUED" : (AGENT_ROLE_LABELS[agent.role] || "Agent")}
        </Text>
      </Billboard>

      {/* Workstation terminal visible when active */}
      {isActive && <WorkstationTerminal color={color} active={isActive} />}

      {/* Real-time activity bubble */}
      <ActivityBubble agentName={agent.name} status={agent.status} color={color} />

      {isNear && !selected && !isActive && <ProximityBubble agentName={agent.name} agentRole={agent.role} color={color} />}
    </group>
  );
}

Object.values(AGENT_MODELS).forEach((p) => useGLTF.preload(p));
