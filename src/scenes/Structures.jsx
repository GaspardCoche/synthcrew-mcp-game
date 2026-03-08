/**
 * Structures par zone — 7 territoires avec ambiance et couleur distinctes.
 * Déblocage progressif selon les missions complétées (worldStore).
 * Dégâts visuels quand l'agent de la zone rencontre des erreurs.
 */
import { Suspense, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { getTerrainHeightAt } from "./Terrain";
import { useWorldStore } from "../store/worldStore";

// ── Helpers géométrie (avec dégâts optionnels) ─────────────────────────────────────────────
function Box({ pos, size, color, emissive, emissiveIntensity = 0.14, damage = 0 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z) + size[1] / 2;
  const d = Math.max(0, Math.min(1, damage));
  const em = emissiveIntensity * (1 - d * 0.7);
  const damageColor = d > 0.5 ? "#2a1515" : color;
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={damageColor}
        emissive={emissive}
        emissiveIntensity={em}
        roughness={0.7 + d * 0.2}
        metalness={0.15}
      />
    </mesh>
  );
}
function Cylinder({ pos, r, h, color, emissive, emissiveIntensity = 0.14, damage = 0 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z) + h / 2;
  const d = Math.max(0, Math.min(1, damage));
  const em = emissiveIntensity * (1 - d * 0.7);
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <cylinderGeometry args={[r, r * 1.1, h, 12]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={em} roughness={0.65} metalness={0.25} />
    </mesh>
  );
}
function Crystal({ pos, scale = 1, color, rotY = 0, damage = 0 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  const d = Math.max(0, Math.min(1, damage));
  const em = 0.55 * (1 - d * 0.8);
  return (
    <mesh position={[x, y, z]} rotation={[0, rotY, 0.15]} castShadow>
      <coneGeometry args={[0.22 * scale, 1.4 * scale, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={em} roughness={0.1} metalness={0.8} transparent opacity={0.88 - d * 0.3} />
    </mesh>
  );
}
// Pilône lumineux (lampadaire) — s'éteint si damage
function Pylon({ pos, color, damage = 0 }) {
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  const d = Math.max(0, Math.min(1, damage));
  const intensity = 0.6 * (1 - d * 0.9);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.8, 8]} />
        <meshStandardMaterial color="#1a1820" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2 * (1 - d)} roughness={0.1} />
      </mesh>
      {intensity > 0.05 && <pointLight position={[0, 1.0, 0]} color={color} intensity={intensity} distance={8} decay={2} />}
    </group>
  );
}

// ── Modèle GLTF ──────────────────────────────────────────────────────────────
function GltfModel({ path, pos, scale = 1, rotY = 0 }) {
  const { scene } = useGLTF(path);
  const [x, , z] = pos;
  const y = getTerrainHeightAt(x, z);
  return (
    <primitive
      object={scene.clone()}
      position={[x, y, z]}
      scale={[scale, scale, scale]}
      rotation={[0, rotY, 0]}
      castShadow receiveShadow
    />
  );
}
function RotatingPlanet({ path, pos, scale = 6 }) {
  const ref = useRef();
  const { scene } = useGLTF(path);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.025;
    ref.current.position.y = pos[1] + Math.sin(s.clock.elapsedTime * 0.15) * 1.2;
  });
  return <primitive ref={ref} object={scene.clone()} position={pos} scale={[scale, scale, scale]} />;
}

// ── ZONE 0 : Hub central (NEXUS) ────────────────────────────────────────
function ZoneHub() {
  const level = useWorldStore((s) => s.getZoneLevel("hub"));
  const damage = useWorldStore((s) => s.getZoneDamage("hub"));
  if (level < 1) return null;
  return (
    <group>
      <Box pos={[0, 0, -8]} size={[8, 0.4, 8]} color="#151224" emissive="#1e1840" emissiveIntensity={0.2} damage={damage} />
      <Box pos={[0, 0, -8]} size={[3.5, 0.8, 3.5]} color="#1a1530" emissive="#241e48" emissiveIntensity={0.25} damage={damage} />
      {[[-3.5,-4.5],[-3.5,-11.5],[3.5,-4.5],[3.5,-11.5]].map(([px, pz], i) => {
        const baseY = getTerrainHeightAt(px, pz);
        return (
          <group key={i} position={[px, baseY, pz]}>
            <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.18, 0.2, 3.2, 12]} />
              <meshStandardMaterial color="#1a1530" emissive="#ff6b35" emissiveIntensity={0.35 * (1 - damage * 0.7)} roughness={0.65} metalness={0.25} />
            </mesh>
            <mesh position={[0, 3.5, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={1.5 * (1 - damage)} />
            </mesh>
            <pointLight position={[0, 3.5, 0]} color="#ff6b35" intensity={0.8 * (1 - damage * 0.8)} distance={12} decay={2} />
          </group>
        );
      })}
      {[[-6,-8],[6,-8],[0,-2],[0,-14]].map(([px, pz], i) => <Pylon key={i} pos={[px, 0, pz]} color="#ff6b35" damage={damage} />)}
    </group>
  );
}

// ── ZONE 1 : Citadelle Data (DATAFLOW, cyan) ─────────────────────────────────
function ZoneData() {
  const level = useWorldStore((s) => s.getZoneLevel("data"));
  const damage = useWorldStore((s) => s.getZoneDamage("data"));
  if (level < 1) return null;
  const x0 = -35, z0 = -28;
  return (
    <group>
      <Box pos={[x0, 0, z0]}       size={[7, 1.2, 6]}    color="#0d1a1f" emissive="#4ecdc4" emissiveIntensity={0.12} damage={damage} />
      <Box pos={[x0-3, 0, z0-3]}   size={[2, 3.5, 1.8]}  color="#0d1418" emissive="#00a8b5" emissiveIntensity={0.2} damage={damage} />
      <Box pos={[x0+3, 0, z0-3]}   size={[2, 2.8, 1.8]}  color="#0d1418" emissive="#00a8b5" emissiveIntensity={0.2} damage={damage} />
      <Box pos={[x0, 0, z0+3]}     size={[5, 1.8, 1.2]}  color="#0d1418" emissive="#4ecdc4" emissiveIntensity={0.15} damage={damage} />
      {[[-39,-22],[-37,-24],[-35,-22],[-33,-24],[-31,-22]].map(([px,pz],i) => (
        <Box key={i} pos={[px,0,pz]} size={[1.2,2,0.5]} color="#0a1015" emissive="#4ecdc4" emissiveIntensity={0.3+i*0.05} damage={damage} />
      ))}
      <Cylinder pos={[x0-7, 0, z0-6]} r={0.6} h={5.5} color="#0d1418" emissive="#4ecdc4" emissiveIntensity={0.25} damage={damage} />
      <mesh position={[x0-7, getTerrainHeightAt(x0-7,z0-6)+5.8, z0-6]}>
        <sphereGeometry args={[0.4,16,16]} />
        <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={2 * (1 - damage)} />
      </mesh>
      <pointLight position={[x0-7, getTerrainHeightAt(x0-7,z0-6)+5.8, z0-6]} color="#4ecdc4" intensity={2 * (1 - damage * 0.8)} distance={20} decay={2} />
      {[[-30,-20,1.2],[-32,-18,0.9],[-38,-19,1.0],[-40,-21,1.4]].map(([px,pz,s],i) => (
        <Crystal key={i} pos={[px,0,pz]} scale={s} color="#4ecdc4" rotY={i*0.7} damage={damage} />
      ))}
      {[[-33,-26],[-37,-30],[-30,-32],[-42,-28]].map(([px,pz],i) => <Pylon key={i} pos={[px,0,pz]} color="#4ecdc4" damage={damage} />)}
    </group>
  );
}

// ── ZONE 2 : Spire d'Analyse (PRISME, purple) ───────────────────────────────
function ZoneAnalysis() {
  const level = useWorldStore((s) => s.getZoneLevel("analysis"));
  const damage = useWorldStore((s) => s.getZoneDamage("analysis"));
  if (level < 1) return null;
  const x0 = 32, z0 = -35;
  return (
    <group>
      <Box pos={[x0, 0, z0]}     size={[6, 0.5, 6]}   color="#14101e" emissive="#6c5ce7" emissiveIntensity={0.14} damage={damage} />
      <Cylinder pos={[x0, 0, z0]} r={1.2} h={6.5}     color="#14101e" emissive="#6c5ce7" emissiveIntensity={0.2} damage={damage} />
      <mesh position={[x0, getTerrainHeightAt(x0,z0)+7, z0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#6c5ce7" emissive="#6c5ce7" emissiveIntensity={2 * (1 - damage)} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[x0, getTerrainHeightAt(x0,z0)+7, z0]} color="#6c5ce7" intensity={3 * (1 - damage * 0.8)} distance={25} decay={2} />
      {[[28,-30,1.3],[30,-28,0.8],[34,-28,1.1],[38,-30,1.4],[36,-33,0.9],[26,-34,1.0],[38,-40,1.2],[28,-40,0.9]].map(([px,pz,s],i) => (
        <Crystal key={i} pos={[px,0,pz]} scale={s} color={i%2===0?"#6c5ce7":"#5b4bd4"} rotY={i*0.55} damage={damage} />
      ))}
      <Box pos={[x0+6, 0, z0-5]} size={[2.5,2,2]}  color="#14101e" emissive="#6c5ce7" emissiveIntensity={0.3} damage={damage} />
      <Box pos={[x0-6, 0, z0-5]} size={[1.8,2.8,1.5]} color="#14101e" emissive="#5b4bd4" emissiveIntensity={0.25} damage={damage} />
      {[[26,-30],[38,-28],[30,-42],[36,-42]].map(([px,pz],i) => <Pylon key={i} pos={[px,0,pz]} color="#6c5ce7" damage={damage} />)}
    </group>
  );
}

// ── ZONE 3 : Archive (SCRIBE, amber) ─────────────────────────────────────
function ZoneArchive() {
  const level = useWorldStore((s) => s.getZoneLevel("archive"));
  const damage = useWorldStore((s) => s.getZoneDamage("archive"));
  if (level < 1) return null;
  const x0 = -28, z0 = -52;
  return (
    <group>
      <Box pos={[x0, 0, z0]}       size={[8, 0.6, 7]}   color="#1a1200" emissive="#f59e0b" emissiveIntensity={0.1} damage={damage} />
      <Box pos={[x0, 0, z0]}       size={[4, 2.5, 4]}   color="#1e1500" emissive="#d97706" emissiveIntensity={0.15} damage={damage} />
      {[[-22,-46],[-34,-46],[-22,-58],[-34,-58],[-28,-46],[-28,-58]].map(([px,pz],i) => (
        <Cylinder key={i} pos={[px,0,pz]} r={0.55} h={4+i*0.2} color="#1e1200" emissive="#f59e0b" emissiveIntensity={0.18} damage={damage} />
      ))}
      <Box pos={[x0, 0, z0-7]}   size={[6,3.5,0.4]}   color="#1e1500" emissive="#f59e0b" emissiveIntensity={0.12} damage={damage} />
      <Box pos={[x0-4, 0, z0-7]} size={[0.4,3.5,0.4]} color="#1e1500" emissive="#f59e0b" emissiveIntensity={0.12} damage={damage} />
      <Box pos={[x0+4, 0, z0-7]} size={[0.4,3.5,0.4]} color="#1e1500" emissive="#f59e0b" emissiveIntensity={0.12} damage={damage} />
      {[[-20,-48,1.0],[-36,-48,1.1],[-24,-60,0.8],[-32,-60,0.9]].map(([px,pz,s],i) => (
        <Crystal key={i} pos={[px,0,pz]} scale={s} color="#f59e0b" rotY={i*0.9} damage={damage} />
      ))}
      <pointLight position={[x0, getTerrainHeightAt(x0,z0)+3, z0]} color="#f59e0b" intensity={2 * (1 - damage * 0.8)} distance={18} decay={2} />
      {[[-22,-54],[-34,-54],[-28,-44],[-28,-62]].map(([px,pz],i) => <Pylon key={i} pos={[px,0,pz]} color="#f59e0b" damage={damage} />)}
    </group>
  );
}

// ── ZONE 4 : Tour Comms (SIGNAL, green) ─────────────────────────────────────
function ZoneComms() {
  const level = useWorldStore((s) => s.getZoneLevel("comms"));
  const damage = useWorldStore((s) => s.getZoneDamage("comms"));
  if (level < 1) return null;
  const x0 = 42, z0 = -18;
  return (
    <group>
      <Box pos={[x0, 0, z0]}       size={[6, 0.5, 6]}   color="#0a1a0d" emissive="#22c55e" emissiveIntensity={0.12} damage={damage} />
      <Cylinder pos={[x0, 0, z0]}   r={1.0} h={8}       color="#0d1f10" emissive="#22c55e" emissiveIntensity={0.18} damage={damage} />
      <mesh position={[x0, getTerrainHeightAt(x0,z0)+8.5, z0]}>
        <torusGeometry args={[0.5, 0.1, 8, 24]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2 * (1 - damage)} />
      </mesh>
      <pointLight position={[x0, getTerrainHeightAt(x0,z0)+8.5, z0]} color="#22c55e" intensity={2.5 * (1 - damage * 0.8)} distance={22} decay={2} />
      {[[48,-12,3],[50,-16,2.5],[50,-22,2],[46,-8,3.5]].map(([px,pz,h],i) => (
        <Cylinder key={i} pos={[px,0,pz]} r={0.1} h={h} color="#0d1a10" emissive="#22c55e" emissiveIntensity={0.5} damage={damage} />
      ))}
      {[[44,-26],[50,-28],[36,-14],[40,-10]].map(([px,pz],i) => (
        <Box key={i} pos={[px,0,pz]} size={[1.5,1,0.2]} color="#0d1a10" emissive="#22c55e" emissiveIntensity={0.3} damage={damage} />
      ))}
      {[[38,-14],[44,-26],[48,-10],[52,-20]].map(([px,pz],i) => <Pylon key={i} pos={[px,0,pz]} color="#22c55e" damage={damage} />)}
    </group>
  );
}

// ── ZONE 5 : Base Fantôme (SPIDER, red) ─────────────────────────────────────
function ZonePhantom() {
  const level = useWorldStore((s) => s.getZoneLevel("phantom"));
  const damage = useWorldStore((s) => s.getZoneDamage("phantom"));
  if (level < 1) return null;
  const x0 = 18, z0 = -58;
  return (
    <group>
      <Box pos={[x0, 0, z0]}     size={[5, 0.35, 5]}  color="#1a0808" emissive="#ef4444" emissiveIntensity={0.1} damage={damage} />
      <Box pos={[x0+4, 0, z0-6]} size={[3,1.5,2.5]}   color="#1a0a0a" emissive="#ef4444" emissiveIntensity={0.2} damage={damage} />
      <Box pos={[x0-4, 0, z0+4]} size={[2.5,1.2,3]}   color="#1a0a0a" emissive="#dc2626" emissiveIntensity={0.18} damage={damage} />
      <Suspense fallback={null}>
        <GltfModel path="/models/environment/Rock_Large_1.gltf" pos={[x0-5,0,z0-4]} scale={0.9} rotY={0.4} />
        <GltfModel path="/models/environment/Rock_Large_2.gltf" pos={[x0+6,0,z0+2]} scale={0.75} rotY={1.8} />
        <GltfModel path="/models/environment/Rock_Large_1.gltf" pos={[x0,0,z0-8]}   scale={1.1} rotY={2.5} />
      </Suspense>
      {[[12,-52,1.1],[24,-52,0.9],[14,-64,1.3],[22,-64,0.8],[10,-56,0.7]].map(([px,pz,s],i) => (
        <Crystal key={i} pos={[px,0,pz]} scale={s} color="#ef4444" rotY={i*0.6} damage={damage} />
      ))}
      <pointLight position={[x0, getTerrainHeightAt(x0,z0)+2, z0]} color="#ef4444" intensity={1.5 * (1 - damage * 0.8)} distance={15} decay={2} />
      {[[14,-54],[22,-54],[16,-62],[20,-62]].map(([px,pz],i) => <Pylon key={i} pos={[px,0,pz]} color="#ef4444" damage={damage} />)}
    </group>
  );
}

// ── ZONE 6 : Atelier Forge (CODEFORGE, pink) ────────────────────────────────────
function ZoneForge() {
  const level = useWorldStore((s) => s.getZoneLevel("forge"));
  const damage = useWorldStore((s) => s.getZoneDamage("forge"));
  if (level < 1) return null;
  const x0 = -15, z0 = -62;
  return (
    <group>
      <Box pos={[x0, 0, z0]}       size={[8, 0.5, 7]}   color="#1a0815" emissive="#ec4899" emissiveIntensity={0.1} damage={damage} />
      <Box pos={[x0, 0, z0]}       size={[5, 2, 4]}     color="#1e0d18" emissive="#ec4899" emissiveIntensity={0.15} damage={damage} />
      {[[-8,-56],[-22,-56],[-8,-68],[-22,-68],[-15,-56],[-15,-68]].map(([px,pz],i) => (
        <Box key={i} pos={[px,0,pz]} size={[2,1.5+i*0.2,1.5]} color="#1e0d18" emissive="#ec4899" emissiveIntensity={0.25+i*0.04} damage={damage} />
      ))}
      {[[-12,-58],[-18,-58],[-10,-64],[-20,-64]].map(([px,pz],i) => (
        <Cylinder key={i} pos={[px,0,pz]} r={0.15} h={2.5} color="#120810" emissive="#ec4899" emissiveIntensity={0.4} damage={damage} />
      ))}
      {[[-8,-58,0.9],[-22,-58,1.1],[-8,-66,0.8],[-22,-66,1.0],[-15,-70,1.2]].map(([px,pz,s],i) => (
        <Crystal key={i} pos={[px,0,pz]} scale={s} color="#ec4899" rotY={i*0.8} damage={damage} />
      ))}
      <pointLight position={[x0, getTerrainHeightAt(x0,z0)+2.5, z0]} color="#ec4899" intensity={2 * (1 - damage * 0.8)} distance={18} decay={2} />
      {[[-10,-58],[-20,-58],[-10,-66],[-20,-66]].map(([px,pz],i) => <Pylon key={i} pos={[px,0,pz]} color="#ec4899" damage={damage} />)}
    </group>
  );
}

// ── Décoration globale ───────────────────────────────────────────────────────
function WorldDecoration() {
  return (
    <group>
      {/* Arbres flottants disséminés */}
      <Suspense fallback={null}>
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[-3,0,-9]}    scale={0.9} rotY={0}   />
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[5,0,-10]}    scale={0.75} rotY={1.2} />
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[-12,0,-42]}  scale={0.8} rotY={0.6} />
        <GltfModel path="/models/environment/Tree_Floating_1.gltf" pos={[22,0,-48]}   scale={0.85} rotY={2.0} />
        <GltfModel path="/models/environment/Tree_Blob_1.gltf"     pos={[-18,0,-15]}  scale={1.0} rotY={0.5} />
        <GltfModel path="/models/environment/Tree_Blob_1.gltf"     pos={[20,0,-14]}   scale={0.85} rotY={2.1} />
        <GltfModel path="/models/environment/Tree_Blob_3.gltf"     pos={[-5,0,-30]}   scale={1.1} rotY={0.8} />
        <GltfModel path="/models/environment/Tree_Blob_3.gltf"     pos={[8,0,-44]}    scale={0.9} rotY={1.8} />
        <GltfModel path="/models/environment/Tree_Blob_3.gltf"     pos={[-45,0,-38]}  scale={1.0} rotY={1.2} />
        <GltfModel path="/models/environment/Tree_Blob_1.gltf"     pos={[55,0,-32]}   scale={1.1} rotY={0.3} />
        {/* Bâtiments GLTF arrière-plan */}
        <GltfModel path="/models/environment/Building_L.gltf"      pos={[-55,0,-12]}  scale={0.55} rotY={Math.PI*0.25} />
        <GltfModel path="/models/environment/Building_L.gltf"      pos={[52,0,-48]}   scale={0.5} rotY={Math.PI*0.75} />
        <GltfModel path="/models/environment/Base_Large.gltf"       pos={[0,0,-82]}    scale={0.65} rotY={0} />
        <GltfModel path="/models/environment/Base_Large.gltf"       pos={[-60,0,-55]}  scale={0.55} rotY={1.0} />
        {/* Rochers isolés */}
        <GltfModel path="/models/environment/Rock_Large_2.gltf"     pos={[-20,0,-20]}  scale={1.2} rotY={0.3} />
        <GltfModel path="/models/environment/Rock_Large_1.gltf"     pos={[14,0,-20]}   scale={1.0} rotY={1.1} />
        <GltfModel path="/models/environment/Rock_Large_2.gltf"     pos={[5,0,-38]}    scale={1.3} rotY={2.4} />
        <GltfModel path="/models/environment/Rock_Large_1.gltf"     pos={[-50,0,-46]}  scale={1.4} rotY={0.7} />
        <GltfModel path="/models/environment/Rock_Large_2.gltf"     pos={[56,0,-42]}   scale={1.1} rotY={1.5} />
        {/* Planète en arrière-plan */}
        <RotatingPlanet path="/models/environment/Planet_2.gltf" pos={[50, 22, -90]} scale={10} />
      </Suspense>
      {/* Cristaux décoratifs isolés */}
      {[
        [-14,-4,0.8,"#ff6b35"],[12,-4,0.7,"#4ecdc4"],[-2,-18,1.0,"#6c5ce7"],[20,-4,0.9,"#22c55e"],
        [-22,-34,1.1,"#4ecdc4"],[0,-50,0.9,"#6c5ce7"],[42,-8,0.8,"#22c55e"],[-40,-18,1.0,"#4ecdc4"],
        [35,-22,0.7,"#6c5ce7"],[-8,-76,1.2,"#ec4899"],[26,-72,0.9,"#ef4444"],[-50,-70,1.0,"#4ecdc4"],
      ].map(([px,pz,s,c],i) => <Crystal key={i} pos={[px,0,pz]} scale={s} color={c} rotY={i*0.7} />)}
    </group>
  );
}

export default function Structures() {
  return (
    <group>
      <ZoneHub />
      <ZoneData />
      <ZoneAnalysis />
      <ZoneArchive />
      <ZoneComms />
      <ZonePhantom />
      <ZoneForge />
      <WorldDecoration />
    </group>
  );
}

const ALL_MODELS = [
  "/models/environment/Tree_Floating_1.gltf",
  "/models/environment/Tree_Blob_1.gltf",
  "/models/environment/Tree_Blob_3.gltf",
  "/models/environment/Rock_Large_1.gltf",
  "/models/environment/Rock_Large_2.gltf",
  "/models/environment/Building_L.gltf",
  "/models/environment/Base_Large.gltf",
  "/models/environment/Planet_2.gltf",
];
ALL_MODELS.forEach((p) => useGLTF.preload(p));
