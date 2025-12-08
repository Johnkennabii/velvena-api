# Routes de Stockage - Documentation Frontend

**Date**: 2025-12-08
**Status**: ✅ Mise à jour multi-tenant complétée

## 🔐 Authentification

Toutes les routes nécessitent un **JWT Bearer Token** dans le header:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json' // ou multipart/form-data pour les uploads
}
```

L'`organizationId` est **automatiquement extrait du JWT** par le backend. Le frontend n'a **pas besoin** de l'envoyer manuellement.

---

## 📸 Routes Images de Robes

### Base URL: `http://localhost:3000/dress-storage`

### 1. **Upload d'images**

```http
POST /dress-storage
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (FormData)**:
```typescript
const formData = new FormData();
formData.append('images', file1); // Max 5 images
formData.append('images', file2);
formData.append('images', file3);
```

**Response** (200):
```json
{
  "success": true,
  "urls": [
    "https://velvena-medias.hel1.your-objectstorage.com/df22aa6e-e0a2-4fa0-981f-a8b7fd74d926/dresses/550e8400-e29b-41d4-a716-446655440000.jpg",
    "https://velvena-medias.hel1.your-objectstorage.com/df22aa6e-e0a2-4fa0-981f-a8b7fd74d926/dresses/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg"
  ]
}
```

**Notes**:
- ✅ Le path inclut maintenant l'`organization_id` automatiquement
- ✅ Format: `{org-id}/dresses/{uuid}.jpg`
- ✅ Max 5 images par requête
- ✅ Le backend vérifie automatiquement l'isolation multi-tenant

---

### 2. **Liste des images d'une organisation**

```http
GET /dress-storage
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "images": [
    {
      "key": "df22aa6e-e0a2-4fa0-981f-a8b7fd74d926/dresses/image1.jpg",
      "url": "https://velvena-medias.hel1.your-objectstorage.com/df22aa6e-e0a2-4fa0-981f-a8b7fd74d926/dresses/image1.jpg",
      "size": 245678,
      "lastModified": "2025-12-07T10:30:00.000Z"
    }
  ]
}
```

**Notes**:
- ✅ Retourne **uniquement** les images de l'organisation authentifiée
- ✅ Isolation automatique par `organization_id`

---

### 3. **Suppression d'une image**

```http
DELETE /dress-storage/:key
Authorization: Bearer {token}
```

**Paramètres**:
- `key` (path): Nom du fichier uniquement, **sans** le path complet

**Exemple**:
```typescript
// ❌ INCORRECT:
DELETE /dress-storage/df22aa6e-e0a2-4fa0-981f-a8b7fd74d926/dresses/image.jpg

// ✅ CORRECT:
DELETE /dress-storage/image.jpg
```

**Response** (200):
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Notes**:
- ✅ Le backend reconstruit automatiquement le path complet avec `organization_id`
- ✅ Impossible de supprimer une image d'une autre organisation

---

## 👗 Routes Robes (CRUD avec images)

### Base URL: `http://localhost:3000/dresses`

### 1. **Suppression d'image d'une robe**

```http
DELETE /dresses/:dressId/images
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```json
{
  "key": "image-uuid.jpg"
}
```

**OU plusieurs clés**:
```json
{
  "keys": ["image1.jpg", "image2.jpg"]
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid",
    "images": ["remaining-image.jpg"],
    "updated_at": "2025-12-08T10:00:00.000Z"
  },
  "deleted": ["image1.jpg", "image2.jpg"],
  "notFound": []
}
```

**Notes**:
- ✅ Envoyer **uniquement le nom du fichier** (ex: `"image.jpg"`)
- ✅ Le backend reconstruit le path complet: `{org-id}/dresses/{filename}`
- ✅ Support des formats legacy pendant la migration
- ✅ Vérifie automatiquement que la robe appartient à l'organisation

---

### 2. **Ajout d'images à une robe**

```http
POST /dresses/:dressId/images
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData)**:
```typescript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid",
    "images": [
      "https://velvena-medias.hel1.your-objectstorage.com/org-id/dresses/new-image.jpg"
    ]
  }
}
```

**Notes**:
- ✅ Les nouvelles images utilisent automatiquement le format multi-tenant
- ✅ Max 5 images par upload

---

## 📄 Routes Contrats (PDFs)

### Base URL: `http://localhost:3000/contracts`

### 1. **Upload d'un PDF signé manuellement**

```http
POST /contracts/:contractId/upload-signed-pdf
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData)**:
```typescript
const formData = new FormData();
formData.append('file', pdfFile); // File must be PDF
```

**Response** (200):
```json
{
  "success": true,
  "link": "https:/velvena-medias/.hel1.your-objectstorage.com/org-id/contracts/contract-id_signed_upload_1733612345678.pdf",
  "data": {
    "id": "contract-id",
    "signed_pdf_url": "...",
    "status": "SIGNED",
    "signed_at": "2025-12-08T10:00:00.000Z"
  }
}
```

**Notes**:
- ✅ Format du fichier: `{org-id}/contracts/{contract-id}_signed_upload_{timestamp}.pdf`
- ✅ Supprime automatiquement les anciens PDFs auto-générés
- ✅ Vérifie que le contrat appartient à l'organisation

---

### 2. **Génération automatique de PDF**

```http
POST /contracts/:contractId/generate-pdf
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "link": "https://velvena-medias.hel1.your-objectstorage.com/org-id/contracts/contract-id_signed_1733612345678.pdf"
}
```

**Notes**:
- ✅ PDF généré automatiquement avec format multi-tenant
- ✅ Utilisé pour signature manuelle

---

### 3. **Téléchargement du contrat signé (PUBLIC)**

```http
GET /contracts/download/:contractId/:token
```

**Paramètres**:
- `contractId`: ID du contrat
- `token`: Token de signature (pour authentification publique)

**Response**: Binary PDF file

**Notes**:
- ℹ️ Cette route est **publique** (pas de JWT requis)
- ℹ️ Utilise le token de signature pour autorisation
- ✅ Le PDF est toujours dans le format multi-tenant

---

## 🔧 Changements Frontend Requis

### 1. **Extraction du nom de fichier depuis URL**

**Avant (mono-client)**:
```typescript
const extractStorageId = (url: string): string => {
  // https://bucket.com/dresses/uuid.jpg
  return url.split("/").pop() ?? "";  // → "uuid.jpg"
};
```

**Après (multi-tenant)** - **AUCUN CHANGEMENT NÉCESSAIRE**:
```typescript
const extractStorageId = (url: string): string => {
  // https://bucket.com/org-uuid/dresses/uuid.jpg
  const parts = url.split("/");
  return parts[parts.length - 1] ?? "";  // → "uuid.jpg" ✅ Fonctionne aussi
};
```

---

### 2. **Suppression d'images**

**Aucun changement nécessaire !** Continuez à envoyer uniquement le nom du fichier:

```typescript
// ✅ RESTE IDENTIQUE
await api.delete(`/dresses/${dressId}/images`, {
  body: JSON.stringify({ key: "image-uuid.jpg" })
});
```

Le backend reconstruit automatiquement: `{org-id}/dresses/image-uuid.jpg`

---

### 3. **Affichage des images**

**Aucun changement nécessaire !** Les URLs complètes sont retournées par l'API:

```typescript
// ✅ Utilisez directement l'URL retournée
<img src={dress.images[0]} alt="Robe" />

// URL format: https://bucket.com/org-uuid/dresses/uuid.jpg
```

---

## 🚨 Erreurs Possibles

### 403 Forbidden - "Organization context required"

**Cause**: JWT manquant ou invalide, ou utilisateur sans `organization_id`

**Solution**:
1. Vérifier que le header `Authorization: Bearer {token}` est présent
2. Vérifier que le token est valide et non expiré
3. Vérifier que l'utilisateur a un `organization_id` dans la base de données

---

### 404 Not Found - "None of the provided image keys belong to this dress"

**Cause**: Le nom du fichier ne correspond à aucune image de cette robe

**Solution**:
1. Vérifier que vous envoyez le bon nom de fichier (dernier segment de l'URL)
2. Vérifier que la robe appartient à votre organisation

---

## 📊 Structure de Stockage Finale

```
velvena-medias/
  ├── {org-uuid-1}/
  │   ├── dresses/
  │   │   ├── image1.jpg
  │   │   ├── image2.jpg
  │   │   └── image3.jpg
  │   └── contracts/
  │       ├── contract-uuid_signed_1733612345678.pdf
  │       └── contract-uuid_signed_upload_1733612456789.pdf
  │
  ├── {org-uuid-2}/
  │   ├── dresses/
  │   │   └── ...
  │   └── contracts/
  │       └── ...
```

**Bénéfices**:
- ✅ Isolation complète entre organisations
- ✅ Impossible d'accéder aux fichiers d'une autre org
- ✅ Structure claire et organisée
- ✅ Facilite les backups par organisation

---

## ✅ Checklist d'Intégration Frontend

- [ ] Vérifier que tous les appels API incluent le header `Authorization: Bearer {token}`
- [ ] Tester l'upload d'images de robes
- [ ] Tester la suppression d'images de robes
- [ ] Tester l'upload de PDFs signés
- [ ] Gérer les erreurs 403 (rediriger vers login si token expiré)
- [ ] Vérifier que l'extraction du nom de fichier fonctionne avec les nouvelles URLs
- [ ] Tester avec plusieurs organisations pour vérifier l'isolation

---

**Dernière mise à jour**: 2025-12-08
**Statut Backend**: ✅ Multi-tenant complet
**Changements Frontend**: ⚠️ Minimes (principalement ajouter les headers Authorization si manquants)
