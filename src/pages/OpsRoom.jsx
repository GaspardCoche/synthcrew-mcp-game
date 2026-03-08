import { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { planMission, runMission } from "../lib/missionRunner";
import { getMissionTemplates, createMission } from "../lib/api";
import { AGENT_ROLE_LABELS } from "../lib/constants";
import AgentAvatar from "../components/AgentAvatar";

const QUICK_PROMPTS = [
  { label: "Rapport hebdo", prompt: "Génère un rapport hebdomadaire à partir des données GitHub et Notion, envoie-le sur Slack" },
  { label: "Tri tickets", prompt: "Analyse les tickets support, catégorise-les et crée un résumé des tendances" },
  { label: "Veille web", prompt: "Fais une veille technologique sur les dernières tendances IA et résume dans une page Notion" },
  { label: "Code review", prompt: "Analyse les dernières PRs GitHub, identifie les problèmes potentiels et génère un rapport" },
];

function MessageBubble({ msg }) {
  const isSystem = msg.from === "system";
  const isUser = msg.from === "user";
  const agent = !isSystem && !isUser ? msg.from : null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: isSystem ? "rgba(255,107,53,0.15)" : `${msg.color || "#6b7280"}20`,
            color: isSystem ? "#ff6b35" : msg.color || "#6b7280",
            border: `1px solid ${isSystem ? "rgba(255,107,53,0.3)" : (msg.color || "#6b7280") + "40"}`,
          }}
        >
          {isSystem ? "S" : (msg.avatar || agent?.[0] || "?")}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
          isUser
            ? "bg-synth-primary/15 border border-synth-primary/30"
            : isSystem
            ? "bg-white/3 border border-white/8"
            : "bg-white/3 border border-white/8"
        }`}
      >
        {!isUser && (
          <p className="text-[9px] font-mono font-bold mb-0.5" style={{ color: isSystem ? "#ff6b35" : msg.color || "#9ca3af" }}>
            {isSystem ? "SYNTHCREW" : msg.from}
            {msg.role && <span className="text-gray-600 font-normal ml-1">· {msg.role}</span>}
          </p>
        )}
        <p className={`text-sm leading-relaxed ${isUser ? "text-gray-200" : "text-gray-300"}`}>
          {msg.text}
        </p>
        {msg.tasks && msg.tasks.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                <span className={task.status === "done" ? "text-emerald-400" : task.status === "active" ? "text-teal-400" : "text-gray-600"}>
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
  const [messages, setMessages] = useState([
    { id: "welcome", from: "system", text: "Décris ta mission en langage naturel. NEXUS décomposera ta demande et coordonnera l'équipe.", time: new Date().toLocaleTimeString("fr-FR", { hour12: false }) },
  ]);
  const [templates, setTemplates] = useState([]);
  const chatEndRef = useRef(null);
  const {
    agents,
    setCurrentMissionDag,
    clearLog,
    appendLog,
    addMission,
  } = useStore();

  useEffect(() => {
    getMissionTemplates().then(setTemplates).catch(() => []);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = (msg) => {
    setMessages((prev) => [...prev, { ...msg, id: `msg_${Date.now()}_${Math.random()}`, time: new Date().toLocaleTimeString("fr-FR", { hour12: false }) }]);
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || running) return;
    setPrompt("");

    addMsg({ from: "user", text });

    setRunning(true);
    clearLog();

    await new Promise((r) => setTimeout(r, 400));

    addMsg({ from: "system", text: "NEXUS analyse ta demande et prépare un plan..." });

    await new Promise((r) => setTimeout(r, 600));

    const dag = planMission(text, {});
    setCurrentMissionDag(dag);

    const taskSummary = dag.tasks.map((t) => ({
      label: t.label,
      agentName: t.agentName,
      status: "queued",
    }));

    addMsg({
      from: "NEXUS",
      color: "#ff6b35",
      avatar: "🎯",
      role: "Orchestrateur",
      text: `Mission "${dag.title}" décomposée en ${dag.tasks.length} tâches.`,
      tasks: taskSummary,
    });

    const teamAgents = [...new Set(dag.tasks.map((t) => t.agentName))].filter(Boolean);
    const teamDetails = teamAgents.map((name) => {
      const a = agents.find((x) => x.name === name);
      return a ? `${a.name} (${AGENT_ROLE_LABELS[a.role] || a.role})` : name;
    });

    addMsg({
      from: "NEXUS",
      color: "#ff6b35",
      avatar: "🎯",
      role: "Orchestrateur",
      text: `Équipe mobilisée : ${teamDetails.join(", ")}. Exécution en cours...`,
    });

    try {
      const get = useStore.getState;
      await runMission(dag, {
        appendLog: (entry) => {
          get().appendLog(entry);
          if (entry.type === "output" && entry.agent !== "SYSTÈME") {
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
        setAgentStatus: get().setAgentStatus,
        updateCurrentDagTask: get().updateCurrentDagTask,
      });

      addMission({ title: dag.title, status: "completed", taskCount: dag.tasks.length });
      const templateId = templates.find((t) => t.prompt === dag.title)?.id;
      await createMission({ title: dag.title, status: "completed", taskCount: dag.tasks.length, templateId }).catch(() => {});

      addMsg({
        from: "system",
        text: `Mission "${dag.title}" terminée avec succès. ${dag.tasks.length} tâches complétées.`,
      });
    } catch (e) {
      addMsg({ from: "system", text: `Erreur : ${e.message}` });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <h1 className="font-orbitron text-sm font-bold text-gray-200 tracking-wide mb-1">MISSIONS</h1>
        <p className="text-sm text-gray-500">
          Parle à ton équipage. Décris ce que tu veux, NEXUS s'occupe du reste.
        </p>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="shrink-0 mb-4">
          <p className="text-[10px] text-gray-600 font-mono mb-2">MISSIONS RAPIDES</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => { setPrompt(qp.prompt); }}
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
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/8 bg-white/2 p-4 space-y-4 mb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {running && (
          <div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-synth-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-synth-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-synth-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-gray-600 font-mono">Agents en action...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Active agents */}
      {running && (
        <div className="shrink-0 mb-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-[9px] text-gray-600 font-mono shrink-0">ACTIFS :</span>
          {agents.filter((a) => a.status === "active").map((a) => (
            <div key={a.id} className="flex items-center gap-1 shrink-0">
              <AgentAvatar agent={a} size="sm" />
              <span className="text-[10px] font-mono" style={{ color: a.color }}>{a.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Décris ta mission... (ex: Analyse les tickets et crée un rapport Notion)"
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
