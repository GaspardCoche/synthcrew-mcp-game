/**
 * Foyers et zones de patrouille des agents — chaque PNJ a sa zone dédiée (style GTA).
 * Évite l'empilement : 1 position par agent, répartie sur la carte avec offset déterministe.
 */
import { getTerrainHeightAt } from "../scenes/Terrain";

export const AGENT_ZONES = {
  NEXUS:     { x: 0,    z: -8,   patrolRadius: 6   },
  DATAFLOW:  { x: -35,  z: -26,  patrolRadius: 7   },
  PRISME:    { x: 30,   z: -34,  patrolRadius: 6   },
  SCRIBE:    { x: -28,  z: -50,  patrolRadius: 6   },
  SIGNAL:    { x: 42,   z: -18,  patrolRadius: 6   },
  SPIDER:    { x: 18,   z: -56,  patrolRadius: 5   },
  CODEFORGE: { x: -15,  z: -62,  patrolRadius: 6   },
};

const FALLBACK_ZONES = Object.values(AGENT_ZONES);

/** Hash simple pour offset déterministe par nom (évite empilement visuel). */
function nameHash(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
  return Math.abs(h);
}

/** Retourne [x, y, z] world pour l'agent (sur le terrain). indexInSameZone = décalage si plusieurs agents même zone. */
export function getAgentHome(agentName, indexInSameZone = 0) {
  const zone = AGENT_ZONES[agentName] || FALLBACK_ZONES[indexInSameZone % FALLBACK_ZONES.length];
  const h = nameHash(agentName || "agent") + indexInSameZone * 137;
  const angle = (h % 360) * (Math.PI / 180);
  const radius = indexInSameZone > 0 ? 2.5 : 1.8;
  const offset = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
  const x = zone.x + offset.x;
  const z = zone.z + offset.z;
  const y = getTerrainHeightAt(x, z) + 0.15;
  return [x, y, z];
}

export function getAgentPatrolRadius(agentName) {
  const zone = AGENT_ZONES[agentName];
  return zone ? zone.patrolRadius : 4;
}
