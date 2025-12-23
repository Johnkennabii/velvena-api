# Guide d'Installation N8N Professionnel

## 📋 Vue d'ensemble

Ce guide vous accompagne dans l'installation professionnelle de N8N sur votre VPS avec Docker.

**N8N** est une plateforme d'automatisation de workflows puissante et auto-hébergée.

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│          Reverse Proxy (Nginx)          │
│         SSL/TLS (Let's Encrypt)          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│              N8N Container               │
│        (Workflow Automation)             │
└────────┬──────────────────┬──────────────┘
         │                  │
┌────────▼────────┐  ┌──────▼──────────────┐
│   PostgreSQL    │  │      Redis          │
│   (Database)    │  │  (Cache/Queue)      │
└─────────────────┘  └─────────────────────┘
```

## 🚀 Prérequis

### Système
- **OS :** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM :** Minimum 2 GB (4 GB recommandé)
- **CPU :** 2 vCPUs minimum
- **Disque :** 20 GB minimum (SSD recommandé)
- **Réseau :** Connexion Internet stable

### Logiciels
- Docker 20.10+
- Docker Compose 2.0+
- Nginx (pour reverse proxy)
- Certbot (pour SSL)

### Domaine
- Un nom de domaine configuré (ex: `n8n.velvena.fr`)
- DNS pointant vers votre serveur

## 📥 Installation

### Étape 1 : Préparation du serveur

```bash
# Se connecter au VPS
ssh user@your-vps-ip

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y curl git wget vim

# Vérifier Docker
docker --version
docker-compose --version
```

### Étape 2 : Copier les fichiers sur le VPS

```bash
# Créer le répertoire d'installation
sudo mkdir -p /opt/n8n

# Depuis votre machine locale, copier les fichiers
scp -r docker/n8n/* user@your-vps-ip:/tmp/n8n/

# Sur le VPS, déplacer les fichiers
sudo mv /tmp/n8n/* /opt/n8n/
sudo chmod +x /opt/n8n/scripts/*.sh
```

### Étape 3 : Configuration

```bash
# Accéder au répertoire
cd /opt/n8n

# Copier et éditer le fichier d'environnement
sudo cp .env.example .env
sudo nano .env
```

**Configuration minimale requise dans `.env` :**

```bash
# Domain
N8N_DOMAIN=n8n.velvena.fr

# Authentication
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=VotreMotDePasseTresSecurise123!

# Database
POSTGRES_DB=n8n
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=MotDePassePostgresSecurise123!

# Redis
REDIS_PASSWORD=MotDePasseRedisSecurise123!

# Encryption (IMPORTANT!)
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SENDER=N8N Velvena <noreply@velvena.fr>
```

**Générer la clé de chiffrement :**

```bash
# Générer une clé sécurisée
openssl rand -base64 32

# Ajouter la clé dans .env
echo "N8N_ENCRYPTION_KEY=<your-generated-key>" >> .env
```

### Étape 4 : Créer les répertoires

```bash
# Créer les répertoires nécessaires
sudo mkdir -p /var/lib/n8n/{data,files,postgres}
sudo mkdir -p /var/backups/n8n/postgres
sudo mkdir -p /var/log/n8n

# Définir les permissions
sudo chown -R 1000:1000 /var/lib/n8n
sudo chmod -R 755 /var/lib/n8n
```

### Étape 5 : Déploiement automatisé

```bash
# Exécuter le script de déploiement
cd /opt/n8n
sudo ./scripts/deploy.sh
```

**OU déploiement manuel :**

```bash
# Démarrer les services
cd /opt/n8n
sudo docker-compose up -d

# Vérifier les logs
sudo docker logs -f velvena-n8n

# Vérifier le statut
sudo docker-compose ps
```

### Étape 6 : Configuration Nginx (Reverse Proxy)

```bash
# Installer Nginx
sudo apt install -y nginx

# Copier la configuration N8N
sudo cp nginx/n8n.conf /etc/nginx/sites-available/n8n.velvena.fr

# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/n8n.velvena.fr /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Étape 7 : SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d n8n.velvena.fr

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

### Étape 8 : Configuration du Firewall

```bash
# Autoriser HTTP, HTTPS et SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

## ✅ Vérification

### Test de l'installation

```bash
# Vérifier les containers
sudo docker ps

# Vérifier les logs
sudo docker logs velvena-n8n

# Vérifier la santé
sudo docker inspect --format='{{.State.Health.Status}}' velvena-n8n

# Test de connexion
curl -I https://n8n.velvena.fr
```

### Accès à N8N

1. Ouvrir votre navigateur
2. Accéder à `https://n8n.velvena.fr`
3. Se connecter avec :
   - **Username :** `admin` (ou celui défini dans `.env`)
   - **Password :** Votre mot de passe

## 📦 Backup & Restore

### Backup manuel

```bash
# Exécuter le backup
sudo /opt/n8n/scripts/backup.sh

# Vérifier les backups
ls -lh /var/backups/n8n/postgres/
```

### Backup automatique (Cron)

Le déploiement configure automatiquement un cron job pour les backups quotidiens à 2h du matin.

```bash
# Vérifier les cron jobs
sudo crontab -l

# Voir les logs de backup
sudo tail -f /var/log/n8n/backup.log
```

### Restore

```bash
# Lister les backups disponibles
ls -lh /var/backups/n8n/postgres/

# Restaurer un backup
sudo /opt/n8n/scripts/restore.sh 20231223_140530
```

## 🔧 Maintenance

### Commandes utiles

```bash
# Redémarrer N8N
cd /opt/n8n && sudo docker-compose restart n8n

# Arrêter N8N
cd /opt/n8n && sudo docker-compose stop

# Démarrer N8N
cd /opt/n8n && sudo docker-compose up -d

# Voir les logs en temps réel
sudo docker logs -f velvena-n8n

# Voir tous les containers
sudo docker-compose ps

# Mise à jour de N8N
sudo docker-compose pull
sudo docker-compose up -d
```

### Monitoring

```bash
# Vérifier l'utilisation des ressources
sudo docker stats velvena-n8n

# Vérifier l'espace disque
df -h /var/lib/n8n

# Vérifier les logs
sudo tail -f /var/log/n8n/*.log
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Mots de passe forts**
   - Utiliser des mots de passe complexes (16+ caractères)
   - Ne pas réutiliser les mots de passe
   - Changer régulièrement

2. **Firewall**
   - Bloquer tous les ports sauf 22, 80, 443
   - Limiter l'accès SSH par IP si possible

3. **SSL/TLS**
   - Toujours utiliser HTTPS
   - Renouveler les certificats automatiquement

4. **Mises à jour**
   - Mettre à jour régulièrement N8N
   - Mettre à jour le système d'exploitation

5. **Backups**
   - Vérifier les backups quotidiens
   - Tester la restauration régulièrement
   - Stocker les backups hors site (S3)

### Authentification avancée (Optionnel)

Pour remplacer l'authentification basique par OAuth/LDAP, voir la documentation N8N.

## 🔗 Intégration avec Velvena API

### Créer un webhook N8N dans votre API

1. Dans N8N, créer un nouveau workflow
2. Ajouter un nœud "Webhook"
3. Configurer l'URL : `https://n8n.velvena.fr/webhook/test`
4. Copier l'URL du webhook

### Exemple d'intégration

**Dans votre API Velvena :**

```typescript
// Envoyer un événement à N8N
async function sendToN8N(event: string, data: any) {
  await fetch('https://n8n.velvena.fr/webhook/velvena-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    }),
  });
}

// Utilisation
await sendToN8N('contract.signed', {
  contractId: contract.id,
  customerId: customer.id,
});
```

## 📊 Monitoring avec Prometheus

N8N expose des métriques Prometheus sur `/metrics`.

**Exemple de configuration Prometheus :**

```yaml
scrape_configs:
  - job_name: 'n8n'
    static_configs:
      - targets: ['n8n.velvena.fr:5678']
    metrics_path: '/metrics'
```

## 🚨 Dépannage

### N8N ne démarre pas

```bash
# Vérifier les logs
sudo docker logs velvena-n8n

# Vérifier la configuration
sudo docker-compose config

# Redémarrer tout
cd /opt/n8n && sudo docker-compose down
sudo docker-compose up -d
```

### Erreur de connexion à la base de données

```bash
# Vérifier PostgreSQL
sudo docker logs velvena-n8n-postgres

# Se connecter à PostgreSQL
sudo docker exec -it velvena-n8n-postgres psql -U n8n_user -d n8n
```

### Problèmes de performance

```bash
# Vérifier les ressources
sudo docker stats

# Augmenter les ressources PostgreSQL
# Éditer docker-compose.yml et augmenter shared_buffers
```

## 📚 Ressources

- **Documentation N8N :** https://docs.n8n.io/
- **Forum N8N :** https://community.n8n.io/
- **GitHub N8N :** https://github.com/n8n-io/n8n
- **Docker Hub :** https://hub.docker.com/r/n8nio/n8n

## 🆘 Support

Pour toute question ou problème :
1. Vérifier les logs : `sudo docker logs velvena-n8n`
2. Consulter la documentation N8N
3. Contacter le support technique Velvena

## ✅ Checklist Post-Installation

- [ ] N8N accessible via HTTPS
- [ ] Authentification configurée
- [ ] SSL/TLS activé
- [ ] Backup automatique configuré
- [ ] Firewall configuré
- [ ] Monitoring configuré
- [ ] Test de restauration effectué
- [ ] Documentation personnalisée créée
- [ ] Webhooks testés
- [ ] Intégration avec Velvena API testée

---

**🎉 Félicitations ! N8N est maintenant installé et prêt à automatiser vos workflows !**
