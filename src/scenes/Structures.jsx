import React from "react";
import { getTerrainHeightAt } from "./Terrain";

const BLOCKS = [
  { pos: [-12, 0, -6], scale: [2.5, 0.6, 1.8], color: "#1e1b2e", emissive: "#2a2540", name: "Forge" },
  { pos: [14, 0, -5], scale: [2.2, 0.7, 2.2], color: "#1a1628", emissive: "#252038", name: "Taverne" },
  { pos: [-5, 0, -16], scale: [1.4, 0.5, 1.4], color: "#16132a", emissive: "#1e1a30", name: "Entrepôt" },
  { pos: [8, 0, -14], scale: [1.8, 0.6, 1.8], color: "#1c192e", emissive: "#282240", name: "Bibliothèque" },
  { pos: [0, 0, -12], scale: [4, 0.35, 3], color: "#12101a", emissive: "#18152a", name: "Place centrale" },
  { pos: [-20, 0, -8], scale: [1.2, 0.9, 1.2], color: "#252038", emissive: "#2d2848", name: "Tour" },
  { pos: [18, 0, -10], scale: [1.2, 0.7, 1.2], color: "#252038", emissive: "#2d2848", name: "Tour" },
  { pos: [-8, 0, -22], scale: [1.4, 0.5, 1.2], color: "#1a1628", emissive: "#252038", name: "Atelier" },
  { pos: [5, 0, -25], scale: [1, 0.4, 1.4], color: "#16132a", emissive: "#1e1a30", name: "Remise" },
  { pos: [-25, 0, -14], scale: [1.5, 0.55, 1.2], color: "#1e1b2e", emissive: "#252038", name: "Hangar" },
  { pos: [22, 0, -18], scale: [1.2, 0.45, 1.6], color: "#1a1628", emissive: "#282240", name: "Poste" },
  { pos: [-2, 0, -28], scale: [2, 0.4, 1.2], color: "#16132a", emissive: "#1e1a30", name: "Pont" },
];

const PROPS = [
  { pos: [-11, 0, -5.2], scale: [0.4, 0.5, 0.4], type: "cylinder", color: "#2d2318", emissive: "#3d3020" },
  { pos: [-10.5, 0, -5.8], scale: [0.35, 0.45, 0.35], type: "cylinder", color: "#2d2318", emissive: "#3d3020" },
  { pos: [14.5, 0, -4.5], scale: [0.35, 0.4, 0.35], type: "cylinder", color: "#2d2318", emissive: "#3d3020" },
  { pos: [0.8, 0, -11.5], scale: [0.5, 0.35, 0.6], type: "box", color: "#1a1510", emissive: "#252018" },
  { pos: [-0.5, 0, -11.2], scale: [0.45, 0.4, 0.5], type: "box", color: "#1a1510", emissive: "#252018" },
  { pos: [-6, 0, -15.5], scale: [0.4, 0.5, 0.4], type: "cylinder", color: "#2d2318", emissive: "#3d3020" },
  { pos: [8.5, 0, -13.5], scale: [0.3, 0.6, 0.05], type: "box", color: "#1e1a28", emissive: "#2a2540" },
  { pos: [-19, 0, -7.5], scale: [0.08, 0.8, 0.08], type: "cylinder", color: "#1a1618", emissive: "#00f0ff", emissiveIntensity: 0.3 },
  { pos: [17, 0, -9.5], scale: [0.08, 0.6, 0.08], type: "cylinder", color: "#1a1618", emissive: "#f59e0b", emissiveIntensity: 0.25 },
  { pos: [3, 0, -12.2], scale: [0.08, 0.7, 0.08], type: "cylinder", color: "#1a1618", emissive: "#a855f7", emissiveIntensity: 0.2 },
];

export default function Structures() {
  return (
    <group>
      {BLOCKS.map((b, i) => {
        const [x, , z] = b.pos;
        const y = getTerrainHeightAt(x, z) + (b.scale[1] || 0.4) / 2;
        return (
          <mesh key={`b-${i}`} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={b.scale} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.emissive}
              emissiveIntensity={0.15}
              roughness={0.7}
              metalness={0.1}
            />
          </mesh>
        );
      })}
      {PROPS.map((p, i) => {
        const [x, , z] = p.pos;
        const y = getTerrainHeightAt(x, z) + (p.scale[1] || 0.3) / 2;
        const isCylinder = p.type === "cylinder";
        return (
          <mesh key={`p-${i}`} position={[x, y, z]} castShadow receiveShadow>
            {isCylinder ? (
              <cylinderGeometry args={[p.scale[0], p.scale[0], p.scale[1], 12]} />
            ) : (
              <boxGeometry args={p.scale} />
            )}
            <meshStandardMaterial
              color={p.color}
              emissive={p.emissive}
              emissiveIntensity={p.emissiveIntensity ?? 0.12}
              roughness={0.75}
              metalness={0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}
