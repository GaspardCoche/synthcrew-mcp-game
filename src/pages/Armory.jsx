import { useStore } from "../store/useStore";

const OBJETS_UTILES = [
  { id: "tickets", name: "Tickets support", icon: "🎫", desc: "À donner à l’agent support / data", mcp: "Zendesk" },
  { id: "emails", name: "Boîte emails", icon: "✉️", desc: "À donner au communicant / writer", mcp: "Gmail" },
  { id: "repo", name: "Dépôt code", icon: "⌘", desc: "À donner au développeur", mcp: "GitHub" },
  { id: "notion", name: "Page Notion", icon: "📝", desc: "À donner au rédacteur", mcp: "Notion" },
  { id: "slack", name: "Canal Slack", icon: "💬", desc: "À donner au communicant", mcp: "Slack" },
  { id: "search", name: "Recherche web", icon: "🔍", desc: "À donner au scraper / analyste", mcp: "Brave Search" },
];

export default function Armory() {
  const { mcps, toggleMcp, getPlanLimit } = useStore();
  const connected = mcps.filter((m) => m.connected);

  return (
    <div className="space-y-6">
      <div className="font-orbitron text-xs font-bold text-gray-400 tracking-wide">OUTILS — MCPs & marketplace</div>
      <p className="font-jetbrains text-sm text-gray-500">
        Connecte les MCPs et consulte les objets que tu peux confier à ton équipe pour exécuter des missions.
      </p>

      <div className="rounded-xl border border-synth-purple/20 bg-synth-purple/5 p-4 space-y-3">
        <h4 className="font-orbitron text-[10px] font-bold text-synth-purple tracking-wide">MARKETPLACE MCP</h4>
        <p className="font-jetbrains text-[11px] text-gray-400">
          Un agent peut proposer ces outils si la mission le nécessite. Ils sont découvrables depuis l’Atelier ou le briefing.
        </p>
        <div className="flex flex-wrap gap-2">
          {mcps.map((m) => (
            <span
              key={m.id}
              className="font-jetbrains text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-synth-border text-gray-400"
            >
              {m.icon} {m.name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-orbitron text-[10px] font-bold text-synth-cyan tracking-wide mb-3">MCPs CONNECTÉS ({connected.length} / {getPlanLimit("mcps") === Infinity ? "∞" : getPlanLimit("mcps")})</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mcps.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMcp(m.id)}
              className={`rounded-xl border p-4 flex items-start gap-3 text-left transition-all ${
                m.connected ? "border-synth-green/30 bg-synth-green/5" : "border-synth-border bg-synth-panel"
              }`}
            >
              <span className="text-2xl shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-jetbrains font-semibold text-sm truncate">{m.name}</div>
                <div className="font-jetbrains text-[10px] text-gray-500 mb-1">{m.category}</div>
                {m.tools && m.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.tools.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">
                        {t}
                      </span>
                    ))}
                    {m.tools.length > 3 && <span className="text-[9px] text-gray-500">+{m.tools.length - 3}</span>}
                  </div>
                )}
              </div>
              <span className={`font-jetbrains text-[10px] shrink-0 ${m.connected ? "text-synth-green" : "text-gray-500"}`}>
                {m.connected ? "ON" : "OFF"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-orbitron text-[10px] font-bold text-amber-400/90 tracking-wide mb-3">OBJETS UTILES — À donner aux agents</h4>
        <p className="font-jetbrains text-[10px] text-gray-500 mb-3">Ressources utilisées par les agents selon la mission (Atelier).</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OBJETS_UTILES.map((o) => (
            <div key={o.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="text-xl">{o.icon}</span>
              <div className="font-jetbrains font-semibold text-xs mt-1">{o.name}</div>
              <div className="font-jetbrains text-[10px] text-gray-500">{o.desc}</div>
              <div className="font-jetbrains text-[9px] text-amber-400/80 mt-1">→ {o.mcp}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-synth-border bg-synth-panel p-4 font-jetbrains text-xs text-gray-500">
        Chaque MCP expose des <strong className="text-gray-400">tools</strong> (ex. list_issues, post_message). Le Mission Planner assigne les tâches aux agents en fonction des tools disponibles. MCP 2025 : resumable streams, progress notifications, agent-to-agent.
      </div>
    </div>
  );
}
