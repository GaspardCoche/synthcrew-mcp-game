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
      <fogExp2 attach="fog" args={[fogColor, 0.003]} />

      <SkyBox />
      <Environment preset="night" environmentIntensity={0.6} environmentRotation={[0, Math.PI / 4, 0]} />

      <ambientLight intensity={0.55} color="#2a2540" />
      <directionalLight
        position={[80, 100, 50]}
        intensity={1.4}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-40, 50, -20]} intensity={0.35} color="#a0c8ff" />
      <directionalLight position={[20, 30, 40]} intensity={0.25} color="#e8f0ff" />

      <Sparkles count={80} scale={[100, 30, 100]} color="#6ee7e0" size={1.2} opacity={0.2} />

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
