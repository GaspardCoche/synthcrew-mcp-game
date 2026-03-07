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
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 pointer-events-none">
      <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur px-3 py-2 flex items-center gap-3">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 font-mono">NIV</p>
          <p className="text-lg font-bold text-cyan-400 font-mono">{stats.level ?? 1}</p>
        </div>
        <div className="w-24">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] text-gray-500 mt-0.5 font-mono">{stats.totalMissions ?? 0} missions</p>
        </div>
        <div className="flex items-center gap-1 text-amber-400" title="Série de jours avec au moins une mission">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-mono font-bold">{stats.streak ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
