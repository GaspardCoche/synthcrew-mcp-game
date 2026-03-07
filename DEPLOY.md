# Déploiement SynthCrew sur un serveur

L’application est conçue pour **tourner sur un serveur** (pas en local) : une seule URL sert l’API, le WebSocket et le frontend. Les utilisateurs ouvrent cette URL dans le navigateur ; la connexion CLI (Claude Code CLI, Cursor, etc.) utilise la même URL.

---

## 1. Prérequis

- **Node.js 20+** sur le serveur, ou **Docker**.
- Build du frontend : `npm run build` → dossier `dist/`.
- Le serveur Node sert `dist/` et répond sur `/api/*` et `/ws`.

---

## 2. Déployer sur Render (recommandé, gratuit)

1. Crée un compte sur [render.com](https://render.com).
2. **New → Web Service**, connecte le repo GitHub du projet.
3. Renseigne :
   - **Build command** : `npm ci && npm run build`
   - **Start command** : `npm run start`
   - **Health check path** : `/api/health`
4. Render définit automatiquement `PORT` ; pas besoin de le mettre en env.
5. Déploie. L’URL sera du type : `https://synthcrew-xxxx.onrender.com`.

Tu peux aussi utiliser le **Blueprint** fourni :

- À la racine du repo : fichier **`render.yaml`**.
- Dans le dashboard Render : **New → Blueprint**, sélectionne le repo ; Render crée le service à partir du fichier.

Une fois en ligne, ouvre **https://ton-app.onrender.com** dans le navigateur. Pour connecter la CLI, va dans l’onglet **Intégrations** de l’app et copie l’URL de l’API + la commande `curl` proposée.

---

## 3. Déployer avec Docker

Build et run en local (pour test) :

```bash
docker build -t synthcrew .
docker run -p 3001:3001 -e PORT=3001 synthcrew
```

Puis ouvre `http://localhost:3001`. En production, déploie l’image sur ton hébergeur (Railway, Fly.io, AWS ECS, etc.) en exposant le port configuré (`PORT`).

Exemple **Railway** :

- Connecte le repo, ajoute un **Dockerfile**.
- Railway build l’image et lance le conteneur ; il t’assigne une URL publique.

Exemple **Fly.io** :

```bash
fly launch
# puis adapter fly.toml : internal_port = 3001, protocol = "tcp"
fly deploy
```

---

## 4. Déployer sur Railway (sans Docker)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Choisis le repo ; Railway détecte Node.
3. **Settings** :
   - Build command : `npm run build`
   - Start command : `npm run start`
   - Root directory : (laisser vide si tout est à la racine)
4. **Variables** : Railway injecte `PORT` ; optionnel : `NODE_ENV=production`.
5. Déploie. L’URL sera du type : `https://synthcrew-production-xxxx.up.railway.app`.

Même principe : une seule URL pour le navigateur et pour la CLI (voir onglet **Intégrations** dans l’app).

---

## 5. Variables d’environnement (serveur)

| Variable       | Description |
|----------------|-------------|
| `PORT`         | Port d’écoute. Render / Railway / Fly le définissent automatiquement. |
| `NODE_ENV`     | `production` en prod (recommandé). |
| `CORS_ORIGIN`  | Optionnel. Origines CORS séparées par des virgules si tu sers le front ailleurs. |

En déploiement classique (front + API sur la même URL), tu n’as en général pas besoin de `CORS_ORIGIN`.

---

## 6. Health check

Les plateformes peuvent interroger :

- **GET** `https://ton-domaine.com/api/health`

Réponse attendue : `{ "ok": true, "version": "1.0", "static": true }`.

Configure ce path dans Render / Railway / Fly comme health check.

---

## 7. Connexion CLI depuis le navigateur

Une fois l’app déployée :

1. Ouvre l’URL du serveur dans le navigateur (ex. `https://synthcrew.onrender.com`).
2. Va sur **#/classic/integrations** (onglet **Intégrations**).
3. Tu y trouves :
   - L’**URL de l’API** (celle de la page, utilisable telle quelle pour la CLI).
   - Un bouton **Copier** pour l’URL et pour un exemple **curl**.
   - Un bouton **Tester la connexion** qui appelle `/api/health` et affiche le résultat.

Tu n’as rien à installer en local pour “configurer” la CLI : tu copies depuis le navigateur et tu colles dans ton outil (Claude Code CLI, script, etc.). Voir **docs/CLI_INTEGRATION.md** pour le détail de l’API.

---

## 8. Résumé des commandes (serveur)

| Contexte        | Commande |
|-----------------|----------|
| Build           | `npm run build` |
| Démarrer        | `npm run start` (ou `PORT=8080 npm run start`) |
| Docker          | `docker build -t synthcrew . && docker run -p 3001:3001 synthcrew` |

Le développement en local reste possible avec `npm run dev` (front) et `npm run dev:server` (API), mais le déploiement cible **toujours un serveur** avec `npm run build` + `npm run start` (ou l’image Docker).
