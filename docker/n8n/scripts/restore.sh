#!/bin/bash

# ============================================
# N8N Restore Script
# ============================================

set -e

# Configuration
BACKUP_DIR="/var/backups/n8n"
POSTGRES_BACKUP_DIR="${BACKUP_DIR}/postgres"
N8N_DATA_DIR="/var/lib/n8n/data"

# Load environment variables
source /opt/n8n/.env

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# ============================================
# Usage
# ============================================
usage() {
    echo "Usage: $0 <backup_timestamp>"
    echo "Example: $0 20231223_140530"
    echo ""
    echo "Available backups:"
    ls -lh "${POSTGRES_BACKUP_DIR}" | grep ".backup$"
    exit 1
}

if [ -z "$1" ]; then
    usage
fi

TIMESTAMP=$1

# ============================================
# Verify backup files exist
# ============================================
POSTGRES_BACKUP="${POSTGRES_BACKUP_DIR}/n8n_${TIMESTAMP}.backup"
DATA_BACKUP="${BACKUP_DIR}/data/n8n_data_${TIMESTAMP}.tar.gz"

if [ ! -f "${POSTGRES_BACKUP}" ]; then
    error "PostgreSQL backup not found: ${POSTGRES_BACKUP}"
    exit 1
fi

if [ ! -f "${DATA_BACKUP}" ]; then
    error "N8N data backup not found: ${DATA_BACKUP}"
    exit 1
fi

log "Found backups:"
log "  - PostgreSQL: ${POSTGRES_BACKUP}"
log "  - N8N Data: ${DATA_BACKUP}"

# ============================================
# Confirmation
# ============================================
warning "⚠️  This will OVERWRITE current N8N data!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

# ============================================
# Stop N8N
# ============================================
log "Stopping N8N container..."
docker-compose -f /opt/n8n/docker-compose.yml stop n8n

# ============================================
# Restore PostgreSQL Database
# ============================================
log "Restoring PostgreSQL database..."

# Drop existing database
docker exec velvena-n8n-postgres psql -U ${POSTGRES_USER} -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
docker exec velvena-n8n-postgres psql -U ${POSTGRES_USER} -c "CREATE DATABASE ${POSTGRES_DB};"

# Restore from backup
docker exec velvena-n8n-postgres pg_restore \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    -v \
    /backups/n8n_${TIMESTAMP}.backup

if [ $? -eq 0 ]; then
    log "✅ PostgreSQL database restored"
else
    error "❌ PostgreSQL restore failed!"
    exit 1
fi

# ============================================
# Restore N8N Data Directory
# ============================================
log "Restoring N8N data directory..."

# Backup current data (just in case)
CURRENT_BACKUP="/tmp/n8n_data_before_restore_$(date +%s).tar.gz"
tar -czf "${CURRENT_BACKUP}" -C "${N8N_DATA_DIR}" .
log "Current data backed up to: ${CURRENT_BACKUP}"

# Remove current data
rm -rf "${N8N_DATA_DIR}"/*

# Extract backup
tar -xzf "${DATA_BACKUP}" -C "${N8N_DATA_DIR}"

if [ $? -eq 0 ]; then
    log "✅ N8N data directory restored"
else
    error "❌ N8N data restore failed!"
    exit 1
fi

# ============================================
# Restart N8N
# ============================================
log "Starting N8N container..."
docker-compose -f /opt/n8n/docker-compose.yml up -d n8n

# Wait for N8N to be ready
log "Waiting for N8N to be ready..."
sleep 10

# Check health
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' velvena-n8n 2>/dev/null || echo "unknown")

if [ "${HEALTH}" = "healthy" ]; then
    log "✅ N8N is healthy and running"
else
    warning "⚠️  N8N health status: ${HEALTH}"
    log "Check logs with: docker logs velvena-n8n"
fi

log "================================================"
log "Restore Summary"
log "================================================"
log "Restored from: ${TIMESTAMP}"
log "PostgreSQL: ✅"
log "N8N Data: ✅"
log "================================================"
log "✅ N8N restore completed successfully!"

exit 0
