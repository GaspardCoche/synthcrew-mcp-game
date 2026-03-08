import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { TABS } from "../lib/constants";
import { useSynthCrewSync } from "../hooks/useSynthCrewSync";
import { useStore } from "../store/useStore";
import { useEventStore } from "../store/eventStore";
import EventNotifications from "./EventNotifications";
import { BuildId } from "./BuildId";

const TAB_ICONS = {
  village:      "◈",
  quarters:     "◎",
  armory:       "⬡",
  ops:          "▣",
  log:          "≡",
  integrations: "⚡",
};

function NavItem({ tab, isActive, sidebarOpen }) {
  return (
    <Link
      to={tab.path}
      title={tab.description}
      className={`synth-nav-item flex items-center gap-3 px-3 py-2.5 transition-all group ${isActive ? "active" : ""}`}
      style={{ color: isActive ? undefined : "#4b5563" }}
    >
      <span
        className="text-sm shrink-0 w-5 text-center transition-all duration-200"
        style={{
          filter: isActive
            ? "drop-shadow(0 0 6px rgba(255,107,53,0.8))"
            : "none",
          color: isActive ? "#ff6b35" : "#4b5563",
        }}
      >
        {tab.icon}
      </span>
      {sidebarOpen && (
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-[10px] font-bold tracking-widest transition-colors"
            style={{ color: isActive ? "#ff6b35" : "#6b7280" }}
          >
            {tab.label}
          </span>
          <span className="text-[8px] text-gray-700 truncate">{tab.description}</span>
        </div>
      )}
      {isActive && sidebarOpen && (
        <span
          className="w-1 h-1 rounded-full shrink-0"
          style={{ background: "#ff6b35", boxShadow: "0 0 6px #ff6b35" }}
        />
      )}
    </Link>
  );
}

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState(new Date());
  useSynthCrewSync();

  const agents = useStore((s) => s.agents);
  const missions = useStore((s) => s.missions);
  const { unreadCount, markAllRead } = useEventStore();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalMissions = agents.reduce((sum, a) => sum + (a.missions || 0), 0);
  const isConnected = useStore((s) => s.wsConnected);

  const currentTab = TABS.find(
    (tab) =>
      location.pathname === tab.path ||
      (tab.path === "/classic" && (location.pathname === "/classic" || location.pathname === "/classic/"))
  );

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  return (
    <div
      className="min-h-screen text-gray-200 font-exo relative overflow-hidden synth-grid-bg"
      style={{ background: "var(--bg-panel)" }}
    >
      {/* Ambient glow blobs */}
      <div
        className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at top left, rgba(255,107,53,0.04) 0%, transparent 60%)" }}
      />
      <div
        className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at bottom right, rgba(0,245,255,0.03) 0%, transparent 65%)" }}
      />
      <div
        className="fixed top-1/3 right-1/4 w-64 h-64 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.02) 0%, transparent 70%)" }}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="synth-header-bar relative z-20 flex items-center justify-between px-4"
        style={{ height: 52 }}
      >
        {/* Left: logo + toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-all text-gray-600 hover:text-gray-400"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            title="Toggle sidebar"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M2 4.5A.5.5 0 012.5 4h15a.5.5 0 010 1h-15A.5.5 0 012 4.5zm0 5A.5.5 0 012.5 9h15a.5.5 0 010 1h-15A.5.5 0 012 9.5zm0 5a.5.5 0 01.5-.5h15a.5.5 0 010 1h-15a.5.5 0 01-.5-.5z" />
            </svg>
          </button>

          <Link to="/classic" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div
              className="synth-logo-accent w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
              style={{ boxShadow: "0 0 12px rgba(255,107,53,0.4), 0 0 24px rgba(0,245,255,0.2)" }}
            >
              S
            </div>
            <span className="synth-title-text text-sm tracking-[0.25em]">SYNTHCREW</span>
          </Link>

          {currentTab && (
            <>
              <span className="hidden sm:block h-3.5 w-px" style={{ background: "rgba(0,245,255,0.15)" }} />
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-[9px] font-mono" style={{ color: "rgba(0,245,255,0.4)" }}>//</span>
                <span
                  className="text-[9px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: "rgba(0,245,255,0.6)" }}
                >
                  {currentTab.label}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center: live stats */}
        <div className="hidden sm:flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: activeAgents > 0 ? "#00f5ff" : "#374151",
                boxShadow: activeAgents > 0 ? "0 0 8px #00f5ff" : "none",
                animation: activeAgents > 0 ? "pulse 2s infinite" : "none",
              }}
            />
            <span
              className="text-[9px] font-mono"
              style={{ color: activeAgents > 0 ? "rgba(0,245,255,0.7)" : "#374151" }}
            >
              {activeAgents} ACTIVE
            </span>
          </div>

          <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          <span className="text-[9px] font-mono" style={{ color: "#374151" }}>
            <span style={{ color: "#6b7280" }}>{agents.length}</span> AGENTS
          </span>

          <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          <span className="text-[9px] font-mono" style={{ color: "#374151" }}>
            <span style={{ color: "#6b7280" }}>{totalMissions}</span> MISSIONS
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded"
            style={{
              background: isConnected ? "rgba(0,255,136,0.05)" : "rgba(255,45,85,0.05)",
              border: `1px solid ${isConnected ? "rgba(0,255,136,0.12)" : "rgba(255,45,85,0.12)"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isConnected ? "#00ff88" : "#ff2d55",
                boxShadow: isConnected ? "0 0 6px #00ff88" : "0 0 6px #ff2d55",
              }}
            />
            <span
              className="text-[8px] font-mono"
              style={{ color: isConnected ? "rgba(0,255,136,0.7)" : "rgba(255,45,85,0.7)" }}
            >
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {/* Notifications */}
          <button
            onClick={markAllRead}
            className="relative w-8 h-8 flex items-center justify-center rounded-md transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: unreadCount > 0 ? "1px solid rgba(255,107,53,0.25)" : "1px solid rgba(255,255,255,0.06)",
              color: unreadCount > 0 ? "#ff6b35" : "#4b5563",
            }}
            title="Notifications"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center text-black"
                style={{ background: "#ff6b35", boxShadow: "0 0 8px rgba(255,107,53,0.6)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* 3D World */}
          <a
            href="#/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-mono font-bold transition-all"
            style={{
              background: "rgba(0,245,255,0.05)",
              border: "1px solid rgba(0,245,255,0.15)",
              color: "rgba(0,245,255,0.7)",
            }}
          >
            <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            WORLD 3D
          </a>

          <BuildId className="hidden lg:inline text-[8px] font-mono opacity-30 ml-1" />
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────── */}
      <div className="flex relative z-10" style={{ minHeight: "calc(100vh - 52px - 28px)" }}>
        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        <nav
          className="shrink-0 flex flex-col py-3 transition-all duration-300 overflow-hidden"
          style={{
            width: sidebarOpen ? 200 : 52,
            background: "rgba(5, 8, 16, 0.9)",
            backdropFilter: "blur(16px)",
            borderRight: "1px solid rgba(0,245,255,0.06)",
          }}
        >
          {/* Nav links */}
          <div className="flex flex-col gap-0.5 px-2 flex-1">
            {TABS.map((tab) => {
              const isIndex = tab.path === "/classic";
              const isActive =
                location.pathname === tab.path ||
                (isIndex && (location.pathname === "/classic" || location.pathname === "/classic/"));

              return (
                <NavItem
                  key={tab.id}
                  tab={tab}
                  isActive={isActive}
                  sidebarOpen={sidebarOpen}
                />
              );
            })}
          </div>

          {/* Active agents mini-list */}
          {sidebarOpen && (
            <div
              className="mx-2 mt-3 pt-3 pb-1"
              style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}
            >
              <div
                className="text-[8px] font-mono tracking-[0.2em] uppercase mb-2 px-1"
                style={{ color: "rgba(0,245,255,0.25)" }}
              >
                Active Agents
              </div>
              {agents.filter((a) => a.status === "active").length === 0 ? (
                <div className="text-[9px] font-mono px-1" style={{ color: "#1f2937" }}>
                  No active missions
                </div>
              ) : (
                agents
                  .filter((a) => a.status === "active")
                  .slice(0, 4)
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-2 mb-1.5 px-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: a.color,
                          boxShadow: `0 0 6px ${a.color}`,
                          animation: "pulse 2s infinite",
                        }}
                      />
                      <span
                        className="text-[9px] font-mono truncate"
                        style={{ color: a.color + "cc" }}
                      >
                        {a.name}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}
        </nav>

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <main
          className="flex-1 p-5 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 52px - 28px)" }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── STATUS BAR (bottom) ────────────────────────────────── */}
      <div
        className="status-bar fixed bottom-0 left-0 right-0 z-20 flex items-center px-4 gap-4"
        style={{ height: 28 }}
      >
        {/* Left: server status */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isConnected ? "#00ff88" : "#ff2d55",
              boxShadow: isConnected ? "0 0 4px #00ff88" : "0 0 4px #ff2d55",
            }}
          />
          <span style={{ color: isConnected ? "rgba(0,255,136,0.5)" : "rgba(255,45,85,0.5)" }}>
            {isConnected ? "SERVER CONNECTED" : "SERVER OFFLINE"}
          </span>
        </div>

        <span style={{ color: "#111827" }}>|</span>

        {/* Active missions */}
        <div className="flex items-center gap-1">
          <span style={{ color: "#1f2937" }}>ACTIVE MISSIONS:</span>
          <span
            style={{
              color: activeAgents > 0 ? "rgba(0,245,255,0.5)" : "#1f2937",
            }}
          >
            {activeAgents}
          </span>
        </div>

        <span style={{ color: "#111827" }}>|</span>

        <div className="flex items-center gap-1">
          <span style={{ color: "#1f2937" }}>AGENTS:</span>
          <span style={{ color: "#374151" }}>{agents.length}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: breadcrumb + time */}
        {currentTab && (
          <>
            <div className="hidden md:flex items-center gap-1" style={{ color: "#1f2937" }}>
              <span>SYNTHCREW</span>
              <span style={{ color: "#111827" }}>/</span>
              <span style={{ color: "rgba(0,245,255,0.3)" }}>{currentTab.label}</span>
            </div>
            <span style={{ color: "#111827" }}>|</span>
          </>
        )}

        {/* Clock */}
        <div className="font-mono" style={{ color: "rgba(0,245,255,0.35)", letterSpacing: "0.1em" }}>
          {dateStr} {timeStr}
        </div>
      </div>

      <EventNotifications />
    </div>
  );
}
