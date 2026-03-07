import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { useKeyboardControls } from "@react-three/drei";
import { useControlsStore } from "../store/controlsStore";
import { getTerrainHeightAt } from "../scenes/Terrain";
import { TERRAIN_SIZE } from "../scenes/Terrain";

const GRAVITY = 18;
const JUMP_IMPULSE = 6;
const GROUND_OFFSET = 0.5;

export default function FirstPersonController({ onLock, onUnlock, enabled = true }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const velocityY = useRef(0);
  const isOnGround = useRef(true);

  const { mouseSensitivity, moveSpeed, runMultiplier, invertY } = useControlsStore();

  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    ctrl.pointerSpeed = mouseSensitivity / 0.002;
  }, [mouseSensitivity]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl?.isLocked || !enabled) return;

    const keys = getKeys();
    const { moveSpeed: speed, runMultiplier: runMult } = useControlsStore.getState();
    const move = speed * (keys.run ? runMult : 1) * delta;

    if (keys.forward) ctrl.moveForward(move);
    if (keys.backward) ctrl.moveForward(-move);
    if (keys.right) ctrl.moveRight(move);
    if (keys.left) ctrl.moveRight(-move);

    if (keys.jump && isOnGround.current) {
      velocityY.current = JUMP_IMPULSE;
      isOnGround.current = false;
    }
    velocityY.current -= GRAVITY * delta;
    camera.position.y += velocityY.current * delta;

    const half = TERRAIN_SIZE / 2;
    const groundY = getTerrainHeightAt(camera.position.x, camera.position.z) + GROUND_OFFSET;
    if (camera.position.y <= groundY) {
      camera.position.y = groundY;
      velocityY.current = 0;
      isOnGround.current = true;
    }
    camera.position.x = Math.max(-half + 2, Math.min(half - 2, camera.position.x));
    camera.position.z = Math.max(-half + 2, Math.min(half - 2, camera.position.z));
  });

  if (!enabled) return null;

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={onLock}
      onUnlock={onUnlock}
      makeDefault
      selector="canvas"
    />
  );
}
