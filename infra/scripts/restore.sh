#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# StadiumOS AI — Database Restore
# Usage: ./restore.sh <backup-file>
# ═══════════════════════════════════════════════════════

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/postgres/
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-stadiumos}"
DB_PASSWORD="${DB_PASSWORD:-stadiumos}"
DB_NAME="${DB_NAME:-stadiumos}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will overwrite the database: $DB_NAME@$DB_HOST:$DB_PORT"
read -p "Are you sure? (y/N) " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Starting restore from: $BACKUP_FILE"

# Terminate existing connections
PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    -c "SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
          AND pid <> pg_backend_pid();" 2>/dev/null || true

# Drop and recreate
PGPASSWORD="$DB_PASSWORD" dropdb \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --if-exists \
    "$DB_NAME"

PGPASSWORD="$DB_PASSWORD" createdb \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    "$DB_NAME"

# Restore from backup
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" pg_restore \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --no-owner \
    --no-privileges \
    --verbose

echo "Restore complete from: $BACKUP_FILE"
