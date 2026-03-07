/**
 * Structures du monde — combine géométrie procédurale + modèles GLTF Quaternius.
 * Assets: Ultimate Space Kit (arbres flottants, rochers, bâtiments).
 */
import { Suspense, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { getTerrainHeightAt } from "./Terrain";

// ── Bâtiments procéduraux (zones agents) ───────────────────────────────────
const BLOCKS = [
  { pos: [-12, 0, -6],  scale: [2.5, 0.6, 1.8], color: "#1e1b2e", emissive: "#2a2540", name: "Forge" },
  { pos: [14, 0, -5],   scale: [2.2, 0.7, 2.2], color: "#1a1628", emissive: "#252038", name: "Taverne" },
  { pos: [-5, 0, -16],  scale: [1.4, 0.5, 1.4], color: "#16132a", emissive: "#1e1a30", name: "Entrepôt" },
  { pos: [8, 0, -14],   scale: [1.8, 0.6, 1.8], color: "#1c192e", emissive: "#282240", name: "Bibliothèque" },
  { pos: [0, 0, -12],   scale: [4, 0.35, 3],    color: "#12101a", emissive: "#18152a", name: "Place centrale" },
  { pos: [-20, 0, -8],  scale: [1.2, 0.9, 1.2], color: "#252038", emissive: "#2d2848", name: "Tour" },
  { pos: [18, 0, -10],  scale: [1.2, 0.7, 1.2], color: "#252038", emissive: "#2d2848", name: "Tour" },
  { pos: [-8, 0, -22],  scale: [1.4, 0.5, 1.2], color: "#1a1628", emissive: "#252038", name: "Atelier" },
];

// ── Lampadaires / props ─────────────────────────────────────────────────────
const PROPS = [
  { pos: [-19, 0, -7.5],  scale: [0.08, 0.8, 0.08], type: "cylinder", color: "#1a1618", emissive: "#00f0ff",  emissiveIntensity: 0.4 },
  { pos: [17, 0, -9.5],   scale: [0.08, 0.6, 0.08], type: "cylinder", color: "#1a1618", emissive: "#f59e0b",  emissiveIntensity: 0.35 },
  { pos: [3, 0, -12.2],   scale: [0.08, 0.7, 0.08], type: "cylinder", color: "#1a1618", emissive: "#a855f7",  emissiveIntensity: 0.3 },
  { pos: [-11, 0, -5.2],  scale: [0.4, 0.5, 0.4],   type: "cylinder", color: "#2d2318", emissive: "#3d3020",  emissiveIntensity: 0.12 },
  { pos: [14.5, 0, -4.5], scale: [0.35, 0.4, 0.35], type: "cylinder", color: "#2d2318", emissive: "#3d3020",  emissiveIntensity: 0.12 },
];

// ── Modèles GLTF environment ────────────────────────────────────────────────
const ENV_MODELS = [
  // Arbres flottants sci-fi (autour de la place centrale)
  { path: "/models/environment/Tree_Floating_1.gltf", pos: [-3, 0, -9],  scale: 0.8, rotY: 0 },
  { path: "/models/environment/Tree_Floating_1.gltf", pos: [5, 0, -10],  scale: 0.7, rotY: 1.2 },
  { path: "/models/environment/Tree_Blob_1.gltf",     pos: [-16, 0, -12], scale: 0.9, rotY: 0.5 },
  { path: "/models/environment/Tree_Blob_1.gltf",     pos: [20, 0, -15], scale: 0.75, rotY: 2.1 },
  { path: "/models/environment/Tree_Blob_3.gltf",     pos: [-9, 0, -20], scale: 1.0, rotY: 0.8 },
  { path: "/models/environment/Tree_Blob_3.gltf",     pos: [12, 0, -20], scale: 0.85, rotY: 1.8 },
  // Rochers
  { path: "/models/environment/Rock_Large_1.gltf",    pos: [-14, 0, -18], scale: 0.9, rotY: 0.3 },
  { path: "/models/environment/Rock_Large_2.gltf",    pos: [22, 0, -8],  scale: 0.7, rotY: 1.1 },
  { path: "/models/environment/Rock_Large_1.gltf",    pos: [2, 0, -26],  scale: 1.1, rotY: 2.4 },
  // Bâtiments sci-fi
  { path: "/models/environment/Building_L.gltf",      pos: [-24, 0, -6], scale: 0.5, rotY: Math.PI / 4 },
  { path: "/models/environment/Base_Large.gltf",      pos: [0, 0, -30],  scale: 0.6, rotY: 0 },
];

// Planète flottante en arrière-plan
const PLANET = { path: "/models/environment/Planet_2.gltf", pos: [40, 18, -60], scale: 8, rotY: 0 };

function GltfModel({ path, pos, scale, rotY }) {
  const { scene } = useGLTF(path);
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  return (
    <primitive
      object={scene.clone()}
      position={[x, y, z]}
      scale={[scale, scale, scale]}
      rotation={[0, rotY, 0]}
      castShadow
      receiveShadow
    />
  );
}

function FloatingPlanet({ path, pos, scale }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    ref.current.position.y = pos[1] + Math.sin(state.clock.elapsedTime * 0.2) * 0.8;
  });
  const { scene } = useGLTF(path);
  return (
    <primitive
      ref={ref}
      object={scene.clone()}
      position={pos}
      scale={[scale, scale, scale]}
    />
  );
}

export default function Structures() {
  return (
    <group>
      {/* Bâtiments procéduraux */}
      {BLOCKS.map((b, i) => {
        const [x, , z] = b.pos;
        const y = getTerrainHeightAt(x, z) + (b.scale[1] || 0.4) / 2;
        return (
          <mesh key={`b-${i}`} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={b.scale} />
            <meshStandardMaterial color={b.color} emissive={b.emissive} emissiveIntensity={0.15} roughness={0.7} metalness={0.1} />
          </mesh>
        );
      })}

      {/* Props / lampadaires */}
      {PROPS.map((p, i) => {
        const [x, , z] = p.pos;
        const y = getTerrainHeightAt(x, z) + (p.scale[1] || 0.3) / 2;
        return (
          <mesh key={`p-${i}`} position={[x, y, z]} castShadow receiveShadow>
            <cylinderGeometry args={[p.scale[0], p.scale[0], p.scale[1], 12]} />
            <meshStandardMaterial color={p.color} emissive={p.emissive} emissiveIntensity={p.emissiveIntensity ?? 0.12} roughness={0.75} metalness={0.05} />
          </mesh>
        );
      })}

      {/* Modèles GLTF environment */}
      <Suspense fallback={null}>
        {ENV_MODELS.map((m, i) => (
          <GltfModel key={`env-${i}`} {...m} />
        ))}
        <FloatingPlanet path={PLANET.path} pos={PLANET.pos} scale={PLANET.scale} />
      </Suspense>
    </group>
  );
}

// Préchargement
const allPaths = [...new Set(ENV_MODELS.map((m) => m.path).concat([PLANET.path]))];
allPaths.forEach((p) => useGLTF.preload(p));
