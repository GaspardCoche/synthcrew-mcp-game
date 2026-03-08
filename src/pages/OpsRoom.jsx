import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "../store/useStore";
import { planMission, runMission, executeMissionOnServer } from "../lib/missionRunner";
import { AGENT_ROLE_LABELS } from "../lib/constants";
import { useWebSocket } from "../lib/useWebSocket";
import AgentAvatar from "../components/AgentAvatar";

// ── Helpers ──────────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ── Mission blueprints (Factorio-style) ──────────────────────
const MISSION_BLUEPRINTS = [
  {
    id: "github-report",
    label: "GitHub Report",
    icon: "⌘",
    color: "#fd79a8",
    category: "DEV",
    prompt: "List open issues and PRs from the repo, analyze trends and generate a synthesis report",
  },
  {
    id: "web-recon",
    label: "Web Recon",
    icon: "🔍",
    color: "#74b9ff",
    category: "SEARCH",
    prompt: "Search for the latest AI trends on the web, summarize results in a structured report",
  },
  {
    id: "project-brief",
    label: "Project Brief",
    icon: "📜",
    color: "#ffd93d",
    category: "DOCS",
    prompt: "Fetch the GitHub repo README, analyze the content and write a synthetic project brief",
  },
  {
    id: "scrape-analyze",
    label: "Scrape & Analyze",
    icon: "🕸️",
    color: "#00ff88",
    category: "DATA",
    prompt: "Scrape https://news.ycombinator.com, analyze titles and categorize them by theme",
  },
];

// ── DAG Task Node (Factorio-style colored box) ───────────────
function DagNode({ task, agents, style }) {
  const agent = agents.find((a) => a.id === task.agentId || a.name === task.agentName);
  const isDone = task.status === "done";
  const isActive = task.status === "active";
  const nodeColor = agent?.color || "#4b5563";

  return (
    <div
      className={`pipeline-node relative rounded p-2 ${isActive ? "active" : ""}`}
      style={{
        background: isDone
          ? `${nodeColor}08`
          : isActive
          ? `${nodeColor}12`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isDone ? nodeColor + "30" : isActive ? nodeColor + "50" : "rgba(255,255,255,0.08)"}`,
        minWidth: 100,
        maxWidth: 140,
        ...style,
      }}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            background: isDone ? "#00ff88" : isActive ? nodeColor : "#374151",
            boxShadow: isActive ? `0 0 6px ${nodeColor}` : "none",
            animation: isActive ? "pulse 1.5s infinite" : "none",
          }}
        />
        <span
          className="text-[7px] font-mono uppercase tracking-wider"
          style={{ color: isDone ? "#00ff88" : isActive ? nodeColor : "#374151" }}
        >
          {isDone ? "DONE" : isActive ? "RUNNING" : "QUEUED"}
        </span>
      </div>

      {/* Task label */}
      <div
        className="text-[9px] font-bold font-mono leading-tight mb-1.5"
        style={{ color: isDone ? "#4b5563" : isActive ? "#e2e8f0" : "#374151" }}
      >
        {task.label?.slice(0, 24)}
      </div>

      {/* Agent assignment */}
      {agent && (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
          <span className="text-[7px] font-mono truncate" style={{ color: agent.color + "99" }}>
            {agent.name}
          </span>
        </div>
      )}
    </div>
  );
}

// ── DAG Visualization ────────────────────────────────────────
function DagVisualization({ dag, agents }) {
  if (!dag || !dag.tasks || dag.tasks.length === 0) {
    return (
      <div
        className="cyber-panel flex-1 flex flex-col items-center justify-center gap-3"
        style={{ minHeight: 260 }}
      >
        <div className="text-[40px] opacity-5">▣</div>
        <div className="text-[10px] font-mono text-center" style={{ color: "#1f2937" }}>
          No active mission DAG
        </div>
        <div className="text-[9px] font-mono text-center" style={{ color: "#111827" }}>
          Launch a mission to see the task graph
        </div>
      </div>
    );
  }

  const done = dag.tasks.filter((t) => t.status === "done").length;
  const total = dag.tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="cyber-panel-orange flex-1 flex flex-col" style={{ minHeight: 260 }}>
      <div
        className="px-4 py-2.5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,107,53,0.1)" }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: "#ff6b35", boxShadow: "0 0 6px #ff6b35", animation: "pulse 1.5s infinite" }}
        />
        <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,107,53,0.7)" }}>
          Mission DAG
        </span>
        <span className="text-[8px] font-mono ml-auto" style={{ color: "#374151" }}>
          {done}/{total} nodes
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 shrink-0">
        <div className="flex justify-between mb-1">
          <span className="text-[8px] font-mono truncate" style={{ color: "#4b5563" }}>{dag.title}</span>
          <span className="text-[8px] font-mono" style={{ color: "rgba(255,107,53,0.5)" }}>{Math.round(pct)}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,107,53,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #ff6b35, #ffd93d)",
              boxShadow: "0 0 6px rgba(255,107,53,0.4)",
            }}
          />
        </div>
      </div>

      {/* Task graph — horizontal flow */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-start gap-2 flex-wrap min-h-[140px]">
          {dag.tasks.map((task, i) => (
            <div key={task.id || i} className="flex items-center gap-2">
              <DagNode task={task} agents={agents} />
              {i < dag.tasks.length - 1 && (
                <div className="pipeline-arrow">
                  <svg viewBox="0 0 24 8" className="w-6 h-2 shrink-0" fill="none">
                    <path d="M0 4h20M16 1l4 3-4 3" stroke="rgba(0,245,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Agent legend */}
        <div className="flex items-center gap-3 flex-wrap mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {agents.filter((a) => dag.tasks.some((t) => t.agentId === a.id || t.agentName === a.name)).map((a) => (
            <div key={a.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
              <span className="text-[8px] font-mono" style={{ color: a.color + "88" }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Live Log Stream (right panel) ────────────────────────────
function LiveLogStream({ messages, running }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const typeStyle = {
    system: { color: "#ff6b35", prefix: "[SYS]", border: "#ff6b35" },
    tool_call: { color: "#ffd93d", prefix: "[MCP]", border: "#ffd93d" },
    output: { color: "#00ff88", prefix: "[OUT]", border: "#00ff88" },
    error: { color: "#ff2d55", prefix: "[ERR]", border: "#ff2d55" },
    thinking: { color: "#a855f7", prefix: "[THK]", border: "#a855f7" },
    user: { color: "#00f5ff", prefix: "[YOU]", border: "#00f5ff" },
  };

  return (
    <div
      className="cyber-panel flex flex-col"
      style={{ height: "100%", minHeight: 300 }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: running ? "#00ff88" : "#374151",
            boxShadow: running ? "0 0 6px #00ff88" : "none",
            animation: running ? "pulse 1.5s infinite" : "none",
          }}
        />
        <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(0,245,255,0.5)" }}>
          Mission Log
        </span>
        <span
          className="ml-auto text-[7px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: running ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)",
            color: running ? "#00ff88" : "#374151",
            border: `1px solid ${running ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          {running ? "● LIVE" : "○ IDLE"}
        </span>
      </div>

      <div ref={logRef} className="flex-1 overflow-y-auto p-3 font-mono text-[9px] space-y-1">
        {messages.map((msg) => {
          const ts = typeStyle[msg.type] || typeStyle[msg.from] || { color: "#4b5563", prefix: "[---]", border: "#374151" };
          return (
            <div
              key={msg.id}
              className="log-entry animate-fade-in"
              style={{ borderLeftColor: ts.border }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ color: "#1f2937" }}>{msg.time}</span>
                <span className="font-bold" style={{ color: ts.color }}>{ts.prefix}</span>
                {msg.from !== "user" && msg.from !== "system" && (
                  <span style={{ color: "#374151" }}>{msg.from}</span>
                )}
              </div>
              <div
                className="leading-relaxed"
                style={{ color: msg.type === "error" ? "#ff2d55" : "#4b5563" }}
              >
                {msg.text}
              </div>
              {msg.tasks && msg.tasks.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {msg.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[8px]">
                      <span style={{ color: task.status === "done" ? "#00ff88" : task.status === "active" ? "#00f5ff" : "#1f2937" }}>
                        {task.status === "done" ? "✓" : task.status === "active" ? "●" : "○"}
                      </span>
                      <span style={{ color: "#374151" }}>{task.label}</span>
                      {task.agentName && <span style={{ color: "#1f2937" }}>→ {task.agentName}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {running && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#00f5ff",
                    animation: `bounce 1s infinite`,
                    animationDelay: `${delay}ms`,
                  }}
                />
              ))}
            </div>
            <span className="text-[8px] font-mono" style={{ color: "#1f2937" }}>Agents executing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat Message ─────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.from === "user";
  const isSystem = msg.from === "system";

  const bubbleStyle = isUser
    ? { background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)" }
    : isSystem
    ? { background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.12)" }
    : msg.type === "error"
    ? { background: "rgba(255,45,85,0.06)", border: "1px solid rgba(255,45,85,0.15)" }
    : msg.type === "tool_call"
    ? { background: "rgba(255,217,61,0.04)", border: "1px solid rgba(255,217,61,0.1)" }
    : msg.type === "output" && msg.data
    ? { background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }
    : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div className={`flex gap-2.5 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
          style={{
            background: isSystem ? "rgba(255,107,53,0.12)" : `${msg.color || "#374151"}15`,
            color: isSystem ? "#ff6b35" : msg.color || "#6b7280",
            border: `1px solid ${isSystem ? "rgba(255,107,53,0.2)" : (msg.color || "#374151") + "25"}`,
          }}
        >
          {isSystem ? "N" : msg.avatar || msg.from?.[0] || "?"}
        </div>
      )}
      <div className={`max-w-[90%] rounded-lg px-3 py-2`} style={bubbleStyle}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[8px] font-mono font-bold"
              style={{ color: isSystem ? "#ff6b35" : msg.color || "#6b7280" }}
            >
              {isSystem ? "NEXUS" : msg.from}
            </span>
            {msg.role && (
              <span className="text-[7px] font-mono" style={{ color: "#374151" }}>· {msg.role}</span>
            )}
            {msg.type === "tool_call" && (
              <span className="text-[7px] px-1 rounded" style={{ background: "rgba(255,217,61,0.08)", color: "#ffd93d" }}>
                MCP
              </span>
            )}
          </div>
        )}
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: isUser ? "#e2e8f0" : msg.type === "error" ? "#ff2d55" : "#9ca3af" }}
        >
          {msg.text}
        </p>
        {msg.data && (
          <details className="mt-1.5">
            <summary className="text-[8px] font-mono cursor-pointer" style={{ color: "#374151" }}>
              View data
            </summary>
            <pre
              className="text-[8px] font-mono mt-1 max-h-28 overflow-y-auto p-2 rounded whitespace-pre-wrap"
              style={{ background: "rgba(0,0,0,0.3)", color: "#4b5563" }}
            >
              {typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data, null, 2)}
            </pre>
          </details>
        )}
        {msg.tasks && msg.tasks.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {msg.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono">
                <span style={{ color: task.status === "done" ? "#00ff88" : task.status === "active" ? "#00f5ff" : "#1f2937" }}>
                  {task.status === "done" ? "✓" : task.status === "active" ? "●" : "○"}
                </span>
                <span style={{ color: "#4b5563" }}>{task.label}</span>
                {task.agentName && <span style={{ color: "#374151" }}>→ {task.agentName}</span>}
              </div>
            ))}
          </div>
        )}
        <p className="text-[7px] font-mono mt-1" style={{ color: "#1f2937" }}>{msg.time}</p>
      </div>
    </div>
  );
}

// ── Pipeline Bottom Bar ───────────────────────────────────────
function PipelineStatusBar({ dag, running }) {
  if (!dag) return null;
  const tasks = dag.tasks || [];
  const done = tasks.filter((t) => t.status === "done").length;
  const active = tasks.filter((t) => t.status === "active").length;
  const queued = tasks.filter((t) => t.status === "queued").length;

  return (
    <div
      className="shrink-0 px-4 py-2 flex items-center gap-4"
      style={{
        background: "rgba(5,8,16,0.95)",
        border: "1px solid rgba(255,107,53,0.1)",
        borderRadius: 8,
      }}
    >
      <span className="text-[8px] font-mono font-bold tracking-wider" style={{ color: "rgba(255,107,53,0.5)" }}>
        PIPELINE
      </span>
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {tasks.map((task, i) => {
          const isDone = task.status === "done";
          const isActive = task.status === "active";
          return (
            <div key={task.id || i} className="flex items-center gap-1 shrink-0">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: isDone ? 32 : isActive ? 24 : 16,
                  background: isDone ? "#00ff88" : isActive ? "#ff6b35" : "#1f2937",
                  boxShadow: isActive ? "0 0 8px rgba(255,107,53,0.6)" : "none",
                }}
                title={task.label}
              />
              {i < tasks.length - 1 && (
                <div className="h-px w-2" style={{ background: "#111827" }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[8px] font-mono" style={{ color: "#00ff88" }}>{done} DONE</span>
        {active > 0 && (
          <span className="text-[8px] font-mono" style={{ color: "#ff6b35" }}>{active} RUNNING</span>
        )}
        <span className="text-[8px] font-mono" style={{ color: "#1f2937" }}>{queued} QUEUED</span>
      </div>
    </div>
  );
}

// ── Main OpsRoom Page ────────────────────────────────────────
export default function OpsRoom() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [serverMode, setServerMode] = useState(true);
  const [showBlueprints, setShowBlueprints] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "system",
      text: "Describe your mission in natural language. NEXUS coordinates the team and MCP tools execute tasks for real.",
      time: now(),
    },
  ]);

  const chatEndRef = useRef(null);
  const currentMissionIdRef = useRef(null);

  const {
    agents,
    setCurrentMissionDag,
    clearLog,
    appendLog,
    addMission,
    setAgentStatus,
    updateCurrentDagTask,
    currentMissionDag,
    mcps,
  } = useStore();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = useCallback((msg) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg_${Date.now()}_${Math.random()}`, time: msg.time || now() },
    ]);
  }, []);

  const onWsMessage = useCallback(
    (msg) => {
      if (msg.type !== "mission_log") return;
      const { event, log, task, mission } = msg.payload || {};

      if (event === "mission_started" && mission) {
        currentMissionIdRef.current = mission.id;
        if (mission.tasks) {
          addMsg({
            from: "NEXUS",
            color: "#ff6b35",
            avatar: "N",
            role: "Orchestrator",
            text: `Mission decomposed into ${mission.tasks.length} real tasks.`,
            tasks: mission.tasks.map((t) => ({ label: t.label, agentName: t.agentName, status: t.status })),
          });
        }
      }

      if (!log) return;

      if (event === "tool_call") {
        const agent = agents.find((a) => a.name === log.agent);
        addMsg({
          from: log.agent,
          color: agent?.color || "#6b7280",
          avatar: agent?.avatar,
          role: AGENT_ROLE_LABELS[agent?.role] || "",
          type: "tool_call",
          text: log.action,
        });
      }

      if (event === "tool_result") {
        const agent = agents.find((a) => a.name === log.agent);
        addMsg({
          from: log.agent,
          color: agent?.color || "#6b7280",
          avatar: agent?.avatar,
          role: AGENT_ROLE_LABELS[agent?.role] || "",
          type: log.type,
          text: log.action,
          data: log.data,
        });
      }

      if (event === "step_done" && task) {
        updateCurrentDagTask?.(task.id, "done");
        if (task.agentId) setAgentStatus?.(task.agentId, "idle");
      }

      if (event === "mission_completed" && mission) {
        setRunning(false);
        addMsg({
          from: "system",
          text: `Mission "${mission.title}" completed. ${mission.tasks?.length || 0} tasks executed with real MCP tools.`,
        });
        addMission({
          title: mission.title,
          status: "completed",
          taskCount: mission.tasks?.length || 0,
        });
      }
    },
    [agents, addMsg, addMission, setAgentStatus, updateCurrentDagTask]
  );

  useWebSocket(onWsMessage);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || running) return;
    setPrompt("");
    setRunning(true);
    setShowBlueprints(false);
    clearLog();

    addMsg({ from: "user", text });
    addMsg({
      from: "system",
      text: serverMode
        ? "Sending to server... NEXUS is planning and executing with real MCP tools."
        : "Local mode: NEXUS plans (simulation)...",
    });

    if (serverMode) {
      try {
        const result = await executeMissionOnServer(text);
        currentMissionIdRef.current = result.mission?.id;
      } catch (e) {
        addMsg({
          from: "system",
          text: `Server unreachable, falling back to local mode. ${e.message}`,
          type: "error",
        });
        await runLocal(text);
      }
    } else {
      await runLocal(text);
    }
  };

  const runLocal = async (text) => {
    const dag = planMission(text, {});
    setCurrentMissionDag(dag);
    addMsg({
      from: "NEXUS",
      color: "#ff6b35",
      avatar: "N",
      role: "Orchestrator",
      text: `Mission "${dag.title}" decomposed into ${dag.tasks.length} tasks (local simulation).`,
      tasks: dag.tasks.map((t) => ({ label: t.label, agentName: t.agentName, status: t.status })),
    });

    try {
      await runMission(dag, {
        appendLog: (entry) => {
          useStore.getState().appendLog(entry);
          if (entry.type === "output") {
            const a = agents.find((x) => x.name === entry.agent);
            addMsg({
              from: entry.agent,
              color: a?.color || "#9ca3af",
              avatar: a?.avatar,
              role: AGENT_ROLE_LABELS[a?.role] || "",
              text: entry.action,
            });
          }
        },
        setAgentStatus: useStore.getState().setAgentStatus,
        updateCurrentDagTask: useStore.getState().updateCurrentDagTask,
      });
      addMission({ title: dag.title, status: "completed", taskCount: dag.tasks.length });
      addMsg({
        from: "system",
        text: `Mission complete (simulation). ${dag.tasks.length} tasks finished.`,
      });
    } catch (e) {
      addMsg({ from: "system", text: `Error: ${e.message}`, type: "error" });
    } finally {
      setRunning(false);
    }
  };

  const connectedAgents = agents.filter((a) => a.status !== "sleeping");

  return (
    <div
      className="flex flex-col gap-3"
      style={{ height: "calc(100vh - 52px - 28px - 40px)", maxHeight: 900 }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase"
            style={{ color: "rgba(0,245,255,0.5)" }}
          >
            Mission Control
          </span>
          <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-[9px] font-mono" style={{ color: "#374151" }}>
            {connectedAgents.length} agents available
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Server/Local toggle */}
          <button
            onClick={() => setServerMode(!serverMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[8px] font-mono font-bold transition-all"
            style={{
              background: serverMode ? "rgba(0,255,136,0.06)" : "rgba(255,255,255,0.03)",
              border: serverMode ? "1px solid rgba(0,255,136,0.2)" : "1px solid rgba(255,255,255,0.08)",
              color: serverMode ? "#00ff88" : "#374151",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: serverMode ? "#00ff88" : "#374151",
                boxShadow: serverMode ? "0 0 6px #00ff88" : "none",
                animation: serverMode ? "pulse 2s infinite" : "none",
              }}
            />
            {serverMode ? "LIVE SERVER" : "LOCAL SIM"}
          </button>

          {running && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[8px] font-mono"
              style={{
                background: "rgba(255,107,53,0.08)",
                border: "1px solid rgba(255,107,53,0.2)",
                color: "#ff6b35",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff6b35", animation: "pulse 1s infinite" }} />
              EXECUTING
            </div>
          )}
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Left: Chat / Prompt interface */}
        <div className="flex flex-col gap-3" style={{ width: 340, minWidth: 280 }}>

          {/* Mission blueprints */}
          {showBlueprints && messages.length <= 2 && (
            <div className="cyber-panel p-3 shrink-0">
              <div className="text-[8px] font-mono font-bold tracking-wider mb-2" style={{ color: "rgba(0,245,255,0.35)" }}>
                MISSION BLUEPRINTS
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {MISSION_BLUEPRINTS.map((bp) => (
                  <button
                    key={bp.id}
                    onClick={() => setPrompt(bp.prompt)}
                    className="text-left p-2 rounded group transition-all"
                    style={{
                      background: `${bp.color}05`,
                      border: `1px solid ${bp.color}15`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{bp.icon}</span>
                      <span
                        className="text-[7px] font-mono font-bold uppercase tracking-wider"
                        style={{ color: `${bp.color}80` }}
                      >
                        {bp.category}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold" style={{ color: bp.color + "cc" }}>
                      {bp.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat area */}
          <div
            className="cyber-panel flex-1 flex flex-col min-h-0"
          >
            <div
              className="px-3 py-2 shrink-0 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
            >
              <span className="text-[8px] font-mono font-bold tracking-wider" style={{ color: "rgba(0,245,255,0.4)" }}>
                MISSION BRIEFING
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your mission... (Shift+Enter for newline)"
                disabled={running}
                rows={2}
                className="w-full rounded-lg px-3 py-2.5 text-[11px] font-mono resize-none outline-none transition-all disabled:opacity-50"
                style={{
                  background: "rgba(4,6,12,0.8)",
                  border: prompt ? "1px solid rgba(0,245,255,0.25)" : "1px solid rgba(0,245,255,0.08)",
                  color: "#e2e8f0",
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={running || !prompt.trim()}
              className="px-4 rounded-lg font-bold text-[10px] font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{
                background: running ? "rgba(255,107,53,0.1)" : "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(0,245,255,0.1))",
                border: running ? "1px solid rgba(255,107,53,0.2)" : "1px solid rgba(0,245,255,0.2)",
                color: running ? "#ff6b35" : "#00f5ff",
              }}
            >
              {running ? "..." : "SEND"}
            </button>
          </div>
        </div>

        {/* Center: DAG Visualization */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">
          <DagVisualization dag={currentMissionDag} agents={agents} />

          {/* Agent assignment panel */}
          <div className="cyber-panel p-3 shrink-0">
            <div className="text-[8px] font-mono font-bold tracking-wider mb-2" style={{ color: "rgba(0,245,255,0.35)" }}>
              CREW ASSIGNMENT
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded"
                  style={{
                    background: `${agent.color}08`,
                    border: `1px solid ${agent.color}${agent.status === "active" ? "40" : "15"}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: agent.status === "active" ? agent.color : "#374151",
                      boxShadow: agent.status === "active" ? `0 0 6px ${agent.color}` : "none",
                      animation: agent.status === "active" ? "pulse 2s infinite" : "none",
                    }}
                  />
                  <span className="text-[8px] font-mono" style={{ color: agent.color + "cc" }}>
                    {agent.name}
                  </span>
                  {agent.status === "active" && (
                    <span className="text-[7px] font-mono" style={{ color: "#ff6b35" }}>BUSY</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live log stream */}
        <div style={{ width: 280, minWidth: 240 }}>
          <LiveLogStream messages={messages} running={running} />
        </div>
      </div>

      {/* ── Pipeline Status Bar (bottom) ─────────────────────── */}
      {currentMissionDag && (
        <PipelineStatusBar dag={currentMissionDag} running={running} />
      )}
    </div>
  );
}
