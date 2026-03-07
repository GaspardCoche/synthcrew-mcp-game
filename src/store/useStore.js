import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MCP_CATALOG, DEFAULT_PLAN, PLAN_LIMITS } from "../lib/constants";

// Agents par défaut (équipage initial)
const DEFAULT_AGENTS = [
  { id: "0", name: "CONDUCTOR", role: "orchestrator", avatar: "🎯", level: 99, xp: 0, mcpIds: [], status: "idle", color: "#eab308", missions: 0, successRate: 100, personality: "Orchestrateur. Je comprends ton besoin, je questionne pour proposer l'équipe adaptée et je sers de mémoire aux autres agents." },
  { id: "1", name: "SENTINEL", role: "data_ops", avatar: "🛡️", level: 12, xp: 78, mcpIds: ["zendesk"], status: "idle", color: "#00f0ff", missions: 147, successRate: 96, personality: "Tu es un agent Data Ops. Tu récupères et structures les données de façon fiable." },
  { id: "2", name: "CIPHER", role: "analyst", avatar: "🔮", level: 8, xp: 45, mcpIds: ["postgres"], status: "idle", color: "#a855f7", missions: 89, successRate: 94, personality: "Tu es un analyste. Tu identifies des tendances et des patterns dans les données." },
  { id: "3", name: "ARCHIVIST", role: "writer", avatar: "📜", level: 15, xp: 92, mcpIds: ["notion"], status: "idle", color: "#f59e0b", missions: 203, successRate: 98, personality: "Tu es un rédacteur. Tu produis des rapports et de la doc claire." },
  { id: "4", name: "HERALD", role: "communicator", avatar: "📡", mcpIds: ["slack", "gmail"], status: "idle", color: "#22c55e", level: 6, xp: 33, missions: 56, successRate: 91, personality: "Tu es un communicant. Tu envoies des résumés et notifications aux équipes." },
  { id: "5", name: "PHANTOM", role: "scraper", avatar: "👻", mcpIds: ["brave-search"], status: "idle", color: "#ef4444", level: 10, xp: 61, missions: 112, successRate: 88, personality: "Tu es un scraper. Tu collectes des infos sur le web." },
  { id: "6", name: "FORGE", role: "developer", avatar: "⚒️", mcpIds: ["github", "filesystem"], status: "idle", color: "#ec4899", level: 19, xp: 87, missions: 267, successRate: 97, personality: "Tu es un développeur. Tu exécutes des tâches code et revues." },
];

const defaultMissionLog = [];
const defaultMissions = [];
const defaultAutomations = [];

export const useStore = create(
  persist(
    (set, get) => ({
      // Plan actuel (monétisation)
      plan: DEFAULT_PLAN,

      // Agents
      agents: DEFAULT_AGENTS,
      setAgents: (agents) => set({ agents: agents || [] }),
      setMissions: (missions) => set({ missions: missions || [] }),
      addAgent: (agent) => set((s) => ({ agents: [...s.agents, { ...agent, id: String(Date.now()) }] })),
      updateAgent: (id, patch) =>
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      setAgentStatus: (id, status) =>
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)) })),
      removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

      // Mémoire orchestrateur (brief → équipe recommandée)
      orchestratorMemory: {},
      suggestedTeamRoleIds: [],
      setOrchestratorMemory: (mem) => set({ orchestratorMemory: mem || {} }),
      setSuggestedTeamRoleIds: (roleIds) => set({ suggestedTeamRoleIds: roleIds || [] }),

      // MCPs (connectés = ceux que l'utilisateur a activés)
      mcps: MCP_CATALOG,
      toggleMcp: (id) =>
        set((s) => ({
          mcps: s.mcps.map((m) => (m.id === id ? { ...m, connected: !m.connected } : m)),
        })),

      // Missions (historique)
      missions: defaultMissions,
      addMission: (mission) =>
        set((s) => ({
          missions: [{ ...mission, id: `m_${Date.now()}`, createdAt: new Date().toISOString() }, ...s.missions].slice(0, 200),
        })),

      // Log en direct (pour la mission en cours)
      missionLog: defaultMissionLog,
      appendLog: (entry) => set((s) => ({ missionLog: [...s.missionLog, { ...entry, time: new Date().toLocaleTimeString("fr-FR", { hour12: false }) }] })),
      clearLog: () => set({ missionLog: [] }),

      // DAG de la mission en cours
      currentMissionDag: null,
      setCurrentMissionDag: (dag) => set({ currentMissionDag: dag }),
      updateCurrentDagTask: (taskId, status) =>
        set((s) => {
          if (!s.currentMissionDag) return s;
          return {
            currentMissionDag: {
              ...s.currentMissionDag,
              tasks: s.currentMissionDag.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
            },
          };
        }),

      // Automations (cron missions)
      automations: defaultAutomations,
      addAutomation: (a) =>
        set((s) => ({
          automations: [...s.automations, { ...a, id: `cron_${Date.now()}`, enabled: true }],
        })),
      toggleAutomation: (id) =>
        set((s) => ({
          automations: s.automations.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)),
        })),
      removeAutomation: (id) => set((s) => ({ automations: s.automations.filter((x) => x.id !== id) })),

      // Helpers
      getPlanLimit: (key) => PLAN_LIMITS[get().plan]?.[key] ?? PLAN_LIMITS.explorer[key],
      canAddAgent: () => get().agents.length < get().getPlanLimit("agents"),
    }),
    { name: "synthcrew-storage", partialize: (s) => ({ plan: s.plan, agents: s.agents, mcps: s.mcps, missions: s.missions, automations: s.automations }) }
  )
);
