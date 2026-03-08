# SynthCrew v3.0 — Open-World AI Agent OS

**SynthCrew est à la fois un jeu et un SaaS** : un monde 3D open-world où tes agents IA prennent vie, exécutent de vraies missions, et peuvent être orchestrés via une CLI embarquée — comme Claude Code, mais dans un univers cyberpunk.

> _"Pourquoi utiliser une CLI grise quand tu peux orchestrer tes agents dans un monde vivant ?"_

---

## Démarrage rapide

```bash
npm install
npm run dev:all    # Frontend :5173 + API :3001
```

Variables d'environnement optionnelles (`.env`) :
```env
ANTHROPIC_API_KEY=sk-...   # Pour l'exécution réelle via Claude
GITHUB_TOKEN=ghp_...       # Pour les outils GitHub
BRAVE_API_KEY=...           # Pour la recherche web
SLACK_WEBHOOK_URL=...       # Pour les notifications Slack
```

---

## Le Concept

| Traditionnel | SynthCrew |
|---|---|
| CLI grise | Terminal dans un monde 3D |
| Logs textuels | Agents qui bougent vers leurs workstations |
| Workflow invisible | Data flows visibles entre agents |
| Outil technique | Jeu + SaaS |

---

## Fonctionnalités v3.0

### Terminal CLI Intégré (` pour ouvrir)
```bash
> mission "Analyse les PRs GitHub et génère un rapport"
> agents ls
> agent NEXUS task "Planifier la roadmap Q2"
> spawn CODEFORGE
> missions ls
> services
> help
```
Commandes complètes type Claude Code, streamées en temps réel depuis le serveur.

### Open World avec Districts
- **Hub District** (NEXUS) — Centre de commandement
- **Data Quarter** (DATAFLOW) — Pipeline de données
- **Analysis District** (PRISME) — Laboratoire d'analyse
- **Archive Vault** (SCRIBE) — Bibliothèque de documentation
- **Comms Tower** (SIGNAL) — Centre de communication
- **Spider Web** (SPIDER) — Réseau de veille web
- **Forge District** (CODEFORGE) — Atelier de développement

### Agents Vivants
- Se déplacent vers leurs **workstations** quand ils travaillent
- Affichent en temps réel ce qu'ils font ("Récupération données…", "PR en review…")
- Machine à états : `idle → queued → active → celebrating/error`
- Santé visuelle — se dégradent sous les erreurs

### Data Flows Visuels
- Particules colorées qui volent entre agents pendant les missions
- Rayons de connexion entre agents actifs
- Ambient particles qui donnent vie au monde

### Exécution IA Réelle
- Avec `ANTHROPIC_API_KEY` : Claude décompose et exécute vraiment les missions
- Sans clé : simulation réaliste avec feedback temps réel
- Streaming des réponses Claude via WebSocket

### Musique Sci-Fi (6 loops)
- "Entering the Void", "Awakening Station", "Fractured Space-Time" et plus
- Lecteur avec contrôle volume et navigation

---

## Routes

| URL | Description |
|---|---|
| `/` | Monde 3D — explore, observe les agents, utilise le terminal |
| `#/classic` | Dashboard — gestion équipe, missions, outils |
| `#/classic/ops` | Opérations — lancer et suivre les missions |
| `#/classic/log` | Historique et achievements |

---

## API

| Endpoint | Description |
|---|---|
| `POST /api/cli/task` | Créer une mission depuis CLI externe |
| `POST /api/cli/exec` | Exécuter une commande système (safe) |
| `GET /api/agents` | Liste des agents |
| `GET /api/services` | Services MCP connectés |
| `GET /api/health` | Health check |
| `WS /ws` | WebSocket — missions, agents, stream temps réel |

### Exemple CLI externe (compatible Claude Code)
```bash
curl -X POST http://localhost:3001/api/cli/task \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Ta mission ici", "source": "claude-cli", "autoRun": true}'
```

---

## Architecture

```
server/
  index.js           — API Hono + WebSocket + SPA serving
  lib/
    claudeEngine.js  — Exécution réelle via Anthropic API (streaming)
    missionEngine.js — Orchestration des missions
    tools.js         — Outils réels (GitHub, web, Slack, Notion)
    schemas.js       — Validation Zod

src/
  AppImmersive.jsx   — App principale (Canvas 3D + UI)
  scenes/
    World.jsx        — Monde complet (lumières, fog, atmosph.)
    HumanoidAgent.jsx — Agents vivants avec machine à états
    DataFlowParticles.jsx — Visualisation data entre agents
    CityDistricts.jsx — Districts avec tours, hologrammes, pylônes
    Terrain.jsx      — Terrain procédural 260×260
  components/
    CLITerminal.jsx  — Terminal CLI embarqué (Tab=complétion, ↑↓=historique)
    GameHUD.jsx      — HUD agents + zones
    AmbientAudio.jsx — Jukebox sci-fi (6 tracks)
  store/             — Zustand (world, player, controls, events)
  lib/               — API, collisions, zones, noise
```

---

## Vision Monétisation

SynthCrew est un **SaaS gamifié** :

- **Explorer** (gratuit) — 3 agents, 5 missions/jour, monde basique
- **Crew** (29€/mois) — 10 agents, missions illimitées, tous les districts, Claude API
- **Fleet** (99€/mois) — Agents illimités, workspaces équipe, API priority, analytics
- **Enterprise** — White-label, SSO, SLA, support dédié

Les utilisateurs paient pour orchestrer leurs agents IA spécialisés dans leur domaine (finance, dev, marketing, support...) avec une interface qui rend visible et engageante l'automatisation.

---

## Déploiement

```bash
npm run build
npm start
# ou
npm run deploy:render
```

Health check : `GET /api/health`
