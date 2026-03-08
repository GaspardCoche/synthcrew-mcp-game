import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { planMission, runMission } from "../lib/missionRunner";
import { getMissionTemplates, createMission } from "../lib/api";
import OrchestratorBriefing from "../components/OrchestratorBriefing";
import AgentAvatar from "../components/AgentAvatar";

const TYPE_COLORS = { tool_call: "#ffd93d", output: "#00b894", thinking: "#6c5ce7", error: "#ff6b6b" };
const DAG_COLORS = { done: "#00b894", active: "#4ecdc4", queued: "#ffd93d" };

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
    appendLog({ agent: "NEXUS", action: `Plan : ${dag.title} (${dag.tasks.length} tâches)`, type: "output" });
    appendLog({ agent: "NEXUS", action: "Vérifie le plan, puis lance l'exécution.", type: "thinking" });
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
    appendLog({ agent: "NEXUS", action: `Exécution : ${dag.title}`, type: "output" });

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
      appendLog({ agent: "NEXUS", action: "Mission terminée avec succès", type: "output" });
      setPlannedDag(null);
    } catch (e) {
      appendLog({ agent: "NEXUS", action: `Erreur : ${e.message}`, type: "error" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-orbitron text-sm font-bold text-gray-200 tracking-wide mb-1">MISSIONS</h1>
        <p className="text-sm text-gray-500">
          Décris ce que tu veux accomplir. NEXUS décompose ta demande en tâches et assigne les agents.
        </p>
      </div>

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
          {/* Team selection */}
          {selectedTeamAgents.length > 0 && (
            <div className="rounded-xl border border-synth-primary/20 bg-synth-primary/5 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold text-synth-primary font-mono tracking-wide">ÉQUIPE</span>
                {selectedTeamAgents.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5">
                    <AgentAvatar agent={a} size="sm" />
                    <span className="font-mono text-xs" style={{ color: a.color }}>{a.name}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowBriefing(true)}
                className="text-[10px] text-synth-primary hover:text-synth-teal font-mono transition-colors"
              >
                Modifier
              </button>
            </div>
          )}

          {/* Mission input */}
          <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">Décris ta mission en langage naturel</span>
              <button
                type="button"
                onClick={() => setShowBriefing(true)}
                className="text-[10px] text-gray-500 hover:text-synth-primary font-mono transition-colors"
              >
                Refaire le brief
              </button>
            </div>

            {templates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPrompt(t.prompt)}
                    className="text-[10px] px-2 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:border-synth-primary/40 hover:text-synth-primary font-mono transition-colors"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlan()}
                placeholder="Ex: Analyse les tickets Zendesk, crée un rapport Notion, envoie un résumé Slack"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg outline-none text-gray-200 font-mono text-sm px-4 py-2.5 placeholder-gray-600 focus:border-synth-primary/30 transition-colors"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handlePlan}
                  disabled={!prompt.trim()}
                  className="text-xs font-bold px-4 py-2.5 rounded-lg border border-synth-teal/40 text-synth-teal hover:bg-synth-teal/10 disabled:opacity-40 font-mono transition-colors"
                >
                  Planifier
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={running || (!plannedDag && !prompt.trim())}
                  className="text-xs font-bold px-5 py-2.5 rounded-lg bg-gradient-to-r from-synth-primary to-synth-teal text-white disabled:opacity-40 disabled:cursor-not-allowed font-mono transition-opacity"
                >
                  {running ? "En cours..." : "Lancer"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* DAG */}
            <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-synth-teal tracking-wide font-mono">GRAPHE DE MISSION (DAG)</span>
                {currentMissionDag && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    {currentMissionDag.tasks.filter((t) => t.status === "done").length}/{currentMissionDag.tasks.length}
                  </span>
                )}
              </div>
              <div className="p-4 min-h-[220px]">
                {!currentMissionDag ? (
                  <div className="text-gray-600 text-sm text-center py-12 font-mono">
                    Le graphe de tâches apparaîtra ici
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
                          x1={from.x + 10} y1={from.y + 5}
                          x2={to.x} y2={to.y + 5}
                          stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"
                        />
                      );
                    })}
                    {currentMissionDag.tasks.map((task) => {
                      const c = DAG_COLORS[task.status] || DAG_COLORS.queued;
                      return (
                        <g key={task.id}>
                          <rect x={task.x} y={task.y} width={20} height={10} rx={2} fill={`${c}20`} stroke={c} strokeWidth="0.3" />
                          {task.status === "done" && (
                            <text x={task.x + 10} y={task.y + 6.5} textAnchor="middle" fill="#00b894" fontSize="3.5" fontFamily="monospace">✓</text>
                          )}
                          {task.status === "active" && (
                            <circle cx={task.x + 10} cy={task.y + 5} r="1.5" fill="#4ecdc4">
                              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {task.status === "queued" && (
                            <circle cx={task.x + 10} cy={task.y + 5} r="1" fill="#ffd93d" opacity="0.5" />
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

            {/* Live log */}
            <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden flex flex-col h-[280px]">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-synth-emerald animate-pulse" />
                <span className="text-[10px] font-bold text-synth-emerald tracking-wide font-mono">LOG EN DIRECT</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
                {missionLog.length === 0 && (
                  <div className="text-gray-600 text-center py-8">Les événements apparaîtront ici</div>
                )}
                {missionLog.map((log, i) => {
                  const agent = agents.find((a) => a.name === log.agent);
                  const tc = TYPE_COLORS[log.type] || "#9ca3af";
                  return (
                    <div key={i} className="py-1.5 border-b border-white/5">
                      <div className="flex gap-2 items-start flex-wrap">
                        <span className="text-gray-600 shrink-0">{log.time}</span>
                        <span className="font-semibold shrink-0" style={{ color: agent?.color || "#dfe6e9" }}>
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

          <div className="rounded-xl border border-white/6 bg-white/2 p-4 text-xs text-gray-500">
            <strong className="text-gray-400">Workflow :</strong> NEXUS décompose ta demande en DAG (graphe de tâches).
            Chaque tâche est assignée à un agent selon ses MCPs. Les agents exécutent en séquence ou parallèle selon les dépendances.
          </div>
        </>
      )}
    </div>
  );
}
