# AZ-104 Lab Coach

Application web locale pour reviser AZ-104 avec des labs pratiques, un suivi de progression, des quiz, des notes et une base PostgreSQL locale.

Le projet est concu pour etre developpe directement sur une VM Linux Ubuntu avec Node.js, npm, PostgreSQL local et PM2. Docker n'est pas le mode principal.

## Stack

- Node.js + Express
- PostgreSQL local
- Frontend HTML/CSS/JS vanilla
- Pages HTML separees, dark mode responsive
- PM2 pour un futur deploiement long-running
- Nginx pret a etre utilise en reverse proxy

## Prerequis Ubuntu

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib
sudo npm install -g pm2
```

Verifie les versions:

```bash
node -v
npm -v
psql --version
pm2 -v
```

## Installation

1. Installer les dependances:

```bash
npm install
```

2. Creer la base PostgreSQL:

```bash
sudo -u postgres createdb az104_lab_coach
```

3. Copier l'environnement:

```bash
cp .env.example .env
```

4. Adapter `.env`.

Exemple local:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=az104_lab_coach
DB_USER=postgres
DB_PASSWORD=change_me
```

Ne commit jamais `.env`. Seul `.env.example` doit rester dans Git.

5. Initialiser la base:

```bash
npm run db:reset
```

6. Demarrer en developpement:

```bash
npm run dev
```

Ou demarrer en mode standard:

```bash
npm start
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## PM2

Pour lancer l'application avec PM2:

```bash
npm run pm2:start
pm2 save
pm2 startup
```

Logs:

```bash
npm run pm2:logs
```

Redemarrage:

```bash
npm run pm2:restart
```

En production derriere Nginx, utilise de preference:

```env
PORT=3000
HOST=127.0.0.1
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=az104_lab_coach
DB_USER=postgres
DB_PASSWORD=change_me
```

Au demarrage, l'application verifie que toutes les variables `DB_*` existent, puis teste la connexion avec `SELECT NOW();`.

Messages attendus:

```text
[DB] PostgreSQL connected successfully.
```

En cas de variable absente:

```text
[DB] Missing environment variable: DB_PASSWORD
```

## Nginx reverse proxy

Exemple pour un futur sous-domaine `az104.example.com`:

```nginx
server {
    listen 80;
    server_name az104.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Apres configuration:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Compose optionnel

Docker n'est pas requis. Un fichier `docker-compose.optional.yml` est fourni seulement si tu veux demarrer rapidement PostgreSQL hors installation locale:

```bash
docker compose -f docker-compose.optional.yml up -d
```

## Structure

```text
az104-lab-coach/
  db/
    schema.sql
    seed.sql
  public/
    css/styles.css
    js/api.js
    js/dashboard.js
    js/labs.js
    js/lab.js
    js/quiz.js
    js/notes.js
    js/admin.js
    dashboard.html
    labs.html
    lab.html
    quiz.html
    notes.html
    admin.html
  src/
    middleware/
    routes/
    utils/
    db.js
    server.js
  ecosystem.config.cjs
```

## Pages

- `/` ou `/dashboard.html`: tableau de bord
- `/labs.html`: liste des labs avec filtres par module, statut et difficulte
- `/lab.html?id=...`: detail, checklist, notes personnelles et progression
- `/quiz.html`: quiz par module avec correction
- `/notes.html`: notes, ressources et commandes utiles
- `/admin.html`: gestion des modules, labs, questions et ressources

## API principale

- `GET /health`
- `GET /api/dashboard`
- `GET /api/modules`
- `GET /api/labs?module_id=...&status=...&difficulty=...`
- `GET /api/labs/:id`
- `PATCH /api/labs/:id/progress`
- `POST /api/labs/:id/steps/:stepId/toggle`
- `GET /api/quiz/questions?module_id=...`
- `POST /api/quiz/attempts`
- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `GET /api/resources`
- `POST /api/admin/reset-demo-data`

## Reset demo data

Le bouton **Reset demo data** dans `admin.html` relance `db/seed.sql` via l'API. Cette action supprime les donnees de demo puis recharge les exemples.
