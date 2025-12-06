#!/bin/bash
# =============================================================================
# Velvena Backup Script
# =============================================================================
# This script creates encrypted backups of the PostgreSQL database and uploads
# to Hetzner Object Storage or a remote backup location
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="velvena_backup_${TIMESTAMP}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Load environment variables
if [ -f "${PROJECT_DIR}/.env.production" ]; then
    source "${PROJECT_DIR}/.env.production"
else
    log_error ".env.production file not found"
    exit 1
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log_info "Starting backup process: ${BACKUP_NAME}"

# 1. Database backup
log_info "Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=custom \
    --compress=9 \
    > "${BACKUP_DIR}/${BACKUP_NAME}.dump"

if [ $? -eq 0 ]; then
    log_info "Database backup completed: ${BACKUP_NAME}.dump"
else
    log_error "Database backup failed"
    exit 1
fi

# 2. Backup uploads directory
log_info "Backing up uploads directory..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" \
    -C "${PROJECT_DIR}" \
    uploads/ 2>/dev/null || true

# 3. Backup configuration files
log_info "Backing up configuration files..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz" \
    -C "${PROJECT_DIR}" \
    .env.production \
    docker-compose.yml \
    nginx/ \
    2>/dev/null || true

# 4. Create a manifest file
cat > "${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt" << EOF
Backup Name: ${BACKUP_NAME}
Backup Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Database: ${POSTGRES_DB}
Database Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)
Uploads Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")
Config Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz" | cut -f1)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
EOF

log_info "Manifest created"

# 5. Encrypt backups (optional)
if [ ! -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    log_info "Encrypting backups..."

    for file in "${BACKUP_DIR}/${BACKUP_NAME}"*; do
        if [ -f "$file" ] && [ "${file##*.}" != "enc" ]; then
            openssl enc -aes-256-cbc \
                -salt \
                -in "$file" \
                -out "${file}.enc" \
                -k "${BACKUP_ENCRYPTION_KEY}"
            rm "$file"
            log_info "Encrypted: $(basename ${file})"
        fi
    done
fi

# 6. Upload to remote storage (Hetzner Object Storage or S3-compatible)
if [ ! -z "${HETZNER_ACCESS_KEY:-}" ] && [ ! -z "${HETZNER_SECRET_KEY:-}" ]; then
    log_info "Uploading backups to Hetzner Object Storage..."

    # Install s3cmd if not present
    if ! command -v s3cmd &> /dev/null; then
        log_warn "s3cmd not installed, skipping remote upload"
    else
        # Configure s3cmd
        cat > /tmp/s3cfg << EOF
[default]
access_key = ${HETZNER_ACCESS_KEY}
secret_key = ${HETZNER_SECRET_KEY}
host_base = ${HETZNER_ENDPOINT#https://}
host_bucket = %(bucket)s.${HETZNER_ENDPOINT#https://}
use_https = True
EOF

        # Upload files
        s3cmd -c /tmp/s3cfg put \
            "${BACKUP_DIR}/${BACKUP_NAME}"* \
            "s3://${HETZNER_BUCKET}/backups/" \
            --recursive

        rm /tmp/s3cfg
        log_info "Upload completed"
    fi
fi

# 7. Cleanup old backups (local)
log_info "Cleaning up old local backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "velvena_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
log_info "Cleanup completed"

# 8. Verify backup integrity
log_info "Verifying backup integrity..."
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.dump" ]; then
    pg_restore --list "${BACKUP_DIR}/${BACKUP_NAME}.dump" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_info "✅ Backup verification successful"
    else
        log_error "❌ Backup verification failed"
        exit 1
    fi
elif [ -f "${BACKUP_DIR}/${BACKUP_NAME}.dump.enc" ]; then
    log_info "Backup is encrypted, skipping verification"
fi

# Summary
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}"* 2>/dev/null | awk '{sum+=$1} END {print sum}')
log_info "=================================="
log_info "Backup completed successfully!"
log_info "Backup name: ${BACKUP_NAME}"
log_info "Location: ${BACKUP_DIR}"
log_info "Total size: ${TOTAL_SIZE:-N/A}"
log_info "=================================="

exit 0
