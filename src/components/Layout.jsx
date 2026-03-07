import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { TABS } from "../lib/constants";
import { useSynthCrewSync } from "../hooks/useSynthCrewSync";
import { useStore } from "../store/useStore";
import { useEventStore } from "../store/eventStore";
import EventNotifications from "./EventNotifications";

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
    <div className="min-h-screen bg-synth-bg text-gray-200 font-jetbrains relative overflow-hidden">

      {/* Ambient grid background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,240,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Radial glow top-left */}
      <div
        className="fixed top-0 left-0 w-96 h-96 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at top left, rgba(0,240,255,0.04) 0%, transparent 70%)" }}
      />
      {/* Radial glow bottom-right */}
      <div
        className="fixed bottom-0 right-0 w-80 h-80 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at bottom right, rgba(168,85,247,0.05) 0%, transparent 70%)" }}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 border-b"
        style={{
          height: 52,
          background: "rgba(6,7,12,0.92)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(0,240,255,0.08)",
          boxShadow: "0 1px 0 rgba(0,240,255,0.05)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors text-lg"
            title="Toggle sidebar"
          >
            ≡
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
              style={{
                background: "linear-gradient(135deg, #00f0ff, #a855f7)",
                boxShadow: "0 0 12px rgba(0,240,255,0.3)",
              }}
            >
              S
            </div>
            <span
              className="font-orbitron font-black tracking-widest text-sm"
              style={{
                background: "linear-gradient(90deg, #00f0ff, #a855f7, #00f0ff)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SYNTHCREW
            </span>
          </div>
          <span className="h-4 w-px bg-white/10 hidden sm:block" />
          <span className="text-[11px] text-gray-600 hidden md:block tracking-wide">
            Quartier Général · Agents IA Autonomes
          </span>
        </div>

        {/* Center stats */}
        <div className="hidden sm:flex items-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: activeAgents > 0 ? "#00f0ff" : "#374151",
                boxShadow: activeAgents > 0 ? "0 0 6px #00f0ff" : "none",
                animation: activeAgents > 0 ? "pulse 2s infinite" : "none",
              }}
            />
            <span className={activeAgents > 0 ? "text-synth-cyan" : "text-gray-600"}>
              {activeAgents} en mission
            </span>
          </div>
          <div className="text-gray-600">
            <span className="text-gray-400">{agents.length}</span> agents
          </div>
          <div className="text-gray-600">
            <span className="text-gray-400">{totalMissions}</span> missions totales
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            onClick={markAllRead}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            title="Événements récents"
          >
            <span className="text-sm">◉</span>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: "#00f0ff", color: "#06070c" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <a
            href="#/"
            className="font-jetbrains text-[10px] px-3 py-1.5 rounded-lg transition-colors"
            style={{
              border: "1px solid rgba(212,165,116,0.2)",
              color: "#d4a574",
              background: "rgba(212,165,116,0.05)",
            }}
          >
            ◎ Monde 3D
          </a>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <nav
          className="shrink-0 border-r flex flex-col py-3 transition-all duration-300 overflow-hidden"
          style={{
            width: sidebarOpen ? 200 : 56,
            minHeight: "calc(100vh - 52px)",
            background: "rgba(6,7,12,0.7)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          {/* Nav items */}
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
                  className="group flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all relative"
                  style={{
                    background: isActive ? "rgba(0,240,255,0.08)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(0,240,255,0.15)" : "transparent"}`,
                    color: isActive ? "#00f0ff" : "#6b7280",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "transparent"; } }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                      style={{ background: "#00f0ff", boxShadow: "0 0 8px #00f0ff" }}
                    />
                  )}
                  <span className="text-base shrink-0 w-5 text-center">{tab.icon}</span>
                  {sidebarOpen && (
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold tracking-wider">{tab.label}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom: active agents mini-list */}
          {sidebarOpen && (
            <div className="px-3 py-3 border-t mt-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="text-[9px] text-gray-600 tracking-widest uppercase mb-2">Agents actifs</div>
              {agents.filter((a) => a.status === "active").length === 0 ? (
                <div className="text-[10px] text-gray-700">Aucun en mission</div>
              ) : (
                agents
                  .filter((a) => a.status === "active")
                  .slice(0, 3)
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }}
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

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <main
          className="flex-1 p-6 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 52px)" }}
        >
          <Outlet />
        </main>
      </div>

      {/* Global toast notifications */}
      <EventNotifications />
    </div>
  );
}
