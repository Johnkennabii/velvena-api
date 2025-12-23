#!/bin/bash

# ============================================
# N8N Deployment Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# ============================================
# Configuration
# ============================================
INSTALL_DIR="/opt/n8n"
DATA_DIR="/var/lib/n8n"
BACKUP_DIR="/var/backups/n8n"
LOG_DIR="/var/log/n8n"

log "================================================"
log "N8N Professional Deployment"
log "================================================"

# ============================================
# 1. Prerequisites Check
# ============================================
log "Checking prerequisites..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (sudo)"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log "✅ Prerequisites check passed"

# ============================================
# 2. Create Directories
# ============================================
log "Creating directories..."

mkdir -p "${INSTALL_DIR}"
mkdir -p "${DATA_DIR}/data"
mkdir -p "${DATA_DIR}/files"
mkdir -p "${DATA_DIR}/postgres"
mkdir -p "${BACKUP_DIR}/postgres"
mkdir -p "${LOG_DIR}"

# Set permissions
chown -R 1000:1000 "${DATA_DIR}"
chmod -R 755 "${DATA_DIR}"

log "✅ Directories created"

# ============================================
# 3. Copy Files
# ============================================
log "Copying configuration files..."

# Copy docker-compose.yml
cp docker-compose.yml "${INSTALL_DIR}/"

# Copy environment file
if [ ! -f "${INSTALL_DIR}/.env" ]; then
    cp .env.example "${INSTALL_DIR}/.env"
    warning "⚠️  Please edit ${INSTALL_DIR}/.env with your configuration"
    warning "⚠️  Generate encryption key with: openssl rand -base64 32"
else
    info ".env file already exists, skipping..."
fi

# Copy init scripts
cp -r init-scripts "${INSTALL_DIR}/"

# Copy backup/restore scripts
cp scripts/backup.sh "${INSTALL_DIR}/"
cp scripts/restore.sh "${INSTALL_DIR}/"
chmod +x "${INSTALL_DIR}"/*.sh

log "✅ Files copied"

# ============================================
# 4. Setup Cron Jobs
# ============================================
log "Setting up cron jobs..."

# Backup cron job (daily at 2 AM)
CRON_JOB="0 2 * * * ${INSTALL_DIR}/backup.sh >> ${LOG_DIR}/backup.log 2>&1"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "${INSTALL_DIR}/backup.sh"; then
    (crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -
    log "✅ Backup cron job added"
else
    info "Backup cron job already exists"
fi

# ============================================
# 5. Setup Log Rotation
# ============================================
log "Setting up log rotation..."

cat > /etc/logrotate.d/n8n <<EOF
${LOG_DIR}/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker exec velvena-n8n kill -USR1 1
    endscript
}
EOF

log "✅ Log rotation configured"

# ============================================
# 6. Setup Firewall (UFW)
# ============================================
if command -v ufw &> /dev/null; then
    log "Configuring firewall..."

    # Allow N8N port (if not using reverse proxy)
    # ufw allow 5678/tcp comment 'N8N'

    log "✅ Firewall configured"
fi

# ============================================
# 7. Pull Docker Images
# ============================================
log "Pulling Docker images..."

cd "${INSTALL_DIR}"
docker-compose pull

log "✅ Docker images pulled"

# ============================================
# 8. Start Services
# ============================================
log "Starting N8N services..."

docker-compose up -d

log "Waiting for services to be ready..."
sleep 20

# Check services status
docker-compose ps

# Check N8N health
log "Checking N8N health..."

for i in {1..30}; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' velvena-n8n 2>/dev/null || echo "starting")
    if [ "${HEALTH}" = "healthy" ]; then
        log "✅ N8N is healthy and running"
        break
    fi
    sleep 2
done

if [ "${HEALTH}" != "healthy" ]; then
    warning "⚠️  N8N health check timeout. Status: ${HEALTH}"
    warning "Check logs with: docker logs velvena-n8n"
fi

# ============================================
# 9. Display Information
# ============================================
log "================================================"
log "N8N Deployment Completed!"
log "================================================"
log ""
log "📁 Installation directory: ${INSTALL_DIR}"
log "📁 Data directory: ${DATA_DIR}"
log "📁 Backup directory: ${BACKUP_DIR}"
log "📁 Log directory: ${LOG_DIR}"
log ""
log "🔧 Configuration file: ${INSTALL_DIR}/.env"
log "📝 Docker Compose: ${INSTALL_DIR}/docker-compose.yml"
log ""
log "🌐 Access N8N at: https://your-domain.com"
log ""
log "📚 Useful commands:"
log "  - View logs: docker logs -f velvena-n8n"
log "  - Restart: docker-compose -f ${INSTALL_DIR}/docker-compose.yml restart"
log "  - Stop: docker-compose -f ${INSTALL_DIR}/docker-compose.yml stop"
log "  - Backup: ${INSTALL_DIR}/backup.sh"
log "  - Restore: ${INSTALL_DIR}/restore.sh <timestamp>"
log ""
log "⚠️  IMPORTANT NEXT STEPS:"
log "  1. Edit ${INSTALL_DIR}/.env with your configuration"
log "  2. Generate encryption key: openssl rand -base64 32"
log "  3. Configure your reverse proxy (Nginx/Traefik)"
log "  4. Setup SSL certificate (Let's Encrypt)"
log "  5. Test backup script: ${INSTALL_DIR}/backup.sh"
log ""
log "================================================"

exit 0
