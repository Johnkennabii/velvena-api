# 🚀 Déploiement Manuel - Guide Étape par Étape

Date : 2025-12-17
Commit à déployer : `f1f80cf`

## Prérequis

Assurez-vous d'avoir :
- ✅ Accès SSH au serveur de production
- ✅ Les credentials pour la base de données
- ✅ Docker et Docker Compose installés sur le serveur

## 📋 Étape 1 : Connexion au serveur

```bash
# Remplacez par vos vraies informations
ssh user@your-production-server.com

# Ou si vous utilisez une clé SSH spécifique
ssh -i ~/.ssh/your_key.pem user@your-production-server.com
```

## 📦 Étape 2 : Backup de la base de données

**TRÈS IMPORTANT : Ne sautez JAMAIS cette étape !**

```bash
# Aller dans le dossier du projet
cd /opt/velvena

# Créer un backup complet
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T postgres pg_dump -U velvena_user -d velvena_db > "/opt/velvena/backups/$BACKUP_FILE"

# Vérifier que le backup existe et a une taille raisonnable
ls -lh "/opt/velvena/backups/$BACKUP_FILE"

# Garder le nom du backup pour un éventuel rollback
echo "Backup créé : $BACKUP_FILE"
```

## 🔄 Étape 3 : Pull du code

```bash
# Vérifier la branche actuelle
git branch

# Fetch les dernières modifications
git fetch origin

# Pull la branche main
git pull origin main

# Vérifier qu'on est bien sur le commit f1f80cf
git log --oneline -1
# Devrait afficher : f1f80cf fix: resolve TypeScript compilation errors
```

## 📦 Étape 4 : Installation des dépendances

```bash
# Si le package.json a changé (optionnel, mais recommandé)
docker-compose run --rm api npm install
```

## 🗃️ Étape 5 : Appliquer les migrations Prisma

**CRITIQUE : Cette étape applique les 4 migrations en attente**

```bash
# Vérifier l'état actuel des migrations
docker-compose run --rm api npx prisma migrate status

# Appliquer toutes les migrations en attente
docker-compose run --rm api npx prisma migrate deploy

# Vérifier que toutes les migrations sont appliquées
docker-compose run --rm api npx prisma migrate status
# Devrait afficher : "No pending migrations"
```

**Migrations qui seront appliquées :**
1. `20251215_add_organization_manager_fields` - Ajoute les champs manager à Organization
2. `20251215_remove_soft_delete_from_pricing_rule` - Supprime soft delete de PricingRule
3. `20251215213702_add_template_structure` - Ajoute structure JSON aux templates
4. `20251216221841_fix_template_unique_constraint` - Corrige la contrainte d'unicité (CRITIQUE)

## 🔨 Étape 6 : Rebuild et redémarrage de l'application

```bash
# Rebuild l'image Docker avec le nouveau code
docker-compose build api

# Redémarrer avec zero-downtime
docker-compose up -d --no-deps api

# Attendre que le container démarre (environ 30 secondes)
echo "Attente du démarrage du container..."
sleep 30
```

## 🔍 Étape 7 : Vérifications

### 7.1 Vérifier les logs du container

```bash
# Voir les derniers logs
docker-compose logs api --tail=50

# Rechercher des erreurs
docker-compose logs api --tail=100 | grep -i error

# Vérifier que le serveur écoute bien sur 0.0.0.0
docker-compose logs api --tail=20 | grep "running on"
# Devrait afficher : "API + Socket.IO running on http://0.0.0.0:3000"
```

### 7.2 Tester le health check (depuis le container)

```bash
# Test depuis l'intérieur du container
docker-compose exec api curl -f http://localhost:3000/health

# Devrait retourner un JSON avec "status": "healthy"
```

### 7.3 Tester le health check (depuis Nginx)

```bash
# Test depuis le réseau Docker
docker-compose exec nginx curl -f http://api:3000/health

# Devrait retourner le même JSON
```

### 7.4 Tester depuis l'extérieur

```bash
# Depuis votre machine locale (ou depuis le serveur)
curl -f https://api.velvena.fr/health

# Devrait retourner :
# {
#   "status": "healthy",
#   "database": "connected",
#   ...
# }
```

## 🔄 Étape 8 : Recharger Nginx (si nécessaire)

```bash
# Recharger la configuration Nginx
docker-compose exec nginx nginx -s reload

# Ou redémarrer Nginx si le reload ne fonctionne pas
docker-compose restart nginx
```

## ✅ Étape 9 : Validations finales

```bash
# 1. Vérifier que tous les containers sont UP
docker-compose ps

# 2. Vérifier la santé du container API
docker inspect velvena-api | grep -i health

# 3. Tester une requête API réelle
curl -X GET https://api.velvena.fr/organizations

# 4. Vérifier les migrations appliquées
docker-compose exec postgres psql -U velvena_user -d velvena_db -c "
  SELECT indexname
  FROM pg_indexes
  WHERE tablename = 'ContractTemplate'
  AND indexname LIKE '%unique%';
"
# Devrait afficher la nouvelle contrainte : ContractTemplate_unique_active_default_per_type_org

# 5. Vérifier qu'on peut créer un template
curl -X POST https://api.velvena.fr/contract-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Deployment",
    "contract_type_id": "YOUR_CONTRACT_TYPE_ID",
    "structure": {
      "version": "2.0",
      "metadata": {"name": "Test", "description": "Test", "category": "test"},
      "sections": []
    },
    "is_active": true
  }'
```

## 🆘 Étape 10 : Rollback (si problème)

**Si quelque chose ne va pas, voici comment revenir en arrière :**

```bash
# 1. Restaurer le backup de la base
BACKUP_FILE="backup_YYYYMMDD_HHMMSS.sql"  # Remplacer par le nom du backup
docker-compose exec -T postgres psql -U velvena_user -d velvena_db < "/opt/velvena/backups/$BACKUP_FILE"

# 2. Revenir au commit précédent
git log --oneline -5  # Trouver le commit avant f1f80cf
git checkout COMMIT_HASH  # Exemple : b7bdbaf

# 3. Rebuild et redémarrer
docker-compose build api
docker-compose up -d --no-deps api

# 4. Vérifier
curl -f https://api.velvena.fr/health
```

## 📊 Commandes de monitoring

```bash
# Voir les ressources utilisées
docker stats velvena-api

# Voir tous les logs en temps réel
docker-compose logs -f api

# Vérifier les connexions à la base
docker-compose exec postgres psql -U velvena_user -d velvena_db -c "
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE datname = 'velvena_db';
"

# Vérifier l'espace disque
df -h
docker system df
```

## 🎯 Points de contrôle de succès

Cochez chaque point au fur et à mesure :

- [ ] Backup créé et vérifié
- [ ] Code pullé avec succès (commit f1f80cf)
- [ ] 4 migrations appliquées sans erreur
- [ ] Container API redémarré
- [ ] Logs ne montrent pas d'erreurs critiques
- [ ] Health check interne (localhost:3000) répond 200
- [ ] Health check Nginx (api:3000) répond 200
- [ ] Health check public (api.velvena.fr) répond 200
- [ ] Nouvelle contrainte d'unicité présente en base
- [ ] API répond correctement aux requêtes

## 📞 Contacts en cas de problème

- **Backend** : John (vous)
- **Logs** : `/opt/velvena/logs/` ou `docker-compose logs`
- **Monitoring** : https://monitoring.velvena.fr (Grafana)

## 📝 Notes importantes

1. **Migrations irréversibles** : Une fois appliquées, les migrations ne peuvent pas être annulées automatiquement. C'est pourquoi le backup est CRITIQUE.

2. **Contrainte d'unicité** : La migration `fix_template_unique_constraint` change la logique métier. Testez bien la création de templates après.

3. **Zero-downtime** : L'utilisation de `--no-deps` permet de ne redémarrer que l'API sans toucher à Postgres, Redis, etc.

4. **Health check delay** : Attendez au moins 30 secondes avant de tester, le temps que Node.js démarre et se connecte à la base.

---

**Bonne chance avec le déploiement ! 🚀**
