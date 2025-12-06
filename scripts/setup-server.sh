#!/bin/bash
# =============================================================================
# Velvena Server Setup Script for Hetzner
# =============================================================================
# This script sets up a fresh Hetzner server for deploying Velvena
# Run this script as root on your Hetzner server
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root"
    exit 1
fi

log_info "Starting Velvena server setup..."
log_info "Server: $(hostname)"
log_info "OS: $(lsb_release -ds 2>/dev/null || cat /etc/*release | grep PRETTY_NAME | cut -d'"' -f2)"

# ============================================================================
# Step 1: System Update
# ============================================================================
log_step "1/10 Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    htop \
    vim \
    ufw \
    fail2ban \
    unattended-upgrades \
    s3cmd

# ============================================================================
# Step 2: Install Docker
# ============================================================================
log_step "2/10 Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    log_info "Docker installed: $(docker --version)"
else
    log_info "Docker already installed: $(docker --version)"
fi

# ============================================================================
# Step 3: Install Docker Compose (standalone)
# ============================================================================
log_step "3/10 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION="v2.24.5"
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose installed: $(docker-compose --version)"
else
    log_info "Docker Compose already installed: $(docker-compose --version)"
fi

# ============================================================================
# Step 4: Configure Firewall (UFW)
# ============================================================================
log_step "4/10 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log_info "Firewall configured"

# ============================================================================
# Step 5: Configure Fail2Ban
# ============================================================================
log_step "5/10 Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF

systemctl restart fail2ban
systemctl enable fail2ban
log_info "Fail2Ban configured"

# ============================================================================
# Step 6: Create Application User
# ============================================================================
log_step "6/10 Creating application user..."
if ! id "velvena" &>/dev/null; then
    useradd -m -s /bin/bash velvena
    usermod -aG docker velvena
    log_info "User 'velvena' created"
else
    log_info "User 'velvena' already exists"
fi

# ============================================================================
# Step 7: Create Application Directory
# ============================================================================
log_step "7/10 Creating application directory..."
mkdir -p /opt/velvena
mkdir -p /opt/velvena/backups
mkdir -p /opt/velvena/logs
chown -R velvena:velvena /opt/velvena
log_info "Application directory created: /opt/velvena"

# ============================================================================
# Step 8: Configure Automatic Security Updates
# ============================================================================
log_step "8/10 Configuring automatic security updates..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "root";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

log_info "Automatic security updates configured"

# ============================================================================
# Step 9: Setup Swap (if not present)
# ============================================================================
log_step "9/10 Configuring swap..."
if [ ! -f /swapfile ]; then
    # Create 2GB swap
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # Adjust swappiness
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf

    log_info "Swap configured (2GB)"
else
    log_info "Swap already configured"
fi

# ============================================================================
# Step 10: Setup Cron Jobs
# ============================================================================
log_step "10/10 Setting up cron jobs..."
cat > /etc/cron.d/velvena << EOF
# Velvena automated tasks

# Daily backup at 2 AM
0 2 * * * velvena cd /opt/velvena && /opt/velvena/scripts/backup.sh >> /opt/velvena/logs/backup.log 2>&1

# Weekly cleanup at 3 AM on Sunday
0 3 * * 0 velvena docker system prune -af >> /opt/velvena/logs/cleanup.log 2>&1

# Daily log rotation at 4 AM
0 4 * * * velvena find /opt/velvena/logs -name "*.log" -size +100M -delete

EOF

log_info "Cron jobs configured"

# ============================================================================
# Summary
# ============================================================================
log_info "=================================="
log_info "✅ Server setup completed!"
log_info "=================================="
log_info ""
log_info "Next steps:"
log_info "1. Switch to velvena user: sudo su - velvena"
log_info "2. Clone repository: cd /opt/velvena && git clone https://github.com/Johnkennabii/velvena-api.git ."
log_info "3. Create .env.production file with your configuration"
log_info "4. Generate SSL certificate: ./scripts/setup-ssl.sh"
log_info "5. Deploy application: docker-compose up -d"
log_info ""
log_info "Security reminders:"
log_info "- Change SSH port if desired"
log_info "- Set up SSH key authentication and disable password auth"
log_info "- Configure your domain DNS to point to this server"
log_info "- Review and customize firewall rules"
log_info ""
log_info "Server IP: $(hostname -I | awk '{print $1}')"
log_info "=================================="

exit 0
