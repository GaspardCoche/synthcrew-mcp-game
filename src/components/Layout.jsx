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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md mx-2 transition-colors ${
        isActive ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]"
      }`}
    >
      <span className="text-sm shrink-0 w-5 text-center">{tab.icon}</span>
      {sidebarOpen && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium">{tab.label}</span>
          <span className="text-[10px] text-[var(--text-dim)] truncate">{tab.description}</span>
        </div>
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
      className="min-h-screen text-gray-200 font-exo relative overflow-hidden"
      style={{ background: "var(--bg-panel)" }}
    >
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 bg-[var(--bg-deep)] border-b border-[var(--border-subtle)]"
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
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
            >
              S
            </div>
            <span className="text-sm font-semibold tracking-wider text-[var(--text-primary)]">SYNTHCREW</span>
          </Link>

          {currentTab && (
            <>
              <span className="hidden sm:block h-3.5 w-px bg-white/10" />
              <span className="hidden md:block text-xs text-[var(--text-muted)]">{currentTab.label}</span>
            </>
          )}
        </div>

        {/* Center: live stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>{activeAgents} actifs</span>
          <span>·</span>
          <span>{agents.length} agents</span>
          <span>·</span>
          <span>{totalMissions} missions</span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--success)]" : "bg-[var(--error)]"}`} />
            {isConnected ? "En ligne" : "Hors ligne"}
          </div>

          {/* Notifications */}
          <button
            onClick={markAllRead}
            className="relative w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-[var(--text-muted)] transition-colors"
            title="Notifications"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-[var(--primary)] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* 3D World */}
          <a
            href="#/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--text-primary)] transition-colors"
          >
            Monde 3D
          </a>

          <BuildId className="hidden lg:inline text-[8px] font-mono opacity-30 ml-1" />
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────── */}
      <div className="flex relative z-10" style={{ minHeight: "calc(100vh - 52px - 28px)" }}>
        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        <nav
          className="shrink-0 flex flex-col py-3 transition-all duration-300 overflow-hidden border-r border-[var(--border-subtle)]"
          style={{
            width: sidebarOpen ? 200 : 52,
            background: "var(--bg-deep)",
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

          {sidebarOpen && (
            <div className="mx-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="text-[10px] font-medium text-[var(--text-dim)] mb-2 px-1">En mission</div>
              {agents.filter((a) => a.status === "active").length === 0 ? (
                <div className="text-xs text-[var(--text-dim)] px-1">Aucune</div>
              ) : (
                agents.filter((a) => a.status === "active").slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="text-xs truncate" style={{ color: a.color }}>{a.name}</span>
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
      <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center px-4 gap-4 h-7 text-xs text-[var(--text-dim)] bg-[var(--bg-deep)] border-t border-[var(--border-subtle)]">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--success)]" : "bg-[var(--error)]"}`} />
        {isConnected ? "Connecté" : "Déconnecté"}
        <span>·</span>
        <span>{activeAgents} mission{activeAgents > 1 ? "s" : ""} en cours</span>
        <span>·</span>
        <span>{agents.length} agents</span>
        <div className="flex-1" />
        <span className="font-mono">{dateStr} {timeStr}</span>
      </div>

      <EventNotifications />
    </div>
  );
}
