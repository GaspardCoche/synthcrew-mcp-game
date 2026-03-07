import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { ORCHESTRATOR_QUESTIONS, suggestRolesFromMemory, AGENT_ROLE_LABELS } from "../lib/constants";
import AgentAvatar from "./AgentAvatar";

export default function OrchestratorBriefing({ onComplete, onSkip }) {
  const { agents, setOrchestratorMemory, setSuggestedTeamRoleIds } = useStore();
  const [step, setStep] = useState(0);
  const [memory, setMemory] = useState({ goal: "", sources: "", deliverable: "", constraints: "" });
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);

  const currentQ = ORCHESTRATOR_QUESTIONS[step];
  const isLastQuestion = step === ORCHESTRATOR_QUESTIONS.length - 1;

  const handleNext = () => {
    if (!currentQ) return;
    const key = currentQ.key;
    const value = memory[key]?.trim() || "";
    setMemory((m) => ({ ...m, [key]: value }));

    if (isLastQuestion) {
      setOrchestratorMemory({ ...memory, [key]: value });
      const suggestedRoles = suggestRolesFromMemory({ ...memory, [key]: value });
      setSuggestedTeamRoleIds(suggestedRoles);
      const suggestedAgentsList = suggestedRoles.map((role) => agents.find((a) => a.role === role)).filter(Boolean);
      setSelectedAgentIds(suggestedAgentsList.map((a) => a.id));
      setStep(ORCHESTRATOR_QUESTIONS.length);
    } else {
      setStep((s) => s + 1);
    }
  };

  const suggestedAgents = () => {
    const roles = suggestRolesFromMemory(memory);
    return roles.map((role) => agents.find((a) => a.role === role)).filter(Boolean);
  };

  const buildPromptFromMemory = () => {
    const parts = [];
    if (memory.goal) parts.push(memory.goal);
    if (memory.sources) parts.push(`Sources: ${memory.sources}`);
    if (memory.deliverable) parts.push(`Livrable: ${memory.deliverable}`);
    if (memory.constraints) parts.push(`Contraintes: ${memory.constraints}`);
    return parts.join(". ") || "Mission personnalisée";
  };

  const handleContinueToMission = () => {
    const prompt = buildPromptFromMemory();
    const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));
    const roles = selectedAgents.map((a) => a.role);
    setOrchestratorMemory(memory);
    setSuggestedTeamRoleIds(roles);
    onComplete({ prompt, memory, suggestedRoles: roles, selectedAgentIds, selectedAgents });
  };

  if (step >= ORCHESTRATOR_QUESTIONS.length) {
    const team = suggestedAgents();
    const toggleAgent = (id) => setSelectedAgentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    const selectedCount = selectedAgentIds.length;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h3 className="font-orbitron text-sm font-bold text-amber-400">Équipe recommandée</h3>
            <p className="font-jetbrains text-xs text-gray-400">Coche ou décoche les agents pour cette mission ({selectedCount} sélectionné{selectedCount !== 1 ? "s" : ""}).</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {team.map((a) => {
            const checked = selectedAgentIds.includes(a.id);
            return (
              <motion.button
                key={a.id}
                type="button"
                onClick={() => toggleAgent(a.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: team.indexOf(a) * 0.08 }}
                className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-all ${
                  checked ? "border-amber-500/40 bg-amber-500/10" : "border-amber-500/20 bg-black/20 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAgent(a.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-amber-500/50 bg-black/30"
                  />
                  <AgentAvatar agent={a} size="md" />
                </div>
                <span className="font-jetbrains font-semibold text-xs truncate w-full text-center" style={{ color: a.color }}>
                  {a.name}
                </span>
                <span className="font-jetbrains text-[10px] text-gray-500">{AGENT_ROLE_LABELS[a.role] || a.role}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleContinueToMission}
            disabled={selectedCount === 0}
            className="font-orbitron text-xs font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer vers la mission →
          </button>
          <button
            onClick={() => setStep(0)}
            className="font-jetbrains text-xs px-4 py-2.5 rounded-xl border border-white/20 text-gray-400 hover:text-white"
          >
            Modifier le brief
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-synth-cyan/20 bg-synth-panel p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎯</span>
        <div>
          <h3 className="font-orbitron text-sm font-bold text-synth-cyan">Brief CONDUCTOR</h3>
          <p className="font-jetbrains text-xs text-gray-500">L'orchestrateur pose quelques questions pour proposer l'équipe la plus pertinente.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex gap-2 items-center">
            <span className="font-jetbrains text-[10px] px-2 py-1 rounded bg-synth-cyan/20 text-synth-cyan">
              {step + 1}/{ORCHESTRATOR_QUESTIONS.length}
            </span>
            <label className="font-jetbrains text-sm font-semibold text-gray-300">{currentQ?.label}</label>
          </div>
          <input
            type="text"
            value={memory[currentQ?.key] ?? ""}
            onChange={(e) => setMemory((m) => ({ ...m, [currentQ?.key]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            placeholder={currentQ?.placeholder}
            className="w-full bg-white/5 border border-synth-border rounded-xl px-4 py-3 font-jetbrains text-sm text-gray-200 placeholder-gray-500 focus:border-synth-cyan/50 focus:ring-1 focus:ring-synth-cyan/30 outline-none transition-all"
            autoFocus
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onSkip} className="font-jetbrains text-xs text-gray-500 hover:text-gray-300">
          Passer le brief
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="font-orbitron text-xs font-bold px-4 py-2 rounded-lg bg-synth-cyan/20 text-synth-cyan border border-synth-cyan/40 hover:bg-synth-cyan/30 transition-all"
        >
          {isLastQuestion ? "Voir l'équipe" : "Suivant →"}
        </button>
      </div>
    </motion.div>
  );
}
