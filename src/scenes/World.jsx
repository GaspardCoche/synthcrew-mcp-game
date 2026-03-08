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
import DataFlowParticles from "./DataFlowParticles";
import CityDistricts from "./CityDistricts";
import SpecialEffects from "./SpecialEffects";
import GroundDetails from "./GroundDetails";
import SkyBox from "./SkyBox";
import ZoneShaderEffects from "./ZoneShaderEffects";

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
      {/* Dynamic fog — deeper at night, reddish during errors */}
      <fog attach="fog" args={[fogColor, 30, 130]} />
      <fogExp2 attach="fog" args={[fogColor, 0.006]} />

      <Sky
        distance={2000}
        inclination={0.58}
        azimuth={0.22}
        turbidity={skyTurbidity}
        rayleigh={recentErrors > 0 ? 1.2 : 0.35}
        mieCoefficient={recentErrors > 0 ? 0.02 : 0.004}
        mieDirectionalG={0.82}
        sunPosition={[100, 40, 60]}
      />
      <Stars radius={250} depth={100} count={6000} factor={4} saturation={0.4} fade speed={0.5} />
      <Environment preset="night" environmentIntensity={0.35} environmentRotation={[0, Math.PI / 4, 0]} />

      {/* Main directional (sun) */}
      <ambientLight intensity={0.18} color="#1a1530" />
      <directionalLight
        position={[100, 80, 60]}
        intensity={0.9}
        color="#ffe8d0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0002}
      />
      {/* Blue moon fill light */}
      <directionalLight position={[-50, 30, -30]} intensity={0.12} color="#6080ff" />
      {/* District accent lights */}
      <pointLight position={[0, 8, -8]}    color="#ff6b35" intensity={0.15} distance={50} decay={2} />
      <pointLight position={[-35, 5, -26]} color="#6c5ce7" intensity={0.12} distance={45} decay={2} />
      <pointLight position={[30, 5, -34]}  color="#74b9ff" intensity={0.10} distance={40} decay={2} />
      <pointLight position={[-28, 5, -50]} color="#ffd93d" intensity={0.10} distance={40} decay={2} />
      <pointLight position={[42, 5, -18]}  color="#00b894" intensity={0.10} distance={40} decay={2} />
      <pointLight position={[18, 5, -56]}  color="#ff6b6b" intensity={0.10} distance={40} decay={2} />
      <pointLight position={[-15, 5, -62]} color="#fd79a8" intensity={0.10} distance={40} decay={2} />

      {/* Ambient sparkles */}
      <Sparkles count={150} scale={[100, 25, 100]} color="#4ecdc4" size={1.2} opacity={0.22} />
      <Sparkles count={100} scale={[80, 18, 80]}   color="#6c5ce7" size={0.8} opacity={0.18} />
      <Sparkles count={60}  scale={[70, 12, 70]}   color="#fbbf24" size={0.6} opacity={0.12} />
      <Sparkles count={40}  scale={[120, 5, 120]}  color="#ff6b35" size={0.5} opacity={0.08} />

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

      <DataFlowParticles />
      <CityDistricts />
      <GroundDetails />
      <SpecialEffects />
      <ZoneShaderEffects />
      <SkyBox />
    </>
  );
}
