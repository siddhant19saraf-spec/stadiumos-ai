#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# StadiumOS AI — Database Backup & Rotation
# ═══════════════════════════════════════════════════════

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-stadiumos}"
DB_PASSWORD="${DB_PASSWORD:-stadiumos}"
DB_NAME="${DB_NAME:-stadiumos}"
TIMESTAMP=$(date -u '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/stadiumos_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup: $DB_NAME@$DB_HOST:$DB_PORT"
echo "Output: $BACKUP_FILE"

PGPASSWORD="$DB_PASSWORD" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --verbose \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup complete: $BACKUP_SIZE"

# Rotate old backups
echo "Rotating backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "stadiumos_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "Rotation complete"

echo "Backup stored at: $BACKUP_FILE"
