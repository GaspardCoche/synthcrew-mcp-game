// Rôles agents (orchestrator = compréhension + mémoire pour les autres)
export const AGENT_ROLES = [
  "orchestrator",
  "developer",
  "analyst",
  "writer",
  "data_ops",
  "communicator",
  "scraper",
  "support",
];

export const AGENT_ROLE_LABELS = {
  orchestrator: "Orchestrateur",
  developer: "Développeur",
  analyst: "Analyste",
  writer: "Rédacteur",
  data_ops: "Data Ops",
  communicator: "Communicant",
  scraper: "Scraper",
  support: "Support",
};

export const STATUS_CONFIG = {
  active: {
    label: "EN MISSION",
    bg: "rgba(0,240,255,0.1)",
    border: "#00f0ff",
    dot: "#00f0ff",
    pulse: true,
  },
  idle: {
    label: "EN VEILLE",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.1)",
    dot: "#6b7280",
    pulse: false,
  },
  queued: {
    label: "EN ATTENTE",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    dot: "#f59e0b",
    pulse: true,
  },
  sleeping: {
    label: "SOMMEIL",
    bg: "rgba(255,255,255,0.01)",
    border: "rgba(255,255,255,0.05)",
    dot: "#374151",
    pulse: false,
  },
  error: {
    label: "ERREUR",
    bg: "rgba(239,68,68,0.1)",
    border: "#ef4444",
    dot: "#ef4444",
    pulse: true,
  },
};

// Limites par plan (monétisation)
export const PLAN_LIMITS = {
  explorer: { agents: 3, missionsPerMonth: 50, mcps: 5, cronMissions: 0 },
  captain: { agents: 10, missionsPerMonth: 500, mcps: Infinity, cronMissions: 10 },
  admiral: { agents: Infinity, missionsPerMonth: Infinity, mcps: Infinity, cronMissions: Infinity },
};

export const DEFAULT_PLAN = "explorer";

// Statuts des missions (backend + affichage)
export const MISSION_STATUS = {
  pending: { label: "En attente", color: "text-synth-amber", bg: "bg-synth-amber/10", border: "border-synth-amber/30" },
  running: { label: "En cours", color: "text-synth-cyan", bg: "bg-synth-cyan/10", border: "border-synth-cyan/30" },
  completed: { label: "Terminée", color: "text-synth-green", bg: "bg-synth-green/10", border: "border-synth-green/30" },
  failed: { label: "Échouée", color: "text-synth-red", bg: "bg-synth-red/10", border: "border-synth-red/30" },
};

// MCPs disponibles (Armurerie) — mock pour MVP
export const MCP_CATALOG = [
  { id: "github", name: "GitHub", icon: "⌘", category: "dev", connected: true, tools: ["list_issues", "create_issue", "get_file", "list_prs"] },
  { id: "slack", name: "Slack", icon: "💬", category: "comms", connected: true, tools: ["post_message", "list_channels", "search_messages"] },
  { id: "notion", name: "Notion", icon: "📝", category: "docs", connected: true, tools: ["create_page", "query_database", "append_block"] },
  { id: "gmail", name: "Gmail", icon: "✉️", category: "comms", connected: true, tools: ["list_messages", "send_email", "get_message"] },
  { id: "zendesk", name: "Zendesk", icon: "🎫", category: "support", connected: false, tools: ["list_tickets", "get_ticket", "update_ticket"] },
  { id: "postgres", name: "PostgreSQL", icon: "🐘", category: "data", connected: false, tools: ["query", "execute"] },
  { id: "brave-search", name: "Brave Search", icon: "🔍", category: "search", connected: true, tools: ["search"] },
  { id: "filesystem", name: "Filesystem", icon: "📁", category: "data", connected: true, tools: ["read_file", "write_file", "list_dir"] },
];

export const TABS = [
  { id: "village", label: "VILLAGE", icon: "◈", path: "/classic" },
  { id: "quarters", label: "ÉQUIPE", icon: "◎", path: "/classic/quarters" },
  { id: "armory", label: "OUTILS", icon: "⬡", path: "/classic/armory" },
  { id: "ops", label: "ATELIER", icon: "▣", path: "/classic/ops" },
  { id: "log", label: "CHRONIQUES", icon: "≡", path: "/classic/log" },
  { id: "integrations", label: "CLI", icon: "⚡", path: "/classic/integrations" },
];

// Brief orchestrateur : questions pour comprendre le besoin
export const ORCHESTRATOR_QUESTIONS = [
  { id: "goal", label: "Quel est l'objectif principal ?", placeholder: "Ex: rapport hebdo, trier des tickets…", key: "goal" },
  { id: "sources", label: "Quelles sources ou outils ?", placeholder: "Ex: Zendesk, Gmail, GitHub, Notion, Slack…", key: "sources" },
  { id: "deliverable", label: "Quel livrable attendu ?", placeholder: "Ex: page Notion, message Slack, email…", key: "deliverable" },
  { id: "constraints", label: "Contraintes ou priorités ?", placeholder: "Ex: urgent, en anglais…", key: "constraints" },
];

export function suggestRolesFromMemory(memory) {
  const roles = new Set();
  const all = `${memory.goal || ""} ${memory.sources || ""} ${memory.deliverable || ""} ${memory.constraints || ""}`.toLowerCase();
  if (/\b(ticket|zendesk|support|client)\b/.test(all)) roles.add("support").add("data_ops");
  if (/\b(email|gmail|slack|notif|message)\b/.test(all)) roles.add("communicator").add("data_ops");
  if (/\b(rapport|notion|doc|rédiger|résumé|page)\b/.test(all)) roles.add("writer").add("analyst");
  if (/\b(github|pr|code|repo|commit)\b/.test(all)) roles.add("developer");
  if (/\b(recherche|web|veille|scrap)\b/.test(all)) roles.add("scraper");
  if (/\b(analyser|tendance|métrique|catégor)\b/.test(all)) roles.add("analyst");
  if (roles.size === 0) return ["analyst", "writer", "communicator"];
  return Array.from(roles);
}
