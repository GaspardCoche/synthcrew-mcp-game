# Intégration SynthCrew avec Claude Code CLI / Cursor

L’objectif : une fois que l’utilisateur a déployé SynthCrew, il peut le brancher dans son **Claude Code CLI** (ou Cursor, ou tout outil qui envoie des requêtes HTTP). Toute la création de missions et le suivi passent par l’app SynthCrew : meilleure UX, tout au même endroit.

## API CLI

### Créer une tâche depuis le CLI

**POST** `/api/cli/task`

Corps (JSON) :

| Champ       | Type    | Obligatoire | Description |
|------------|---------|-------------|-------------|
| `prompt`   | string  | oui         | Description de la mission (ex. "Rapport hebdo Zendesk, envoyer sur Slack"). |
| `title`    | string  | non         | Titre court (sinon dérivé de `prompt`). |
| `source`   | string  | non         | `"claude-cli"` \| `"cursor"` \| `"api"` \| `"cron"`. Défaut : `"api"`. |
| `autoRun`  | boolean | non         | Si `true`, la mission est mise en file et exécutée par le worker autonome. Défaut : `true`. |
| `templateId` | string | non       | ID d’un template de mission existant. |

Exemple (enregistrer une mission et l’exécuter automatiquement) :

```bash
curl -X POST http://localhost:3001/api/cli/task \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyser les tickets Zendesk et envoyer un résumé sur Slack", "source": "claude-cli", "autoRun": true}'
```

Réponse :

```json
{
  "ok": true,
  "mission": { "id": "m_1234567890", "title": "Analyser les tickets...", "status": "pending" },
  "message": "Mission en file, exécution autonome en cours."
}
```

Si `autoRun` est `false`, la mission est seulement enregistrée (`status: "completed"`) et aucun worker ne la traite.

## Comportement côté serveur

- Les missions avec `status: "pending"` sont prises en charge par un **worker** qui tourne toutes les 3 secondes.
- Le worker décompose le `prompt` en tâches, assigne des agents (par rôle) et simule l’exécution (étapes, log).
- Les clients connectés en **WebSocket** (`/ws`) reçoivent en temps réel : `mission_log`, `agents`, `missions`, `stats`.

L’utilisateur voit donc dans l’app SynthCrew (Village, Live feed, Atelier) les missions lancées depuis le CLI et leur progression.

## Intégration dans Claude Code CLI

1. **Configurer l’URL de l’API**  
   Variable d’environnement ou config du CLI, ex. :  
   `SYNTHCREW_API_URL=http://localhost:3001` (ou l’URL de production).

2. **Lorsqu’une tâche doit être déléguée à SynthCrew**  
   Le CLI envoie une requête `POST /api/cli/task` avec le prompt et `source: "claude-cli"`.

3. **Optionnel : suivi**  
   Le CLI peut interroger `GET /api/missions` pour lister les missions (filtre côté client sur `status` si besoin).

Ainsi, l’utilisateur garde une seule interface (SynthCrew) pour tout le flux de travail, que les missions viennent de l’app ou du CLI.

**Connexion la plus simple** : une fois l’app déployée sur un serveur, ouvre l’onglet **CLI** (#/classic/integrations) dans le navigateur. Tu y copies l’URL de l’API et l’exemple curl, puis tu testes la connexion. Aucune installation locale.
