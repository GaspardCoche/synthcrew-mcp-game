import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import { getTerrainHeightAt } from "./Terrain";

const GUIDE_COLOR = "#fbbf24";
const GUIDE_X = 3;
const GUIDE_Z = -4;

export default function GuideAgent({ onClick, selected }) {
  const meshRef = useRef();
  const innerRef = useRef();
  const baseY = getTerrainHeightAt(GUIDE_X, GUIDE_Z) + 0.4;

  useFrame((state) => {
    if (!meshRef.current || !innerRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.08;
    innerRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
  });

  return (
    <group position={[GUIDE_X, baseY, GUIDE_Z]}>
      <Float speed={1.2} floatIntensity={0.15} rotationIntensity={0.05}>
        <group
          ref={meshRef}
          onClick={(e) => (e.stopPropagation(), onClick?.())}
          onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          <mesh ref={innerRef}>
            <sphereGeometry args={[0.28, 32, 32]} />
            <meshStandardMaterial
              color={GUIDE_COLOR}
              emissive={GUIDE_COLOR}
              emissiveIntensity={selected ? 0.9 : 0.5}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.32, 32, 32]} />
            <meshBasicMaterial color={GUIDE_COLOR} transparent opacity={0.15} />
          </mesh>
        </group>
      </Float>
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.1}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
      >
        NOVA · Ton guide
      </Text>
    </group>
  );
}