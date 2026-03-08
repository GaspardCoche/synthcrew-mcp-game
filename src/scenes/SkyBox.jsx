import { useRef, useMemo } from "react";
import { useThrottledFrame } from "../lib/useThrottledFrame";
import * as THREE from "three";

function rand(seed) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

function StarLayer({ count = 500, radius = 200, size = 0.5, color = "#ffffff", speed = 0.0001, seed = 0 }) {
  const ref = useRef();

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = rand(seed + i * 3.1) * Math.PI * 2;
      const phi = Math.acos(2 * rand(seed + i * 7.3) - 1);
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, radius, seed]);

  useThrottledFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * speed;
    }
  }, 10);

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

function NebulaCloud({ position, color, scale = 40, opacity = 0.08 }) {
  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.8)");
    g.addColorStop(0.4, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <sprite position={position} scale={[scale, scale * 0.5, 1]}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

function ShootingStar() {
  const groupRef = useRef();
  const sphereRef = useRef();
  const stateRef = useRef({ phase: "wait", timer: 0, start: new THREE.Vector3(), dir: new THREE.Vector3(), progress: 0 });

  useThrottledFrame((_, delta) => {
    const s = stateRef.current;
    s.timer += delta;
    if (s.phase === "wait") {
      if (s.timer > 6 + Math.random() * 12) {
        s.phase = "fly";
        s.timer = 0;
        s.progress = 0;
        s.start.set((Math.random() - 0.5) * 200, 80 + Math.random() * 50, -80 - Math.random() * 80);
        s.dir.set((Math.random() - 0.5) * 50, -25 - Math.random() * 15, (Math.random() - 0.5) * 30).normalize();
      }
    } else {
      s.progress += delta * 80;
      const pos = s.start.clone().addScaledVector(s.dir, s.progress);
      if (groupRef.current) groupRef.current.position.copy(pos);
      const alpha = Math.max(0, 0.9 - s.progress / 60);
      if (sphereRef.current) sphereRef.current.material.opacity = alpha;
      if (s.progress > 70 || pos.y < -20) {
        s.phase = "wait";
        s.timer = 0;
        if (sphereRef.current) sphereRef.current.material.opacity = 0;
      }
    }
  }, 30);

  return (
    <group ref={groupRef} position={[0, 200, 0]}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaddff" emissiveIntensity={3} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function FloatingPlanet() {
  const ref = useRef();
  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.015;
  }, 8);
  return (
    <group position={[120, 80, -180]} ref={ref}>
      <mesh>
        <sphereGeometry args={[12, 24, 24]} />
        <meshStandardMaterial color="#2a1a4a" emissive="#3a2060" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>
      <mesh>
        <ringGeometry args={[16, 20, 48]} />
        <meshBasicMaterial color="#4a3080" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AuroraStrip({ y, color, speed, scale }) {
  const ref = useRef();
  const tex = useMemo(() => {
    const s = 256;
    const canvas = document.createElement("canvas");
    canvas.width = s; canvas.height = s / 4;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.3, color);
    g.addColorStop(0.5, color);
    g.addColorStop(0.7, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s / 4);
    return new THREE.CanvasTexture(canvas);
  }, [color]);

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.04 + Math.sin(clock.elapsedTime * speed) * 0.02;
    ref.current.position.x = Math.sin(clock.elapsedTime * speed * 0.3) * 15;
  }, 8);

  return (
    <sprite ref={ref} position={[0, y, -200]} scale={scale}>
      <spriteMaterial map={tex} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
}

export default function SkyBox() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[240, 32, 16]} />
        <meshBasicMaterial color="#080c1a" side={THREE.BackSide} />
      </mesh>

      <StarLayer count={600} radius={215} size={0.5} color="#c8dcff" speed={0.00006} seed={0} />
      <StarLayer count={200} radius={200} size={1.0} color="#ffe8c0" speed={0.00003} seed={42} />
      <StarLayer count={80} radius={190} size={1.8} color="#ffffff" speed={0.00004} seed={99} />

      <NebulaCloud position={[-80, 90, -190]} color="#5a2f9a" scale={80} opacity={0.09} />
      <NebulaCloud position={[90, 110, -200]} color="#1a4a8e" scale={90} opacity={0.08} />
      <NebulaCloud position={[0, 70, -210]} color="#2a1050" scale={60} opacity={0.06} />
      <NebulaCloud position={[-40, 130, -180]} color="#0a305a" scale={50} opacity={0.05} />

      <AuroraStrip y={100} color="rgba(80,200,180,0.15)" speed={0.5} scale={[200, 15, 1]} />
      <AuroraStrip y={110} color="rgba(100,80,200,0.12)" speed={0.35} scale={[180, 12, 1]} />

      <FloatingPlanet />
      <ShootingStar />
    </>
  );
}
