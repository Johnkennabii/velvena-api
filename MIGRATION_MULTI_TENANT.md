# Migration Multi-Tenant - Instructions Complètes

Ce document contient toutes les instructions pour migrer l'application vers une architecture multi-tenant.

## 🎯 Objectif

Transformer l'application mono-tenant actuelle en une application multi-tenant où :
- Chaque organisation a ses propres données (clients, robes, contrats, prospects)
- Les données de référence peuvent être globales OU spécifiques à une organisation
- Un utilisateur appartient à une seule organisation
- Les données sont strictement isolées entre organisations

## ⚠️ IMPORTANT - Avant de Commencer

**CETTE MIGRATION VA MODIFIER VOTRE SCHÉMA DE BASE DE DONNÉES**

1. **Faites une sauvegarde complète de votre base de données**
   ```bash
   pg_dump -U your_user -d your_database > backup_before_migration.sql
   ```

2. **Testez d'abord sur un environnement de développement/staging**

3. **Assurez-vous que personne n'utilise l'application pendant la migration**

## 📋 Pré-requis

- [x] Node.js installé
- [x] PostgreSQL installé et configuré
- [x] Dépendances installées (`npm install`)
- [x] Fichier `.env` configuré avec DATABASE_URL
- [ ] Sauvegarde de la base de données effectuée

## 🚀 Étapes de Migration

### Étape 1 : Installation des dépendances

Si ce n'est pas déjà fait :

```bash
cd /Users/johnkennabii/Documents/velvena
npm install
```

### Étape 2 : Vérifier la configuration

Assurez-vous que votre `.env` contient :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/velvena?schema=public"
JWT_SECRET="your-secret-key-change-in-production"

# ... autres variables
```

### Étape 3 : Générer le client Prisma

```bash
npm run prisma:generate
```

### Étape 4 : Créer et appliquer la migration

```bash
# Créer la migration
npx prisma migrate dev --name add_multi_tenant_architecture

# OU si vous avez déjà des migrations en attente
npx prisma migrate dev
```

**Note :** Prisma va détecter tous les changements dans `schema.prisma` et générer automatiquement la migration SQL.

### Étape 5 : Exécuter le seed

Le seed va créer :
- Une organisation par défaut
- Les rôles globaux (super_admin, admin, manager, user)
- Les données de référence globales (types, tailles, couleurs, conditions)
- Un super-admin et un utilisateur de test

```bash
npm run prisma:seed
```

Vous devriez voir :

```
🌱 Starting seed...
📦 Creating default organization...
✅ Organization created: Default Organization (uuid)
👥 Creating global roles...
  ✅ Role: super_admin
  ✅ Role: admin
  ✅ Role: manager
  ✅ Role: user
...
🎉 Seed completed successfully!

🔑 Login credentials:
   Super Admin: admin@velvena.com / admin123
   Test User: user@velvena.com / user123
```

### Étape 6 : Mettre à jour server.ts

Ajoutez la route des organisations dans `src/server.ts` :

```typescript
import organizationRoutes from "./routes/organizations.js";

// ... après les autres routes

app.use("/organizations", organizationRoutes);
```

### Étape 7 : Vérifier la migration

Connectez-vous à votre base de données et vérifiez :

```sql
-- Vérifier que l'organisation existe
SELECT * FROM "Organization";

-- Vérifier que tous les users ont un organization_id
SELECT COUNT(*) FROM "User" WHERE "organization_id" IS NULL;
-- Résultat attendu: 0

-- Vérifier que toutes les robes ont un organization_id
SELECT COUNT(*) FROM "Dress" WHERE "organization_id" IS NULL;
-- Résultat attendu: 0

-- Vérifier les rôles globaux
SELECT * FROM "Role" WHERE "organization_id" IS NULL;

-- Vérifier les données de référence globales
SELECT * FROM "DressType" WHERE "organization_id" IS NULL;
SELECT * FROM "DressColor" WHERE "organization_id" IS NULL;
```

### Étape 8 : Build et démarrer l'application

```bash
# Build
npm run build

# Démarrer
npm run dev
```

### Étape 9 : Tester l'authentification

```bash
# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@velvena.com",
    "password": "admin123"
  }'
```

Vous devriez recevoir :

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": "uuid",
  "email": "admin@velvena.com",
  "role": "super_admin",
  "organization": {
    "id": "org-uuid",
    "name": "Default Organization",
    "slug": "default"
  }
}
```

### Étape 10 : Tester les endpoints organizations

```bash
# Récupérer votre organisation (utilisez le token du login)
TOKEN="your-jwt-token"

curl http://localhost:3000/organizations/me \
  -H "Authorization: Bearer $TOKEN"

# Statistiques de l'organisation
curl http://localhost:3000/organizations/me/stats \
  -H "Authorization: Bearer $TOKEN"
```

## 🔄 Migration des Contrôleurs

**IMPORTANT :** Les contrôleurs existants doivent être migrés un par un.

Consultez le fichier `MULTI_TENANT_MIGRATION_GUIDE.md` pour :
- Les patterns de migration
- Des exemples AVANT/APRÈS
- Une checklist par contrôleur
- Les bonnes pratiques

### Ordre de migration recommandé :

1. **Données de référence** (faible impact)
   - [ ] `dressTypeController.ts`
   - [ ] `dressSizeController.ts`
   - [ ] `dressColorController.ts`
   - [ ] `dressConditionController.ts`
   - [ ] `contractTypeController.ts`
   - [ ] `contractPackageController.ts`
   - [ ] `contractAddonController.ts`

2. **Données métier** (impact moyen)
   - [ ] `dressController.ts`
   - [ ] `customerController.ts`
   - [ ] `prospectController.ts`

3. **Contrats** (impact élevé - le plus complexe)
   - [ ] `contractController.ts`

4. **Utilisateurs** (déjà partiellement fait)
   - [x] `authController.ts` (fait)
   - [ ] `userController.ts`
   - [ ] `profileController.ts`
   - [ ] `roleController.ts`

### Exemple de migration simple (DressType)

**AVANT:**
```typescript
export const getDressTypes = async (req: AuthenticatedRequest, res: Response) => {
  const types = await prisma.dressType.findMany({
    where: { deleted_at: null },
  });
  res.json(types);
};
```

**APRÈS:**
```typescript
import { withOrgOrGlobal } from "../../utils/tenantHelper.js";

export const getDressTypes = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({ error: "Organization context required" });
  }

  // Récupère les types globaux + ceux de l'organisation
  const types = await prisma.dressType.findMany({
    where: withOrgOrGlobal(req.user.organizationId, { deleted_at: null }),
    orderBy: { name: "asc" },
  });

  res.json(types);
};
```

## 🧪 Tests de Validation

Après la migration complète, testez :

### Test 1 : Isolation des données

```bash
# Créer une 2ème organisation (super-admin uniquement)
curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boutique Paris",
    "slug": "boutique-paris",
    "email": "paris@example.com"
  }'

# Créer un utilisateur dans cette org
# (code à adapter)

# Vérifier qu'un utilisateur de l'org 1 ne peut PAS voir les données de l'org 2
```

### Test 2 : Données globales

```bash
# Les types de robes globaux doivent être visibles par toutes les orgs
curl http://localhost:3000/dress-types \
  -H "Authorization: Bearer $TOKEN_ORG_1"

curl http://localhost:3000/dress-types \
  -H "Authorization: Bearer $TOKEN_ORG_2"

# Les deux doivent retourner les types globaux + leurs types spécifiques
```

### Test 3 : Création de ressources

```bash
# Créer une robe - elle doit automatiquement être associée à l'organisation
curl -X POST http://localhost:3000/dresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Robe Rouge",
    "reference": "RR-001",
    "price_ht": 100,
    "price_ttc": 120,
    "price_per_day_ht": 30,
    "price_per_day_ttc": 36
  }'

# Vérifier que organization_id est bien renseigné
```

## 🔐 Sécurité

### Changements de mots de passe

**IMMÉDIATEMENT après la migration :**

```bash
# Connectez-vous avec admin@velvena.com
# Changez le mot de passe via l'interface ou avec SQL:

UPDATE "User"
SET "password" = '$2b$10$NEW_HASHED_PASSWORD'
WHERE "email" = 'admin@velvena.com';
```

### Variables d'environnement

Mettez à jour votre `.env` en production :

```env
JWT_SECRET="PRODUCTION_SECRET_CHANGE_THIS_TO_RANDOM_STRING"
```

Générez une clé aléatoire :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 Monitoring Post-Migration

Surveillez ces métriques après la migration :

1. **Temps de réponse des endpoints**
   - Les requêtes avec `organization_id` devraient rester rapides
   - Vérifiez les index PostgreSQL

2. **Logs d'erreurs**
   - Recherchez les erreurs liées à `organization_id`
   - Surveillez les tentatives d'accès cross-org

3. **Intégrité des données**
   ```sql
   -- Vérifier l'intégrité
   SELECT
     (SELECT COUNT(*) FROM "User" WHERE "organization_id" IS NULL) as users_sans_org,
     (SELECT COUNT(*) FROM "Dress" WHERE "organization_id" IS NULL) as dresses_sans_org,
     (SELECT COUNT(*) FROM "Customer" WHERE "organization_id" IS NULL) as customers_sans_org;
   ```

## 🐛 Troubleshooting

### Erreur : "organization_id cannot be null"

**Cause :** Une requête essaie de créer une ressource sans `organization_id`

**Solution :**
```typescript
// Utilisez withOrgData()
const dress = await prisma.dress.create({
  data: withOrgData(req.user.organizationId, req.user.id, {
    // vos données
  })
});
```

### Erreur : "User is not assigned to an organization"

**Cause :** Un utilisateur existe sans `organization_id`

**Solution :**
```sql
-- Assigner l'utilisateur à l'org par défaut
UPDATE "User"
SET "organization_id" = (SELECT id FROM "Organization" WHERE slug = 'default')
WHERE "organization_id" IS NULL;
```

### Erreur : "Unique constraint failed"

**Cause :** Les contraintes uniques ont changé (ex: email + organization_id)

**Solution :**
- Les emails peuvent maintenant être dupliqués entre organisations
- Les références de robes peuvent être dupliquées entre organisations
- Vérifiez que vous n'essayez pas de créer un doublon dans la MÊME organisation

### Les données de référence globales ne s'affichent pas

**Cause :** Le seed n'a pas été exécuté ou a échoué

**Solution :**
```bash
npm run prisma:seed
```

### Migration Prisma échoue

**Cause :** Conflits dans le schéma ou données incompatibles

**Solution :**
```bash
# Réinitialiser (ATTENTION: supprime toutes les données!)
npx prisma migrate reset

# OU restaurer depuis la sauvegarde
psql -U your_user -d your_database < backup_before_migration.sql
```

## 🔄 Rollback (Retour Arrière)

Si la migration échoue et que vous devez revenir en arrière :

### Option 1 : Restaurer depuis la sauvegarde

```bash
# Supprimer la base actuelle
dropdb -U your_user your_database

# Recréer
createdb -U your_user your_database

# Restaurer
psql -U your_user -d your_database < backup_before_migration.sql
```

### Option 2 : Revert Git + Rollback migrations

```bash
# Revert les changements de code
git reset --hard <commit-avant-migration>

# Rollback Prisma
npx prisma migrate resolve --rolled-back <migration-name>
```

## 📚 Documentation

- **Architecture :** Voir `MULTI_TENANT_MIGRATION_GUIDE.md`
- **Helpers :** `src/utils/tenantHelper.ts`
- **Exemples :** `src/controllers/organizationController.ts`
- **Middleware :** `src/middleware/tenantMiddleware.ts`

## ✅ Checklist Finale

Avant de mettre en production :

- [ ] Sauvegarde de la base de données effectuée
- [ ] Migration testée sur environnement de staging
- [ ] Tous les contrôleurs migrés et testés
- [ ] Tests d'isolation multi-tenant passés
- [ ] Mots de passe par défaut changés
- [ ] JWT_SECRET changé en production
- [ ] Monitoring en place
- [ ] Documentation mise à jour
- [ ] Équipe formée sur la nouvelle architecture

## 🆘 Support

En cas de problème :

1. Consultez la section Troubleshooting ci-dessus
2. Vérifiez les logs : `npm run dev` (mode développement avec logs détaillés)
3. Examinez les migrations Prisma : `prisma/migrations/`
4. Testez les helpers : `src/utils/tenantHelper.ts`

## 🎉 Prochaines Étapes

Après une migration réussie :

1. **Créer vos vraies organisations**
   ```typescript
   POST /organizations
   {
     "name": "Ma Boutique",
     "slug": "ma-boutique",
     "email": "contact@ma-boutique.com"
   }
   ```

2. **Inviter des utilisateurs**
   ```typescript
   POST /auth/register
   {
     "email": "user@ma-boutique.com",
     "password": "...",
     "roleName": "user"
   }
   ```

3. **Importer les données métier**
   - Robes, clients, contrats, etc.
   - Elles seront automatiquement associées à l'organisation

4. **Configurer les données de référence spécifiques**
   - Types de robes personnalisés
   - Couleurs spécifiques
   - Packages de contrats sur-mesure

Bonne migration ! 🚀
