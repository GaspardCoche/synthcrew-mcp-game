/**
 * Quarters — Gestion des agents avec wizard RPG style.
 * Étapes : 1) Choisir la classe  2) Personnaliser  3) Équiper (MCPs)
 */
import { useState } from "react";
import { useStore } from "../store/useStore";
import { useEventStore, EVENT_TYPES } from "../store/eventStore";
import { AGENT_ROLES, AGENT_ROLE_LABELS, MCP_CATALOG } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

// ── Définition des classes RPG ─────────────────────────────────────────────
const CLASSES = [
  {
    role: "orchestrator",
    label: "Orchestrateur",
    icon: "🎯",
    color: "#eab308",
    tagline: "Comprend, planifie, délègue",
    desc: "Il analyse le besoin, pose les bonnes questions et compose l'équipe idéale. La mémoire vivante de ta crew.",
    defaultPersonality: "Tu es l'orchestrateur. Tu analyses les demandes, identifies les agents nécessaires et coordonnes leur travail. Tu poses des questions précises avant d'agir.",
    suggestedMcps: [],
  },
  {
    role: "developer",
    label: "Développeur",
    icon: "⚒️",
    color: "#ec4899",
    tagline: "Code, commit, review",
    desc: "Lit et écrit du code, ouvre des PRs, revue des diffs. Ton ingénieur autonome.",
    defaultPersonality: "Tu es un développeur expert. Tu lis le code, détectes les bugs, proposes des améliorations et exécutes des tâches de développement avec précision.",
    suggestedMcps: ["github", "filesystem"],
  },
  {
    role: "analyst",
    label: "Analyste",
    icon: "🔮",
    color: "#a855f7",
    tagline: "Données, tendances, patterns",
    desc: "Fouille les bases de données, identifie des patterns et produit des insights actionnables.",
    defaultPersonality: "Tu es un analyste de données. Tu interroges des bases, identifies des tendances et résumes des insights de manière claire et structurée.",
    suggestedMcps: ["postgres"],
  },
  {
    role: "writer",
    label: "Rédacteur",
    icon: "📜",
    color: "#f59e0b",
    tagline: "Rapports, doc, résumés",
    desc: "Produit de la documentation claire, des rapports structurés et des synthèses lisibles.",
    defaultPersonality: "Tu es un rédacteur expert. Tu produis des documents clairs, bien structurés et adaptés au public cible.",
    suggestedMcps: ["notion"],
  },
  {
    role: "data_ops",
    label: "Data Ops",
    icon: "🛡️",
    color: "#00f0ff",
    tagline: "Collecte, structure, nettoie",
    desc: "Récupère des données depuis des APIs, les structure et les rend exploitables pour les autres agents.",
    defaultPersonality: "Tu es un agent Data Ops. Tu récupères, nettoies et structures des données de manière fiable pour les autres membres de l'équipe.",
    suggestedMcps: ["zendesk", "filesystem"],
  },
  {
    role: "communicator",
    label: "Communicant",
    icon: "📡",
    color: "#22c55e",
    tagline: "Notifie, résume, diffuse",
    desc: "Envoie des messages Slack, rédige des emails et notifie les équipes au bon moment.",
    defaultPersonality: "Tu es un agent de communication. Tu envoies des messages clairs, concis et pertinents aux bonnes personnes au bon moment.",
    suggestedMcps: ["slack", "gmail"],
  },
  {
    role: "scraper",
    label: "Scraper",
    icon: "👻",
    color: "#ef4444",
    tagline: "Web, veille, extraction",
    desc: "Parcourt le web, extrait des informations et alimente les autres agents en données fraîches.",
    defaultPersonality: "Tu es un agent de veille web. Tu effectues des recherches, extrais des informations pertinentes et les synthétises pour l'équipe.",
    suggestedMcps: ["brave-search"],
  },
  {
    role: "support",
    label: "Support",
    icon: "🎫",
    color: "#84cc16",
    tagline: "Tickets, priorisation, réponses",
    desc: "Trie et répond aux tickets de support, identifie les urgences et maintient la satisfaction client.",
    defaultPersonality: "Tu es un agent support. Tu analyses les tickets, évalues leur priorité et proposes des réponses adaptées et empathiques.",
    suggestedMcps: ["zendesk", "slack"],
  },
];

const COLORS = ["#00f0ff", "#a855f7", "#f59e0b", "#22c55e", "#ef4444", "#ec4899", "#eab308", "#84cc16", "#8b9dc3"];

const STATUS_LABELS = {
  active:   { label: "EN MISSION", color: "#00f0ff" },
  idle:     { label: "EN VEILLE",  color: "#6b7280" },
  queued:   { label: "EN ATTENTE", color: "#f59e0b" },
  sleeping: { label: "SOMMEIL",    color: "#374151" },
  error:    { label: "ERREUR",     color: "#ef4444" },
};

function AgentCard({ agent, mcps, onEdit, onRemove }) {
  const cfg = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
  const agentMcps = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id));
  const cls = CLASSES.find((c) => c.role === agent.role);

  return (
    <div
      className="agent-card glass-panel p-4 group"
      style={{ borderLeft: `3px solid ${agent.color}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <AgentAvatar agent={agent} size="md" />
          <div>
            <div className="text-sm font-bold tracking-wide" style={{ color: agent.color }}>
              {agent.name}
            </div>
            <div className="text-[10px] text-gray-500">
              {cls?.label || AGENT_ROLE_LABELS[agent.role] || agent.role}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: cfg.color,
              boxShadow: agent.status === "active" ? `0 0 6px ${cfg.color}` : "none",
              animation: agent.status === "active" ? "pulse 2s infinite" : "none",
            }}
          />
          <span className="text-[9px] font-bold tracking-widest" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Class description */}
      {cls && (
        <div className="text-[10px] text-gray-600 mb-3 leading-relaxed border-l border-white/5 pl-2">
          {cls.tagline}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[10px] text-gray-600">LVL <span className="text-gray-400">{agent.level}</span></div>
        <div className="text-[10px] text-gray-600">{agent.missions} <span className="text-gray-500">missions</span></div>
        <div className="text-[10px]" style={{ color: agent.successRate >= 95 ? "#22c55e" : "#f59e0b" }}>
          {agent.successRate}% réussite
        </div>
      </div>

      {/* XP bar */}
      <div className="xp-bar mb-3">
        <div
          className="xp-bar-fill"
          style={{
            width: `${agent.xp ?? 0}%`,
            background: `linear-gradient(90deg, ${agent.color}60, ${agent.color})`,
          }}
        />
      </div>

      {/* MCPs */}
      {agentMcps.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {agentMcps.map((m) => (
            <span key={m.id} className="class-badge">
              {m.icon} {m.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(agent)}
          className="text-[10px] px-2 py-1 rounded border transition-colors"
          style={{ borderColor: "rgba(0,240,255,0.2)", color: "#00f0ff" }}
        >
          Modifier
        </button>
        {agent.role !== "orchestrator" && (
          <button
            onClick={() => onRemove(agent.id)}
            className="text-[10px] px-2 py-1 rounded border transition-colors"
            style={{ borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}
          >
            Retirer
          </button>
        )}
      </div>
    </div>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────
const WIZARD_STEPS = ["Classe", "Identité", "Équipement"];

function WizardModal({ editing, onClose, onSubmit, mcps }) {
  const editCls = editing ? CLASSES.find((c) => c.role === editing.role) : null;
  const [step, setStep] = useState(editing ? 1 : 0);
  const [form, setForm] = useState({
    name: editing?.name || "",
    role: editing?.role || "analyst",
    color: editing?.color || COLORS[0],
    personality: editing?.personality || "",
    mcpIds: editing?.mcpIds || [],
  });

  const selectedClass = CLASSES.find((c) => c.role === form.role);

  const handleClassSelect = (cls) => {
    setForm((f) => ({
      ...f,
      role: cls.role,
      color: cls.color,
      personality: f.personality || cls.defaultPersonality,
      mcpIds: f.mcpIds.length ? f.mcpIds : cls.suggestedMcps,
    }));
    setStep(1);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d0f18, #06070c)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,240,255,0.06)",
        }}
      >
        {/* Wizard header */}
        <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-orbitron text-sm font-black tracking-widest"
              style={{
                background: "linear-gradient(90deg, #00f0ff, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {editing ? "MODIFIER L'AGENT" : "RECRUTER UN AGENT"}
            </h3>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-sm">✕</button>
          </div>
          {/* Step indicators */}
          <div className="flex gap-2">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  className="flex items-center gap-1.5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                    style={{
                      background: i === step ? "#00f0ff" : i < step ? "rgba(0,240,255,0.2)" : "rgba(255,255,255,0.06)",
                      color: i === step ? "#06070c" : i < step ? "#00f0ff" : "#6b7280",
                    }}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-bold tracking-wider"
                    style={{ color: i === step ? "#00f0ff" : i < step ? "#9ca3af" : "#4b5563" }}
                  >
                    {s}
                  </span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className="w-8 h-px" style={{ background: i < step ? "rgba(0,240,255,0.3)" : "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6" style={{ minHeight: 300 }}>

          {/* STEP 0 — Classe */}
          {step === 0 && (
            <div>
              <p className="text-[11px] text-gray-500 mb-4">
                Chaque classe définit le rôle et les capacités de l'agent dans ta crew.
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                {CLASSES.map((cls) => (
                  <button
                    key={cls.role}
                    onClick={() => handleClassSelect(cls)}
                    className="text-left p-3 rounded-xl border transition-all"
                    style={{
                      background: form.role === cls.role ? `${cls.color}10` : "rgba(255,255,255,0.02)",
                      borderColor: form.role === cls.role ? `${cls.color}40` : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{cls.icon}</span>
                      <div>
                        <div className="text-xs font-bold" style={{ color: cls.color }}>{cls.label}</div>
                        <div className="text-[9px] text-gray-600">{cls.tagline}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 leading-relaxed">{cls.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 — Identité */}
          {step === 1 && (
            <div className="space-y-4">
              {selectedClass && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${selectedClass.color}08`, border: `1px solid ${selectedClass.color}20` }}
                >
                  <span className="text-2xl">{selectedClass.icon}</span>
                  <div>
                    <div className="text-xs font-bold" style={{ color: selectedClass.color }}>{selectedClass.label}</div>
                    <div className="text-[10px] text-gray-500">{selectedClass.tagline}</div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 tracking-wider uppercase">Nom de l'agent</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                  className="w-full rounded-lg px-3 py-2 text-sm font-bold tracking-wider focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: form.name ? `1px solid ${selectedClass?.color || "#00f0ff"}40` : "1px solid rgba(255,255,255,0.08)",
                    color: selectedClass?.color || "#e5e7eb",
                  }}
                  placeholder="EX: SENTINEL"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 tracking-wider uppercase">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        background: c,
                        boxShadow: form.color === c ? `0 0 0 2px #06070c, 0 0 0 4px ${c}` : "none",
                        opacity: form.color === c ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 tracking-wider uppercase">
                  Personnalité & instructions
                </label>
                <p className="text-[10px] text-gray-600 mb-2">
                  Ce texte devient le system prompt de l'agent. Il définit son comportement, son ton et ses priorités.
                </p>
                <textarea
                  value={form.personality}
                  onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none resize-none leading-relaxed"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#d1d5db",
                  }}
                  placeholder="Tu es un agent spécialisé dans..."
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Équipement MCPs */}
          {step === 2 && (
            <div>
              <p className="text-[11px] text-gray-500 mb-4">
                Sélectionne les outils MCP que cet agent peut utiliser. Les suggestions sont basées sur sa classe.
              </p>
              {selectedClass?.suggestedMcps?.length > 0 && (
                <div className="mb-3 text-[10px] text-gray-600">
                  Recommandés pour <span style={{ color: selectedClass.color }}>{selectedClass.label}</span> :
                  {" "}{selectedClass.suggestedMcps.join(", ")}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {(mcps || MCP_CATALOG).map((m) => {
                  const isSelected = form.mcpIds.includes(m.id);
                  const isSuggested = selectedClass?.suggestedMcps?.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          mcpIds: isSelected
                            ? f.mcpIds.filter((x) => x !== m.id)
                            : [...f.mcpIds, m.id],
                        }))
                      }
                      className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all"
                      style={{
                        background: isSelected ? "rgba(0,240,255,0.06)" : "rgba(255,255,255,0.02)",
                        borderColor: isSelected ? "rgba(0,240,255,0.25)" : isSuggested ? "rgba(212,165,116,0.2)" : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold" style={{ color: isSelected ? "#00f0ff" : "#9ca3af" }}>
                          {m.name}
                        </div>
                        <div className="text-[9px] text-gray-600">{m.category}</div>
                      </div>
                      {isSuggested && !isSelected && (
                        <span className="ml-auto text-[8px] text-synth-quest tracking-wider">REC.</span>
                      )}
                      {isSelected && (
                        <span className="ml-auto text-[10px] text-synth-cyan">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          className="px-6 pb-5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}
        >
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-3 py-2"
          >
            {step === 0 ? "Annuler" : "← Retour"}
          </button>
          <div className="flex gap-2">
            {step < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !form.name.trim()}
                className="font-orbitron text-xs font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.15))",
                  border: "1px solid rgba(0,240,255,0.25)",
                  color: "#00f0ff",
                }}
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim()}
                className="font-orbitron text-xs font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, rgba(0,240,255,0.2), rgba(168,85,247,0.2))",
                  border: "1px solid rgba(0,240,255,0.3)",
                  color: "#00f0ff",
                  boxShadow: "0 0 16px rgba(0,240,255,0.1)",
                }}
              >
                {editing ? "Enregistrer" : "◆ Recruter"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function Quarters() {
  const { agents, addAgent, updateAgent, removeAgent, mcps, canAddAgent, getPlanLimit } = useStore();
  const emit = useEventStore((s) => s.emit);
  const [editing, setEditing] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const handleSubmit = (form) => {
    if (editing) {
      updateAgent(editing.id, form);
      emit(EVENT_TYPES.AGENT_STATUS, `${form.name} mis à jour`);
    } else {
      if (!canAddAgent()) return;
      addAgent({ ...form, level: 1, xp: 0, missions: 0, successRate: 100, status: "idle" });
      emit(EVENT_TYPES.AGENT_STATUS, `${form.name} rejoint la crew !`);
    }
    setEditing(null);
    setShowWizard(false);
  };

  const handleEdit = (agent) => {
    setEditing(agent);
    setShowWizard(true);
  };

  const handleRemove = (id) => {
    const agent = agents.find((a) => a.id === id);
    removeAgent(id);
    if (agent) emit(EVENT_TYPES.AGENT_STATUS, `${agent.name} retiré de la crew`);
  };

  const atLimit = !canAddAgent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="section-title mb-1">ÉQUIPE</div>
          <div className="text-[11px] text-gray-500">
            {agents.length}/{getPlanLimit("agents") === Infinity ? "∞" : getPlanLimit("agents")} agents · Recrute, personnalise, équipe
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowWizard(true); }}
          disabled={atLimit}
          className="font-orbitron text-[10px] font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,240,255,0.08))",
            border: "1px solid rgba(168,85,247,0.25)",
            color: "#a855f7",
          }}
        >
          + Recruter
        </button>
      </div>

      {atLimit && (
        <div
          className="rounded-xl px-4 py-3 text-xs"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
        >
          Plan Explorer : limite de {getPlanLimit("agents")} agents atteinte. Passe au plan Captain pour en ajouter.
        </div>
      )}

      {/* Agents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            mcps={mcps}
            onEdit={handleEdit}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Wizard */}
      {showWizard && (
        <WizardModal
          editing={editing}
          mcps={mcps}
          onClose={() => { setShowWizard(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
