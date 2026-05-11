#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Lagaao — Deployment Script
# Run as the 'deploy' user (NOT root) on the VPS
# Usage:
#   First deploy:   bash deploy.sh --first-run
#   Redeploy:       bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/lagaao"
REPO_URL="git@github.com:YOUR_ORG/lagaao.git"   # update this
BRANCH="main"
FIRST_RUN=false

[[ "${1:-}" == "--first-run" ]] && FIRST_RUN=true

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

log "═══════════════════════════════════════════"
log " Lagaao Deployment — $(date '+%Y-%m-%d')"
log "═══════════════════════════════════════════"

# ─── Pull latest code ─────────────────────────────────────────────────────────
if $FIRST_RUN; then
  log "[1] Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR" --branch "$BRANCH" --depth 1
  cd "$APP_DIR"
else
  log "[1] Pulling latest code..."
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

# ─── Backend build ────────────────────────────────────────────────────────────
log "[2] Installing backend dependencies..."
cd "$APP_DIR/backend"
npm ci --omit=dev                              # production-only install
npm run build                                  # compile TypeScript → dist/

# Verify .env exists
[[ -f .env ]] || die ".env not found — copy .env.production.example to .env and fill in values"

# ─── Database migrations ──────────────────────────────────────────────────────
log "[3] Running database migrations..."
npx sequelize-cli db:migrate

if $FIRST_RUN; then
  log "[3a] Running database seeds (first run only)..."
  npx sequelize-cli db:seed:all
fi

# ─── Frontend build ───────────────────────────────────────────────────────────
log "[4] Installing frontend dependencies..."
cd "$APP_DIR/frontend"
npm ci

log "[5] Building Angular app for production..."
npm run build -- --configuration=production

# Verify build output
[[ -d "dist/lagaao/browser" ]] || die "Angular build failed — dist/lagaao/browser not found"

# ─── Set file permissions ──────────────────────────────────────────────────────
log "[6] Setting file permissions..."
find "$APP_DIR/backend/dist" -type f -exec chmod 644 {} \;
find "$APP_DIR/backend/dist" -type d -exec chmod 755 {} \;
chmod -R 775 "$APP_DIR/backend/uploads"
chown -R deploy:www-data "$APP_DIR/backend/uploads"

find "$APP_DIR/frontend/dist" -type f -exec chmod 644 {} \;
find "$APP_DIR/frontend/dist" -type d -exec chmod 755 {} \;

chmod 600 "$APP_DIR/backend/.env"

# ─── Start / reload PM2 ───────────────────────────────────────────────────────
log "[7] Reloading application..."
cd "$APP_DIR"
if $FIRST_RUN || ! pm2 list | grep -q "lagaao-api"; then
  pm2 start ecosystem.config.js --env production
  pm2 save
else
  pm2 reload ecosystem.config.js --env production   # zero-downtime reload
fi

# ─── NGINX config (first run only) ────────────────────────────────────────────
if $FIRST_RUN; then
  log "[8] Installing NGINX config..."
  sudo cp "$APP_DIR/deploy/nginx/lagaao.conf" /etc/nginx/sites-available/lagaao.com
  sudo ln -sf /etc/nginx/sites-available/lagaao.com /etc/nginx/sites-enabled/lagaao.com
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx

  log "[9] Obtaining SSL certificate..."
  sudo certbot --nginx -d lagaao.com -d www.lagaao.com \
    --non-interactive --agree-tos -m admin@lagaao.com \
    --redirect
  sudo systemctl reload nginx
fi

# ─── Reload NGINX (every deploy) ─────────────────────────────────────────────
log "[8] Testing and reloading NGINX..."
sudo nginx -t && sudo systemctl reload nginx

# ─── Health check ─────────────────────────────────────────────────────────────
log "[9] Health check..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://lagaao.com/api/v1/health 2>/dev/null || echo "000")
if [[ "$HTTP_STATUS" == "200" ]]; then
  log "✓ Health check passed (HTTP $HTTP_STATUS)"
else
  log "⚠ Health check returned HTTP $HTTP_STATUS — review pm2 logs"
fi

log ""
log "═══════════════════════════════════════════"
log " Deployment complete!"
log " pm2 status: pm2 list"
log " API logs:   pm2 logs lagaao-api"
log " NGINX logs: tail -f /var/log/nginx/lagaao.error.log"
log "═══════════════════════════════════════════"
