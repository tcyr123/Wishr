#!/bin/bash

# Paths
BACKUP_DIR="/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql 2>/dev/null | head -n 1)
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}

echo "Starting PostgreSQL container with backup and restore functionality..."

wait_for_postgres() {
    until pg_isready -U "$DB_USER" -d "$DB_NAME"; do
        echo "Waiting for PostgreSQL to start..."
        sleep 2
    done
}

wait_for_postgres

# Backup job (every 18hrs, keep only latest 6 backups = last 48hrs)
echo "Setting backup..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "Creating backup: $BACKUP_FILE"
export PGPASSWORD=$DB_PASSWORD

# Run pg_dump in the background to avoid blocking
pg_dump -U "$DB_USER" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME" &

PG_DUMP_PID=$!

# Wait for pg_dump to finish without blocking the script for too long
wait $PG_DUMP_PID

# Backup is completed, proceed to clean up old backups
echo "Cleaning up old backups..."
ls -t $BACKUP_DIR/*.sql | tail -n +7 | xargs -r rm --verbose

echo "Backup completed successfully."
