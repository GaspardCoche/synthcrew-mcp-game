/**
 * Real mission execution engine.
 * Decomposes prompts into tasks, executes real tools, streams results via WebSocket.
 */
import { executeTool, getConfiguredServices, ANTHROPIC_API_KEY } from "./tools.js";

const ROLE_TOOL_MAP = {
  data_ops: ["github.list_issues", "github.list_prs", "web.fetch", "github.get_file"],
  analyst: ["analysis.summarize", "analysis.categorize", "web.search"],
  writer: ["file.write_report", "notion.create_page", "analysis.summarize"],
  communicator: ["slack.post_message", "email.draft"],
  scraper: ["web.search", "web.fetch"],
  developer: ["github.list_issues", "github.list_prs", "github.create_issue", "github.get_file", "github.list_repos"],
  orchestrator: ["analysis.summarize"],
};

const ROLE_KEYWORDS = {
  data_ops: ["tickets", "zendesk", "fetch", "récupérer", "données", "data", "csv", "export", "récupère"],
  analyst: ["analyser", "analyse", "catégoriser", "tendances", "sentiment", "metrics", "comprendre"],
  writer: ["rapport", "notion", "document", "rédiger", "créer page", "résumé", "synthèse", "brief"],
  communicator: ["slack", "email", "notifier", "envoyer", "gmail", "notification", "message"],
  scraper: ["scraper", "web", "recherche", "google", "linkedin", "brave", "veille", "crawl"],
  developer: ["github", "pr", "code", "repo", "commit", "jira", "linear", "deploy", "review"],
};

function inferRoleFromText(text) {
  const lower = (text || "").toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return role;
  }
  return "analyst";
}

function inferToolsForTask(label, role) {
  const lower = (label || "").toLowerCase();
  const roleTools = ROLE_TOOL_MAP[role] || [];

  if (lower.includes("github") || lower.includes("pr") || lower.includes("issue") || lower.includes("repo")) {
    if (lower.includes("créer") || lower.includes("create")) return ["github.create_issue"];
    if (lower.includes("pr") || lower.includes("pull")) return ["github.list_prs"];
    if (lower.includes("fichier") || lower.includes("file") || lower.includes("code")) return ["github.get_file"];
    if (lower.includes("repo")) return ["github.list_repos"];
    return ["github.list_issues"];
  }
  if (lower.includes("cherch") || lower.includes("search") || lower.includes("veille") || lower.includes("web")) return ["web.search"];
  if (lower.includes("scrape") || lower.includes("récupèr") || lower.includes("fetch") || lower.includes("page")) return ["web.fetch"];
  if (lower.includes("slack") || lower.includes("notif") || lower.includes("message")) return ["slack.post_message"];
  if (lower.includes("email") || lower.includes("gmail") || lower.includes("mail")) return ["email.draft"];
  if (lower.includes("notion") || lower.includes("page")) return ["notion.create_page"];
  if (lower.includes("rapport") || lower.includes("brief") || lower.includes("synthèse") || lower.includes("résumé")) return ["file.write_report"];
  if (lower.includes("catégor") || lower.includes("trier") || lower.includes("class")) return ["analysis.categorize"];
  if (lower.includes("analy") || lower.includes("résumer") || lower.includes("comprendre")) return ["analysis.summarize"];

  return roleTools.slice(0, 2);
}

function extractParamsFromContext(toolName, label, previousResults = []) {
  const lower = (label || "").toLowerCase();
  const prevData = previousResults.filter((r) => r?.success).map((r) => r.data);

  switch (toolName) {
    case "github.list_issues":
    case "github.list_prs":
    case "github.list_repos": {
      const repoMatch = label.match(/(\w[\w-]*)\/([\w.-]+)/);
      if (repoMatch) return { owner: repoMatch[1], repo: repoMatch[2] };
      return { owner: "GaspardCoche", repo: "synthcrew-mcp-game" };
    }
    case "github.get_file": {
      const repoMatch = label.match(/(\w[\w-]*)\/([\w.-]+)/);
      return { owner: repoMatch?.[1] || "GaspardCoche", repo: repoMatch?.[2] || "synthcrew-mcp-game", path: "README.md" };
    }
    case "github.create_issue": {
      return { owner: "GaspardCoche", repo: "synthcrew-mcp-game", title: label.slice(0, 80), body: `Mission SynthCrew : ${label}` };
    }
    case "web.search": {
      return { query: label, count: 5 };
    }
    case "web.fetch": {
      const urlMatch = label.match(/https?:\/\/[^\s]+/);
      return { url: urlMatch?.[0] || `https://www.google.com/search?q=${encodeURIComponent(label)}` };
    }
    case "slack.post_message": {
      const summary = prevData.length > 0 ? JSON.stringify(prevData[prevData.length - 1]).slice(0, 200) : label;
      return { channel: "#general", text: `[SynthCrew] ${summary}` };
    }
    case "email.draft": {
      const summary = prevData.length > 0 ? JSON.stringify(prevData[prevData.length - 1]).slice(0, 500) : label;
      return { to: "team@example.com", subject: `[SynthCrew] ${label.slice(0, 60)}`, body: summary };
    }
    case "notion.create_page": {
      const content = prevData.length > 0 ? JSON.stringify(prevData[prevData.length - 1], null, 2).slice(0, 2000) : label;
      return { title: label.slice(0, 80), content };
    }
    case "file.write_report": {
      const sections = prevData.map((d, i) => ({
        title: `Étape ${i + 1}`,
        content: typeof d === "string" ? d : JSON.stringify(d, null, 2).slice(0, 1000),
      }));
      if (sections.length === 0) sections.push({ title: "Résultat", content: label });
      return { title: label.slice(0, 80), sections };
    }
    case "analysis.summarize": {
      const text = prevData.length > 0 ? JSON.stringify(prevData[prevData.length - 1]).slice(0, 4000) : label;
      return { text };
    }
    case "analysis.categorize": {
      const items = prevData.length > 0 && Array.isArray(prevData[prevData.length - 1])
        ? prevData[prevData.length - 1].slice(0, 20)
        : [label];
      return { items };
    }
    default:
      return {};
  }
}

function buildTasksFromPrompt(prompt, agents) {
  const parts = prompt.split(/[,;.]/).map((s) => s.trim()).filter((s) => s.length > 3).slice(0, 6);
  if (parts.length === 0) parts.push(prompt.slice(0, 60) || "Mission");

  const byRole = (role) => agents.find((a) => a.role === role && a.role !== "orchestrator") || agents.find((a) => a.role !== "orchestrator");

  return parts.map((label, i) => {
    const role = inferRoleFromText(label);
    const agent = byRole(role) || agents[0];
    const tools = inferToolsForTask(label, role);
    return {
      id: `t${i + 1}`,
      label: label.slice(0, 80),
      agent_role: role,
      agentId: agent?.id,
      agentName: agent?.name || "AGENT",
      tools,
      status: "queued",
    };
  });
}

async function aiDecompose(prompt, agents) {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const agentRoles = agents.map((a) => `${a.name} (${a.role})`).join(", ");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Tu es un Mission Planner. Décompose cette mission en 2-5 tâches concrètes.
Agents disponibles : ${agentRoles}
Mission : "${prompt}"

Réponds en JSON strict (pas de markdown) :
[{"label":"description courte","role":"data_ops|analyst|writer|communicator|scraper|developer","tools":["tool.name"]}]

Outils disponibles : github.list_issues, github.list_prs, github.create_issue, github.get_file, github.list_repos, web.search, web.fetch, slack.post_message, email.draft, notion.create_page, file.write_report, analysis.summarize, analysis.categorize`,
        }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const tasks = JSON.parse(jsonMatch[0]);
    const byRole = (role) => agents.find((a) => a.role === role) || agents[0];
    return tasks.map((t, i) => {
      const agent = byRole(t.role) || agents[0];
      return { id: `t${i + 1}`, label: t.label, agent_role: t.role, agentId: agent.id, agentName: agent.name, tools: t.tools || [], status: "queued" };
    });
  } catch {
    return null;
  }
}

export async function runMissionOnServer(mission, data, saveData, broadcast) {
  const missions = data.missions || [];
  const idx = missions.findIndex((m) => m.id === mission.id);
  if (idx < 0 || missions[idx].status !== "pending") return;

  const agents = data.agents || [];
  missions[idx].status = "running";
  missions[idx].startedAt = new Date().toISOString();
  const prompt = mission.prompt || mission.title || "";

  const aiTasks = await aiDecompose(prompt, agents);
  const tasks = aiTasks || buildTasksFromPrompt(prompt, agents);

  missions[idx].tasks = tasks;
  missions[idx].connections = tasks.slice(1).map((_, i) => ({ from: tasks[i].id, to: tasks[i + 1].id }));
  saveData(data);
  broadcast({ type: "mission_log", payload: { event: "mission_started", mission: missions[idx] } });
  broadcast({ type: "missions", payload: data.missions });

  const previousResults = [];

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

    task.status = "active";
    broadcast({
      type: "mission_log",
      payload: {
        event: "step",
        missionId: mission.id,
        task,
        log: { time: ts(), agent: task.agentName, action: `Démarrage : ${task.label}`, type: "thinking" },
      },
    });

    const toolResults = [];
    for (const toolName of task.tools || []) {
      broadcast({
        type: "mission_log",
        payload: {
          event: "tool_call",
          missionId: mission.id,
          task,
          log: { time: ts(), agent: task.agentName, action: `[MCP] ${toolName}`, type: "tool_call" },
        },
      });

      const params = extractParamsFromContext(toolName, task.label, previousResults);
      const result = await executeTool(toolName, params);
      toolResults.push(result);

      const resultPreview = result.success
        ? JSON.stringify(result.data).slice(0, 200)
        : `Erreur : ${result.error}`;

      broadcast({
        type: "mission_log",
        payload: {
          event: "tool_result",
          missionId: mission.id,
          task,
          log: {
            time: ts(),
            agent: task.agentName,
            action: result.success ? `✓ ${toolName} → ${resultPreview}` : `✗ ${toolName} → ${result.error}`,
            type: result.success ? "output" : "error",
            data: result.data,
          },
        },
      });
    }

    previousResults.push(...toolResults.filter((r) => r.success));

    task.status = "done";
    task.results = toolResults;

    if (agent) {
      const agentIdx = data.agents.findIndex((a) => a.id === task.agentId);
      if (agentIdx >= 0) {
        data.agents[agentIdx].status = "idle";
        data.agents[agentIdx].missions = (data.agents[agentIdx].missions || 0) + 1;
        data.agents[agentIdx].successRate = Math.min(100, (data.agents[agentIdx].successRate || 90) + 1);
      }
    }

    broadcast({
      type: "mission_log",
      payload: {
        event: "step_done",
        missionId: mission.id,
        task,
        log: { time: ts(), agent: task.agentName, action: `Terminé : ${task.label} ✓`, type: "output" },
      },
    });

    saveData(data);
    broadcast({ type: "agents", payload: data.agents });
    broadcast({ type: "missions", payload: data.missions });
  }

  missions[idx].status = "completed";
  missions[idx].completedAt = new Date().toISOString();
  missions[idx].results = previousResults.map((r) => r.data);

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

export async function processNextPendingMission(data, saveData, broadcast) {
  const pending = (data.missions || []).find((m) => m.status === "pending");
  if (!pending) return false;
  await runMissionOnServer(pending, data, saveData, broadcast);
  return true;
}

function ts() {
  return new Date().toLocaleTimeString("fr-FR", { hour12: false });
}
