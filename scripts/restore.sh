#!/bin/bash
# =============================================================================
# Velvena Restore Script
# =============================================================================
# This script restores a PostgreSQL database from a backup
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_question() {
    echo -e "${BLUE}[?]${NC} $1"
}

# Load environment variables
if [ -f "${PROJECT_DIR}/.env.production" ]; then
    source "${PROJECT_DIR}/.env.production"
else
    log_error ".env.production file not found"
    exit 1
fi

# Function to list available backups
list_backups() {
    log_info "Available backups:"
    echo ""
    ls -lh "${BACKUP_DIR}"/velvena_backup_*.dump 2>/dev/null | \
        awk '{print $9, "(" $5 ")"}' | \
        nl -v 1 || echo "No backups found"
    echo ""
}

# Function to decrypt backup if needed
decrypt_backup() {
    local encrypted_file=$1
    local decrypted_file="${encrypted_file%.enc}"

    if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        log_error "BACKUP_ENCRYPTION_KEY not set in .env.production"
        exit 1
    fi

    log_info "Decrypting backup..."
    openssl enc -aes-256-cbc -d \
        -in "$encrypted_file" \
        -out "$decrypted_file" \
        -k "${BACKUP_ENCRYPTION_KEY}"

    echo "$decrypted_file"
}

# Main script
log_warn "⚠️  WARNING: This will REPLACE the current database!"
log_warn "⚠️  Make sure you have a backup of the current state!"
echo ""

# List available backups
list_backups

# Prompt for backup selection
log_question "Enter the full path to the backup file to restore:"
read -r BACKUP_FILE

# Validate backup file
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if encrypted
CLEANUP_TEMP=false
if [[ "$BACKUP_FILE" == *.enc ]]; then
    BACKUP_FILE=$(decrypt_backup "$BACKUP_FILE")
    CLEANUP_TEMP=true
fi

# Final confirmation
log_warn "You are about to restore from: $(basename $BACKUP_FILE)"
log_question "Type 'yes' to continue:"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled"
    [ "$CLEANUP_TEMP" = true ] && rm -f "$BACKUP_FILE"
    exit 0
fi

# Stop API temporarily
log_info "Stopping API service..."
docker-compose stop api

# Drop existing connections
log_info "Dropping existing database connections..."
docker-compose exec -T postgres psql -U "${POSTGRES_USER}" -d postgres << EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
EOF

# Drop and recreate database
log_info "Recreating database..."
docker-compose exec -T postgres psql -U "${POSTGRES_USER}" -d postgres << EOF
DROP DATABASE IF EXISTS ${POSTGRES_DB};
CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};
EOF

# Restore database
log_info "Restoring database from backup..."
docker-compose exec -T postgres pg_restore \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --verbose \
    --no-owner \
    --no-acl \
    < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log_info "✅ Database restore completed successfully"
else
    log_error "❌ Database restore failed"
    [ "$CLEANUP_TEMP" = true ] && rm -f "$BACKUP_FILE"
    exit 1
fi

# Run migrations to ensure schema is up to date
log_info "Running database migrations..."
docker-compose run --rm api npx prisma migrate deploy

# Restart API
log_info "Starting API service..."
docker-compose start api

# Wait for health check
log_info "Waiting for API to be healthy..."
timeout 60 bash -c 'until curl -f http://localhost:3000/health 2>/dev/null; do sleep 2; done' || {
    log_error "API failed to start properly"
    [ "$CLEANUP_TEMP" = true ] && rm -f "$BACKUP_FILE"
    exit 1
}

# Cleanup temporary decrypted file
[ "$CLEANUP_TEMP" = true ] && rm -f "$BACKUP_FILE"

log_info "=================================="
log_info "✅ Restore completed successfully!"
log_info "Database: ${POSTGRES_DB}"
log_info "Backup: $(basename $BACKUP_FILE)"
log_info "=================================="

exit 0
