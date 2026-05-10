# Lagaao.com

Production-ready monolithic application — Angular 19 + Node.js + Express + MySQL + Sequelize.

## Prerequisites

- Node.js >= 20
- MySQL 8.0+
- Angular CLI 19 (`npm i -g @angular/cli@19`)

## Setup

### 1. Clone & Install

```bash
git clone <repo-url> lagaao
cd lagaao
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in DB credentials
npm run dev                 # starts on http://localhost:3000
```

Health check: `GET http://localhost:3000/api/v1/health`

### 3. Frontend (first time only)

```bash
# From lagaao/ root — generate Angular app if not already present
ng new frontend --routing --style=scss --ssr=false --skip-git
cd frontend
ng add @angular/material
npm install
```

Copy the generated config files from this repo into `frontend/` if they were overwritten:
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/environments/`
- `proxy.conf.json`

### 4. Run Frontend Dev Server

```bash
cd frontend
ng serve --proxy-config proxy.conf.json   # on http://localhost:4200
```

Requests to `/api/*` are proxied to `localhost:3000`.

### 5. Install ESLint + Prettier (root)

```bash
cd lagaao
npm init -y
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier prettier
```

## Production Build (GoDaddy VPS)

```bash
# Build Angular
cd frontend && ng build --configuration=production

# Copy dist to backend's public folder
cp -r dist/frontend/browser ../backend/public

# Build backend
cd ../backend && npm run build

# Start
NODE_ENV=production node dist/server.js
```

Then configure Nginx to serve the API on port 3000 and the Angular `index.html` for all other routes.

## Project Structure

```
lagaao/
├── backend/          Express API (TypeScript)
│   ├── src/
│   │   ├── config/   env, database, logger, constants
│   │   ├── middleware/  error handler, morgan
│   │   ├── modules/  feature modules
│   │   ├── routes/   route registry + health check
│   │   └── utils/    response utility
│   └── server.ts     entry point
├── frontend/         Angular 19 SPA
│   └── src/app/
│       ├── core/     services, interceptors
│       ├── layout/   shell component
│       └── features/ lazy-loaded pages
└── shared/           TypeScript types shared by both
```

## Available Scripts

| Location | Command | Description |
|---|---|---|
| `backend/` | `npm run dev` | Dev server with hot-reload |
| `backend/` | `npm run build` | Compile TypeScript |
| `backend/` | `npm start` | Run compiled build |
| `frontend/` | `ng serve --proxy-config proxy.conf.json` | Angular dev server |
| `frontend/` | `ng build --configuration=production` | Production build |
