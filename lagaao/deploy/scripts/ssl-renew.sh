#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SSL Certificate Renewal Script
# Certbot installs its own timer, but use this for manual renewal or cron backup
# Schedule: 0 3 1 * * /var/www/lagaao/deploy/scripts/ssl-renew.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Checking SSL certificate renewal..."
certbot renew --quiet --nginx --deploy-hook "systemctl reload nginx"

EXPIRY=$(certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3, $4}')
log "Certificate expiry: $EXPIRY"
