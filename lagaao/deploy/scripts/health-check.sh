#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Health Check + Auto-restart Script
# Schedule: */5 * * * * /var/www/lagaao/deploy/scripts/health-check.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

HEALTH_URL="https://lagaao.com/api/v1/health"
LOG_FILE="/var/log/lagaao/health-check.log"
MAX_FAILURES=3
STATE_FILE="/tmp/lagaao-health-failures"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# Read failure count
failures=0
[[ -f "$STATE_FILE" ]] && failures=$(cat "$STATE_FILE")

HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
  if [[ $failures -gt 0 ]]; then
    log "✓ Health check recovered (was $failures consecutive failures)"
  fi
  echo "0" > "$STATE_FILE"
else
  failures=$((failures + 1))
  echo "$failures" > "$STATE_FILE"
  log "✗ Health check failed (HTTP $HTTP_STATUS) — failure $failures of $MAX_FAILURES"

  if [[ $failures -ge $MAX_FAILURES ]]; then
    log "→ Restarting lagaao-api after $failures failures..."
    pm2 restart lagaao-api
    echo "0" > "$STATE_FILE"
    log "→ Restarted. New status: $(pm2 jlist | python3 -c "import sys,json; p=[x for x in json.load(sys.stdin) if x['name']=='lagaao-api']; print(p[0]['pm2_env']['status'] if p else 'not found')" 2>/dev/null || echo 'unknown')"
  fi
fi
