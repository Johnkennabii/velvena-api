# Audit Logs Cleanup - Script Cron

## Description

Ce script nettoie automatiquement les audit logs qui ont dépassé leur période de rétention (7 ans) conformément aux exigences RGPD.

## Utilisation manuelle

```bash
npx tsx scripts/cleanup-audit-logs.ts
```

## Configuration du Cron Job

### Option 1 : Crontab utilisateur

Éditez votre crontab :

```bash
crontab -e
```

Ajoutez cette ligne pour exécuter le nettoyage tous les jours à 2h du matin :

```cron
0 2 * * * cd /path/to/velvena && npx tsx scripts/cleanup-audit-logs.ts >> /var/log/velvena/audit-cleanup.log 2>&1
```

Remplacez `/path/to/velvena` par le chemin absolu de votre projet.

### Option 2 : Systemd Timer (Linux)

Créez un fichier service : `/etc/systemd/system/velvena-audit-cleanup.service`

```ini
[Unit]
Description=Velvena Audit Logs Cleanup
After=network.target

[Service]
Type=oneshot
User=velvena
WorkingDirectory=/path/to/velvena
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npx tsx scripts/cleanup-audit-logs.ts
StandardOutput=append:/var/log/velvena/audit-cleanup.log
StandardError=append:/var/log/velvena/audit-cleanup.log

[Install]
WantedBy=multi-user.target
```

Créez un fichier timer : `/etc/systemd/system/velvena-audit-cleanup.timer`

```ini
[Unit]
Description=Run Velvena Audit Cleanup Daily
Requires=velvena-audit-cleanup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Activez et démarrez le timer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable velvena-audit-cleanup.timer
sudo systemctl start velvena-audit-cleanup.timer

# Vérifier le statut
sudo systemctl status velvena-audit-cleanup.timer
```

### Option 3 : Docker Cron (si votre app tourne en Docker)

Ajoutez au Dockerfile :

```dockerfile
# Install cron
RUN apt-get update && apt-get install -y cron

# Add crontab
COPY docker/crontab /etc/cron.d/velvena-cron
RUN chmod 0644 /etc/cron.d/velvena-cron
RUN crontab /etc/cron.d/velvena-cron
```

Créez `docker/crontab` :

```cron
0 2 * * * cd /app && npx tsx scripts/cleanup-audit-logs.ts >> /var/log/velvena/audit-cleanup.log 2>&1
```

## Surveillance

### Vérifier les logs de nettoyage

```bash
tail -f /var/log/velvena/audit-cleanup.log
```

### Vérifier les derniers nettoyages avec Prisma

```typescript
import prisma from './src/lib/prisma.js';

// Compter les logs restants
const count = await prisma.auditLog.count();
console.log(`Total audit logs: ${count}`);

// Voir les logs les plus anciens
const oldest = await prisma.auditLog.findMany({
  orderBy: { created_at: 'asc' },
  take: 10,
  select: {
    id: true,
    action: true,
    created_at: true,
    retention_until: true,
  },
});
console.log('Oldest logs:', oldest);

// Compter les logs qui expirent bientôt (dans 30 jours)
const expiringSoon = await prisma.auditLog.count({
  where: {
    retention_until: {
      lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
});
console.log(`Logs expiring in next 30 days: ${expiringSoon}`);
```

## Bonnes pratiques

1. **Créer le dossier de logs** :
   ```bash
   sudo mkdir -p /var/log/velvena
   sudo chown velvena:velvena /var/log/velvena
   ```

2. **Rotation des logs** :
   Créez `/etc/logrotate.d/velvena` :
   ```
   /var/log/velvena/*.log {
       daily
       rotate 30
       compress
       delaycompress
       notifempty
       missingok
       create 0640 velvena velvena
   }
   ```

3. **Alertes** :
   Configurez des alertes si le nettoyage échoue :
   - Email via cron (MAILTO dans crontab)
   - Monitoring (Sentry, Datadog, etc.)
   - Logs centralisés (ELK, Loki, etc.)

## Tests

Tester le script manuellement :

```bash
# Test normal
npx tsx scripts/cleanup-audit-logs.ts

# Vérifier qu'aucune erreur n'est retournée
echo $?  # Devrait afficher 0
```

## Fréquence recommandée

- **Production** : 1 fois par jour (2h du matin)
- **Développement** : Pas nécessaire (ou 1 fois par semaine)
- **Staging** : 1 fois par semaine

## Notes importantes

- Les audit logs sont conservés **7 ans** conformément au RGPD
- Le nettoyage est **automatique** via le champ `retention_until`
- Aucune action manuelle n'est requise une fois le cron configuré
- Les logs sont supprimés **définitivement** (pas de soft delete)
