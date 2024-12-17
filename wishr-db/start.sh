#!/bin/bash
docker-entrypoint.sh postgres &

# Move variables where cron can see them
env >> /etc/environment
cron


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

is_db_initialized() {
    export PGPASSWORD=$DB_PASSWORD
    TABLE_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
    if [ "$TABLE_COUNT" -gt 0 ]; then
        return 0 # Database is initialized
    else
        return 1 # Database is not initialized
    fi
}

restore_backup() {
    if [ -f "$LATEST_BACKUP" ]; then
        echo "Restoring database from backup: $LATEST_BACKUP"
        export PGPASSWORD=$DB_PASSWORD
        pg_restore --verbose --clean --no-owner -U "$DB_USER" -d "$DB_NAME" "$LATEST_BACKUP"
        echo "Backup restored successfully."
    else
        echo "No backup found. Checking for database initialization..."
        if is_db_initialized; then
            echo "Database is already initialized. Skipping init.sql."
        else
            echo "Database not initialized. Falling back to init.sql..."
            psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/init.sql
            echo "init.sql executed successfully."
        fi
    fi
}

wait_for_postgres
restore_backup

tail -f /dev/null