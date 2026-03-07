/**
 * Moteur d'exécution autonome des missions côté serveur.
 * Traite les missions en statut "pending", simule les étapes (agents, log),
 * met à jour les données et broadcast via WebSocket.
 */
const STEP_DELAY_MS = 600;

function inferRoleFromPrompt(prompt) {
  const lower = (prompt || "").toLowerCase();
  const roles = [
    ["data_ops", ["tickets", "zendesk", "fetch", "données", "data", "csv"]],
    ["analyst", ["analyser", "catégoriser", "tendances", "sentiment", "rapport", "metrics"]],
    ["writer", ["rapport", "notion", "document", "rédiger", "résumé"]],
    ["communicator", ["slack", "email", "notifier", "envoyer", "gmail"]],
    ["scraper", ["web", "recherche", "brave", "scraper"]],
    ["developer", ["github", "pr", "code", "repo", "commit"]],
  ];
  for (const [role, keywords] of roles) {
    if (keywords.some((k) => lower.includes(k))) return role;
  }
  return "analyst";
}

function buildTasksFromPrompt(prompt, agents) {
  const parts = prompt.split(/[,.]/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (parts.length === 0) parts.push(prompt.slice(0, 60) || "Mission");
  const byRole = (role) => agents.find((a) => a.role === role && a.role !== "orchestrator") || agents.find((a) => a.role !== "orchestrator");
  return parts.map((label, i) => {
    const role = inferRoleFromPrompt(label);
    const agent = byRole(role) || agents[0];
    return {
      id: `t${i + 1}`,
      label: label.slice(0, 50),
      agent_role: role,
      agentId: agent?.id,
      agentName: agent?.name || "AGENT",
      status: "queued",
      x: 20 + (i % 2) * 40,
      y: 25 + Math.floor(i / 2) * 30,
    };
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Exécute une mission côté serveur : met à jour data, saveData, broadcast.
 * @param {Object} mission - mission avec id, title, prompt, status
 * @param {Object} data - objet data partagé (agents, missions, stats)
 * @param {Function} saveData - () => void
 * @param {Function} broadcast - (msg) => void
 */
export async function runMissionOnServer(mission, data, saveData, broadcast) {
  const missions = data.missions || [];
  const idx = missions.findIndex((m) => m.id === mission.id);
  if (idx < 0 || missions[idx].status !== "pending") return;

  const agents = data.agents || [];
  missions[idx].status = "running";
  missions[idx].startedAt = new Date().toISOString();
  const prompt = mission.prompt || mission.title || "";
  const tasks = mission.tasks || buildTasksFromPrompt(prompt, agents);
  missions[idx].tasks = tasks;
  missions[idx].connections = tasks.slice(1).map((_, i) => ({ from: tasks[i].id, to: tasks[i + 1].id }));
  saveData(data);
  broadcast({ type: "mission_log", payload: { event: "mission_started", mission: missions[idx] } });
  broadcast({ type: "missions", payload: data.missions });
  broadcast({ type: "agents", payload: data.agents });

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const agent = agents.find((a) => a.id === task.agentId);
    if (agent) {
      const agentIdx = data.agents.findIndex((a) => a.id === agent.id);
      if (agentIdx >= 0) {
        data.agents[agentIdx].status = "active";
        saveData(data);
        broadcast({ type: "agents", payload: data.agents });
      }
    }

    const logEntry = {
      time: new Date().toLocaleTimeString("fr-FR", { hour12: false }),
      agent: task.agentName,
      action: `[Auto] ${task.label}...`,
      type: "thinking",
    };
    broadcast({ type: "mission_log", payload: { event: "step", missionId: mission.id, task, log: logEntry } });

    await sleep(STEP_DELAY_MS);

    const logDone = {
      ...logEntry,
      action: `Terminé : ${task.label} ✓`,
      type: "output",
    };
    broadcast({ type: "mission_log", payload: { event: "step_done", missionId: mission.id, task, log: logDone } });

    tasks[i].status = "done";
    if (agent) {
      const agentIdx = data.agents.findIndex((a) => a.id === task.agentId);
      if (agentIdx >= 0) {
        data.agents[agentIdx].status = "idle";
        const a = data.agents[agentIdx];
        a.missions = (a.missions || 0) + 1;
        a.successRate = Math.min(100, (a.successRate || 90) + 1);
      }
    }
    saveData(data);
    broadcast({ type: "agents", payload: data.agents });
    broadcast({ type: "missions", payload: data.missions });
  }

  missions[idx].status = "completed";
  missions[idx].completedAt = new Date().toISOString();
  if (data.stats) {
    data.stats.totalMissions = (data.stats.totalMissions || 0) + 1;
    data.stats.xp = Math.min(9999, (data.stats.xp || 0) + 100);
    data.stats.level = Math.floor((data.stats.xp || 0) / 200) + 1;
  }
  saveData(data);
  broadcast({ type: "mission_log", payload: { event: "mission_completed", mission: missions[idx] } });
  broadcast({ type: "missions", payload: data.missions });
  broadcast({ type: "stats", payload: data.stats });
}

/**
 * Traite la prochaine mission en attente dans la file.
 * @returns {Promise<boolean>} true si une mission a été traitée
 */
export async function processNextPendingMission(data, saveData, broadcast) {
  const pending = (data.missions || []).find((m) => m.status === "pending");
  if (!pending) return false;
  await runMissionOnServer(pending, data, saveData, broadcast);
  return true;
}
