import { useState, useEffect } from "react";
import { getStats, getMissionTemplates, createMission } from "../lib/api";
import { planMission } from "../lib/missionRunner";
import { useStore } from "../store/useStore";

export default function QuickLaunchModal({ onClose, onMissionLaunched, onAchievement, onGoToOpsRoom }) {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [justCreated, setJustCreated] = useState(false);
  const { agents } = useStore();

  useEffect(() => {
    getMissionTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const applyTemplate = (t) => {
    setPrompt(t.prompt || "");
  };

  const handleLaunch = async () => {
    const text = (prompt || "").trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createMission({
        title: text.slice(0, 80),
        status: "completed",
        taskCount: planMission(text).tasks.length,
        templateId: templates.find((x) => x.prompt === text)?.id,
      });
      onMissionLaunched?.();
      if (res.achievement) onAchievement?.(res.achievement);
      setJustCreated(true);
    } catch (e) {
      setError(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const goToOps = () => {
    onGoToOpsRoom?.();
    onClose();
  };

  if (justCreated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-lg rounded-2xl border border-cyan-500/20 bg-[#0d0a18]/98 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-jetbrains text-sm text-gray-300 mb-4">Mission enregistrée. Les stats et achievements ont été mis à jour.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 text-sm">
              OK
            </button>
            {onGoToOpsRoom && (
              <button
                type="button"
                onClick={goToOps}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium text-sm"
              >
                Aller à l&apos;Ops Room pour exécuter
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-cyan-500/20 bg-[#0d0a18]/98 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-orbitron text-sm font-bold text-cyan-400 mb-3">Lancer une mission (quick launch)</h3>
        <p className="text-xs text-gray-500 mb-3">Choisis un template ou décris ta mission. Elle sera enregistrée et les stats mises à jour.</p>
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-[10px] px-2 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Analyse les tickets Zendesk et envoie un résumé Slack"
          className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none"
        />
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 text-sm">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium text-sm disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Lancer"}
          </button>
        </div>
      </div>
    </div>
  );
}
