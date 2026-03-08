import { useState } from "react";
import { useStore } from "../store/useStore";
import { MCP_CATEGORIES } from "../lib/constants";

const MARKETPLACE_SOURCES = [
  { name: "Smithery.ai", url: "https://smithery.ai", count: "7000+", desc: "Plus grande marketplace MCP" },
  { name: "mcpservers.org", url: "https://mcpservers.org", count: "1000+", desc: "Annuaire curé de serveurs MCP" },
  { name: "Glama.ai", url: "https://glama.ai", count: "2000+", desc: "Registre standardisé" },
  { name: "PixelLab", url: "https://pixellab.ai/vibe-coding", count: "4 tools", desc: "Pixel art pour agents créatifs" },
];

export default function Armory() {
  const { mcps, toggleMcp, getPlanLimit, agents } = useStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const connected = mcps.filter((m) => m.connected);

  const filtered = mcps.filter((m) => {
    if (filter !== "all" && m.category !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const agentsUsingMcp = (mcpId) =>
    agents.filter((a) => a.mcpIds?.includes(mcpId)).map((a) => a.name);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-orbitron text-sm font-bold text-gray-200 tracking-wide mb-1">ARMURERIE</h1>
        <p className="text-sm text-gray-500">
          Les MCPs (Model Context Protocol) sont les outils que tes agents utilisent pour interagir avec le monde extérieur.
          Connecte-les ici, puis assigne-les à tes agents dans l'Équipage.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-synth-primary/20 bg-synth-primary/5 p-3 text-center">
          <p className="text-2xl font-bold text-synth-primary">{connected.length}</p>
          <p className="text-[10px] text-gray-500 font-mono">MCPs connectés</p>
        </div>
        <div className="rounded-xl border border-synth-teal/20 bg-synth-teal/5 p-3 text-center">
          <p className="text-2xl font-bold text-synth-teal">{mcps.length}</p>
          <p className="text-[10px] text-gray-500 font-mono">Disponibles</p>
        </div>
        <div className="rounded-xl border border-synth-indigo/20 bg-synth-indigo/5 p-3 text-center">
          <p className="text-2xl font-bold text-synth-indigo">{connected.reduce((s, m) => s + (m.tools?.length || 0), 0)}</p>
          <p className="text-[10px] text-gray-500 font-mono">Tools actifs</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/3 p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{getPlanLimit("mcps") === Infinity ? "∞" : getPlanLimit("mcps")}</p>
          <p className="text-[10px] text-gray-500 font-mono">Limite plan</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`text-[10px] px-3 py-1.5 rounded-lg font-mono transition-colors ${
            filter === "all" ? "bg-synth-primary/15 text-synth-primary border border-synth-primary/30" : "bg-white/3 text-gray-500 border border-white/8 hover:text-gray-300"
          }`}
        >
          Tous ({mcps.length})
        </button>
        {Object.entries(MCP_CATEGORIES).map(([key, cat]) => {
          const count = mcps.filter((m) => m.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-mono transition-colors ${
                filter === key ? "border" : "bg-white/3 text-gray-500 border border-white/8 hover:text-gray-300"
              }`}
              style={filter === key ? { backgroundColor: `${cat.color}15`, color: cat.color, borderColor: `${cat.color}40` } : {}}
            >
              {cat.label} ({count})
            </button>
          );
        })}
        <div className="flex-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un MCP..."
          className="text-[11px] px-3 py-1.5 rounded-lg bg-white/3 border border-white/8 text-gray-300 placeholder-gray-600 font-mono focus:outline-none focus:border-synth-primary/30 w-48"
        />
      </div>

      {/* MCP Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((m) => {
          const cat = MCP_CATEGORIES[m.category];
          const usedBy = agentsUsingMcp(m.id);
          return (
            <div
              key={m.id}
              className={`rounded-xl border p-4 transition-all hover:shadow-lg ${
                m.connected
                  ? "border-synth-emerald/25 bg-synth-emerald/5"
                  : "border-white/8 bg-white/2"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{m.name}</span>
                    {cat && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        {cat.label}
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{m.description}</p>
                  )}
                </div>
              </div>

              {m.tools && m.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {m.tools.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {usedBy.length > 0 && (
                <div className="mt-2 text-[9px] text-gray-600 font-mono">
                  Utilisé par : {usedBy.map((n, i) => (
                    <span key={n} className="text-gray-400">{i > 0 ? ", " : ""}{n}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => toggleMcp(m.id)}
                  className={`text-[10px] px-3 py-1 rounded-lg font-mono font-semibold transition-colors ${
                    m.connected
                      ? "bg-synth-emerald/15 text-synth-emerald border border-synth-emerald/30 hover:bg-synth-emerald/25"
                      : "bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300 hover:border-white/20"
                  }`}
                >
                  {m.connected ? "Connecté" : "Connecter"}
                </button>
                <span className={`w-2 h-2 rounded-full ${m.connected ? "bg-synth-emerald shadow-[0_0_6px_#00b894]" : "bg-gray-700"}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Marketplace Sources */}
      <div className="rounded-xl border border-synth-indigo/20 bg-synth-indigo/5 p-4">
        <h4 className="font-orbitron text-[10px] font-bold text-synth-indigo tracking-wide mb-3">MARKETPLACES MCP — Découvrir plus d'outils</h4>
        <p className="text-[11px] text-gray-400 mb-3">
          L'écosystème MCP compte plus de <strong className="text-gray-300">7 000 serveurs</strong>. Explore ces registres pour trouver des MCPs spécialisés.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MARKETPLACE_SOURCES.map((src) => (
            <a
              key={src.name}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-synth-indigo/15 bg-black/20 p-3 hover:border-synth-indigo/30 transition-colors group"
            >
              <div className="font-semibold text-xs text-gray-300 group-hover:text-synth-indigo transition-colors">{src.name}</div>
              <div className="text-[9px] text-gray-600 mt-0.5">{src.desc}</div>
              <div className="text-[10px] text-synth-indigo/70 font-mono mt-1">{src.count}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/6 bg-white/2 p-4 text-xs text-gray-500">
        <strong className="text-gray-400">Comment ça marche ?</strong> Chaque MCP expose des <em>tools</em> (fonctions).
        Quand tu lances une mission, le Mission Planner analyse les outils disponibles et assigne les tâches aux agents équipés des bons MCPs.
        Les agents ne peuvent utiliser que les MCPs qui leur sont assignés dans l'Équipage.
      </div>
    </div>
  );
}
