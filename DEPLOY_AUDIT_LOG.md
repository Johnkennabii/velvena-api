# 🚀 Déploiement du système Audit Log en production

Date : 2025-12-20

## 📋 Changements à déployer

### Migration de base de données

```bash
prisma/migrations/20251220095849_add_audit_log_model/
```

Cette migration ajoute :
- Table `AuditLog` avec rétention de 7 ans (conformité RGPD)
- 8 indexes pour optimiser les requêtes
- Relations avec `Organization` et `User`

### Nouveaux fichiers backend

- ✅ `src/services/auditLogger.ts` - Service complet d'audit logging
- ✅ Modifications dans `src/services/accountDeletionService.ts` - Intégration de l'audit
- ✅ Modifications dans `src/routes/accountDeletionRoutes.ts` - Passage du context Request

### Nouveaux scripts

- `scripts/cleanup-audit-logs.ts` - Nettoyage automatique des logs expirés
- `scripts/test-audit-system.ts` - Suite de tests complète
- `scripts/README_AUDIT_CLEANUP.md` - Documentation

## 🎯 Étapes de déploiement

### Étape 1 : Backup de la base de données

```bash
# Se connecter au serveur de production
ssh user@production-server

# Créer un backup
docker exec velvena-postgres pg_dump -U velvena_user velvena_db > backup_audit_$(date +%Y%m%d_%H%M%S).sql

# Vérifier le backup
ls -lh backup_*.sql
```

### Étape 2 : Pull et build sur le serveur

```bash
# Sur le serveur de production
cd /path/to/velvena

# Pull les derniers changements
git pull origin main

# Rebuild les containers
docker-compose build api

# OU rebuild sans cache si nécessaire
docker-compose build --no-cache api
```

### Étape 3 : Appliquer la migration

**Option A : Avec docker-compose (RECOMMANDÉ)**

```bash
# Arrêter l'API temporairement
docker-compose stop api

# Appliquer les migrations
docker-compose run --rm api npx prisma migrate deploy

# Vérifier que la migration est appliquée
docker-compose run --rm api npx prisma migrate status

# Redémarrer l'API
docker-compose up -d api
```

**Option B : Directement dans le container**

```bash
# Exec dans le container API
docker exec -it velvena-api sh

# Dans le container :
npx prisma migrate deploy
npx prisma migrate status

# Quitter le container
exit

# Redémarrer l'API
docker-compose restart api
```

### Étape 4 : Démarrer le service cron

```bash
# Démarrer le nouveau service cron pour le nettoyage automatique
docker-compose up -d cron

# Vérifier que le service cron tourne
docker-compose ps cron

# Voir les logs du cron
docker-compose logs -f cron
```

### Étape 5 : Vérifications post-déploiement

```bash
# 1. Vérifier que la table AuditLog existe
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'AuditLog'
  );
"

# 2. Vérifier les indexes
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'AuditLog';
"

# 3. Vérifier que l'API répond
curl https://api.velvena.fr/health

# 4. Tester la création d'un audit log (via test de suppression de compte)
# Depuis votre frontend, demandez une suppression de compte

# 5. Vérifier qu'un audit log a été créé
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT id, action, status, created_at, retention_until
  FROM \"AuditLog\"
  ORDER BY created_at DESC
  LIMIT 5;
"

# 6. Vérifier les logs de l'API
docker-compose logs --tail=50 api | grep -i audit
```

## 🧪 Tests en production

### Test 1 : Créer un audit log

Depuis votre application frontend, testez le flow de suppression de compte :

1. Connectez-vous en tant que MANAGER
2. Allez dans Paramètres > Suppression de compte
3. Demandez la suppression → Un email est envoyé
4. Vérifiez que l'audit log est créé :

```bash
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT action, status, user_id, metadata->'user_email' as email, created_at
  FROM \"AuditLog\"
  WHERE action = 'ACCOUNT_DELETION_REQUESTED'
  ORDER BY created_at DESC
  LIMIT 1;
"
```

### Test 2 : Vérifier le nettoyage automatique

```bash
# Exécuter manuellement le script de nettoyage
docker exec velvena-api npx tsx scripts/cleanup-audit-logs.ts

# Devrait afficher : "No expired audit logs to clean up"
# (car les logs ont une rétention de 7 ans)
```

### Test 3 : Vérifier la période de rétention

```bash
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  SELECT
    id,
    action,
    created_at,
    retention_until,
    EXTRACT(YEAR FROM AGE(retention_until, created_at)) as retention_years
  FROM \"AuditLog\"
  ORDER BY created_at DESC
  LIMIT 5;
"

# Devrait afficher retention_years = 7 pour tous les logs
```

## 📊 Monitoring

### Vérifier le nombre d'audit logs

```sql
-- Total audit logs
SELECT COUNT(*) as total_audit_logs
FROM "AuditLog";

-- Par type d'action
SELECT action, COUNT(*) as count
FROM "AuditLog"
GROUP BY action
ORDER BY count DESC;

-- Par statut
SELECT status, COUNT(*) as count
FROM "AuditLog"
GROUP BY status;

-- Par organisation
SELECT
  o.name as organization_name,
  COUNT(al.id) as audit_count
FROM "Organization" o
LEFT JOIN "AuditLog" al ON al.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY audit_count DESC
LIMIT 10;
```

### Dashboard Grafana (optionnel)

Ajoutez un panel dans Grafana pour visualiser :

- Nombre d'audit logs créés par jour
- Distribution des actions (succès vs échecs)
- Top organisations avec le plus d'audit logs
- Taille de la table AuditLog

```sql
-- Pour Prometheus/Grafana : Nombre de logs par jour
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM "AuditLog"
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🔄 Rollback en cas de problème

Si la migration échoue ou cause des problèmes :

### Option 1 : Rollback de la migration

```bash
# 1. Restaurer le backup
docker exec -i velvena-postgres psql -U velvena_user velvena_db < backup_audit_YYYYMMDD_HHMMSS.sql

# 2. Marquer la migration comme rolled back
docker exec velvena-api npx prisma migrate resolve --rolled-back 20251220095849_add_audit_log_model

# 3. Redémarrer l'API
docker-compose restart api
```

### Option 2 : Supprimer manuellement la table

```bash
# En dernier recours, si la migration ne peut pas être rollback
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "
  DROP TABLE IF EXISTS \"AuditLog\" CASCADE;
"

# Puis marquer la migration comme rolled back
docker exec velvena-api npx prisma migrate resolve --rolled-back 20251220095849_add_audit_log_model
```

## ⚠️ Points d'attention

1. **Performance** : La table `AuditLog` va grandir avec le temps
   - 8 indexes sont créés pour optimiser les requêtes
   - Le nettoyage automatique supprime les logs > 7 ans
   - Surveillez la taille de la table avec `pg_total_relation_size('"AuditLog"')`

2. **Rétention RGPD** : Les logs sont conservés 7 ans
   - Conformité avec les exigences RGPD
   - Nettoyage automatique via le service cron

3. **Relations** : Les audit logs ont des foreign keys avec `Organization` et `User`
   - `ON DELETE SET NULL` → Si une organisation/user est supprimée, les logs restent mais sans référence
   - Cela permet de conserver l'historique même après suppression

## ✅ Checklist de validation

- [ ] Backup de la base créé et vérifié
- [ ] Code déployé (git pull + docker-compose build)
- [ ] Migration appliquée (prisma migrate deploy)
- [ ] Table AuditLog créée
- [ ] Indexes créés (8 indexes)
- [ ] Service cron démarré
- [ ] API redémarrée et répond correctement
- [ ] Test de création d'audit log réussi
- [ ] Logs ne montrent pas d'erreurs
- [ ] Période de rétention vérifiée (7 ans)

## 📞 Support

En cas de problème :
- Vérifier les logs : `docker-compose logs -f api`
- Vérifier les migrations : `docker exec velvena-api npx prisma migrate status`
- Contacter : John (backend)
