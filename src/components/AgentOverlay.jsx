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
  const chatEndRef = useRef(null);

  const health = useWorldStore((s) => s.getAgentHealth(agent?.name));
  const sick = useWorldStore((s) => s.isAgentSick(agent?.name));
  const mcps = useStore((s) => s.mcps);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
      const res = await fetch("/api/mission/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[Agent ${agent.name} - ${roleLabel}] ${text}`,
          title: text.slice(0, 60),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setChatMessages((prev) => [...prev, { from: agent.name, text: `Erreur : ${data.error}`, error: true }]);
      } else {
        setChatMessages((prev) => [...prev, {
          from: agent.name,
          text: data.result || data.message || "Mission lancée. Suivez la progression dans le terminal CLI.",
        }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, {
        from: agent.name,
        text: "Connexion au serveur impossible. Le backend tourne-t-il ?",
        error: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full h-[calc(100vh-2rem)] rounded-xl border bg-[#080c15]/98 shadow-2xl flex flex-col animate-fade-in"
        style={{ borderColor: `${color}25` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${color}08, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <AgentAvatar agent={agent} size="lg" />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080c15]"
                style={{ backgroundColor: statusInfo.color, boxShadow: `0 0 6px ${statusInfo.color}` }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-orbitron text-sm font-bold tracking-wide" style={{ color }}>{agent.name}</h2>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color: statusInfo.color, borderColor: `${statusInfo.color}30`, backgroundColor: `${statusInfo.color}08` }}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">{roleLabel}</p>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-5 py-2.5 grid grid-cols-4 gap-2 border-b border-white/5 flex-shrink-0">
          <div>
            <p className="text-[7px] text-gray-600 font-mono mb-0.5">SANTÉ</p>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${healthPct}%`, backgroundColor: sick ? "#ff6b6b" : color }} />
              </div>
              <span className="text-[8px] font-mono" style={{ color: sick ? "#ff6b6b" : color }}>{healthPct}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[7px] text-gray-600 font-mono">LVL</p>
            <p className="text-xs font-bold font-mono" style={{ color }}>{agent.level || 1}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] text-gray-600 font-mono">MISSIONS</p>
            <p className="text-xs font-bold font-mono text-gray-300">{agent.missions || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] text-gray-600 font-mono">SUCCÈS</p>
            <p className="text-xs font-bold font-mono text-emerald-400">{agent.successRate || 0}%</p>
          </div>
        </div>

        {/* Info section */}
        <div className="px-5 py-2.5 border-b border-white/5 flex-shrink-0 space-y-2">
          <p className="text-[10px] text-gray-500 leading-relaxed">{roleDesc}</p>
          {agentMcps.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agentMcps.map((mcp) => (
                <span key={mcp.id} className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/8 bg-white/3 text-gray-400">
                  {mcp.icon} {mcp.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chat area - fills remaining space */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 min-h-0">
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[10px] text-gray-600 mb-3">Donne une tâche à {agent.name}</p>
              <div className="space-y-1.5">
                {getSuggestions(agent.role).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatInput(s); }}
                    className="block w-full text-left text-[10px] text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/15 hover:bg-white/3 transition-all font-mono"
                  >
                    {s}
                  </button>
                ))}
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
              }`} style={msg.from !== "user" && !msg.error ? { borderColor: `${color}20`, background: `${color}06` } : {}}>
                {msg.from !== "user" && (
                  <p className="text-[8px] font-mono font-bold mb-1" style={{ color: msg.error ? "#ff6b6b" : color }}>
                    {msg.from}
                  </p>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg px-3 py-2 border rounded-bl-sm" style={{ borderColor: `${color}20`, background: `${color}06` }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-gray-500">{agent.name} travaille...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder={`Tâche pour ${agent.name}...`}
              disabled={sending}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg outline-none text-gray-200 font-mono text-[11px] px-3 py-2 placeholder-gray-600 focus:border-[var(--agent-color)]/30 transition-colors disabled:opacity-50"
              style={{ "--agent-color": color }}
            />
            <button
              onClick={handleChat}
              disabled={!chatInput.trim() || sending}
              className="px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-30"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
            >
              {sending ? "..." : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSuggestions(role) {
  const map = {
    orchestrator: ["Analyse cette tâche et propose un plan", "Coordonne l'équipe pour un brief complet", "Quel agent est le mieux adapté pour du scraping ?"],
    data_ops: ["Récupère les dernières données de la base", "Lance un pipeline ETL", "Vérifie l'intégrité des données"],
    analyst: ["Analyse les tendances des missions", "Identifie les patterns de performance", "Génère un rapport d'insights"],
    writer: ["Rédige un résumé de la semaine", "Crée une documentation technique", "Synthétise les résultats récents"],
    communicator: ["Envoie un résumé à l'équipe", "Prépare un email de brief", "Notifie les membres du statut"],
    scraper: ["Surveille cette URL pour des changements", "Extrais les données de ce site", "Fais une veille concurrentielle"],
    developer: ["Review le dernier commit", "Lance les tests", "Déploie la dernière version"],
  };
  return map[role] || ["Que peux-tu faire ?", "Quel est ton statut ?", "Lance une mission"];
}
