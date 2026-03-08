import { useState, useEffect } from "react";
import { getMissionTemplates } from "../lib/api";
import { useStore } from "../store/useStore";

export default function QuickLaunchModal({ onClose, onMissionLaunched, onAchievement }) {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const { agents } = useStore();

  useEffect(() => {
    getMissionTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const handleLaunch = async () => {
    const text = (prompt || "").trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mission/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, title: text.slice(0, 80) }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        onMissionLaunched?.();
        if (data.achievement) onAchievement?.(data.achievement);
      }
    } catch (e) {
      setError(e.message || "Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg rounded-xl border border-emerald-500/20 bg-[#080c15]/98 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </div>
            <h3 className="font-orbitron text-sm font-bold text-emerald-400">Mission envoyée</h3>
          </div>
          {result.result && (
            <div className="bg-black/30 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
              <p className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap">{result.result}</p>
            </div>
          )}
          {result.message && !result.result && (
            <p className="text-xs text-gray-400 mb-4">{result.message}</p>
          )}
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="synth-btn-primary text-xs">Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#080c15]/98 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-orbitron text-sm font-bold text-synth-primary mb-1">Nouvelle mission</h3>
        <p className="text-[10px] text-gray-600 mb-4 font-mono">Décris ce que l'équipage doit accomplir. Les agents seront assignés automatiquement.</p>

        {templates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPrompt(t.prompt || "")}
                className="text-[9px] font-mono px-2 py-1 rounded-lg border border-white/8 text-gray-500 hover:border-synth-primary/30 hover:text-synth-primary transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Analyse les tickets Zendesk et envoie un résumé Slack chaque lundi"
          className="w-full h-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none focus:border-synth-primary/30 outline-none transition-colors font-mono"
          onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleLaunch(); }}
        />

        {agents.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 mb-1">
            <span className="text-[8px] font-mono text-gray-600">ÉQUIPAGE :</span>
            {agents.slice(0, 7).map((a) => (
              <span key={a.id} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ color: a.color, borderColor: `${a.color}20`, border: "1px solid" }}>
                {a.name}
              </span>
            ))}
          </div>
        )}

        {error && <p className="text-[10px] text-red-400 mt-2 font-mono">{error}</p>}

        <div className="flex justify-between items-center mt-4">
          <p className="text-[8px] text-gray-700 font-mono">⌘↵ pour lancer</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="synth-btn-ghost text-[10px]">Annuler</button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={loading || !prompt.trim()}
              className="synth-btn-primary text-[10px] disabled:opacity-40"
            >
              {loading ? "Exécution..." : "Lancer la mission"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
