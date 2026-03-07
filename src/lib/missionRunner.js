/**
 * Mission Planner simulé : décompose une requête en DAG de tâches et associe les agents.
 * En production, ce serait un appel Claude API avec un system prompt structuré.
 */
import { useStore } from "../store/useStore";

const ROLE_KEYWORDS = {
  data_ops: ["tickets", "zendesk", "fetch", "récupérer", "données", "data", "csv", "export"],
  analyst: ["analyser", "analyse", "catégoriser", "tendances", "sentiment", "rapport", "metrics"],
  writer: ["rapport", "notion", "document", "rédiger", "créer page", "résumé écrit"],
  communicator: ["slack", "email", "notifier", "envoyer", "équipe", "gmail", "notification"],
  scraper: ["scraper", "web", "recherche", "google", "linkedin", "brave"],
  developer: ["github", "pr", "code", "repo", "commit", "jira", "linear"],
};

function inferRoleFromPrompt(prompt) {
  const lower = prompt.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return role;
  }
  return "analyst";
}

function simpleDecompose(prompt) {
  // Découpage heuristique : 1 à 3 tâches selon les verbes / virgules
  const parts = prompt.split(/[,.]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return [{ id: "t1", label: parts[0] || prompt.slice(0, 60), agent_role: inferRoleFromPrompt(prompt), depends_on: [] }];
  }
  const tasks = parts.slice(0, 4).map((label, i) => ({
    id: `t${i + 1}`,
    label: label.slice(0, 50),
    agent_role: inferRoleFromPrompt(label),
    depends_on: i === 0 ? [] : [`t${i}`],
  }));
  return tasks;
}

/**
 * Génère un DAG (tasks + connections) et associe un agent du store à chaque tâche.
 * Si suggestedRoles est fourni (mémoire orchestrateur), on privilégie ces rôles pour l’assignation.
 */
export function planMission(prompt, opts = {}) {
  const { suggestedRoles = [] } = opts;
  const tasks = simpleDecompose(prompt);
  const agents = useStore.getState().agents;
  const tasksWithAgent = tasks.map((t) => {
    const preferRole = suggestedRoles.length ? suggestedRoles[tasks.indexOf(t) % suggestedRoles.length] : null;
    const byRole = (role) => agents.find((a) => a.role === role && a.status !== "active") || agents.find((a) => a.role === role);
    const agent =
      (preferRole && byRole(preferRole)) ||
      byRole(t.agent_role) ||
      agents.find((a) => a.role !== "orchestrator" && a.status !== "active") ||
      agents.find((a) => a.role !== "orchestrator") ||
      agents[0];
    return {
      ...t,
      agentId: agent.id,
      agentName: agent.name,
      status: "queued",
      x: 20 + (tasks.indexOf(t) % 2) * 40,
      y: 25 + Math.floor(tasks.indexOf(t) / 2) * 30,
    };
  });
  const connections = tasksWithAgent.slice(1).map((t, i) => ({ from: tasksWithAgent[i].id, to: t.id }));
  return {
    title: prompt.slice(0, 80),
    tasks: tasksWithAgent,
    connections,
  };
}

const DELAY_MS = 800;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Exécute le DAG en séquence, met à jour les statuts et le log.
 */
export async function runMission(dag, { appendLog, setAgentStatus, updateCurrentDagTask }) {
  for (let i = 0; i < dag.tasks.length; i++) {
    const task = dag.tasks[i];
    updateCurrentDagTask?.(task.id, "active");
    setAgentStatus?.(task.agentId, "active");

    appendLog({ agent: task.agentName, action: `Démarrage : ${task.label}...`, type: "thinking" });
    await sleep(DELAY_MS);
    appendLog({ agent: task.agentName, action: `[MCP] Exécution outil pour "${task.label}"`, type: "tool_call" });
    await sleep(DELAY_MS);
    appendLog({ agent: task.agentName, action: `Terminé : ${task.label} ✓`, type: "output" });

    updateCurrentDagTask?.(task.id, "done");
    setAgentStatus?.(task.agentId, "idle");
  }
}
