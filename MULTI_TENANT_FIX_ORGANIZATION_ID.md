# 🔒 Fix Multi-Tenant: organization_id dans les données de référence

## 🚨 Problème Critique Identifié

Les contrôleurs de création pour les données de référence (types, tailles, couleurs, conditions, forfaits, options) **ne renseignaient PAS** le champ `organization_id` lors de la création.

Cela causait un **problème de sécurité multi-tenant critique** :
- Les données créées par une organisation étaient visibles par toutes les autres
- Risque de fuite de données entre organisations
- Violation du principe d'isolation des tenants

---

## ✅ Fichiers Corrigés

### 1. **DressType** - Types de robes
**Fichier** : `src/controllers/dressController/dressTypeController.ts`

**Avant** :
```typescript
const dressType = await prisma.dressType.create({
  data: {
    name,
    description,
    created_by: req.user?.id ?? null,
  },
});
```

**Après** :
```typescript
const dressType = await prisma.dressType.create({
  data: {
    name,
    description,
    organization_id: req.user?.organizationId ?? null,  // ✅ AJOUTÉ
    created_by: req.user?.id ?? null,
  },
});
```

**GET également mis à jour** :
```typescript
const types = await prisma.dressType.findMany({
  where: {
    deleted_at: null,
    organization_id: organizationId ?? null,  // ✅ AJOUTÉ
  },
  orderBy: { name: "asc" },
});
```

---

### 2. **DressSize** - Tailles de robes
**Fichier** : `src/controllers/dressController/dressSizeController.ts`

**Correction CREATE** :
```typescript
const size = await prisma.dressSize.create({
  data: {
    name,
    organization_id: req.user?.organizationId ?? null,  // ✅ AJOUTÉ
    created_by: req.user?.id ?? null,
  },
});
```

**GET également mis à jour** :
```typescript
const sizes = await prisma.dressSize.findMany({
  where: {
    deleted_at: null,
    organization_id: organizationId ?? null,  // ✅ AJOUTÉ
  },
  orderBy: { name: "asc" },
});
```

---

### 3. **DressColor** - Couleurs de robes
**Fichier** : `src/controllers/dressController/dressColorController.ts`

**Correction CREATE** :
```typescript
const color = await prisma.dressColor.create({
  data: {
    name,
    hex_code,
    organization_id: req.user?.organizationId ?? null,  // ✅ AJOUTÉ
    created_by: req.user?.id ?? null
  },
});
```

**GET également mis à jour** :
```typescript
const colors = await prisma.dressColor.findMany({
  where: {
    deleted_at: null,
    organization_id: organizationId ?? null,  // ✅ AJOUTÉ
  },
  orderBy: { name: "asc" },
});
```

---

### 4. **DressCondition** - État des robes
**Fichier** : `src/controllers/dressController/dressConditionController.ts`

**Correction CREATE** :
```typescript
const condition = await prisma.dressCondition.create({
  data: {
    name,
    organization_id: req.user?.organizationId ?? null,  // ✅ AJOUTÉ
    created_by: req.user?.id ?? null
  },
});
```

**GET également mis à jour** :
```typescript
const conditions = await prisma.dressCondition.findMany({
  where: {
    deleted_at: null,
    organization_id: organizationId ?? null,  // ✅ AJOUTÉ
  },
  orderBy: { name: "asc" },
});
```

---

### 5. **ContractAddon** - Options de contrat
**Fichier** : `src/controllers/contractController/contractAddonController.ts`

**Correction CREATE** :
```typescript
const addon = await prisma.contractAddon.create({
  data: {
    name,
    description: description ?? null,
    price_ht,
    price_ttc,
    included: included ?? false,
    organization_id: req.user?.organizationId ?? null,  // ✅ AJOUTÉ
    created_by: req.user?.id ?? null,
  },
});
```

**GET également mis à jour** :
```typescript
const addons = await prisma.contractAddon.findMany({
  where: {
    deleted_at: null,
    organization_id: organizationId ?? null,  // ✅ AJOUTÉ
  },
  orderBy: { name: "asc" },
});
```

---

### 6. **ContractPackage** - Forfaits de contrat
**Fichier** : `src/controllers/contractController/contractPackageController.ts`

**Correction CREATE** :
```typescript
const pkg = await prisma.contractPackage.create({
  data: {
    id: uuidv4(),
    name,
    num_dresses,
    price_ht,
    price_ttc,
    organization_id: (req as any).user?.organizationId || null,  // ✅ AJOUTÉ
    created_at: now,
    created_by: (req as any).user?.id || null,
    // ... rest of the data
  },
});
```

**GET également mis à jour** :
```typescript
const packages = await prisma.contractPackage.findMany({
  where: {
    deleted_at: null,
    organization_id: organizationId ?? null,  // ✅ AJOUTÉ
  },
  include: { addons: true },
});
```

**Route authMiddleware ajouté** :
```typescript
// src/routes/contractRoutes/contractPackages.ts
import authMiddleware from "../../middleware/authMiddleware.js";

router.get("/", authMiddleware, getAllContractPackages);  // ✅ AJOUTÉ
router.post("/", authMiddleware, createContractPackage);  // ✅ AJOUTÉ
// ... all other routes with authMiddleware
```

---

## 🎯 Impact

### Sécurité
✅ **Isolation des données** : Chaque organisation voit uniquement ses propres données
✅ **Pas de fuite de données** : Les types/tailles/couleurs d'une organisation A ne sont plus visibles par l'organisation B
✅ **Conformité multi-tenant** : Respect du principe d'isolation des tenants

### Fonctionnel
✅ **Personnalisation par organisation** : Chaque organisation peut avoir ses propres types, tailles, couleurs, etc.
✅ **Suppression en cascade** : Lors de la suppression d'une organisation, toutes ses données de référence sont supprimées
✅ **Cohérence des données** : Les données sont correctement liées à leur organisation

---

## 🔍 Vérification

### Comment tester

1. **Créer deux organisations** :
```bash
# Organisation A
curl -X POST http://localhost:3000/organizations/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Org A",
    "userEmail": "orga@test.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "A"
  }'

# Organisation B
curl -X POST http://localhost:3000/organizations/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Org B",
    "userEmail": "orgb@test.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "B"
  }'
```

2. **Créer un type dans l'organisation A** :
```bash
curl -X POST http://localhost:3000/dress-types \
  -H "Authorization: Bearer <token-org-a>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Type A", "description": "Type de l'\''org A"}'
```

3. **Vérifier que l'organisation B ne voit PAS ce type** :
```bash
curl -X GET http://localhost:3000/dress-types \
  -H "Authorization: Bearer <token-org-b>"

# Résultat attendu : liste vide ou ne contenant pas "Type A"
```

### Requête SQL de vérification

```sql
SELECT
  id,
  name,
  organization_id,
  created_by
FROM "DressType"
WHERE deleted_at IS NULL;

-- ✅ Chaque enregistrement doit avoir un organization_id
-- ❌ Si organization_id est NULL, il y a un problème
```

---

## ⚠️ Points d'Attention Futurs

### 1. Toujours spécifier organization_id lors des créations

**Pattern à suivre** pour TOUS les nouveaux contrôleurs :

```typescript
export const createXXX = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ... } = req.body;

    const record = await prisma.xxx.create({
      data: {
        ...,
        organization_id: req.user?.organizationId ?? null,  // ✅ OBLIGATOIRE
        created_by: req.user?.id ?? null,
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    // Error handling
  }
};
```

### 2. Toujours filtrer par organization_id lors des GET

**Pattern à suivre** :

```typescript
export const getXXX = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;

    const records = await prisma.xxx.findMany({
      where: {
        deleted_at: null,
        organization_id: organizationId ?? null,  // ✅ OBLIGATOIRE
      },
    });

    res.json({ success: true, data: records });
  } catch (err) {
    // Error handling
  }
};
```

### 3. Vérifier lors des UPDATE et DELETE

S'assurer que l'utilisateur ne peut modifier/supprimer QUE les enregistrements de son organisation :

```typescript
export const updateXXX = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    // Vérifier que l'enregistrement appartient à l'organisation
    const existing = await prisma.xxx.findUnique({
      where: { id }
    });

    if (!existing || existing.organization_id !== organizationId) {
      return res.status(404).json({
        success: false,
        error: "Not found or access denied"
      });
    }

    // Proceed with update...
  }
};
```

---

## 📊 Checklist de Validation

Avant de déployer un nouveau contrôleur, vérifier :

- [ ] Le `CREATE` spécifie `organization_id: req.user?.organizationId`
- [ ] Le `GET` filtre par `organization_id: req.user?.organizationId`
- [ ] Le `UPDATE` vérifie que l'enregistrement appartient à l'organisation
- [ ] Le `DELETE` vérifie que l'enregistrement appartient à l'organisation
- [ ] Les tests incluent la vérification d'isolation multi-tenant
- [ ] La documentation Swagger mentionne le comportement multi-tenant

---

## 🎓 Leçons Apprises

1. **Ne jamais oublier organization_id** : C'est la clé de voûte du multi-tenant
2. **Toujours filtrer par organization** : Dans les GET, UPDATE, DELETE
3. **Tester l'isolation** : Créer 2 orgs et vérifier qu'elles ne voient pas les données de l'autre
4. **Code review** : Faire vérifier les PRs pour s'assurer que organization_id est bien présent
5. **Middleware** : Envisager un middleware qui ajoute automatiquement organization_id

---

## 🚀 Prochaines Étapes

### Court terme
- ✅ Corriger les 6 contrôleurs identifiés
- [ ] Ajouter des tests d'isolation multi-tenant
- [ ] Mettre à jour la documentation Swagger
- [ ] Vérifier s'il y a d'autres contrôleurs avec le même problème

### Moyen terme
- [ ] Créer un middleware `ensureOrganizationId` pour automatiser l'ajout
- [ ] Ajouter des tests E2E pour le multi-tenant
- [ ] Créer un guide de développement multi-tenant
- [ ] Audit complet de tous les contrôleurs

### Long terme
- [ ] Envisager Row-Level Security (RLS) au niveau de Prisma
- [ ] Ajouter des métriques de monitoring pour détecter les accès cross-organization
- [ ] Implémenter une stratégie de backup par organisation

---

## 📝 Conclusion

Cette correction est **critique pour la sécurité** de l'application multi-tenant. Sans `organization_id`, il y avait un risque majeur de fuite de données entre organisations.

**Tous les futurs développements DOIVENT** suivre le pattern établi pour assurer l'isolation des données.

---

**Date de correction** : 2025-12-19
**Développeur** : Claude Code
**Criticité** : 🔴 CRITIQUE (Sécurité)
**Status** : ✅ CORRIGÉ
