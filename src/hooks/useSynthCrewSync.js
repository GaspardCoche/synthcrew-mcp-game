/**
 * Sync du store Zustand avec le serveur : API au mount + WebSocket en temps réel.
 * Émet des événements dans l'event bus et met à jour le monde virtuel (worldStore).
 */
import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { useEventStore, EVENT_TYPES } from "../store/eventStore";
import { useWorldStore } from "../store/worldStore";

const WS_URL = (() => {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
})();

const API_BASE = "";

export function useSynthCrewSync() {
  const wsRef = useRef(null);
  const { setAgents, setMissions, appendLog, setCurrentMissionDag } = useStore();
  const emit = useEventStore((s) => s.emit);
  const worldMissionCompleted = useWorldStore((s) => s.missionCompleted);
  const worldMissionFailed = useWorldStore((s) => s.missionFailed);
  const worldAgentStatus = useWorldStore((s) => s.agentStatusChange);
  const hydrateFromStats = useWorldStore((s) => s.hydrateFromStats);

  useEffect(() => {
    fetch(`${API_BASE}/api/agents`)
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => {});
    fetch(`${API_BASE}/api/missions`)
      .then((r) => r.json())
      .then(setMissions)
      .catch(() => {});
    fetch(`${API_BASE}/api/stats`)
      .then((r) => r.json())
      .then(hydrateFromStats)
      .catch(() => {});
  }, [setAgents, setMissions, hydrateFromStats]);

  useEffect(() => {
    if (!WS_URL) return;

    let retryTimer = null;
    let retryCount = 0;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
        emit(EVENT_TYPES.CONNECTION, "Connecté au serveur SynthCrew");
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === "agents") {
            setAgents(msg.payload || []);
          }

          if (msg.type === "missions") {
            setMissions(msg.payload || []);
          }

          if (msg.type === "stats" && msg.payload) {
            hydrateFromStats(msg.payload);
          }

          if (msg.type === "mission_log" && msg.payload) {
            const p = msg.payload;

            if (p.log) appendLog(p.log);

            if (p.event === "mission_started" && p.mission) {
              setCurrentMissionDag(p.mission);
              emit(EVENT_TYPES.MISSION_STARTED, p.mission.title || "Nouvelle mission lancée", {
                agentName: p.mission.agentName,
              });
            }

            if (p.event === "mission_completed") {
              setCurrentMissionDag(null);
              worldMissionCompleted({ agentName: p.mission?.agentName });
              emit(EVENT_TYPES.MISSION_COMPLETED, p.mission?.title || "Mission terminée avec succès");
            }

            if (p.event === "mission_failed") {
              setCurrentMissionDag(null);
              worldMissionFailed({ agentName: p.mission?.agentName, error: p.error });
              emit(EVENT_TYPES.MISSION_FAILED, p.error || "Mission échouée");
            }

            if (p.event === "agent_status" && p.agentName) {
              worldAgentStatus(p.agentName, p.status);
            }

            if (p.event === "tool_called") {
              emit(EVENT_TYPES.TOOL_CALLED, `${p.tool || "outil"} appelé`, { agentName: p.agentName });
            }
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Reconnexion exponentielle (max 30s)
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryCount++;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [setAgents, setMissions, appendLog, setCurrentMissionDag, emit]);

  return null;
}
