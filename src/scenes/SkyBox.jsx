/**
 * SkyBox — dynamic sci-fi sky for SynthCrew world.
 * Layers: parallax stars, nebula sprites, distant planet, aurora borealis,
 * occasional shooting stars.
 */
import { useRef, useMemo } from "react";
import { useThrottledFrame } from "../lib/useThrottledFrame";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function rand(seed) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

// ─────────────────────────────────────────────────────────────────────────────
// StarLayer — instanced point cloud at given radius & count
// ─────────────────────────────────────────────────────────────────────────────
function StarLayer({ count = 800, radius = 180, size = 1.2, color = "#ffffff", speed = 0.00015, seed = 0 }) {
  const ref = useRef();

  const { positions, geometry } = useMemo(() => {
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
    return { positions, geometry: geo };
  }, [count, radius, seed]);

  useThrottledFrame(({ clock }) => {
    if (ref.current) {
      // Slow drift — parallax relative to camera tilt
      ref.current.rotation.y = clock.elapsedTime * speed;
      ref.current.rotation.x = clock.elapsedTime * speed * 0.4;
    }
  }, 15);

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NebulaCloud — sprite-based colored cloud patch
// ─────────────────────────────────────────────────────────────────────────────
function NebulaCloud({ position, color, scale = 30, opacity = 0.12 }) {
  const ref = useRef();

  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Soft radial blob
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.4, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useThrottledFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = opacity * (0.7 + 0.3 * Math.sin(clock.elapsedTime * 0.3 + position[0]));
    }
  }, 10);

  return (
    <sprite ref={ref} position={position} scale={[scale, scale * 0.6, 1]}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DistantPlanet — large glowing sphere with subtle texture
// ─────────────────────────────────────────────────────────────────────────────
function DistantPlanet({ position = [80, 55, -200], radius = 22, colorA = "#1a0a3a", colorB = "#4a2080", ringColor = "#8860c0" }) {
  const planetRef = useRef();
  const ringRef = useRef();

  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Base gradient
    const g = ctx.createRadialGradient(size * 0.45, size * 0.4, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, colorB);
    g.addColorStop(0.6, colorA);
    g.addColorStop(1, "#080410");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // Band stripes
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      const y = (i / 8) * size;
      ctx.fillStyle = i % 2 === 0 ? colorB : "#2a1060";
      ctx.fillRect(0, y, size, size / 9);
    }
    ctx.globalAlpha = 1;
    // Glow highlight
    const hl = ctx.createRadialGradient(size * 0.35, size * 0.35, 0, size * 0.35, size * 0.35, size * 0.25);
    hl.addColorStop(0, "rgba(180,120,255,0.35)");
    hl.addColorStop(1, "transparent");
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, [colorA, colorB]);

  useThrottledFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (planetRef.current) {
      planetRef.current.rotation.y = t * 0.02;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.008;
    }
  }, 15);

  return (
    <group position={position}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial map={texture} emissive={colorB} emissiveIntensity={0.15} roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Atmospheric glow */}
      <mesh>
        <sphereGeometry args={[radius * 1.06, 32, 16]} />
        <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={0.08} transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Ring */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.38, 0.2, 0]}>
        <torusGeometry args={[radius * 1.6, radius * 0.18, 4, 80]} />
        <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={0.2} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aurora — northern lights effect using layered translucent planes
// ─────────────────────────────────────────────────────────────────────────────
const auroraVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const auroraFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  varying vec2  vUv;

  void main() {
    float wave = sin(vUv.x * 8.0 + uTime * 0.6) * 0.5 + 0.5;
    wave += 0.3 * sin(vUv.x * 15.0 - uTime * 0.4);
    wave += 0.15 * sin(vUv.x * 3.0 + uTime * 0.2);
    float vertFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
    float alpha = wave * vertFade * 0.28;
    vec3 col = mix(uColorA, uColorB, wave);
    col *= 0.7 + 0.3 * sin(uTime * 0.5 + vUv.x * 5.0);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function AuroraLayer({ position, rotation, colorA, colorB, width = 300, height = 45, speed = 1 }) {
  const ref = useRef();
  const uniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
  }), [colorA, colorB]);

  useThrottledFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = clock.elapsedTime * speed;
    }
  }, 20);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height, 32, 8]} />
      <shaderMaterial
        ref={ref}
        vertexShader={auroraVert}
        fragmentShader={auroraFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShootingStar — occasional animated meteor streak
// ─────────────────────────────────────────────────────────────────────────────
function ShootingStar() {
  const groupRef = useRef();
  const sphereRef = useRef();
  const trailRef = useRef();
  const stateRef = useRef({ phase: "wait", timer: 0, start: new THREE.Vector3(), dir: new THREE.Vector3(), progress: 0 });

  useThrottledFrame((_, delta) => {
    const s = stateRef.current;
    s.timer += delta;

    if (s.phase === "wait") {
      if (s.timer > 4 + Math.random() * 8) {
        s.phase = "fly";
        s.timer = 0;
        s.progress = 0;
        s.start.set(
          (Math.random() - 0.5) * 200,
          80 + Math.random() * 60,
          -80 - Math.random() * 100
        );
        s.dir.set(
          (Math.random() - 0.5) * 60,
          -25 - Math.random() * 20,
          (Math.random() - 0.5) * 40
        ).normalize();
      }
    } else if (s.phase === "fly") {
      s.progress += delta * 80;
      const pos = s.start.clone().addScaledVector(s.dir, s.progress);
      if (groupRef.current) {
        groupRef.current.position.copy(pos);
      }
      const alpha = Math.max(0, 0.9 - s.progress / 60);
      if (sphereRef.current) sphereRef.current.material.opacity = alpha;
      if (trailRef.current) trailRef.current.material.opacity = alpha * 0.6;
      if (s.progress > 70 || pos.y < -20) {
        s.phase = "wait";
        s.timer = 0;
        if (sphereRef.current) sphereRef.current.material.opacity = 0;
        if (trailRef.current) trailRef.current.material.opacity = 0;
      }
    }
  }, 30);

  const trailGeo = useMemo(() => {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-3, 0.5, 0)];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group ref={groupRef} position={[0, 200, 0]}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaddff" emissiveIntensity={3} transparent opacity={0} />
      </mesh>
      <line ref={trailRef} geometry={trailGeo}>
        <lineBasicMaterial color="#aaddff" transparent opacity={0} />
      </line>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkyBox — full sky scene
// ─────────────────────────────────────────────────────────────────────────────
export default function SkyBox() {
  return (
    <>
      {/* Background gradient dome */}
      <mesh>
        <sphereGeometry args={[240, 32, 16]} />
        <meshBasicMaterial color="#040210" side={THREE.BackSide} />
      </mesh>

      {/* Star layers at different radii for parallax depth */}
      <StarLayer count={1200} radius={220} size={0.45} color="#cce8ff" speed={0.00008} seed={0} />
      <StarLayer count={600}  radius={180} size={0.65} color="#e8d8ff" speed={0.00015} seed={100} />
      <StarLayer count={200}  radius={140} size={0.85} color="#ffffff" speed={0.00025} seed={200} />
      <StarLayer count={80}   radius={110} size={1.4}  color="#ffe8aa" speed={0.00035} seed={300} />

      {/* Nebula clouds */}
      <NebulaCloud position={[-60, 90, -190]}  color="#4a1f8a" scale={70} opacity={0.10} />
      <NebulaCloud position={[80,  100, -200]} color="#0d3a6e" scale={90} opacity={0.08} />
      <NebulaCloud position={[-120, 70, -180]} color="#6b1f4a" scale={60} opacity={0.07} />
      <NebulaCloud position={[140,  80, -160]} color="#1a4a6e" scale={80} opacity={0.09} />
      <NebulaCloud position={[0,   120, -210]} color="#3a1a6e" scale={110} opacity={0.06} />

      {/* Distant planet with ring */}
      <DistantPlanet
        position={[80, 55, -200]}
        radius={22}
        colorA="#1a0a3a"
        colorB="#4a2080"
        ringColor="#8860c0"
      />
      {/* Second smaller moon */}
      <DistantPlanet
        position={[-120, 35, -220]}
        radius={9}
        colorA="#0a1a2a"
        colorB="#1a4060"
        ringColor="#406080"
      />

      {/* Aurora borealis — multiple layers with different colors */}
      <AuroraLayer
        position={[0, 70, -195]}
        rotation={[0.12, 0, 0]}
        colorA="#00d4a0"
        colorB="#0080ff"
        width={320}
        height={50}
        speed={1.0}
      />
      <AuroraLayer
        position={[-40, 80, -190]}
        rotation={[0.08, 0.2, 0]}
        colorA="#9000ff"
        colorB="#00aaff"
        width={250}
        height={40}
        speed={0.7}
      />
      <AuroraLayer
        position={[60, 65, -185]}
        rotation={[0.15, -0.15, 0]}
        colorA="#00ff88"
        colorB="#0050ff"
        width={200}
        height={35}
        speed={1.3}
      />

      {/* Shooting stars */}
      <ShootingStar />
      <ShootingStar />
      <ShootingStar />
    </>
  );
}
