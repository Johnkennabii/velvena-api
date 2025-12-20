# 🕐 Service Cron pour Velvena

Ce service exécute des tâches planifiées (cron jobs) en production dans un container Docker séparé.

## 📋 Tâches planifiées

### Nettoyage des audit logs (2h du matin, tous les jours)

```cron
0 2 * * * cd /app && npx tsx scripts/cleanup-audit-logs.ts
```

Supprime les audit logs ayant dépassé leur période de rétention de 7 ans (conformité RGPD).

## 🚀 Démarrage

### En développement local

```bash
# Build le service cron
docker-compose build cron

# Démarrer le service
docker-compose up -d cron

# Voir les logs
docker-compose logs -f cron
```

### En production

```bash
# Pull et rebuild
git pull origin main
docker-compose build cron

# Démarrer
docker-compose up -d cron

# Vérifier le statut
docker-compose ps cron
```

## 🧪 Tests

### Tester le cron manuellement

```bash
# Exec dans le container
docker exec -it velvena-cron sh

# Exécuter le script de nettoyage manuellement
npx tsx scripts/cleanup-audit-logs.ts

# Devrait afficher : "No expired audit logs to clean up"
```

### Vérifier que le cron tourne

```bash
# Vérifier le processus crond
docker exec velvena-cron ps aux | grep crond

# Lister les crontabs
docker exec velvena-cron crontab -l -u nodejs
```

### Vérifier les logs du cron

```bash
# Voir les logs du container
docker-compose logs -f cron

# Voir les logs du script de nettoyage (dans le container)
docker exec velvena-cron cat /var/log/cron-audit-cleanup.log

# Ou depuis l'hôte (si volume monté)
cat logs/cron/cron-audit-cleanup.log
```

## 🔧 Configuration

### Modifier le planning des tâches

Éditez `Dockerfile.cron` et modifiez la ligne crontab :

```dockerfile
# Format: minute hour day month weekday command
# Exemple : Tous les jours à 3h du matin au lieu de 2h
RUN echo "0 3 * * * cd /app && npx tsx scripts/cleanup-audit-logs.ts >> /var/log/cron-audit-cleanup.log 2>&1" >> /etc/crontabs/nodejs
```

Puis rebuild :

```bash
docker-compose build cron
docker-compose up -d cron
```

### Ajouter une nouvelle tâche planifiée

1. Créez votre script dans `scripts/`
2. Ajoutez une ligne dans `Dockerfile.cron` :

```dockerfile
RUN echo "0 4 * * * cd /app && npx tsx scripts/votre-script.ts >> /var/log/cron-votre-script.log 2>&1" >> /etc/crontabs/nodejs
```

3. Rebuild et redémarrez

## 📊 Monitoring

### Vérifier l'exécution des tâches

```bash
# Voir le dernier nettoyage
docker exec velvena-cron tail -20 /var/log/cron-audit-cleanup.log

# Compter le nombre d'exécutions
docker exec velvena-cron grep -c "Starting audit logs cleanup" /var/log/cron-audit-cleanup.log

# Voir les erreurs
docker exec velvena-cron grep "ERROR\|Failed" /var/log/cron-audit-cleanup.log
```

### Health check

Le service a un health check automatique :

```bash
# Vérifier le statut
docker-compose ps cron

# Devrait afficher : healthy
```

## 🐛 Dépannage

### Le cron ne démarre pas

```bash
# Vérifier les logs
docker-compose logs cron

# Vérifier la configuration de la base de données
docker exec velvena-cron npx prisma migrate status
```

### Les tâches ne s'exécutent pas

```bash
# Vérifier que crond tourne
docker exec velvena-cron ps aux | grep crond

# Vérifier la crontab
docker exec velvena-cron crontab -l -u nodejs

# Tester le script manuellement
docker exec velvena-cron npx tsx scripts/cleanup-audit-logs.ts
```

### Problèmes de permissions

```bash
# Vérifier les permissions des fichiers
docker exec velvena-cron ls -la /var/log/

# Vérifier l'utilisateur
docker exec velvena-cron whoami  # Devrait être "nodejs"
```

## 📝 Exemples de tâches cron

### Backup quotidien de la base

```dockerfile
RUN echo "0 3 * * * cd /app && ./scripts/backup-database.sh >> /var/log/cron-backup.log 2>&1" >> /etc/crontabs/nodejs
```

### Envoi de rapports hebdomadaires

```dockerfile
RUN echo "0 9 * * 1 cd /app && npx tsx scripts/send-weekly-report.ts >> /var/log/cron-reports.log 2>&1" >> /etc/crontabs/nodejs
```

### Nettoyage des fichiers temporaires

```dockerfile
RUN echo "0 1 * * * find /app/temp -type f -mtime +7 -delete >> /var/log/cron-cleanup.log 2>&1" >> /etc/crontabs/nodejs
```

## 🔄 Redémarrage

```bash
# Redémarrer le service cron
docker-compose restart cron

# Ou rebuild + redémarrer
docker-compose up -d --build cron
```

## 📚 Ressources

- Format crontab : https://crontab.guru/
- Documentation dcron : https://github.com/inter169/systs/tree/master/dcron
- Docker cron best practices : https://docs.docker.com/config/containers/multi-service_container/
