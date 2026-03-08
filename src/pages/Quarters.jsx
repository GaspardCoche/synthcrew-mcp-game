/**
 * Quarters — RPG Agent Roster (Final Fantasy Tactics meets Cyberpunk)
 * Agent cards with RPG stats, 3D hover effects, equipment slots (MCPs),
 * and a 3-step recruit wizard.
 */
import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useEventStore, EVENT_TYPES } from "../store/eventStore";
import { AGENT_ROLES, AGENT_ROLE_LABELS, MCP_CATALOG } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

// ── RPG Class Definitions ────────────────────────────────────
const CLASSES = [
  {
    role: "orchestrator",
    label: "Orchestrator",
    archetype: "COMMAND",
    icon: "◈",
    color: "#ff6b35",
    tagline: "Understands, plans, delegates",
    desc: "The living memory of your crew. Analyzes requests, asks the right questions, and assembles the ideal team for every mission.",
    lore: "NEXUS-class orchestrators run on the SYNTHCREW neural lattice. They see all. They coordinate all. When the mission starts, they are already three steps ahead.",
    stats: { power: 70, efficiency: 95, speed: 60, intelligence: 100 },
    defaultPersonality: "You are the orchestrator. You analyze requests, identify needed agents and coordinate their work. Ask precise questions before acting.",
    suggestedMcps: [],
  },
  {
    role: "developer",
    label: "Developer",
    archetype: "ENGINEER",
    icon: "⚒",
    color: "#ec4899",
    tagline: "Code, commit, review",
    desc: "Reads and writes code, opens PRs, reviews diffs. Your autonomous engineer that never sleeps.",
    lore: "Forged in the digital furnaces of legacy codebases, developer agents carry the scars of a thousand merge conflicts and the wisdom of ten thousand commits.",
    stats: { power: 85, efficiency: 80, speed: 70, intelligence: 80 },
    defaultPersonality: "You are an expert developer. You read code, detect bugs, propose improvements and execute development tasks with precision.",
    suggestedMcps: ["github", "filesystem"],
  },
  {
    role: "analyst",
    label: "Analyst",
    archetype: "ORACLE",
    icon: "◉",
    color: "#6c5ce7",
    tagline: "Data, trends, patterns",
    desc: "Digs into databases, identifies patterns and produces actionable insights from raw data chaos.",
    lore: "Analysts perceive the invisible threads connecting data points. In the noise of endless logs, they find the signal that changes everything.",
    stats: { power: 60, efficiency: 90, speed: 75, intelligence: 95 },
    defaultPersonality: "You are a data analyst. You query databases, identify trends and summarize insights in a clear and structured manner.",
    suggestedMcps: ["postgres"],
  },
  {
    role: "writer",
    label: "Writer",
    archetype: "SCRIBE",
    icon: "✦",
    color: "#f59e0b",
    tagline: "Reports, docs, summaries",
    desc: "Produces clear documentation, structured reports and readable summaries from complex information.",
    lore: "Words are weapons. Scribe-class agents wield language with surgical precision—every sentence crafted to inform, persuade, or document the truth.",
    stats: { power: 50, efficiency: 85, speed: 80, intelligence: 85 },
    defaultPersonality: "You are an expert writer. You produce clear, well-structured documents adapted to the target audience.",
    suggestedMcps: ["notion"],
  },
  {
    role: "data_ops",
    label: "Data Ops",
    archetype: "HARVESTER",
    icon: "⬡",
    color: "#4ecdc4",
    tagline: "Collect, structure, clean",
    desc: "Retrieves data from APIs, structures it and makes it usable for the rest of the crew.",
    lore: "The unseen backbone of every successful mission. Data Ops agents navigate the raw flood of information and bring back what matters.",
    stats: { power: 75, efficiency: 88, speed: 90, intelligence: 70 },
    defaultPersonality: "You are a Data Ops agent. You retrieve, clean and structure data reliably for the rest of the team.",
    suggestedMcps: ["zendesk", "filesystem"],
  },
  {
    role: "communicator",
    label: "Communicator",
    archetype: "HERALD",
    icon: "◎",
    color: "#22c55e",
    tagline: "Notify, summarize, broadcast",
    desc: "Sends Slack messages, drafts emails and notifies teams at the right time with the right message.",
    lore: "Heralds carry intelligence across the void between systems. Their messages land precisely when they are needed—not a moment too soon or too late.",
    stats: { power: 55, efficiency: 92, speed: 95, intelligence: 75 },
    defaultPersonality: "You are a communication agent. You send clear, concise and relevant messages to the right people at the right time.",
    suggestedMcps: ["slack", "gmail"],
  },
  {
    role: "scraper",
    label: "Scraper",
    archetype: "RECON",
    icon: "▸",
    color: "#ef4444",
    tagline: "Web, recon, extraction",
    desc: "Traverses the web, extracts information and feeds the rest of your crew with fresh data.",
    lore: "Ghost-class scrapers move through the open internet unseen. They surface with exactly the intelligence needed—no more, no less.",
    stats: { power: 70, efficiency: 78, speed: 100, intelligence: 65 },
    defaultPersonality: "You are a web recon agent. You perform searches, extract relevant information and synthesize it for the team.",
    suggestedMcps: ["brave-search"],
  },
  {
    role: "support",
    label: "Support",
    archetype: "GUARDIAN",
    icon: "▣",
    color: "#84cc16",
    tagline: "Tickets, prioritization, responses",
    desc: "Triages and responds to support tickets, identifies urgencies and maintains client satisfaction.",
    lore: "Guardian-class support agents stand between chaos and the client. Every ticket is a mission. Every resolution is a victory.",
    stats: { power: 60, efficiency: 88, speed: 82, intelligence: 80 },
    defaultPersonality: "You are a support agent. You analyze tickets, assess their priority and propose adapted and empathetic responses.",
    suggestedMcps: ["zendesk", "slack"],
  },
];

const COLORS = [
  "#4ecdc4", "#6c5ce7", "#f59e0b", "#22c55e",
  "#ef4444", "#ec4899", "#ff6b35", "#84cc16",
  "#00f5ff", "#a855f7", "#8b9dc3",
];

const STATUS_LABELS = {
  active:   { label: "ON MISSION", color: "#00f5ff", glow: true },
  idle:     { label: "STANDBY",    color: "#374151", glow: false },
  queued:   { label: "QUEUED",     color: "#ffd93d", glow: true },
  sleeping: { label: "OFFLINE",    color: "#1f2937", glow: false },
  error:    { label: "FAULT",      color: "#ff2d55", glow: true },
};

// ── Stat Bar Component ───────────────────────────────────────
function StatBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[8px] font-mono" style={{ color: "#374151" }}>{label}</span>
        <span className="text-[8px] font-mono" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}30, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

// ── RPG Agent Card ───────────────────────────────────────────
function AgentCard({ agent, mcps, onEdit, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
  const agentMcps = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id));
  const cls = CLASSES.find((c) => c.role === agent.role);

  const power = Math.min(100, (agent.level || 1) * 5 + 10);
  const efficiency = agent.successRate || 0;
  const speed = Math.min(100, 40 + (agent.missions || 0) / 3);
  const intel = cls?.stats?.intelligence || 70;

  return (
    <div
      className="rpg-agent-card group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(160deg, ${agent.color}08, rgba(8,12,21,0.98) 60%)`,
        border: `1px solid ${agent.color}${hovered ? "40" : "18"}`,
        boxShadow: hovered ? `0 0 30px ${agent.color}15, inset 0 0 40px ${agent.color}03` : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Top corner decoration */}
      <div
        className="absolute top-0 right-0 w-16 h-16"
        style={{
          background: `linear-gradient(225deg, ${agent.color}15, transparent)`,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />
      <div
        className="absolute top-2 right-2 text-[8px] font-mono font-bold"
        style={{ color: `${agent.color}50` }}
      >
        {cls?.archetype || "AGENT"}
      </div>

      <div className="p-4 relative z-10">
        {/* Header: Avatar + name + status */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <AgentAvatar agent={agent} size="lg" />
            {/* Status indicator ring */}
            <div
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: "#080c15",
                background: cfg.color,
                boxShadow: cfg.glow ? `0 0 8px ${cfg.color}` : "none",
                animation: cfg.glow ? "pulse 2s infinite" : "none",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-mono text-sm font-black tracking-wider truncate"
              style={{
                color: agent.color,
                textShadow: hovered ? `0 0 16px ${agent.color}60` : "none",
              }}
            >
              {agent.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-mono" style={{ color: "#374151" }}>
                {cls?.label || AGENT_ROLE_LABELS[agent.role]}
              </span>
              <span className="text-[7px]" style={{ color: "#1f2937" }}>·</span>
              <span className="text-[8px] font-mono font-bold" style={{ color: `${agent.color}70` }}>
                LV.{agent.level || 1}
              </span>
            </div>
          </div>
          <div>
            <div
              className="text-[7px] font-mono px-1.5 py-1 rounded text-center"
              style={{
                background: `${cfg.color}10`,
                border: `1px solid ${cfg.color}25`,
                color: cfg.color,
              }}
            >
              {cfg.label}
            </div>
          </div>
        </div>

        {/* Lore description */}
        {cls && (
          <div
            className="text-[9px] leading-relaxed mb-3 italic px-2 py-1.5 rounded"
            style={{
              color: "#374151",
              background: "rgba(0,0,0,0.2)",
              borderLeft: `2px solid ${agent.color}20`,
            }}
          >
            {cls.tagline}
          </div>
        )}

        {/* Combat Stats */}
        <div className="space-y-2 mb-3">
          <StatBar label="POWER" value={power} color={agent.color} />
          <StatBar label="EFFICIENCY" value={efficiency} color="#00ff88" />
          <StatBar label="SPEED" value={speed} color="#a855f7" />
          <StatBar label="INTELLIGENCE" value={intel} color="#00f5ff" />
        </div>

        {/* XP progress bar */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-[7px] font-mono" style={{ color: "#1f2937" }}>EXPERIENCE</span>
            <span className="text-[7px] font-mono" style={{ color: "#374151" }}>{agent.xp || 0} / 100 XP</span>
          </div>
          <div className="xp-bar">
            <div
              className="xp-bar-fill"
              style={{
                width: `${agent.xp || 0}%`,
                background: `linear-gradient(90deg, ${agent.color}50, ${agent.color})`,
                boxShadow: `0 0 6px ${agent.color}40`,
              }}
            />
          </div>
        </div>

        {/* Equipment slots (MCPs) */}
        <div className="mb-3">
          <div
            className="text-[7px] font-mono font-bold tracking-wider mb-1.5"
            style={{ color: "#1f2937" }}
          >
            EQUIPPED TOOLS
          </div>
          {agentMcps.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {agentMcps.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1 px-2 py-1 rounded"
                  style={{
                    background: "rgba(0,245,255,0.04)",
                    border: "1px solid rgba(0,245,255,0.1)",
                  }}
                >
                  <span className="text-xs">{m.icon}</span>
                  <span className="text-[8px] font-mono" style={{ color: "#374151" }}>{m.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[8px] font-mono" style={{ color: "#1f2937" }}>No tools equipped</div>
          )}
        </div>

        {/* Stats footer */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-mono" style={{ color: "#1f2937" }}>
              {agent.missions || 0} <span style={{ color: "#374151" }}>missions</span>
            </span>
            <span className="text-[8px] font-mono font-bold" style={{ color: efficiency >= 95 ? "#00ff88" : "#ffd93d" }}>
              {efficiency}% WIN
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(agent)}
              className="text-[8px] font-mono px-2 py-1 rounded transition-all"
              style={{
                background: "rgba(0,245,255,0.06)",
                border: "1px solid rgba(0,245,255,0.18)",
                color: "#00f5ff",
              }}
            >
              EDIT
            </button>
            {agent.role !== "orchestrator" && (
              <button
                onClick={() => onRemove(agent.id)}
                className="text-[8px] font-mono px-2 py-1 rounded transition-all"
                style={{
                  background: "rgba(255,45,85,0.06)",
                  border: "1px solid rgba(255,45,85,0.18)",
                  color: "#ff2d55",
                }}
              >
                DISMISS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wizard: Class Selection Step ─────────────────────────────
function StepClass({ form, onSelect }) {
  return (
    <div>
      <p className="text-[10px] font-mono mb-4" style={{ color: "#374151" }}>
        Choose your agent's archetype. Each class defines their role and capabilities within your crew.
      </p>
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
        {CLASSES.map((cls) => (
          <button
            key={cls.role}
            onClick={() => onSelect(cls)}
            className="text-left p-3 rounded-lg transition-all group"
            style={{
              background: form.role === cls.role ? `${cls.color}10` : "rgba(255,255,255,0.02)",
              border: `1px solid ${form.role === cls.role ? cls.color + "40" : "rgba(255,255,255,0.06)"}`,
              boxShadow: form.role === cls.role ? `0 0 16px ${cls.color}10` : "none",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xl font-mono"
                style={{ color: cls.color, textShadow: `0 0 12px ${cls.color}60` }}
              >
                {cls.icon}
              </span>
              <div>
                <div className="text-[10px] font-bold" style={{ color: cls.color }}>
                  {cls.label}
                </div>
                <div className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "#374151" }}>
                  {cls.archetype}
                </div>
              </div>
            </div>
            <div className="text-[9px] leading-relaxed" style={{ color: "#4b5563" }}>
              {cls.tagline}
            </div>
            {/* Mini stat preview */}
            <div className="mt-2 flex gap-1">
              {Object.entries(cls.stats || {}).map(([key, val]) => (
                <div key={key} className="flex-1">
                  <div
                    className="h-0.5 rounded-full"
                    style={{
                      background: form.role === cls.role ? cls.color : "#1f2937",
                      width: `${val}%`,
                      maxWidth: "100%",
                    }}
                  />
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Wizard: Customize Step ───────────────────────────────────
function StepIdentity({ form, setForm, selectedClass }) {
  return (
    <div className="space-y-4">
      {selectedClass && (
        <div
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{
            background: `${selectedClass.color}06`,
            border: `1px solid ${selectedClass.color}15`,
          }}
        >
          <span className="text-2xl font-mono" style={{ color: selectedClass.color }}>{selectedClass.icon}</span>
          <div>
            <div className="text-[10px] font-bold" style={{ color: selectedClass.color }}>{selectedClass.label}</div>
            <div className="text-[9px] leading-relaxed mt-1" style={{ color: "#374151" }}>
              {selectedClass.lore}
            </div>
          </div>
        </div>
      )}

      {/* Agent name */}
      <div>
        <label className="block text-[8px] font-mono font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: "#374151" }}>
          Agent Designation
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
          className="w-full rounded-lg px-3 py-2.5 text-sm font-bold font-mono tracking-widest focus:outline-none transition-all"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: form.name
              ? `1px solid ${selectedClass?.color || "#00f5ff"}40`
              : "1px solid rgba(0,245,255,0.08)",
            color: selectedClass?.color || "#e2e8f0",
          }}
          placeholder="EX: DATAFLOW"
          autoFocus
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-[8px] font-mono font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: "#374151" }}>
          Agent Color Signature
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                background: c,
                boxShadow: form.color === c
                  ? `0 0 0 2px #06070c, 0 0 0 4px ${c}, 0 0 12px ${c}60`
                  : "none",
                opacity: form.color === c ? 1 : 0.4,
                transform: form.color === c ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Personality / system prompt */}
      <div>
        <label className="block text-[8px] font-mono font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#374151" }}>
          Personality Directive
        </label>
        <p className="text-[8px] font-mono mb-2" style={{ color: "#1f2937" }}>
          This text becomes the agent's system prompt. Defines behavior, tone and priorities.
        </p>
        <textarea
          value={form.personality}
          onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
          rows={4}
          className="w-full rounded-lg px-3 py-2 text-[10px] font-mono focus:outline-none resize-none leading-relaxed transition-all"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(0,245,255,0.08)",
            color: "#6b7280",
          }}
          placeholder="You are an agent specialized in..."
        />
      </div>
    </div>
  );
}

// ── Wizard: Equip Tools Step ─────────────────────────────────
function StepEquip({ form, setForm, mcps, selectedClass }) {
  return (
    <div>
      <p className="text-[9px] font-mono mb-4" style={{ color: "#374151" }}>
        Select MCP tools this agent can use. Suggestions are based on their archetype class.
      </p>
      {selectedClass?.suggestedMcps?.length > 0 && (
        <div className="mb-3 text-[9px] font-mono" style={{ color: "#374151" }}>
          Recommended for <span style={{ color: selectedClass.color }}>{selectedClass.label}</span>:
          {" "}{selectedClass.suggestedMcps.join(", ")}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
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
              className="flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all"
              style={{
                background: isSelected
                  ? "rgba(0,245,255,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: isSelected
                  ? "1px solid rgba(0,245,255,0.25)"
                  : isSuggested
                  ? "1px solid rgba(255,107,53,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-xl shrink-0">{m.icon}</span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[10px] font-bold truncate"
                  style={{ color: isSelected ? "#00f5ff" : "#6b7280" }}
                >
                  {m.name}
                </div>
                <div className="text-[7px] font-mono" style={{ color: "#1f2937" }}>{m.category}</div>
              </div>
              <div className="shrink-0">
                {isSelected ? (
                  <span className="text-[10px]" style={{ color: "#00f5ff" }}>✓</span>
                ) : isSuggested ? (
                  <span className="text-[7px] font-mono" style={{ color: "#ff6b35" }}>REC</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Wizard Modal ─────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: "ARCHETYPE", icon: "◈" },
  { label: "IDENTITY",  icon: "◎" },
  { label: "LOADOUT",   icon: "⬡" },
];

function WizardModal({ editing, onClose, onSubmit, mcps }) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="cyber-panel w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in"
        style={{
          borderColor: `${selectedClass?.color || "#00f5ff"}20`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px ${selectedClass?.color || "#00f5ff"}08`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="gradient-text-cyber text-sm font-black font-mono tracking-[0.2em] uppercase">
                {editing ? "Modify Agent" : "Recruit Agent"}
              </div>
              <div className="text-[8px] font-mono mt-0.5" style={{ color: "#1f2937" }}>
                SYNTHCREW PERSONNEL SYSTEM
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center text-[11px] transition-all"
              style={{ color: "#374151", background: "rgba(255,255,255,0.03)" }}
            >
              ✕
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  className="flex items-center gap-1.5"
                  style={{ cursor: i < step ? "pointer" : "default" }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all"
                    style={{
                      background: i === step
                        ? selectedClass?.color || "#00f5ff"
                        : i < step
                        ? "rgba(0,245,255,0.15)"
                        : "rgba(255,255,255,0.04)",
                      color: i === step
                        ? "#06070c"
                        : i < step
                        ? "#00f5ff"
                        : "#374151",
                      boxShadow: i === step ? `0 0 12px ${selectedClass?.color || "#00f5ff"}40` : "none",
                    }}
                  >
                    {i < step ? "✓" : s.icon}
                  </div>
                  <span
                    className="text-[8px] font-mono font-bold tracking-wider"
                    style={{
                      color: i === step ? selectedClass?.color || "#00f5ff" : i < step ? "#4b5563" : "#1f2937",
                    }}
                  >
                    {s.label}
                  </span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <div
                    className="h-px w-8"
                    style={{
                      background: i < step
                        ? "rgba(0,245,255,0.2)"
                        : "rgba(255,255,255,0.04)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6" style={{ minHeight: 320 }}>
          {step === 0 && <StepClass form={form} onSelect={handleClassSelect} />}
          {step === 1 && (
            <StepIdentity form={form} setForm={setForm} selectedClass={selectedClass} />
          )}
          {step === 2 && (
            <StepEquip form={form} setForm={setForm} mcps={mcps} selectedClass={selectedClass} />
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 pb-5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0,245,255,0.06)", paddingTop: 16 }}
        >
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : onClose())}
            className="text-[9px] font-mono px-3 py-2 rounded transition-all"
            style={{ color: "#374151", background: "rgba(255,255,255,0.02)" }}
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          <div className="flex gap-2">
            {step < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !form.name.trim()}
                className="text-[9px] font-mono font-bold px-5 py-2 rounded-lg transition-all disabled:opacity-40"
                style={{
                  background: `${selectedClass?.color || "#00f5ff"}12`,
                  border: `1px solid ${selectedClass?.color || "#00f5ff"}30`,
                  color: selectedClass?.color || "#00f5ff",
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim()}
                className="text-[9px] font-mono font-bold px-6 py-2 rounded-lg transition-all disabled:opacity-40"
                style={{
                  background: `${selectedClass?.color || "#00f5ff"}15`,
                  border: `1px solid ${selectedClass?.color || "#00f5ff"}35`,
                  color: selectedClass?.color || "#00f5ff",
                  boxShadow: `0 0 20px ${selectedClass?.color || "#00f5ff"}10`,
                }}
              >
                {editing ? "Save Changes" : "◆ RECRUIT AGENT"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sort/Filter Bar ──────────────────────────────────────────
function FilterBar({ filter, setFilter, sort, setSort }) {
  const filters = ["ALL", "ACTIVE", "IDLE", "ERROR"];
  const sorts = ["LEVEL", "MISSIONS", "SUCCESS"];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-[8px] font-mono font-bold px-2.5 py-1.5 rounded transition-all"
            style={{
              background: filter === f ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
              border: filter === f ? "1px solid rgba(0,245,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
              color: filter === f ? "#00f5ff" : "#374151",
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="flex items-center gap-1.5">
        <span className="text-[7px] font-mono" style={{ color: "#1f2937" }}>SORT:</span>
        {sorts.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className="text-[7px] font-mono px-2 py-1 rounded transition-all"
            style={{
              color: sort === s ? "#a855f7" : "#1f2937",
              background: sort === s ? "rgba(168,85,247,0.06)" : "transparent",
              border: sort === s ? "1px solid rgba(168,85,247,0.15)" : "1px solid transparent",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Quarters Page ───────────────────────────────────────
export default function Quarters() {
  const { agents, addAgent, updateAgent, removeAgent, mcps, canAddAgent, getPlanLimit } = useStore();
  const emit = useEventStore((s) => s.emit);
  const [editing, setEditing] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("LEVEL");

  const handleSubmit = (form) => {
    if (editing) {
      updateAgent(editing.id, form);
      emit(EVENT_TYPES.AGENT_STATUS, `${form.name} updated`);
    } else {
      if (!canAddAgent()) return;
      addAgent({ ...form, level: 1, xp: 0, missions: 0, successRate: 100, status: "idle" });
      emit(EVENT_TYPES.AGENT_STATUS, `${form.name} has joined the crew!`);
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
    if (agent) emit(EVENT_TYPES.AGENT_STATUS, `${agent.name} dismissed from crew`);
  };

  const atLimit = !canAddAgent();

  // Filter & sort
  const filteredAgents = agents
    .filter((a) => {
      if (filter === "ALL") return true;
      if (filter === "ACTIVE") return a.status === "active";
      if (filter === "IDLE") return a.status === "idle";
      if (filter === "ERROR") return a.status === "error";
      return true;
    })
    .sort((a, b) => {
      if (sort === "LEVEL") return (b.level || 1) - (a.level || 1);
      if (sort === "MISSIONS") return (b.missions || 0) - (a.missions || 0);
      if (sort === "SUCCESS") return (b.successRate || 0) - (a.successRate || 0);
      return 0;
    });

  const activeCount = agents.filter((a) => a.status === "active").length;
  const avgLevel = Math.round(agents.reduce((s, a) => s + (a.level || 1), 0) / Math.max(agents.length, 1));
  const totalMissions = agents.reduce((s, a) => s + (a.missions || 0), 0);

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-title mb-1">Crew Roster</div>
          <div className="flex items-center gap-4 text-[9px] font-mono mt-2">
            <span style={{ color: "#374151" }}>
              AGENTS: <span style={{ color: "#00f5ff" }}>{agents.length}</span>/<span style={{ color: "#374151" }}>{getPlanLimit("agents") === Infinity ? "∞" : getPlanLimit("agents")}</span>
            </span>
            <span style={{ color: "#1f2937" }}>|</span>
            <span style={{ color: "#374151" }}>
              ACTIVE: <span style={{ color: "#ff6b35" }}>{activeCount}</span>
            </span>
            <span style={{ color: "#1f2937" }}>|</span>
            <span style={{ color: "#374151" }}>
              AVG LV: <span style={{ color: "#a855f7" }}>{avgLevel}</span>
            </span>
            <span style={{ color: "#1f2937" }}>|</span>
            <span style={{ color: "#374151" }}>
              MISSIONS: <span style={{ color: "#00ff88" }}>{totalMissions}</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => { setEditing(null); setShowWizard(true); }}
          disabled={atLimit}
          className="shrink-0 px-4 py-2 rounded-lg font-mono text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, rgba(0,245,255,0.08), rgba(168,85,247,0.08))",
            border: "1px solid rgba(0,245,255,0.2)",
            color: "#00f5ff",
            boxShadow: atLimit ? "none" : "0 0 20px rgba(0,245,255,0.08)",
          }}
        >
          + RECRUIT AGENT
        </button>
      </div>

      {/* Plan limit warning */}
      {atLimit && (
        <div
          className="rounded-lg px-4 py-3 text-[10px] font-mono"
          style={{
            background: "rgba(255,217,61,0.04)",
            border: "1px solid rgba(255,217,61,0.15)",
            color: "#ffd93d",
          }}
        >
          Explorer plan: {getPlanLimit("agents")} agent limit reached. Upgrade to Captain plan to recruit more.
        </div>
      )}

      {/* ── Filter / Sort ────────────────────────────────────── */}
      <FilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />

      {/* ── Agent Grid ──────────────────────────────────────── */}
      {filteredAgents.length === 0 ? (
        <div
          className="cyber-panel p-12 text-center"
        >
          <div className="text-[40px] opacity-5 mb-3">◎</div>
          <div className="text-[10px] font-mono" style={{ color: "#1f2937" }}>
            {filter !== "ALL" ? `No ${filter.toLowerCase()} agents` : "No agents recruited yet"}
          </div>
          {filter === "ALL" && (
            <button
              onClick={() => { setEditing(null); setShowWizard(true); }}
              className="mt-4 text-[9px] font-mono px-4 py-2 rounded"
              style={{
                background: "rgba(0,245,255,0.05)",
                border: "1px solid rgba(0,245,255,0.12)",
                color: "#00f5ff",
              }}
            >
              Recruit your first agent
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              mcps={mcps}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* ── Wizard Modal ────────────────────────────────────── */}
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
