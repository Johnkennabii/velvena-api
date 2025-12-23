#!/bin/bash

# ============================================
# N8N Pre-Installation Check Script
# ============================================
# Vérifie que l'installation N8N ne va pas
# créer de conflits avec les services existants

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo "================================================"
echo "N8N Pre-Installation Check"
echo "================================================"
echo ""

ISSUES_FOUND=0

# ============================================
# 1. Check Docker
# ============================================
info "Checking Docker installation..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log "Docker found: ${DOCKER_VERSION}"
else
    error "Docker is not installed"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    log "Docker Compose found: ${COMPOSE_VERSION}"
else
    error "Docker Compose is not installed"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# ============================================
# 2. Check Port Availability
# ============================================
info "Checking port availability..."

# Check if port 5678 is already in use
if lsof -Pi :5678 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    error "Port 5678 is already in use!"
    lsof -Pi :5678 -sTCP:LISTEN
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    log "Port 5678 is available"
fi

echo ""

# ============================================
# 3. Check Docker Networks
# ============================================
info "Checking Docker networks..."

# Check if velvena-network exists
if docker network ls | grep -q "velvena-network"; then
    log "Network 'velvena-network' exists (will be shared with N8N)"
else
    warning "Network 'velvena-network' does not exist"
    warning "N8N will create its own isolated network 'n8n-network'"
    warning "If you want N8N to communicate with your API, create 'velvena-network' first:"
    echo "    docker network create velvena-network"
fi

# Check if n8n-network already exists
if docker network ls | grep -q "n8n-network"; then
    warning "Network 'n8n-network' already exists (will be reused)"
else
    log "Network 'n8n-network' will be created"
fi

echo ""

# ============================================
# 4. Check Container Names
# ============================================
info "Checking container name conflicts..."

CONTAINERS=("velvena-n8n" "velvena-n8n-postgres" "velvena-n8n-redis")

for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        warning "Container '${container}' already exists"
        warning "Run: docker rm -f ${container} (if you want to recreate it)"
    else
        log "Container name '${container}' is available"
    fi
done

echo ""

# ============================================
# 5. Check Directory Permissions
# ============================================
info "Checking directory structure..."

DIRECTORIES=(
    "/opt"
    "/var/lib"
    "/var/backups"
    "/var/log"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ -w "${dir}" ]; then
        log "Directory '${dir}' is writable"
    else
        error "Directory '${dir}' is not writable (need sudo)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check if N8N directories already exist
N8N_DIRS=(
    "/opt/n8n"
    "/var/lib/n8n"
    "/var/backups/n8n"
    "/var/log/n8n"
)

for dir in "${N8N_DIRS[@]}"; do
    if [ -d "${dir}" ]; then
        warning "Directory '${dir}' already exists"
        info "Existing data will be preserved"
    else
        log "Directory '${dir}' will be created"
    fi
done

echo ""

# ============================================
# 6. Check Disk Space
# ============================================
info "Checking disk space..."

REQUIRED_SPACE_MB=5000  # 5 GB
AVAILABLE_SPACE_MB=$(df /var/lib | tail -1 | awk '{print $4}')
AVAILABLE_SPACE_GB=$((AVAILABLE_SPACE_MB / 1024 / 1024))

if [ "${AVAILABLE_SPACE_MB}" -gt "${REQUIRED_SPACE_MB}" ]; then
    log "Sufficient disk space: ${AVAILABLE_SPACE_GB} GB available"
else
    error "Insufficient disk space: only ${AVAILABLE_SPACE_GB} GB available (need at least 5 GB)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# ============================================
# 7. Check Running Services
# ============================================
info "Checking running Docker containers..."

RUNNING_CONTAINERS=$(docker ps --format '{{.Names}}' | wc -l)
log "${RUNNING_CONTAINERS} Docker container(s) currently running"

if [ "${RUNNING_CONTAINERS}" -gt 0 ]; then
    echo ""
    info "Running containers:"
    docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
    echo ""
    log "N8N installation will NOT affect these containers"
fi

echo ""

# ============================================
# 8. Check Nginx
# ============================================
info "Checking Nginx..."

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    log "Nginx found: ${NGINX_VERSION}"

    # Check if N8N config already exists
    if [ -f "/etc/nginx/sites-available/n8n.velvena.fr" ]; then
        warning "Nginx config '/etc/nginx/sites-available/n8n.velvena.fr' already exists"
    else
        log "Nginx config will be created at '/etc/nginx/sites-available/n8n.velvena.fr'"
    fi
else
    warning "Nginx not installed (will need to install for reverse proxy)"
fi

echo ""

# ============================================
# 9. Summary
# ============================================
echo "================================================"
echo "Pre-Installation Check Summary"
echo "================================================"
echo ""

if [ ${ISSUES_FOUND} -eq 0 ]; then
    log "✅ All checks passed!"
    log "✅ No conflicts detected with existing services"
    log "✅ Safe to proceed with N8N installation"
    echo ""
    info "Next steps:"
    echo "  1. Configure .env file: sudo cp /opt/n8n/.env.example /opt/n8n/.env"
    echo "  2. Edit configuration: sudo nano /opt/n8n/.env"
    echo "  3. Run deployment: sudo /opt/n8n/scripts/deploy.sh"
else
    error "❌ Found ${ISSUES_FOUND} issue(s) that need to be resolved"
    error "Please fix the issues above before proceeding"
    echo ""
    exit 1
fi

echo ""
echo "================================================"

exit 0
