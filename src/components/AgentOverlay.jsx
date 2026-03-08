import { useState, useRef, useEffect } from "react";
import AgentAvatar from "./AgentAvatar";
import { useWorldStore } from "../store/worldStore";
import { useStore } from "../store/useStore";
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
        body: JSON.stringify({ message: text }),
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

  const suggestions = getSuggestions(agent.role);

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
        {/* Compact header */}
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

          {/* Toggleable stats */}
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

        {/* Chat — fills remaining space */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {chatMessages.length === 0 && (
            <div className="py-4">
              <p className="text-[10px] text-gray-600 mb-3">Parle à {agent.name} ou lance une mission :</p>
              <div className="grid grid-cols-1 gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setChatInput(s)}
                    className="text-left text-[10px] text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg border border-white/5 hover:border-white/15 hover:bg-white/3 transition-all font-mono"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[9px] text-gray-600 mb-2 font-mono">Actions rapides :</p>
                <div className="flex flex-wrap gap-1.5">
                  {getQuickActions(agent.role).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleMission(action.prompt)}
                      className="text-[9px] font-mono px-2.5 py-1.5 rounded-lg border transition-all"
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

function getSuggestions(role) {
  const map = {
    orchestrator: ["Propose un plan pour cette semaine", "Quel agent assigner pour du scraping ?", "Coordonne un brief complet"],
    data_ops: ["Récupère les dernières données", "Lance un pipeline ETL", "Vérifie l'intégrité des données"],
    analyst: ["Analyse les tendances récentes", "Identifie les patterns clés", "Génère un rapport d'insights"],
    writer: ["Rédige un résumé de la semaine", "Crée une doc technique", "Synthétise les résultats"],
    communicator: ["Envoie un résumé à l'équipe", "Prépare un email de brief", "Notifie les membres"],
    scraper: ["Surveille ce site pour des changements", "Extrais les données de ce site", "Veille concurrentielle"],
    developer: ["Review le dernier commit", "Lance les tests", "Déploie la dernière version"],
  };
  return map[role] || ["Que peux-tu faire ?", "Lance une mission"];
}

function getQuickActions(role) {
  const map = {
    orchestrator: [{ label: "Brief", prompt: "Fais un brief de l'état actuel de l'équipe" }, { label: "Planifier", prompt: "Propose un plan de mission pour la semaine" }],
    data_ops: [{ label: "Pipeline", prompt: "Lance le pipeline de collecte de données" }, { label: "Export", prompt: "Exporte les données récentes" }],
    analyst: [{ label: "Rapport", prompt: "Génère un rapport d'analyse" }, { label: "Tendances", prompt: "Analyse les tendances récentes" }],
    writer: [{ label: "Synthèse", prompt: "Rédige une synthèse des activités" }, { label: "Doc", prompt: "Crée une documentation" }],
    communicator: [{ label: "Notifier", prompt: "Envoie un résumé à l'équipe" }, { label: "Brief", prompt: "Prépare un brief email" }],
    scraper: [{ label: "Veille", prompt: "Lance une veille concurrentielle" }, { label: "Scan", prompt: "Scan les sources web" }],
    developer: [{ label: "Review", prompt: "Review le code récent" }, { label: "Tests", prompt: "Lance la suite de tests" }],
  };
  return map[role] || [{ label: "Mission", prompt: "Lance une mission" }];
}
