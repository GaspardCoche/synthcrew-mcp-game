/**
 * Toast notifications pour les événements temps-réel.
 * S'affiche en bas à droite, animé, auto-dismiss.
 */
import { useEventStore } from "../store/eventStore";

export default function EventNotifications() {
  const { toasts, dismissToast } = useEventStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-right"
          onClick={() => dismissToast(toast.id)}
        >
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl cursor-pointer max-w-xs shadow-2xl"
            style={{
              background: `linear-gradient(135deg, rgba(6,7,12,0.95), rgba(13,15,24,0.95))`,
              borderColor: `${toast.cfg.color}40`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${toast.cfg.color}20`,
            }}
          >
            <span
              className="text-base mt-0.5 shrink-0"
              style={{ color: toast.cfg.color }}
            >
              {toast.cfg.icon}
            </span>
            <div className="min-w-0">
              <div
                className="font-jetbrains text-[10px] font-bold tracking-widest uppercase mb-0.5"
                style={{ color: toast.cfg.color }}
              >
                {toast.cfg.label}
              </div>
              <div className="font-jetbrains text-xs text-gray-300 leading-relaxed break-words">
                {toast.message}
              </div>
              {toast.meta?.agentName && (
                <div className="font-jetbrains text-[10px] text-gray-500 mt-1">
                  via {toast.meta.agentName}
                </div>
              )}
            </div>
            <button
              className="shrink-0 text-gray-600 hover:text-gray-400 text-xs ml-1 mt-0.5"
              onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
