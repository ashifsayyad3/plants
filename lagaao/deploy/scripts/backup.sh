#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Lagaao — Database & Uploads Backup Script
# Schedule via cron:
#   0 2 * * * /var/www/lagaao/deploy/scripts/backup.sh >> /var/log/lagaao/backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DB_NAME="lagaao_prod"
DB_USER="lagaao_user"
DB_PASS="YOUR_DB_PASSWORD"         # or read from .env: $(grep DB_PASS /var/www/lagaao/backend/.env | cut -d= -f2)
BACKUP_DIR="/var/backups/lagaao"
UPLOADS_DIR="/var/www/lagaao/backend/uploads"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ─── Database dump ────────────────────────────────────────────────────────────
log "Dumping database $DB_NAME..."
DUMP_FILE="$BACKUP_DIR/db/lagaao_${DATE}.sql.gz"
mysqldump \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --host=127.0.0.1 \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-database \
  --databases "$DB_NAME" \
  | gzip -9 > "$DUMP_FILE"
chmod 600 "$DUMP_FILE"
log "Database backup: $DUMP_FILE ($(du -sh "$DUMP_FILE" | cut -f1))"

# ─── Uploads archive ──────────────────────────────────────────────────────────
log "Archiving uploads directory..."
UPLOADS_FILE="$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz"
tar -czf "$UPLOADS_FILE" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
chmod 600 "$UPLOADS_FILE"
log "Uploads backup: $UPLOADS_FILE ($(du -sh "$UPLOADS_FILE" | cut -f1))"

# ─── Prune old backups ────────────────────────────────────────────────────────
log "Pruning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR/db"      -name "*.sql.gz"  -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/uploads" -name "*.tar.gz"  -mtime +$RETENTION_DAYS -delete

log "Backup complete."

# ─── Optional: copy to remote (rsync / rclone / S3) ──────────────────────────
# Uncomment and configure one of:
#
# rsync -az "$BACKUP_DIR/" user@remote-server:/backups/lagaao/
#
# rclone copy "$BACKUP_DIR/" remote:lagaao-backups/ --transfers=4
