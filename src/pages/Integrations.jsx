import { useState, useCallback } from "react";

function getApiBase() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function getCurlExample(base) {
  const url = `${base}/api/cli/task`;
  return `curl -X POST ${url} \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Ta mission ici", "source": "claude-cli", "autoRun": true}'`;
}

export default function Integrations() {
  const [copied, setCopied] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [cliPrompt, setCliPrompt] = useState("");
  const [cliResult, setCliResult] = useState(null);
  const [cliSending, setCliSending] = useState(false);
  const base = getApiBase();
  const curlExample = getCurlExample(base);

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch(`${base}/api/health`);
      const data = await r.json();
      setTestResult(r.ok ? { ok: true, data } : { ok: false, status: r.status });
    } catch (e) {
      setTestResult({ ok: false, error: e.message });
    } finally {
      setTesting(false);
    }
  }, [base]);

  const sendCliMission = useCallback(async () => {
    const prompt = cliPrompt.trim();
    if (!prompt) return;
    setCliSending(true);
    setCliResult(null);
    try {
      const r = await fetch(`${base}/api/cli/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, source: "claude-cli", autoRun: true }),
      });
      const data = await r.json();
      setCliResult(r.ok ? { ok: true, ...data } : { ok: false, error: data.error || r.status });
    } catch (e) {
      setCliResult({ ok: false, error: e.message });
    } finally {
      setCliSending(false);
    }
  }, [base, cliPrompt]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-orbitron text-sm font-black text-synth-cyan tracking-widest mb-1">CONNECTER LA CLI</h1>
        <p className="font-jetbrains text-xs text-gray-500">
          Utilise cette URL depuis Claude Code CLI, Cursor ou tout outil qui envoie des requêtes HTTP. Aucune installation locale : copie depuis ici.
        </p>
      </div>

      <div className="rounded-xl border border-synth-cyan/20 bg-synth-panel p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label className="font-jetbrains text-xs font-bold text-gray-400 tracking-wide">URL de l’API</label>
          <button
            type="button"
            onClick={() => copy(base, "url")}
            className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg bg-synth-cyan/10 border border-synth-cyan/30 text-synth-cyan hover:bg-synth-cyan/20"
          >
            {copied === "url" ? "Copié" : "Copier"}
          </button>
        </div>
        <code className="block font-jetbrains text-sm text-gray-300 bg-black/30 rounded-lg px-4 py-3 break-all">
          {base}
        </code>
      </div>

      <div className="rounded-xl border border-synth-border bg-synth-panel p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label className="font-jetbrains text-xs font-bold text-gray-400 tracking-wide">Exemple de commande (créer une mission)</label>
          <button
            type="button"
            onClick={() => copy(curlExample, "curl")}
            className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg bg-synth-purple/10 border border-synth-purple/30 text-synth-purple hover:bg-synth-purple/20"
          >
            {copied === "curl" ? "Copié" : "Copier curl"}
          </button>
        </div>
        <pre className="font-jetbrains text-[11px] text-gray-400 bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
          {curlExample}
        </pre>
      </div>

      <div className="rounded-xl border border-synth-border bg-synth-panel p-5 space-y-4">
        <label className="font-jetbrains text-xs font-bold text-gray-400 tracking-wide">Tester la connexion</label>
        <p className="font-jetbrains text-[11px] text-gray-500">
          Vérifie que le serveur répond (GET /api/health).
        </p>
        <button
          type="button"
          onClick={testConnection}
          disabled={testing}
          className="font-jetbrains text-xs px-4 py-2 rounded-lg bg-synth-green/10 border border-synth-green/30 text-synth-green hover:bg-synth-green/20 disabled:opacity-50"
        >
          {testing ? "Test en cours…" : "Tester la connexion"}
        </button>
        {testResult && (
          <div className={`font-jetbrains text-xs rounded-lg p-3 ${testResult.ok ? "bg-synth-green/10 border border-synth-green/30 text-synth-green" : "bg-synth-red/10 border border-synth-red/30 text-synth-red"}`}>
            {testResult.ok ? (
              <>✓ Connexion OK — {JSON.stringify(testResult.data)}</>
            ) : (
              <>✗ Erreur — {testResult.error || `HTTP ${testResult.status}`}</>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-synth-border bg-synth-panel p-5 space-y-4">
        <label className="font-jetbrains text-xs font-bold text-gray-400 tracking-wide">Envoyer une mission depuis ici</label>
        <p className="font-jetbrains text-[11px] text-gray-500">
          Décris la mission en texte ; elle sera créée et lancée via l’API CLI.
        </p>
        <textarea
          value={cliPrompt}
          onChange={(e) => setCliPrompt(e.target.value)}
          placeholder="Ex: Rédige un résumé des dernières missions et envoie-le par email"
          className="font-jetbrains text-xs w-full bg-black/30 border border-synth-border rounded-lg px-4 py-3 text-gray-300 placeholder-gray-500 resize-y min-h-[80px]"
          rows={3}
        />
        <button
          type="button"
          onClick={sendCliMission}
          disabled={cliSending || !cliPrompt.trim()}
          className="font-jetbrains text-xs px-4 py-2 rounded-lg bg-synth-cyan/10 border border-synth-cyan/30 text-synth-cyan hover:bg-synth-cyan/20 disabled:opacity-50"
        >
          {cliSending ? "Envoi…" : "Envoyer la mission"}
        </button>
        {cliResult && (
          <div className={`font-jetbrains text-xs rounded-lg p-3 ${cliResult.ok ? "bg-synth-green/10 border border-synth-green/30 text-synth-green" : "bg-synth-red/10 border border-synth-red/30 text-synth-red"}`}>
            {cliResult.ok ? (
              <>✓ Mission créée — {cliResult.taskId ? `ID: ${cliResult.taskId}` : JSON.stringify(cliResult)}</>
            ) : (
              <>✗ Erreur — {cliResult.error}</>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="font-orbitron text-xs font-bold text-gray-400 tracking-wide mb-2">Comment connecter ?</h2>
        <ol className="font-jetbrains text-[11px] text-gray-500 space-y-2 list-decimal list-inside">
          <li>Ouvre ton outil (Claude Code CLI, Cursor, script).</li>
          <li>Configure l’URL de l’API avec la valeur ci-dessus (ou la variable d’environnement de ton outil).</li>
          <li>Pour envoyer une mission : POST sur <code className="text-gray-400">/api/cli/task</code> avec un JSON <code className="text-gray-400">{"{ \"prompt\": \"…\", \"autoRun\": true }"}</code>.</li>
          <li>Les missions apparaissent ici dans le Village et l’Atelier en temps réel.</li>
        </ol>
      </div>
    </div>
  );
}
