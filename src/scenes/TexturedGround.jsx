import { useMemo } from "react";
import * as THREE from "three";

function createGridTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#0f0e14");
  gradient.addColorStop(0.5, "#16142a");
  gradient.addColorStop(1, "#0f0e14");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
  ctx.lineWidth = 1;
  const step = 16;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export default function TexturedGround() {
  const texture = useMemo(createGridTexture, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -2]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <meshStandardMaterial
        map={texture}
        color="#15121c"
        roughness={0.95}
        metalness={0.05}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}
