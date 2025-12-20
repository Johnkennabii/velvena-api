# 🚀 Déploiement rapide en production - Audit Log

## 📝 Résumé des changements

Vous venez d'implémenter :
- ✅ Système d'audit logging avec rétention de 7 ans (RGPD)
- ✅ Service Docker cron pour nettoyage automatique
- ✅ Suite de tests complète
- ✅ Documentation de déploiement

## 🎯 Commandes rapides de déploiement

### Sur votre serveur de production

```bash
# 1. Se connecter au serveur
ssh user@votre-serveur-production

# 2. Aller dans le dossier du projet
cd /path/to/velvena

# 3. Backup de la base (IMPORTANT !)
docker exec velvena-postgres pg_dump -U velvena_user velvena_db > backup_audit_$(date +%Y%m%d_%H%M%S).sql

# 4. Pull les derniers changements
git pull origin main

# 5. Rebuild les containers
docker-compose build api cron

# 6. Appliquer la migration de la base de données
docker-compose run --rm api npx prisma migrate deploy

# 7. Vérifier que la migration est appliquée
docker-compose run --rm api npx prisma migrate status

# 8. Redémarrer l'API
docker-compose up -d api

# 9. Démarrer le service cron
docker-compose up -d cron

# 10. Vérifier que tout fonctionne
docker-compose ps
```

## ✅ Vérifications post-déploiement

```bash
# 1. Vérifier que la table AuditLog existe
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'AuditLog'
  );
"
# Devrait retourner: t (true)

# 2. Vérifier les logs de l'API
docker-compose logs --tail=50 api | grep -i audit

# 3. Vérifier que le cron tourne
docker-compose ps cron
# Devrait afficher: Up + healthy

# 4. Tester le cron manuellement
docker exec velvena-cron npx tsx scripts/cleanup-audit-logs.ts
# Devrait afficher: "No expired audit logs to clean up"

# 5. Vérifier les logs du cron
docker exec velvena-cron cat /var/log/cron-audit-cleanup.log
```

## 🧪 Test de l'audit logging

Depuis votre application frontend :

1. Connectez-vous en tant que MANAGER ou ADMIN
2. Allez dans Paramètres > Suppression de compte
3. Demandez la suppression de compte
4. Vérifiez qu'un audit log a été créé :

```bash
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT
    action,
    status,
    created_at,
    EXTRACT(YEAR FROM AGE(retention_until, created_at)) as retention_years
  FROM \"AuditLog\"
  ORDER BY created_at DESC
  LIMIT 5;
"
```

Vous devriez voir :
- `action`: ACCOUNT_DELETION_REQUESTED
- `status`: SUCCESS
- `retention_years`: 7

## 📊 Monitoring

### Voir tous les audit logs

```bash
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT action, COUNT(*) as count
  FROM \"AuditLog\"
  GROUP BY action
  ORDER BY count DESC;
"
```

### Voir les logs du service cron

```bash
# Logs du container
docker-compose logs -f cron

# Logs du script de nettoyage
docker exec velvena-cron tail -f /var/log/cron-audit-cleanup.log
```

## 🔄 Rollback en cas de problème

```bash
# 1. Restaurer le backup
docker exec -i velvena-postgres psql -U velvena_user velvena_db < backup_audit_YYYYMMDD_HHMMSS.sql

# 2. Marquer la migration comme rolled back
docker exec velvena-api npx prisma migrate resolve --rolled-back 20251220095849_add_audit_log_model

# 3. Redémarrer
docker-compose restart api
```

## 📁 Fichiers importants

- **DEPLOY_AUDIT_LOG.md** - Guide complet de déploiement
- **docker/README_CRON.md** - Documentation du service cron
- **Dockerfile.cron** - Configuration du container cron
- **scripts/cleanup-audit-logs.ts** - Script de nettoyage
- **scripts/test-audit-system.ts** - Suite de tests

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f api cron`
2. Vérifiez la migration : `docker exec velvena-api npx prisma migrate status`
3. Consultez **DEPLOY_AUDIT_LOG.md** pour les détails

## 🎉 C'est tout !

Une fois déployé, le système :
- ✅ Logge automatiquement toutes les opérations critiques
- ✅ Conserve les logs pendant 7 ans (RGPD)
- ✅ Nettoie automatiquement les logs expirés (tous les jours à 2h)
- ✅ Permet de tracer toutes les actions de suppression de compte
