/**
 * Sync du store Zustand avec le serveur : API au mount + WebSocket en temps réel.
 * Permet d'afficher les missions autonomes (CLI, cron) et les mises à jour agents/missions.
 */
import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";

const WS_URL = (() => {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
})();

const API_BASE = "";

export function useSynthCrewSync() {
  const wsRef = useRef(null);
  const { setAgents, setMissions, appendLog, setCurrentMissionDag } = useStore();

  useEffect(() => {
    fetch(`${API_BASE}/api/agents`)
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => {});
    fetch(`${API_BASE}/api/missions`)
      .then((r) => r.json())
      .then(setMissions)
      .catch(() => {});
  }, [setAgents, setMissions]);

  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "agents") setAgents(msg.payload || []);
        if (msg.type === "missions") setMissions(msg.payload || []);
        if (msg.type === "mission_log" && msg.payload) {
          const p = msg.payload;
          if (p.log) appendLog(p.log);
          if (p.event === "mission_started" && p.mission) setCurrentMissionDag(p.mission);
          if (p.event === "mission_completed") setCurrentMissionDag(null);
        }
      } catch (_) {}
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [setAgents, setMissions, appendLog, setCurrentMissionDag]);

  return null;
}
