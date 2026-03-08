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
  const fogColor = recentErrors > 0 ? "#1a0e10" : "#101420";

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fogExp2 attach="fog" args={[fogColor, 0.0025]} />

      <SkyBox />
      <Environment preset="night" environmentIntensity={0.8} environmentRotation={[0, Math.PI / 4, 0]} />

      <ambientLight intensity={0.7} color="#3a3560" />
      <hemisphereLight args={["#4060a0", "#1a1828", 0.4]} />
      <directionalLight
        position={[60, 120, 40]}
        intensity={1.8}
        color="#fff0e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={160}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-50, 60, -30]} intensity={0.5} color="#8ab4ff" />
      <directionalLight position={[30, 40, 50]} intensity={0.3} color="#c0d8ff" />

      <Sparkles count={100} scale={[120, 25, 120]} color="#80d8f0" size={1.5} opacity={0.25} />
      <Sparkles count={40} scale={[80, 10, 80]} color="#ff8855" size={0.8} opacity={0.15} />

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
