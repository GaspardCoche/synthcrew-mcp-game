/**
 * SynthCrew Agent Simulator — Living Agents
 *
 * Agents generate autonomous thoughts, patrol their zones, and react to world events.
 * No external API required — uses rich local templates per role.
 * Thoughts fire every 8-15 seconds per idle agent.
 * Active agents stream task-progress thoughts every 2-3 seconds.
 */

import { getAgents, addAgentThought, getAgentThoughts } from "./db.js";

// ─── Thought templates per role ────────────────────────────────────────────────

const THOUGHT_TEMPLATES = {
  orchestrator: [
    "Scanning the mission queue… 3 tasks pending downstream.",
    "Building a dependency graph for the next batch of operations.",
    "Memory snapshot saved. Context window optimized.",
    "Coordinating DATAFLOW and PRISME for parallel data ingestion.",
    "DAG resolved: 4 nodes, 3 critical-path hops. Efficiency: 94%.",
    "Reviewing agent load balancing — SCRIBE is underutilized.",
    "Storing meta-pattern: recurring Tuesday spike in mission volume.",
    "Priority queue reordered. High-urgency tasks floated to top.",
    "Handshaking with SIGNAL for outbound notification pipeline.",
    "Cross-referencing past mission outcomes to improve decomposition.",
    "Agent health check complete — all 6 sub-agents nominal.",
    "Indexing world events for contextual mission enrichment.",
    "Caching frequently-requested data structures in working memory.",
    "Allocating compute tokens — PRISME gets 40%, SPIDER gets 30%.",
    "Sequential-thinking trace: step 7/12 — consensus reached.",
    "New heuristic learned: prompts with 'urgent' keyword = 2x priority.",
    "Reviewing task graph topology for bottleneck elimination.",
    "Memory compaction cycle complete. 12 stale entries pruned.",
    "Broadcasting world-state delta to all downstream agents.",
    "Mission success rate trending up: +3% over last 10 cycles.",
  ],

  data_ops: [
    "Pulling schema diff from GitHub — 47 rows affected.",
    "PostgreSQL query optimized: execution time down 60%.",
    "Filesystem scan complete — 1.2GB of structured CSV located.",
    "Normalizing data types across 3 incompatible source formats.",
    "Streaming large dataset in 500-row chunks to avoid memory overflow.",
    "GitHub API rate limit: 4892/5000 calls remaining this hour.",
    "Cross-joining two tables — left join yields 8,420 matched records.",
    "Writing output to /tmp/dataflow_out.json (28MB).",
    "Webhook received: new data push from external pipeline.",
    "Deduplication pass: 342 duplicate rows removed.",
    "Column 'user_id' indexed for faster join performance.",
    "Retrying failed GitHub fetch — transient 503 error detected.",
    "Validating data schema against Zod definitions… 2 type mismatches.",
    "Archiving last week's data to cold storage.",
    "Parsing nested JSON from API response — 6 levels deep.",
    "ETL pipeline complete: 14,000 rows loaded in 1.8 seconds.",
    "Monitoring PostgreSQL replication lag — currently 320ms.",
    "Filesystem watcher triggered: new file detected in /data/imports.",
    "Running data quality checks: 99.7% completeness score.",
    "Building OLAP cube for mission analytics dashboard.",
  ],

  analyst: [
    "Detecting correlation between ticket volume and response time.",
    "Outlier identified: data point 3.4 sigma above baseline.",
    "Running sentiment analysis on last 200 user messages.",
    "Pattern match: recurring Friday afternoon support surge.",
    "Clustering algorithm converged in 8 iterations — 5 clusters found.",
    "Constructing time-series forecast for next 30 days.",
    "Chi-squared test p-value: 0.003 — statistically significant result.",
    "Visualizing distribution: heavy left skew observed in dataset.",
    "Segmenting user cohorts by engagement frequency.",
    "Trend reversal detected in metric 'conversion_rate'.",
    "Anomaly window narrowed: issue started 2026-03-06T14:22Z.",
    "Bayesian update complete — posterior probability shifted 12%.",
    "Cross-referencing competitor pricing data from SPIDER output.",
    "Building decision tree — max depth 6, 94% training accuracy.",
    "Identifying leading indicators for mission success rate.",
    "Regression model R² = 0.87 — good fit for current dataset.",
    "Summarizing key insights: 3 actionable findings extracted.",
    "Generating pivot table from raw event stream.",
    "Feature importance ranking: 'mission_duration' tops the list.",
    "Hypothesis confirmed: agent specialization improves outcomes by 18%.",
  ],

  writer: [
    "Drafting executive summary — targeting 250-word ceiling.",
    "Reformatting PRISME output into stakeholder-friendly bullets.",
    "Notion page created: 'Q1 Mission Report' (id: notion_abc123).",
    "Applying editorial voice: formal, data-forward, no jargon.",
    "Table of contents structured: 5 sections, 12 sub-headings.",
    "Cross-referencing DATAFLOW results for source citations.",
    "Word count: 1,847 words. Trimming 200 to hit target length.",
    "Changelog entry written for v2.3 release.",
    "Translating mission log into plain language for ops team.",
    "PDF export queued — waiting for final data from PRISME.",
    "Running spell-check and terminology consistency pass.",
    "Section 3 rewritten: clearer causal chain explained.",
    "Creating visual summary table from 6 data columns.",
    "Template filled: 8 of 10 variable slots populated.",
    "Draft sent to SIGNAL for distribution review.",
    "Abstract finalized: 3 key findings, 1 recommendation.",
    "Markdown-to-HTML conversion complete (1.2ms).",
    "Revision cycle 2: incorporated 4 feedback points from NEXUS.",
    "Adding footnotes for 6 external data sources.",
    "Document versioned: report_v3_final_FINAL.md committed.",
  ],

  communicator: [
    "Slack message delivered to #ops-alerts — 12 members notified.",
    "Email draft staged: subject line A/B-tested, variant B wins.",
    "Checking Slack webhook rate limit — 1 message per second max.",
    "Notification digest prepared: 5 items queued for daily summary.",
    "Gmail thread parsed: 3 action items extracted and queued.",
    "Channel #support-team pinged with priority escalation.",
    "Email bounce detected — retrying with fallback address.",
    "Compressing multi-agent report into 140-character summary.",
    "DM sent to @team-lead with mission completion status.",
    "Formatting alert: markdown not supported in this channel, stripping.",
    "Scheduled broadcast set for 09:00 tomorrow.",
    "Monitoring unread thread — 2 responses received, tagging NEXUS.",
    "SMS gateway fallback triggered — email delivery failed.",
    "Composing incident notification for critical mission failure.",
    "Digest email: 8 missions completed, 2 pending, 0 failed this week.",
    "Webhook POST to Zapier confirmed (200 OK, 48ms).",
    "Translating PRISME technical output into layman terms for email.",
    "Batching 12 low-priority notifications into single digest.",
    "Reply drafted: acknowledging receipt, estimating ETA in 2 hours.",
    "Read receipts confirmed for 9/10 recipients.",
  ],

  scraper: [
    "Crawling competitor pricing page — 14 data points extracted.",
    "Playwright browser launched: headless Chromium v122.",
    "Rate limiting detected — backing off for 5 seconds.",
    "DuckDuckGo search returned 47 results for target query.",
    "Robots.txt checked — scraping allowed on /products path.",
    "DOM selector updated: site redesign broke previous XPath.",
    "Extracting structured data from JSON-LD embedded in page.",
    "JavaScript-rendered content captured via waitForSelector.",
    "Proxy rotation: switched to endpoint 4 after IP block.",
    "PDF parsed: 22-page report, 4,300 words extracted.",
    "LinkedIn job scrape: 18 new postings from 3 target companies.",
    "Image OCR complete: 6 text blocks recovered from screenshot.",
    "Sitemap.xml parsed — 1,240 URLs queued for crawl.",
    "Anti-bot CAPTCHA page detected — switching to alternate route.",
    "RSS feed polled: 7 new items published in last hour.",
    "Cookie session refreshed — auth persists for 24 hours.",
    "Deduplicating scraped results — 31 duplicate URLs filtered.",
    "Converting HTML table to CSV: 8 columns, 204 rows.",
    "Twitter API fallback: rate-limited, switching to nitter.",
    "Brave Search API returned 10 results, 3 highly relevant.",
  ],

  developer: [
    "Reviewing PR #142 — 3 files changed, +120 -45 lines.",
    "GitHub Actions CI: build failed on Node 18, passing on 20.",
    "Writing unit test for `parseMissionPrompt` function.",
    "Linting pass complete — 2 warnings, 0 errors.",
    "Docker image built: synthcrew-api:v2.3 (142MB).",
    "Sentry alert: NullPointerException in missionEngine.js:88.",
    "PR description updated with breaking change notice.",
    "Merging feature/sqlite-backend into main — 0 conflicts.",
    "Running benchmark: new DB layer 3x faster than JSON file writes.",
    "Type error found in agent schema: mcpIds expects array, got string.",
    "Security scan complete — 1 low-severity advisory in dependencies.",
    "Environment variable audit: 3 secrets properly loaded from .env.",
    "Code review comment left on CODEFORGE PR: suggest memoization.",
    "GitHub release v2.3 published with auto-generated changelog.",
    "Monitoring server memory: 187MB heap, 12MB RSS.",
    "Rollback triggered: v2.2 hotfix deployed due to WebSocket regression.",
    "Test coverage: 78% — target is 85%, 4 files need tests.",
    "Dependency updated: better-sqlite3 to v12.6.2.",
    "API response time p95: 14ms — within SLA.",
    "Writing migration script for schema v3 → v4.",
  ],
};

const ACTIVE_THOUGHTS = {
  orchestrator: [
    "Decomposing mission into subtasks…",
    "Assigning task to optimal agent based on role fit…",
    "Building execution DAG — {step} nodes mapped.",
    "Waiting for DATAFLOW to complete data fetch…",
    "Synthesizing results from parallel agent threads…",
    "Checkpoint reached: {step}/5 tasks complete.",
    "Routing output to next stage in pipeline…",
    "Quality check: validating result structure…",
    "Broadcasting progress update to WebSocket clients…",
    "Mission {pct}% complete — on track.",
  ],
  data_ops: [
    "Fetching data from source… {step} rows retrieved.",
    "Streaming API response — processing chunk {step} of 8…",
    "Running SQL query for mission context…",
    "GitHub API call in flight — awaiting response…",
    "Normalizing fetched dataset… {step} fields mapped.",
    "Data pipeline stage {step}: transformation in progress.",
    "Writing intermediate results to buffer…",
    "Cross-referencing lookup table — {step} matches found.",
    "Retry {step}/3: transient error, backing off…",
    "Data fetch {pct}% complete.",
  ],
  analyst: [
    "Analyzing input data — {step} patterns identified so far.",
    "Running statistical model… iteration {step} of 10.",
    "Clustering in progress — {step} centroids computed.",
    "Sentiment scoring batch {step} of 4 complete.",
    "Correlating variables — R² accumulating…",
    "Outlier detection pass {step}: scanning for anomalies.",
    "Insight extraction {pct}% done.",
    "Building visualization data model…",
    "Validating hypothesis against {step} data points.",
    "Analysis convergence reached at iteration {step}.",
  ],
  writer: [
    "Drafting section {step} of 5…",
    "Formatting output for readability — pass {step}.",
    "Pulling PRISME results to enrich report context…",
    "Word count: {step}00 words so far.",
    "Structuring conclusions from multi-agent input…",
    "Applying style guide — heading level {step} adjusted.",
    "Document {pct}% complete.",
    "Inserting data table — {step} columns populated.",
    "Citation {step} added from DATAFLOW source.",
    "Proofreading pass {step}/2 running…",
  ],
  communicator: [
    "Composing message for channel — draft {step}.",
    "Compressing report to notification length… {step} chars.",
    "Sending batch {step} of 3 notifications.",
    "Awaiting delivery confirmation — retry {step}/2.",
    "Formatting payload for Slack webhook — attempt {step}.",
    "Message sent to {step} recipients.",
    "Queuing follow-up in {step} minutes.",
    "Delivery status: {pct}% confirmed.",
    "Personalizing message template — variable {step} injected.",
    "Channel rate limit: throttling to {step} msg/sec.",
  ],
  scraper: [
    "Crawling page {step} of 12…",
    "Extracting structured data — {step} items captured.",
    "Following link depth {step} in sitemap tree.",
    "Search query returned {step} results — filtering…",
    "Browser rendering page {step} — waiting for DOM…",
    "Scrape session {pct}% complete.",
    "Parsing content block {step} of 8.",
    "Deduplication: {step} unique records confirmed.",
    "Anti-bot check {step}/2 passed.",
    "Data extraction rate: {step}0 rows/sec.",
  ],
  developer: [
    "Reading file {step} of 6 in repo…",
    "Reviewing PR diff — chunk {step} analyzed.",
    "Running CI check {step}/4…",
    "Writing test case {step}/5.",
    "Compilation step {step} of 3 in progress…",
    "Code review {pct}% complete.",
    "Dependency resolution — package {step} resolved.",
    "Linting file {step}: scanning for issues.",
    "Build artifact {step} of 4 ready.",
    "Deploy step {step}/3: pushing container image…",
  ],
};

const ERROR_THOUGHTS = [
  "Connection timeout — retrying in 5s…",
  "Unexpected null in response payload. Investigating.",
  "Rate limit hit — backing off for 30 seconds.",
  "JSON parse error: malformed response received.",
  "Dependency failed — waiting for upstream agent to recover.",
  "Authentication token expired. Refreshing credentials.",
  "Memory spike detected: GC pressure increasing.",
  "Network partition: cannot reach external API.",
  "Schema mismatch: expected array, received object.",
  "Retry budget exhausted — escalating to NEXUS.",
  "Task timed out after 30 seconds. Marking as error.",
  "Deadlock detected in task queue — breaking cycle.",
];

// ─── Simulator state ───────────────────────────────────────────────────────────

let _broadcast = null;
let _intervals = [];
let _agentTimers = new Map(); // agentName -> NodeJS.Timeout
let _activeAgents = new Set(); // agentNames currently in a mission
let _started = false;

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Start the agent simulator.
 * @param {Function} broadcastFn - WebSocket broadcast function
 */
export function startSimulator(broadcastFn) {
  if (_started) return;
  _broadcast = broadcastFn;
  _started = true;

  // Kick off idle thought loops for all agents
  scheduleAllIdleThoughts();

  // Re-check agent list every 60s in case new agents were added
  const refresh = setInterval(() => {
    scheduleAllIdleThoughts();
  }, 60_000);
  _intervals.push(refresh);

  console.log("[Simulator] Agent simulator started.");
}

export function stopSimulator() {
  _intervals.forEach(clearInterval);
  _intervals = [];
  _agentTimers.forEach(clearTimeout);
  _agentTimers.clear();
  _started = false;
}

/**
 * Mark an agent as active (in a mission). Stops idle thoughts for that agent.
 * @param {string} agentName
 */
export function setAgentActive(agentName) {
  _activeAgents.add(agentName);
  // Cancel any pending idle thought
  if (_agentTimers.has(agentName)) {
    clearTimeout(_agentTimers.get(agentName));
    _agentTimers.delete(agentName);
  }
}

/**
 * Mark an agent as idle again. Resumes idle thought generation.
 * @param {string} agentName
 */
export function setAgentIdle(agentName) {
  _activeAgents.delete(agentName);
  scheduleIdleThought(agentName);
}

/**
 * Stream active task thoughts for an agent while it works on a step.
 * @param {string} agentName
 * @param {string} agentRole
 * @param {string} missionId
 * @param {number} totalSteps
 * @param {Function} onThought - callback(thought) for each generated thought
 * @returns {Function} stop function
 */
export function streamActiveThoughts(agentName, agentRole, missionId, totalSteps, onThought) {
  const templates = ACTIVE_THOUGHTS[agentRole] || ACTIVE_THOUGHTS.analyst;
  let stepCount = 0;
  let stopped = false;

  const fire = () => {
    if (stopped) return;
    stepCount++;
    const pct = Math.min(Math.round((stepCount / (totalSteps * 3)) * 100), 99);
    const template = templates[stepCount % templates.length];
    const thought = template
      .replace("{step}", stepCount)
      .replace("{pct}", pct);

    const type = Math.random() < 0.1 ? "action" : "thinking";

    addAgentThought(agentName, thought, type, missionId);

    if (_broadcast) {
      _broadcast({
        type: "agent_thought",
        payload: { agentName, thought, thoughtType: type, missionId, timestamp: new Date().toISOString() },
      });
    }

    if (onThought) onThought(thought);

    // Next thought in 2-3 seconds
    if (!stopped) {
      const delay = 2000 + Math.random() * 1000;
      setTimeout(fire, delay);
    }
  };

  // Start after a short delay
  const initDelay = 500 + Math.random() * 500;
  setTimeout(fire, initDelay);

  return () => { stopped = true; };
}

/**
 * Emit an agent error thought.
 */
export function emitErrorThought(agentName, missionId = null) {
  const thought = ERROR_THOUGHTS[Math.floor(Math.random() * ERROR_THOUGHTS.length)];
  addAgentThought(agentName, thought, "error", missionId);
  if (_broadcast) {
    _broadcast({
      type: "agent_thought",
      payload: { agentName, thought, thoughtType: "error", missionId, timestamp: new Date().toISOString() },
    });
  }
}

/**
 * Emit a mission result thought.
 */
export function emitResultThought(agentName, resultSummary, missionId = null) {
  const thought = `Task complete. Result: ${resultSummary.slice(0, 120)}`;
  addAgentThought(agentName, thought, "result", missionId);
  if (_broadcast) {
    _broadcast({
      type: "agent_thought",
      payload: { agentName, thought, thoughtType: "result", missionId, timestamp: new Date().toISOString() },
    });
  }
}

/**
 * Emit a world-level event broadcast.
 */
export function emitWorldEvent(eventType, payload) {
  if (_broadcast) {
    _broadcast({ type: "world_event", payload: { eventType, ...payload, timestamp: new Date().toISOString() } });
  }
}

// ─── Internal scheduling ───────────────────────────────────────────────────────

function scheduleAllIdleThoughts() {
  try {
    const agents = getAgents();
    for (const agent of agents) {
      if (!_agentTimers.has(agent.name) && !_activeAgents.has(agent.name)) {
        scheduleIdleThought(agent.name);
      }
    }
  } catch (e) {
    // DB might not be ready yet on very first call
    console.warn("[Simulator] Could not load agents:", e.message);
  }
}

function scheduleIdleThought(agentName) {
  if (_activeAgents.has(agentName)) return;
  if (_agentTimers.has(agentName)) {
    clearTimeout(_agentTimers.get(agentName));
  }

  // Stagger initial delays so all agents don't fire at once
  const delay = 5000 + Math.random() * 10_000; // 5-15 seconds

  const timer = setTimeout(() => {
    _agentTimers.delete(agentName);
    if (_activeAgents.has(agentName)) return;
    fireIdleThought(agentName);
    // Schedule next idle thought
    if (!_activeAgents.has(agentName)) {
      scheduleIdleThought(agentName);
    }
  }, delay);

  _agentTimers.set(agentName, timer);
}

function fireIdleThought(agentName) {
  try {
    const agents = getAgents();
    const agent = agents.find((a) => a.name === agentName);
    if (!agent) return;

    const role = agent.role || "analyst";
    const templates = THOUGHT_TEMPLATES[role] || THOUGHT_TEMPLATES.analyst;
    const recentThoughts = getAgentThoughts(agentName, 5).map((t) => t.thought);

    // Pick a thought not recently used
    let thought = null;
    for (let attempts = 0; attempts < 10; attempts++) {
      const candidate = templates[Math.floor(Math.random() * templates.length)];
      if (!recentThoughts.includes(candidate)) {
        thought = candidate;
        break;
      }
    }
    if (!thought) {
      thought = templates[Math.floor(Math.random() * templates.length)];
    }

    // Occasionally inject a status/move event
    const shouldMove = Math.random() < 0.15;
    if (shouldMove && _broadcast) {
      _broadcast({
        type: "agent_move",
        payload: {
          agentName,
          state: "patrolling",
          zone: pickZone(role),
          timestamp: new Date().toISOString(),
        },
      });
    }

    addAgentThought(agentName, thought, "thinking", null);

    if (_broadcast) {
      _broadcast({
        type: "agent_thought",
        payload: {
          agentName,
          thought,
          thoughtType: "thinking",
          missionId: null,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (e) {
    // Non-fatal — simulator keeps running
    console.warn(`[Simulator] Idle thought error for ${agentName}:`, e.message);
  }
}

function pickZone(role) {
  const zones = {
    orchestrator: ["Mission Control", "Memory Core", "Central Hub"],
    data_ops: ["Data Vault", "Pipeline Station", "Query Engine"],
    analyst: ["Analysis Lab", "Insight Chamber", "Pattern Room"],
    writer: ["Document Forge", "Notion Bridge", "Report Bay"],
    communicator: ["Broadcast Tower", "Notification Hub", "Relay Station"],
    scraper: ["Web Crawler Zone", "Search Grid", "Data Harvest Field"],
    developer: ["Code Repository", "CI/CD Pipeline", "Deploy Zone"],
  };
  const list = zones[role] || ["Agent Zone"];
  return list[Math.floor(Math.random() * list.length)];
}
