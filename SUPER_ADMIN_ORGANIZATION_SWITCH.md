# 🔑 Système SUPER_ADMIN - Sélection d'Organisation

**Date**: 2025-12-08
**Status**: ✅ Implémenté

---

## 📋 Concept

Le rôle **SUPER_ADMIN** peut opérer dans le contexte de **n'importe quelle organisation** en spécifiant son slug via un header HTTP.

### Cas d'usage
- Support technique
- Administration multi-organisations
- Debug et troubleshooting
- Audit et reporting cross-organisations

---

## 🔧 Implémentation

### 1. Nouveau Middleware: `organizationContextMiddleware`

```typescript
// src/middleware/organizationContextMiddleware.ts

export const organizationContextMiddleware = async (req, res, next) => {
  const user = req.user;
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // SUPER_ADMIN peut spécifier une organisation
  if (isSuperAdmin) {
    const orgSlug = req.headers["x-organization-slug"];

    if (orgSlug) {
      const targetOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug }
      });

      req.organizationContext = {
        organizationId: targetOrg.id,
        isSuperAdminContext: true
      };
    }
  } else {
    // Utilisateur normal: son organization_id
    req.organizationContext = {
      organizationId: user.organizationId,
      isSuperAdminContext: false
    };
  }

  next();
};
```

---

### 2. Helpers Utilitaires

```typescript
// src/utils/organizationHelper.ts

// Récupère l'organization_id effectif
export function getEffectiveOrganizationId(req: AuthenticatedRequest): string | null {
  return req.organizationContext?.organizationId ?? req.user?.organizationId ?? null;
}

// Vérifie le contexte organisation (avec erreur 403 si absent)
export function requireOrganizationContext(req, res): string | null {
  const orgId = getEffectiveOrganizationId(req);
  if (!orgId) {
    res.status(403).json({ error: "Organization context required" });
    return null;
  }
  return orgId;
}

// Vérifie si c'est un SUPER_ADMIN en contexte d'une autre org
export function isSuperAdminContext(req: AuthenticatedRequest): boolean {
  return req.organizationContext?.isSuperAdminContext ?? false;
}
```

---

### 3. Types TypeScript

```typescript
// src/types/express.d.ts

export interface OrganizationContext {
  organizationId: string;
  isSuperAdminContext: boolean; // true si SUPER_ADMIN opère dans une autre org
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser | null;
  organizationContext?: OrganizationContext; // ✅ Nouveau
}
```

---

## 📡 Utilisation API

### Utilisateur Normal (Admin, Manager, User)

```bash
# Admin de l'organisation "acme-corp"
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/users

# Retourne les users de "acme-corp" uniquement
# ❌ Ne peut PAS utiliser X-Organization-Slug
```

---

### SUPER_ADMIN - Sans Header

```bash
# SUPER_ADMIN dans sa propre organisation
curl -H "Authorization: Bearer {super-admin-token}" \
  http://localhost:3000/users

# Retourne les users de l'organisation du SUPER_ADMIN
```

---

### SUPER_ADMIN - Avec Header X-Organization-Slug

```bash
# SUPER_ADMIN opérant dans le contexte de "acme-corp"
curl -H "Authorization: Bearer {super-admin-token}" \
     -H "X-Organization-Slug: acme-corp" \
  http://localhost:3000/users

# ✅ Retourne les users de "acme-corp"
```

```bash
# SUPER_ADMIN opérant dans le contexte de "globex-inc"
curl -H "Authorization: Bearer {super-admin-token}" \
     -H "X-Organization-Slug: globex-inc" \
  http://localhost:3000/dresses

# ✅ Retourne les robes de "globex-inc"
```

---

## 🛡️ Sécurité

### 1. Vérification du rôle
```typescript
const isSuperAdmin = userWithRole?.profile?.role?.name === "SUPER_ADMIN";

if (!isSuperAdmin && req.headers["x-organization-slug"]) {
  // ❌ Interdit pour les non-SUPER_ADMIN
  return res.status(403).json({
    error: "Only SUPER_ADMIN can switch organization context"
  });
}
```

### 2. Validation du slug
```typescript
const targetOrganization = await prisma.organization.findUnique({
  where: { slug: organizationSlug }
});

if (!targetOrganization) {
  return res.status(404).json({
    error: `Organization with slug "${organizationSlug}" not found`
  });
}
```

### 3. Logging et Audit
```typescript
pino.info({
  superAdminId: user.id,
  targetOrganizationId: targetOrganization.id,
  targetOrganizationSlug: organizationSlug,
  action: req.method,
  endpoint: req.url
}, "🔑 SUPER_ADMIN accessing organization context");
```

---

## 💻 Exemple d'Intégration dans un Controller

### Avant (isolation simple)
```typescript
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({ error: "Organization context required" });
  }

  const users = await prisma.user.findMany({
    where: { organization_id: req.user.organizationId }
  });

  res.json({ success: true, data: users });
};
```

### Après (avec support SUPER_ADMIN)
```typescript
import { requireOrganizationContext } from "../utils/organizationHelper.js";

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Gère automatiquement SUPER_ADMIN + X-Organization-Slug
  const organizationId = requireOrganizationContext(req, res);
  if (!organizationId) return; // Erreur 403 déjà envoyée

  const users = await prisma.user.findMany({
    where: { organization_id: organizationId }
  });

  res.json({ success: true, data: users });
};
```

---

## 🔄 Migration des Controllers

### Étapes pour chaque controller:

1. **Importer le helper**
```typescript
import { requireOrganizationContext, getEffectiveOrganizationId } from "../utils/organizationHelper.js";
```

2. **Remplacer les vérifications manuelles**
```typescript
// ❌ Ancien
if (!req.user?.organizationId) {
  return res.status(403).json({ error: "Organization context required" });
}
const organizationId = req.user.organizationId;

// ✅ Nouveau
const organizationId = requireOrganizationContext(req, res);
if (!organizationId) return;
```

3. **Controllers à migrer**:
- [ ] userController.ts
- [ ] dressController.ts
- [ ] contractController.ts
- [ ] customerController.ts
- [ ] organizationController.ts
- [ ] pricingRuleController.ts
- [ ] serviceTypeController.ts
- [ ] Tous les autres controllers avec multi-tenant

---

## 🧪 Tests

### Test 1: Utilisateur normal ne peut pas switcher
```bash
# Admin de Org A tente d'utiliser le header
curl -H "Authorization: Bearer {admin-org-a-token}" \
     -H "X-Organization-Slug: org-b" \
  http://localhost:3000/users

# Attendu: 403 Forbidden
# Message: "Only SUPER_ADMIN can switch organization context"
```

---

### Test 2: SUPER_ADMIN peut lister les users de n'importe quelle org
```bash
# SUPER_ADMIN accède à Org A
curl -H "Authorization: Bearer {super-admin-token}" \
     -H "X-Organization-Slug: acme-corp" \
  http://localhost:3000/users

# Attendu: 200 OK
# Résultat: Users de "acme-corp"

# SUPER_ADMIN accède à Org B
curl -H "Authorization: Bearer {super-admin-token}" \
     -H "X-Organization-Slug: globex-inc" \
  http://localhost:3000/users

# Attendu: 200 OK
# Résultat: Users de "globex-inc"
```

---

### Test 3: Slug invalide
```bash
curl -H "Authorization: Bearer {super-admin-token}" \
     -H "X-Organization-Slug: org-inexistante" \
  http://localhost:3000/users

# Attendu: 404 Not Found
# Message: "Organization with slug 'org-inexistante' not found"
```

---

## 📊 Frontend - Composant de Sélection d'Organisation

```typescript
// components/OrganizationSelector.tsx (pour SUPER_ADMIN)

import { useState, useEffect } from 'react';

export function OrganizationSelector() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    // Récupérer toutes les organisations (endpoint SUPER_ADMIN only)
    fetch('/organizations', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrganizations(data.organizations));
  }, []);

  const handleOrgChange = (slug: string) => {
    setSelectedSlug(slug);
    // Stocker dans localStorage ou context
    localStorage.setItem('super-admin-org-slug', slug);
  };

  return (
    <select onChange={(e) => handleOrgChange(e.target.value)}>
      <option value="">-- Ma propre organisation --</option>
      {organizations.map(org => (
        <option key={org.id} value={org.slug}>
          {org.name} ({org.slug})
        </option>
      ))}
    </select>
  );
}
```

```typescript
// httpClient.ts - Ajouter le header automatiquement

const superAdminOrgSlug = localStorage.getItem('super-admin-org-slug');

const headers = {
  'Authorization': `Bearer ${token}`,
  ...(superAdminOrgSlug && { 'X-Organization-Slug': superAdminOrgSlug })
};
```

---

## 🎯 Avantages

✅ **SUPER_ADMIN tout-puissant**: Accès à toutes les organisations
✅ **Sécurisé**: Impossible pour les autres rôles d'usurper ce pouvoir
✅ **Flexible**: Simple header HTTP, pas de changement d'authentification
✅ **Auditable**: Tous les accès SUPER_ADMIN sont loggés
✅ **Transparent**: Les controllers n'ont qu'à utiliser `requireOrganizationContext()`

---

## ⚠️ Bonnes Pratiques

1. **Ne jamais hardcoder de slug dans le code**
   - Utiliser le header dynamiquement

2. **Logger tous les accès SUPER_ADMIN**
   - Tracer qui accède à quelle organisation et quand

3. **Limiter le nombre de SUPER_ADMIN**
   - Ce rôle a un pouvoir total

4. **Audit régulier**
   - Vérifier les logs des accès SUPER_ADMIN

5. **UI claire pour le frontend**
   - Indiquer visuellement dans quelle organisation opère le SUPER_ADMIN

---

## 📝 Checklist d'Implémentation

- [x] Créer `organizationContextMiddleware.ts`
- [x] Créer `organizationHelper.ts`
- [x] Ajouter types TypeScript `OrganizationContext`
- [ ] Ajouter le middleware aux routes principales
- [ ] Migrer tous les controllers pour utiliser `requireOrganizationContext()`
- [ ] Créer endpoint `GET /organizations` pour lister les orgs (SUPER_ADMIN only)
- [ ] Tester avec un SUPER_ADMIN réel
- [ ] Implémenter le sélecteur d'organisation dans le frontend

---

**Status**: ✅ Middleware créé, prêt à être intégré
**Prochaine étape**: Ajouter le middleware aux routes et migrer les controllers
