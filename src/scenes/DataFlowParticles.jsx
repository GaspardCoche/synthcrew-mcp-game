/**
 * DataFlowParticles — visualise les échanges entre agents pendant les missions.
 * Streams de particules colorées qui volent d'un agent à l'autre.
 * Utilise des instanced meshes pour la performance.
 */
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store/useStore";
import { getAgentHome } from "../lib/agentZones";

const AGENT_COLORS = {
  NEXUS:     "#ff6b35",
  DATAFLOW:  "#6c5ce7",
  PRISME:    "#74b9ff",
  SCRIBE:    "#ffd93d",
  SIGNAL:    "#00b894",
  SPIDER:    "#ff6b6b",
  CODEFORGE: "#fd79a8",
};

const MAX_PARTICLES_PER_FLOW = 12;
const PARTICLE_SPEED = 0.018;
const PARTICLE_LIFE  = 1.0; // 0→1 over the path

/**
 * One particle flow from agentA to agentB
 */
function AgentFlow({ fromName, toName, color, active }) {
  const meshRef = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const from = useMemo(() => {
    const p = getAgentHome(fromName, 0);
    return new THREE.Vector3(p[0], p[1] + 1.8, p[2]);
  }, [fromName]);

  const to = useMemo(() => {
    const p = getAgentHome(toName, 0);
    return new THREE.Vector3(p[0], p[1] + 1.8, p[2]);
  }, [toName]);

  // Each particle has a phase offset [0,1)
  const phases = useMemo(
    () => Array.from({ length: MAX_PARTICLES_PER_FLOW }, (_, i) => i / MAX_PARTICLES_PER_FLOW),
    []
  );

  const col = useMemo(() => new THREE.Color(color), [color]);

  // Bezier control point (arc above terrain)
  const ctrl = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    const dist = from.distanceTo(to);
    mid.y += dist * 0.35 + 3;
    return mid;
  }, [from, to]);

  useFrame((state) => {
    if (!meshRef.current || !active) {
      // Hide all when inactive
      if (meshRef.current) {
        for (let i = 0; i < MAX_PARTICLES_PER_FLOW; i++) {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    const t = state.clock.elapsedTime * PARTICLE_SPEED * 60;

    for (let i = 0; i < MAX_PARTICLES_PER_FLOW; i++) {
      const phase = ((phases[i] + t * PARTICLE_SPEED) % 1 + 1) % 1;

      // Quadratic bezier
      const q = phase;
      const iq = 1 - q;
      const pos = new THREE.Vector3(
        iq * iq * from.x + 2 * iq * q * ctrl.x + q * q * to.x,
        iq * iq * from.y + 2 * iq * q * ctrl.y + q * q * to.y,
        iq * iq * from.z + 2 * iq * q * ctrl.z + q * q * to.z
      );

      // Fade in/out at ends
      const alpha = Math.sin(phase * Math.PI);
      const scale = alpha * 0.09 + 0.01;

      dummy.position.copy(pos);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(
        Math.sin(t * 3 + i) * 0.5,
        Math.cos(t * 2 + i * 0.7) * 0.5,
        0
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES_PER_FLOW]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={col} transparent opacity={0.85} />
    </instancedMesh>
  );
}

/**
 * Secondary ambient particles floating in the world (ambient energy)
 */
function AmbientDataParticles({ count = 80 }) {
  const meshRef = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(
    () => Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 80,
      y: Math.random() * 8 + 1,
      z: (Math.random() - 0.5) * 80,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.008,
      colorName: Object.keys(AGENT_COLORS)[Math.floor(Math.random() * Object.keys(AGENT_COLORS).length)],
    })),
    [count]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed * 2 + p.phase) * 1.5,
        p.y + Math.sin(t * p.speed * 3 + p.phase * 1.3) * 0.8,
        p.z + Math.cos(t * p.speed * 1.7 + p.phase * 0.9) * 1.5
      );
      dummy.scale.setScalar(0.04 + Math.sin(t * p.speed * 5 + p.phase) * 0.015);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#4ecdc4" transparent opacity={0.3} />
    </instancedMesh>
  );
}

/**
 * Mission execution beam — connects all agents involved in a mission
 */
function MissionBeam({ agents: agentList, missionColor = "#ff6b35" }) {
  const ref = useRef();

  const points = useMemo(() => {
    return agentList.map((name) => {
      const p = getAgentHome(name, 0);
      return new THREE.Vector3(p[0], p[1] + 2.5, p[2]);
    });
  }, [agentList]);

  const curve = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.CatmullRomCurve3(points, false, "chordal");
  }, [points]);

  const geometry = useMemo(() => {
    if (!curve) return null;
    const pts = curve.getPoints(60);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
  });

  if (!geometry) return null;
  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color={missionColor} transparent opacity={0.2} linewidth={2} />
    </line>
  );
}

/**
 * Main export — automatically shows flows between active agents
 */
export default function DataFlowParticles() {
  const agents = useStore((s) => s.agents);

  const activeAgents = agents.filter((a) => a.status === "active" || a.status === "queued");
  const flows = useMemo(() => {
    const result = [];
    const nexus = agents.find((a) => a.role === "orchestrator");
    if (!nexus) return result;

    activeAgents.forEach((agent) => {
      if (agent.id === nexus.id) return;
      result.push({
        key: `${nexus.name}->${agent.name}`,
        from: nexus.name,
        to: agent.name,
        color: AGENT_COLORS[agent.name] || "#ffffff",
        active: agent.status === "active",
      });
    });
    return result;
  }, [agents, activeAgents]);

  const beamAgents = useMemo(() => activeAgents.map((a) => a.name), [activeAgents]);

  return (
    <>
      <AmbientDataParticles count={60} />
      {beamAgents.length >= 2 && <MissionBeam agents={beamAgents} />}
      {flows.map((f) => (
        <AgentFlow
          key={f.key}
          fromName={f.from}
          toName={f.to}
          color={f.color}
          active={f.active}
        />
      ))}
    </>
  );
}
