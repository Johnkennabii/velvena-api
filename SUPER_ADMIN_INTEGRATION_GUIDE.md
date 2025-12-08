# 🚀 Guide d'Intégration SUPER_ADMIN

## Étape 1: Ajouter le middleware aux routes

```typescript
// src/routes/userRoutes/users.ts
import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { organizationContextMiddleware } from "../../middleware/organizationContextMiddleware.js";
import { getUsers, getUser, updateUser } from "../../controllers/userController/userController.js";

const router = Router();

// ✅ Ajouter organizationContextMiddleware après authMiddleware
router.use(authMiddleware);
router.use(organizationContextMiddleware); // ← Nouveau !

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);

export default router;
```

## Étape 2: Utiliser les helpers dans les controllers

```typescript
// src/controllers/userController/userController.ts
import { requireOrganizationContext } from "../../utils/organizationHelper.js";

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Gère automatiquement SUPER_ADMIN + header X-Organization-Slug
  const organizationId = requireOrganizationContext(req, res);
  if (!organizationId) return; // Erreur 403 déjà envoyée

  const users = await prisma.user.findMany({
    where: { organization_id: organizationId }
  });

  res.json({ success: true, data: users });
};
```

## Utilisation API

### SUPER_ADMIN sélectionne une organisation:

```bash
curl -H "Authorization: Bearer {super-admin-token}" \
     -H "X-Organization-Slug: acme-corp" \
  http://localhost:3000/users

# ✅ Retourne les users de "acme-corp"
```

### Admin normal (ne peut pas changer d'org):

```bash
curl -H "Authorization: Bearer {admin-token}" \
     -H "X-Organization-Slug: autre-org" \
  http://localhost:3000/users

# ❌ 403 Forbidden: "Only SUPER_ADMIN can switch organization context"
```

Voulez-vous que j'intègre ce système dans vos routes existantes maintenant ?
