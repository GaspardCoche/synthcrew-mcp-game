/**
 * CLITerminal — Terminal embarqué dans SynthCrew.
 * Permet d'orchestrer les agents IA comme avec Claude Code, mais depuis le jeu.
 * Commandes : mission, agents, spawn, task, status, help, clear, exec, history
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStore } from "../store/useStore";
import { useWorldStore } from "../store/worldStore";
import { motion, AnimatePresence } from "framer-motion";

const VERSION = "SynthCrew CLI v3.0 — Powered by Claude";

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════╗
║           SYNTHCREW CLI — Orchestration d'Agents IA     ║
╚══════════════════════════════════════════════════════════╝

  MISSIONS
    mission "<prompt>"        Lance une mission IA
    mission run "<prompt>"    Exécution autonome avec Claude
    missions ls               Liste les missions récentes
    missions clear            Efface l'historique local

  AGENTS
    agents ls                 Liste l'équipage + statuts
    agent <name>              Détails d'un agent
    spawn <name>              Active un agent dormant
    agent <name> task "<cmd>" Assigne une tâche directe

  SYSTÈME
    status                    État global du monde
    services                  Outils MCP connectés
    env                       Variables d'environnement actives
    history                   Historique des commandes
    clear                     Efface le terminal
    help                      Affiche cette aide

  EXEMPLES
    > mission "Analyse les PRs GitHub et crée un résumé"
    > agent SPIDER task "Scrape les offres d'emploi Anthropic"
    > spawn CODEFORGE
    > missions ls
`.trim();

const ANSI_COLORS = {
  cyan:    "text-cyan-400",
  green:   "text-green-400",
  yellow:  "text-yellow-400",
  red:     "text-red-400",
  purple:  "text-purple-400",
  orange:  "text-orange-400",
  gray:    "text-gray-500",
  white:   "text-gray-200",
  bold:    "font-bold",
};

function TermLine({ line }) {
  const cls = [
    "font-jetbrains text-xs leading-5 whitespace-pre-wrap break-all",
    line.color ? ANSI_COLORS[line.color] : "text-gray-300",
    line.bold ? "font-bold" : "",
    line.dim ? "opacity-50" : "",
    line.blink ? "animate-pulse" : "",
  ].join(" ");
  return <div className={cls}>{line.text}</div>;
}

function AgentBadge({ name, status, color }) {
  const STATUS_ICONS = { active: "▶", idle: "●", queued: "◌", error: "✖", sleeping: "◐" };
  const STATUS_COLORS = { active: "text-green-400", idle: "text-gray-500", queued: "text-yellow-400", error: "text-red-400", sleeping: "text-blue-400" };
  return (
    <span className={`font-mono text-xs ${STATUS_COLORS[status] || "text-gray-500"}`}>
      {STATUS_ICONS[status] || "●"} <span style={{ color }}>{name}</span> [{status}]
    </span>
  );
}

export default function CLITerminal({ open, onClose }) {
  const agents = useStore((s) => s.agents);
  const missions = useStore((s) => s.missions);
  const totalMissions = useWorldStore((s) => s.totalMissionsCompleted);
  const missionCompleted = useWorldStore((s) => s.missionCompleted);

  const [lines, setLines] = useState([
    { text: VERSION, color: "cyan", bold: true },
    { text: 'Tape "help" pour la liste des commandes.', color: "gray" },
    { text: "", color: "gray" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const wsRef = useRef(null);
  const streamLineIdRef = useRef(null);

  // Connect WebSocket for streaming
  useEffect(() => {
    if (!open) return;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.PROD ? window.location.host : `${window.location.hostname}:3001`;
    const ws = new WebSocket(`${proto}//${host}/ws`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "cli_stream") {
          setLines((prev) => {
            const last = prev[prev.length - 1];
            if (last && last._streamId === msg.streamId) {
              return [...prev.slice(0, -1), { ...last, text: last.text + msg.chunk }];
            }
            return [...prev, { text: msg.chunk, color: "green", _streamId: msg.streamId }];
          });
        }
        if (msg.type === "cli_done") {
          setStreaming(false);
          appendLine({ text: "", color: "gray" });
        }
        if (msg.type === "cli_error") {
          setStreaming(false);
          appendLine({ text: `✖ ${msg.error}`, color: "red" });
          appendLine({ text: "", color: "gray" });
        }
        if (msg.type === "mission_log" && msg.payload?.event) {
          const ev = msg.payload;
          if (ev.event === "mission_step_done") {
            appendLine({ text: `  ✓ [${ev.agent}] ${ev.label}`, color: "green" });
          }
          if (ev.event === "mission_step_start") {
            appendLine({ text: `  ▶ [${ev.agent}] ${ev.label}...`, color: "yellow", blink: false });
          }
          if (ev.event === "mission_complete") {
            appendLine({ text: `✔ Mission terminée : ${ev.title}`, color: "cyan", bold: true });
            appendLine({ text: "", color: "gray" });
          }
          if (ev.event === "mission_failed") {
            appendLine({ text: `✖ Mission échouée : ${ev.title}`, color: "red" });
          }
        }
      } catch {}
    };
    ws.onopen = () => {
      appendLine({ text: "● Connecté au serveur SynthCrew", color: "green", dim: true });
    };
    ws.onclose = () => {
      appendLine({ text: "○ Déconnecté", color: "gray", dim: true });
    };
    return () => ws.close();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const appendLine = useCallback((line) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const appendLines = useCallback((newLines) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const printPrompt = useCallback((cmd) => {
    appendLine({ text: `> ${cmd}`, color: "orange", bold: true });
  }, [appendLine]);

  // Command parser
  const executeCommand = useCallback(async (raw) => {
    const cmd = raw.trim();
    if (!cmd) return;
    setHistory((h) => [cmd, ...h.slice(0, 99)]);
    setHistIdx(-1);
    printPrompt(cmd);

    const parts = cmd.split(/\s+/);
    const verb = parts[0].toLowerCase();
    const rest = cmd.slice(verb.length).trim();

    // ── help ──
    if (verb === "help") {
      HELP_TEXT.split("\n").forEach((t) => appendLine({ text: t, color: t.startsWith("  ") ? "white" : "cyan", bold: t.includes("══") }));
      appendLine({ text: "", color: "gray" });
      return;
    }

    // ── clear ──
    if (verb === "clear" || verb === "cls") {
      setLines([{ text: VERSION, color: "cyan", bold: true }, { text: "", color: "gray" }]);
      return;
    }

    // ── status ──
    if (verb === "status") {
      const active = agents.filter((a) => a.status === "active").length;
      const idle   = agents.filter((a) => a.status === "idle").length;
      appendLines([
        { text: "╔ SYNTHCREW WORLD STATUS ══════════════════╗", color: "cyan" },
        { text: `  Missions complétées  : ${totalMissions}`, color: "white" },
        { text: `  Agents actifs        : ${active}/${agents.length}`, color: active > 0 ? "green" : "gray" },
        { text: `  Agents en veille     : ${idle}`, color: "gray" },
        { text: "╚══════════════════════════════════════════╝", color: "cyan" },
        { text: "", color: "gray" },
      ]);
      return;
    }

    // ── history ──
    if (verb === "history") {
      if (history.length === 0) {
        appendLine({ text: "Aucun historique.", color: "gray" });
      } else {
        history.slice(0, 20).forEach((h, i) => appendLine({ text: `  ${String(i + 1).padStart(3)}  ${h}`, color: "gray" }));
      }
      appendLine({ text: "", color: "gray" });
      return;
    }

    // ── agents ls ──
    if (verb === "agents" && parts[1] === "ls") {
      appendLines([
        { text: "╔ ÉQUIPAGE ═════════════════════════════════", color: "cyan" },
        ...agents.map((a) => ({
          text: `  ${a.name.padEnd(12)} [${a.role.padEnd(15)}] ${a.status.toUpperCase().padEnd(8)} lv${a.level} · ${a.missions || 0} missions`,
          color: a.status === "active" ? "green" : a.status === "error" ? "red" : "white",
        })),
        { text: "╚══════════════════════════════════════════", color: "cyan" },
        { text: "", color: "gray" },
      ]);
      return;
    }

    // ── agent <name> ──
    if (verb === "agent" && parts.length >= 2 && parts[1] !== "ls" && !parts[2]) {
      const name = parts[1].toUpperCase();
      const a = agents.find((ag) => ag.name === name);
      if (!a) {
        appendLine({ text: `Agent "${name}" introuvable. Utilise "agents ls" pour voir l'équipage.`, color: "red" });
        appendLine({ text: "", color: "gray" });
        return;
      }
      appendLines([
        { text: `╔ AGENT : ${a.name} ═══════════════════════════`, color: "cyan" },
        { text: `  Rôle      : ${a.role}`, color: "white" },
        { text: `  Niveau    : ${a.level} (${a.missions || 0} missions)`, color: "white" },
        { text: `  Statut    : ${a.status}`, color: a.status === "active" ? "green" : "gray" },
        { text: `  Succès    : ${a.successRate || 0}%`, color: "yellow" },
        { text: `  MCPs      : ${(a.mcpIds || []).join(", ") || "aucun"}`, color: "purple" },
        { text: `  Bio       : ${a.personality || "—"}`, color: "gray" },
        { text: "╚══════════════════════════════════════════", color: "cyan" },
        { text: "", color: "gray" },
      ]);
      return;
    }

    // ── agent <name> task "<cmd>" ──
    if (verb === "agent" && parts[1] && parts[2] === "task") {
      const name = parts[1].toUpperCase();
      const taskMatch = rest.match(/task\s+"([^"]+)"/i) || rest.match(/task\s+'([^']+)'/i);
      const taskPrompt = taskMatch ? taskMatch[1] : rest.replace(/^task\s+/i, "");
      if (!taskPrompt) {
        appendLine({ text: 'Usage: agent <NAME> task "<prompt>"', color: "red" });
        return;
      }
      appendLine({ text: `▶ Assignation de tâche à ${name}...`, color: "yellow" });
      try {
        const res = await fetch("/api/cli/task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: taskPrompt, title: `[${name}] ${taskPrompt.slice(0, 60)}`, source: "cli", autoRun: true }),
        });
        const data = await res.json();
        if (data.ok) {
          appendLines([
            { text: `✓ Tâche envoyée → ${data.mission.id}`, color: "green" },
            { text: `  "${taskPrompt.slice(0, 80)}"`, color: "gray" },
            { text: "", color: "gray" },
          ]);
        } else {
          appendLine({ text: `✖ Erreur : ${data.error}`, color: "red" });
        }
      } catch (e) {
        appendLine({ text: `✖ Réseau : ${e.message}`, color: "red" });
      }
      return;
    }

    // ── spawn <name> ──
    if (verb === "spawn") {
      const name = parts[1]?.toUpperCase();
      if (!name) {
        appendLine({ text: "Usage: spawn <AGENT_NAME>", color: "red" });
        return;
      }
      const a = agents.find((ag) => ag.name === name);
      if (!a) {
        appendLine({ text: `Agent "${name}" introuvable.`, color: "red" });
        appendLine({ text: "", color: "gray" });
        return;
      }
      appendLines([
        { text: `◎ Activation de ${name}...`, color: "yellow", blink: true },
      ]);
      try {
        await fetch(`/api/agents/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "idle" }),
        });
        appendLines([
          { text: `✓ ${name} est maintenant en ligne.`, color: "green" },
          { text: "", color: "gray" },
        ]);
      } catch (e) {
        appendLine({ text: `✖ ${e.message}`, color: "red" });
      }
      return;
    }

    // ── missions ls ──
    if (verb === "missions" && parts[1] === "ls") {
      const recent = missions.slice(0, 10);
      if (recent.length === 0) {
        appendLine({ text: "Aucune mission dans l'historique.", color: "gray" });
      } else {
        appendLine({ text: "╔ MISSIONS RÉCENTES ═════════════════════", color: "cyan" });
        recent.forEach((m) => {
          const date = m.createdAt ? new Date(m.createdAt).toLocaleTimeString("fr-FR") : "—";
          const statusColor = m.status === "completed" ? "green" : m.status === "pending" ? "yellow" : "red";
          appendLine({
            text: `  [${date}] ${m.status.padEnd(9)} ${(m.title || m.prompt || "").slice(0, 55)}`,
            color: statusColor,
          });
        });
        appendLine({ text: "╚══════════════════════════════════════════", color: "cyan" });
      }
      appendLine({ text: "", color: "gray" });
      return;
    }

    // ── services / env ──
    if (verb === "services" || verb === "env") {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        appendLine({ text: "╔ SERVICES MCP CONNECTÉS ═══════════════", color: "cyan" });
        Object.entries(data.services || {}).forEach(([k, v]) => {
          appendLine({ text: `  ${k.padEnd(20)} ${v ? "✓ actif" : "○ inactif"}`, color: v ? "green" : "gray" });
        });
        appendLine({ text: "╚══════════════════════════════════════════", color: "cyan" });
        if (data.tools?.length) {
          appendLine({ text: `  Outils disponibles : ${data.tools.join(", ")}`, color: "purple" });
        }
        appendLine({ text: "", color: "gray" });
      } catch {
        appendLine({ text: "✖ Impossible de contacter le serveur.", color: "red" });
      }
      return;
    }

    // ── mission "<prompt>" ──
    if (verb === "mission") {
      const autoRun = parts[1] === "run";
      let promptRaw = autoRun ? rest.slice(3).trim() : rest;
      // Strip quotes
      const quoted = promptRaw.match(/^["'](.+)["']$/s);
      const prompt = quoted ? quoted[1] : promptRaw;
      if (!prompt) {
        appendLine({ text: 'Usage: mission "votre prompt de mission"', color: "red" });
        appendLine({ text: "       mission run \"prompt\"  — exécution autonome via Claude", color: "gray" });
        return;
      }
      appendLine({ text: `▶ Envoi de la mission...`, color: "yellow" });
      appendLine({ text: `  "${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}"`, color: "gray" });
      setStreaming(true);
      try {
        const res = await fetch("/api/cli/task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            title: prompt.slice(0, 80),
            source: "cli",
            autoRun: autoRun,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          appendLines([
            { text: `✓ Mission créée → ${data.mission.id}`, color: "green" },
            { text: autoRun
              ? "  L'équipage traite la mission. Les logs arrivent en temps réel."
              : "  Mission enregistrée. Lance avec 'mission run' pour exécution autonome.", color: "gray" },
            { text: "", color: "gray" },
          ]);
          missionCompleted({ agentName: "NEXUS" });
        } else {
          appendLine({ text: `✖ Erreur : ${data.error}`, color: "red" });
        }
      } catch (e) {
        appendLine({ text: `✖ Réseau : ${e.message}`, color: "red" });
      }
      setStreaming(false);
      return;
    }

    // ── exec <command> (pass-through to server) ──
    if (verb === "exec") {
      const execCmd = rest;
      if (!execCmd) {
        appendLine({ text: "Usage: exec <commande>", color: "red" });
        return;
      }
      appendLine({ text: `⟳ exec: ${execCmd}`, color: "yellow", dim: true });
      try {
        const res = await fetch("/api/cli/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: execCmd }),
        });
        const data = await res.json();
        if (data.output) {
          data.output.split("\n").forEach((l) => appendLine({ text: l, color: "white" }));
        }
        if (data.error) appendLine({ text: `✖ ${data.error}`, color: "red" });
      } catch (e) {
        appendLine({ text: `✖ ${e.message}`, color: "red" });
      }
      appendLine({ text: "", color: "gray" });
      return;
    }

    // Unknown command
    appendLines([
      { text: `Commande inconnue : "${verb}"`, color: "red" },
      { text: `Tape "help" pour voir les commandes disponibles.`, color: "gray" },
      { text: "", color: "gray" },
    ]);
  }, [agents, missions, history, totalMissions, appendLine, appendLines, printPrompt, missionCompleted]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      const cmd = input;
      setInput("");
      executeCommand(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistIdx((i) => {
        const ni = Math.min(i + 1, history.length - 1);
        if (history[ni]) setInput(history[ni]);
        return ni;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistIdx((i) => {
        const ni = Math.max(i - 1, -1);
        setInput(ni >= 0 ? history[ni] : "");
        return ni;
      });
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Tab completion
      const cmds = ["help", "clear", "status", "history", "agents ls", "agent ", "spawn ", "missions ls", "mission ", "mission run ", "services", "env", "exec "];
      const match = cmds.find((c) => c.startsWith(input));
      if (match) setInput(match);
    } else if (e.ctrlKey && e.key === "c") {
      setStreaming(false);
      appendLine({ text: "^C", color: "red" });
      appendLine({ text: "", color: "gray" });
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setLines([{ text: VERSION, color: "cyan", bold: true }, { text: "", color: "gray" }]);
    }
  }, [input, history, executeCommand, onClose, appendLine]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed inset-x-4 bottom-4 top-auto z-50 max-h-[55vh] md:inset-x-auto md:left-4 md:right-4 lg:left-8 lg:right-8 xl:left-16 xl:right-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full rounded-xl border border-cyan-500/25 bg-black/92 backdrop-blur-xl shadow-2xl shadow-cyan-900/20 overflow-hidden">
          {/* Titlebar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 bg-white/3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[10px] text-gray-400 font-jetbrains ml-2 tracking-widest uppercase">SynthCrew Terminal</span>
              {streaming && (
                <span className="text-[9px] text-cyan-400 font-jetbrains animate-pulse ml-2">● streaming</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-gray-600 font-jetbrains">Tab=complétion  ↑↓=historique  Échap=fermer</span>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-xs">✕</button>
            </div>
          </div>

          {/* Output */}
          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            {lines.map((line, i) => (
              <TermLine key={i} line={line} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/8 bg-white/2 flex-shrink-0">
            <span className="text-cyan-400 font-jetbrains text-xs flex-shrink-0">
              synthcrew
            </span>
            <span className="text-gray-600 font-jetbrains text-xs flex-shrink-0">▶</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming}
              spellCheck={false}
              autoComplete="off"
              placeholder={streaming ? "Streaming…" : ""}
              className="flex-1 bg-transparent text-gray-200 font-jetbrains text-xs outline-none placeholder-gray-700 caret-cyan-400"
            />
            {streaming && (
              <div className="w-3 h-3 border border-cyan-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
