import { useState, useMemo } from "react";
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

  const health = useWorldStore((s) => s.getAgentHealth(agent?.name));
  const sick = useWorldStore((s) => s.isAgentSick(agent?.name));
  const mcps = useStore((s) => s.mcps);

  if (!agent) return null;

  const color = agent.color || "#4ecdc4";
  const statusInfo = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
  const healthPct = Math.round((health ?? 1) * 100);
  const roleLabel = AGENT_ROLE_LABELS[agent.role] || agent.role || "Agent";
  const roleDesc = AGENT_ROLE_DESCRIPTIONS[agent.role] || agent.personality || "Membre de l'équipage.";
  const agentMcps = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id));

  const handleChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { from: "user", text },
      {
        from: agent.name,
        text: generateResponse(agent, text),
      },
    ]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full rounded-xl border bg-[#0a0e17]/98 shadow-2xl overflow-hidden animate-fade-in"
        style={{ borderColor: `${color}30` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-white/5"
          style={{ background: `linear-gradient(135deg, ${color}12, transparent)` }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <AgentAvatar agent={agent} size="lg" />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0e17]"
                style={{ backgroundColor: statusInfo.color, boxShadow: `0 0 6px ${statusInfo.color}` }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-orbitron text-base font-bold tracking-wide" style={{ color }}>{agent.name}</h2>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                  style={{ color: statusInfo.color, borderColor: `${statusInfo.color}40`, backgroundColor: `${statusInfo.color}10` }}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-semibold">{roleLabel}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-3 grid grid-cols-4 gap-3 border-b border-white/5">
          <div>
            <p className="text-[8px] text-gray-600 font-mono">SANTÉ</p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${healthPct}%`, backgroundColor: sick ? "#ff6b6b" : color }} />
              </div>
              <span className="text-[9px] font-mono" style={{ color: sick ? "#ff6b6b" : color }}>{healthPct}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-gray-600 font-mono">NIVEAU</p>
            <p className="text-sm font-bold font-mono" style={{ color }}>{agent.level || 1}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-gray-600 font-mono">MISSIONS</p>
            <p className="text-sm font-bold font-mono text-gray-300">{agent.missions || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-gray-600 font-mono">SUCCÈS</p>
            <p className="text-sm font-bold font-mono text-synth-emerald">{agent.successRate || 0}%</p>
          </div>
        </div>

        {/* Description + MCPs */}
        <div className="px-5 py-3 space-y-3 border-b border-white/5">
          <p className="text-[11px] text-gray-400 leading-relaxed">{roleDesc}</p>
          {agentMcps.length > 0 && (
            <div>
              <p className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mb-1.5">OUTILS ÉQUIPÉS</p>
              <div className="flex flex-wrap gap-1.5">
                {agentMcps.map((mcp) => (
                  <div key={mcp.id} className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-lg border border-white/8 bg-white/3">
                    <span>{mcp.icon}</span>
                    <span className="text-gray-400">{mcp.name}</span>
                    <span className="text-gray-600">({mcp.tools?.length || 0})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat with agent */}
        <div className="px-5 py-3">
          <p className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mb-2">PARLER À {agent.name}</p>
          <div className="max-h-32 overflow-y-auto space-y-2 mb-2">
            {chatMessages.length === 0 && (
              <p className="text-[10px] text-gray-600 italic">Pose une question à {agent.name}...</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`text-[11px] ${msg.from === "user" ? "text-gray-300 text-right" : ""}`}>
                {msg.from !== "user" && <span className="font-bold mr-1" style={{ color }}>{msg.from} :</span>}
                <span className={msg.from === "user" ? "text-gray-300" : "text-gray-400"}>{msg.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder={`Demande quelque chose à ${agent.name}...`}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg outline-none text-gray-200 font-mono text-[11px] px-3 py-2 placeholder-gray-600 focus:border-synth-primary/30 transition-colors"
            />
            <button
              onClick={handleChat}
              disabled={!chatInput.trim()}
              className="px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-40"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
            >
              Envoyer
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-white/5 flex gap-2">
          <a
            href="#/classic/ops"
            className="flex-1 px-4 py-2 rounded-lg text-center font-bold text-xs font-mono transition-colors text-white"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            Assigner une mission
          </a>
          <a
            href="#/classic/quarters"
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-500 hover:text-gray-300 text-xs font-mono transition-colors text-center"
          >
            Modifier
          </a>
        </div>
      </div>
    </div>
  );
}

function generateResponse(agent, question) {
  const q = question.toLowerCase();
  const name = agent.name;
  const role = AGENT_ROLE_LABELS[agent.role] || "agent";

  if (q.includes("statut") || q.includes("status") || q.includes("comment")) {
    return `Tout va bien de mon côté. Statut : ${agent.status || "idle"}. J'ai complété ${agent.missions || 0} missions avec un taux de ${agent.successRate || 0}%.`;
  }
  if (q.includes("quoi") || q.includes("faire") || q.includes("capable")) {
    return `En tant que ${role}, ${AGENT_ROLE_DESCRIPTIONS[agent.role] || "je suis prêt à aider l'équipe."} Lance une mission pour me mettre en action.`;
  }
  if (q.includes("mcp") || q.includes("outil") || q.includes("tool")) {
    const mcpList = agent.mcpIds?.join(", ") || "aucun";
    return `Mes outils MCP : ${mcpList}. Tu peux modifier mon équipement dans l'Équipage.`;
  }
  if (q.includes("mission") || q.includes("travail")) {
    return `J'ai effectué ${agent.missions || 0} missions au total. Assigne-moi une nouvelle mission pour contribuer à l'équipe.`;
  }

  const responses = [
    `Bien reçu. En tant que ${role}, je suis prêt. Lance une mission pour me voir en action.`,
    `Je comprends ta demande. Utilise la page Missions pour me donner du travail concret.`,
    `Message reçu. N'hésite pas à me solliciter via une mission, c'est là que je suis le plus efficace.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
