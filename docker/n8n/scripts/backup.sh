#!/bin/bash

# ============================================
# N8N Backup Script
# ============================================

set -e

# Configuration
BACKUP_DIR="/var/backups/n8n"
POSTGRES_BACKUP_DIR="${BACKUP_DIR}/postgres"
N8N_DATA_DIR="/var/lib/n8n/data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

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
# Create backup directories
# ============================================
mkdir -p "${POSTGRES_BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/data"

log "Starting N8N backup..."

# ============================================
# 1. Backup PostgreSQL Database
# ============================================
log "Backing up PostgreSQL database..."

docker exec velvena-n8n-postgres pg_dump \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    -F c \
    -b \
    -v \
    -f /backups/n8n_${TIMESTAMP}.backup

if [ $? -eq 0 ]; then
    log "✅ PostgreSQL backup completed: n8n_${TIMESTAMP}.backup"
else
    error "❌ PostgreSQL backup failed!"
    exit 1
fi

# ============================================
# 2. Backup N8N Data Directory
# ============================================
log "Backing up N8N data directory..."

tar -czf "${BACKUP_DIR}/data/n8n_data_${TIMESTAMP}.tar.gz" \
    -C "${N8N_DATA_DIR}" \
    .

if [ $? -eq 0 ]; then
    log "✅ N8N data backup completed: n8n_data_${TIMESTAMP}.tar.gz"
else
    error "❌ N8N data backup failed!"
    exit 1
fi

# ============================================
# 3. Backup to S3 (Optional)
# ============================================
if [ ! -z "${BACKUP_S3_BUCKET}" ]; then
    log "Uploading backups to S3..."

    aws s3 cp "${POSTGRES_BACKUP_DIR}/n8n_${TIMESTAMP}.backup" \
        "s3://${BACKUP_S3_BUCKET}/postgres/" \
        --region ${BACKUP_S3_REGION}

    aws s3 cp "${BACKUP_DIR}/data/n8n_data_${TIMESTAMP}.tar.gz" \
        "s3://${BACKUP_S3_BUCKET}/data/" \
        --region ${BACKUP_S3_REGION}

    log "✅ Backups uploaded to S3"
fi

# ============================================
# 4. Cleanup old backups
# ============================================
log "Cleaning up backups older than ${RETENTION_DAYS} days..."

find "${POSTGRES_BACKUP_DIR}" -name "*.backup" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/data" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

log "✅ Old backups cleaned up"

# ============================================
# 5. Generate backup report
# ============================================
TOTAL_SIZE=$(du -sh ${BACKUP_DIR} | cut -f1)

log "================================================"
log "Backup Summary"
log "================================================"
log "Timestamp: ${TIMESTAMP}"
log "PostgreSQL Backup: n8n_${TIMESTAMP}.backup"
log "Data Backup: n8n_data_${TIMESTAMP}.tar.gz"
log "Total Size: ${TOTAL_SIZE}"
log "Retention: ${RETENTION_DAYS} days"
log "================================================"
log "✅ N8N backup completed successfully!"

# ============================================
# 6. Send notification (Optional)
# ============================================
if [ ! -z "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✅ N8N Backup completed successfully\n- Timestamp: ${TIMESTAMP}\n- Total Size: ${TOTAL_SIZE}\"}"
fi

exit 0
