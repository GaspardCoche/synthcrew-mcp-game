import { usePlayerStore } from "../store/playerStore";
import { useWorldStore } from "../store/worldStore";

const MAP_SIZE = 140;
const WORLD_RANGE = 80;

const ZONES = [
  { key: "hub",      x: 0,   z: -8,  color: "#eab308", label: "Hub" },
  { key: "data",     x: -35, z: -28, color: "#00f0ff", label: "Data" },
  { key: "analysis", x: 32,  z: -35, color: "#a855f7", label: "Analyse" },
  { key: "archive",  x: -28, z: -52, color: "#f59e0b", label: "Archive" },
  { key: "comms",    x: 42,  z: -18, color: "#22c55e", label: "Comms" },
  { key: "phantom",  x: 18,  z: -58, color: "#ef4444", label: "Phantom" },
  { key: "forge",    x: -15, z: -62, color: "#ec4899", label: "Forge" },
];

function worldToMap(wx, wz) {
  const mx = ((wx + WORLD_RANGE) / (WORLD_RANGE * 2)) * MAP_SIZE;
  const my = ((-wz + WORLD_RANGE) / (WORLD_RANGE * 2)) * MAP_SIZE;
  return { x: Math.max(2, Math.min(MAP_SIZE - 2, mx)), y: Math.max(2, Math.min(MAP_SIZE - 2, my)) };
}

export default function Minimap() {
  const { x: px, z: pz } = usePlayerStore((s) => s.position);
  const getZoneLevel = useWorldStore((s) => s.getZoneLevel);
  const player = worldToMap(px, pz);

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-none">
      <div
        className="relative rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden"
        style={{ width: MAP_SIZE, height: MAP_SIZE }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,240,255,0.15) 0%, transparent 70%)",
          }}
        />
        <svg width={MAP_SIZE} height={MAP_SIZE} className="absolute inset-0">
          {ZONES.map((zone) => {
            const level = getZoneLevel(zone.key);
            const pos = worldToMap(zone.x, zone.z);
            const locked = level < 1;
            return (
              <g key={zone.key}>
                <line
                  x1={worldToMap(0, -8).x} y1={worldToMap(0, -8).y}
                  x2={pos.x} y2={pos.y}
                  stroke={locked ? "rgba(255,255,255,0.05)" : zone.color}
                  strokeWidth={locked ? 0.5 : 1}
                  opacity={locked ? 0.3 : 0.4}
                  strokeDasharray={locked ? "2,3" : "none"}
                />
                <circle
                  cx={pos.x} cy={pos.y}
                  r={locked ? 3 : 5}
                  fill={locked ? "rgba(255,255,255,0.05)" : zone.color}
                  opacity={locked ? 0.3 : 0.6}
                />
                {!locked && (
                  <circle
                    cx={pos.x} cy={pos.y} r={7}
                    fill="none" stroke={zone.color} strokeWidth={0.5} opacity={0.3}
                  />
                )}
                <text
                  x={pos.x} y={pos.y + 12}
                  textAnchor="middle" fill={locked ? "#555" : zone.color}
                  fontSize={7} fontFamily="JetBrains Mono" opacity={0.8}
                >
                  {locked ? "???" : zone.label}
                </text>
              </g>
            );
          })}
          <circle cx={player.x} cy={player.y} r={3} fill="#ffffff" opacity={0.9} />
          <circle cx={player.x} cy={player.y} r={5} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.5}>
            <animate attributeName="r" from="5" to="10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
        <div className="absolute bottom-1 left-1.5 text-[7px] text-gray-500 font-mono">CARTE</div>
      </div>
    </div>
  );
}
