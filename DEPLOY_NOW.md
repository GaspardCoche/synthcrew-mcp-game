# Déployer SynthCrew (Render) — CLI en priorité

**Important :** Render déploie le **code présent sur la branche connectée** (ex. `main`). Pour que tes changements soient effectifs en prod, il faut **d’abord pousser le code**, puis déclencher un déploiement (ou laisser l’auto-deploy faire).

---

## Pour que les changements soient effectifs (chaîne complète)

1. **Pousser le code** sur la branche que Render surveille (souvent `main`) :
   ```bash
   git add .
   git commit -m "ton message"
   git push origin main
   ```
2. **Déclencher le déploiement** :
   - **Auto-deploy** : si activé, Render build automatiquement après le push.
   - **À la main (CLI)** : `npm run deploy:render` (avec `RENDER_SERVICE_ID` défini).
   - **À la main (Dashboard)** : Render → ton service → **Manual Deploy** → **Deploy latest commit**.
3. **Si les changements ne s’affichent toujours pas** : Render peut réutiliser un **cache de build**. Dans le Dashboard : ton service → **Manual Deploy** → cocher **Clear build cache & Deploy** → Deploy.
4. **Côté navigateur** : faire un **rafraîchissement forcé** (Ctrl+Shift+R / Cmd+Shift+R). Vérifier que le **Build ID** affiché en haut à gauche (monde 3D) ou en haut à droite (tableau de bord) change après un déploiement.

---

## Option A : Render CLI (recommandé)

### 1. Installer la CLI

**macOS (Homebrew) :**
```bash
brew update && brew install render
```

**Linux / macOS (script) :**
```bash
curl -fsSL https://raw.githubusercontent.com/render-oss/cli/refs/heads/main/bin/install.sh | sh
```

Vérifier : `render` (sans arguments) affiche l’aide.

### 2. Se connecter

```bash
render login
```

Une page s’ouvre dans le navigateur pour autoriser la CLI. Une fois validé, le token est enregistré localement.

### 3. Créer le service (une seule fois)

Si le service n’existe pas encore sur Render :

- **Via Blueprint** (depuis la racine du repo) :  
  **[render.com](https://render.com)** → **New** → **Blueprint** → sélectionne le repo.  
  Render lit `render.yaml` et crée le service (branche **main** par défaut dans le fichier).
- **Ou via le dashboard** : **New** → **Web Service**, connecte le repo, configure Build/Start (voir option B).

Valider le Blueprint localement :
```bash
npm run render:validate
```
(ou `render blueprints validate`)

### 4. Récupérer l’ID du service

```bash
render services --output json
```

Repère l’`id` du service **synthcrew** (ou le nom que tu lui as donné). Exemple : `srv-abc123xyz`.

### 5. Déployer depuis le terminal

**Important :** Le déploiement part du **dernier commit poussé** sur la branche configurée (ex. `main`). Pousse d’abord tes changements avec `git push origin main`.

**Variable d’environnement (recommandé) :**
```bash
export RENDER_SERVICE_ID=srv-abc123xyz
npm run deploy:render
```

**Ou en une ligne :**
```bash
RENDER_SERVICE_ID=srv-abc123xyz npm run deploy:render
```

La commande déclenche un déploiement et attend la fin (`--wait`). En cas d’échec, le code de sortie est non nul.

**Sans attendre la fin du build :**
```bash
render deploys create $RENDER_SERVICE_ID --output text
```

### 6. Autres commandes utiles

| Commande | Description |
|----------|-------------|
| `render services` | Liste les services (mode interactif) |
| `render deploys list $RENDER_SERVICE_ID` | Historique des déploiements |
| `render logs $RENDER_SERVICE_ID` | Logs en direct (si disponible) |

---

## Option B : Dashboard uniquement (sans CLI)

1. Va sur **[render.com](https://render.com)** → **New** → **Web Service**.
2. Connecte le repo (GitHub / GitLab / Bitbucket). Choisis la **branche** à déployer (ex. **main**).
3. **Build Command** : `npm install && npm run build`  
   **Start Command** : `npm start`  
   **Health Check Path** : `/api/health`
4. Variables : `NODE_ENV` = `production`. Ne pas définir `PORT`.
5. **Create Web Service** → l’URL sera du type **https://synthcrew-xxxx.onrender.com**.

Ensuite : pousse tes changements sur la branche connectée ; soit l’auto-deploy lance le build, soit tu fais **Manual Deploy** (et **Clear build cache & Deploy** si les changements ne paraissent pas).

---

## Les changements ne s’affichent pas ?

| Vérification | Action |
|--------------|--------|
| Le code est-il poussé ? | Render build à partir de Git. Faire `git push origin main` (ou la branche configurée) avant de déployer. |
| Bonne branche ? | Dans Render → service → **Settings** → **Build & Deploy** : vérifier que la branche est bien celle sur laquelle tu pushes (ex. `main`). |
| Cache de build ? | Dashboard → ton service → **Manual Deploy** → cocher **Clear build cache & Deploy** → Deploy. |
| Cache navigateur ? | Rafraîchissement forcé : **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac). |
| Bonne version en prod ? | Regarder le **Build ID** en haut à gauche (monde 3D) ou en haut à droite (tableau de bord) : il doit changer après un déploiement réussi. |

---

## Récap des commandes npm

| Script | Rôle |
|--------|------|
| `npm run render:validate` | Valide `render.yaml` (Blueprint). |
| `npm run deploy:render` | Déclenche un déploiement (nécessite `RENDER_SERVICE_ID` et `render login`). Part du dernier commit **déjà poussé** sur la branche. |

---

## Dépannage

- **Port déjà utilisé en local** : `npm run start:safe` ou `PORT=3002 npm start`.
- **Build échoue sur Render** : voir les **Logs** du service ; s’assurer que `npm run build` produit bien le dossier `dist/`.
- **CLI : "not logged in"** : exécuter `render login` et réautoriser si le token a expiré.

Plus de détails : **docs/DEPLOY_RENDER.md**.
