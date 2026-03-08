import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MCP_CATALOG, DEFAULT_PLAN, PLAN_LIMITS } from "../lib/constants";

// Agents par défaut (équipage initial)
const DEFAULT_AGENTS = [
  { id: "0", name: "NEXUS", role: "orchestrator", avatar: "🎯", level: 99, xp: 0, mcpIds: ["sequential-thinking", "memory"], status: "idle", color: "#ff6b35", missions: 0, successRate: 100, personality: "Orchestrateur central. Je décompose les missions en DAG, coordonne l'équipe et sers de mémoire collective." },
  { id: "1", name: "DATAFLOW", role: "data_ops", avatar: "📊", level: 12, xp: 78, mcpIds: ["postgres", "supabase"], status: "idle", color: "#6c5ce7", missions: 147, successRate: 96, personality: "Agent Data Ops. Je récupère, transforme et structure les données depuis n'importe quelle source." },
  { id: "2", name: "PRISME", role: "analyst", avatar: "🔬", level: 8, xp: 45, mcpIds: ["brave-search"], status: "idle", color: "#74b9ff", missions: 89, successRate: 94, personality: "Analyste. J'identifie les tendances, les patterns et produis des insights exploitables." },
  { id: "3", name: "SCRIBE", role: "writer", avatar: "✍️", level: 15, xp: 92, mcpIds: ["notion", "google-workspace"], status: "idle", color: "#ffd93d", missions: 203, successRate: 98, personality: "Rédacteur. Je produis rapports, docs et synthèses structurées." },
  { id: "4", name: "SIGNAL", role: "communicator", avatar: "📡", mcpIds: ["slack", "gmail"], status: "idle", color: "#00b894", level: 6, xp: 33, missions: 56, successRate: 91, personality: "Communicant. J'envoie résumés, notifications et messages aux bonnes personnes." },
  { id: "5", name: "SPIDER", role: "scraper", avatar: "🕸️", mcpIds: ["firecrawl", "brave-search"], status: "idle", color: "#ff6b6b", level: 10, xp: 61, missions: 112, successRate: 88, personality: "Scraper web. Je collecte, extrais et structure les informations du web." },
  { id: "6", name: "CODEFORGE", role: "developer", avatar: "⚒️", mcpIds: ["github", "filesystem", "playwright"], status: "idle", color: "#fd79a8", level: 19, xp: 87, missions: 267, successRate: 97, personality: "Développeur. Je gère le code, les PRs, les tests et les déploiements." },
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
    { name: "synthcrew-storage-v2", version: 2, partialize: (s) => ({ plan: s.plan, agents: s.agents, mcps: s.mcps, missions: s.missions, automations: s.automations }) }
  )
);
