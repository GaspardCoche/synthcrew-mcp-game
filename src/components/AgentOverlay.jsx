import { useMemo } from "react";
import AgentAvatar from "./AgentAvatar";

const ROLE_EXPLANATIONS = {
  data_ops: "Je récupère et structure les données (tickets, exports, bases). Tu peux me confier Zendesk, HubSpot, des CSV.",
  analyst: "J’analyse les tendances, le sentiment, les métriques. Donne-moi des données et je te renvoie des insights.",
  writer: "Je rédige rapports, pages Notion, docs. Je synthétise et structure l’information.",
  communicator: "J’envoie des résumés et notifications : Slack, Gmail, messages d’équipe.",
  scraper: "Je collecte des infos sur le web : recherche, veille, extraction de contenu.",
  developer: "Je gère le code : PRs, revues, Jira, Linear, déploiements.",
  support: "Je suis orienté support client et résolution de problèmes.",
};

export default function AgentOverlay({ agent, onClose }) {
  const explanation = useMemo(() => {
    if (!agent) return "";
    return ROLE_EXPLANATIONS[agent.role] || agent.personality || "Je suis un membre de l’équipage. Dis-moi ce que tu veux faire.";
  }, [agent]);

  if (!agent) return null;

  const color = agent.color || "#00f0ff";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0d0a18]/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderLeftColor: color, borderLeftWidth: "4px" }}
      >
        <div className="flex items-center gap-4 mb-4">
          <AgentAvatar agent={agent} size="lg" />
          <div>
            <h2 className="font-bold text-lg text-white" style={{ color }}>{agent.name}</h2>
            <p className="text-sm text-gray-400">{agent.role || "Agent"}</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed mb-6">{explanation}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 hover:bg-white/5"
          >
            Fermer
          </button>
          <a
            href="#/classic/ops"
            className="px-4 py-2 rounded-lg text-black font-medium inline-block"
            style={{ background: color }}
          >
            Atelier avec {agent.name}
          </a>
        </div>
      </div>
    </div>
  );
}
