/**
 * Event Bus global — centralise tous les événements temps-réel de l'app.
 */
import { create } from "zustand";

export const EVENT_TYPES = {
  MISSION_STARTED: "mission_started",
  MISSION_COMPLETED: "mission_completed",
  MISSION_FAILED: "mission_failed",
  AGENT_STATUS: "agent_status",
  TOOL_CALLED: "tool_called",
  ACHIEVEMENT: "achievement",
  SYSTEM: "system",
  CONNECTION: "connection",
};

const EVENT_CONFIG = {
  mission_started:   { icon: "▶", color: "#00f0ff", label: "Mission lancée",   priority: "high" },
  mission_completed: { icon: "✓", color: "#22c55e", label: "Mission terminée", priority: "high" },
  mission_failed:    { icon: "✗", color: "#ef4444", label: "Mission échouée",  priority: "high" },
  agent_status:      { icon: "◎", color: "#a855f7", label: "Statut agent",     priority: "low"  },
  tool_called:       { icon: "⚡", color: "#f59e0b", label: "Outil appelé",    priority: "low"  },
  achievement:       { icon: "◆", color: "#eab308", label: "Succès",           priority: "high" },
  system:            { icon: "◈", color: "#6b7280", label: "Système",          priority: "low"  },
  connection:        { icon: "◉", color: "#22c55e", label: "Connexion",        priority: "medium"},
};

export function getEventConfig(type) {
  return EVENT_CONFIG[type] || EVENT_CONFIG.system;
}

let _id = 0;

export const useEventStore = create((set) => ({
  events: [],
  toasts: [],
  unreadCount: 0,

  emit: (type, message, meta = {}) => {
    const ev = {
      id: ++_id,
      type,
      message,
      meta,
      ts: new Date(),
      cfg: getEventConfig(type),
    };
    const showToast = ev.cfg.priority !== "low";
    set((s) => ({
      events: [ev, ...s.events].slice(0, 100),
      toasts: showToast ? [ev, ...s.toasts].slice(0, 4) : s.toasts,
      unreadCount: s.unreadCount + 1,
    }));
    if (showToast) {
      const delay = type === "achievement" ? 6000 : 4000;
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== ev.id) }));
      }, delay);
    }
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markAllRead: () => set({ unreadCount: 0 }),
  clearEvents: () => set({ events: [], unreadCount: 0 }),
}));
