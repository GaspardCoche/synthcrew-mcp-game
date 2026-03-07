import { useMemo } from "react";
import { Sparkles, Environment, Sky } from "@react-three/drei";
import Terrain, { getTerrainHeightAt, TERRAIN_SIZE } from "./Terrain";
import Structures from "./Structures";
import GuideAgent from "./GuideAgent";
import HumanoidAgent from "./HumanoidAgent";

const AGENT_COLORS = {
  CONDUCTOR: "#eab308",
  SENTINEL: "#00f0ff",
  CIPHER: "#a855f7",
  ARCHIVIST: "#f59e0b",
  HERALD: "#22c55e",
  PHANTOM: "#ef4444",
  FORGE: "#ec4899",
};

function placeOnTerrain([x, , z]) {
  const y = getTerrainHeightAt(x, z) + 0.15;
  return [x, y, z];
}

function placeOnTerrain([x, , z]) {
  const y = getTerrainHeightAt(x, z) + 0.15;
  return [x, y, z];
}

export default function World({
  agents = [],
  onSelectAgent,
  selectedAgent,
  onGuideClick,
  guideSelected,
}) {
  const defaultPositions = useMemo(() => {
    const raw = [[-12, 0, -8], [10, 0, -10], [-5, 0, -14], [14, 0, -6], [-18, 0, -4], [4, 0, -18], [0, 0, -5]];
    return raw.map(([x, , z]) => placeOnTerrain([x, 0, z]));
  }, []);

  const agentsWithPositions =
    agents.length > 0
      ? agents.map((a, i) => ({ ...a, position: defaultPositions[i % defaultPositions.length] }))
      : defaultPositions.slice(0, 6).map((pos, i) => ({
          id: String(i + 1),
          name: ["SENTINEL", "CIPHER", "ARCHIVIST", "HERALD", "PHANTOM", "FORGE"][i],
          position: pos,
          color: Object.values(AGENT_COLORS)[i + 1],
        }));

  return (
    <>
      <color attach="background" args={["#0c0a12"]} />
      <fog attach="fog" args={["#0c0a12", 25, 95]} />

      <Sky
        distance={1200}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={0.4}
        mieCoefficient={0.005}
        sunPosition={[80, 50, 60]}
      />
      <Environment preset="sunset" environmentIntensity={0.5} environmentRotation={[0, Math.PI / 6, 0]} />

      <ambientLight intensity={0.25} />
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
      <pointLight position={[18, 4, -8]} color="#00f0ff" intensity={0.06} distance={35} decay={2} />
      <pointLight position={[0, 3, -15]} color="#a855f7" intensity={0.04} distance={40} decay={2} />

      <Sparkles count={200} scale={[80, 20, 80]} color="#00f0ff" size={1} opacity={0.28} />
      <Sparkles count={120} scale={[60, 15, 60]} color="#a855f7" size={0.7} opacity={0.2} />
      <Sparkles count={80} scale={[50, 12, 50]} color="#fbbf24" size={0.5} opacity={0.15} />

      <Terrain />
      <Structures />

      <GuideAgent onClick={onGuideClick} selected={guideSelected} />

      {agentsWithPositions.map((agent) => (
        <HumanoidAgent
          key={agent.id || agent.name}
          agent={agent}
          onClick={onSelectAgent}
          selected={selectedAgent?.id === agent.id || selectedAgent?.name === agent.name}
        />
      ))}
    </>
  );
}
