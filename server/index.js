/**
 * SynthCrew Backend — Hono API + WebSocket
 * Port 3001 par défaut.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getRequestListener } from "@hono/node-server";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { processNextPendingMission } from "./lib/missionEngine.js";
import { cliTaskSchema } from "./lib/schemas.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data.json");
const DIST_DIR = join(__dirname, "..", "dist");
const SERVE_STATIC = existsSync(DIST_DIR);

function loadData() {
  if (!existsSync(DATA_FILE)) return { agents: [], missions: [], automations: [], stats: {}, achievements: [], missionTemplates: [] };
  try {
    const d = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    d.stats = d.stats || { totalMissions: 0, streak: 0, lastMissionDate: null, xp: 0, level: 1 };
    d.achievements = d.achievements || [];
    d.missionTemplates = d.missionTemplates || getDefaultMissionTemplates();
    (d.missions || []).forEach((m) => { if (!m.status) m.status = "completed"; });
    return d;
  } catch {
    return { agents: [], missions: [], automations: [], stats: { totalMissions: 0, streak: 0, lastMissionDate: null, xp: 0, level: 1 }, achievements: [], missionTemplates: [] };
  }
}

function getDefaultMissionTemplates() {
  return [
    { id: "tpl_weekly_report", name: "Rapport hebdo support", prompt: "Analyse les 50 derniers tickets Zendesk, catégorise-les par urgence, crée un résumé et envoie-le sur Slack au canal #support-team.", steps: 4 },
    { id: "tpl_ticket_triage", name: "Tri des tickets", prompt: "Récupère les nouveaux tickets, analyse le sentiment, assigne une priorité et notifie l'équipe pour les urgents.", steps: 3 },
    { id: "tpl_email_digest", name: "Résumé emails", prompt: "Récupère mes emails non lus, trie par priorité, rédige un résumé et crée une todo list dans Notion.", steps: 4 },
    { id: "tpl_competitive_intel", name: "Veille concurrentielle", prompt: "Recherche les dernières offres d'emploi des concurrents sur le web, analyse les tendances et crée un rapport Notion.", steps: 3 },
    { id: "tpl_pr_changelog", name: "PR → Changelog", prompt: "Quand une PR est mergée, extrais les changements, mets à jour le CHANGELOG et poste un résumé dans Slack.", steps: 3 },
  ];
}

function saveData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const data = loadData();

if (!data.agents || data.agents.length === 0 || data.agents.some((a) => a.name === "CONDUCTOR")) {
  data.agents = [
    { id: "a_0", name: "NEXUS", role: "orchestrator", avatar: "🎯", status: "idle", color: "#ff6b35", level: 99, missions: 0, successRate: 100, mcpIds: ["sequential-thinking", "memory"], personality: "Orchestrateur central. Je décompose les missions en DAG, coordonne l'équipe et sers de mémoire collective." },
    { id: "a_1", name: "DATAFLOW", role: "data_ops", avatar: "📊", status: "idle", color: "#6c5ce7", level: 12, missions: 0, successRate: 96, mcpIds: ["github", "postgres", "filesystem"], personality: "Data Ops. Je récupère et structure les données depuis toutes les sources." },
    { id: "a_2", name: "PRISME", role: "analyst", avatar: "🔬", status: "idle", color: "#74b9ff", level: 8, missions: 0, successRate: 94, mcpIds: ["sequential-thinking", "brave-search"], personality: "Analyste. J'identifie tendances, patterns et insights dans les données." },
    { id: "a_3", name: "SCRIBE", role: "writer", avatar: "✍️", status: "idle", color: "#ffd93d", level: 15, missions: 0, successRate: 98, mcpIds: ["notion", "google-workspace", "filesystem"], personality: "Rédacteur. Je produis rapports, docs et synthèses structurées." },
    { id: "a_4", name: "SIGNAL", role: "communicator", avatar: "📡", status: "idle", color: "#00b894", level: 6, missions: 0, successRate: 91, mcpIds: ["slack", "gmail"], personality: "Communicant. J'envoie résumés et notifications sur tous les canaux." },
    { id: "a_5", name: "SPIDER", role: "scraper", avatar: "🕸️", status: "idle", color: "#ff6b6b", level: 10, missions: 0, successRate: 88, mcpIds: ["brave-search", "firecrawl", "playwright"], personality: "Scraper. Je collecte des infos sur le web et fais de la veille." },
    { id: "a_6", name: "CODEFORGE", role: "developer", avatar: "⚒️", status: "idle", color: "#fd79a8", level: 19, missions: 0, successRate: 97, mcpIds: ["github", "docker", "sentry"], personality: "Développeur. Je gère le code, les PRs, les revues et les déploiements." },
  ];
  saveData(data);
} else if (!data.agents.some((a) => a.role === "orchestrator")) {
  data.agents.unshift({ id: "a_0", name: "NEXUS", role: "orchestrator", avatar: "🎯", status: "idle", color: "#ff6b35", level: 99, missions: 0, successRate: 100, mcpIds: ["sequential-thinking", "memory"], personality: "Orchestrateur central. Je décompose les missions en DAG et coordonne l'équipe." });
  saveData(data);
}
if (!data.missionTemplates || data.missionTemplates.length === 0) {
  data.missionTemplates = getDefaultMissionTemplates();
  saveData(data);
}

const ACHIEVEMENTS_DEF = [
  { id: "first_mission", name: "Première mission", desc: "Lance ta première mission", condition: (s) => (s.totalMissions || 0) >= 1, icon: "🎯" },
  { id: "five_missions", name: "En roue libre", desc: "5 missions complétées", condition: (s) => (s.totalMissions || 0) >= 5, icon: "⚡" },
  { id: "ten_missions", name: "Vétéran", desc: "10 missions complétées", condition: (s) => (s.totalMissions || 0) >= 10, icon: "🏆" },
  { id: "streak_3", name: "Série", desc: "3 jours d'affilée avec une mission", condition: (s) => (s.streak || 0) >= 3, icon: "🔥" },
  { id: "first_automation", name: "Automatisation", desc: "Crée ta première mission récurrente", condition: (d) => (d.automations || []).length >= 1, icon: "🔄" },
  { id: "full_crew", name: "Équipage au complet", desc: "6 agents dans ton équipe", condition: (d) => (d.agents || []).length >= 6, icon: "👥" },
  { id: "template_user", name: "Template master", desc: "Utilise un template de mission", condition: (s) => !!s.usedTemplate, icon: "📋" },
];

function computeStats() {
  data.stats = data.stats || { totalMissions: 0, streak: 0, lastMissionDate: null, xp: 0, level: 1 };
  const missions = data.missions || [];
  data.stats.totalMissions = missions.length;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  const dates = [...new Set(missions.map((m) => (m.createdAt || "").slice(0, 10)))].sort().reverse();
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    const prev = i > 0 ? new Date(dates[i - 1]) : null;
    if (i === 0 && dates[0] !== today) break;
    if (prev && (d - prev) / (1000 * 60 * 60 * 24) > 1) break;
    streak++;
  }
  data.stats.streak = streak;
  data.stats.lastMissionDate = dates[0] || null;
  data.stats.xp = Math.min(100 * data.stats.totalMissions, 9999);
  data.stats.level = Math.floor(data.stats.xp / 200) + 1;
}

function checkAchievements() {
  computeStats();
  const unlocked = data.achievements || [];
  const stats = data.stats || {};
  for (const a of ACHIEVEMENTS_DEF) {
    if (unlocked.includes(a.id)) continue;
    const ok = a.condition(a.id === "full_crew" || a.id === "first_automation" ? data : stats);
    if (ok) {
      data.achievements = data.achievements || [];
      data.achievements.push(a.id);
      saveData(data);
      return { unlocked: a };
    }
  }
  return { unlocked: null };
}

const app = new Hono();

const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3001", "http://127.0.0.1:3001"];

app.use("/*", cors({ origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true }));

// ——— REST ———
app.get("/api/agents", (c) => c.json(data.agents));
app.get("/api/agents/:id", (c) => {
  const a = data.agents.find((x) => x.id === c.req.param("id"));
  return a ? c.json(a) : c.json({ error: "Not found" }, 404);
});
app.post("/api/agents", async (c) => {
  const body = await c.req.json();
  const agent = { id: `a_${Date.now()}`, ...body, status: "idle" };
  data.agents.push(agent);
  saveData(data);
  broadcast({ type: "agents", payload: data.agents });
  return c.json(agent);
});
app.patch("/api/agents/:id", async (c) => {
  const i = data.agents.findIndex((x) => x.id === c.req.param("id"));
  if (i < 0) return c.json({ error: "Not found" }, 404);
  const body = await c.req.json();
  data.agents[i] = { ...data.agents[i], ...body };
  saveData(data);
  broadcast({ type: "agents", payload: data.agents });
  return c.json(data.agents[i]);
});

app.get("/api/missions", (c) => c.json(data.missions || []));
app.post("/api/missions", async (c) => {
  const body = await c.req.json();
  const status = body.autoRun ? "pending" : "completed";
  const mission = {
    id: `m_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status,
    title: body.title || body.prompt?.slice(0, 80) || "Sans titre",
    prompt: body.prompt || body.title,
    templateId: body.templateId,
    ...body,
  };
  (data.missions = data.missions || []).unshift(mission);
  if (data.missions.length > 500) data.missions.pop();
  saveData(data);
  if (!body.autoRun) {
    if (body.templateId) (data.stats = data.stats || {}).usedTemplate = true;
    computeStats();
    const { unlocked } = checkAchievements();
    broadcast({ type: "mission_log", payload: { event: "mission_created", mission } });
    broadcast({ type: "stats", payload: data.stats });
    if (unlocked) broadcast({ type: "achievement", payload: unlocked });
  }
  broadcast({ type: "missions", payload: data.missions });
  return c.json({ mission, stats: data.stats, achievement: body.autoRun ? undefined : checkAchievements().unlocked || undefined });
});

app.get("/api/automations", (c) => c.json(data.automations || []));
app.post("/api/automations", async (c) => {
  const body = await c.req.json();
  const a = { id: `cron_${Date.now()}`, enabled: true, ...body };
  (data.automations = data.automations || []).push(a);
  saveData(data);
  return c.json(a);
});

if (!data.stats || data.stats.totalMissions === undefined) computeStats();

app.get("/api/stats", (c) => {
  computeStats();
  return c.json(data.stats || {});
});
app.get("/api/achievements", (c) => c.json(data.achievements || []));
app.get("/api/achievements/definitions", (c) => c.json(ACHIEVEMENTS_DEF));
app.get("/api/mission-templates", (c) => c.json(data.missionTemplates || []));

app.get("/api/health", (c) => c.json({ ok: true, version: "2.0", static: SERVE_STATIC }));

// Real mission execution
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
    };
    (data.missions = data.missions || []).unshift(mission);
    if (data.missions.length > 500) data.missions.pop();
    saveData(data);
    broadcast({ type: "missions", payload: data.missions });
    broadcast({ type: "mission_log", payload: { event: "mission_queued", mission } });
    return c.json({ ok: true, mission: { id: mission.id, title: mission.title, status: "pending" } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// Service configuration status
import { getConfiguredServices, getAvailableTools } from "./lib/tools.js";
app.get("/api/services", (c) => c.json({ services: getConfiguredServices(), tools: getAvailableTools() }));

// API CLI (Claude Code CLI / Cursor)
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
      templateId,
    };
    (data.missions = data.missions || []).unshift(mission);
    if (data.missions.length > 500) data.missions.pop();
    saveData(data);
    broadcast({ type: "missions", payload: data.missions });
    if (autoRun) {
      broadcast({ type: "mission_log", payload: { event: "mission_queued", mission, source } });
    } else {
      computeStats();
      const { unlocked } = checkAchievements();
      if (unlocked) broadcast({ type: "achievement", payload: unlocked });
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

// SPA static (production: serve frontend from same server)
const MIMES = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".ico": "image/x-icon", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
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
    return new Response(readFileSync(filePath), {
      headers: staticHeaders(path, ext),
    });
  }
  return new Response(readFileSync(join(DIST_DIR, "index.html")), {
    headers: staticHeaders("/index.html", ".html"),
  });
});

// ——— WebSocket ———
const clients = new Set();
function broadcast(msg) {
  const raw = JSON.stringify(msg);
  clients.forEach((ws) => { try { ws.send(raw); } catch (_) {} });
}

const requestListener = getRequestListener(app.fetch, { hostname: "localhost" });
const server = createServer(requestListener);

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  clients.add(ws);
  computeStats();
  ws.send(JSON.stringify({ type: "agents", payload: data.agents }));
  ws.send(JSON.stringify({ type: "missions", payload: data.missions || [] }));
  ws.send(JSON.stringify({ type: "stats", payload: data.stats }));
  ws.send(JSON.stringify({ type: "achievements", payload: data.achievements || [] }));
  ws.on("close", () => clients.delete(ws));
});

// Worker autonome : traite les missions en attente (toutes les 3s)
const WORKER_INTERVAL_MS = 3000;
setInterval(() => {
  processNextPendingMission(data, saveData, broadcast).catch((err) => {
    console.error("[SynthCrew] Mission worker error:", err);
  });
}, WORKER_INTERVAL_MS);

const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SynthCrew API http://localhost:${PORT} | WS ws://localhost:${PORT}/ws`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[SynthCrew] Le port ${PORT} est déjà utilisé.`);
    console.error("  → Arrête l'autre processus (ex: un autre npm start ou dev:server), ou lance avec :");
    console.error(`     PORT=${PORT + 1} npm start`);
    process.exit(1);
  }
  throw err;
});
