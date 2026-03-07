import { useState } from "react";
import { useStore } from "../store/useStore";
import { AGENT_ROLES, AGENT_ROLE_LABELS, MCP_CATALOG } from "../lib/constants";

const AVATARS = ["🛡️", "🔮", "📜", "📡", "👻", "⚒️", "🔬", "📊", "✉️", "🎯"];
const COLORS = ["#00f0ff", "#a855f7", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"];

export default function Quarters() {
  const { agents, addAgent, updateAgent, removeAgent, mcps, canAddAgent, getPlanLimit } = useStore();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "analyst",
    avatar: "🔮",
    color: COLORS[1],
    personality: "Tu es un agent spécialisé. Tu exécutes les tâches avec précision.",
    mcpIds: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateAgent(editing.id, form);
      setEditing(null);
    } else {
      if (!canAddAgent()) return;
      addAgent({
        ...form,
        level: 1,
        xp: 0,
        missions: 0,
        successRate: 100,
        status: "idle",
      });
    }
    setForm({ name: "", role: "analyst", avatar: "🔮", color: COLORS[1], personality: "", mcpIds: [] });
    setShowForm(false);
  };

  const toggleMcp = (id) => {
    setForm((f) => ({
      ...f,
      mcpIds: f.mcpIds.includes(id) ? f.mcpIds.filter((x) => x !== id) : [...f.mcpIds, id],
    }));
  };

  const atLimit = !canAddAgent();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="font-orbitron text-xs font-bold text-gray-400 tracking-wide">ÉQUIPE — Gestion des agents</span>
        <button
          onClick={() => setShowForm(true)}
          disabled={atLimit}
          className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg bg-synth-purple/10 border border-synth-purple/30 text-synth-purple disabled:opacity-50"
        >
          + Recruter un agent
        </button>
      </div>

      {atLimit && (
        <div className="rounded-xl border border-synth-amber/30 bg-synth-amber/5 px-4 py-3 font-jetbrains text-xs text-synth-amber">
          Limite du plan Explorer atteinte ({agents.length}/{getPlanLimit("agents")} agents). Passe au plan Captain pour en ajouter.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-xl border border-synth-border bg-synth-panel p-4 relative"
            style={{ borderLeftColor: agent.color, borderLeftWidth: "3px" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <AgentAvatar agent={agent} size="md" />
              <div>
                <div className="font-jetbrains font-bold text-sm" style={{ color: agent.color }}>
                  {agent.name}
                </div>
                <div className="font-jetbrains text-xs text-gray-500">{AGENT_ROLE_LABELS[agent.role] || agent.role}</div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap mb-2">
              {(mcps || []).filter((m) => agent.mcpIds?.includes(m.id)).map((m) => (
                <span key={m.id} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                  {m.name}
                </span>
              ))}
            </div>
            <div className="font-jetbrains text-[10px] text-gray-500">
              LVL {agent.level} · {agent.missions} missions · {agent.successRate}%
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setEditing(agent);
                  setForm({
                    name: agent.name,
                    role: agent.role,
                    avatar: agent.avatar,
                    color: agent.color,
                    personality: agent.personality || "",
                    mcpIds: agent.mcpIds || [],
                  });
                  setShowForm(true);
                }}
                className="text-[10px] text-synth-cyan"
              >
                Modifier
              </button>
              <button onClick={() => removeAgent(agent.id)} className="text-[10px] text-synth-red">
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="rounded-xl border border-synth-border bg-synth-bg max-w-md w-full p-6 shadow-xl">
            <h3 className="font-orbitron text-sm font-bold text-synth-cyan mb-4">
              {editing ? "Modifier l'agent" : "Recruter un agent"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-jetbrains text-[10px] text-gray-500 mb-1">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                  className="w-full bg-white/5 border border-synth-border rounded-lg px-3 py-2 font-jetbrains text-sm"
                  placeholder="EX: SENTINEL"
                />
              </div>
              <div>
                <label className="block font-jetbrains text-[10px] text-gray-500 mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white/5 border border-synth-border rounded-lg px-3 py-2 font-jetbrains text-sm"
                >
                  {AGENT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {AGENT_ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-jetbrains text-[10px] text-gray-500">Avatar</span>
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                    className={`text-xl p-1 rounded ${form.avatar === a ? "ring-2 ring-synth-cyan" : ""}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div>
                <label className="block font-jetbrains text-[10px] text-gray-500 mb-1">MCPs (équipement)</label>
                <div className="flex flex-wrap gap-2">
                  {(mcps || MCP_CATALOG).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMcp(m.id)}
                      className={`text-[10px] px-2 py-1 rounded border ${
                        form.mcpIds.includes(m.id) ? "border-synth-cyan bg-synth-cyan/10 text-synth-cyan" : "border-synth-border text-gray-500"
                      }`}
                    >
                      {m.icon} {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false) || setEditing(null)} className="font-jetbrains text-xs text-gray-400">
                  Annuler
                </button>
                <button type="submit" className="font-orbitron text-xs font-bold px-4 py-2 rounded-lg bg-synth-cyan/20 text-synth-cyan border border-synth-cyan/30">
                  {editing ? "Enregistrer" : "Recruter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
