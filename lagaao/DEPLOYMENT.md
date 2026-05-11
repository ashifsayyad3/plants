# Lagaao.com — Production Deployment Guide
## GoDaddy VPS · Ubuntu 22.04 LTS · Node.js 20 · MySQL 8 · NGINX · PM2

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Server Initial Setup](#2-server-initial-setup)
3. [MySQL Setup](#3-mysql-setup)
4. [Deploy the Application](#4-deploy-the-application)
5. [SSL Certificate](#5-ssl-certificate)
6. [PM2 Process Management](#6-pm2-process-management)
7. [Environment Variables](#7-environment-variables)
8. [Caching Strategy](#8-caching-strategy)
9. [Backup Strategy](#9-backup-strategy)
10. [Monitoring](#10-monitoring)
11. [CI/CD Suggestions](#11-cicd-suggestions)
12. [Deployment Checklist](#12-deployment-checklist)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

### Local machine
- SSH key pair generated (`ssh-keygen -t ed25519 -C "deploy@lagaao.com"`)
- Git access to your repository
- Node.js 20 installed locally for testing builds

### GoDaddy VPS
- Ubuntu 22.04 LTS (minimum 2 vCPU, 2 GB RAM — 4 GB recommended)
- Root SSH access to provision the server
- Domain `lagaao.com` DNS A record pointing to VPS IP
- Port 22 (SSH), 80 (HTTP), 443 (HTTPS) open in GoDaddy firewall panel

### Domain DNS (GoDaddy panel)
```
A     lagaao.com       →  YOUR_VPS_IP   TTL 600
A     www.lagaao.com   →  YOUR_VPS_IP   TTL 600
```
Wait for DNS propagation (up to 24h) before running Certbot.

---

## 2. Server Initial Setup

### 2a. First login
```bash
ssh root@YOUR_VPS_IP
```

### 2b. Add your SSH public key (before running setup)
```bash
mkdir -p /home/deploy/.ssh
echo "YOUR_SSH_PUBLIC_KEY_HERE" >> /home/deploy/.ssh/authorized_keys
```

### 2c. Run the automated setup script
```bash
curl -O https://raw.githubusercontent.com/YOUR_ORG/lagaao/main/deploy/scripts/setup-server.sh
bash setup-server.sh
```

Or upload and run locally:
```bash
scp deploy/scripts/setup-server.sh root@YOUR_VPS_IP:/tmp/
ssh root@YOUR_VPS_IP "bash /tmp/setup-server.sh"
```

### 2d. SSH hardening — finish it
```bash
# On the VPS, after confirming you can log in as deploy:
ssh deploy@YOUR_VPS_IP

# Then as root:
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd
```

---

## 3. MySQL Setup

### 3a. Harden MySQL
```bash
mysql_secure_installation
# Answer: Y to all prompts
# Set a strong root password
```

### 3b. Create production database and user
```bash
mysql -u root -p
```
```sql
CREATE DATABASE lagaao_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'lagaao_user'@'127.0.0.1'
  IDENTIFIED BY 'STRONG_RANDOM_PASSWORD_HERE';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP,
      INDEX, ALTER, REFERENCES, CREATE TEMPORARY TABLES
  ON lagaao_prod.* TO 'lagaao_user'@'127.0.0.1';

FLUSH PRIVILEGES;
EXIT;
```

### 3c. Apply production MySQL config
```bash
sudo cp /var/www/lagaao/deploy/mysql/production.cnf /etc/mysql/conf.d/lagaao-production.cnf
sudo systemctl restart mysql
```

### 3d. Verify connection
```bash
mysql -u lagaao_user -p -h 127.0.0.1 lagaao_prod -e "SELECT 1;"
```

---

## 4. Deploy the Application

### 4a. Create the production `.env`
```bash
cp /var/www/lagaao/backend/.env.production.example /var/www/lagaao/backend/.env
nano /var/www/lagaao/backend/.env   # fill in all values
chmod 600 /var/www/lagaao/backend/.env
```

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — one for JWT_SECRET, one for JWT_REFRESH_SECRET
```

### 4b. First deployment
```bash
ssh deploy@YOUR_VPS_IP
bash /var/www/lagaao/deploy/scripts/deploy.sh --first-run
```

### 4c. Subsequent deployments (after git push)
```bash
ssh deploy@YOUR_VPS_IP "bash /var/www/lagaao/deploy/scripts/deploy.sh"
```

### 4d. File structure on server
```
/var/www/lagaao/
├── backend/
│   ├── dist/              ← compiled TypeScript output
│   ├── uploads/           ← user-uploaded files (chmod 775, deploy:www-data)
│   ├── .env               ← production secrets (chmod 600)
│   └── package.json
├── frontend/
│   └── dist/lagaao/browser/  ← Angular production build
├── ecosystem.config.js
└── deploy/
```

---

## 5. SSL Certificate

### 5a. Obtain certificate (Certbot + NGINX plugin)
```bash
sudo certbot --nginx \
  -d lagaao.com \
  -d www.lagaao.com \
  --non-interactive \
  --agree-tos \
  -m admin@lagaao.com \
  --redirect
```

### 5b. Auto-renewal
Certbot installs a systemd timer automatically. Verify:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### 5c. Install NGINX config
```bash
sudo cp /var/www/lagaao/deploy/nginx/lagaao.conf /etc/nginx/sites-available/lagaao.com
sudo ln -sf /etc/nginx/sites-available/lagaao.com /etc/nginx/sites-enabled/lagaao.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. PM2 Process Management

### Common commands
```bash
pm2 list                           # show all processes
pm2 status                         # health summary
pm2 logs lagaao-api                # stream logs
pm2 logs lagaao-api --lines 200    # last 200 lines
pm2 reload lagaao-api              # zero-downtime reload
pm2 restart lagaao-api             # hard restart
pm2 stop lagaao-api                # stop
pm2 monit                          # real-time CPU/RAM monitor
pm2 save                           # persist process list across reboots
```

### Scale workers
```bash
pm2 scale lagaao-api 4             # run 4 workers
pm2 scale lagaao-api max           # one worker per CPU
```

### View memory / CPU per worker
```bash
pm2 show lagaao-api
```

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✓ | Must be `production` |
| `PORT` | ✓ | Internal API port (3000) |
| `APP_URL` | ✓ | `https://lagaao.com` |
| `DB_HOST` | ✓ | `127.0.0.1` |
| `DB_NAME` | ✓ | `lagaao_prod` |
| `DB_USER` | ✓ | `lagaao_user` |
| `DB_PASS` | ✓ | Strong random password |
| `JWT_SECRET` | ✓ | 64-byte hex, never reused |
| `JWT_REFRESH_SECRET` | ✓ | Different 64-byte hex |
| `ALLOWED_ORIGINS` | ✓ | `https://lagaao.com` |
| `COOKIE_SECURE` | ✓ | `true` |
| `COOKIE_DOMAIN` | ✓ | `lagaao.com` |
| `SWAGGER_ENABLED` | ✓ | `false` |

---

## 8. Caching Strategy

### NGINX layer (handled automatically in `lagaao.conf`)
| Resource | Cache-Control | TTL |
|---|---|---|
| Angular JS/CSS (hashed names) | `public, immutable` | 1 year |
| Uploaded images/PDFs | `public, immutable` | 7 days |
| `index.html` | `no-store` | Never |
| API responses | None (dynamic) | — |

### Application layer
- **Auth tokens**: JWT (stateless, no server cache needed)
- **MySQL query caching**: Sequelize connection pool handles reuse
- **Rate limiter**: In-memory via `express-rate-limit`

### Future improvements
```
Redis for:
  - Session/token blacklist
  - API response caching (listings, categories)
  - Rate limit store (for multi-instance sharing)
```
Install when ready: `npm install ioredis` and add `REDIS_URL=redis://127.0.0.1:6379` to `.env`.

---

## 9. Backup Strategy

### Automated daily backups
```bash
# Add to deploy user crontab: crontab -e
0 2 * * * /var/www/lagaao/deploy/scripts/backup.sh >> /var/log/lagaao/backup.log 2>&1
```

### What is backed up
| Source | Destination | Retention |
|---|---|---|
| MySQL dump (gzip) | `/var/backups/lagaao/db/` | 30 days |
| Uploads directory (tar.gz) | `/var/backups/lagaao/uploads/` | 30 days |

### Off-site backup (strongly recommended)
```bash
# Install rclone and configure S3 / Backblaze B2 / Google Drive
sudo apt install rclone
rclone config   # follow interactive setup

# Add to end of backup.sh:
rclone copy /var/backups/lagaao/ remote:lagaao-backups/
```

### Test restore procedure (monthly)
```bash
# Restore DB
gunzip -c /var/backups/lagaao/db/lagaao_20240101_020000.sql.gz | mysql -u root -p lagaao_prod

# Restore uploads
tar -xzf /var/backups/lagaao/uploads/uploads_20240101_020000.tar.gz -C /var/www/lagaao/backend/
```

---

## 10. Monitoring

### PM2 built-in monitoring
```bash
pm2 monit          # real-time dashboard
pm2 plus           # PM2 cloud monitoring (optional, free tier available)
```

### System monitoring — install netdata (optional, free)
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Access at: http://YOUR_VPS_IP:19999 (firewall: ufw allow 19999)
```

### Log monitoring
```bash
# Watch API errors in real-time
tail -f /var/log/lagaao/api-error.log

# Watch NGINX errors
tail -f /var/log/nginx/lagaao.error.log

# MySQL slow queries
tail -f /var/log/mysql/slow.log
```

### Uptime monitoring (free services)
- [UptimeRobot](https://uptimerobot.com) — monitor `https://lagaao.com/api/v1/health` every 5 min
- [BetterUptime](https://betteruptime.com) — alert via email/Slack on downtime

### Health check endpoint
```
GET https://lagaao.com/api/v1/health
→ 200 OK  { "status": "ok", "uptime": ... }
```

---

## 11. CI/CD Suggestions

### Option A: GitHub Actions (recommended)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/lagaao
            bash deploy/scripts/deploy.sh
```

Secrets to add in GitHub repo settings:
- `VPS_HOST` — your VPS IP
- `VPS_SSH_KEY` — deploy user's private SSH key

### Option B: GitLab CI
```yaml
deploy:
  stage: deploy
  only: [main]
  script:
    - ssh deploy@$VPS_HOST "bash /var/www/lagaao/deploy/scripts/deploy.sh"
```

### Option C: Manual webhook (lightweight)
Install a webhook listener on the VPS and call `deploy.sh` when GitHub/GitLab pushes to main.

---

## 12. Deployment Checklist

### Pre-deployment (every release)
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes (zero errors)
- [ ] All environment variables documented and set on VPS
- [ ] Database migration tested in a staging environment
- [ ] No secrets committed to git (`git log --all -p | grep -i "secret\|password\|key"`)
- [ ] Angular `environment.production.ts` has correct `apiUrl`

### First deployment
- [ ] DNS A records pointing to VPS IP and propagated
- [ ] VPS initial setup script completed
- [ ] MySQL production DB and user created
- [ ] `/var/www/lagaao/backend/.env` created and `chmod 600`
- [ ] NGINX config installed and tested (`nginx -t`)
- [ ] SSL certificate obtained and auto-renewal verified
- [ ] `pm2 save` run after first start
- [ ] `pm2 startup` output executed as root
- [ ] Backup cron job added
- [ ] Health check URL returns 200

### Post-deployment verification
- [ ] `https://lagaao.com` loads the Angular app
- [ ] `https://lagaao.com/api/v1/health` returns 200
- [ ] Login flow works end-to-end
- [ ] File upload works and files are served from `/uploads/`
- [ ] HTTPS redirects from `http://` and `www.`
- [ ] `pm2 list` shows all workers as `online`
- [ ] No errors in `pm2 logs lagaao-api --lines 50`
- [ ] SSL certificate grade A at [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
- [ ] Security headers present at [securityheaders.com](https://securityheaders.com)

---

## 13. Troubleshooting

### API not responding (502 Bad Gateway)
```bash
pm2 status                   # check if lagaao-api is online
pm2 logs lagaao-api --err    # read error logs
pm2 restart lagaao-api       # restart if crashed

# Check the port is listening:
ss -tlnp | grep 3000
```

### NGINX failing to start
```bash
sudo nginx -t                        # check config syntax
sudo journalctl -u nginx -n 50       # systemd logs
cat /var/log/nginx/lagaao.error.log  # vhost-specific errors
```

### Database connection error
```bash
# Test from server:
mysql -u lagaao_user -p -h 127.0.0.1 lagaao_prod -e "SELECT 1;"

# Check MySQL is running:
sudo systemctl status mysql

# Check for max_connections:
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
sudo certbot certificates           # list certs and expiry dates

# Force renewal:
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Angular app shows blank page
```bash
# Check if build output exists:
ls /var/www/lagaao/frontend/dist/lagaao/browser/

# Check NGINX root path matches:
grep "root" /etc/nginx/sites-available/lagaao.com

# Check browser console for 404 on assets
# If JS/CSS 404 → check Angular baseHref in angular.json
```

### Uploads not accessible
```bash
# Check permissions:
ls -la /var/www/lagaao/backend/uploads/

# Should be:
# drwxrwxr-x  deploy www-data  (775)
# -rw-r--r--  deploy www-data  (644 for files)

# Fix permissions:
sudo chown -R deploy:www-data /var/www/lagaao/backend/uploads/
sudo chmod -R 775 /var/www/lagaao/backend/uploads/
```

### PM2 not starting on reboot
```bash
# Re-run startup hook (as root):
pm2 startup systemd -u deploy --hp /home/deploy
# Execute the printed command, then:
pm2 save
```

### High memory usage
```bash
pm2 monit                    # watch per-process RAM
pm2 restart lagaao-api       # restart leaking workers
# Adjust max_memory_restart in ecosystem.config.js if needed
```

### Check server resource usage
```bash
htop                         # CPU + memory overview
df -h                        # disk space
du -sh /var/www/lagaao/backend/uploads/   # uploads size
du -sh /var/log/lagaao/                   # log file size
```

---

## Quick Reference — Daily Commands

```bash
# Deploy latest code
bash /var/www/lagaao/deploy/scripts/deploy.sh

# View running processes
pm2 list

# Stream API logs
pm2 logs lagaao-api

# Reload without downtime
pm2 reload ecosystem.config.js --env production

# Run DB migrations only
cd /var/www/lagaao/backend && npx sequelize-cli db:migrate

# Test NGINX config
sudo nginx -t && sudo systemctl reload nginx

# Check SSL expiry
sudo certbot certificates

# Run backup manually
bash /var/www/lagaao/deploy/scripts/backup.sh

# Disk usage
df -h && du -sh /var/www/lagaao/backend/uploads/
```
