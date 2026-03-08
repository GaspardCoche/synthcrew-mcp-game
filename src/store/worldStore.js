/**
 * État du monde virtuel SynthCrew — reflet des missions réelles.
 * - Progression village : bâtiments débloqués au fil des missions.
 * - Santé agents : dégradée par les erreurs, restaurée par les succès.
 * - Indicateurs : erreurs récentes pour ambiance (orage, zones endommagées).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const ZONE_IDS = ["hub", "data", "analysis", "archive", "comms", "phantom", "forge"];
const AGENT_ZONE_MAP = {
  CONDUCTOR: "hub",
  SENTINEL: "data",
  CIPHER: "analysis",
  ARCHIVIST: "archive",
  HERALD: "comms",
  PHANTOM: "phantom",
  FORGE: "forge",
};

const MISSIONS_TO_UNLOCK = {
  hub: 0,
  data: 2,
  analysis: 5,
  archive: 8,
  comms: 12,
  phantom: 15,
  forge: 20,
};

const INITIAL_HEALTH = 1;
const HEALTH_DECAY_ON_ERROR = 0.25;
const HEALTH_RECOVER_ON_SUCCESS = 0.12;
const SICKNESS_DECAY_PER_MINUTE = 0.02;

export const useWorldStore = create(
  persist(
    (set, get) => ({
      totalMissionsCompleted: 0,
      totalMissionsFailed: 0,
      zoneLevels: Object.fromEntries(ZONE_IDS.map((z) => [z, z === "hub" ? 2 : 0])),
      zoneDamage: Object.fromEntries(ZONE_IDS.map((z) => [z, 0])),
      agentHealth: {},
      agentLastErrorAt: {},
      recentErrorsCount: 0,
      lastErrorAt: null,
      lastWorldUpdateAt: null,

      missionCompleted: (payload = {}) => {
        const agentName = payload.agentName || payload.agent;
        set((s) => {
          const total = s.totalMissionsCompleted + 1;
          const nextLevels = { ...s.zoneLevels };
          for (const [zone, required] of Object.entries(MISSIONS_TO_UNLOCK)) {
            if (required > 0 && total >= required && (nextLevels[zone] ?? 0) < 2) {
              nextLevels[zone] = 2;
            }
          }
          const health = { ...s.agentHealth };
          if (agentName) {
            const current = health[agentName] ?? INITIAL_HEALTH;
            health[agentName] = Math.min(1, current + HEALTH_RECOVER_ON_SUCCESS);
          }
          return {
            totalMissionsCompleted: total,
            zoneLevels: nextLevels,
            agentHealth: health,
            recentErrorsCount: Math.max(0, s.recentErrorsCount - 1),
            lastWorldUpdateAt: Date.now(),
          };
        });
      },

      missionFailed: (payload = {}) => {
        const agentName = payload.agentName || payload.agent;
        set((s) => {
          const health = { ...s.agentHealth };
          const lastError = { ...s.agentLastErrorAt };
          const damage = { ...s.zoneDamage };
          if (agentName) {
            const current = health[agentName] ?? INITIAL_HEALTH;
            health[agentName] = Math.max(0, current - HEALTH_DECAY_ON_ERROR);
            lastError[agentName] = Date.now();
            const zone = AGENT_ZONE_MAP[agentName];
            if (zone) damage[zone] = Math.min(1, (damage[zone] || 0) + 0.2);
          }
          return {
            totalMissionsFailed: s.totalMissionsFailed + 1,
            agentHealth: health,
            agentLastErrorAt: lastError,
            zoneDamage: damage,
            recentErrorsCount: s.recentErrorsCount + 1,
            lastErrorAt: Date.now(),
            lastWorldUpdateAt: Date.now(),
          };
        });
      },

      agentStatusChange: (agentName, status) => {
        if (status === "error") get().missionFailed({ agentName });
      },

      tickRecovery: () => {
        set((s) => {
          const health = { ...s.agentHealth };
          const decay = SICKNESS_DECAY_PER_MINUTE / 60;
          for (const name of Object.keys(health)) {
            if (health[name] < INITIAL_HEALTH) {
              health[name] = Math.min(INITIAL_HEALTH, (health[name] ?? 0) + decay * 0.5);
            }
          }
          const damage = { ...s.zoneDamage };
          for (const zone of ZONE_IDS) {
            if (damage[zone] > 0) damage[zone] = Math.max(0, damage[zone] - decay * 0.3);
          }
          return { agentHealth: health, zoneDamage: damage };
        });
      },

      getZoneLevel: (zoneId) => get().zoneLevels[zoneId] ?? 0,
      getZoneDamage: (zoneId) => get().zoneDamage[zoneId] ?? 0,
      getAgentHealth: (agentName) => get().agentHealth[agentName] ?? INITIAL_HEALTH,
      isAgentSick: (agentName) => {
        const h = get().agentHealth[agentName] ?? INITIAL_HEALTH;
        const lastErr = get().agentLastErrorAt[agentName];
        return h < 0.7 || (lastErr && Date.now() - lastErr < 120000);
      },

      hydrateFromStats: (stats) => {
        const total = stats?.totalMissions ?? 0;
        set((s) => {
          if (total <= s.totalMissionsCompleted) {
            return { ...s, lastWorldUpdateAt: s.lastWorldUpdateAt ?? Date.now() };
          }
          const nextLevels = { ...s.zoneLevels };
          for (const [zone, required] of Object.entries(MISSIONS_TO_UNLOCK)) {
            if (required > 0 && total >= required && (nextLevels[zone] ?? 0) < 2) {
              nextLevels[zone] = 2;
            }
          }
          return { totalMissionsCompleted: total, zoneLevels: nextLevels, lastWorldUpdateAt: Date.now() };
        });
      },
    }),
    { name: "synthcrew-world", partialize: (s) => ({
      totalMissionsCompleted: s.totalMissionsCompleted,
      totalMissionsFailed: s.totalMissionsFailed,
      zoneLevels: s.zoneLevels,
      zoneDamage: s.zoneDamage,
      agentHealth: s.agentHealth,
    }) }
  )
);
