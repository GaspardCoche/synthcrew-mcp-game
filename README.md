# SynthCrew

**Plateforme éducative** qui gamifie l'orchestration d'agents IA. Monde 3D interactif + tableau de bord. Tu visualises ton équipage, tu lances des missions (workflows) et tu observes la progression en temps réel.

## Lancer en local

```bash
npm install
npm run dev:all    # Frontend (5173) + API (3001) en parallèle
```

Ou séparément :

```bash
npm run dev:server   # API http://localhost:3001 + WS /ws
npm run dev          # Front http://localhost:5173
```

## Routes

| URL | Description |
|-----|-------------|
| **/** | Monde 3D (explore en première personne, agents cliquables, NOVA guide) |
| **#/classic** | Tableau de bord (équipe, missions, outils, chroniques) |
| **#/classic/ops** | Atelier (lancer et suivre les missions) |
| **#/classic/log** | Historique & achievements |

## Déploiement

Voir **DEPLOY_NOW.md** : Render CLI (`brew install render`, `render login`, `npm run deploy:render`) ou Dashboard.

Health check : `GET /api/health`.

## Structure

| Chemin | Rôle |
|--------|------|
| `server/index.js` | API Hono + WebSocket + serve SPA en prod |
| `src/AppImmersive.jsx` | Monde 3D (Canvas R3F, post-processing, overlays) |
| `src/scenes/` | World, Terrain, Structures, WorldDetails, Agents, NOVA |
| `src/components/` | HUD, GameHUD, Onboarding, Overlays, Modals |
| `src/pages/` | Bridge, Quarters, Armory, OpsRoom, Log, Integrations |
| `src/store/` | Zustand stores (world, player, controls, events) |
| `src/lib/` | API, collisions, zones, noise, mission runner |
| `docs/` | Concept produit, intégration CLI |

## API CLI

`POST /api/cli/task` pour envoyer des missions depuis un CLI externe. Voir **docs/CLI_INTEGRATION.md**.
