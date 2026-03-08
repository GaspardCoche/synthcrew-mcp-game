import { useStore } from "../store/useStore";

const STATUS_DOT = {
  active: "#4ecdc4",
  idle: "#6b7280",
  queued: "#ffd93d",
  error: "#ff6b6b",
  sleeping: "#4b5563",
};

export default function AgentQuickPicker({ onSelect, onClose }) {
  const agents = useStore((s) => s.agents);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-12 right-4 w-64 rounded-xl border border-white/10 bg-[#080c15]/98 backdrop-blur-xl shadow-2xl animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-white/5">
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Parler à un agent</p>
        </div>
        <div className="py-1 max-h-80 overflow-y-auto">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => { onSelect(agent); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/8 focus:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 rounded transition-colors text-left"
            >
              <span className="text-base">{agent.avatar || "🤖"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold" style={{ color: agent.color }}>{agent.name}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_DOT[agent.status] || STATUS_DOT.idle }}
                  />
                </div>
                <p className="text-[9px] text-gray-600 font-mono truncate">{agent.role}</p>
              </div>
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-gray-700" fill="currentColor">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
