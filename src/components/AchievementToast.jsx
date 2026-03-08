import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  useEffect(() => {
    if (!achievement) return;
    const burst = () => {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ["#ff6b35", "#f59e0b", "#22c55e", "#4ecdc4"] });
      setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { y: 0.8 }, colors: ["#6c5ce7", "#ec4899"] }), 150);
    };
    burst();
  }, [achievement]);

  if (!achievement) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-600/10 backdrop-blur px-5 py-4 shadow-xl shadow-amber-500/20 flex items-center gap-4 min-w-[280px]">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <p className="text-xs font-mono text-amber-400/90 uppercase tracking-wide">Achievement débloqué</p>
          <p className="font-bold text-amber-100">{achievement.name}</p>
          <p className="text-sm text-amber-200/80">{achievement.desc}</p>
        </div>
      </div>
    </div>
  );
}
