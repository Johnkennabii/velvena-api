#!/bin/bash
# =============================================================================
# SSL Certificate Setup with Let's Encrypt
# =============================================================================
# This script obtains SSL certificates from Let's Encrypt for your domain
# =============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
DOMAIN="${SSL_DOMAIN:-api.velvena.fr}"
EMAIL="${SSL_EMAIL:-contact@velvena.fr}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log_info "SSL Certificate Setup for ${DOMAIN}"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    log_error "Docker is not running"
    exit 1
fi

# Start nginx first (without SSL, just for ACME challenge)
log_info "Starting Nginx for ACME challenge..."
cd "${PROJECT_DIR}"

# Create temporary nginx config for ACME challenge only
mkdir -p "${PROJECT_DIR}/nginx/conf.d-initial"
cat > "${PROJECT_DIR}/nginx/conf.d-initial/acme.conf" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "ACME challenge server ready\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Start nginx temporarily
docker-compose up -d nginx

# Wait for nginx to be ready
sleep 5

# Request certificate
log_info "Requesting SSL certificate from Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN}

if [ $? -eq 0 ]; then
    log_info "✅ SSL certificate obtained successfully!"

    # Now restart nginx with full SSL configuration
    log_info "Restarting Nginx with SSL configuration..."
    docker-compose down nginx
    rm -rf "${PROJECT_DIR}/nginx/conf.d-initial"
    docker-compose up -d nginx

    log_info "=================================="
    log_info "SSL setup completed!"
    log_info "Certificate location: /etc/letsencrypt/live/${DOMAIN}/"
    log_info "Auto-renewal is configured"
    log_info "=================================="
else
    log_error "Failed to obtain SSL certificate"
    log_error "Make sure:"
    log_error "1. DNS A record for ${DOMAIN} points to this server"
    log_error "2. Port 80 is accessible from the internet"
    log_error "3. Domain is correctly configured in nginx config"
    exit 1
fi

exit 0
