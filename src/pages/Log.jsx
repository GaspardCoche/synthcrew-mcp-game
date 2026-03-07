import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { Link } from "react-router-dom";
import { getAchievements, getAchievementDefinitions } from "../lib/api";
import { MISSION_STATUS } from "../lib/constants";

function MissionStatusBadge({ status }) {
  const s = MISSION_STATUS[status] || MISSION_STATUS.completed;
  return (
    <span className={`font-jetbrains text-[10px] px-2 py-1 rounded border ${s.bg} ${s.color} ${s.border}`}>
      {s.label}
    </span>
  );
}

export default function Log() {
  const { missions, automations, addAutomation, toggleAutomation, removeAutomation } = useStore();
  const [tab, setTab] = useState("missions");
  const [newCronPrompt, setNewCronPrompt] = useState("");
  const [newCronSchedule, setNewCronSchedule] = useState("Tous les jours à 9h");
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [definitions, setDefinitions] = useState([]);

  useEffect(() => {
    getAchievements().then(setUnlockedIds).catch(() => []);
    getAchievementDefinitions().then(setDefinitions).catch(() => []);
  }, [tab]);

  const handleAddCron = (e) => {
    e.preventDefault();
    if (!newCronPrompt.trim()) return;
    addAutomation({ name: newCronPrompt.slice(0, 50), prompt: newCronPrompt, schedule: newCronSchedule });
    setNewCronPrompt("");
    setNewCronSchedule("Tous les jours à 9h");
  };

  return (
    <div className="space-y-6">
      <div className="font-orbitron text-xs font-bold text-gray-400 tracking-wide">CHRONIQUES — Historique & achievements</div>

      <div className="flex gap-2 border-b border-synth-border pb-2">
        <button
          onClick={() => setTab("missions")}
          className={`font-jetbrains text-xs px-3 py-1.5 rounded-lg ${tab === "missions" ? "bg-synth-cyan/10 text-synth-cyan border border-synth-cyan/20" : "text-gray-500"}`}
        >
          Historique missions
        </button>
        <button
          onClick={() => setTab("automations")}
          className={`font-jetbrains text-xs px-3 py-1.5 rounded-lg ${tab === "automations" ? "bg-synth-cyan/10 text-synth-cyan border border-synth-cyan/20" : "text-gray-500"}`}
        >
          Automations (Cron)
        </button>
        <button
          onClick={() => setTab("achievements")}
          className={`font-jetbrains text-xs px-3 py-1.5 rounded-lg ${tab === "achievements" ? "bg-synth-cyan/10 text-synth-cyan border border-synth-cyan/20" : "text-gray-500"}`}
        >
          Achievements
        </button>
      </div>

      {tab === "missions" && (
        <div className="space-y-2">
          {missions.length === 0 && (
            <div className="text-gray-500 font-jetbrains text-sm py-8 text-center">
              Aucune mission encore. <Link to="/classic/ops" className="text-synth-cyan">Lance-en une depuis l&apos;Atelier</Link>.
            </div>
          )}
          {missions.map((m) => (
            <div key={m.id} className="rounded-xl border border-synth-border bg-synth-panel px-4 py-3 flex justify-between items-center">
              <div>
                <div className="font-jetbrains text-sm">{m.title}</div>
                <div className="font-jetbrains text-[10px] text-gray-500">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString("fr-FR") : ""} · {m.taskCount || 0} tâches
                </div>
              </div>
              <MissionStatusBadge status={m.status || "completed"} />
            </div>
          ))}
        </div>
      )}

      {tab === "automations" && (
        <div className="space-y-4">
          <form onSubmit={handleAddCron} className="rounded-xl border border-synth-border bg-synth-panel p-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newCronPrompt}
              onChange={(e) => setNewCronPrompt(e.target.value)}
              placeholder="Ex: Résumé des emails non lus"
              className="flex-1 bg-white/5 border border-synth-border rounded-lg px-3 py-2 font-jetbrains text-sm"
            />
            <input
              type="text"
              value={newCronSchedule}
              onChange={(e) => setNewCronSchedule(e.target.value)}
              className="w-48 bg-white/5 border border-synth-border rounded-lg px-3 py-2 font-jetbrains text-sm"
            />
            <button type="submit" className="font-orbitron text-xs font-bold px-4 py-2 rounded-lg bg-synth-cyan/20 text-synth-cyan border border-synth-cyan/30">
              + Ajouter
            </button>
          </form>
          {automations.length === 0 && (
            <div className="text-gray-500 font-jetbrains text-sm py-6 text-center">
              Aucune automatisation. Ajoute une mission récurrente ci-dessus (en production : exécution réelle selon le planning).
            </div>
          )}
          {automations.map((a) => (
            <div key={a.id} className="rounded-xl border border-synth-border bg-synth-panel px-4 py-3 flex justify-between items-center">
              <div>
                <div className="font-jetbrains text-sm">{a.name || a.prompt?.slice(0, 50)}</div>
                <div className="font-jetbrains text-[10px] text-gray-500">{a.schedule}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAutomation(a.id)} className="font-jetbrains text-[10px] text-synth-cyan">
                  {a.enabled ? "Désactiver" : "Activer"}
                </button>
                <button onClick={() => removeAutomation(a.id)} className="font-jetbrains text-[10px] text-synth-red">
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "achievements" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {definitions.length === 0 && (
            <div className="col-span-full text-gray-500 font-jetbrains text-sm py-8 text-center">
              Chargement…
            </div>
          )}
          {definitions.map((a) => {
            const unlocked = unlockedIds.includes(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-4 flex items-center gap-3 ${
                  unlocked ? "border-amber-500/30 bg-amber-500/5" : "border-synth-border bg-synth-panel opacity-60"
                }`}
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="font-jetbrains font-semibold text-sm">{a.name}</div>
                  <div className="font-jetbrains text-[10px] text-gray-500">{a.desc}</div>
                </div>
                {unlocked && <span className="ml-auto text-amber-400 text-xs">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
