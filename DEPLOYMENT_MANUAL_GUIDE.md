# 📚 Guide de Déploiement Manuel - Velvena

Guide complet pour déployer manuellement l'API backend et le frontend Velvena sur un serveur VPS.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration initiale du serveur](#configuration-initiale-du-serveur)
3. [Déploiement de l'API Backend](#déploiement-de-lapi-backend)
4. [Déploiement du Frontend](#déploiement-du-frontend)
5. [Configuration Nginx](#configuration-nginx)
6. [Configuration SSL (Let's Encrypt)](#configuration-ssl-lets-encrypt)
7. [Monitoring (Grafana & Prometheus)](#monitoring-grafana--prometheus)
8. [Maintenance et mise à jour](#maintenance-et-mise-à-jour)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Sur le serveur VPS

- **OS** : Ubuntu 20.04+ / Debian 11+
- **Docker** : Version 20.10+
- **Docker Compose** : Version 2.0+
- **Git** : Installé
- **Nginx** : Installé (ou via Docker)
- **Accès SSH** : Clé SSH configurée
- **Ports ouverts** : 80, 443, 22

### Domaines configurés

- `api.velvena.fr` → Pointe vers l'IP du serveur
- `app.velvena.fr` → Pointe vers l'IP du serveur
- `monitoring.velvena.fr` → Pointe vers l'IP du serveur (optionnel)
- `prometheus.velvena.fr` → Pointe vers l'IP du serveur (optionnel)

### Informations nécessaires

- 🔑 Credentials Hetzner Object Storage
- 🔑 Credentials SMTP (pour les emails)
- 🔑 Secret JWT
- 🔑 Credentials base de données

---

## 🚀 Configuration initiale du serveur

### 1. Connexion au serveur

```bash
# Remplacez par votre IP
ssh root@VOTRE_IP_SERVEUR
```

### 2. Mise à jour du système

```bash
apt update && apt upgrade -y
```

### 3. Installation de Docker

```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation de Docker Compose
apt install docker-compose-plugin -y

# Vérification
docker --version
docker compose version
```

### 4. Configuration du pare-feu

```bash
# Installation UFW
apt install ufw -y

# Configuration des ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Activation
ufw enable
ufw status
```

### 5. Création des répertoires

```bash
mkdir -p /opt/velvena
mkdir -p /opt/velvena-app
```

---

## 🔥 Déploiement de l'API Backend

### 1. Cloner le repository

```bash
cd /opt/velvena
git clone https://github.com/Johnkennabii/velvena-api.git .
```

### 2. Créer le fichier `.env.production`

```bash
cd /opt/velvena
nano .env.production
```

**Contenu minimal requis :**

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://velvena_user:VOTRE_MOT_DE_PASSE@postgres:5432/velvena"
DATABASE_USER=velvena_user
DATABASE_PASSWORD=VOTRE_MOT_DE_PASSE
DATABASE_NAME=velvena

# JWT Secret (générer avec: openssl rand -base64 32)
JWT_SECRET=VOTRE_SECRET_JWT

# Hetzner Object Storage
HETZNER_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_ACCESS_KEY_ID=VOTRE_ACCESS_KEY
HETZNER_SECRET_ACCESS_KEY=VOTRE_SECRET_KEY
HETZNER_BUCKET_NAME=velvena-medias
HETZNER_REGION=eu-central-1

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@velvena.fr
SMTP_PASS=VOTRE_MOT_DE_PASSE_SMTP
SMTP_FROM=noreply@velvena.fr

# Redis
REDIS_URL=redis://redis:6379

# Node Environment
NODE_ENV=production
PORT=3000

# Monitoring (Optionnel)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=VOTRE_MOT_DE_PASSE_GRAFANA
```

### 3. Construire et démarrer les services

```bash
cd /opt/velvena

# Build l'image Docker
docker compose build --no-cache api

# Démarrer tous les services
docker compose up -d

# Vérifier que tout tourne
docker compose ps
```

**Les services démarrés :**
- ✅ `velvena-api` - API Backend (port 3000)
- ✅ `velvena-postgres` - Base de données (port 5432)
- ✅ `velvena-redis` - Cache (port 6379)
- ✅ `velvena-nginx` - Reverse proxy (ports 80, 443)

### 4. Exécuter les migrations Prisma

```bash
# Génération du client Prisma
docker compose exec api npx prisma generate

# Exécution des migrations
docker compose exec api npx prisma migrate deploy

# Seed des données initiales (optionnel)
docker compose exec api npm run prisma:seed
```

### 5. Seed des subscription plans (important !)

```bash
docker compose exec api npx tsx prisma/seed-subscriptions.ts
```

### 6. Vérifier que l'API fonctionne

```bash
# Health check
curl http://localhost:3000/health

# Devrait retourner : {"status":"ok","timestamp":"..."}
```

### 7. Consulter les logs

```bash
# Logs de l'API
docker compose logs -f api

# Logs de tous les services
docker compose logs -f
```

---

## 🎨 Déploiement du Frontend

### 1. Cloner le repository frontend

```bash
cd /opt/velvena-app
git clone https://github.com/VOTRE_USERNAME/velvena-frontend.git .
```

### 2. Créer le fichier `.env.production`

```bash
cd /opt/velvena-app
nano .env.production
```

**Contenu :**

```env
VITE_API_URL=https://api.velvena.fr
VITE_SOCKET_URL=wss://api.velvena.fr
```

### 3. Créer le Dockerfile (si nécessaire)

```bash
nano Dockerfile
```

**Contenu du Dockerfile :**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Créer la configuration nginx pour le frontend

```bash
nano nginx.conf
```

**Contenu :**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. Ajouter le service frontend au docker-compose principal

```bash
cd /opt/velvena
nano docker-compose.yml
```

**Ajouter cette section :**

```yaml
  frontend:
    build:
      context: /opt/velvena-app
      dockerfile: Dockerfile
    container_name: velvena-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:4173:80"
    networks:
      - velvena_network
```

### 6. Build et démarrer le frontend

```bash
cd /opt/velvena

# Build le frontend
docker compose build frontend

# Démarrer le frontend
docker compose up -d frontend

# Vérifier
docker compose ps
curl http://localhost:4173
```

---

## 🌐 Configuration Nginx

### 1. Configuration pour l'API (api.velvena.fr)

Fichier : `/opt/velvena/nginx/conf.d/api.conf`

**Points importants :**
- ✅ Supprimer les headers CORS de nginx (géré par Express)
- ✅ Configurer les headers de sécurité
- ✅ Configurer le proxy vers l'API
- ✅ Configurer WebSocket pour Socket.IO

```nginx
# Voir le fichier dans le repository: nginx/conf.d/api.conf
```

### 2. Configuration pour le Frontend (app.velvena.fr)

Fichier : `/opt/velvena/nginx/conf.d/app.conf`

```nginx
# Voir le fichier dans le repository: nginx/conf.d/app.conf
```

### 3. Redémarrer nginx

```bash
cd /opt/velvena
docker compose restart nginx

# Vérifier les logs
docker compose logs nginx --tail=50
```

---

## 🔒 Configuration SSL (Let's Encrypt)

### 1. Installation de Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

### 2. Obtenir les certificats SSL

```bash
# Pour l'API
certbot certonly --nginx -d api.velvena.fr

# Pour le frontend
certbot certonly --nginx -d app.velvena.fr

# Pour Grafana (optionnel)
certbot certonly --nginx -d monitoring.velvena.fr

# Pour Prometheus (optionnel)
certbot certonly --nginx -d prometheus.velvena.fr
```

### 3. Renouvellement automatique

```bash
# Tester le renouvellement
certbot renew --dry-run

# Le renouvellement automatique est configuré via cron
systemctl status certbot.timer
```

### 4. Vérifier les certificats

```bash
ls -la /etc/letsencrypt/live/
```

---

## 📊 Monitoring (Grafana & Prometheus)

### 1. Accéder à Grafana

```
URL: https://monitoring.velvena.fr
Username: admin
Password: (voir GRAFANA_ADMIN_PASSWORD dans .env.production)
```

### 2. Réinitialiser le mot de passe Grafana

```bash
docker compose exec grafana grafana-cli admin reset-admin-password 'NOUVEAU_MOT_DE_PASSE'
```

### 3. Configuration Prometheus

Prometheus scrape automatiquement les métriques depuis :
- `http://api:3000/metrics` - Métriques de l'API

### 4. Dashboard Grafana

Le dashboard **"Velvena API Dashboard"** est automatiquement provisionné et affiche :
- ✅ Active Database Connections
- ✅ API Request Rate (req/s)
- ✅ API Response Time (p95/p99)
- ✅ HTTP Status Codes
- ✅ API Availability (%)
- ✅ API CPU Usage
- ✅ API Memory Usage

---

## 🔄 Maintenance et mise à jour

### Mise à jour de l'API

```bash
cd /opt/velvena

# 1. Pull les dernières modifications
git pull origin main

# 2. Rebuild l'API
docker compose down api
docker rmi velvena-api:latest
docker compose build --no-cache api

# 3. Redémarrer
docker compose up -d

# 4. Vérifier
docker compose ps
docker compose logs api --tail=50
```

### Mise à jour du Frontend

```bash
cd /opt/velvena-app

# 1. Pull les dernières modifications
git pull origin main

# 2. Rebuild le frontend
cd /opt/velvena
docker compose down frontend
docker rmi velvena-frontend:latest
docker compose build --no-cache frontend

# 3. Redémarrer
docker compose up -d frontend

# 4. Vérifier
curl https://app.velvena.fr
```

### Backup de la base de données

```bash
# Backup manuel
docker compose exec postgres pg_dump -U velvena_user velvena > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou utiliser le script de backup
bash scripts/backup.sh
```

### Restauration de la base de données

```bash
# Restaurer depuis un backup
cat backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres psql -U velvena_user velvena

# Ou utiliser le script de restore
bash scripts/restore.sh backup_YYYYMMDD_HHMMSS.sql
```

---

## 🔧 Troubleshooting

### L'API ne démarre pas

```bash
# Vérifier les logs
docker compose logs api --tail=100

# Problèmes courants :
# 1. Erreur de connexion DB → Vérifier DATABASE_URL
# 2. Port déjà utilisé → Changer le port dans docker-compose.yml
# 3. Erreur Prisma → Relancer les migrations
```

### Erreur CORS

```bash
# 1. Vérifier que nginx N'A PAS de headers CORS
cat nginx/conf.d/api.conf | grep -A 5 "CORS"

# 2. Vérifier que l'API est rebuild avec les bons origins
docker compose logs api | grep "running on"

# 3. Redémarrer nginx
docker compose restart nginx
```

### Le frontend ne charge pas

```bash
# 1. Vérifier que le frontend tourne
docker compose ps frontend

# 2. Vérifier l'URL de l'API dans le frontend
docker compose exec frontend cat /usr/share/nginx/html/assets/*.js | grep "api.velvena.fr"

# 3. Vérifier nginx
curl -I https://app.velvena.fr
```

### Grafana - mot de passe oublié

```bash
docker compose exec grafana grafana-cli admin reset-admin-password 'NOUVEAU_MOT_DE_PASSE'
```

### PostgreSQL - Changer le mot de passe

```bash
# Trouver le bon utilisateur
grep DATABASE_USER .env.production

# Se connecter
docker compose exec postgres psql -U velvena_user -d velvena

# Changer le mot de passe
ALTER USER velvena_user WITH PASSWORD 'NOUVEAU_MOT_DE_PASSE';
\q
```

### Les métriques Prometheus ne fonctionnent pas

```bash
# 1. Vérifier que l'API expose /metrics
curl http://localhost:3000/metrics

# 2. Vérifier la config Prometheus
docker compose exec prometheus cat /etc/prometheus/prometheus.yml

# 3. Vérifier que Prometheus scrape l'API
curl http://localhost:9090/targets
```

### Nettoyer les images Docker inutiles

```bash
# Supprimer les images non utilisées
docker image prune -af

# Supprimer les volumes non utilisés
docker volume prune -f

# Voir l'espace utilisé
docker system df
```

---

## 📝 Commandes utiles

```bash
# Voir tous les conteneurs
docker compose ps

# Voir les logs en temps réel
docker compose logs -f

# Redémarrer un service
docker compose restart api

# Arrêter tout
docker compose down

# Démarrer tout
docker compose up -d

# Rebuild un service
docker compose build --no-cache api

# Entrer dans un conteneur
docker compose exec api sh

# Voir l'utilisation des ressources
docker stats

# Nettoyer tout Docker
docker system prune -a --volumes
```

---

## ✅ Checklist de déploiement

### Avant de déployer

- [ ] Domaines configurés et pointent vers l'IP
- [ ] Fichiers `.env.production` créés (API + Frontend)
- [ ] Credentials Hetzner configurés
- [ ] Credentials SMTP configurés
- [ ] Secret JWT généré

### Déploiement API

- [ ] Repository cloné dans `/opt/velvena`
- [ ] `.env.production` créé et configuré
- [ ] Services Docker démarrés
- [ ] Migrations Prisma exécutées
- [ ] Subscription plans seedés
- [ ] Health check OK (`curl http://localhost:3000/health`)

### Déploiement Frontend

- [ ] Repository cloné dans `/opt/velvena-app`
- [ ] `.env.production` créé avec URL API
- [ ] Service Docker build et démarré
- [ ] Frontend accessible sur `http://localhost:4173`

### Configuration Nginx

- [ ] Headers CORS supprimés de nginx
- [ ] Configurations SSL en place
- [ ] Certificats Let's Encrypt obtenus
- [ ] Nginx redémarré

### Tests finaux

- [ ] `https://api.velvena.fr/health` répond OK
- [ ] `https://app.velvena.fr` charge correctement
- [ ] Connexion frontend → backend fonctionne
- [ ] Socket.IO fonctionne (notifications)
- [ ] Grafana accessible et affiche les métriques
- [ ] Prometheus scrape les métriques

---

## 📞 Support

En cas de problème :
1. Consulter les logs : `docker compose logs -f`
2. Vérifier la configuration : `docker compose config`
3. Consulter cette documentation
4. Créer une issue sur GitHub

---

**Documentation générée pour Velvena v1.0**
*Dernière mise à jour : Décembre 2025*
