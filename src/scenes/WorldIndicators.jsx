/**
 * Indicateurs monde : orbes d'erreur flottants et ambiance (fog/ciel) selon l'état du monde.
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useWorldStore } from "../store/worldStore";

function ErrorOrb({ delay, scale = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + delay;
    ref.current.position.y = 4 + Math.sin(t * 0.4) * 2;
    ref.current.position.x = Math.sin(t * 0.3) * 6;
    ref.current.position.z = -10 + Math.cos(t * 0.25) * 4;
    ref.current.material.opacity = 0.35 + Math.sin(t * 1.5) * 0.15;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.35 * scale, 16, 16]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
    </mesh>
  );
}

export default function WorldIndicators() {
  const recentErrors = useWorldStore((s) => s.recentErrorsCount);
  const show = recentErrors > 0;
  if (!show) return null;
  const n = Math.min(3, recentErrors);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <ErrorOrb key={i} delay={i * 2.1} scale={0.8 + i * 0.2} />
      ))}
    </group>
  );
}
