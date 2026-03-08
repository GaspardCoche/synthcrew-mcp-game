import { useState, useCallback, useEffect } from "react";
import { useStore } from "../store/useStore";

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

function ServiceStatusPanel() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
      .catch(() => setServices(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-[10px] font-mono text-gray-600">Chargement des services...</div>;
  if (!services) return <div className="text-[10px] font-mono text-red-400">Impossible de charger les services</div>;

  const svcList = services.services || [];
  const toolList = services.tools || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {svcList.map((svc) => (
          <div
            key={svc.name || svc}
            className="rounded-lg p-2.5"
            style={{
              background: svc.configured ? "rgba(0,255,136,0.04)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${svc.configured ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: svc.configured ? "#00ff88" : "#374151",
                  boxShadow: svc.configured ? "0 0 4px #00ff88" : "none",
                }}
              />
              <span className="text-[9px] font-mono font-bold" style={{ color: svc.configured ? "#00ff88" : "#374151" }}>
                {(svc.name || svc).toUpperCase()}
              </span>
            </div>
            <div className="text-[8px] font-mono" style={{ color: "#374151" }}>
              {svc.configured ? "Configuré" : "Non configuré"}
            </div>
          </div>
        ))}
      </div>
      {toolList.length > 0 && (
        <div>
          <div className="text-[8px] font-mono font-bold tracking-wider mb-1.5" style={{ color: "rgba(0,245,255,0.35)" }}>
            OUTILS DISPONIBLES ({toolList.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {toolList.map((t) => (
              <span
                key={t}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)", color: "rgba(168,85,247,0.6)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Integrations() {
  const [copied, setCopied] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [cliPrompt, setCliPrompt] = useState("");
  const [cliResult, setCliResult] = useState(null);
  const [cliSending, setCliSending] = useState(false);
  const mcps = useStore((s) => s.mcps);
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
            className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg bg-synth-cyan/10 border border-synth-cyan/30 text-synth-cyan hover:bg-synth-cyan/20"
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

      {/* Services & MCP Status */}
      <div className="rounded-xl border border-synth-border bg-synth-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-jetbrains text-xs font-bold text-gray-400 tracking-wide">Services & Outils (MCP)</label>
          <span className="text-[8px] font-mono text-gray-600">{mcps?.filter((m) => m.connected).length || 0} MCP actifs</span>
        </div>
        <ServiceStatusPanel />
        {mcps && mcps.length > 0 && (
          <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="text-[8px] font-mono font-bold tracking-wider" style={{ color: "rgba(0,245,255,0.35)" }}>
              MCP SERVERS ({mcps.length})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mcps.map((mcp) => (
                <div
                  key={mcp.id}
                  className="rounded-lg p-2"
                  style={{
                    background: mcp.connected ? "rgba(0,245,255,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${mcp.connected ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{mcp.icon || "⬡"}</span>
                    <span className="text-[9px] font-mono font-bold" style={{ color: mcp.connected ? "#00f5ff" : "#374151" }}>
                      {mcp.name}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono mt-0.5" style={{ color: "#374151" }}>
                    {mcp.tools?.length || 0} tools
                  </div>
                </div>
              ))}
            </div>
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
