/**
 * Claude AI Engine — orchestration réelle via Anthropic API.
 * Utilise claude-haiku-4-5 pour la vitesse en mission, opus pour les plans complexes.
 * Streame les résultats en temps réel via WebSocket broadcast.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Tu es NEXUS, l'orchestrateur IA central de SynthCrew — une plateforme qui gamifie l'orchestration d'agents IA.

Tu diriges une équipe d'agents spécialisés :
- DATAFLOW (data_ops) : récupère et structure les données
- PRISME (analyst) : analyse, tendances, insights
- SCRIBE (writer) : rédige rapports et documents
- SIGNAL (communicator) : envoie notifications et emails
- SPIDER (scraper) : collecte infos web
- CODEFORGE (developer) : code, PRs, repos

Pour chaque mission, tu dois :
1. Analyser le besoin
2. Décomposer en tâches assignées à chaque agent
3. Exécuter séquentiellement avec rapport de progression
4. Produire un résultat actionnable

Réponds toujours en français. Sois concis mais précis. Chaque étape commence par "→ [AGENT_NAME]:"
Le résumé final commence par "✓ MISSION ACCOMPLIE:"`.trim();

/**
 * Plan une mission via Claude et retourne un DAG structuré.
 * @param {string} prompt
 * @returns {Promise<{tasks: Array, title: string}>}
 */
export async function planMissionWithClaude(prompt) {
  if (!ANTHROPIC_API_KEY) {
    return fallbackPlan(prompt);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Décompose cette mission en 3-5 tâches assignées aux agents appropriés.
Format JSON strict: {"title": "...", "tasks": [{"id": "t1", "agent": "NEXUS", "label": "...", "tool": "...", "depends_on": []}]}

Mission: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[Claude] Plan API error:", response.status);
      return fallbackPlan(prompt);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    return fallbackPlan(prompt);
  } catch (e) {
    console.error("[Claude] Plan error:", e.message);
    return fallbackPlan(prompt);
  }
}

/**
 * Exécute une mission avec Claude et streame les résultats via broadcast.
 * @param {string} prompt
 * @param {string} missionId
 * @param {Function} broadcast - WebSocket broadcast function
 * @param {Function} onStep - Called for each step
 * @param {Function} onComplete - Called when done
 */
export async function executeMissionWithClaude(prompt, missionId, broadcast, onStep, onComplete) {
  if (!ANTHROPIC_API_KEY) {
    return simulateExecution(prompt, missionId, broadcast, onStep, onComplete);
  }

  try {
    // Phase 1: Plan
    broadcast({
      type: "mission_log",
      payload: {
        event: "mission_step_start",
        missionId,
        agent: "NEXUS",
        label: "Analyse de la mission et planification...",
      },
    });

    const plan = await planMissionWithClaude(prompt);
    const tasks = plan.tasks || fallbackPlan(prompt).tasks;

    broadcast({
      type: "mission_log",
      payload: {
        event: "mission_planned",
        missionId,
        tasks: tasks.map((t) => ({ id: t.id, agent: t.agent, label: t.label })),
      },
    });

    // Phase 2: Execute each task with Claude streaming
    let context = `Mission: ${prompt}\n\n`;

    for (const task of tasks) {
      broadcast({
        type: "mission_log",
        payload: { event: "mission_step_start", missionId, agent: task.agent, label: task.label },
      });

      onStep?.(task.agent, "active");

      // Stream Claude response for this task
      const taskResult = await streamTaskWithClaude(task, context, missionId, broadcast);
      context += `\n[${task.agent}] ${task.label}: ${taskResult.slice(0, 300)}\n`;

      broadcast({
        type: "mission_log",
        payload: { event: "mission_step_done", missionId, agent: task.agent, label: task.label, result: taskResult.slice(0, 200) },
      });

      onStep?.(task.agent, "idle");
      await sleep(400);
    }

    // Phase 3: Summary
    const summary = await getSummaryWithClaude(prompt, context);
    broadcast({
      type: "mission_log",
      payload: { event: "mission_complete", missionId, title: plan.title || prompt.slice(0, 80), summary },
    });

    onComplete?.({ success: true, summary });
    return { success: true, summary };

  } catch (e) {
    console.error("[Claude] Execution error:", e.message);
    broadcast({
      type: "mission_log",
      payload: { event: "mission_failed", missionId, error: e.message },
    });
    onComplete?.({ success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

async function streamTaskWithClaude(task, context, missionId, broadcast) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-beta": "messages-2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        stream: true,
        system: `${SYSTEM_PROMPT}\n\nTu es actuellement ${task.agent} en train d'exécuter ta tâche.`,
        messages: [
          {
            role: "user",
            content: `Contexte de la mission:\n${context}\n\nTa tâche: ${task.label}\n\nExécute et rapporte le résultat en 2-3 phrases.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return `[${task.agent}] Tâche traitée : ${task.label}`;
    }

    let fullText = "";
    const streamId = `${missionId}_${task.id}`;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              const text = parsed.delta.text;
              fullText += text;
              broadcast({
                type: "cli_stream",
                streamId,
                chunk: text,
              });
            }
          } catch {}
        }
      }
    }

    broadcast({ type: "cli_done", streamId });
    return fullText || `[${task.agent}] Tâche complétée.`;
  } catch (e) {
    return `[${task.agent}] Erreur : ${e.message}`;
  }
}

async function getSummaryWithClaude(prompt, context) {
  if (!ANTHROPIC_API_KEY) return "Mission accomplie par l'équipage.";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Synthèse en 2 phrases de ce que l'équipe a accompli:\n${context}\n\nCommence par "✓ MISSION ACCOMPLIE:"`,
          },
        ],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "Mission accomplie.";
  } catch {
    return "Mission accomplie par l'équipage SynthCrew.";
  }
}

/** Fallback sans API Claude */
function fallbackPlan(prompt) {
  const ROLE_KEYWORDS = {
    DATAFLOW:  ["données", "data", "fetch", "récupér", "csv", "export"],
    PRISME:    ["analyser", "analyse", "tendances", "patterns", "insights", "rapport"],
    SCRIBE:    ["rédiger", "écrire", "document", "notion", "résumé"],
    SIGNAL:    ["slack", "email", "notifier", "envoyer", "message"],
    SPIDER:    ["web", "scraper", "recherche", "google", "crawl", "veille"],
    CODEFORGE: ["github", "pr", "code", "repo", "commit", "deploy"],
  };

  const lower = prompt.toLowerCase();
  const agents = ["NEXUS"];

  for (const [agent, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) agents.push(agent);
  }
  if (agents.length === 1) agents.push("PRISME", "SCRIBE");

  return {
    title: prompt.slice(0, 80),
    tasks: agents.slice(0, 4).map((name, i) => ({
      id: `t${i + 1}`,
      agent: name,
      label: i === 0 ? `Analyse et planification : ${prompt.slice(0, 60)}` : `Exécution ${name.toLowerCase()} : ${prompt.slice(0, 40)}`,
      depends_on: i === 0 ? [] : ["t1"],
    })),
  };
}

/** Simulation quand pas d'API */
async function simulateExecution(prompt, missionId, broadcast, onStep, onComplete) {
  const plan = fallbackPlan(prompt);
  const messages = [
    "Analyse du contexte et décomposition de la mission...",
    "Identification des agents les plus adaptés...",
    "Orchestration du pipeline de tâches...",
  ];

  for (const msg of messages) {
    broadcast({ type: "mission_log", payload: { event: "mission_step_start", missionId, agent: "NEXUS", label: msg } });
    await sleep(600);
  }

  for (const task of plan.tasks) {
    broadcast({ type: "mission_log", payload: { event: "mission_step_start", missionId, agent: task.agent, label: task.label } });
    onStep?.(task.agent, "active");
    await sleep(800 + Math.random() * 600);
    broadcast({ type: "mission_log", payload: { event: "mission_step_done", missionId, agent: task.agent, label: task.label } });
    onStep?.(task.agent, "idle");
  }

  const summary = `✓ MISSION ACCOMPLIE: L'équipage a traité "${prompt.slice(0, 60)}" avec succès. Résultats disponibles dans le log.`;
  broadcast({ type: "mission_log", payload: { event: "mission_complete", missionId, title: plan.title, summary } });
  onComplete?.({ success: true, summary });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export { ANTHROPIC_API_KEY };
