#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Lagaao — VPS Initial Setup Script
# Run once as root on a fresh Ubuntu 22.04 LTS server
# Usage: bash setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/var/www/lagaao"
LOG_DIR="/var/log/lagaao"
NODE_VERSION="20"
DOMAIN="lagaao.com"

echo "═══════════════════════════════════════════════════"
echo " Lagaao VPS Setup"
echo "═══════════════════════════════════════════════════"

# ─── 1. System update ─────────────────────────────────────────────────────────
echo "[1/12] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip ufw fail2ban \
  build-essential software-properties-common \
  logrotate certbot python3-certbot-nginx

# ─── 2. Create deploy user ────────────────────────────────────────────────────
echo "[2/12] Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  mkdir -p /home/$DEPLOY_USER/.ssh
  # Copy authorized_keys from root (paste your SSH public key here)
  # echo "YOUR_SSH_PUBLIC_KEY" >> /home/$DEPLOY_USER/.ssh/authorized_keys
  chmod 700 /home/$DEPLOY_USER/.ssh
  chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
  chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
fi

# ─── 3. Install Node.js via NVM (system-wide) ─────────────────────────────────
echo "[3/12] Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
node -v && npm -v

# ─── 4. Install PM2 ───────────────────────────────────────────────────────────
echo "[4/12] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER
systemctl enable pm2-$DEPLOY_USER

# ─── 5. Install NGINX ─────────────────────────────────────────────────────────
echo "[5/12] Installing NGINX..."
apt-get install -y nginx
systemctl enable nginx

# ─── 6. Install MySQL ─────────────────────────────────────────────────────────
echo "[6/12] Installing MySQL 8..."
apt-get install -y mysql-server
systemctl enable mysql
# Run hardening wizard after script completes: mysql_secure_installation

# ─── 7. Create app directories ────────────────────────────────────────────────
echo "[7/12] Creating app directories..."
mkdir -p "$APP_DIR"/{backend/uploads,frontend/dist}
mkdir -p "$LOG_DIR"
mkdir -p /var/log/nginx
mkdir -p /var/www/certbot

chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"
chown -R $DEPLOY_USER:www-data "$APP_DIR/backend/uploads"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$APP_DIR/backend/uploads"
chown -R $DEPLOY_USER:$DEPLOY_USER "$LOG_DIR"
chmod 755 "$LOG_DIR"

# ─── 8. Firewall (UFW) ────────────────────────────────────────────────────────
echo "[8/12] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# ─── 9. Fail2Ban ──────────────────────────────────────────────────────────────
echo "[9/12] Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 86400

[nginx-http-auth]
enabled  = true

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
logpath  = /var/log/nginx/lagaao.error.log
maxretry = 10
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# ─── 10. MySQL hardening ──────────────────────────────────────────────────────
echo "[10/12] Creating MySQL database and user..."
# Run interactively — substitute real credentials:
# mysql -u root -p -e "
#   CREATE DATABASE IF NOT EXISTS lagaao_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#   CREATE USER IF NOT EXISTS 'lagaao_user'@'127.0.0.1' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
#   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER
#     ON lagaao_prod.* TO 'lagaao_user'@'127.0.0.1';
#   FLUSH PRIVILEGES;
# "
echo "  → Run MySQL setup manually (see deploy guide)"

# ─── 11. SSH hardening ────────────────────────────────────────────────────────
echo "[11/12] Hardening SSH..."
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/'               /etc/ssh/sshd_config
systemctl reload sshd

# ─── 12. Log rotation ─────────────────────────────────────────────────────────
echo "[12/12] Setting up log rotation..."
cat > /etc/logrotate.d/lagaao << 'EOF'
/var/log/lagaao/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo ""
echo "═══════════════════════════════════════════════════"
echo " Setup complete! Next steps:"
echo "  1. Run: mysql_secure_installation"
echo "  2. Create MySQL DB + user (see above)"
echo "  3. Copy NGINX config and get SSL cert"
echo "  4. Run deploy.sh as the '$DEPLOY_USER' user"
echo "═══════════════════════════════════════════════════"
