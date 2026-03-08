import { useRef, useMemo, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import { getTerrainHeightAt } from "./Terrain";

const MODELS = {
  birch1: "/models/nature/BirchTree_1.gltf",
  birch3: "/models/nature/BirchTree_3.gltf",
  maple: "/models/nature/MapleTree_1.gltf",
  dead: "/models/nature/DeadTree_1.gltf",
  bush: "/models/nature/Bush.gltf",
  bushLg: "/models/nature/Bush_Large.gltf",
  flower: "/models/nature/Flower_1.gltf",
  grass: "/models/nature/Grass_Large.gltf",
};

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generatePlacements() {
  const rng = seededRandom(42);
  const items = [];

  const treePositions = [
    [-50, -15], [-45, -35], [-55, -50], [-60, -25],
    [50, -15], [55, -35], [48, -55], [60, -20],
    [-40, -65], [35, -65], [-50, -55], [55, -50],
    [-38, -8], [38, -8], [-55, -40], [52, -42],
    [-30, 5], [25, 5], [-20, -70], [20, -70],
    [-65, -30], [65, -25], [-60, -60], [60, -60],
  ];

  treePositions.forEach(([x, z], i) => {
    const jx = x + (rng() - 0.5) * 6;
    const jz = z + (rng() - 0.5) * 6;
    const scale = 0.4 + rng() * 0.3;
    const rotY = rng() * Math.PI * 2;
    const modelKey = i % 4 === 0 ? "maple" : i % 3 === 0 ? "dead" : i % 2 === 0 ? "birch3" : "birch1";
    items.push({ model: modelKey, x: jx, z: jz, scale, rotY });
  });

  const bushPositions = [
    [-25, -12], [22, -10], [-35, -40], [28, -45],
    [-45, -20], [40, -30], [-18, -55], [15, -60],
    [-50, -45], [50, -40], [-30, -30], [30, -25],
    [-10, -40], [8, -42], [-55, -15], [55, -18],
    [-42, -58], [42, -55], [-62, -35], [62, -38],
  ];

  bushPositions.forEach(([x, z]) => {
    const jx = x + (rng() - 0.5) * 4;
    const jz = z + (rng() - 0.5) * 4;
    const scale = 0.5 + rng() * 0.4;
    const rotY = rng() * Math.PI * 2;
    items.push({ model: rng() > 0.5 ? "bush" : "bushLg", x: jx, z: jz, scale, rotY });
  });

  for (let i = 0; i < 30; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 15 + rng() * 50;
    const x = Math.cos(angle) * radius;
    const z = -35 + Math.sin(angle) * radius;
    if (Math.abs(x) < 12 && Math.abs(z + 8) < 12) continue;
    items.push({ model: rng() > 0.5 ? "flower" : "grass", x, z, scale: 0.6 + rng() * 0.4, rotY: rng() * Math.PI * 2 });
  }

  return items;
}

function NatureModel({ modelPath, position, scale, rotY }) {
  const { scene } = useGLTF(modelPath);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <primitive
      object={cloned}
      position={position}
      scale={[scale, scale, scale]}
      rotation={[0, rotY, 0]}
    />
  );
}

export default function NatureDecor() {
  const placements = useMemo(() => generatePlacements(), []);

  return (
    <group>
      {placements.map((p, i) => {
        const modelPath = MODELS[p.model];
        if (!modelPath) return null;
        const y = getTerrainHeightAt(p.x, p.z);
        return (
          <Suspense key={i} fallback={null}>
            <NatureModel
              modelPath={modelPath}
              position={[p.x, y, p.z]}
              scale={p.scale}
              rotY={p.rotY}
            />
          </Suspense>
        );
      })}
    </group>
  );
}

Object.values(MODELS).forEach((path) => useGLTF.preload(path));
