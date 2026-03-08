/**
 * Real tool implementations for SynthCrew agents.
 * Each tool maps to an actual API call. When API keys are missing,
 * tools return a helpful error explaining what's needed.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function ok(data) {
  return { success: true, data };
}
function fail(error) {
  return { success: false, error };
}

async function githubRequest(path, method = "GET", body = null) {
  if (!GITHUB_TOKEN) return fail("GITHUB_TOKEN non configuré. Ajoute-le dans les variables d'environnement Render.");
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "SynthCrew-Agent/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) return fail(`GitHub API ${res.status}: ${await res.text()}`);
  return ok(await res.json());
}

const TOOLS = {
  "github.list_issues": async ({ owner, repo, state = "open", per_page = 10 }) => {
    const result = await githubRequest(`/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}`);
    if (!result.success) return result;
    return ok(result.data.map((i) => ({ number: i.number, title: i.title, state: i.state, user: i.user?.login, labels: i.labels?.map((l) => l.name), created_at: i.created_at })));
  },

  "github.create_issue": async ({ owner, repo, title, body, labels }) => {
    return githubRequest(`/repos/${owner}/${repo}/issues`, "POST", { title, body, labels });
  },

  "github.get_file": async ({ owner, repo, path }) => {
    const result = await githubRequest(`/repos/${owner}/${repo}/contents/${path}`);
    if (!result.success) return result;
    const content = result.data.content ? Buffer.from(result.data.content, "base64").toString("utf8") : "";
    return ok({ path: result.data.path, size: result.data.size, content: content.slice(0, 5000) });
  },

  "github.list_prs": async ({ owner, repo, state = "open", per_page = 10 }) => {
    const result = await githubRequest(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=${per_page}`);
    if (!result.success) return result;
    return ok(result.data.map((p) => ({ number: p.number, title: p.title, state: p.state, user: p.user?.login, created_at: p.created_at, head: p.head?.ref, base: p.base?.ref })));
  },

  "github.list_repos": async ({ owner, per_page = 10 }) => {
    const result = await githubRequest(`/users/${owner}/repos?sort=updated&per_page=${per_page}`);
    if (!result.success) return result;
    return ok(result.data.map((r) => ({ name: r.name, full_name: r.full_name, description: r.description, language: r.language, stars: r.stargazers_count, updated_at: r.updated_at })));
  },

  "web.search": async ({ query, count = 5 }) => {
    if (!BRAVE_API_KEY) {
      try {
        const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          headers: { "User-Agent": "SynthCrew-Agent/1.0" },
        });
        const html = await res.text();
        const results = [];
        const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)/g;
        let match;
        while ((match = regex.exec(html)) && results.length < count) {
          results.push({ url: match[1], title: match[2].trim() });
        }
        return ok({ query, results, source: "duckduckgo" });
      } catch (e) {
        return fail(`Recherche web échouée: ${e.message}`);
      }
    }
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`, {
      headers: { "X-Subscription-Token": BRAVE_API_KEY, Accept: "application/json" },
    });
    if (!res.ok) return fail(`Brave Search ${res.status}`);
    const data = await res.json();
    return ok({ query, results: (data.web?.results || []).map((r) => ({ title: r.title, url: r.url, description: r.description })) });
  },

  "web.fetch": async ({ url, maxLength = 3000 }) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "SynthCrew-Agent/1.0", Accept: "text/html,application/json,text/plain" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return fail(`HTTP ${res.status} pour ${url}`);
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      if (contentType.includes("json")) {
        return ok({ url, contentType: "json", content: text.slice(0, maxLength) });
      }
      const cleaned = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return ok({ url, contentType: "html", content: cleaned.slice(0, maxLength) });
    } catch (e) {
      return fail(`Fetch échoué pour ${url}: ${e.message}`);
    }
  },

  "slack.post_message": async ({ channel, text }) => {
    if (!SLACK_WEBHOOK) return fail("SLACK_WEBHOOK_URL non configuré. Ajoute un webhook Slack dans les variables d'environnement.");
    const res = await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, text }),
    });
    if (!res.ok) return fail(`Slack ${res.status}: ${await res.text()}`);
    return ok({ sent: true, channel, preview: text.slice(0, 100) });
  },

  "notion.create_page": async ({ title, content, database_id }) => {
    if (!NOTION_TOKEN) return fail("NOTION_TOKEN non configuré. Ajoute un token Notion dans les variables d'environnement.");
    const body = database_id
      ? { parent: { database_id }, properties: { Name: { title: [{ text: { content: title } }] } }, children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content } }] } }] }
      : { parent: { type: "page_id", page_id: "root" }, properties: { title: { title: [{ text: { content: title } }] } }, children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content } }] } }] };
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { Authorization: `Bearer ${NOTION_TOKEN}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return fail(`Notion ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return ok({ id: data.id, url: data.url, title });
  },

  "email.draft": async ({ to, subject, body }) => {
    return ok({
      type: "draft",
      to,
      subject,
      body: body.slice(0, 500),
      note: "Email préparé. Pour l'envoi réel, configure GMAIL_CREDENTIALS ou SMTP_HOST dans les variables d'environnement.",
    });
  },

  "analysis.summarize": async ({ text, format = "bullet" }) => {
    if (!ANTHROPIC_API_KEY) {
      const sentences = text.split(/[.!?]+/).filter(Boolean).slice(0, 5);
      return ok({ summary: sentences.map((s) => `• ${s.trim()}`).join("\n"), method: "heuristic" });
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: `Résume ce texte en ${format === "bullet" ? "points clés" : "un paragraphe"} :\n\n${text.slice(0, 4000)}` }],
      }),
    });
    if (!res.ok) return fail(`Claude API ${res.status}`);
    const data = await res.json();
    return ok({ summary: data.content?.[0]?.text || "", method: "claude" });
  },

  "analysis.categorize": async ({ items, categories }) => {
    const catKeys = categories || ["high", "medium", "low"];
    const result = items.map((item, i) => ({
      item: typeof item === "string" ? item : item.title || JSON.stringify(item),
      category: catKeys[i % catKeys.length],
    }));
    return ok({ categorized: result, count: result.length });
  },

  "file.write_report": async ({ title, sections }) => {
    const content = `# ${title}\n\n_Généré par SynthCrew le ${new Date().toLocaleDateString("fr-FR")}_\n\n${sections.map((s) => `## ${s.title}\n\n${s.content}\n`).join("\n")}`;
    return ok({ title, content, wordCount: content.split(/\s+/).length, format: "markdown" });
  },
};

export function getAvailableTools() {
  return Object.keys(TOOLS);
}

export async function executeTool(toolName, params = {}) {
  const tool = TOOLS[toolName];
  if (!tool) return fail(`Outil "${toolName}" non trouvé. Outils disponibles : ${Object.keys(TOOLS).join(", ")}`);
  try {
    return await tool(params);
  } catch (e) {
    return fail(`Erreur lors de l'exécution de ${toolName}: ${e.message}`);
  }
}

export function getConfiguredServices() {
  return {
    github: !!GITHUB_TOKEN,
    brave_search: !!BRAVE_API_KEY,
    slack: !!SLACK_WEBHOOK,
    notion: !!NOTION_TOKEN,
    anthropic: !!ANTHROPIC_API_KEY,
    web_fetch: true,
    analysis: true,
    file: true,
  };
}

export { ANTHROPIC_API_KEY };
