import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "../store/useStore";
import { planMission, runMission, executeMissionOnServer } from "../lib/missionRunner";
import { getMissionTemplates } from "../lib/api";
import { AGENT_ROLE_LABELS } from "../lib/constants";
import { useWebSocket } from "../lib/useWebSocket";
import AgentAvatar from "../components/AgentAvatar";

const QUICK_PROMPTS = [
  { label: "Rapport GitHub", prompt: "Liste les issues et PRs ouvertes du repo, analyse les tendances et génère un rapport de synthèse" },
  { label: "Veille web", prompt: "Recherche les dernières tendances IA sur le web, résume les résultats dans un rapport structuré" },
  { label: "Brief projet", prompt: "Récupère le README du repo GitHub, analyse le contenu et rédige un brief projet synthétique" },
  { label: "Scrape + Analyse", prompt: "Scrape la page https://news.ycombinator.com, analyse les titres et catégorise-les par thème" },
];

function MessageBubble({ msg }) {
  const isSystem = msg.from === "system";
  const isUser = msg.from === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{
            background: isSystem ? "rgba(255,107,53,0.15)" : `${msg.color || "#6b7280"}20`,
            color: isSystem ? "#ff6b35" : msg.color || "#6b7280",
            border: `1px solid ${isSystem ? "rgba(255,107,53,0.3)" : (msg.color || "#6b7280") + "40"}`,
          }}
        >
          {isSystem ? "S" : (msg.avatar || msg.from?.[0] || "?")}
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
          isUser
            ? "bg-synth-primary/15 border border-synth-primary/30"
            : msg.type === "error"
            ? "bg-red-500/10 border border-red-500/30"
            : msg.type === "tool_call"
            ? "bg-synth-indigo/8 border border-synth-indigo/20"
            : msg.type === "output" && msg.data
            ? "bg-synth-emerald/8 border border-synth-emerald/20"
            : "bg-white/3 border border-white/8"
        }`}
      >
        {!isUser && (
          <p className="text-[9px] font-mono font-bold mb-0.5" style={{ color: isSystem ? "#ff6b35" : msg.color || "#9ca3af" }}>
            {isSystem ? "SYNTHCREW" : msg.from}
            {msg.role && <span className="text-gray-600 font-normal ml-1">· {msg.role}</span>}
            {msg.type === "tool_call" && <span className="text-synth-indigo ml-1">⚙ MCP</span>}
          </p>
        )}
        <p className={`text-sm leading-relaxed ${isUser ? "text-gray-200" : msg.type === "error" ? "text-red-300" : "text-gray-300"}`}>
          {msg.text}
        </p>
        {msg.data && (
          <details className="mt-2">
            <summary className="text-[9px] font-mono text-gray-500 cursor-pointer hover:text-gray-300">Voir les données</summary>
            <pre className="text-[9px] font-mono text-gray-500 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap bg-black/20 p-2 rounded">
              {typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data, null, 2)}
            </pre>
          </details>
        )}
        {msg.tasks && msg.tasks.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                <span className={task.status === "done" ? "text-emerald-400" : task.status === "active" ? "text-teal-400 animate-pulse" : "text-gray-600"}>
                  {task.status === "done" ? "✓" : task.status === "active" ? "●" : "○"}
                </span>
                <span className="text-gray-400">{task.label}</span>
                {task.agentName && <span className="text-gray-600">→ {task.agentName}</span>}
              </div>
            ))}
          </div>
        )}
        <p className="text-[8px] text-gray-600 mt-1 font-mono">{msg.time}</p>
      </div>
    </div>
  );
}

export default function OpsRoom() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [serverMode, setServerMode] = useState(true);
  const [messages, setMessages] = useState([
    { id: "welcome", from: "system", text: "Décris ta mission en langage naturel. NEXUS coordonne l'équipe et les outils MCP exécutent les tâches pour de vrai.", time: now() },
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
  } = useStore();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: `msg_${Date.now()}_${Math.random()}`, time: msg.time || now() }]);
  }, []);

  const onWsMessage = useCallback((msg) => {
    if (msg.type !== "mission_log") return;
    const { event, log, task, mission } = msg.payload || {};
    const mid = currentMissionIdRef.current;

    if (event === "mission_started" && mission) {
      currentMissionIdRef.current = mission.id;
      if (mission.tasks) {
        addMsg({
          from: "NEXUS", color: "#ff6b35", avatar: "🎯", role: "Orchestrateur",
          text: `Mission décomposée en ${mission.tasks.length} tâches réelles.`,
          tasks: mission.tasks.map((t) => ({ label: t.label, agentName: t.agentName, status: t.status })),
        });
      }
    }

    if (!log) return;

    if (event === "tool_call") {
      const agent = agents.find((a) => a.name === log.agent);
      addMsg({
        from: log.agent, color: agent?.color || "#6b7280", avatar: agent?.avatar,
        role: AGENT_ROLE_LABELS[agent?.role] || "", type: "tool_call",
        text: log.action,
      });
    }

    if (event === "tool_result") {
      const agent = agents.find((a) => a.name === log.agent);
      addMsg({
        from: log.agent, color: agent?.color || "#6b7280", avatar: agent?.avatar,
        role: AGENT_ROLE_LABELS[agent?.role] || "", type: log.type,
        text: log.action, data: log.data,
      });
    }

    if (event === "step_done" && task) {
      updateCurrentDagTask?.(task.id, "done");
      if (task.agentId) setAgentStatus?.(task.agentId, "idle");
    }

    if (event === "mission_completed" && mission) {
      setRunning(false);
      addMsg({ from: "system", text: `Mission "${mission.title}" terminée. ${mission.tasks?.length || 0} tâches exécutées avec de vrais outils MCP.` });
      addMission({ title: mission.title, status: "completed", taskCount: mission.tasks?.length || 0 });
    }
  }, [agents, addMsg, addMission, setAgentStatus, updateCurrentDagTask]);

  useWebSocket(onWsMessage);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || running) return;
    setPrompt("");
    setRunning(true);
    clearLog();

    addMsg({ from: "user", text });
    addMsg({ from: "system", text: serverMode ? "Envoi au serveur... NEXUS planifie et exécute avec les outils MCP réels." : "Mode local : NEXUS planifie (simulation)..." });

    if (serverMode) {
      try {
        const result = await executeMissionOnServer(text);
        currentMissionIdRef.current = result.mission?.id;
      } catch (e) {
        addMsg({ from: "system", text: `Serveur injoignable, bascule en mode local. ${e.message}`, type: "error" });
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
      from: "NEXUS", color: "#ff6b35", avatar: "🎯", role: "Orchestrateur",
      text: `Mission "${dag.title}" décomposée en ${dag.tasks.length} tâches (simulation locale).`,
      tasks: dag.tasks.map((t) => ({ label: t.label, agentName: t.agentName, status: t.status })),
    });

    try {
      await runMission(dag, {
        appendLog: (entry) => {
          useStore.getState().appendLog(entry);
          if (entry.type === "output") {
            const a = agents.find((x) => x.name === entry.agent);
            addMsg({
              from: entry.agent, color: a?.color || "#9ca3af", avatar: a?.avatar,
              role: AGENT_ROLE_LABELS[a?.role] || "", text: entry.action,
            });
          }
        },
        setAgentStatus: useStore.getState().setAgentStatus,
        updateCurrentDagTask: useStore.getState().updateCurrentDagTask,
      });
      addMission({ title: dag.title, status: "completed", taskCount: dag.tasks.length });
      addMsg({ from: "system", text: `Mission terminée (simulation). ${dag.tasks.length} tâches complétées.` });
    } catch (e) {
      addMsg({ from: "system", text: `Erreur : ${e.message}`, type: "error" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="shrink-0 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-sm font-bold text-gray-200 tracking-wide mb-0.5">MISSIONS</h1>
          <p className="text-[11px] text-gray-500">
            {serverMode ? "Exécution réelle : les outils MCP appellent de vrais services" : "Mode simulation locale"}
          </p>
        </div>
        <button
          onClick={() => setServerMode(!serverMode)}
          className={`text-[9px] font-mono px-3 py-1.5 rounded-lg border transition-colors ${
            serverMode
              ? "bg-synth-emerald/10 border-synth-emerald/30 text-synth-emerald"
              : "bg-white/5 border-white/10 text-gray-500"
          }`}
        >
          {serverMode ? "● LIVE" : "○ LOCAL"}
        </button>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="shrink-0 mb-4">
          <p className="text-[10px] text-gray-600 font-mono mb-2">MISSIONS RAPIDES — exécution réelle</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => setPrompt(qp.prompt)}
                className="text-left rounded-xl border border-white/8 bg-white/2 p-3 hover:border-synth-primary/30 hover:bg-synth-primary/5 transition-all group"
              >
                <p className="text-xs font-semibold text-gray-300 group-hover:text-synth-primary transition-colors">{qp.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{qp.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/8 bg-white/2 p-4 space-y-3 mb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {running && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-synth-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-synth-teal rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-synth-indigo rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-gray-600 font-mono">Agents en action{serverMode ? " (serveur)" : ""}...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Décris ta mission... (les outils MCP exécuteront de vrais appels)"
          disabled={running}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl outline-none text-gray-200 font-mono text-sm px-4 py-3 placeholder-gray-600 focus:border-synth-primary/40 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={running || !prompt.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-synth-primary to-synth-teal text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0"
        >
          {running ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString("fr-FR", { hour12: false });
}
