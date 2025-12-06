# 🚀 Guide de Déploiement Professionnel - Velvena

Guide complet pour déployer Velvena sur Hetzner Cloud avec Docker, SSL, CI/CD automatisé et monitoring.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Architecture](#architecture)
3. [Configuration du Serveur Hetzner](#configuration-du-serveur-hetzner)
4. [Configuration DNS (Gandi)](#configuration-dns-gandi)
5. [Déploiement Initial](#déploiement-initial)
6. [Configuration SSL](#configuration-ssl)
7. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
8. [Sauvegardes Automatiques](#sauvegardes-automatiques)
9. [Monitoring et Alertes](#monitoring-et-alertes)
10. [Multi-Tenancy](#multi-tenancy)
11. [Maintenance](#maintenance)
12. [Dépannage](#dépannage)

---

## Prérequis

### Services Requis
- ✅ Serveur Hetzner Cloud (CX21 minimum recommandé)
- ✅ Nom de domaine sur Gandi.net
- ✅ Compte GitHub avec accès au repository
- ✅ Hetzner Object Storage (optionnel, pour les backups)
- ✅ Email SMTP (Infomaniak ou autre)

### Spécifications Serveur Recommandées

| Environnement | CPU | RAM | Stockage | Hetzner Type |
|--------------|-----|-----|----------|--------------|
| Production   | 2+ | 4GB+ | 40GB+ | CX21 ou supérieur |
| Staging      | 2  | 2GB  | 20GB  | CPX11 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Gandi DNS (api.allure-creation.fr)         │
│              A Record → Hetzner Server IP                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Hetzner Cloud Server                     │
│                  Ubuntu 22.04 LTS                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Nginx (Port 80/443) + Let's Encrypt SSL        │  │
│  │  - Rate Limiting                                  │  │
│  │  - CORS & Security Headers                       │  │
│  │  - WebSocket Support                             │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                          │
│  ┌────────────▼─────────────────────────────────────┐  │
│  │         Docker Compose Stack                     │  │
│  │  ┌─────────────┐  ┌──────────────┐             │  │
│  │  │  API        │  │  PostgreSQL  │             │  │
│  │  │  Node.js    │  │  17.6        │             │  │
│  │  │  Port 3000  │  │  Port 5432   │             │  │
│  │  └─────────────┘  └──────────────┘             │  │
│  │  ┌─────────────┐  ┌──────────────┐             │  │
│  │  │  Redis      │  │  Prometheus  │             │  │
│  │  │  Port 6379  │  │  Port 9090   │             │  │
│  │  └─────────────┘  └──────────────┘             │  │
│  │  ┌─────────────┐                                │  │
│  │  │  Grafana    │                                │  │
│  │  │  Port 3001  │                                │  │
│  │  └─────────────┘                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Volumes persistants:                                   │
│  - postgres_data                                        │
│  - redis_data                                           │
│  - uploads_data                                         │
│  - prometheus_data                                      │
│  - grafana_data                                         │
│  - certbot_conf (SSL certificates)                     │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration du Serveur Hetzner

### 1. Créer le Serveur

1. Connectez-vous à [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Créez un nouveau projet "Velvena Production"
3. Créez un serveur:
   - **Emplacement**: Nuremberg (ou autre proche de votre audience)
   - **Image**: Ubuntu 22.04 LTS
   - **Type**: CX21 (2 vCPU, 4GB RAM, 40GB SSD)
   - **Volumes**: Ajoutez un volume de 50GB pour les données (optionnel)
   - **Réseau**: Activez IPv4 et IPv6
   - **SSH Key**: Ajoutez votre clé SSH publique
   - **Firewall**: Créez-en un qui autorise:
     - SSH (22)
     - HTTP (80)
     - HTTPS (443)

### 2. Première Connexion

```bash
# Connectez-vous au serveur
ssh root@VOTRE_IP_SERVEUR

# Mettez à jour le système
apt update && apt upgrade -y

# Téléchargez et exécutez le script de setup
curl -fsSL https://raw.githubusercontent.com/Johnkennabii/velvena-api/main/scripts/setup-server.sh -o setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

Le script `setup-server.sh` va automatiquement:
- ✅ Installer Docker et Docker Compose
- ✅ Configurer le firewall UFW
- ✅ Installer Fail2Ban pour la sécurité SSH
- ✅ Créer l'utilisateur `velvena`
- ✅ Configurer les mises à jour automatiques
- ✅ Créer les répertoires nécessaires
- ✅ Configurer le swap
- ✅ Mettre en place les cron jobs pour les backups

### 3. Configuration Post-Installation

```bash
# Passez à l'utilisateur velvena
su - velvena

# Allez dans le répertoire de l'application
cd /opt/velvena

# Clonez le repository
git clone https://github.com/Johnkennabii/velvena-api.git .

# Créez le fichier d'environnement
cp .env.production.example .env.production

# Éditez avec vos vraies valeurs
nano .env.production
```

---

## Configuration DNS (Gandi)

### 1. Ajouter les Enregistrements DNS

Connectez-vous à [Gandi.net](https://admin.gandi.net/) et ajoutez:

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | api | VOTRE_IP_SERVEUR | 300 |
| AAAA | api | VOTRE_IPv6_SERVEUR | 300 |
| A | monitoring | VOTRE_IP_SERVEUR | 300 |
| TXT | @ | "v=spf1 include:_spf.infomaniak.ch ~all" | 3600 |

### 2. Vérifier la Propagation DNS

```bash
# Attendez 5-10 minutes, puis testez
dig api.allure-creation.fr +short

# Devrait retourner votre IP serveur
```

---

## Déploiement Initial

### 1. Configuration de l'Environnement

Éditez `/opt/velvena/.env.production` avec vos valeurs:

```bash
# Générer un secret JWT fort
openssl rand -hex 64

# Générer un mot de passe PostgreSQL
openssl rand -base64 32

# Générer un mot de passe Redis
openssl rand -base64 32
```

Remplissez toutes les variables dans `.env.production`.

### 2. Démarrage des Services

```bash
cd /opt/velvena

# Construisez et démarrez tous les services
docker-compose up -d

# Vérifiez les logs
docker-compose logs -f api

# Attendez que l'API soit prête
curl http://localhost:3000/health
```

### 3. Initialisation de la Base de Données

```bash
# Exécuter les migrations Prisma
docker-compose exec api npx prisma migrate deploy

# Seed la base de données (données initiales)
docker-compose exec api npx prisma db seed
```

---

## Configuration SSL

### Automatique avec Let's Encrypt

```bash
cd /opt/velvena

# Exécutez le script de configuration SSL
./scripts/setup-ssl.sh
```

Le script va:
1. Démarrer temporairement Nginx pour le challenge ACME
2. Obtenir un certificat SSL de Let's Encrypt
3. Redémarrer Nginx avec la configuration SSL complète
4. Configurer le renouvellement automatique

### Vérification

```bash
# Testez votre configuration SSL
curl -I https://api.allure-creation.fr/health

# Devrait retourner: HTTP/2 200
```

Testez aussi sur [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=api.allure-creation.fr)

---

## CI/CD avec GitHub Actions

### 1. Configuration des Secrets GitHub

Allez sur `https://github.com/Johnkennabii/velvena-api/settings/secrets/actions`

Ajoutez ces secrets:

| Secret | Description | Exemple |
|--------|-------------|---------|
| `SSH_PRIVATE_KEY` | Clé SSH privée pour déploiement | Contenu de votre `~/.ssh/id_rsa` |
| `SERVER_HOST` | IP ou domaine du serveur | `135.181.XXX.XXX` |
| `SERVER_USER` | Utilisateur SSH | `velvena` |

### 2. Déploiement Automatique

Le workflow `.github/workflows/deploy.yml` se déclenche automatiquement:
- ✅ À chaque push sur `main`
- ✅ Manuellement via l'interface GitHub Actions

**Pipeline CI/CD:**
1. 🧪 Run Tests
2. 🏗️ Build Docker Image
3. 📦 Push to GitHub Container Registry
4. 🔒 Security Scan (Trivy)
5. 🚀 Deploy to Server
6. ✅ Health Check Verification

### 3. Déploiement Manuel

Si vous préférez déployer manuellement:

```bash
# Sur votre machine locale
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# Sur le serveur
ssh velvena@VOTRE_IP
cd /opt/velvena
git pull
docker-compose pull
docker-compose up -d --build api
```

---

## Sauvegardes Automatiques

### Configuration des Backups

Les backups sont automatiques grâce au cron job installé par `setup-server.sh`.

**Fréquence**: Tous les jours à 2h du matin

**Contenu des backups:**
- ✅ Base de données PostgreSQL (dump complet)
- ✅ Fichiers uploads
- ✅ Configuration (.env, docker-compose, nginx)

### Backup Manuel

```bash
cd /opt/velvena
./scripts/backup.sh
```

Les backups sont stockés dans `/opt/velvena/backups/`

### Restauration

```bash
cd /opt/velvena
./scripts/restore.sh

# Suivez les instructions interactives
```

### Backup Distant (Hetzner Object Storage)

Si vous avez configuré `HETZNER_ACCESS_KEY` et `HETZNER_SECRET_KEY`, les backups sont automatiquement uploadés sur Hetzner Object Storage.

---

## Monitoring et Alertes

### Accès aux Dashboards

**Prometheus**: http://VOTRE_IP:9090
**Grafana**: http://VOTRE_IP:3001

**Credentials Grafana:**
- Username: `admin`
- Password: Défini dans `.env.production` (`GRAFANA_ADMIN_PASSWORD`)

### Métriques Disponibles

- **Système**: CPU, RAM, Disque, Réseau (Node Exporter)
- **PostgreSQL**: Connexions, queries, taille DB (Postgres Exporter)
- **API**: Requêtes HTTP, latence, erreurs
- **Docker**: Conteneurs, images, volumes

### Créer des Alertes Grafana

1. Connectez-vous à Grafana
2. Allez dans **Alerting > Alert rules**
3. Créez des règles pour:
   - CPU > 80%
   - RAM > 90%
   - Disque > 85%
   - API errors > 10/min
   - PostgreSQL connexions > 150

---

## Multi-Tenancy

### Architecture Multi-Tenant

Velvena utilise une architecture multi-tenant basée sur les **organizations**:

- Chaque organization a ses propres données (isolées par `organization_id`)
- Les utilisateurs appartiennent à une organization
- Les données de référence peuvent être globales ou par organization

### Ajouter un Nouveau Client

#### 1. Via l'API

```bash
# Créez une nouvelle organization
curl -X POST https://api.allure-creation.fr/organizations \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Client SAS",
    "slug": "nouveau-client",
    "email": "contact@nouveau-client.fr",
    "subscription_plan": "pro",
    "subscription_status": "active"
  }'
```

#### 2. Via la Base de Données

```bash
docker-compose exec postgres psql -U velvena_user -d velvena_db

-- Créez une organization
INSERT INTO organizations (name, slug, email, subscription_plan, subscription_status)
VALUES ('Nouveau Client', 'nouveau-client', 'contact@nouveau-client.fr', 'pro', 'active');

-- Créez un utilisateur admin pour cette organization
INSERT INTO users (email, password_hash, organization_id, role)
VALUES ('admin@nouveau-client.fr', '$2a$10$...', 'organization_id_ici', 'organization_admin');
```

### Gestion des Plans

Plans disponibles:
- **starter**: Fonctionnalités basiques
- **pro**: Fonctionnalités avancées
- **enterprise**: Tout inclus + support prioritaire

Configuration dans `service_types` et `pricing_rules`.

---

## Maintenance

### Mises à Jour de Sécurité

```bash
# Les mises à jour de sécurité sont automatiques via unattended-upgrades

# Pour une mise à jour manuelle
sudo apt update && sudo apt upgrade -y
```

### Mise à Jour de l'Application

```bash
cd /opt/velvena
git pull
docker-compose pull
docker-compose up -d --build
```

### Nettoyage Docker

```bash
# Supprime les images, conteneurs et volumes inutilisés
docker system prune -af --volumes

# Ou utilisez le cron job hebdomadaire déjà configuré
```

### Rotation des Logs

```bash
# Les logs sont automatiquement limités par Docker
# Config dans docker-compose.yml: max-size: 10m, max-file: 3

# Pour voir les logs
docker-compose logs -f --tail=100 api
```

### Redémarrage des Services

```bash
# Redémarrer un service spécifique
docker-compose restart api

# Redémarrer tous les services
docker-compose restart

# Redémarrage complet (si problèmes)
docker-compose down
docker-compose up -d
```

---

## Dépannage

### 🔴 Le serveur ne répond pas

```bash
# Vérifiez que Docker est en cours d'exécution
docker ps

# Vérifiez les logs
docker-compose logs api --tail=50

# Vérifiez le port
netstat -tlnp | grep 3000

# Vérifiez le firewall
sudo ufw status
```

### 🔴 Erreur de connexion à la base de données

```bash
# Vérifiez que PostgreSQL est en cours d'exécution
docker-compose ps postgres

# Testez la connexion
docker-compose exec postgres psql -U velvena_user -d velvena_db -c "SELECT 1;"

# Vérifiez les credentials dans .env.production
```

### 🔴 Erreur SSL / Certificat

```bash
# Vérifiez les certificats
ls -la /opt/velvena/certbot_conf/live/api.allure-creation.fr/

# Renouvelez manuellement
docker-compose run --rm certbot renew

# Redémarrez Nginx
docker-compose restart nginx
```

### 🔴 L'API est lente

```bash
# Vérifiez les ressources serveur
htop

# Vérifiez les connexions PostgreSQL
docker-compose exec postgres psql -U velvena_user -d velvena_db -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Vérifiez les logs pour identifier les requêtes lentes
docker-compose logs api | grep "slow query"

# Consultez Grafana pour les métriques
```

### 🔴 Problème de déploiement GitHub Actions

```bash
# Vérifiez les secrets GitHub
# Vérifiez les logs du workflow dans l'onglet Actions

# Testez SSH manuellement
ssh velvena@VOTRE_IP

# Vérifiez les permissions
ls -la /opt/velvena
```

### 🔴 Espace disque plein

```bash
# Vérifiez l'utilisation du disque
df -h

# Trouvez les gros fichiers
du -sh /opt/velvena/* | sort -h

# Nettoyez Docker
docker system prune -af --volumes

# Nettoyez les anciens backups
find /opt/velvena/backups -mtime +30 -delete
```

---

## 📞 Support

### Logs Importants

```bash
# Logs de l'API
docker-compose logs -f api

# Logs Nginx
docker-compose logs -f nginx

# Logs PostgreSQL
docker-compose logs -f postgres

# Logs système
sudo journalctl -u docker -f
```

### Commandes Utiles

```bash
# État de tous les services
docker-compose ps

# Ressources utilisées
docker stats

# Connexions actives
docker-compose exec postgres psql -U velvena_user -d velvena_db -c \
  "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Taille de la base de données
docker-compose exec postgres psql -U velvena_user -d velvena_db -c \
  "SELECT pg_size_pretty(pg_database_size('velvena_db'));"
```

---

## 🎉 Checklist de Déploiement

- [ ] Serveur Hetzner créé et configuré
- [ ] DNS configuré sur Gandi
- [ ] Script `setup-server.sh` exécuté
- [ ] Repository cloné dans `/opt/velvena`
- [ ] `.env.production` configuré avec toutes les variables
- [ ] Services Docker démarrés
- [ ] Migrations Prisma exécutées
- [ ] Base de données seedée
- [ ] SSL configuré avec Let's Encrypt
- [ ] Accès HTTPS fonctionnel
- [ ] Secrets GitHub Actions configurés
- [ ] Premier déploiement automatique réussi
- [ ] Monitoring accessible (Prometheus + Grafana)
- [ ] Backup automatique testé
- [ ] Restauration testée
- [ ] Documentation interne mise à jour
- [ ] Credentials sauvegardés en lieu sûr

---

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [Hetzner Cloud Docs](https://docs.hetzner.com/cloud/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Dernière mise à jour**: 2025-12-06
**Version**: 1.0.0
**Auteur**: Équipe Velvena
