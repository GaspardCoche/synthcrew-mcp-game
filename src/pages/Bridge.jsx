import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { AGENT_ROLE_LABELS, STATUS_CONFIG } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

function QuickMissionInput() {
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const launch = async () => {
    const text = prompt.trim();
    if (!text || sending) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/mission/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, title: text.slice(0, 80) }),
      });
      const data = await res.json();
      if (data.error) setFeedback({ ok: false, msg: data.error });
      else { setFeedback({ ok: true, msg: data.message || "Mission lancée" }); setPrompt(""); }
    } catch { setFeedback({ ok: false, msg: "Serveur inaccessible" }); }
    finally { setSending(false); }
  };

  return (
    <div className="cyber-panel p-4">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Nouvelle mission</label>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && launch()}
          placeholder="Décris ce que tu veux accomplir..."
          disabled={sending}
          className="flex-1 bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none focus:border-[var(--primary)]/30 transition-colors"
        />
        <button
          onClick={launch}
          disabled={!prompt.trim() || sending}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {sending ? "..." : "Lancer"}
        </button>
      </div>
      {feedback && (
        <p className={`text-xs mt-2 ${feedback.ok ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
          {feedback.msg}
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="cyber-panel p-4">
      <div className="text-xs text-[var(--text-dim)] mb-1">{label}</div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="text-[10px] text-[var(--text-dim)] mt-1">{sub}</div>}
    </div>
  );
}

function MissionPipeline({ dag, missions }) {
  const recent = missions?.slice(0, 5) || [];
  const tasks = dag?.tasks || [];
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  if (total === 0) {
    return (
      <div className="cyber-panel p-4">
        <h3 className="text-xs font-medium text-[var(--text-muted)] mb-3">Pipeline</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">Aucune mission récente. Lance une mission pour commencer.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((m, i) => (
              <div key={m.id || i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                <span className="text-[var(--text-primary)] truncate">{m.title?.slice(0, 50) || "Mission"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cyber-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-[var(--text-muted)]">Mission en cours</h3>
        <span className="text-xs text-[var(--text-dim)]">{done}/{total}</span>
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)] mb-2 truncate">{dag.title}</div>
      <div className="h-1.5 rounded-full bg-white/5 mb-3 overflow-hidden">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tasks.map((t, i) => (
          <span
            key={t.id || i}
            className={`text-[10px] px-2 py-0.5 rounded ${
              t.status === "done" ? "bg-[var(--success)]/15 text-[var(--success)]" :
              t.status === "active" ? "bg-[var(--primary)]/15 text-[var(--primary)]" :
              "bg-white/5 text-[var(--text-dim)]"
            }`}
          >
            {t.label?.slice(0, 20) || t.action?.slice(0, 20) || "…"}
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveActivityFeed({ log, agents }) {
  const feedRef = useRef(null);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [log]);

  return (
    <div className="cyber-panel flex flex-col" style={{ height: 240 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)]">
        <h3 className="text-xs font-medium text-[var(--text-muted)]">Activité</h3>
        <span className="text-[10px] text-[var(--text-dim)]">{log.length} événements</span>
      </div>
      <div ref={feedRef} className="flex-1 overflow-y-auto p-3 text-xs space-y-2">
        {log.length === 0 ? (
          <p className="text-[var(--text-dim)]">En attente d'activité…</p>
        ) : (
          log.slice(-25).map((entry, i) => {
            const agent = agents.find((a) => a.name === entry.agent);
            return (
              <div key={i} className="flex gap-2 border-l-2 border-[var(--primary)]/30 pl-2">
                <span className="text-[var(--text-dim)] shrink-0">{entry.time}</span>
                <span className="font-medium shrink-0" style={{ color: agent?.color || "var(--text-muted)" }}>{entry.agent}</span>
                <span className="text-[var(--text-muted)] truncate">{entry.action}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, mcps, onClick }) {
  const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const agentMcps = (mcps || []).filter((m) => agent.mcpIds?.includes(m.id));

  return (
    <button
      onClick={() => onClick(agent)}
      className="agent-card cyber-panel w-full p-3 text-left"
    >
      <div className="flex items-center gap-3 mb-2">
        <AgentAvatar agent={agent} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" style={{ color: agent.color }}>{agent.name}</p>
          <p className="text-[10px] text-[var(--text-dim)]">{AGENT_ROLE_LABELS[agent.role] || agent.role}</p>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-dim)]">{cfg.label}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)]">
        {agentMcps.slice(0, 2).map((m) => (
          <span key={m.id}>{m.icon} {m.name}</span>
        ))}
        {agentMcps.length > 2 && <span>+{agentMcps.length - 2}</span>}
      </div>
    </button>
  );
}

export default function Bridge() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const { agents, missionLog, currentMissionDag, mcps, missions } = useStore();

  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((s, a) => s + (a.missions || 0), 0);
  const connectedMcps = mcps.filter((m) => m.connected);
  const totalTools = connectedMcps.reduce((s, m) => s + (m.tools?.length || 0), 0);
  const avgSuccess = Math.round(agents.reduce((s, a) => s + (a.successRate || 0), 0) / Math.max(agents.length, 1));

  return (
    <div className="space-y-5 max-w-[1200px]">
      <QuickMissionInput />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Agents" value={agents.length} sub={`${activeCount} en mission`} />
        <StatCard label="Missions" value={totalMissions} sub={`${avgSuccess}% succès`} />
        <StatCard label="Outils MCP" value={totalTools} sub={`${connectedMcps.length} serveurs`} />
        <StatCard label="Taux de succès" value={`${avgSuccess}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          to="/classic/ops"
          className="cyber-panel p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">▶</div>
          <div>
            <div className="font-medium text-[var(--text-primary)]">Lancer une mission</div>
            <div className="text-xs text-[var(--text-dim)]">Atelier et templates</div>
          </div>
        </Link>
        <Link
          to="/classic/quarters"
          className="cyber-panel p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[var(--text-primary)]">◎</div>
          <div>
            <div className="font-medium text-[var(--text-primary)]">Équipage</div>
            <div className="text-xs text-[var(--text-dim)]">Gérer les agents</div>
          </div>
        </Link>
        <Link
          to="/classic/armory"
          className="cyber-panel p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[var(--text-primary)]">⬡</div>
          <div>
            <div className="font-medium text-[var(--text-primary)]">Armurerie</div>
            <div className="text-xs text-[var(--text-dim)]">MCPs et outils</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <MissionPipeline dag={currentMissionDag} missions={missions} />
          <LiveActivityFeed log={missionLog} agents={agents} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-[var(--text-muted)]">Équipage</h3>
            <Link to="/classic/quarters" className="text-xs text-[var(--primary)] hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} mcps={mcps} onClick={setSelectedAgent} />
            ))}
            {agents.length === 0 && (
              <div className="cyber-panel p-6 text-center text-[var(--text-dim)] text-sm">Aucun agent</div>
            )}
          </div>
        </div>
      </div>

      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="cyber-panel p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <AgentAvatar agent={selectedAgent} size="lg" />
              <div>
                <div className="font-semibold text-lg" style={{ color: selectedAgent.color }}>{selectedAgent.name}</div>
                <div className="text-sm text-[var(--text-dim)]">{AGENT_ROLE_LABELS[selectedAgent.role]}</div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="ml-auto text-[var(--text-dim)] hover:text-[var(--text-primary)]">✕</button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">{selectedAgent.personality}</p>
            <div className="flex gap-2">
              <Link to="/classic/quarters" className="flex-1 py-2 text-center text-sm font-medium rounded-lg bg-white/10 text-[var(--text-primary)] hover:bg-white/15" onClick={() => setSelectedAgent(null)}>
                Gérer
              </Link>
              <Link to="/classic/ops" className="flex-1 py-2 text-center text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90" onClick={() => setSelectedAgent(null)}>
                Déployer
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
