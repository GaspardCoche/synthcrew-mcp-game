import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { planMission, runMission } from "../lib/missionRunner";
import { getMissionTemplates, createMission } from "../lib/api";
import OrchestratorBriefing from "../components/OrchestratorBriefing";
import AgentAvatar from "../components/AgentAvatar";

const TYPE_COLORS = { tool_call: "#f59e0b", output: "#22c55e", thinking: "#a855f7", error: "#ef4444" };

export default function OpsRoom() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [plannedDag, setPlannedDag] = useState(null);
  const [showBriefing, setShowBriefing] = useState(true);
  const [selectedTeamAgents, setSelectedTeamAgents] = useState([]);
  const {
    agents,
    missionLog,
    currentMissionDag,
    setCurrentMissionDag,
    clearLog,
    appendLog,
    setAgentStatus,
    updateCurrentDagTask,
    addMission,
    suggestedTeamRoleIds,
    setSuggestedTeamRoleIds,
  } = useStore();

  useEffect(() => {
    getMissionTemplates().then(setTemplates).catch(() => []);
  }, []);

  const handlePlan = () => {
    const text = prompt.trim();
    if (!text) return;
    clearLog();
    const dag = planMission(text, { suggestedRoles: suggestedTeamRoleIds });
    setCurrentMissionDag(dag);
    setPlannedDag(dag);
    appendLog({ agent: "SYSTÈME", action: `Plan généré : ${dag.title} (${dag.tasks.length} tâches)`, type: "output" });
    appendLog({ agent: "SYSTÈME", action: "Clique sur « Lancer l'exécution » pour exécuter le plan.", type: "thinking" });
  };

  const handleLaunch = async () => {
    const dag = plannedDag || (prompt.trim() ? planMission(prompt.trim(), { suggestedRoles: suggestedTeamRoleIds }) : null);
    if (!dag || running) return;

    setRunning(true);
    if (!plannedDag) {
      setPlannedDag(dag);
      setCurrentMissionDag(dag);
    }
    clearLog();
    appendLog({ agent: "SYSTÈME", action: `Exécution : ${dag.title}`, type: "output" });

    try {
      const get = useStore.getState;
      await runMission(dag, {
        appendLog: get().appendLog,
        setAgentStatus: get().setAgentStatus,
        updateCurrentDagTask: get().updateCurrentDagTask,
      });
      addMission({ title: dag.title, status: "completed", taskCount: dag.tasks.length });
      const templateId = templates.find((t) => t.prompt === dag.title || dag.title?.startsWith(t.prompt?.slice(0, 30)))?.id;
      await createMission({ title: dag.title, status: "completed", taskCount: dag.tasks.length, templateId }).catch(() => {});
      appendLog({ agent: "SYSTÈME", action: "Mission terminée avec succès ✓", type: "output" });
      setPlannedDag(null);
    } catch (e) {
      appendLog({ agent: "SYSTÈME", action: `Erreur : ${e.message}`, type: "error" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="font-orbitron text-xs font-bold text-synth-copper tracking-wide">ATELIER — Missions & exécution en direct</div>

      {showBriefing && (
        <OrchestratorBriefing
          onComplete={({ prompt: p, selectedAgents: sel }) => {
            setPrompt(p);
            if (sel?.length) {
              setSelectedTeamAgents(sel);
              setSuggestedTeamRoleIds(sel.map((a) => a.role));
            }
            setShowBriefing(false);
          }}
          onSkip={() => setShowBriefing(false)}
        />
      )}

      {!showBriefing && (
        <>
      {selectedTeamAgents.length > 0 && (
        <div className="synth-panel p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-orbitron text-[10px] font-bold text-synth-copper tracking-wide">ÉQUIPE CHOISIE</span>
            {selectedTeamAgents.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5">
                <AgentAvatar agent={a} size="sm" />
                <span className="font-jetbrains text-xs text-gray-300" style={{ color: a.color }}>{a.name}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowBriefing(true)}
            className="font-jetbrains text-[10px] text-synth-copper hover:text-synth-cyan"
          >
            Changer l'équipe
          </button>
        </div>
      )}
      {/* Mission input — plan-then-execute (agentic) */}
        <div className="synth-panel p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-jetbrains text-[10px] text-gray-500">CONDUCTOR a mémorisé ton brief. Tu peux modifier la mission ci-dessous.</span>
          <button
            type="button"
            onClick={() => setShowBriefing(true)}
            className="font-jetbrains text-[10px] text-synth-copper hover:text-synth-cyan"
          >
            Refaire le brief
          </button>
        </div>
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="font-jetbrains text-[10px] text-gray-500 self-center">Templates :</span>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPrompt(t.prompt)}
                className="font-jetbrains text-[10px] px-2 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:border-synth-copper/40 hover:text-synth-copper"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="font-orbitron text-xs font-bold text-synth-copper tracking-wide px-0 sm:px-3 py-1 sm:py-0">MISSION ›</span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlan()}
            placeholder="Ex: Analyse les tickets Zendesk, crée un rapport Notion, envoie un résumé Slack"
            className="flex-1 bg-transparent border border-white/10 rounded-lg outline-none text-gray-200 font-jetbrains text-sm px-3 py-2 placeholder-gray-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePlan}
              disabled={!prompt.trim()}
              className="font-orbitron text-xs font-bold px-4 py-2 rounded-lg border border-synth-copper/40 text-synth-copper hover:bg-synth-copper-bg disabled:opacity-50"
            >
              Planifier
            </button>
            <button
              onClick={handleLaunch}
              disabled={running || (!plannedDag && !prompt.trim())}
              className="font-orbitron text-xs font-bold px-5 py-2 rounded-lg bg-gradient-to-r from-synth-copper to-synth-cyan text-synth-bg-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? "EXÉCUTION…" : "Lancer l'exécution ▶"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAG */}
        <div className="synth-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <span className="font-orbitron text-xs font-bold text-synth-copper tracking-wide">GRAPHE DE MISSION</span>
            {currentMissionDag && (
              <span className="font-jetbrains text-[10px] text-gray-400">
                {currentMissionDag.tasks.filter((t) => t.status === "done").length}/{currentMissionDag.tasks.length} tâches
              </span>
            )}
          </div>
          <div className="p-4 min-h-[220px]">
            {!currentMissionDag ? (
              <div className="text-gray-500 font-jetbrains text-sm text-center py-12">
                Saisis une mission et lance pour voir le DAG.
              </div>
            ) : (
              <svg viewBox="0 0 100 80" className="w-full h-52">
                {currentMissionDag.connections?.map((conn) => {
                  const from = currentMissionDag.tasks.find((t) => t.id === conn.from);
                  const to = currentMissionDag.tasks.find((t) => t.id === conn.to);
                  if (!from || !to) return null;
                  return (
                    <line
                      key={`${conn.from}-${conn.to}`}
                      x1={from.x + 10}
                      y1={from.y + 5}
                      x2={to.x}
                      y2={to.y + 5}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="0.5"
                    />
                  );
                })}
                {currentMissionDag.tasks.map((task) => {
                  const colors = { done: "#22c55e", active: "#00f0ff", queued: "#f59e0b" };
                  const c = colors[task.status] || colors.queued;
                  return (
                    <g key={task.id}>
                      <rect x={task.x} y={task.y} width={20} height={10} rx={2} fill={`${c}20`} stroke={c} strokeWidth="0.3" />
                      {task.status === "done" && (
                        <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle" fill="#22c55e" fontSize="3.5" fontFamily="monospace">
                          ✓
                        </text>
                      )}
                      {task.status === "active" && (
                        <circle cx={task.x + 10} cy={task.y + 5} r="1.5" fill="#00f0ff">
                          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {task.status === "queued" && (
                        <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle" fill="#f59e0b" fontSize="3" fontFamily="monospace">
                          ⏳
                        </text>
                      )}
                      <text x={task.x + 10} y={task.y + 15} textAnchor="middle" fill={c} fontSize="2.5" fontFamily="monospace">
                        {task.label?.slice(0, 14)}
                      </text>
                      <text x={task.x + 10} y={task.y + 18.5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="2" fontFamily="monospace">
                        {task.agentName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Live log — observabilité type Pixel Agent */}
        <div className="rounded-xl border border-synth-border bg-synth-panel overflow-hidden flex flex-col h-[280px]">
          <div className="px-4 py-3 border-b border-synth-border flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-synth-green animate-pulse" />
              <span className="font-orbitron text-xs font-bold text-synth-green tracking-wide">EXÉCUTION EN DIRECT</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-jetbrains text-[11px]">
            {missionLog.length === 0 && (
              <div className="text-gray-500 text-center py-8">Les événements de la mission apparaîtront ici.</div>
            )}
            {missionLog.map((log, i) => {
              const agent = agents.find((a) => a.name === log.agent);
              const tc = TYPE_COLORS[log.type] || "#9ca3af";
              return (
                <div key={i} className="py-1.5 border-b border-white/5">
                  <div className="flex gap-2 items-start flex-wrap">
                    <span className="text-gray-500 shrink-0">{log.time}</span>
                    <span className="font-semibold shrink-0" style={{ color: agent?.color || "#fff" }}>
                      {log.agent}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border shrink-0" style={{ background: `${tc}15`, color: tc, borderColor: `${tc}30` }}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-gray-300 mt-0.5">{log.action}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="font-jetbrains text-[10px] text-gray-500">
        <strong>Plan-then-execute</strong> : planifie d’abord (Mission Planner décompose en DAG), puis lance l’exécution. En production : Claude API + MCPs (resumable streams, progress notifications).
      </p>
        </>
      )}
    </div>
  );
}
