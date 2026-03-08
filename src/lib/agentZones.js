/**
 * Foyers et zones de patrouille des agents — chaque PNJ a sa zone dédiée (style GTA).
 * Évite l'empilement : 1 position par agent, répartie sur la carte.
 */
import { getTerrainHeightAt } from "../scenes/Terrain";

export const AGENT_ZONES = {
  CONDUCTOR: { x: 0,    z: -8,   patrolRadius: 6   },
  SENTINEL:  { x: -35,  z: -26,  patrolRadius: 7   },
  CIPHER:    { x: 30,   z: -34,  patrolRadius: 6   },
  ARCHIVIST: { x: -28,  z: -50,  patrolRadius: 6   },
  HERALD:    { x: 42,   z: -18,  patrolRadius: 6   },
  PHANTOM:   { x: 18,   z: -56,  patrolRadius: 5   },
  FORGE:     { x: -15,  z: -62,  patrolRadius: 6   },
};

const FALLBACK_ZONES = Object.values(AGENT_ZONES);

/** Retourne [x, y, z] world pour l'agent (sur le terrain). indexInSameZone = décalage si plusieurs agents même zone. */
export function getAgentHome(agentName, indexInSameZone = 0) {
  const zone = AGENT_ZONES[agentName] || FALLBACK_ZONES[indexInSameZone % FALLBACK_ZONES.length];
  const offset = indexInSameZone > 0 ? { x: (indexInSameZone % 3) * 2 - 2, z: Math.floor(indexInSameZone / 3) * 2 } : { x: 0, z: 0 };
  const x = zone.x + offset.x;
  const z = zone.z + offset.z;
  const y = getTerrainHeightAt(x, z) + 0.15;
  return [x, y, z];
}

export function getAgentPatrolRadius(agentName) {
  const zone = AGENT_ZONES[agentName];
  return zone ? zone.patrolRadius : 4;
}
