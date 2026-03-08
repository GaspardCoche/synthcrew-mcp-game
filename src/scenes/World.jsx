import { lazy, Suspense, useMemo } from "react";
import { Sparkles, Environment } from "@react-three/drei";
import Terrain from "./Terrain";
import Structures from "./Structures";
import GuideAgent from "./GuideAgent";
import HumanoidAgent from "./HumanoidAgent";
import WorldIndicators from "./WorldIndicators";
import { useWorldStore } from "../store/worldStore";
import { getAgentHome, getAgentPatrolRadius } from "../lib/agentZones";
import ClearAgentColliders from "./ClearAgentColliders";
import SkyBox from "./SkyBox";

const NatureDecor = lazy(() => import("./NatureDecor"));
const WorldDetails = lazy(() => import("./WorldDetails"));

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

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fogExp2 attach="fog" args={[fogColor, 0.005]} />

      <SkyBox />
      <Environment preset="night" environmentIntensity={0.4} environmentRotation={[0, Math.PI / 4, 0]} />

      <ambientLight intensity={0.35} color="#1a1530" />
      <directionalLight
        position={[100, 80, 60]}
        intensity={1.0}
        color="#ffe8d0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-50, 30, -30]} intensity={0.15} color="#6080ff" />

      <Sparkles count={60} scale={[100, 20, 100]} color="#4ecdc4" size={1.0} opacity={0.12} />

      <Terrain />
      <Structures />
      <WorldIndicators />
      <ClearAgentColliders />

      <GuideAgent onClick={onGuideClick} selected={guideSelected} />

      {agentsWithPositions.map((agent, i) => (
        <HumanoidAgent
          key={`${agent.id ?? agent.name}-${i}`}
          agent={agent}
          onClick={onSelectAgent}
          selected={selectedAgent?.id === agent.id || selectedAgent?.name === agent.name}
        />
      ))}

      <Suspense fallback={null}>
        <NatureDecor />
        <WorldDetails />
      </Suspense>
    </>
  );
}
