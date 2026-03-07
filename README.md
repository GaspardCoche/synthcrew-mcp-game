# SynthCrew — MCP Game

Projet **SynthCrew** : monde 3D immersif d’agents IA + tableau de bord complet. **Open World** dans le navigateur (Three.js / React Three Fiber), backend API + WebSocket, agents qui expliquent leur rôle au clic.

## Lancer le projet (front + back)

```bash
npm install
npm run dev:server   # Terminal 1 : API http://localhost:3001 + WS /ws
npm run dev          # Terminal 2 : Front http://localhost:5173
```

Ou en une commande : `npm run dev:all` (si `concurrently` est installé).

- **/** → Monde 3D (ou **Vue carte** 2D) : explore en première personne (WASD, souris), NOVA et agents cliquables.
- **#/classic** → **Village** (tableau de bord) : Vue d’ensemble, Équipe, Outils, **Atelier** (missions), **Chroniques** (historique & achievements).

Les sous-pages utilisent le **hash** (`#/classic/ops`, `#/classic/log`) pour fonctionner en local et sur hébergement statique sans config serveur.

## Ce qui est en place

| Partie | Détail |
|--------|--------|
| **Monde 3D** | **Terrain** procédural open-world, **lumières adoucies**, **décors village** (Forge, Taverne, Place centrale…). Contrôles : WASD, souris (personnalisables), Vue carte 2D en secours. |
| **NOVA — Agent guide** | Orbe doré toujours visible à l’écran. Clique dessus pour ouvrir un panneau d’aide. Si tu ne fais rien pendant ~5 s, une **bulle** t’invite à cliquer sur NOVA ou un agent. Comme un ami toujours là pour te guider. |
| **Agents** | Chargés depuis l’API, cliquables ; overlay avec explication par rôle et lien « Lancer une mission ». |
| **Backend** | Hono sur Node (port 3001), REST `/api/agents`, `/api/missions`, `/api/automations`, WebSocket `/ws`, persistance `server/data.json`. |
| **Tableau (Village)** | **Village** (vue d’ensemble), **Équipe** (agents), **Outils** (MCPs + **objets utiles** à donner aux agents), **Atelier** (plan-then-execute, **exécution en direct** type Pixel Agent), **Chroniques** (missions, automations, Achievements). |
| **Vue carte** | Depuis le monde 3D, bouton « Vue carte » : vue 2D avec lieux, équipe et **flux d’activité en direct**. |
| **Déploiement** | Voir **DEPLOY.md** pour déployer sur un serveur (Render, Railway, Docker). Onglet **CLI** dans l’app pour connecter les outils externes. |

## Structure

| Chemin | Rôle |
|--------|------|
| `server/index.js` | API Hono + WebSocket + seed agents par défaut |
| `src/AppImmersive.jsx` | Point d’entrée monde 3D (Canvas R3F, effets, overlay) |
| `src/scenes/World.jsx` | Scène (Sky, Environment, fog, lumières zones, ContactShadows, Sparkles, AgentOrb, GuideAgent) |
| `src/scenes/TexturedGround.jsx` | Sol avec texture procédurale (grille) |
| `src/scenes/Structures.jsx` | Blocs type Minecraft/Habbo (plateformes) |
| `src/scenes/GuideAgent.jsx` | NOVA — orbe guide toujours présent |
| `src/components/GuideOverlay.jsx` | Panneau d’aide au clic sur NOVA |
| `src/components/AgentOverlay.jsx` | Panneau explication agent + lien Ops Room |
| `src/App.jsx` + `src/pages/*` | Tableau de bord (basename `/classic`) |
| `docs/SYNTHCREW_CONCEPT.md` | Concept produit, roadmap, monétisation |

## Ambiance / suite

- **Son** : pour une ambiance complète, ajouter une piste ambiante (ex. `howler` + fichier audio) et la lancer au chargement.
- **Assets 3D** : modèles Blender/Cinema 4D exportés en **glTF** peuvent être chargés avec `useGLTF` (Drei) à la place des sphères.
- **Unity/Unreal** : pour un standalone natif, exporter le gameplay en WebGL (Unity) ou utiliser Pixel Streaming (Unreal) ; l’intégration actuelle reste web-first (Three.js).

## MCPs & mode agentique

Les MCPs Cursor (GitHub, Filesystem, Brave Search, etc.) permettent à l’assistant de coder et déployer. L’app consomme l’API locale pour les agents ; en prod, connecter de vrais MCPs côté backend.

## Intégration Claude Code CLI / agents autonomes

Voir **docs/CLI_INTEGRATION.md** : **POST /api/cli/task** pour envoyer des missions depuis le CLI ; worker autonome (missions en file), tout visible en temps réel dans l’app (Village, Live feed). Validation API avec **Zod**, moteur dans `server/lib/missionEngine.js`.

## Monétisation

Limites par plan dans `src/lib/constants.js` ; affichage dans le tableau classique. Suite : Stripe + écran de choix de plan.
