# 🚀 Checklist de déploiement en production

Date : 2025-12-17

## ⚠️ Changements critiques à déployer

### 1. Migrations de base de données (ORDRE IMPORTANT)

Les migrations suivantes doivent être exécutées dans cet ordre :

```bash
# 1. Ajouter les champs manager à Organization
prisma/migrations/20251215_add_organization_manager_fields/

# 2. Supprimer soft delete de PricingRule
prisma/migrations/20251215_remove_soft_delete_from_pricing_rule/

# 3. Ajouter structure JSON aux templates
prisma/migrations/20251215213702_add_template_structure/

# 4. Corriger la contrainte d'unicité des templates (CRITIQUE)
prisma/migrations/20251216221841_fix_template_unique_constraint/
```

### 2. Nouveaux fichiers backend

Fichiers qui doivent être déployés :

- ✅ `src/services/unifiedTemplateRenderer.ts` - Nouveau renderer unifié
- ✅ `src/types/templateStructure.ts` - Types TypeScript pour templates
- ✅ `src/middleware/contractPermissionMiddleware.ts` - Modifié (permissions paiement)
- ✅ `src/controllers/contractTemplateController.ts` - Modifié (hard delete + renderer unifié)

### 3. Modifications du schéma Prisma

```prisma
// ContractTemplate : Ajout de structure JSON + correction contrainte
model ContractTemplate {
  structure Json? // Nouveau champ pour templates JSON

  // Ancienne contrainte (SUPPRIMÉE) :
  // @@unique([contract_type_id, organization_id, is_default])

  // Nouvelle contrainte (INDEX PARTIEL) :
  // Permet plusieurs templates non-actifs ou non-default
  // CREATE UNIQUE INDEX WHERE is_default = true AND is_active = true
}
```

## 📝 Étapes de déploiement

### Étape 1 : Backup de la base de données de production

```bash
# Se connecter au serveur de production
ssh user@production-server

# Faire un backup complet de la base
pg_dump -h localhost -U velvena_user -d velvena_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Vérifier le backup
ls -lh backup_*.sql
```

### Étape 2 : Commit et push des changements

```bash
# Sur votre machine locale
cd /Users/johnkennabii/Documents/velvena

# Ajouter tous les nouveaux fichiers
git add src/services/unifiedTemplateRenderer.ts
git add src/types/templateStructure.ts
git add prisma/migrations/20251216221841_fix_template_unique_constraint/

# Commit des changements
git add -A
git commit -m "feat: unified template renderer + fix template constraints + payment permissions

- Add unified template renderer matching frontend exactly
- Fix ContractTemplate unique constraint (allow multiple non-default)
- Allow MANAGERs to update payment fields on signed contracts
- Add TypeScript types for template structures
- Implement hard delete for templates (with protection)

BREAKING CHANGES:
- Database migration required: 20251216221841_fix_template_unique_constraint
- Template system now supports JSON structure (backward compatible)
"

# Push vers le repo
git push origin main
```

### Étape 3 : Déployer sur le serveur de production

```bash
# Sur le serveur de production
cd /path/to/velvena-backend

# Pull les derniers changements
git pull origin main

# Installer les dépendances (si nouvelles)
npm install

# CRITIQUE : Appliquer les migrations Prisma
npx prisma migrate deploy

# Vérifier que les migrations sont appliquées
npx prisma migrate status

# Rebuild le projet TypeScript
npm run build

# Redémarrer l'application
pm2 restart velvena-backend
# OU
systemctl restart velvena-backend
```

### Étape 4 : Vérifications post-déploiement

```bash
# 1. Vérifier que l'API répond
curl https://api.velvena.com/health

# 2. Vérifier les logs
pm2 logs velvena-backend --lines 50

# 3. Tester la création d'un template
curl -X POST https://api.velvena.com/contract-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "contract_type_id": "UUID",
    "structure": {...},
    "is_active": true
  }'

# 4. Vérifier la contrainte en base de données
psql -U velvena_user -d velvena_prod -c "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'ContractTemplate'
  AND indexname LIKE '%unique%';
"
```

## 🔄 Rollback en cas de problème

Si quelque chose ne va pas, voici comment revenir en arrière :

```bash
# 1. Restaurer le backup de la base
psql -U velvena_user -d velvena_prod < backup_YYYYMMDD_HHMMSS.sql

# 2. Revenir au commit précédent
git log --oneline -5  # Trouver le commit précédent
git checkout COMMIT_HASH
npm run build
pm2 restart velvena-backend

# 3. OU annuler la dernière migration
npx prisma migrate resolve --rolled-back 20251216221841_fix_template_unique_constraint
```

## ⚠️ Points d'attention

1. **Contrainte d'unicité** : La migration `20251216221841_fix_template_unique_constraint` est CRITIQUE
   - Si elle échoue, vérifiez qu'il n'y a pas de doublons dans la table
   - SQL de diagnostic :
     ```sql
     SELECT contract_type_id, organization_id, is_default, is_active, COUNT(*)
     FROM "ContractTemplate"
     WHERE deleted_at IS NULL
     GROUP BY contract_type_id, organization_id, is_default, is_active
     HAVING COUNT(*) > 1;
     ```

2. **Permissions des MANAGERs** : Les MANAGERs peuvent maintenant modifier les paiements sur les contrats signés
   - Vérifiez que c'est bien le comportement souhaité en production

3. **Hard delete des templates** : Les templates sont maintenant supprimés définitivement (pas de soft delete)
   - Assurez-vous que les utilisateurs sont avertis
   - Vérifiez qu'aucun contrat n'utilise un template avant de le supprimer

## 📊 Statistiques à vérifier après déploiement

```sql
-- Nombre de templates par organisation
SELECT organization_id, COUNT(*)
FROM "ContractTemplate"
WHERE deleted_at IS NULL
GROUP BY organization_id;

-- Templates avec structure JSON vs HTML
SELECT
  COUNT(*) FILTER (WHERE structure IS NOT NULL) as json_templates,
  COUNT(*) FILTER (WHERE content IS NOT NULL AND structure IS NULL) as html_templates
FROM "ContractTemplate"
WHERE deleted_at IS NULL;

-- Vérifier les contraintes
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = '"ContractTemplate"'::regclass;
```

## ✅ Validation finale

- [ ] Backup de la base créé et vérifié
- [ ] Code déployé sans erreurs
- [ ] Migrations appliquées avec succès
- [ ] Application redémarrée
- [ ] API répond correctement
- [ ] Logs ne montrent pas d'erreurs
- [ ] Test de création de template réussi
- [ ] Test de suppression de template réussi
- [ ] Test de mise à jour de paiement sur contrat signé réussi
- [ ] Contrainte d'unicité vérifiée en base

## 🆘 Contacts en cas de problème

- Backend : John (vous)
- Base de données : [DBA contact]
- DevOps : [DevOps contact]
