# Migration Multi-Tenant Storage - Guide Complet

## ✅ Changements Effectués

### 1. **Helper créé:** `src/utils/storageHelper.ts`

Nouveau système de gestion des paths multi-tenant :

```typescript
buildStoragePath(orgId, 'dresses', 'filename.jpg')
// → "org-uuid/dresses/filename.jpg"

buildPublicUrl(bucketUrl, path)
// → "https://bucket.com/org-uuid/dresses/filename.jpg"

extractPathFromUrl(url, bucketUrl)
// → "org-uuid/dresses/filename.jpg"
```

### 2. **Fichiers modifiés:**

#### ✅ `src/controllers/bucketController/dressStorageController.ts`
- [x] `listDressImages()` - Utilise `buildListPrefix()` avec organization_id
- [x] `uploadDressImages()` - Utilise `buildStoragePath()` avec organization_id
- [x] `deleteDressImage()` - Utilise `buildStoragePath()` avec organization_id

#### ✅ `src/controllers/dressController/dressController.ts` (partiel)
- [x] Import du helper
- [x] `createDress()` - buildDressKey() modifié pour inclure organization_id
- [x] `updateDress()` - buildDressKey() modifié pour inclure organization_id
- [x] `addDressImages()` - buildDressKey() modifié + vérification organization

#### ✅ `src/controllers/dressController/dressController.ts` (complet)
- [x] `removeDressImage()` - **COMPLÉTÉ**
  - Utilise maintenant `buildStoragePath()` avec organization_id
  - Vérifie l'appartenance du dress à l'organisation
  - Support des formats legacy pour la migration

---

## 🔴 Problème Critique Actuel

### **Frontend en Mono-Client**

Le frontend envoie des URLs d'images **SANS organization_id** dans le path :

```
❌ Ancien format (mono-client):
https://velvena-medias.hel1.your-objectstorage.com/dresses/uuid.jpg

✅ Nouveau format (multi-tenant):
https://velvena-medias.hel1.your-objectstorage.com/org-uuid/dresses/uuid.jpg
```

### Impact

1. **Images existantes** dans le bucket ne contiennent PAS d'organization_id dans le path
2. **Frontend** doit être mis à jour pour gérer les nouveaux paths
3. **Migration nécessaire** pour les images existantes

---

## 📋 Plan de Migration

### Phase 1: Backend ✅ (Complété)

- [x] Créer storageHelper.ts
- [x] Modifier dressStorageController.ts
- [x] Modifier dressController.ts (complet)
- [x] **Terminer removeDressImage()**
- [x] Migrer contractController.ts pour les PDFs
- [ ] Tester tous les endpoints d'upload/delete

### Phase 2: Migration des données

Deux options :

#### Option A: Migration Complète (Recommandée)

```typescript
// Script de migration
async function migrateImagesToMultiTenant() {
  const organizations = await prisma.organization.findMany();

  for (const org of organizations) {
    // 1. Récupérer toutes les robes de l'org
    const dresses = await prisma.dress.findMany({
      where: { organization_id: org.id }
    });

    for (const dress of dresses) {
      const newImages = [];

      for (const oldUrl of dress.images) {
        // 2. Extraire le nom du fichier
        const filename = oldUrl.split('/').pop();

        // 3. Copier vers nouveau path
        const newKey = buildStoragePath(org.id, 'dresses', filename);
        await s3.send(new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/dresses/${filename}`,
          Key: newKey
        }));

        // 4. Construire la nouvelle URL
        newImages.push(buildPublicUrl(bucketUrl, newKey));
      }

      // 5. Mettre à jour la base de données
      await prisma.dress.update({
        where: { id: dress.id },
        data: { images: newImages }
      });

      // 6. Supprimer l'ancienne image (optionnel)
      // await s3.send(new DeleteObjectCommand({ ... }));
    }
  }
}
```

#### Option B: Support Dual-Path (Temporaire)

Supporter les deux formats pendant la migration :

```typescript
function extractImageKey(url: string, organizationId: string): string {
  // Nouveau format: org-uuid/dresses/filename.jpg
  if (url.includes(`/${organizationId}/dresses/`)) {
    return extractPathFromUrl(url, bucketUrl);
  }

  // Ancien format: dresses/filename.jpg
  if (url.includes('/dresses/')) {
    const filename = url.split('/').pop();
    return `dresses/${filename}`;
  }

  throw new Error('Invalid image URL format');
}
```

### Phase 3: Frontend

#### Changements nécessaires dans le frontend:

1. **Extraction de l'ID d'image:**

```typescript
// Avant (mono-client):
const extractStorageId = (url: string): string => {
  // https://bucket.com/dresses/uuid.jpg
  return url.split("/").pop() ?? "";  // → uuid.jpg
};

// Après (multi-tenant):
const extractStorageId = (url: string): string => {
  // https://bucket.com/org-uuid/dresses/uuid.jpg
  const parts = url.split("/");
  return parts[parts.length - 1] ?? "";  // → uuid.jpg
};
```

2. **Suppression d'image:**

```typescript
// Avant:
DELETE /dresses/:dressId/images
Body: { key: "uuid.jpg" }

// Après (RESTE IDENTIQUE):
DELETE /dresses/:dressId/images
Body: { key: "uuid.jpg" }
// Le backend reconstruit le path complet avec organization_id
```

3. **Affichage des images:**

Aucun changement nécessaire ! Les URLs complètes sont retournées par l'API.

---

## 🔧 Changements Contractuels (Complétés)

### ✅ `contractController.ts` - Migration Multi-Tenant des PDFs

#### 1. Import des storage helpers (ligne 15)
```typescript
import { buildStoragePath, buildListPrefix, buildPublicUrl } from "../../utils/storageHelper.js";
```

#### 2. `uploadSignedContractPdf()` - Upload avec multi-tenant (lignes 915-997)

**Avant:**
```typescript
const contract = await prisma.contract.findUnique({ where: { id } });
const key = `${CONTRACTS_FOLDER}/${id}/signed_upload_${Date.now()}.pdf`; // ❌ CONTRACTS_FOLDER non défini
const pdfUrl = `${bucketUrlPrefix}${key}`;
```

**Après:**
```typescript
// Vérification organization
const user = (req as any).user;
if (!user?.organizationId) {
  return res.status(403).json({ error: "Organization context required" });
}

// Multi-tenant isolation
const contract = await prisma.contract.findFirst({
  where: { id, organization_id: user.organizationId }
});

// Multi-tenant storage path
const filename = `${id}_signed_upload_${Date.now()}.pdf`;
const key = buildStoragePath(user.organizationId, 'contracts', filename);
const pdfUrl = buildPublicUrl(bucketUrlPrefix, key);
```

#### 3. Cleanup PDFs automatiques avec multi-tenant (lignes 934-971)

**Avant:**
```typescript
const contractFolder = `${CONTRACTS_FOLDER}/${id}/`; // ❌ Structure mono-client
const listCommand = new ListObjectsV2Command({
  Bucket: hetznerBucket,
  Prefix: contractFolder,
});
```

**Après:**
```typescript
// Liste SEULEMENT les PDFs de l'organisation
const contractsPrefix = buildListPrefix(user.organizationId, 'contracts');
const listCommand = new ListObjectsV2Command({
  Bucket: hetznerBucket,
  Prefix: contractsPrefix,
});

// Filtre pour ce contrat spécifique
const filesToDelete = listResponse.Contents?.filter(obj => {
  const key = obj.Key || "";
  // Match: {org-id}/contracts/{contract-id}_signed_*.pdf
  // Exclude: {org-id}/contracts/{contract-id}_signed_upload_*.pdf
  return key.includes(`/${id}_signed_`) && !key.includes(`/${id}_signed_upload_`);
}) || [];
```

**Bénéfices:**
- ✅ Isolation complète entre organisations
- ✅ Impossible d'accéder/supprimer les PDFs d'une autre org
- ✅ Structure cohérente: `{org-id}/contracts/{contract-id}_signed_*.pdf`
- ✅ Correction du bug CONTRACTS_FOLDER non défini

---

## 🔧 Fonction à Réécrire: `removeDressImage`

### Actuelle (cassée):

```typescript
export const removeDressImage = async (req: AuthenticatedRequest, res: Response) => {
  // ...
  const fullKey = ensureDressKey(candidate);  // ❌ N'existe plus
  const shortKey = stripDressPrefix(fullKey); // ❌ N'existe plus
  // ...
};
```

### Nouvelle version (à implémenter):

```typescript
export const removeDressImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    // Collecter les clés depuis body/query/params
    const collectKeys = (): string[] => {
      const raw: string[] = [];
      // ... même logique ...
      return Array.from(new Set(raw));
    };

    const keys = collectKeys();

    if (!id || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Dress ID and at least one image key are required",
      });
    }

    // Vérifier que la robe appartient à l'organisation
    const dress = await prisma.dress.findFirst({
      where: {
        id,
        organization_id: req.user.organizationId, // Multi-tenant isolation
      },
    });

    if (!dress) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    const existingImages = new Set(dress.images ?? []);
    const keysFound: Array<{ filename: string; s3Key: string; urls: string[] }> = [];
    const keysNotFound: string[] = [];

    // Pour chaque clé fournie, vérifier si elle existe dans les images du dress
    keys.forEach((filename) => {
      // Construire le path S3 multi-tenant
      const s3Key = buildStoragePath(req.user!.organizationId, 'dresses', filename);
      const fullUrl = buildPublicUrl(bucketUrlPrefix, s3Key);

      // Vérifier si cette URL existe dans les images du dress
      const matchingUrls: string[] = [];

      if (existingImages.has(fullUrl)) {
        matchingUrls.push(fullUrl);
      }

      // Support ancien format (migration)
      const legacyUrl = `${legacyDressBucketUrlPrefix}${filename}`;
      if (existingImages.has(legacyUrl)) {
        matchingUrls.push(legacyUrl);
      }

      if (matchingUrls.length > 0) {
        keysFound.push({ filename, s3Key, urls: matchingUrls });
      } else {
        keysNotFound.push(filename);
      }
    });

    if (keysFound.length === 0) {
      return res.status(404).json({
        success: false,
        error: "None of the provided image keys belong to this dress",
        details: { keysNotFound },
      });
    }

    // Supprimer les images du bucket S3
    await Promise.all(
      keysFound.map(({ s3Key }) =>
        s3.send(
          new DeleteObjectCommand({
            Bucket: hetznerBucket,
            Key: s3Key,
          })
        )
      )
    );

    // Mettre à jour la base de données
    const urlsToDelete = new Set(keysFound.flatMap(({ urls }) => urls));
    const updatedImages = (dress.images ?? []).filter((img) => !urlsToDelete.has(img));

    const updated = await prisma.dress.update({
      where: { id },
      data: { images: updatedImages, updated_by: req.user?.id ?? null },
    });

    pino.info(
      {
        dressId: id,
        organizationId: req.user.organizationId,
        deletedCount: keysFound.length,
        keysNotFound: keysNotFound.length > 0 ? keysNotFound : undefined,
      },
      "✅ Images supprimées"
    );

    res.json({
      success: true,
      data: updated,
      deleted: keysFound.map(({ filename }) => filename),
      notFound: keysNotFound.length > 0 ? keysNotFound : undefined,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur suppression image robe");
    res.status(500).json({ success: false, error: "Failed to remove dress image" });
  }
};
```

---

## 📝 Checklist Finale

### Backend ✅
- [x] storageHelper.ts créé
- [x] dressStorageController.ts migré
- [x] dressController.ts (complet)
- [x] **removeDressImage() réécrite**
- [x] contractController.ts migré
- [x] generateContractPDF.ts migré
- [x] pdfGenerator.ts migré
- [ ] Tests end-to-end
- [ ] Documenter la nouvelle structure dans API docs

### Contracts ✅ (Complété)
- [x] Vérifier contractController.ts
- [x] Migrer uploads/downloads de PDFs
- [x] Structure: `{org-id}/contracts/{contract-id}_signed_*.pdf`
- [x] Support multi-tenant pour uploadSignedContractPdf
- [x] Nettoyage automatique des anciens PDFs avec isolation multi-tenant

### Migration
- [ ] Créer script de migration
- [ ] Tester sur environnement de dev
- [ ] Migrer les données prod
- [ ] Vérifier l'intégrité

### Frontend
- [ ] Mettre à jour extractStorageId()
- [ ] Tester upload/delete d'images
- [ ] Gérer les erreurs 403

---

## 🎯 Prochaines Étapes Immédiates

1. ✅ ~~**Terminer removeDressImage()**~~ - Complété
2. ✅ ~~**Migrer contractController.ts**~~ - Complété
3. **Créer un script de migration** pour les images et PDFs existants
4. **Tester en local** avec 2 organizations
5. **Documenter** pour le frontend

---

## ⚠️ Notes Importantes

1. **Bucket Configuration:**
   - Access Key: `TQS5M647SKRO9TXEVWM4`
   - Secret Key: `ndjeJiHn6aOZy0dagnv1wYoJZKO8op79CKHmOIzP`
   - Endpoint: `hel1.your-objectstorage.com`
   - Bucket: `velvena-medias`

2. **Structure Finale:**
   ```
   velvena-medias/
     ├── {org-uuid-1}/
     │   ├── dresses/
     │   │   └── {image-uuid}.jpg
     │   ├── contracts/
     │   │   ├── {contract-uuid}.pdf
     │   │   └── {contract-uuid}-signed.pdf
     │   └── profiles/
     │       └── avatars/
     ├── {org-uuid-2}/
     │   └── ...
   ```

3. **Sécurité:**
   - Toujours vérifier `organization_id` avant toute opération
   - Ne JAMAIS permettre l'accès aux fichiers d'une autre org
   - Logger tous les accès pour audit

---

**Date de début:** 2025-12-07
**Dernière mise à jour:** 2025-12-08
**Status:** ✅ **Backend Complété** - Migration multi-tenant terminée pour tous les fichiers (images & PDFs)

### 📊 Résumé de la migration:

#### ✅ Complété:
- **storageHelper.ts** - Helpers centralisés pour paths multi-tenant
- **dressStorageController.ts** - Upload/liste/suppression d'images avec isolation org
- **dressController.ts** - CRUD complet des robes avec multi-tenant storage
- **contractController.ts** - Upload/suppression de PDFs avec isolation org
- **generateContractPDF.ts** - Génération de PDFs dans paths multi-tenant
- **pdfGenerator.ts** - Alternative de génération PDF avec multi-tenant

#### ⏳ En attente:
- **Script de migration** - Pour déplacer les fichiers existants vers structure multi-tenant
- **Tests end-to-end** - Validation de tous les endpoints
- **Frontend** - Mise à jour pour gérer les nouveaux formats d'URL (changements minimes)
- **Documentation API** - Documenter la nouvelle structure pour l'équipe frontend

#### 🔧 Changements techniques appliqués:
1. **Structure de stockage**: `{org-id}/{type}/{filename}` au lieu de `{type}/{filename}`
2. **Isolation stricte**: Toutes les opérations vérifient `organization_id` avant accès
3. **Backward compatibility**: Support des anciens formats pendant la transition
4. **Sécurité renforcée**: Impossible d'accéder aux fichiers d'une autre organisation
