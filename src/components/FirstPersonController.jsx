import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, useKeyboardControls } from "@react-three/drei";
import { useControlsStore } from "../store/controlsStore";
import { getTerrainHeightAt, TERRAIN_SIZE } from "../scenes/Terrain";
import { isBlocked } from "../lib/collisions";
import { agentCollidersRef } from "../lib/agentColliders";
import { usePlayerStore } from "../store/playerStore";

const GRAVITY       = 18;
const JUMP_IMPULSE  = 7;
const GROUND_OFFSET = 1.65;
const PLAYER_RADIUS = 0.55;

export default function FirstPersonController({ onLock, onUnlock, enabled = true }) {
  const controlsRef = useRef();
  const { camera }  = useThree();
  const [, getKeys] = useKeyboardControls();
  const velocityY   = useRef(0);
  const onGround    = useRef(true);
  const { mouseSensitivity } = useControlsStore();
  const setPlayerPosition = usePlayerStore((s) => s.setPosition);

  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    ctrl.pointerSpeed = mouseSensitivity / 0.002;
  }, [mouseSensitivity]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl?.isLocked || !enabled) return;
    const keys = getKeys();
    const { moveSpeed, runMultiplier } = useControlsStore.getState();
    const speed = moveSpeed * (keys.run ? runMultiplier : 1) * delta;

    // Avant / arrière
    const prevX = camera.position.x, prevZ = camera.position.z;
    if (keys.forward)  ctrl.moveForward(speed);
    if (keys.backward) ctrl.moveForward(-speed);
    const agentCircles = Object.values(agentCollidersRef.current);
    if (isBlocked(camera.position.x, camera.position.z, PLAYER_RADIUS, agentCircles)) {
      camera.position.x = prevX; camera.position.z = prevZ;
    }

    // Latéral
    const prevX2 = camera.position.x, prevZ2 = camera.position.z;
    if (keys.right) ctrl.moveRight(speed);
    if (keys.left)  ctrl.moveRight(-speed);
    if (isBlocked(camera.position.x, camera.position.z, PLAYER_RADIUS, agentCircles)) {
      camera.position.x = prevX2; camera.position.z = prevZ2;
    }

    // Saut + gravité
    if (keys.jump && onGround.current) {
      velocityY.current = JUMP_IMPULSE;
      onGround.current  = false;
    }
    velocityY.current -= GRAVITY * delta;
    camera.position.y += velocityY.current * delta;

    const groundY = getTerrainHeightAt(camera.position.x, camera.position.z) + GROUND_OFFSET;
    if (camera.position.y <= groundY) {
      camera.position.y = groundY;
      velocityY.current = 0;
      onGround.current  = true;
    }

    const half = TERRAIN_SIZE / 2 - 3;
    camera.position.x = Math.max(-half, Math.min(half, camera.position.x));
    camera.position.z = Math.max(-half, Math.min(half, camera.position.z));
    setPlayerPosition(camera.position.x, camera.position.z);
  });

  if (!enabled) return null;
  return (
    <PointerLockControls ref={controlsRef} onLock={onLock} onUnlock={onUnlock} makeDefault selector="canvas" />
  );
}
