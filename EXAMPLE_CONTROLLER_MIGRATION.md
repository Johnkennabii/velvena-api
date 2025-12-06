# Exemple Concret : Migration du Customer Controller

Ce document montre la migration complète d'un contrôleur du mode mono-tenant vers multi-tenant.

## Fichier : `src/controllers/customerController.ts`

### AVANT (Mono-tenant)

```typescript
import type { Response } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/express.js";
import logger from "../lib/logger.js";

// GET all customers
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit, offset } = req.query;

    const customers = await prisma.customer.findMany({
      where: { deleted_at: null },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
      orderBy: { created_at: "desc" },
    });

    const total = await prisma.customer.count({
      where: { deleted_at: null },
    });

    res.json({
      success: true,
      data: customers,
      total,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch customers");
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET customer by ID
export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        contracts: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
        notes: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST create customer
export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
    } = req.body;

    if (!firstname || !lastname || !email) {
      return res.status(400).json({
        success: false,
        error: "firstname, lastname, and email are required",
      });
    }

    // Check if email already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Customer with this email already exists",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        firstname,
        lastname,
        email,
        phone,
        birthday: birthday ? new Date(birthday) : null,
        country,
        city,
        address,
        postal_code,
        created_by: req.user?.id,
        created_at: new Date(),
      },
    });

    logger.info({ customerId: customer.id }, "Customer created");

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to create customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT update customer
export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
    } = req.body;

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // If email is being changed, check uniqueness
    if (email && email !== existing.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "Customer with this email already exists",
        });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        firstname,
        lastname,
        email,
        phone,
        birthday: birthday ? new Date(birthday) : undefined,
        country,
        city,
        address,
        postal_code,
        updated_by: req.user?.id,
        updated_at: new Date(),
      },
    });

    logger.info({ customerId: customer.id }, "Customer updated");

    res.json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to update customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE customer (soft delete)
export const deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    await prisma.customer.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id,
      },
    });

    logger.info({ customerId: id }, "Customer deleted");

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to delete customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST search customers
export const searchCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, limit = "20" } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const customers = await prisma.customer.findMany({
      where: {
        deleted_at: null,
        OR: [
          { firstname: { contains: query, mode: "insensitive" } },
          { lastname: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: parseInt(limit),
      orderBy: { created_at: "desc" },
    });

    res.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to search customers");
    res.status(500).json({ success: false, error: err.message });
  }
};
```

---

### APRÈS (Multi-tenant)

```typescript
import type { Response } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/express.js";
import logger from "../lib/logger.js";
import { withOrgFilter, withOrgData, validateOrgOwnership } from "../utils/tenantHelper.js";

// GET all customers
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ CHANGEMENT 1: Vérifier le contexte d'organisation
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const { limit, offset } = req.query;

    // ✅ CHANGEMENT 2: Utiliser withOrgFilter pour filtrer par organisation
    const customers = await prisma.customer.findMany({
      where: withOrgFilter(req.user.organizationId, { deleted_at: null }),
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
      orderBy: { created_at: "desc" },
    });

    // ✅ CHANGEMENT 3: Count aussi avec filtre org
    const total = await prisma.customer.count({
      where: withOrgFilter(req.user.organizationId, { deleted_at: null }),
    });

    logger.info(
      { organizationId: req.user.organizationId, count: customers.length },
      "Customers fetched"
    );

    res.json({
      success: true,
      data: customers,
      total,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch customers");
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET customer by ID
export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ CHANGEMENT 1: Vérifier le contexte
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const { id } = req.params;

    // ✅ CHANGEMENT 2: Utiliser findFirst avec filtre org (au lieu de findUnique)
    // OU utiliser findUnique puis validateOrgOwnership
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        organization_id: req.user.organizationId, // IMPORTANT!
      },
      include: {
        contracts: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
        notes: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST create customer
export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ CHANGEMENT 1: Vérifier le contexte complet
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
    } = req.body;

    if (!firstname || !lastname || !email) {
      return res.status(400).json({
        success: false,
        error: "firstname, lastname, and email are required",
      });
    }

    // ✅ CHANGEMENT 2: Vérifier l'unicité dans l'organisation (pas globalement!)
    const existing = await prisma.customer.findFirst({
      where: {
        email,
        organization_id: req.user.organizationId,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Customer with this email already exists in your organization",
      });
    }

    // ✅ CHANGEMENT 3: Utiliser withOrgData pour ajouter organization_id automatiquement
    const customer = await prisma.customer.create({
      data: withOrgData(req.user.organizationId, req.user.id, {
        firstname,
        lastname,
        email,
        phone,
        birthday: birthday ? new Date(birthday) : null,
        country,
        city,
        address,
        postal_code,
      }),
    });

    logger.info(
      { customerId: customer.id, organizationId: req.user.organizationId },
      "Customer created"
    );

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to create customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT update customer
export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ CHANGEMENT 1: Vérifier le contexte
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const { id } = req.params;
    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
    } = req.body;

    // ✅ CHANGEMENT 2: Vérifier que le customer appartient à l'organisation
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    try {
      validateOrgOwnership(existing, req.user.organizationId, "Customer");
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }

    // ✅ CHANGEMENT 3: Vérifier l'unicité de l'email dans l'organisation
    if (email && email !== existing.email) {
      const emailExists = await prisma.customer.findFirst({
        where: {
          email,
          organization_id: req.user.organizationId,
          id: { not: id }, // Exclure le customer actuel
        },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "Customer with this email already exists in your organization",
        });
      }
    }

    // ✅ CHANGEMENT 4: Utiliser withOrgData avec isUpdate = true
    const customer = await prisma.customer.update({
      where: { id },
      data: withOrgData(
        req.user.organizationId,
        req.user.id,
        {
          firstname,
          lastname,
          email,
          phone,
          birthday: birthday ? new Date(birthday) : undefined,
          country,
          city,
          address,
          postal_code,
        },
        true // isUpdate = true
      ),
    });

    logger.info(
      { customerId: customer.id, organizationId: req.user.organizationId },
      "Customer updated"
    );

    res.json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to update customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE customer (soft delete)
export const deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ CHANGEMENT 1: Vérifier le contexte
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const { id } = req.params;

    // ✅ CHANGEMENT 2: Vérifier l'ownership
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    try {
      validateOrgOwnership(existing, req.user.organizationId, "Customer");
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }

    await prisma.customer.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user.id,
      },
    });

    logger.info(
      { customerId: id, organizationId: req.user.organizationId },
      "Customer deleted"
    );

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to delete customer");
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST search customers
export const searchCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ CHANGEMENT 1: Vérifier le contexte
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const { query, limit = "20" } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    // ✅ CHANGEMENT 2: Ajouter organization_id au filtre
    const customers = await prisma.customer.findMany({
      where: {
        organization_id: req.user.organizationId, // IMPORTANT!
        deleted_at: null,
        OR: [
          { firstname: { contains: query, mode: "insensitive" } },
          { lastname: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: parseInt(limit),
      orderBy: { created_at: "desc" },
    });

    logger.info(
      { organizationId: req.user.organizationId, query, count: customers.length },
      "Customers searched"
    );

    res.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to search customers");
    res.status(500).json({ success: false, error: err.message });
  }
};
```

---

## Résumé des Changements

### 1. Import des Helpers

```typescript
// Ajouté en haut du fichier
import { withOrgFilter, withOrgData, validateOrgOwnership } from "../utils/tenantHelper.js";
```

### 2. Vérification du Contexte

Dans **CHAQUE** fonction :

```typescript
if (!req.user?.organizationId) {
  return res.status(403).json({
    success: false,
    error: "Organization context required",
  });
}
```

### 3. Filtrage par Organisation

**findMany / count :**
```typescript
// AVANT
where: { deleted_at: null }

// APRÈS
where: withOrgFilter(req.user.organizationId, { deleted_at: null })
```

**findUnique + validation :**
```typescript
// AVANT
const customer = await prisma.customer.findUnique({ where: { id } });
if (!customer) return res.status(404)...

// APRÈS
const customer = await prisma.customer.findUnique({ where: { id } });
try {
  validateOrgOwnership(customer, req.user.organizationId, "Customer");
} catch (err: any) {
  return res.status(404).json({ error: err.message });
}
```

**OU findFirst avec filtre :**
```typescript
// Alternative plus simple
const customer = await prisma.customer.findFirst({
  where: {
    id,
    organization_id: req.user.organizationId,
  },
});
```

### 4. Création avec Organization

```typescript
// AVANT
const customer = await prisma.customer.create({
  data: {
    firstname,
    lastname,
    // ...
    created_by: req.user.id,
  },
});

// APRÈS
const customer = await prisma.customer.create({
  data: withOrgData(req.user.organizationId, req.user.id, {
    firstname,
    lastname,
    // ...
  }),
});
```

### 5. Mise à Jour avec Organization

```typescript
// AVANT
const customer = await prisma.customer.update({
  where: { id },
  data: {
    firstname,
    // ...
    updated_by: req.user.id,
    updated_at: new Date(),
  },
});

// APRÈS
const customer = await prisma.customer.update({
  where: { id },
  data: withOrgData(req.user.organizationId, req.user.id, {
    firstname,
    // ...
  }, true), // true = isUpdate
});
```

### 6. Contraintes Uniques Scoped à l'Org

```typescript
// AVANT - Vérification globale
const existing = await prisma.customer.findUnique({
  where: { email },
});

// APRÈS - Vérification dans l'organisation
const existing = await prisma.customer.findFirst({
  where: {
    email,
    organization_id: req.user.organizationId,
  },
});
```

### 7. Logging avec Contexte

```typescript
// AVANT
logger.info({ customerId: customer.id }, "Customer created");

// APRÈS
logger.info(
  { customerId: customer.id, organizationId: req.user.organizationId },
  "Customer created"
);
```

---

## Points Clés à Retenir

### ✅ À FAIRE

1. **TOUJOURS** vérifier `req.user?.organizationId` en début de fonction
2. **TOUJOURS** filtrer par `organization_id` dans les requêtes
3. **TOUJOURS** utiliser `withOrgFilter` ou `withOrgData`
4. **TOUJOURS** valider l'ownership avant update/delete
5. **TOUJOURS** logger l'organizationId

### ❌ À ÉVITER

1. **JAMAIS** de requête sans filtre organization_id
2. **JAMAIS** utiliser `findUnique` sans valider ensuite
3. **JAMAIS** oublier le filtre sur les relations
4. **JAMAIS** exposer des données d'autres organisations
5. **JAMAIS** permettre de modifier des ressources d'une autre org

---

## Checklist de Migration

Pour chaque fonction du contrôleur :

- [ ] Import des helpers en haut du fichier
- [ ] Vérification de `req.user?.organizationId`
- [ ] Utilisation de `withOrgFilter` dans les findMany/count
- [ ] Utilisation de `findFirst` avec org_id OU `validateOrgOwnership`
- [ ] Utilisation de `withOrgData` dans create/update
- [ ] Contraintes uniques scopées à l'organisation
- [ ] Logging avec organizationId
- [ ] Test avec 2 organisations différentes

---

## Tests à Effectuer

```bash
# 1. Créer un customer dans org 1
TOKEN_ORG1="..." # Token user org 1

curl -X POST http://localhost:3000/customers \
  -H "Authorization: Bearer $TOKEN_ORG1" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@org1.com"
  }'

# 2. Créer un customer avec le MÊME email dans org 2
TOKEN_ORG2="..." # Token user org 2

curl -X POST http://localhost:3000/customers \
  -H "Authorization: Bearer $TOKEN_ORG2" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Jane",
    "lastname": "Smith",
    "email": "john@org1.com"
  }'
# ✅ Doit réussir (emails scopés par org)

# 3. User org 1 essaie d'accéder au customer de org 2
CUSTOMER_ORG2_ID="..."

curl http://localhost:3000/customers/$CUSTOMER_ORG2_ID \
  -H "Authorization: Bearer $TOKEN_ORG1"
# ✅ Doit retourner 404

# 4. Lister les customers
curl http://localhost:3000/customers \
  -H "Authorization: Bearer $TOKEN_ORG1"
# ✅ Doit retourner seulement les customers de org 1
```

---

Ce pattern s'applique à **TOUS** les contrôleurs avec des modèles ayant `organization_id` !
