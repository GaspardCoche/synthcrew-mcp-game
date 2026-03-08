# SYNTH CREW — Product Concept Document

## "Your AI crew. Assemble. Deploy. Observe. Evolve."

---

## 1. VISION — Le Pitch

**SynthCrew** est une plateforme SaaS qui transforme l'IA agentique en une expérience visuelle, ludique et puissante. Au lieu d'un terminal CLI austère, l'utilisateur gère un **équipage d'agents IA personnifiés** depuis un tableau de bord immersif inspiré de la science-fiction — un "pont de commandement" où chaque agent est un membre d'équipage spécialisé.

**Le problème qu'on résout :**
- Claude Code est surpuissant mais réservé aux développeurs CLI-friendly
- Les MCPs se multiplient (Slack, GitHub, Gmail, Notion, Jira, DB…) mais personne ne les orchestre visuellement
- L'IA agentique est abstraite → les gens ne comprennent pas ce qui se passe "dans la boîte noire"
- Aucune solution ne permet de composer, observer et automatiser des workflows multi-agents sans coder

**La proposition :**
> "Et si tes agents IA étaient des personnages que tu recrutes, que tu équipes, et que tu envoies en mission — le tout depuis une interface aussi intuitive qu'un jeu de stratégie ?"

---

## 2. CONCEPT CRÉATIF — L'Univers

### 2.1 La Métaphore : Le Vaisseau

L'interface est un **vaisseau spatial** (le workspace de l'utilisateur). Chaque section du vaisseau correspond à un domaine :

| Zone du Vaisseau | Fonction réelle |
|---|---|
| **Le Pont (Bridge)** | Dashboard principal — vue d'ensemble des missions actives |
| **L'Armurerie (Armory)** | Bibliothèque des MCPs disponibles — "l'équipement" des agents |
| **Les Quartiers (Quarters)** | Gestion de tes agents — profils, spécialisations, historique |
| **La Salle de Mission (Ops Room)** | Création et suivi de missions — prompt → exécution → résultat |
| **Le Journal de Bord (Ship Log)** | Historique complet, logs, analytics |
| **Le Chantier Naval (Shipyard)** | Marketplace de templates d'agents et de workflows |

### 2.2 Les Agents = Des Personnages

Chaque agent a :
- **Un avatar généré** (style pixel-art ou anime-mecha, au choix du thème)
- **Un nom** (auto-généré ou personnalisé : "Nova", "Cipher", "Archivist"…)
- **Une classe/rôle** : Développeur, Analyste, Rédacteur, Data Ops, Support, Chercheur…
- **Des compétences** = les MCPs qu'il maîtrise (GitHub, Slack, DB, Web Search…)
- **Un niveau d'XP** qui monte avec l'usage (gamification)
- **Un statut** : En veille (💤), En mission (⚡), En attente (⏳), Erreur (🔴)
- **Une "personnalité"** = un system prompt spécialisé qui définit son comportement

### 2.3 Les Missions = Des Workflows

L'utilisateur ne "prompte" pas un agent. Il **lance une mission** :

```
Mission : "Analyse les 50 derniers tickets Zendesk, catégorise-les, 
crée un rapport Notion, et envoie un résumé Slack à #support-team"
```

Le système **décompose automatiquement** la mission en sous-tâches et **recrute les bons agents** :

```
Mission Planner (IA) décompose en :
  ├── Tâche 1 : Lire les tickets Zendesk → Agent "Sentinel" (MCP: Zendesk)
  ├── Tâche 2 : Catégoriser + analyser → Agent "Cipher" (MCP: aucun, pure IA)
  ├── Tâche 3 : Créer le rapport → Agent "Archivist" (MCP: Notion)
  └── Tâche 4 : Notifier l'équipe → Agent "Herald" (MCP: Slack)
```

**L'utilisateur voit tout ça en temps réel** sur le Pont, avec des animations de "déploiement" des agents.

---

## 3. ARCHITECTURE TECHNIQUE

### 3.1 Stack Technologique

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Client)                     │
│  React 18 + Vite + Tailwind + Three.js (R3F)            │
│  WebSocket natif pour le temps réel                     │
│  Monde 3D immersif (@react-three/fiber + drei)          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + WSS
┌──────────────────────▼──────────────────────────────────┐
│                  API GATEWAY (Orchestrateur)              │
│  Node.js + Hono                                          │
│  Auth : Clerk / Auth0                                    │
│  Rate Limiting + Usage Metering                          │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ MISSION      │ │ AGENT    │ │ MCP          │
│ PLANNER      │ │ RUNTIME  │ │ REGISTRY     │
│              │ │          │ │              │
│ Claude API   │ │ Workers  │ │ PostgreSQL   │
│ (Opus/Sonnet)│ │ isolés   │ │ + Redis      │
│ Décompose    │ │ (Docker/ │ │ Catalogue    │
│ les missions │ │ Firecracker│ │ des MCPs   │
│ en DAG       │ │ /Lambda) │ │ disponibles  │
└──────────────┘ └──────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│              MCP EXECUTION LAYER                         │
│  Chaque agent tourne dans un sandbox isolé               │
│  avec ses MCPs connectés via stdio/SSE                   │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PERSISTENCE & OBSERVABILITY                  │
│  PostgreSQL : Missions, Agents, Users, Billing           │
│  Redis : Queue (BullMQ), Cache, Pub/Sub temps réel      │
│  ClickHouse : Logs d'exécution, analytics                │
│  S3 : Artifacts générés (fichiers, rapports, images)     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Le Mission Planner — Le Cerveau

C'est le composant clé. Quand l'utilisateur soumet une mission en langage naturel :

**Étape 1 — Analyse & Décomposition (Claude Opus/Sonnet)**

Réponse structurée type JSON : `mission_id`, `title`, `tasks[]` avec `id`, `action`, `agent_role`, `mcps_required`, `depends_on`, `output_schema`, et `execution_graph`.

**Étape 2 — Agent Matching**  
Le système mappe chaque tâche à un agent existant (ou en crée un temporaire) selon `AgentRole`, MCPs, et personnalité.

**Étape 3 — Exécution Isolée**  
Chaque agent tourne dans un worker isolé (container Docker léger ou Firecracker microVM), avec stream temps réel vers le frontend via WebSocket.

### 3.3 Auto-Activation / Désactivation des Agents

Le système est **event-driven**. Les agents ne tournent pas en permanence : Mission soumise → Mission Planner décompose → Scheduler réveille l’agent pour chaque tâche prête → Exécution → Endort l’agent → Passe le résultat aux tâches dépendantes.

**Triggers automatiques (Cron Missions)** : missions récurrentes (ex. "Tous les lundis à 9h…") gérées par un Event Bus (Redis Pub/Sub + webhooks MCP).

### 3.4 Observabilité Temps Réel

L'utilisateur voit en direct : quel agent est actif, le stream du raisonnement, les outils MCP utilisés, les résultats intermédiaires, le graphe de progression. Techniquement : Agent Worker → Redis Pub/Sub → API Gateway → WebSocket → Frontend.

---

## 4. FONCTIONNALITÉS DÉTAILLÉES

### 4.1 Création d'Agent (Quarters)

- **Depuis un template (Shipyard)** — Blueprints pré-configurés (Marketing Analyst, Code Reviewer, Customer Whisperer…)
- **Depuis zéro (custom)** — Avatar, nom, spécialité, ADN (system prompt), MCPs en drag & drop
- **Auto-génération** — "Décris ce que tu veux, on crée l'agent" (Claude génère profil complet)

### 4.2 Armurerie MCP (Armory)

Interface pour gérer les MCPs : Connectés vs Marketplace, ajout de MCP custom (URL SSE). Chaque MCP connecté expose ses **tools** ; l'utilisateur assigne les MCPs aux agents comme de "l'équipement".

### 4.3 Salle de Mission (Ops Room)

- **Vue Chat** : demande → plan + exécution
- **Vue Mission Control** : DAG interactif, cartes d'agents en stream, timeline, artifacts
- **Vue Autopilot** : triggers, missions automatiques, notifications

### 4.4 Gamification & Progression

XP des agents, missions streak, achievements, leaderboard interne, évolutions d'avatar à certains paliers, blueprints partagés sur le Shipyard.

---

## 5. BUSINESS MODEL

- **Explorer** (free) : 3 agents, 50 missions/mo, 5 MCPs
- **Captain** : 29€/mo — 10 agents, 500 missions, MCPs illimités, cron missions
- **Admiral** : 99€/mo — Agents/missions illimités*, team workspace, SSO, API
- **Fleet** (enterprise) : Custom — multi-workspace, audit, SLA, on-premise

Revenue : abonnements SaaS, usage API pass-through, marketplace commission, MCP premium, enterprise licensing.

---

## 6. ROADMAP TECHNIQUE

- **Phase 1 (MVP)** : Auth, création d'agents, 5 MCPs core, Mission Planner v1 (linéaire), stream WebSocket, dashboard, Stripe
- **Phase 2** : DAG complet, Armurerie 20+ MCPs, gamification, cron missions, marketplace v1
- **Phase 3** : Multi-agent collaboration, agent memory (RAG), API publique, event-driven, on-premise, éditeur visuel de DAG
- **Phase 4** : Agents autonomes longue durée, inter-workspace, AI-generated agents, voice interface, agent-to-agent protocol

---

## 7. DIFFÉRENCIATION

**Moat unique** : Univers ludique (engagement) + MCP ecosystem (puissance) + observabilité temps réel (confiance) + marketplace (effet réseau).

---

## 8. SYNTHCREW AGENT PROTOCOL (SAP)

Chaque agent : identité (id, name, role, personality), capacités (mcps, tools), état (status, currentTask, memory RAG), méthodes `wake()`, `execute(task)` (stream), `sleep()`, `recall(query)`. Événements : `thinking`, `tool_call`, `tool_result`, `output`, `error`, `status_change`. Sécurité : containers isolés, credentials chiffrés, permissions par agent, audit log, rate limiting, kill switch.

---

## 9. EXEMPLES DE CAS D'USAGE

- Growth Marketer : scrape offres concurrents → analyse tendances → rapport Notion → résumé Slack
- Dev Lead : PR mergée → review sécurité → CHANGELOG → ticket Jira si breaking change
- Support Manager : sentiment tickets → top 3 pain points → deck → email VP Product
- Freelance : emails non lus → priorisation → drafts réponses → todo Notion

---

## 10. GO-TO-MARKET

Landing + waitlist, beta 50–100 users, contenu viral, ProductHunt, referral. Canaux : Twitter/X, YouTube, Reddit, newsletter "Ship Log", partnerships. Métriques : WAU, missions/user/semaine, conversion, rétention, NPS, ARPU.
