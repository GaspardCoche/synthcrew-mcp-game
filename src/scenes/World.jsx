import { useMemo } from "react";
import { Sparkles, Environment, Sky, Stars } from "@react-three/drei";
import Terrain from "./Terrain";
import Structures from "./Structures";
import WorldDetails from "./WorldDetails";
import GuideAgent from "./GuideAgent";
import HumanoidAgent from "./HumanoidAgent";
import WorldIndicators from "./WorldIndicators";
import { useWorldStore } from "../store/worldStore";
import { getAgentHome, getAgentPatrolRadius } from "../lib/agentZones";
import ClearAgentColliders from "./ClearAgentColliders";
import NatureDecor from "./NatureDecor";

const AGENT_COLORS = {
  NEXUS: "#ff6b35",
  DATAFLOW: "#6c5ce7",
  PRISME: "#74b9ff",
  SCRIBE: "#ffd93d",
  SIGNAL: "#00b894",
  SPIDER: "#ff6b6b",
  CODEFORGE: "#fd79a8",
};

export default function World({
  agents = [],
  onSelectAgent,
  selectedAgent,
  onGuideClick,
  guideSelected,
}) {
  const agentsWithPositions = useMemo(() => {
    if (agents.length === 0) {
      const names = ["NEXUS", "DATAFLOW", "PRISME", "SCRIBE", "SIGNAL", "SPIDER", "CODEFORGE"];
      return names.map((name, i) => ({
        id: String(i),
        name,
        role: ["orchestrator", "data_ops", "analyst", "writer", "communicator", "scraper", "developer"][i],
        status: "idle",
        position: getAgentHome(name, 0),
        patrolRadius: getAgentPatrolRadius(name),
        color: AGENT_COLORS[name],
      }));
    }
    return agents.map((a, i) => {
      const sameNameIndex = agents.slice(0, i).filter((b) => b.name === a.name).length;
      return {
        ...a,
        position: getAgentHome(a.name ?? "NEXUS", sameNameIndex),
        patrolRadius: getAgentPatrolRadius(a.name ?? "NEXUS"),
      };
    });
  }, [agents]);

  const recentErrors = useWorldStore((s) => s.recentErrorsCount);
  const fogColor = recentErrors > 0 ? "#140a0c" : "#0c0a12";
  const skyTurbidity = recentErrors > 0 ? 12 : 8;

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, 25, 95]} />

      <Sky
        distance={1200}
        inclination={0.6}
        azimuth={0.25}
        turbidity={skyTurbidity}
        rayleigh={0.4}
        mieCoefficient={recentErrors > 0 ? 0.015 : 0.005}
        sunPosition={[80, 50, 60]}
      />
      <Stars radius={200} depth={80} count={4000} factor={3} saturation={0.3} fade speed={0.8} />
      <Environment preset="sunset" environmentIntensity={0.5} environmentRotation={[0, Math.PI / 6, 0]} />

      <ambientLight intensity={0.22} />
      <directionalLight
        position={[80, 70, 50]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-30, 20, -20]} intensity={0.15} color="#e0e7ff" />
      <pointLight position={[-15, 4, -10]} color="#f59e0b" intensity={0.08} distance={35} decay={2} />
      <pointLight position={[18, 4, -8]} color="#4ecdc4" intensity={0.06} distance={35} decay={2} />
      <pointLight position={[0, 3, -15]} color="#6c5ce7" intensity={0.04} distance={40} decay={2} />

      <Sparkles count={200} scale={[80, 20, 80]} color="#4ecdc4" size={1} opacity={0.28} />
      <Sparkles count={120} scale={[60, 15, 60]} color="#6c5ce7" size={0.7} opacity={0.2} />
      <Sparkles count={80} scale={[50, 12, 50]} color="#fbbf24" size={0.5} opacity={0.15} />
      <Sparkles count={150} scale={[90, 8, 90]} color="#6b7280" size={0.4} opacity={0.12} />

      <Terrain />
      <Structures />
      <WorldDetails />
      <WorldIndicators />
      <ClearAgentColliders />
      <NatureDecor />

      <GuideAgent onClick={onGuideClick} selected={guideSelected} />

      {agentsWithPositions.map((agent, i) => (
        <HumanoidAgent
          key={`${agent.id ?? agent.name}-${i}`}
          agent={agent}
          onClick={onSelectAgent}
          selected={selectedAgent?.id === agent.id || selectedAgent?.name === agent.name}
        />
      ))}
    </>
  );
}
