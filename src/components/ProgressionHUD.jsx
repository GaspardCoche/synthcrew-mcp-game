import { useState, useEffect } from "react";
import { getStats, getAchievementDefinitions } from "../lib/api";

const WS_URL = (() => {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
})();

export default function ProgressionHUD({ onAchievement }) {
  const [stats, setStats] = useState({ level: 1, xp: 0, totalMissions: 0, streak: 0 });
  const [defs, setDefs] = useState([]);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    getAchievementDefinitions().then(setDefs).catch(() => []);
  }, []);

  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "stats") setStats(msg.payload || {});
        if (msg.type === "achievement" && msg.payload) onAchievement?.(msg.payload);
      } catch (_) {}
    };
    return () => ws.close();
  }, [onAchievement]);

  const xpForLevel = 200;
  const currentLevelXp = stats.xp % xpForLevel;
  const progress = Math.min(100, (currentLevelXp / xpForLevel) * 100);

  return (
    <div className="synth-panel px-3 py-2 flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-10 h-10 absolute">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke="url(#xp-grad)" strokeWidth="2.5"
            strokeDasharray={`${progress * 0.94} 100`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="xp-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c9a227" />
              <stop offset="100%" stopColor="#00e5cc" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-sm font-bold text-synth-copper font-mono relative z-10">{stats.level ?? 1}</span>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[9px] text-gray-400 font-mono">{stats.totalMissions ?? 0} missions</p>
          {(stats.streak ?? 0) > 0 && (
            <span className="text-[9px] text-synth-copper font-mono font-bold flex items-center gap-0.5">
              <span className="text-xs">🔥</span>{stats.streak}
            </span>
          )}
        </div>
        <p className="text-[8px] text-gray-600 font-mono">{currentLevelXp}/{xpForLevel} XP</p>
      </div>
    </div>
  );
}
