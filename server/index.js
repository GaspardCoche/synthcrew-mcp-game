/**
 * SynthCrew Backend — Hono API + WebSocket
 * v3.0 — SQLite backend + living agents
 * Port 3001 by default.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getRequestListener } from "@hono/node-server";
import { readFileSync, existsSync, statSync } from "node:fs";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
const execAsync = promisify(_exec);
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ─── DB layer ─────────────────────────────────────────────────────────────────
import {
  initDb,
  getAgents,
  getAgent,
  saveAgent,
  updateAgent,
  getMissions,
  getMission,
  saveMission,
  updateMissionStatus,
  cancelMission,
  addMissionEvent,
  getRecentEvents,
  getMissionEvents,
  getAgentThoughts,
  getUnlockedAchievements,
  unlockAchievement,
  getAutomations,
  saveAutomation,
  computeStats,
  setStat,
  getStat,
  getTimeline,
  getWorldStats,
} from "./lib/db.js";

// ─── Agent simulator ──────────────────────────────────────────────────────────
import {
  startSimulator,
  setAgentActive,
  setAgentIdle,
  streamActiveThoughts,
  emitErrorThought,
  emitResultThought,
  emitWorldEvent,
} from "./lib/agentSimulator.js";

// ─── Mission engine ────────────────────────────────────────────────────────────
import { executeTool, getConfiguredServices, getAvailableTools } from "./lib/tools.js";
import { cliTaskSchema } from "./lib/schemas.js";
import { executeMissionWithClaude, ANTHROPIC_API_KEY as CLAUDE_KEY } from "./lib/claudeEngine.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");
const SERVE_STATIC = existsSync(DIST_DIR);

// ─── Bootstrap DB ─────────────────────────────────────────────────────────────
initDb();
console.log("[SynthCrew] SQLite database initialised.");

// ─── Achievement definitions ──────────────────────────────────────────────────
const ACHIEVEMENTS_DEF = [
  { id: "first_mission",    name: "Première mission",       desc: "Lance ta première mission",                    icon: "🎯" },
  { id: "five_missions",    name: "En roue libre",          desc: "5 missions complétées",                        icon: "⚡" },
  { id: "ten_missions",     name: "Vétéran",                desc: "10 missions complétées",                       icon: "🏆" },
  { id: "streak_3",         name: "Série",                  desc: "3 jours d'affilée avec une mission",           icon: "🔥" },
  { id: "first_automation", name: "Automatisation",         desc: "Crée ta première mission récurrente",          icon: "🔄" },
  { id: "full_crew",        name: "Équipage au complet",    desc: "6 agents dans ton équipe",                     icon: "👥" },
  { id: "template_user",    name: "Template master",        desc: "Utilise un template de mission",               icon: "📋" },
];

function checkAndUnlockAchievements() {
  const stats = computeStats();
  const agents = getAgents();
  const automations = getAutomations();
  const unlocked = getUnlockedAchievements("default");
  const newlyUnlocked = [];

  const conditions = {
    first_mission:    () => stats.totalMissions >= 1,
    five_missions:    () => stats.totalMissions >= 5,
    ten_missions:     () => stats.totalMissions >= 10,
    streak_3:         () => stats.streak >= 3,
    first_automation: () => automations.length >= 1,
    full_crew:        () => agents.length >= 6,
    template_user:    () => !!getStat("usedTemplate"),
  };

  for (const def of ACHIEVEMENTS_DEF) {
    if (unlocked.includes(def.id)) continue;
    try {
      if (conditions[def.id]?.()) {
        unlockAchievement(def.id, "default");
        newlyUnlocked.push(def);
      }
    } catch (_) {}
  }
  return newlyUnlocked;
}

// ─── Mission templates ────────────────────────────────────────────────────────
const MISSION_TEMPLATES = [
  { id: "tpl_weekly_report",    name: "Rapport hebdo support",    prompt: "Analyse les 50 derniers tickets Zendesk, catégorise-les par urgence, crée un résumé et envoie-le sur Slack au canal #support-team.", steps: 4 },
  { id: "tpl_ticket_triage",    name: "Tri des tickets",          prompt: "Récupère les nouveaux tickets, analyse le sentiment, assigne une priorité et notifie l'équipe pour les urgents.", steps: 3 },
  { id: "tpl_email_digest",     name: "Résumé emails",            prompt: "Récupère mes emails non lus, trie par priorité, rédige un résumé et crée une todo list dans Notion.", steps: 4 },
  { id: "tpl_competitive_intel",name: "Veille concurrentielle",   prompt: "Recherche les dernières offres d'emploi des concurrents sur le web, analyse les tendances et crée un rapport Notion.", steps: 3 },
  { id: "tpl_pr_changelog",     name: "PR → Changelog",          prompt: "Quand une PR est mergée, extrais les changements, mets à jour le CHANGELOG et poste un résumé dans Slack.", steps: 3 },
];

// ─── Hono app ─────────────────────────────────────────────────────────────────
const app = new Hono();

const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3001", "http://127.0.0.1:3001"];

app.use("/*", cors({ origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true }));

// ─── WebSocket broadcast (declared early so routes can use it) ────────────────
const clients = new Set();
function broadcast(msg) {
  const raw = JSON.stringify(msg);
  clients.forEach((ws) => { try { ws.send(raw); } catch (_) {} });
}

// ══════════════════════════════════════════════════════════════════════════════
// REST ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ─── Agents ───────────────────────────────────────────────────────────────────
app.get("/api/agents", (c) => c.json(getAgents()));

app.get("/api/agents/:id", (c) => {
  const a = getAgent(c.req.param("id"));
  return a ? c.json(a) : c.json({ error: "Not found" }, 404);
});

app.post("/api/agents", async (c) => {
  const body = await c.req.json();
  const agent = {
    id: `a_${Date.now()}`,
    name: body.name || "AGENT",
    role: body.role || "analyst",
    avatar: body.avatar || "🤖",
    status: "idle",
    color: body.color || "#6c5ce7",
    level: body.level || 1,
    xp: body.xp || 0,
    missions: body.missions || 0,
    successRate: body.successRate || 95,
    mcpIds: body.mcpIds || [],
    personality: body.personality || "",
  };
  const saved = saveAgent(agent);
  broadcast({ type: "agents", payload: getAgents() });
  const newAchs = checkAndUnlockAchievements();
  for (const ach of newAchs) {
    broadcast({ type: "achievement", payload: ach });
    emitWorldEvent("achievement_unlocked", { achievement: ach });
  }
  return c.json(saved);
});

app.patch("/api/agents/:id", async (c) => {
  const id = c.req.param("id");
  const existing = getAgent(id);
  if (!existing) return c.json({ error: "Not found" }, 404);
  const body = await c.req.json();
  const updated = updateAgent(id, body);
  broadcast({ type: "agents", payload: getAgents() });
  return c.json(updated);
});

// ─── Missions ─────────────────────────────────────────────────────────────────
app.get("/api/missions", (c) => {
  const limit = Number(c.req.query("limit") || 100);
  const offset = Number(c.req.query("offset") || 0);
  return c.json(getMissions(limit, offset));
});

app.get("/api/missions/:id", (c) => {
  const mission = getMission(c.req.param("id"));
  if (!mission) return c.json({ error: "Not found" }, 404);
  const events = getMissionEvents(mission.id, 200);
  return c.json({ ...mission, events });
});

app.post("/api/missions", async (c) => {
  const body = await c.req.json();
  const autoRun = body.autoRun !== undefined ? body.autoRun : false;
  const mission = {
    id: `m_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: autoRun ? "pending" : "completed",
    title: body.title || body.prompt?.slice(0, 80) || "Sans titre",
    prompt: body.prompt || body.title || "",
    source: body.source || "api",
    templateId: body.templateId || null,
    agentIds: body.agentIds || [],
    results: [],
    tasks: [],
  };

  saveMission(mission);

  if (body.templateId) setStat("usedTemplate", true);

  const stats = computeStats();
  const newAchs = checkAndUnlockAchievements();

  broadcast({ type: "mission_log", payload: { event: "mission_created", mission } });
  broadcast({ type: "missions",    payload: getMissions() });
  broadcast({ type: "stats",       payload: stats });

  for (const ach of newAchs) {
    broadcast({ type: "achievement", payload: ach });
    emitWorldEvent("achievement_unlocked", { achievement: ach });
  }

  return c.json({
    mission,
    stats,
    achievement: newAchs.length > 0 ? newAchs[0] : undefined,
  });
});

app.post("/api/missions/:id/cancel", async (c) => {
  const cancelled = cancelMission(c.req.param("id"));
  if (!cancelled) return c.json({ error: "Mission not found or already completed" }, 404);
  broadcast({ type: "missions", payload: getMissions() });
  broadcast({ type: "mission_log", payload: { event: "mission_cancelled", mission: cancelled } });
  return c.json(cancelled);
});

// ─── Events, thoughts, timeline ───────────────────────────────────────────────
app.get("/api/events", (c) => {
  const limit = Number(c.req.query("limit") || 100);
  return c.json(getRecentEvents(limit));
});

app.get("/api/thoughts", (c) => {
  const limit  = Number(c.req.query("limit") || 50);
  const agent  = c.req.query("agent") || null;
  return c.json(getAgentThoughts(agent, limit));
});

app.get("/api/timeline", (c) => {
  const limit = Number(c.req.query("limit") || 50);
  return c.json(getTimeline(limit));
});

app.get("/api/world-stats", (c) => c.json(getWorldStats()));

// ─── Automations ──────────────────────────────────────────────────────────────
app.get("/api/automations", (c) => c.json(getAutomations()));
app.post("/api/automations", async (c) => {
  const body = await c.req.json();
  const automation = {
    id: `cron_${Date.now()}`,
    enabled: true,
    ...body,
  };
  saveAutomation(automation);
  const newAchs = checkAndUnlockAchievements();
  for (const ach of newAchs) {
    broadcast({ type: "achievement", payload: ach });
  }
  return c.json(automation);
});

// ─── Stats & achievements ─────────────────────────────────────────────────────
app.get("/api/stats", (c) => {
  const stats = computeStats();
  return c.json(stats);
});

app.get("/api/achievements", (c) => c.json(getUnlockedAchievements("default")));
app.get("/api/achievements/definitions", (c) => c.json(ACHIEVEMENTS_DEF));
app.get("/api/mission-templates", (c) => c.json(MISSION_TEMPLATES));

app.get("/api/health", (c) => c.json({
  ok: true,
  version: "3.0-sqlite",
  static: SERVE_STATIC,
  db: "better-sqlite3",
}));

// ─── Real mission execution ───────────────────────────────────────────────────
app.post("/api/mission/execute", async (c) => {
  try {
    const { prompt, title } = await c.req.json();
    if (!prompt) return c.json({ error: "Le prompt est requis" }, 400);

    const mission = {
      id: `m_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      title: title || prompt.slice(0, 80),
      prompt,
      source: "api",
      agentIds: [],
      results: [],
      tasks: [],
    };

    saveMission(mission);
    broadcast({ type: "missions",    payload: getMissions() });
    broadcast({ type: "mission_log", payload: { event: "mission_queued", mission } });

    const engine = CLAUDE_KEY ? "claude" : "mock";
    return c.json({
      ok: true,
      engine,
      message: engine === "claude"
        ? `Mission "${mission.title}" en file — exécution Claude en cours. Suivez la progression en temps réel via WebSocket.`
        : `Mission "${mission.title}" en file — exécution simulée (ajoutez ANTHROPIC_API_KEY pour Claude).`,
      mission: { id: mission.id, title: mission.title, status: "pending" },
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── Services info ────────────────────────────────────────────────────────────
app.get("/api/services", (c) => c.json({ services: getConfiguredServices(), tools: getAvailableTools() }));

// ─── CLI exec — safe read-only commands ──────────────────────────────────────
const SAFE_CMD_PREFIXES = ["echo", "node", "npm", "ls", "cat", "head", "tail", "wc", "env", "pwd", "whoami", "date", "uptime", "du", "df"];
function isCommandSafe(cmd) {
  const base = cmd.trim().split(/\s+/)[0];
  return SAFE_CMD_PREFIXES.includes(base);
}

app.post("/api/cli/exec", async (c) => {
  try {
    const { command } = await c.req.json();
    if (!command) return c.json({ error: "Commande requise" }, 400);
    if (!isCommandSafe(command)) {
      return c.json({ error: `Commande non autorisée : "${command.split(" ")[0]}"` }, 403);
    }
    const { stdout, stderr } = await execAsync(command, { timeout: 5000, cwd: __dirname });
    return c.json({ output: stdout || stderr || "(aucune sortie)" });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── CLI task (Claude Code / Cursor) ─────────────────────────────────────────
app.post("/api/cli/task", async (c) => {
  try {
    const raw = await c.req.json();
    const parsed = cliTaskSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: "Validation échouée", details: parsed.error.flatten() }, 400);
    }
    const { prompt, title, source, autoRun, templateId } = parsed.data;

    const mission = {
      id: `m_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: autoRun ? "pending" : "completed",
      title: title || prompt.slice(0, 80),
      prompt,
      source,
      templateId: templateId || null,
      agentIds: [],
      results: [],
      tasks: [],
    };

    saveMission(mission);
    if (templateId) setStat("usedTemplate", true);

    const stats = computeStats();
    const newAchs = checkAndUnlockAchievements();

    broadcast({ type: "missions", payload: getMissions() });
    if (autoRun) {
      broadcast({ type: "mission_log", payload: { event: "mission_queued", mission, source } });
    } else {
      broadcast({ type: "stats",       payload: stats });
    }

    for (const ach of newAchs) {
      broadcast({ type: "achievement", payload: ach });
    }

    return c.json({
      ok: true,
      mission: { id: mission.id, title: mission.title, status: mission.status },
      message: autoRun ? "Mission en file, exécution autonome en cours." : "Mission enregistrée.",
    });
  } catch (e) {
    return c.json({ error: e.message || "Erreur serveur" }, 500);
  }
});

// ─── SPA static (production) ──────────────────────────────────────────────────
const MIMES = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".ico":  "image/x-icon",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".woff2":"font/woff2",
};

function staticHeaders(path, ext) {
  const isHtml = ext === ".html" || path === "/" || path === "";
  const isHashedAsset = path.startsWith("/assets/");
  const headers = { "Content-Type": MIMES[ext] || "application/octet-stream" };
  if (isHtml) headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  else if (isHashedAsset) headers["Cache-Control"] = "public, max-age=31536000, immutable";
  else headers["Cache-Control"] = "public, max-age=3600";
  return headers;
}

app.get("*", (c) => {
  const p = c.req.path;
  if (p.startsWith("/api") || p.startsWith("/ws")) return c.notFound();
  if (!SERVE_STATIC) return c.json({ error: "Frontend not built. Run: npm run build" }, 404);
  const path = p === "" || p === "/" ? "/index.html" : p;
  const filePath = join(DIST_DIR, path.startsWith("/") ? path.slice(1) : path);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = path.slice(path.lastIndexOf(".")) || ".html";
    return new Response(readFileSync(filePath), { headers: staticHeaders(path, ext) });
  }
  return new Response(readFileSync(join(DIST_DIR, "index.html")), {
    headers: staticHeaders("/index.html", ".html"),
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// HTTP + WebSocket server
// ══════════════════════════════════════════════════════════════════════════════

const requestListener = getRequestListener(app.fetch, { hostname: "localhost" });
const server = createServer(requestListener);

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  clients.add(ws);

  // Send full initial state
  const stats = computeStats();
  ws.send(JSON.stringify({ type: "agents",       payload: getAgents() }));
  ws.send(JSON.stringify({ type: "missions",     payload: getMissions() }));
  ws.send(JSON.stringify({ type: "stats",        payload: stats }));
  ws.send(JSON.stringify({ type: "achievements", payload: getUnlockedAchievements("default") }));
  ws.send(JSON.stringify({ type: "thoughts",     payload: getAgentThoughts(null, 20) }));

  ws.on("close", () => clients.delete(ws));
});

// ══════════════════════════════════════════════════════════════════════════════
// Mission worker — runs pending missions from the queue
// ══════════════════════════════════════════════════════════════════════════════

const ROLE_TOOL_MAP = {
  data_ops:     ["github.list_issues", "github.list_prs", "web.fetch", "github.get_file"],
  analyst:      ["analysis.summarize", "analysis.categorize", "web.search"],
  writer:       ["file.write_report", "notion.create_page", "analysis.summarize"],
  communicator: ["slack.post_message", "email.draft"],
  scraper:      ["web.search", "web.fetch"],
  developer:    ["github.list_issues", "github.list_prs", "github.create_issue", "github.get_file", "github.list_repos"],
  orchestrator: ["analysis.summarize"],
};

const ROLE_KEYWORDS = {
  data_ops:     ["tickets", "zendesk", "fetch", "récupérer", "données", "data", "csv", "export", "récupère"],
  analyst:      ["analyser", "analyse", "catégoriser", "tendances", "sentiment", "metrics", "comprendre"],
  writer:       ["rapport", "notion", "document", "rédiger", "créer page", "résumé", "synthèse", "brief"],
  communicator: ["slack", "email", "notifier", "envoyer", "gmail", "notification", "message"],
  scraper:      ["scraper", "web", "recherche", "google", "linkedin", "brave", "veille", "crawl"],
  developer:    ["github", "pr", "code", "repo", "commit", "jira", "linear", "deploy", "review"],
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
  const prevData = previousResults.filter((r) => r?.success).map((r) => r.data);
  switch (toolName) {
    case "github.list_issues":
    case "github.list_prs":
    case "github.list_repos": {
      const m = label.match(/(\w[\w-]*)\/([\w.-]+)/);
      return m ? { owner: m[1], repo: m[2] } : { owner: "GaspardCoche", repo: "synthcrew-mcp-game" };
    }
    case "github.get_file": {
      const m = label.match(/(\w[\w-]*)\/([\w.-]+)/);
      return { owner: m?.[1] || "GaspardCoche", repo: m?.[2] || "synthcrew-mcp-game", path: "README.md" };
    }
    case "github.create_issue":
      return { owner: "GaspardCoche", repo: "synthcrew-mcp-game", title: label.slice(0, 80), body: `Mission SynthCrew : ${label}` };
    case "web.search":
      return { query: label, count: 5 };
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
    return { id: `t${i + 1}`, label: label.slice(0, 80), agent_role: role, agentId: agent?.id, agentName: agent?.name || "AGENT", tools, status: "queued" };
  });
}

function ts() {
  return new Date().toLocaleTimeString("fr-FR", { hour12: false });
}

async function runMission(mission) {
  const missionId = mission.id;
  const agents = getAgents();

  // Prevent double-running
  const fresh = getMission(missionId);
  if (!fresh || fresh.status !== "pending") return;

  updateMissionStatus(missionId, "running", { startedAt: new Date().toISOString() });
  const tasks = buildTasksFromPrompt(mission.prompt || mission.title || "", agents);

  updateMissionStatus(missionId, "running", {
    startedAt: new Date().toISOString(),
    tasks,
  });

  broadcast({ type: "mission_log", payload: { event: "mission_started", mission: getMission(missionId) } });
  broadcast({ type: "missions",    payload: getMissions() });

  // Mission progress broadcast
  broadcast({
    type: "mission_progress",
    payload: { missionId, percentage: 0, message: "Mission started", totalTasks: tasks.length },
  });

  const previousResults = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const agent = agents.find((a) => a.id === task.agentId);

    // Mark agent active
    if (agent) {
      updateAgent(agent.id, { status: "active" });
      setAgentActive(agent.name);
      broadcast({ type: "agents", payload: getAgents() });
      broadcast({
        type: "agent_move",
        payload: { agentName: agent.name, state: "active", zone: "Mission Zone", timestamp: new Date().toISOString() },
      });
    }

    task.status = "active";

    // Log step start
    addMissionEvent(missionId, task.agentName, "step_start", `Démarrage : ${task.label}`, { task });
    broadcast({
      type: "mission_log",
      payload: { event: "step", missionId, task, log: { time: ts(), agent: task.agentName, action: `Démarrage : ${task.label}`, type: "thinking" } },
    });

    // Start streaming active thoughts for this agent
    const stopThoughts = streamActiveThoughts(
      task.agentName,
      task.agent_role,
      missionId,
      tasks.length,
      null
    );

    // Execute tools
    const toolResults = [];
    for (const toolName of task.tools || []) {
      addMissionEvent(missionId, task.agentName, "tool_call", `[MCP] ${toolName}`, { toolName });
      broadcast({
        type: "mission_log",
        payload: { event: "tool_call", missionId, task, log: { time: ts(), agent: task.agentName, action: `[MCP] ${toolName}`, type: "tool_call" } },
      });

      const params = extractParamsFromContext(toolName, task.label, previousResults);
      const result = await executeTool(toolName, params);
      toolResults.push(result);

      const resultPreview = result.success
        ? JSON.stringify(result.data).slice(0, 200)
        : `Erreur : ${result.error}`;

      addMissionEvent(
        missionId,
        task.agentName,
        result.success ? "tool_result" : "tool_error",
        result.success ? `${toolName} → ${resultPreview}` : `${toolName} → ${result.error}`,
        { toolName, success: result.success, data: result.data }
      );

      if (!result.success) {
        emitErrorThought(task.agentName, missionId);
      } else {
        emitResultThought(task.agentName, resultPreview, missionId);
      }

      broadcast({
        type: "mission_log",
        payload: {
          event: "tool_result",
          missionId,
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

    // Stop streaming thoughts for this task
    stopThoughts();

    previousResults.push(...toolResults.filter((r) => r.success));
    task.status = "done";
    task.results = toolResults;

    // Mark agent idle again
    if (agent) {
      updateAgent(agent.id, {
        status: "idle",
        missions: (agent.missions || 0) + 1,
        successRate: Math.min(100, (agent.successRate || 90) + 1),
      });
      setAgentIdle(agent.name);
    }

    const pct = Math.round(((i + 1) / tasks.length) * 100);
    addMissionEvent(missionId, task.agentName, "step_done", `Terminé : ${task.label}`, { task });
    broadcast({
      type: "mission_log",
      payload: { event: "step_done", missionId, task, log: { time: ts(), agent: task.agentName, action: `Terminé : ${task.label} ✓`, type: "output" } },
    });
    broadcast({
      type: "mission_progress",
      payload: { missionId, percentage: pct, message: `Étape ${i + 1}/${tasks.length} complete`, totalTasks: tasks.length, completedTasks: i + 1 },
    });
    broadcast({ type: "agents", payload: getAgents() });
    broadcast({ type: "missions", payload: getMissions() });
  }

  // Complete mission
  updateMissionStatus(missionId, "completed", {
    completedAt: new Date().toISOString(),
    results: previousResults.map((r) => r.data),
    tasks,
  });

  const stats = computeStats();
  const newAchs = checkAndUnlockAchievements();

  addMissionEvent(missionId, "NEXUS", "mission_completed", `Mission completed: ${mission.title}`, {});
  broadcast({ type: "mission_log",  payload: { event: "mission_completed", mission: getMission(missionId) } });
  broadcast({ type: "missions",     payload: getMissions() });
  broadcast({ type: "stats",        payload: stats });
  broadcast({ type: "mission_progress", payload: { missionId, percentage: 100, message: "Mission complete!" } });

  for (const ach of newAchs) {
    broadcast({ type: "achievement", payload: ach });
    emitWorldEvent("achievement_unlocked", { achievement: ach });
  }

  emitWorldEvent("mission_completed", { missionId, title: mission.title });
}

// Mission worker — polls every 3 seconds for pending missions
const WORKER_INTERVAL_MS = 3000;
let _workerRunning = false;

setInterval(async () => {
  if (_workerRunning) return;
  const pending = getMissions(10).find((m) => m.status === "pending");
  if (!pending) return;
  _workerRunning = true;
  try {
    const useClaude = !!CLAUDE_KEY;
    if (useClaude) {
      updateMissionStatus(pending.id, "running", { startedAt: new Date().toISOString() });
      broadcast({ type: "mission_log", payload: { event: "mission_started", mission: getMission(pending.id) } });
      await executeMissionWithClaude(
        pending.prompt || pending.title,
        pending.id,
        broadcast,
        (agentName, status) => {
          const agent = getAgents().find((a) => a.name === agentName);
          if (agent) {
            updateAgent(agent.id, { status });
            if (status === "active") setAgentActive(agentName);
            else setAgentIdle(agentName);
            broadcast({ type: "agents", payload: getAgents() });
          }
        },
        (result) => {
          updateMissionStatus(pending.id, result.success ? "completed" : "failed", {
            completedAt: new Date().toISOString(),
            summary: result.summary || result.error,
          });
          broadcast({ type: "missions", payload: getMissions() });
          broadcast({ type: "stats", payload: computeStats() });
          const newAchs = checkAndUnlockAchievements();
          for (const ach of newAchs) {
            broadcast({ type: "achievement", payload: ach });
            emitWorldEvent("achievement_unlocked", { achievement: ach });
          }
        }
      );
    } else {
      await runMission(pending);
    }
  } catch (err) {
    console.error("[SynthCrew] Mission worker error:", err);
    try {
      const m = getMission(pending.id);
      if (m && m.status === "running") {
        updateMissionStatus(pending.id, "failed", { completedAt: new Date().toISOString() });
        broadcast({ type: "missions", payload: getMissions() });
      }
    } catch (_) {}
  } finally {
    _workerRunning = false;
  }
}, WORKER_INTERVAL_MS);

// ─── Start agent simulator ────────────────────────────────────────────────────
startSimulator(broadcast);

// ─── Start HTTP server ────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SynthCrew API http://localhost:${PORT} | WS ws://localhost:${PORT}/ws`);
  console.log(`[SynthCrew] Backend v3.0 — SQLite + living agents active.`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[SynthCrew] Le port ${PORT} est déjà utilisé.`);
    console.error("  → Arrête l'autre processus ou lance avec :");
    console.error(`     PORT=${PORT + 1} npm start`);
    process.exit(1);
  }
  throw err;
});
