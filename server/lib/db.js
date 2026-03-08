/**
 * SynthCrew SQLite database layer.
 * Uses better-sqlite3 (synchronous) for all persistence.
 * DB stored at server/data/synthcrew.db
 */
import Database from "better-sqlite3";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "data", "synthcrew.db");
const DATA_JSON_PATH = join(__dirname, "..", "data.json");

let _db = null;

// ─── Schema ───────────────────────────────────────────────────────────────────

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agents (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'analyst',
  avatar      TEXT NOT NULL DEFAULT '🤖',
  status      TEXT NOT NULL DEFAULT 'idle',
  color       TEXT NOT NULL DEFAULT '#6c5ce7',
  level       INTEGER NOT NULL DEFAULT 1,
  xp          INTEGER NOT NULL DEFAULT 0,
  missions    INTEGER NOT NULL DEFAULT 0,
  successRate REAL NOT NULL DEFAULT 95,
  mcpIds      TEXT NOT NULL DEFAULT '[]',
  personality TEXT NOT NULL DEFAULT '',
  createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS missions (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  prompt      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending',
  source      TEXT NOT NULL DEFAULT 'api',
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  startedAt   TEXT,
  completedAt TEXT,
  agentIds    TEXT NOT NULL DEFAULT '[]',
  templateId  TEXT,
  results     TEXT NOT NULL DEFAULT '[]',
  tasks       TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS mission_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  missionId  TEXT NOT NULL,
  agentName  TEXT NOT NULL DEFAULT '',
  eventType  TEXT NOT NULL DEFAULT 'log',
  content    TEXT NOT NULL DEFAULT '',
  metadata   TEXT NOT NULL DEFAULT '{}',
  createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (missionId) REFERENCES missions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_thoughts (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  agentName TEXT NOT NULL,
  thought   TEXT NOT NULL,
  type      TEXT NOT NULL DEFAULT 'thinking',
  missionId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  userId        TEXT NOT NULL DEFAULT 'default',
  achievementId TEXT NOT NULL,
  unlockedAt    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(userId, achievementId)
);

CREATE TABLE IF NOT EXISTS automations (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  prompt    TEXT NOT NULL DEFAULT '',
  templateId TEXT,
  cron      TEXT,
  enabled   INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stats (
  key       TEXT PRIMARY KEY,
  value     TEXT NOT NULL DEFAULT '0',
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mission_events_missionId ON mission_events(missionId);
CREATE INDEX IF NOT EXISTS idx_mission_events_createdAt ON mission_events(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_agent_thoughts_agentName ON agent_thoughts(agentName);
CREATE INDEX IF NOT EXISTS idx_agent_thoughts_createdAt ON agent_thoughts(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_createdAt ON missions(createdAt DESC);
`;

// ─── Init & migration ──────────────────────────────────────────────────────────

export function initDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.exec(SCHEMA);

  // Migrate from data.json if agents table is empty
  const agentCount = _db.prepare("SELECT COUNT(*) as c FROM agents").get().c;
  if (agentCount === 0) {
    migrateFromJson(_db);
  }

  return _db;
}

export function getDb() {
  if (!_db) return initDb();
  return _db;
}

function migrateFromJson(db) {
  const defaultAgents = [
    { id: "a_0", name: "NEXUS", role: "orchestrator", avatar: "🎯", status: "idle", color: "#ff6b35", level: 99, xp: 9900, missions: 0, successRate: 100, mcpIds: ["sequential-thinking", "memory"], personality: "Orchestrateur central. Je décompose les missions en DAG, coordonne l'équipe et sers de mémoire collective." },
    { id: "a_1", name: "DATAFLOW", role: "data_ops", avatar: "📊", status: "idle", color: "#6c5ce7", level: 12, xp: 1200, missions: 0, successRate: 96, mcpIds: ["github", "postgres", "filesystem"], personality: "Data Ops. Je récupère et structure les données depuis toutes les sources." },
    { id: "a_2", name: "PRISME", role: "analyst", avatar: "🔬", status: "idle", color: "#74b9ff", level: 8, xp: 800, missions: 0, successRate: 94, mcpIds: ["sequential-thinking", "brave-search"], personality: "Analyste. J'identifie tendances, patterns et insights dans les données." },
    { id: "a_3", name: "SCRIBE", role: "writer", avatar: "✍️", status: "idle", color: "#ffd93d", level: 15, xp: 1500, missions: 0, successRate: 98, mcpIds: ["notion", "google-workspace", "filesystem"], personality: "Rédacteur. Je produis rapports, docs et synthèses structurées." },
    { id: "a_4", name: "SIGNAL", role: "communicator", avatar: "📡", status: "idle", color: "#00b894", level: 6, xp: 600, missions: 0, successRate: 91, mcpIds: ["slack", "gmail"], personality: "Communicant. J'envoie résumés et notifications sur tous les canaux." },
    { id: "a_5", name: "SPIDER", role: "scraper", avatar: "🕸️", status: "idle", color: "#ff6b6b", level: 10, xp: 1000, missions: 0, successRate: 88, mcpIds: ["brave-search", "firecrawl", "playwright"], personality: "Scraper. Je collecte des infos sur le web et fais de la veille." },
    { id: "a_6", name: "CODEFORGE", role: "developer", avatar: "⚒️", status: "idle", color: "#fd79a8", level: 19, xp: 1900, missions: 0, successRate: 97, mcpIds: ["github", "docker", "sentry"], personality: "Développeur. Je gère le code, les PRs, les revues et les déploiements." },
  ];

  let sourceAgents = defaultAgents;
  let sourceMissions = [];
  let sourceAchievements = [];
  let sourceAutomations = [];
  let sourceStats = { totalMissions: 0, streak: 0, xp: 0, level: 1 };

  // Try to read existing data.json
  if (existsSync(DATA_JSON_PATH)) {
    try {
      const json = JSON.parse(readFileSync(DATA_JSON_PATH, "utf8"));
      if (json.agents && json.agents.length > 0) {
        sourceAgents = json.agents;
      }
      if (json.missions && json.missions.length > 0) {
        sourceMissions = json.missions;
      }
      if (json.achievements) {
        sourceAchievements = json.achievements;
      }
      if (json.automations) {
        sourceAutomations = json.automations;
      }
      if (json.stats) {
        sourceStats = json.stats;
      }
    } catch (e) {
      console.warn("[DB] Could not parse data.json, using defaults:", e.message);
    }
  }

  const insertAgent = db.prepare(`
    INSERT OR REPLACE INTO agents (id, name, role, avatar, status, color, level, xp, missions, successRate, mcpIds, personality)
    VALUES (@id, @name, @role, @avatar, @status, @color, @level, @xp, @missions, @successRate, @mcpIds, @personality)
  `);

  const insertMany = db.transaction((agents) => {
    for (const a of agents) {
      insertAgent.run({
        id: a.id,
        name: a.name,
        role: a.role || "analyst",
        avatar: a.avatar || "🤖",
        status: "idle",
        color: a.color || "#6c5ce7",
        level: a.level || 1,
        xp: a.xp || (a.level || 1) * 100,
        missions: a.missions || 0,
        successRate: a.successRate || 95,
        mcpIds: JSON.stringify(a.mcpIds || []),
        personality: a.personality || "",
      });
    }
  });

  insertMany(sourceAgents);

  // Migrate missions
  if (sourceMissions.length > 0) {
    const insertMission = db.prepare(`
      INSERT OR IGNORE INTO missions (id, title, prompt, status, source, createdAt, startedAt, completedAt, agentIds, templateId, results)
      VALUES (@id, @title, @prompt, @status, @source, @createdAt, @startedAt, @completedAt, @agentIds, @templateId, @results)
    `);
    const insertMissions = db.transaction((missions) => {
      for (const m of missions) {
        insertMission.run({
          id: m.id,
          title: m.title || "Mission",
          prompt: m.prompt || m.title || "",
          status: m.status || "completed",
          source: m.source || "api",
          createdAt: m.createdAt || new Date().toISOString(),
          startedAt: m.startedAt || null,
          completedAt: m.completedAt || null,
          agentIds: JSON.stringify(m.agentIds || []),
          templateId: m.templateId || null,
          results: JSON.stringify(m.results || []),
        });
      }
    });
    insertMissions(sourceMissions);
  }

  // Migrate achievements
  if (sourceAchievements.length > 0) {
    const insertAch = db.prepare(`
      INSERT OR IGNORE INTO achievements (userId, achievementId) VALUES ('default', @achievementId)
    `);
    const insertAchs = db.transaction((achs) => {
      for (const id of achs) {
        if (typeof id === "string") insertAch.run({ achievementId: id });
      }
    });
    insertAchs(sourceAchievements);
  }

  // Migrate automations
  if (sourceAutomations.length > 0) {
    const insertAuto = db.prepare(`
      INSERT OR IGNORE INTO automations (id, name, prompt, templateId, cron, enabled)
      VALUES (@id, @name, @prompt, @templateId, @cron, @enabled)
    `);
    const insertAutos = db.transaction((autos) => {
      for (const a of autos) {
        insertAuto.run({
          id: a.id || `cron_${Date.now()}`,
          name: a.name || "Automation",
          prompt: a.prompt || "",
          templateId: a.templateId || null,
          cron: a.cron || null,
          enabled: a.enabled !== false ? 1 : 0,
        });
      }
    });
    insertAutos(sourceAutomations);
  }

  // Migrate stats
  const insertStat = db.prepare(`INSERT OR REPLACE INTO stats (key, value) VALUES (@key, @value)`);
  const insertStats = db.transaction((stats) => {
    for (const [key, value] of Object.entries(stats)) {
      insertStat.run({ key, value: JSON.stringify(value) });
    }
  });
  insertStats(sourceStats);

  console.log("[DB] Migration from data.json complete.");
}

// ─── Agent helpers ─────────────────────────────────────────────────────────────

export function getAgents() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM agents ORDER BY id ASC").all();
  return rows.map(deserializeAgent);
}

export function getAgent(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  return row ? deserializeAgent(row) : null;
}

export function saveAgent(agent) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO agents (id, name, role, avatar, status, color, level, xp, missions, successRate, mcpIds, personality)
    VALUES (@id, @name, @role, @avatar, @status, @color, @level, @xp, @missions, @successRate, @mcpIds, @personality)
  `).run({
    id: agent.id,
    name: agent.name,
    role: agent.role || "analyst",
    avatar: agent.avatar || "🤖",
    status: agent.status || "idle",
    color: agent.color || "#6c5ce7",
    level: agent.level || 1,
    xp: agent.xp || 0,
    missions: agent.missions || 0,
    successRate: agent.successRate || 95,
    mcpIds: JSON.stringify(agent.mcpIds || []),
    personality: agent.personality || "",
  });
  return getAgent(agent.id);
}

export function updateAgent(id, patch) {
  const existing = getAgent(id);
  if (!existing) return null;
  return saveAgent({ ...existing, ...patch });
}

export function updateAgentStatus(id, status) {
  const db = getDb();
  db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(status, id);
}

function deserializeAgent(row) {
  return {
    ...row,
    mcpIds: safeParseJson(row.mcpIds, []),
  };
}

// ─── Mission helpers ────────────────────────────────────────────────────────────

export function getMissions(limit = 100, offset = 0) {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM missions ORDER BY createdAt DESC LIMIT ? OFFSET ?").all(limit, offset);
  return rows.map(deserializeMission);
}

export function getMission(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM missions WHERE id = ?").get(id);
  return row ? deserializeMission(row) : null;
}

export function saveMission(mission) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO missions (id, title, prompt, status, source, createdAt, startedAt, completedAt, agentIds, templateId, results, tasks)
    VALUES (@id, @title, @prompt, @status, @source, @createdAt, @startedAt, @completedAt, @agentIds, @templateId, @results, @tasks)
  `).run({
    id: mission.id,
    title: mission.title || "Mission",
    prompt: mission.prompt || "",
    status: mission.status || "pending",
    source: mission.source || "api",
    createdAt: mission.createdAt || new Date().toISOString(),
    startedAt: mission.startedAt || null,
    completedAt: mission.completedAt || null,
    agentIds: JSON.stringify(mission.agentIds || []),
    templateId: mission.templateId || null,
    results: JSON.stringify(mission.results || []),
    tasks: JSON.stringify(mission.tasks || []),
  });
  return getMission(mission.id);
}

export function updateMissionStatus(id, status, extra = {}) {
  const db = getDb();
  const sets = ["status = @status"];
  const params = { id, status };

  if (extra.startedAt !== undefined) { sets.push("startedAt = @startedAt"); params.startedAt = extra.startedAt; }
  if (extra.completedAt !== undefined) { sets.push("completedAt = @completedAt"); params.completedAt = extra.completedAt; }
  if (extra.results !== undefined) { sets.push("results = @results"); params.results = JSON.stringify(extra.results); }
  if (extra.tasks !== undefined) { sets.push("tasks = @tasks"); params.tasks = JSON.stringify(extra.tasks); }

  db.prepare(`UPDATE missions SET ${sets.join(", ")} WHERE id = @id`).run(params);
}

export function cancelMission(id) {
  const db = getDb();
  const mission = getMission(id);
  if (!mission) return null;
  if (!["pending", "running"].includes(mission.status)) return mission;
  updateMissionStatus(id, "cancelled", { completedAt: new Date().toISOString() });
  return getMission(id);
}

function deserializeMission(row) {
  return {
    ...row,
    agentIds: safeParseJson(row.agentIds, []),
    results: safeParseJson(row.results, []),
    tasks: safeParseJson(row.tasks, []),
  };
}

// ─── Mission events ────────────────────────────────────────────────────────────

export function addMissionEvent(missionId, agentName, eventType, content, metadata = {}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO mission_events (missionId, agentName, eventType, content, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(missionId, agentName, eventType, content, JSON.stringify(metadata));

  // Keep only last 2000 events per mission to prevent bloat
  db.prepare(`
    DELETE FROM mission_events WHERE id IN (
      SELECT id FROM mission_events WHERE missionId = ? ORDER BY id DESC LIMIT -1 OFFSET 200
    )
  `).run(missionId);

  return result.lastInsertRowid;
}

export function getMissionEvents(missionId, limit = 100) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM mission_events WHERE missionId = ? ORDER BY id ASC LIMIT ?
  `).all(missionId, limit);
  return rows.map((r) => ({ ...r, metadata: safeParseJson(r.metadata, {}) }));
}

export function getRecentEvents(limit = 100) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM mission_events ORDER BY id DESC LIMIT ?
  `).all(limit);
  return rows.map((r) => ({ ...r, metadata: safeParseJson(r.metadata, {}) })).reverse();
}

// ─── Agent thoughts ────────────────────────────────────────────────────────────

export function addAgentThought(agentName, thought, type = "thinking", missionId = null) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO agent_thoughts (agentName, thought, type, missionId)
    VALUES (?, ?, ?, ?)
  `).run(agentName, thought, type, missionId);

  // Prune old thoughts — keep last 500 total
  db.prepare(`
    DELETE FROM agent_thoughts WHERE id IN (
      SELECT id FROM agent_thoughts ORDER BY id DESC LIMIT -1 OFFSET 500
    )
  `).run();

  return result.lastInsertRowid;
}

export function getAgentThoughts(agentName = null, limit = 50) {
  const db = getDb();
  let rows;
  if (agentName) {
    rows = db.prepare("SELECT * FROM agent_thoughts WHERE agentName = ? ORDER BY id DESC LIMIT ?").all(agentName, limit);
  } else {
    rows = db.prepare("SELECT * FROM agent_thoughts ORDER BY id DESC LIMIT ?").all(limit);
  }
  return rows.reverse();
}

// ─── Achievements ──────────────────────────────────────────────────────────────

export function getUnlockedAchievements(userId = "default") {
  const db = getDb();
  return db.prepare("SELECT achievementId FROM achievements WHERE userId = ?").all(userId).map((r) => r.achievementId);
}

export function unlockAchievement(achievementId, userId = "default") {
  const db = getDb();
  try {
    db.prepare("INSERT OR IGNORE INTO achievements (userId, achievementId) VALUES (?, ?)").run(userId, achievementId);
    return true;
  } catch {
    return false;
  }
}

// ─── Automations ───────────────────────────────────────────────────────────────

export function getAutomations() {
  const db = getDb();
  return db.prepare("SELECT * FROM automations ORDER BY createdAt DESC").all().map((a) => ({
    ...a,
    enabled: a.enabled === 1,
  }));
}

export function saveAutomation(automation) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO automations (id, name, prompt, templateId, cron, enabled)
    VALUES (@id, @name, @prompt, @templateId, @cron, @enabled)
  `).run({
    id: automation.id || `cron_${Date.now()}`,
    name: automation.name || "Automation",
    prompt: automation.prompt || "",
    templateId: automation.templateId || null,
    cron: automation.cron || null,
    enabled: automation.enabled !== false ? 1 : 0,
  });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export function getStat(key) {
  const db = getDb();
  const row = db.prepare("SELECT value FROM stats WHERE key = ?").get(key);
  return row ? safeParseJson(row.value, null) : null;
}

export function setStat(key, value) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO stats (key, value, updatedAt) VALUES (?, ?, datetime('now'))").run(key, JSON.stringify(value));
}

export function getAllStats() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM stats").all();
  const out = {};
  for (const r of rows) {
    out[r.key] = safeParseJson(r.value, r.value);
  }
  return out;
}

export function computeStats() {
  const db = getDb();
  const missions = getMissions(1000);
  const totalMissions = missions.length;
  const today = new Date().toISOString().slice(0, 10);

  const dates = [...new Set(missions.map((m) => (m.createdAt || "").slice(0, 10)))]
    .filter(Boolean)
    .sort()
    .reverse();

  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 && dates[0] !== today) break;
    if (i > 0) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      if ((prev - curr) / (1000 * 60 * 60 * 24) > 1) break;
    }
    streak++;
  }

  const xp = Math.min(100 * totalMissions, 9999);
  const level = Math.floor(xp / 200) + 1;
  const lastMissionDate = dates[0] || null;

  const usedTemplate = getStat("usedTemplate");

  const stats = { totalMissions, streak, lastMissionDate, xp, level, usedTemplate: !!usedTemplate };

  setStat("totalMissions", totalMissions);
  setStat("streak", streak);
  setStat("lastMissionDate", lastMissionDate);
  setStat("xp", xp);
  setStat("level", level);

  return stats;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function getTimeline(limit = 50) {
  const db = getDb();
  const missions = db.prepare(`
    SELECT 'mission' as itemType, id, title as content, status, createdAt FROM missions
    ORDER BY createdAt DESC LIMIT ?
  `).all(Math.floor(limit / 2));

  const thoughts = db.prepare(`
    SELECT 'thought' as itemType, id, thought as content, type as status, agentName, createdAt FROM agent_thoughts
    ORDER BY id DESC LIMIT ?
  `).all(Math.floor(limit / 2));

  const events = db.prepare(`
    SELECT 'event' as itemType, id, content, eventType as status, agentName, missionId, createdAt FROM mission_events
    ORDER BY id DESC LIMIT ?
  `).all(Math.floor(limit / 3));

  return [...missions, ...thoughts, ...events].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  }).slice(0, limit);
}

// ─── World stats ───────────────────────────────────────────────────────────────

export function getWorldStats() {
  const db = getDb();
  const totalMissions = db.prepare("SELECT COUNT(*) as c FROM missions").get().c;
  const completedMissions = db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'completed'").get().c;
  const activeMissions = db.prepare("SELECT COUNT(*) as c FROM missions WHERE status IN ('running', 'pending')").get().c;
  const totalAgents = db.prepare("SELECT COUNT(*) as c FROM agents").get().c;
  const activeAgents = db.prepare("SELECT COUNT(*) as c FROM agents WHERE status = 'active'").get().c;
  const totalEvents = db.prepare("SELECT COUNT(*) as c FROM mission_events").get().c;
  const totalThoughts = db.prepare("SELECT COUNT(*) as c FROM agent_thoughts").get().c;
  const successRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
  const stats = computeStats();

  return {
    totalMissions,
    completedMissions,
    activeMissions,
    totalAgents,
    activeAgents,
    totalEvents,
    totalThoughts,
    successRate,
    ...stats,
  };
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function safeParseJson(str, fallback) {
  if (str === null || str === undefined) return fallback;
  if (typeof str !== "string") return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
