import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { TABS } from "../lib/constants";
import { useSynthCrewSync } from "../hooks/useSynthCrewSync";
import { useStore } from "../store/useStore";
import { useEventStore } from "../store/eventStore";
import EventNotifications from "./EventNotifications";
import { BuildId } from "./BuildId";

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useSynthCrewSync();

  const agents = useStore((s) => s.agents);
  const { unreadCount, markAllRead } = useEventStore();

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((sum, a) => sum + (a.missions || 0), 0);

  const currentTab = TABS.find(
    (tab) =>
      location.pathname === tab.path ||
      (tab.path === "/classic" && (location.pathname === "/classic" || location.pathname === "/classic/"))
  );

  return (
    <div className="min-h-screen bg-synth-bg text-gray-200 font-exo relative overflow-hidden synth-grid-bg">

      <div
        className="fixed top-0 left-0 w-[420px] h-[420px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at top left, rgba(255,107,53,0.05) 0%, transparent 65%)" }}
      />
      <div
        className="fixed bottom-0 right-0 w-80 h-80 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at bottom right, rgba(78,205,196,0.04) 0%, transparent 70%)" }}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="synth-header-bar relative z-20 flex items-center justify-between px-5"
        style={{ height: 56 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-synth-primary hover:bg-synth-primary-bg transition-colors text-lg"
            title="Menu"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path d="M2 4.5A.5.5 0 012.5 4h15a.5.5 0 010 1h-15A.5.5 0 012 4.5zm0 5A.5.5 0 012.5 9h15a.5.5 0 010 1h-15A.5.5 0 012 9.5zm0 5a.5.5 0 01.5-.5h15a.5.5 0 010 1h-15a.5.5 0 01-.5-.5z" />
            </svg>
          </button>
          <Link to="/classic" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="synth-logo-accent w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-primary-glow">
              S
            </div>
            <span className="synth-title-text text-base">SYNTHCREW</span>
          </Link>
          {currentTab && (
            <>
              <span className="h-4 w-px bg-white/10 hidden sm:block" />
              <span className="text-[11px] text-synth-primary/70 hidden md:block tracking-wide font-semibold">
                {currentTab.label}
              </span>
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: activeAgents > 0 ? "#4ecdc4" : "#374151",
                boxShadow: activeAgents > 0 ? "0 0 8px #4ecdc4" : "none",
                animation: activeAgents > 0 ? "pulse 2s infinite" : "none",
              }}
            />
            <span className={activeAgents > 0 ? "text-synth-teal" : "text-gray-500"}>
              {activeAgents} en mission
            </span>
          </div>
          <div className="text-gray-500">
            <span className="text-gray-300 font-semibold">{agents.length}</span> agents
          </div>
          <div className="text-gray-500">
            <span className="text-gray-300 font-semibold">{totalMissions}</span> missions
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-synth-primary hover:bg-synth-primary-bg transition-colors"
            title="Notifications"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-synth-primary text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <a
            href="#/"
            className="font-jetbrains text-[10px] px-3 py-2 rounded-lg transition-colors border border-synth-primary/40 text-synth-primary bg-synth-primary-bg hover:bg-synth-primary-dim flex items-center gap-1.5"
          >
            <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Monde 3D
          </a>
          <BuildId className="hidden sm:inline ml-1" />
        </div>
      </header>

      <div className="flex relative z-10">
        <nav
          className="shrink-0 border-r flex flex-col py-3 transition-all duration-300 overflow-hidden"
          style={{
            width: sidebarOpen ? 210 : 56,
            minHeight: "calc(100vh - 56px)",
            background: "rgba(8,12,21,0.85)",
            backdropFilter: "blur(14px)",
            borderColor: "rgba(255,107,53,0.08)",
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
                  title={tab.description}
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
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold tracking-wider">{tab.label}</span>
                      <span className="text-[8px] text-gray-600 truncate">{tab.description}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {sidebarOpen && (
            <div className="px-3 py-3 border-t mt-2" style={{ borderColor: "rgba(255,107,53,0.08)" }}>
              <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">Agents actifs</div>
              {agents.filter((a) => a.status === "active").length === 0 ? (
                <div className="text-[10px] text-gray-600 italic">Aucun en mission</div>
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
