# Guide de Migration Multi-Tenant

Ce guide explique comment migrer les contrôleurs existants vers l'architecture multi-tenant.

## Architecture Multi-Tenant Implémentée

### Modèles Modifiés

**Organization (nouveau modèle)**
- Contient les informations de l'organisation
- Champs: `slug` (identifiant unique), `name`, `email`, `phone`, `settings`, `subscription_plan`, etc.

**User**
- Ajout de `organization_id` (requis)
- Un utilisateur = une organisation

**Modèles métier avec organization_id requis:**
- `Dress`
- `Customer`
- `Prospect`
- `Contract`

**Modèles de référence avec organization_id optionnel (approche hybride):**
- `DressType`, `DressSize`, `DressColor`, `DressCondition`
- `ContractType`, `ContractPackage`, `ContractAddon`
- `Role`

Lorsque `organization_id` est `null`, l'enregistrement est global (partagé entre toutes les organisations).

### Middleware Créés

1. **authMiddleware** (modifié)
   - Récupère automatiquement l'`organization_id` de l'utilisateur
   - L'ajoute dans `req.user.organizationId`

2. **tenantMiddleware** (nouveau)
   - Extrait `organizationId` de `req.user` ou `req.apiKey`
   - L'expose dans `req.organizationId`
   - Retourne 403 si aucun contexte d'organisation n'est trouvé

3. **optionalTenantMiddleware** (nouveau)
   - Version optionnelle pour les routes publiques

### Helpers Utilitaires

Fichier: `src/utils/tenantHelper.ts`

```typescript
// Ajoute le filtre organization_id
withOrgFilter(organizationId, { deleted_at: null })
// Résultat: { deleted_at: null, organization_id: "xxx" }

// Pour les modèles avec org_id nullable (items globaux + org-specific)
withOrgOrGlobal(organizationId, { deleted_at: null })
// Résultat: { AND: [{ deleted_at: null }, { OR: [{ organization_id: "xxx" }, { organization_id: null }] }] }

// Pour créer/mettre à jour avec contexte org
withOrgData(organizationId, userId, { name: "Test" })
// Résultat: { name: "Test", organization_id: "xxx", created_by: "userId" }

// Valider qu'une ressource appartient à l'org
validateOrgOwnership(resource, organizationId, "Dress")
```

## Pattern de Migration des Contrôleurs

### AVANT (mono-tenant)

```typescript
export const getDresses = async (req: AuthenticatedRequest, res: Response) => {
  const dresses = await prisma.dress.findMany({
    where: { deleted_at: null },
    include: { type: true, size: true, color: true },
  });
  res.json(dresses);
};

export const createDress = async (req: AuthenticatedRequest, res: Response) => {
  const dress = await prisma.dress.create({
    data: {
      name: req.body.name,
      reference: req.body.reference,
      price_ht: req.body.price_ht,
      // ...
      created_by: req.user.id,
    },
  });
  res.json(dress);
};

export const getDressById = async (req: AuthenticatedRequest, res: Response) => {
  const dress = await prisma.dress.findUnique({
    where: { id: req.params.id },
  });

  if (!dress) {
    return res.status(404).json({ error: "Dress not found" });
  }

  res.json(dress);
};
```

### APRÈS (multi-tenant)

```typescript
import { withOrgFilter, withOrgData, validateOrgOwnership } from "../../utils/tenantHelper.js";

export const getDresses = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({ error: "Organization context required" });
  }

  const dresses = await prisma.dress.findMany({
    where: withOrgFilter(req.user.organizationId, { deleted_at: null }),
    include: { type: true, size: true, color: true },
  });
  res.json(dresses);
};

export const createDress = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId || !req.user?.id) {
    return res.status(403).json({ error: "Organization context required" });
  }

  const dress = await prisma.dress.create({
    data: withOrgData(req.user.organizationId, req.user.id, {
      name: req.body.name,
      reference: req.body.reference,
      price_ht: req.body.price_ht,
      // ...
    }),
  });
  res.json(dress);
};

export const getDressById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({ error: "Organization context required" });
  }

  const dress = await prisma.dress.findFirst({
    where: {
      id: req.params.id,
      organization_id: req.user.organizationId, // IMPORTANT: Filtre par org
    },
  });

  if (!dress) {
    return res.status(404).json({ error: "Dress not found" });
  }

  res.json(dress);
};

export const updateDress = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId || !req.user?.id) {
    return res.status(403).json({ error: "Organization context required" });
  }

  // Vérifier que la ressource appartient à l'organisation
  const existing = await prisma.dress.findUnique({
    where: { id: req.params.id },
  });

  try {
    validateOrgOwnership(existing, req.user.organizationId, "Dress");
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }

  const dress = await prisma.dress.update({
    where: { id: req.params.id },
    data: withOrgData(req.user.organizationId, req.user.id, {
      name: req.body.name,
      // ...
    }, true), // true = isUpdate
  });

  res.json(dress);
};
```

### Pour les Modèles de Référence (avec organization_id nullable)

```typescript
// Récupérer les types de robes (globaux + ceux de l'org)
export const getDressTypes = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({ error: "Organization context required" });
  }

  const types = await prisma.dressType.findMany({
    where: withOrgOrGlobal(req.user.organizationId, { deleted_at: null }),
    orderBy: { name: "asc" },
  });

  res.json(types);
};

// Créer un type spécifique à l'organisation
export const createDressType = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId || !req.user?.id) {
    return res.status(403).json({ error: "Organization context required" });
  }

  const type = await prisma.dressType.create({
    data: {
      name: req.body.name,
      description: req.body.description,
      organization_id: req.user.organizationId, // Spécifique à l'org
      created_by: req.user.id,
    },
  });

  res.json(type);
};

// Créer un type global (super-admin uniquement)
export const createGlobalDressType = async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Vérifier que l'utilisateur est super-admin

  const type = await prisma.dressType.create({
    data: {
      name: req.body.name,
      description: req.body.description,
      organization_id: null, // Global!
      created_by: req.user.id,
    },
  });

  res.json(type);
};
```

## Checklist de Migration par Contrôleur

Pour chaque contrôleur, suivez ces étapes :

### 1. Imports
```typescript
import { withOrgFilter, withOrgData, withOrgOrGlobal, validateOrgOwnership } from "../../utils/tenantHelper.js";
```

### 2. Méthode GET (liste)
- [ ] Ajouter vérification `req.user?.organizationId`
- [ ] Utiliser `withOrgFilter()` ou `withOrgOrGlobal()` dans le `where`
- [ ] Tester avec plusieurs organisations

### 3. Méthode GET (by ID)
- [ ] Ajouter vérification `req.user?.organizationId`
- [ ] Utiliser `findFirst` avec filtre `organization_id` OU
- [ ] Utiliser `findUnique` puis `validateOrgOwnership()`
- [ ] Retourner 404 si non trouvé ou pas dans l'org

### 4. Méthode POST (create)
- [ ] Ajouter vérification `req.user?.organizationId`
- [ ] Utiliser `withOrgData()` pour ajouter `organization_id` et `created_by`
- [ ] Vérifier les relations (foreign keys doivent être dans la même org)

### 5. Méthode PUT/PATCH (update)
- [ ] Ajouter vérification `req.user?.organizationId`
- [ ] Valider que la ressource appartient à l'org avec `validateOrgOwnership()`
- [ ] Utiliser `withOrgData()` avec `isUpdate = true`

### 6. Méthode DELETE
- [ ] Ajouter vérification `req.user?.organizationId`
- [ ] Valider que la ressource appartient à l'org
- [ ] Soft delete avec `deleted_at` et `deleted_by`

## Contrôleurs à Migrer

### Priorité 1 (Données métier)
- [ ] `dressController.ts` - Robes
- [ ] `customerController.ts` - Clients
- [ ] `prospectController.ts` - Prospects
- [ ] `contractController.ts` - Contrats

### Priorité 2 (Données de référence)
- [ ] `dressTypeController.ts`
- [ ] `dressSizeController.ts`
- [ ] `dressColorController.ts`
- [ ] `dressConditionController.ts`
- [ ] `contractTypeController.ts`
- [ ] `contractPackageController.ts`
- [ ] `contractAddonController.ts`

### Priorité 3 (Utilisateurs et profils)
- [ ] `userController.ts` - Déjà partiellement migré
- [ ] `profileController.ts`
- [ ] `roleController.ts`

## Routes à Mettre à Jour

Dans `server.ts`, ajouter la route des organisations :

```typescript
import organizationRoutes from "./routes/organizations.js";

// ...

app.use("/organizations", organizationRoutes);
```

## Script de Migration de Données

Une fois tous les contrôleurs migrés, vous devrez :

1. Créer une organisation par défaut
2. Assigner tous les utilisateurs existants à cette organisation
3. Assigner toutes les données existantes à cette organisation
4. Créer des données de référence globales (types, tailles, couleurs par défaut)

Voir le fichier `MIGRATION_SCRIPT.md` pour les détails.

## Tests

Après migration, tester :

1. ✅ Un utilisateur ne peut voir QUE les données de son organisation
2. ✅ Un utilisateur ne peut PAS accéder aux données d'une autre organisation (même avec l'ID)
3. ✅ Les données de référence globales sont visibles par tous
4. ✅ Les données de référence spécifiques à une org ne sont visibles que par cette org
5. ✅ La création de ressources les attache automatiquement à l'organisation
6. ✅ L'authentification retourne les informations d'organisation

## Bonnes Pratiques

### ✅ À FAIRE
- Toujours vérifier `req.user?.organizationId` en début de fonction
- Utiliser les helpers `withOrgFilter`, `withOrgData`, etc.
- Valider l'ownership avant update/delete
- Filtrer les relations par organization_id
- Logger l'organizationId dans les logs

### ❌ À ÉVITER
- Ne JAMAIS faire de requête sans filtre organization_id (sauf super-admin)
- Ne pas mélanger les données de différentes organisations
- Ne pas exposer les IDs d'autres organisations
- Ne pas oublier le filtre sur les relations (JOIN)
- Ne pas utiliser `findUnique` sans valider ensuite l'ownership

## Prochaines Étapes

1. ✅ Schéma Prisma mis à jour
2. ✅ Middleware d'authentification mis à jour
3. ✅ Middleware multi-tenant créé
4. ✅ Types Express mis à jour
5. ✅ Helpers utilitaires créés
6. ✅ Contrôleur d'organisation créé
7. ⏳ **VOUS ÊTES ICI** - Migrer les contrôleurs existants
8. ⏳ Créer le script de migration de données
9. ⏳ Générer et appliquer les migrations Prisma
10. ⏳ Tester l'isolation multi-tenant
11. ⏳ Mettre à jour la documentation Swagger

## Support

En cas de doute, référez-vous aux exemples dans :
- `src/controllers/organizationController.ts` (exemple complet multi-tenant)
- `src/controllers/userController/authController.ts` (authentification avec org)
- `src/utils/tenantHelper.ts` (tous les helpers disponibles)
