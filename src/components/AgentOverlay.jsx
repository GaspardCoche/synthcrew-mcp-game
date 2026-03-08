import { useState, useRef, useEffect } from "react";
import AgentAvatar from "./AgentAvatar";
import { useWorldStore } from "../store/worldStore";
import { useStore } from "../store/useStore";
import { useProfileStore } from "../store/profileStore";
import { AGENT_ROLE_LABELS, AGENT_ROLE_DESCRIPTIONS } from "../lib/constants";

const STATUS_LABELS = {
  active: { label: "En mission", color: "#4ecdc4" },
  queued: { label: "En attente", color: "#ffd93d" },
  idle: { label: "Disponible", color: "#6b7280" },
  sleeping: { label: "Sommeil", color: "#4b5563" },
  error: { label: "Erreur", color: "#ff6b6b" },
};

export default function AgentOverlay({ agent, onClose }) {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const health = useWorldStore((s) => s.getAgentHealth(agent?.name));
  const sick = useWorldStore((s) => s.isAgentSick(agent?.name));
  const mcps = useStore((s) => s.mcps);
  const profile = useProfileStore((s) => s.getProfile());
  const getContextString = useProfileStore((s) => s.getContextString);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (agent) setTimeout(() => inputRef.current?.focus(), 200);
  }, [agent]);

  if (!agent) return null;

  const color = agent.color || "#4ecdc4";
  const statusInfo = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
  const healthPct = Math.round((health ?? 1) * 100);
  const roleLabel = AGENT_ROLE_LABELS[agent.role] || agent.role || "Agent";
  const roleDesc = AGENT_ROLE_DESCRIPTIONS[agent.role] || agent.personality || "Membre de l'équipage.";
  const agentMcps = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id));

  const handleChat = async () => {
    const text = chatInput.trim();
    if (!text || sending) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { from: "user", text }]);
    setSending(true);

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, profileContext: getContextString() }),
      });
      const data = await res.json();
      if (data.error) {
        setChatMessages((prev) => [...prev, { from: agent.name, text: `Erreur : ${data.error}`, error: true }]);
      } else {
        setChatMessages((prev) => [...prev, {
          from: agent.name,
          text: data.reply,
          engine: data.engine,
        }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, {
        from: agent.name,
        text: "Connexion au serveur impossible.",
        error: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleMission = async (prompt) => {
    setChatMessages((prev) => [...prev, { from: "user", text: prompt }]);
    setSending(true);
    try {
      const res = await fetch("/api/mission/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[Agent ${agent.name}] ${prompt}`,
          title: prompt.slice(0, 60),
        }),
      });
      const data = await res.json();
      const engineTag = data.engine === "claude" ? "[Claude]" : "[Simulation]";
      setChatMessages((prev) => [...prev, {
        from: agent.name,
        text: data.error
          ? `Erreur : ${data.error}`
          : `${engineTag} Mission lancée : "${prompt.slice(0, 50)}..." — Suis la progression dans l'Ops Room.`,
        error: !!data.error,
        engine: data.engine,
      }]);
    } catch {
      setChatMessages((prev) => [...prev, { from: agent.name, text: "Erreur réseau.", error: true }]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = getSuggestions(agent.role, profile);
  const quickActions = getQuickActions(agent.role, profile);

  const greeting = profile.username
    ? `Salut ${profile.username} ! Parle à ${agent.name} ou lance une action :`
    : `Parle à ${agent.name} ou lance une mission :`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm flex flex-col bg-[#080c15]/98 border-l animate-slide-right"
        style={{ borderColor: `${color}20` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${color}06, transparent)` }}>
          <div className="flex items-center gap-3">
            <AgentAvatar agent={agent} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron text-sm font-bold tracking-wide" style={{ color }}>{agent.name}</h2>
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color: statusInfo.color, borderColor: `${statusInfo.color}25`, backgroundColor: `${statusInfo.color}08` }}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">{roleLabel}</p>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full mt-2 flex items-center gap-2 text-[8px] text-gray-600 hover:text-gray-400 font-mono transition-colors"
          >
            <span>{showStats ? "▾" : "▸"}</span>
            <span>LVL {agent.level || 1} · {agent.missions || 0} missions · {agent.successRate || 0}% succès · {healthPct}% HP</span>
          </button>

          {showStats && (
            <div className="mt-2 space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-[7px] text-gray-600 font-mono w-10">SANTÉ</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${healthPct}%`, backgroundColor: sick ? "#ff6b6b" : color }} />
                </div>
              </div>
              <p className="text-[9px] text-gray-600 leading-relaxed">{roleDesc}</p>
              {agentMcps.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {agentMcps.map((mcp) => (
                    <span key={mcp.id} className="text-[7px] font-mono px-1 py-0.5 rounded border border-white/8 bg-white/3 text-gray-500">
                      {mcp.icon} {mcp.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {chatMessages.length === 0 && (
            <div className="py-4">
              <p className="text-[10px] text-gray-600 mb-3">{greeting}</p>
              <div className="grid grid-cols-1 gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setChatInput(s)}
                    className="text-left text-[10px] text-gray-500 hover:text-gray-300 focus:text-gray-300 px-3 py-2 rounded-lg border border-white/5 hover:border-white/15 hover:bg-white/3 focus:border-white/15 focus:bg-white/3 focus:outline-none transition-all font-mono"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[9px] text-gray-600 mb-2 font-mono">Actions rapides :</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleMission(action.prompt)}
                      className="text-[9px] font-mono px-2.5 py-1.5 rounded-lg border transition-all hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      style={{ borderColor: `${color}25`, color, background: `${color}08` }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[11px] leading-relaxed ${
                msg.from === "user"
                  ? "bg-white/5 text-gray-200 rounded-br-sm"
                  : msg.error
                    ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm"
                    : "border rounded-bl-sm text-gray-300"
              }`} style={msg.from !== "user" && !msg.error ? { borderColor: `${color}15`, background: `${color}05` } : {}}>
                {msg.from !== "user" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[8px] font-mono font-bold" style={{ color: msg.error ? "#ff6b6b" : color }}>
                      {msg.from}
                    </span>
                    {msg.engine && (
                      <span className={`text-[7px] font-mono px-1 py-0.5 rounded ${msg.engine === "claude" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {msg.engine === "claude" ? "IA" : "SIM"}
                      </span>
                    )}
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg px-3 py-2 border rounded-bl-sm" style={{ borderColor: `${color}15`, background: `${color}05` }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-gray-500">{agent.name} réfléchit...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 border-t border-white/5 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder={`Message pour ${agent.name}...`}
              disabled={sending}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg outline-none text-gray-200 font-mono text-[11px] px-3 py-2 placeholder-gray-600 focus:border-white/20 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleChat}
              disabled={!chatInput.trim() || sending}
              className="px-3 py-2 rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-30"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Profile-aware suggestions
// ─────────────────────────────────────────────────────────────────
function getSuggestions(role, profile) {
  const pt = profile.projectType;
  const goals = profile.goals || [];
  const name = profile.projectName;
  const level = profile.experienceLevel;

  const projectLabel = name ? `"${name}"` : "mon projet";

  const BASE = {
    orchestrator: [
      `Propose un plan de travail pour ${projectLabel}`,
      "Quel agent assigner pour ma prochaine tâche ?",
      "Fais un état des lieux de l'équipe",
    ],
    data_ops: [
      `Quelles données collecter pour ${projectLabel} ?`,
      "Lance un pipeline de collecte",
      "Vérifie l'intégrité des données",
    ],
    analyst: [
      `Analyse les métriques clés de ${projectLabel}`,
      "Identifie les tendances principales",
      "Génère un rapport d'insights",
    ],
    writer: [
      `Rédige une présentation de ${projectLabel}`,
      "Crée une documentation technique",
      "Synthétise les derniers résultats",
    ],
    communicator: [
      `Prépare un résumé de ${projectLabel} pour l'équipe`,
      "Rédige un email de mise à jour",
      "Notifie les membres de l'avancement",
    ],
    scraper: [
      `Fais une veille concurrentielle pour ${projectLabel}`,
      "Surveille les changements sur un site cible",
      "Extrais des données d'une page web",
    ],
    developer: [
      `Review le code de ${projectLabel}`,
      "Lance les tests du projet",
      "Propose des améliorations techniques",
    ],
  };

  const suggestions = [...(BASE[role] || [`Que peux-tu faire pour ${projectLabel} ?`, "Lance une mission"])];

  if (pt === "saas" && role === "analyst") suggestions.push("Analyse le taux de conversion et le churn");
  if (pt === "saas" && role === "developer") suggestions.push("Vérifie les performances de l'API");
  if (pt === "ecommerce" && role === "data_ops") suggestions.push("Collecte les données produits et prix");
  if (pt === "ecommerce" && role === "analyst") suggestions.push("Analyse le panier moyen et les tendances d'achat");
  if (pt === "ecommerce" && role === "scraper") suggestions.push("Surveille les prix des concurrents");
  if (pt === "content" && role === "writer") suggestions.push("Rédige un article optimisé SEO");
  if (pt === "content" && role === "analyst") suggestions.push("Analyse les performances éditoriales");
  if (pt === "data" && role === "data_ops") suggestions.push("Connecte-toi aux sources de données et lance l'ETL");
  if (pt === "data" && role === "analyst") suggestions.push("Génère un dashboard d'indicateurs clés");
  if (pt === "opensource" && role === "developer") suggestions.push("Analyse les issues et PRs ouvertes");
  if (pt === "opensource" && role === "communicator") suggestions.push("Rédige un changelog pour la prochaine release");
  if (pt === "agency" && role === "orchestrator") suggestions.push("Planifie les livrables pour mes clients");
  if (pt === "agency" && role === "writer") suggestions.push("Rédige une proposition commerciale");

  if (goals.includes("automate") && role === "orchestrator") suggestions.push("Automatise un workflow récurrent");
  if (goals.includes("monitor") && role === "scraper") suggestions.push("Mets en place une veille automatique quotidienne");
  if (goals.includes("analyze") && role === "analyst") suggestions.push("Crée un tableau de bord de suivi");

  if (level === "beginner") {
    suggestions.push(`Explique-moi comment tu peux m'aider sur ${projectLabel}`);
  }

  return suggestions.slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────
// Profile-aware quick actions
// ─────────────────────────────────────────────────────────────────
function getQuickActions(role, profile) {
  const pt = profile.projectType;
  const name = profile.projectName;
  const projectLabel = name ? `"${name}"` : "mon projet";

  const BASE = {
    orchestrator: [
      { label: "Brief", prompt: `Fais un brief de l'état de ${projectLabel} et de l'équipe` },
      { label: "Planifier", prompt: `Propose un plan d'action concret pour ${projectLabel}` },
    ],
    data_ops: [
      { label: "Pipeline", prompt: `Lance la collecte de données pour ${projectLabel}` },
      { label: "Export", prompt: `Exporte les données récentes de ${projectLabel}` },
    ],
    analyst: [
      { label: "Rapport", prompt: `Génère un rapport d'analyse pour ${projectLabel}` },
      { label: "Tendances", prompt: `Identifie les tendances clés de ${projectLabel}` },
    ],
    writer: [
      { label: "Synthèse", prompt: `Rédige une synthèse de l'avancement de ${projectLabel}` },
      { label: "Doc", prompt: `Crée une documentation pour ${projectLabel}` },
    ],
    communicator: [
      { label: "Notifier", prompt: `Envoie un résumé de ${projectLabel} à l'équipe` },
      { label: "Brief", prompt: `Prépare un brief email sur ${projectLabel}` },
    ],
    scraper: [
      { label: "Veille", prompt: `Lance une veille pour ${projectLabel}` },
      { label: "Scan", prompt: `Scan les sources web liées à ${projectLabel}` },
    ],
    developer: [
      { label: "Review", prompt: `Review le code récent de ${projectLabel}` },
      { label: "Tests", prompt: `Lance la suite de tests de ${projectLabel}` },
    ],
  };

  const actions = [...(BASE[role] || [{ label: "Mission", prompt: `Lance une mission pour ${projectLabel}` }])];

  if (pt === "saas" && role === "analyst") actions.push({ label: "KPIs", prompt: "Analyse les KPIs SaaS : MRR, churn, conversion" });
  if (pt === "ecommerce" && role === "scraper") actions.push({ label: "Prix", prompt: "Surveille et compare les prix concurrents" });
  if (pt === "content" && role === "writer") actions.push({ label: "SEO", prompt: "Rédige du contenu optimisé pour le référencement" });
  if (pt === "data" && role === "data_ops") actions.push({ label: "ETL", prompt: "Configure et lance le pipeline ETL complet" });
  if (pt === "opensource" && role === "developer") actions.push({ label: "Issues", prompt: "Trie et priorise les issues GitHub" });
  if (pt === "agency" && role === "writer") actions.push({ label: "Propale", prompt: "Rédige une proposition commerciale client" });

  return actions.slice(0, 4);
}
