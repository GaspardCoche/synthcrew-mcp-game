import { useFrame } from "@react-three/fiber";
import { agentCollidersRef } from "../lib/agentColliders";

/** À placer avant les agents : vide la ref des colliders au début de chaque frame. */
export default function ClearAgentColliders() {
  useFrame(() => {
    agentCollidersRef.current = {};
  });
  return null;
}
