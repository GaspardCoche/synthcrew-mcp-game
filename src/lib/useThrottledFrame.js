import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Like useFrame but only fires at a capped FPS.
 * Use for decorative animations that don't need 60 fps:
 *   Stars rotation → 15 fps
 *   Hologram spin → 30 fps
 *   Opacity pulse → 20 fps
 *   Gear rotation → 30 fps
 */
export function useThrottledFrame(callback, targetFps = 30, priority = 0) {
  const accum = useRef(0);
  const interval = 1 / targetFps;

  useFrame((state, delta) => {
    accum.current += delta;
    if (accum.current >= interval) {
      accum.current %= interval;
      callback(state, delta);
    }
  }, priority);
}
