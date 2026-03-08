/**
 * Mission runner — sends missions to the server for real execution.
 * Falls back to client-side simulation if the server is unreachable.
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
  const parts = prompt.split(/[,;.]/).map((s) => s.trim()).filter((s) => s.length > 3);
  if (parts.length <= 1) {
    return [{ id: "t1", label: parts[0] || prompt.slice(0, 60), agent_role: inferRoleFromPrompt(prompt), depends_on: [] }];
  }
  return parts.slice(0, 6).map((label, i) => ({
    id: `t${i + 1}`,
    label: label.slice(0, 80),
    agent_role: inferRoleFromPrompt(label),
    depends_on: i === 0 ? [] : [`t${i}`],
  }));
}

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
      agentId: agent?.id,
      agentName: agent?.name,
      status: "queued",
    };
  });
  const connections = tasksWithAgent.slice(1).map((t, i) => ({ from: tasksWithAgent[i].id, to: t.id }));
  return {
    title: prompt.slice(0, 80),
    tasks: tasksWithAgent,
    connections,
  };
}

/**
 * Send mission to server for real execution.
 * Returns the queued mission. Results stream via WebSocket.
 */
export async function executeMissionOnServer(prompt, title) {
  const res = await fetch("/api/mission/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, title }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

/**
 * Fallback client-side execution (simulation).
 */
export async function runMission(dag, { appendLog, setAgentStatus, updateCurrentDagTask }) {
  for (let i = 0; i < dag.tasks.length; i++) {
    const task = dag.tasks[i];
    updateCurrentDagTask?.(task.id, "active");
    setAgentStatus?.(task.agentId, "active");
    appendLog({ agent: task.agentName, action: `Démarrage : ${task.label}...`, type: "thinking" });
    await sleep(600);
    appendLog({ agent: task.agentName, action: `[MCP] Exécution outil pour "${task.label}"`, type: "tool_call" });
    await sleep(600);
    appendLog({ agent: task.agentName, action: `Terminé : ${task.label} ✓`, type: "output" });
    updateCurrentDagTask?.(task.id, "done");
    setAgentStatus?.(task.agentId, "idle");
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
