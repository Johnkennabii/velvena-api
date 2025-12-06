# 🏢 Velvena - Architecture Multi-Tenant

Bienvenue dans l'API Velvena avec support multi-tenant ! Ce README vous guide à travers la migration et l'utilisation de l'architecture multi-tenant.

## 📚 Documentation

La migration multi-tenant est documentée dans plusieurs fichiers :

### 1. 🚀 **Démarrage Rapide**
**Fichier :** `MIGRATION_MULTI_TENANT.md`

Instructions complètes étape par étape pour :
- ✅ Installer les dépendances
- ✅ Appliquer la migration de base de données
- ✅ Exécuter le seed
- ✅ Tester l'application
- ✅ Rollback en cas de problème

**👉 COMMENCEZ ICI si vous voulez migrer maintenant !**

### 2. 📖 **Guide de Migration des Contrôleurs**
**Fichier :** `MULTI_TENANT_MIGRATION_GUIDE.md`

Guide complet pour migrer les contrôleurs existants :
- Patterns de migration AVANT/APRÈS
- Helpers disponibles (`withOrgFilter`, `withOrgData`, etc.)
- Checklist par type de contrôleur
- Bonnes pratiques et pièges à éviter

**👉 Consultez ce guide pour migrer les contrôleurs un par un**

### 3. 💡 **Exemple Concret**
**Fichier :** `EXAMPLE_CONTROLLER_MIGRATION.md`

Exemple complet de migration du Customer Controller :
- Code complet AVANT et APRÈS
- Tous les changements expliqués ligne par ligne
- Tests à effectuer
- Checklist de validation

**👉 Référez-vous à cet exemple lors de la migration**

### 4. 📊 **Résumé de la Migration**
**Fichier :** `MULTI_TENANT_SUMMARY.md`

Vue d'ensemble de tout ce qui a été fait :
- Architecture complète
- Fichiers créés et modifiés
- Ce qui reste à faire
- Impact sur la base de données
- Fonctionnalités activées

**👉 Pour comprendre la vue d'ensemble**

## 🎯 Quick Start

### Prérequis

```bash
# Node.js et npm
node --version  # >= 18.x
npm --version   # >= 9.x

# PostgreSQL
psql --version  # >= 14.x
```

### Installation

```bash
# 1. Cloner et naviguer
cd /Users/johnkennabii/Documents/velvena

# 2. Installer les dépendances
npm install

# 3. Configurer .env (copier depuis .env.example)
cp .env.example .env
# Éditer .env avec vos paramètres de base de données

# 4. Générer le client Prisma
npm run prisma:generate
```

### Migration Multi-Tenant

```bash
# 1. BACKUP DE LA BASE (IMPORTANT!)
pg_dump -U your_user -d velvena > backup_$(date +%Y%m%d).sql

# 2. Appliquer la migration
npx prisma migrate dev --name add_multi_tenant_architecture

# 3. Seed (créer organisation + données de référence + users)
npm run prisma:seed

# 4. Vérifier
npm run dev
```

### Test

```bash
# Login avec le super-admin créé par le seed
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@velvena.com",
    "password": "admin123"
  }'

# Vous devriez recevoir un token + les infos d'organisation
```

## 🏗️ Architecture

### Modèle d'Organisation

```typescript
Organization {
  id: UUID
  name: string                    // "Boutique Paris"
  slug: string (unique)           // "boutique-paris"
  email?: string                  // contact email
  phone?: string
  address, city, postal_code, country
  logo_url?: string
  settings: JSON                  // Configuration custom
  subscription_plan: string       // "free" | "basic" | "pro" | "enterprise"
  trial_ends_at?: Date
  is_active: boolean              // Pour désactiver une org

  // Relations
  users: User[]
  dresses: Dress[]
  customers: Customer[]
  prospects: Prospect[]
  contracts: Contract[]
  // ... données de référence
}
```

### Modèles avec organization_id REQUIS

- `User` - Utilisateurs
- `Dress` - Robes
- `Customer` - Clients
- `Prospect` - Prospects
- `Contract` - Contrats

### Modèles avec organization_id OPTIONNEL (Hybride)

Quand `organization_id` est `null`, l'enregistrement est **global** (partagé entre toutes les organisations).

- `DressType`, `DressSize`, `DressColor`, `DressCondition`
- `ContractType`, `ContractPackage`, `ContractAddon`
- `Role`

Exemple :
```typescript
// Type de robe global (visible par tous)
{ name: "Robe de soirée", organization_id: null }

// Type spécifique à l'organisation Paris
{ name: "Robe sur-mesure", organization_id: "org-paris-uuid" }
```

## 🛠️ Helpers Multi-Tenant

Le fichier `src/utils/tenantHelper.ts` fournit des helpers pour simplifier les requêtes multi-tenant :

```typescript
import {
  withOrgFilter,
  withOrgOrGlobal,
  withOrgData,
  validateOrgOwnership,
} from "./utils/tenantHelper.js";

// 1. Filtrer par organisation
const customers = await prisma.customer.findMany({
  where: withOrgFilter(req.user.organizationId, { deleted_at: null }),
});

// 2. Inclure items globaux + org-specific
const dressTypes = await prisma.dressType.findMany({
  where: withOrgOrGlobal(req.user.organizationId, { deleted_at: null }),
});

// 3. Créer avec organization_id automatique
const dress = await prisma.dress.create({
  data: withOrgData(req.user.organizationId, req.user.id, {
    name: "Robe Rouge",
    reference: "RR-001",
    // ...
  }),
});

// 4. Valider qu'une ressource appartient à l'org
const dress = await prisma.dress.findUnique({ where: { id } });
validateOrgOwnership(dress, req.user.organizationId, "Dress");
// Throw error si pas dans l'org
```

## 🔐 Authentification

### Login

L'endpoint de login retourne maintenant les informations d'organisation :

```typescript
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Réponse:
{
  "token": "eyJhbGc...",
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "organization": {
    "id": "org-uuid",
    "name": "Boutique Paris",
    "slug": "boutique-paris"
  }
}
```

### Token JWT

Le JWT contient toujours les mêmes infos, mais lors de l'authentification, le middleware récupère automatiquement l'`organization_id` de l'utilisateur et l'expose dans `req.user.organizationId`.

### Middleware

```typescript
// Dans vos routes protégées
import authMiddleware from "./middleware/authMiddleware.js";

router.get("/customers", authMiddleware, getCustomers);

// Dans le controller
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  // req.user.organizationId est automatiquement disponible
  const customers = await prisma.customer.findMany({
    where: { organization_id: req.user.organizationId },
  });
};
```

## 🌐 Endpoints Organizations

### GET /organizations/me
Récupère l'organisation de l'utilisateur connecté

```bash
curl http://localhost:3000/organizations/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PUT /organizations/me
Met à jour l'organisation (admin uniquement)

```bash
curl -X PUT http://localhost:3000/organizations/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau nom",
    "email": "nouveau@email.com"
  }'
```

### GET /organizations/me/stats
Statistiques de l'organisation

```bash
curl http://localhost:3000/organizations/me/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Retourne:
{
  "users": 5,
  "dresses": 120,
  "customers": 89,
  "prospects": 34,
  "active_contracts": 12
}
```

### POST /organizations (Super Admin)
Créer une nouvelle organisation

```bash
curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boutique Lyon",
    "slug": "boutique-lyon",
    "email": "contact@lyon.com",
    "subscription_plan": "pro"
  }'
```

## 🧪 Tests

### Test d'Isolation

Pour vérifier que les données sont bien isolées entre organisations :

```bash
# 1. Créer 2 organisations
# 2. Créer un utilisateur dans chaque organisation
# 3. Créer des ressources (dresses, customers) dans chaque org
# 4. Vérifier qu'un user de org1 ne voit PAS les données de org2

# Login org 1
TOKEN1=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@org1.com","password":"pass"}' \
  | jq -r '.token')

# Login org 2
TOKEN2=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@org2.com","password":"pass"}' \
  | jq -r '.token')

# Récupérer les customers de org1
curl http://localhost:3000/customers -H "Authorization: Bearer $TOKEN1"
# Doit retourner seulement les customers de org1

# Récupérer les customers de org2
curl http://localhost:3000/customers -H "Authorization: Bearer $TOKEN2"
# Doit retourner seulement les customers de org2
```

## 🗂️ Structure du Projet

```
velvena/
├── prisma/
│   ├── schema.prisma          ✅ Schéma multi-tenant
│   ├── seed.ts                ✅ Seed avec organisations + données globales
│   └── migrations/
│       └── add_multi_tenant.sql  (guide)
│
├── src/
│   ├── controllers/
│   │   ├── organizationController.ts  ✅ Nouveau
│   │   ├── userController/
│   │   │   └── authController.ts      ✅ Mis à jour
│   │   ├── dressController/           ⏳ À migrer
│   │   ├── customerController.ts      ⏳ À migrer
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── authMiddleware.ts          ✅ Mis à jour
│   │   └── tenantMiddleware.ts        ✅ Nouveau
│   │
│   ├── routes/
│   │   └── organizations.ts           ✅ Nouveau
│   │
│   ├── types/
│   │   └── express.d.ts               ✅ Mis à jour
│   │
│   └── utils/
│       └── tenantHelper.ts            ✅ Nouveau
│
├── MIGRATION_MULTI_TENANT.md          📚 Instructions complètes
├── MULTI_TENANT_MIGRATION_GUIDE.md    📚 Guide de migration des contrôleurs
├── EXAMPLE_CONTROLLER_MIGRATION.md    📚 Exemple concret
├── MULTI_TENANT_SUMMARY.md            📚 Résumé complet
└── README_MULTI_TENANT.md             📚 Ce fichier
```

## ⚠️ Important

### Sécurité

1. **Changer les mots de passe par défaut**
   ```sql
   -- Après le premier login, changer le mot de passe admin
   ```

2. **JWT_SECRET en production**
   ```bash
   # Générer une clé aléatoire
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Toujours vérifier organization_id**
   - Chaque requête DOIT filtrer par organization_id
   - Utiliser les helpers fournis
   - Ne JAMAIS exposer des données d'autres organisations

### Performance

- Index automatiques sur `organization_id` pour toutes les tables
- Requêtes optimisées avec les filtres d'organisation
- Monitoring recommandé après migration

### Backup

TOUJOURS faire un backup avant :
- Migration de base de données
- Mise à jour de contrôleurs en production
- Changements de schéma

```bash
pg_dump -U user -d velvena > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📝 TODO après migration

- [ ] Appliquer la migration sur dev/staging
- [ ] Migrer tous les contrôleurs (voir MULTI_TENANT_MIGRATION_GUIDE.md)
- [ ] Tester l'isolation multi-tenant
- [ ] Changer les mots de passe par défaut
- [ ] Configurer JWT_SECRET en production
- [ ] Mettre à jour la documentation Swagger
- [ ] Former l'équipe sur la nouvelle architecture
- [ ] Monitoring et métriques par organisation
- [ ] Plan de rollback documenté

## 🆘 Support & Troubleshooting

Consultez `MIGRATION_MULTI_TENANT.md` section **Troubleshooting** pour les problèmes courants :

- Erreur "organization_id cannot be null"
- Erreur "User is not assigned to an organization"
- Migration Prisma qui échoue
- Données de référence globales manquantes
- Etc.

## 🎉 Crédits

Architecture multi-tenant conçue et implémentée pour Velvena.

**Développeurs :** Consultez les fichiers de documentation pour tous les détails !

---

**Version :** 1.0.0-multi-tenant
**Dernière mise à jour :** 2025-12-06
