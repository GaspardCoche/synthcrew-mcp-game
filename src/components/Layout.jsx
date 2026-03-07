import { Link, Outlet, useLocation } from "react-router-dom";
import { TABS } from "../lib/constants";
import { useSynthCrewSync } from "../hooks/useSynthCrewSync";

export default function Layout() {
  const location = useLocation();
  useSynthCrewSync();

  return (
    <div className="min-h-screen bg-synth-bg text-gray-200 font-sans relative overflow-hidden">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-synth-border bg-synth-bg/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="flex w-7 h-7 items-center justify-center rounded-md bg-gradient-to-br from-synth-cyan to-synth-purple text-white text-xs">S</span>
            <span className="font-orbitron font-black bg-gradient-to-r from-synth-cyan to-synth-purple bg-clip-text text-transparent tracking-widest">SYNTHCREW</span>
          </span>
          <span className="h-5 w-px bg-white/10" />
          <span className="font-jetbrains text-xs text-gray-500 tracking-wide">Village · Équipe · Outils · Atelier · Chroniques · CLI</span>
        </div>
        <a
          href="#/"
          className="font-jetbrains text-[10px] text-gray-500 hover:text-synth-cyan transition-colors px-3 py-1.5 rounded-lg border border-synth-border hover:border-synth-cyan/30"
        >
          Expérience 3D
        </a>
      </header>

      <div className="flex relative z-5">
        {/* Side nav */}
        <nav className="w-16 min-h-[calc(100vh-49px)] border-r border-synth-border flex flex-col items-center py-4 gap-1 bg-synth-bg/60">
          {TABS.map((tab) => {
            const isIndex = tab.path === "/classic";
            const isActive = location.pathname === tab.path || (isIndex && (location.pathname === "/classic" || location.pathname === "/classic/"));
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-sm ${
                  isActive ? "border border-synth-cyan/30 bg-synth-cyan/10 text-synth-cyan" : "border border-transparent text-gray-500 hover:text-gray-400"
                }`}
                title={tab.label}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="font-jetbrains text-[10px] tracking-wide">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-49px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
