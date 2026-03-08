import { useMemo } from "react";
import AgentAvatar from "./AgentAvatar";
import { useWorldStore } from "../store/worldStore";

const ROLE_EXPLANATIONS = {
  data_ops: "Je récupère et structure les données (tickets, exports, bases). Zendesk, HubSpot, CSV — tout passe par moi.",
  analyst: "J'analyse les tendances, le sentiment, les métriques. Donne-moi des données, je renvoie des insights.",
  writer: "Je rédige rapports, pages Notion, docs. Je synthétise et structure l'information de l'équipe.",
  communicator: "J'envoie des résumés et notifications : Slack, Gmail, messages d'équipe.",
  scraper: "Je collecte des infos sur le web : recherche, veille concurrentielle, extraction de contenu.",
  developer: "Je gère le code : PRs, revues, Jira, Linear, déploiements et CI/CD.",
  support: "Je suis orienté support client, résolution de problèmes et satisfaction utilisateur.",
};

const STATUS_LABELS = {
  active: { label: "En mission", color: "#22c55e" },
  queued: { label: "En attente", color: "#f59e0b" },
  idle: { label: "En veille", color: "#6b7280" },
  sleeping: { label: "Sommeil", color: "#4b5563" },
  error: { label: "Erreur", color: "#ef4444" },
};

export default function AgentOverlay({ agent, onClose }) {
  const explanation = useMemo(() => {
    if (!agent) return "";
    return ROLE_EXPLANATIONS[agent.role] || agent.personality || "Membre de l'équipage. Lance une mission pour me voir en action.";
  }, [agent]);

  const health = useWorldStore((s) => s.getAgentHealth(agent?.name));
  const sick = useWorldStore((s) => s.isAgentSick(agent?.name));

  if (!agent) return null;

  const color = agent.color || "#4ecdc4";
  const statusInfo = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
  const healthPct = Math.round((health ?? 1) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded-xl border border-white/8 bg-[#0a0818]/98 shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b border-white/5"
          style={{ background: `linear-gradient(135deg, ${color}10, transparent)` }}
        >
          <div className="flex items-center gap-4">
            <AgentAvatar agent={agent} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron text-base font-bold tracking-wide" style={{ color }}>{agent.name}</h2>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                  style={{ color: statusInfo.color, borderColor: `${statusInfo.color}40`, backgroundColor: `${statusInfo.color}10` }}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{agent.role || "Agent"}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">{explanation}</p>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-500 font-mono">Santé</span>
                <span className="text-[9px] font-mono" style={{ color: sick ? "#ef4444" : color }}>{healthPct}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${healthPct}%`,
                    backgroundColor: sick ? "#ef4444" : color,
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-500 font-mono">XP</p>
              <p className="text-sm font-mono font-bold" style={{ color }}>{agent.xp ?? 0}</p>
            </div>
          </div>

          {agent.mcps && agent.mcps.length > 0 && (
            <div>
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-1">MCPs équipés</p>
              <div className="flex flex-wrap gap-1">
                {agent.mcps.map((mcp) => (
                  <span key={mcp} className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/3 text-gray-400">
                    {mcp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-500 hover:text-gray-300 text-xs font-mono transition-colors"
          >
            Fermer
          </button>
          <a
            href="#/classic/ops"
            className="px-4 py-2 rounded-lg text-black font-bold text-xs font-mono inline-block transition-colors"
            style={{ background: color }}
          >
            Lancer une mission
          </a>
        </div>
      </div>
    </div>
  );
}
