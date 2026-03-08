import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { TABS } from "../lib/constants";
import { useSynthCrewSync } from "../hooks/useSynthCrewSync";
import { useStore } from "../store/useStore";
import { useEventStore } from "../store/eventStore";
import EventNotifications from "./EventNotifications";
import { BuildId } from "./BuildId";

const TAB_DESCRIPTIONS = {
  village:     "Vue d'ensemble de l'équipe et des activités en cours",
  quarters:    "Recruter, personnaliser et gérer tes agents IA",
  armory:      "Connecter des outils MCP aux agents (GitHub, Slack, Notion…)",
  ops:         "Planifier et lancer des missions multi-agents",
  log:         "Historique des missions et succès débloqués",
  integrations:"Connecter Claude Code CLI ou des outils externes",
};

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useSynthCrewSync();

  const agents = useStore((s) => s.agents);
  const { unreadCount, markAllRead } = useEventStore();

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((sum, a) => sum + (a.missions || 0), 0);

  return (
    <div className="min-h-screen bg-synth-bg text-gray-200 font-jetbrains relative overflow-hidden synth-grid-bg">

      {/* Lueur cuivre */}
      <div
        className="fixed top-0 left-0 w-[420px] h-[420px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at top left, rgba(201,162,39,0.06) 0%, transparent 65%)" }}
      />
      <div
        className="fixed bottom-0 right-0 w-80 h-80 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at bottom right, rgba(0,229,204,0.05) 0%, transparent 70%)" }}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="synth-header-bar relative z-20 flex items-center justify-between px-5"
        style={{ height: 56 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-synth-copper hover:bg-synth-copper-bg transition-colors text-lg"
            title="Menu"
          >
            ≡
          </button>
          <div className="flex items-center gap-2.5">
            <div className="synth-logo-accent w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-copper-sm">
              S
            </div>
            <span className="synth-title-text text-base">
              SYNTHCREW
            </span>
          </div>
          <span className="h-4 w-px bg-white/10 hidden sm:block" />
          <span className="text-[11px] text-gray-500 hidden md:block tracking-wide">
            Village · Atelier
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: activeAgents > 0 ? "#00e5cc" : "#374151",
                boxShadow: activeAgents > 0 ? "0 0 8px #00e5cc" : "none",
                animation: activeAgents > 0 ? "pulse 2s infinite" : "none",
              }}
            />
            <span className={activeAgents > 0 ? "text-synth-cyan" : "text-gray-500"}>
              {activeAgents} en mission
            </span>
          </div>
          <div className="text-gray-500">
            <span className="text-gray-400">{agents.length}</span> agents
          </div>
          <div className="text-gray-500">
            <span className="text-gray-400">{totalMissions}</span> missions
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-synth-copper hover:bg-synth-copper-bg transition-colors"
            title="Événements"
          >
            <span className="text-sm">◉</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-synth-copper text-synth-bg-deep">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <a
            href="#/"
            className="font-jetbrains text-[10px] px-3 py-2 rounded-lg transition-colors border border-synth-copper/40 text-synth-copper bg-synth-copper-bg hover:bg-synth-copper-dim"
          >
            ◎ Monde 3D
          </a>
          <BuildId className="hidden sm:inline ml-1" />
        </div>
      </header>

      <div className="flex relative z-10">
        <nav
          className="shrink-0 border-r flex flex-col py-3 transition-all duration-300 overflow-hidden"
          style={{
            width: sidebarOpen ? 200 : 56,
            minHeight: "calc(100vh - 56px)",
            background: "rgba(8,10,16,0.85)",
            backdropFilter: "blur(14px)",
            borderColor: "rgba(201,162,39,0.08)",
          }}
        >
          <div className="flex flex-col gap-0.5 px-2 flex-1">
            {TABS.map((tab) => {
              const isIndex = tab.path === "/classic";
              const isActive =
                location.pathname === tab.path ||
                (isIndex && (location.pathname === "/classic" || location.pathname === "/classic/"));

              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  title={sidebarOpen ? TAB_DESCRIPTIONS[tab.id] : tab.label}
                  className={`synth-nav-item flex items-center gap-3 px-3 py-2.5 transition-all ${isActive ? "active" : ""}`}
                  style={{
                    color: isActive ? undefined : "#6b7280",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#9ca3af";
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#6b7280";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span className="text-base shrink-0 w-5 text-center opacity-80">{tab.icon}</span>
                  {sidebarOpen && (
                    <div className="min-w-0 text-[11px] font-bold tracking-wider">
                      {tab.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {sidebarOpen && (
            <div className="px-3 py-3 border-t mt-2" style={{ borderColor: "rgba(201,162,39,0.08)" }}>
              <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">En mission</div>
              {agents.filter((a) => a.status === "active").length === 0 ? (
                <div className="text-[10px] text-gray-600">Aucun</div>
              ) : (
                agents
                  .filter((a) => a.status === "active")
                  .slice(0, 3)
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }}
                      />
                      <span className="text-[10px] truncate" style={{ color: a.color }}>
                        {a.name}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}
        </nav>

        <main
          className="flex-1 p-6 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 56px)" }}
        >
          <Outlet />
        </main>
      </div>

      <EventNotifications />
    </div>
  );
}
