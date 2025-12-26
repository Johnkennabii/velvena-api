#!/bin/bash
# =============================================================================
# Velvena Docker Backup Script
# =============================================================================
# This script creates encrypted backups of the PostgreSQL database from
# within the Docker cron container and uploads to Hetzner Object Storage
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
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

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

log_info "Starting backup process: ${BACKUP_NAME}"

# 1. Database backup using pg_dump from cron container to postgres container
log_info "Backing up PostgreSQL database..."

# Use PGPASSWORD environment variable for authentication
export PGPASSWORD="${POSTGRES_PASSWORD}"

pg_dump \
    -h postgres \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=custom \
    --compress=9 \
    > "${BACKUP_DIR}/${BACKUP_NAME}.dump"

# Clear password from environment
unset PGPASSWORD

if [ $? -eq 0 ]; then
    log_info "Database backup completed: ${BACKUP_NAME}.dump"
else
    log_error "Database backup failed"
    exit 1
fi

# 2. Create a manifest file
cat > "${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt" << EOF
Backup Name: ${BACKUP_NAME}
Backup Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Database: ${POSTGRES_DB}
Database Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)
Hostname: $(hostname)
Container: velvena-cron
EOF

log_info "Manifest created"

# 3. Encrypt backups (if encryption key is provided)
if [ ! -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    log_info "Encrypting backups..."

    for file in "${BACKUP_DIR}/${BACKUP_NAME}"*; do
        if [ -f "$file" ] && [ "${file##*.}" != "enc" ]; then
            openssl enc -aes-256-cbc \
                -salt \
                -in "$file" \
                -out "${file}.enc" \
                -k "${BACKUP_ENCRYPTION_KEY}"

            if [ $? -eq 0 ]; then
                rm "$file"
                log_info "Encrypted: $(basename ${file})"
            else
                log_error "Encryption failed for: $(basename ${file})"
            fi
        fi
    done
else
    log_warn "No encryption key provided, backups will not be encrypted"
fi

# 4. Upload to Hetzner Object Storage (if credentials are provided)
if [ ! -z "${HETZNER_ACCESS_KEY:-}" ] && [ ! -z "${HETZNER_SECRET_KEY:-}" ]; then
    log_info "Uploading backups to Hetzner Object Storage..."

    # Install s3cmd if not present
    if ! command -v s3cmd &> /dev/null; then
        log_warn "s3cmd not installed, installing..."
        apk add --no-cache s3cmd
    fi

    # Configure s3cmd
    cat > /tmp/s3cfg << EOF
[default]
access_key = ${HETZNER_ACCESS_KEY}
secret_key = ${HETZNER_SECRET_KEY}
host_base = ${HETZNER_ENDPOINT#https://}
host_bucket = %(bucket)s.${HETZNER_ENDPOINT#https://}
use_https = True
EOF

    # Upload files to backups/ folder in the bucket
    for file in "${BACKUP_DIR}/${BACKUP_NAME}"*; do
        if [ -f "$file" ]; then
            s3cmd -c /tmp/s3cfg put \
                "$file" \
                "s3://${HETZNER_BUCKET}/backups/$(basename $file)"

            if [ $? -eq 0 ]; then
                log_info "Uploaded: $(basename $file)"
            else
                log_error "Upload failed for: $(basename $file)"
            fi
        fi
    done

    rm /tmp/s3cfg
    log_info "Upload completed"
else
    log_warn "Hetzner credentials not provided, skipping remote upload"
fi

# 5. Cleanup old local backups (older than retention days)
log_info "Cleaning up old local backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "velvena_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
log_info "Cleanup completed"

# 6. Verify backup integrity (if not encrypted)
log_info "Verifying backup integrity..."
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.dump" ]; then
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    pg_restore --list "${BACKUP_DIR}/${BACKUP_NAME}.dump" > /dev/null 2>&1
    unset PGPASSWORD

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
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}"* 2>/dev/null | awk '{total+=$1} END {print total "K"}')
log_info "=================================="
log_info "Backup completed successfully!"
log_info "Backup name: ${BACKUP_NAME}"
log_info "Location: ${BACKUP_DIR}"
log_info "Total size: ${TOTAL_SIZE}"
log_info "Encrypted: ${BACKUP_ENCRYPTION_KEY:+Yes}"
log_info "Uploaded to S3: ${HETZNER_ACCESS_KEY:+Yes}"
log_info "=================================="

exit 0
