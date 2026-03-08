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

export const AGENT_ROLE_DESCRIPTIONS = {
  orchestrator: "Décompose les missions en tâches, coordonne l'équipe, sert de mémoire collective.",
  developer: "Gère le code : PRs, revues, CI/CD, déploiements, debugging.",
  analyst: "Analyse les données, détecte les tendances, produit des insights.",
  writer: "Rédige rapports, docs Notion, synthèses. Structure l'information.",
  data_ops: "Récupère et structure les données depuis les sources (API, DB, fichiers).",
  communicator: "Envoie résumés et notifications : Slack, Gmail, messages d'équipe.",
  scraper: "Collecte des infos sur le web : veille, extraction, recherche.",
  support: "Gère le support client, résolution de problèmes, satisfaction.",
};

export const STATUS_CONFIG = {
  active: {
    label: "EN MISSION",
    bg: "rgba(78,205,196,0.1)",
    border: "#4ecdc4",
    dot: "#4ecdc4",
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
    bg: "rgba(255,217,61,0.08)",
    border: "rgba(255,217,61,0.3)",
    dot: "#ffd93d",
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
    bg: "rgba(255,107,107,0.1)",
    border: "#ff6b6b",
    dot: "#ff6b6b",
    pulse: true,
  },
};

export const PLAN_LIMITS = {
  explorer: { agents: 3, missionsPerMonth: 50, mcps: 5, cronMissions: 0 },
  captain: { agents: 10, missionsPerMonth: 500, mcps: Infinity, cronMissions: 10 },
  admiral: { agents: Infinity, missionsPerMonth: Infinity, mcps: Infinity, cronMissions: Infinity },
};

export const DEFAULT_PLAN = "explorer";

export const MISSION_STATUS = {
  pending: { label: "En attente", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  running: { label: "En cours", color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/30" },
  completed: { label: "Terminée", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  failed: { label: "Échouée", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
};

export const MCP_CATALOG = [
  { id: "github", name: "GitHub", icon: "⌘", category: "dev", connected: true, tools: ["list_issues", "create_issue", "get_file", "list_prs", "create_pr"], description: "Repos, issues, PRs, code review, commits" },
  { id: "slack", name: "Slack", icon: "💬", category: "comms", connected: true, tools: ["post_message", "list_channels", "search_messages"], description: "Messagerie d'équipe, notifications, canaux" },
  { id: "notion", name: "Notion", icon: "📝", category: "docs", connected: true, tools: ["create_page", "query_database", "append_block", "search"], description: "Pages, databases, wikis, knowledge base" },
  { id: "gmail", name: "Gmail", icon: "✉️", category: "comms", connected: false, tools: ["list_messages", "send_email", "get_message"], description: "Emails, drafts, labels, recherche" },
  { id: "brave-search", name: "Brave Search", icon: "🔍", category: "search", connected: true, tools: ["web_search", "local_search"], description: "Recherche web temps réel avec sources" },
  { id: "filesystem", name: "Filesystem", icon: "📁", category: "data", connected: true, tools: ["read_file", "write_file", "list_dir", "search_files"], description: "Lecture/écriture fichiers, navigation" },
  { id: "postgres", name: "PostgreSQL", icon: "🐘", category: "data", connected: false, tools: ["query", "execute", "describe_table"], description: "Requêtes SQL, schéma, données" },
  { id: "playwright", name: "Playwright", icon: "🎭", category: "dev", connected: false, tools: ["navigate", "click", "fill", "screenshot"], description: "Automatisation navigateur, tests E2E" },
  { id: "sentry", name: "Sentry", icon: "🐛", category: "dev", connected: false, tools: ["list_issues", "get_issue", "resolve_issue"], description: "Monitoring erreurs, debugging, alertes" },
  { id: "sequential-thinking", name: "Thinking", icon: "🧠", category: "ai", connected: true, tools: ["create_thinking", "get_thinking"], description: "Raisonnement structuré étape par étape" },
  { id: "firecrawl", name: "Firecrawl", icon: "🔥", category: "search", connected: false, tools: ["scrape_url", "crawl_site", "search"], description: "Scraping web intelligent pour LLMs" },
  { id: "supabase", name: "Supabase", icon: "⚡", category: "data", connected: false, tools: ["query", "insert", "auth", "storage"], description: "DB + Auth + Storage + Edge Functions" },
  { id: "google-workspace", name: "Google Workspace", icon: "📊", category: "docs", connected: false, tools: ["create_doc", "create_sheet", "calendar_event"], description: "Docs, Sheets, Slides, Calendar" },
  { id: "docker", name: "Docker", icon: "🐳", category: "dev", connected: false, tools: ["list_containers", "run", "logs", "exec"], description: "Conteneurs, images, orchestration" },
  { id: "pixellab", name: "PixelLab", icon: "🎨", category: "ai", connected: false, tools: ["create_character", "animate_character", "create_tileset"], description: "Génération pixel art, avatars, tilesets" },
  { id: "memory", name: "Memory", icon: "💾", category: "ai", connected: true, tools: ["store", "retrieve", "search_memories"], description: "Mémoire persistante entre sessions" },
];

export const MCP_CATEGORIES = {
  dev: { label: "Développement", color: "#fd79a8" },
  comms: { label: "Communication", color: "#00b894" },
  docs: { label: "Documentation", color: "#ffd93d" },
  search: { label: "Recherche", color: "#74b9ff" },
  data: { label: "Données", color: "#6c5ce7" },
  ai: { label: "Intelligence", color: "#ff6b35" },
};

export const TABS = [
  { id: "village", label: "PONT", icon: "◈", path: "/classic", description: "Vue d'ensemble, agents actifs, missions" },
  { id: "quarters", label: "ÉQUIPAGE", icon: "◎", path: "/classic/quarters", description: "Gérer et créer des agents" },
  { id: "armory", label: "ARMURERIE", icon: "⬡", path: "/classic/armory", description: "MCPs disponibles et connectés" },
  { id: "ops", label: "MISSIONS", icon: "▣", path: "/classic/ops", description: "Lancer et suivre des missions" },
  { id: "log", label: "JOURNAL", icon: "≡", path: "/classic/log", description: "Historique et logs" },
  { id: "integrations", label: "CLI", icon: "⚡", path: "/classic/integrations", description: "Intégration ligne de commande" },
];

export const ORCHESTRATOR_QUESTIONS = [
  { id: "goal", label: "Quel est l'objectif ?", placeholder: "Ex: rapport hebdo, trier des tickets, analyser des PR…", key: "goal" },
  { id: "sources", label: "Quelles sources utiliser ?", placeholder: "Ex: Zendesk, Gmail, GitHub, Notion, Slack…", key: "sources" },
  { id: "deliverable", label: "Quel livrable attendu ?", placeholder: "Ex: page Notion, message Slack, email, dashboard…", key: "deliverable" },
  { id: "constraints", label: "Contraintes ou priorités ?", placeholder: "Ex: urgent, en anglais, format spécifique…", key: "constraints" },
];

export function suggestRolesFromMemory(memory) {
  const roles = new Set();
  const all = `${memory.goal || ""} ${memory.sources || ""} ${memory.deliverable || ""} ${memory.constraints || ""}`.toLowerCase();
  if (/\b(ticket|zendesk|support|client)\b/.test(all)) roles.add("support").add("data_ops");
  if (/\b(email|gmail|slack|notif|message)\b/.test(all)) roles.add("communicator").add("data_ops");
  if (/\b(rapport|notion|doc|rédiger|résumé|page)\b/.test(all)) roles.add("writer").add("analyst");
  if (/\b(github|pr|code|repo|commit|deploy)\b/.test(all)) roles.add("developer");
  if (/\b(recherche|web|veille|scrap|crawl)\b/.test(all)) roles.add("scraper");
  if (/\b(analyser|tendance|métrique|catégor|insight)\b/.test(all)) roles.add("analyst");
  if (roles.size === 0) return ["analyst", "writer", "communicator"];
  return Array.from(roles);
}
