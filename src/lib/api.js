/**
 * API client + helpers pour stats, achievements, templates.
 */
const BASE = "";

export async function getStats() {
  const r = await fetch(`${BASE}/api/stats`);
  if (!r.ok) return { totalMissions: 0, streak: 0, level: 1, xp: 0 };
  return r.json();
}

export async function getAchievements() {
  const r = await fetch(`${BASE}/api/achievements`);
  if (!r.ok) return [];
  return r.json();
}

export async function getAchievementDefinitions() {
  const r = await fetch(`${BASE}/api/achievements/definitions`);
  if (!r.ok) return [];
  return r.json();
}

export async function getMissionTemplates() {
  const r = await fetch(`${BASE}/api/mission-templates`);
  if (!r.ok) return [];
  return r.json();
}

export async function createMission(payload) {
  const r = await fetch(`${BASE}/api/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Création mission échouée");
  return r.json();
}
