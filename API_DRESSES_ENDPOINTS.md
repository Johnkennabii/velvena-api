# API Dresses - Endpoints Documentation

Documentation complète des endpoints pour la gestion des robes (Dresses).

---

## Table des matières
1. [Robes (Dresses)](#robes-dresses)
2. [Types de robes](#types-de-robes-dresstypes)
3. [Tailles](#tailles-dresssizes)
4. [Couleurs](#couleurs-dresscolors)
5. [États/Conditions](#étatsconditions-dressconditions)
6. [Exemples de code](#exemples-de-code)

---

## Robes (Dresses)

**Base URL:** `/dresses`

### 📋 Liste des robes

```http
GET /dresses
Authorization: Bearer {JWT_TOKEN}
```

**Query parameters (optionnels):**
- `type_id` - Filtrer par type de robe
- `size_id` - Filtrer par taille
- `color_id` - Filtrer par couleur
- `condition_id` - Filtrer par état
- `published` - Filtrer par statut publication (true/false)
- `search` - Recherche par nom ou référence

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dress-uuid-1",
      "name": "Robe Princesse",
      "reference": "RDM-001",
      "price_ht": 800.00,
      "price_ttc": 960.00,
      "price_per_day_ht": 50.00,
      "price_per_day_ttc": 60.00,
      "images": [
        "https://bucket.com/dresses/image1.jpg",
        "https://bucket.com/dresses/image2.jpg"
      ],
      "published_post": true,
      "published_at": "2025-06-01T10:00:00Z",
      "type_id": "type-uuid",
      "size_id": "size-uuid",
      "color_id": "color-uuid",
      "condition_id": "condition-uuid",
      "created_at": "2025-05-15T08:30:00Z",
      "updated_at": "2025-06-01T10:00:00Z"
    }
  ]
}
```

---

### 🔍 Récupérer une robe par ID

```http
GET /dresses/:id
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid-1",
    "name": "Robe Princesse",
    "reference": "RDM-001",
    "price_ht": 800.00,
    "price_ttc": 960.00,
    "price_per_day_ht": 50.00,
    "price_per_day_ttc": 60.00,
    "images": ["..."],
    "published_post": true,
    "type_id": "type-uuid",
    "size_id": "size-uuid",
    "color_id": "color-uuid",
    "condition_id": "condition-uuid"
  }
}
```

---

### 🔍 Vue détaillée avec jointures

Récupère les robes avec les relations (type, size, color, condition).

```http
GET /dresses/details-view
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dress-uuid-1",
      "name": "Robe Princesse",
      "reference": "RDM-001",
      "price_ht": 800.00,
      "price_ttc": 960.00,
      "price_per_day_ht": 50.00,
      "price_per_day_ttc": 60.00,
      "images": ["..."],
      "type": {
        "id": "type-uuid",
        "name": "Robe de mariée"
      },
      "size": {
        "id": "size-uuid",
        "name": "M"
      },
      "color": {
        "id": "color-uuid",
        "name": "Blanc",
        "hex_code": "#FFFFFF"
      },
      "condition": {
        "id": "condition-uuid",
        "name": "Neuf"
      }
    }
  ]
}
```

---

### 📅 Vérifier la disponibilité

Vérifie quelles robes sont disponibles pour une période donnée.

```http
GET /dresses/availability?start=2025-06-15T00:00:00Z&end=2025-06-18T23:59:59Z
Authorization: Bearer {JWT_TOKEN}
```

**Query parameters:**
- `start` - Date de début (format: ISO 8601, ex: 2025-06-15T00:00:00Z)
- `end` - Date de fin (format: ISO 8601, ex: 2025-06-18T23:59:59Z)

**Réponse:**
```json
{
  "success": true,
  "count": 10,
  "filters": {
    "start": "2025-06-15T00:00:00Z",
    "end": "2025-06-18T23:59:59Z"
  },
  "data": [
    {
      "id": "dress-uuid-1",
      "name": "Robe Princesse",
      "reference": "RDM-001",
      "price_ht": 800.00,
      "price_ttc": 960.00,
      "price_per_day_ht": 50.00,
      "price_per_day_ttc": 60.00,
      "images": ["https://..."],
      "isAvailable": true,
      "current_contract": null
    },
    {
      "id": "dress-uuid-2",
      "name": "Robe Sirène",
      "reference": "RDM-002",
      "price_ht": 900.00,
      "price_ttc": 1080.00,
      "price_per_day_ht": 60.00,
      "price_per_day_ttc": 72.00,
      "images": ["https://..."],
      "isAvailable": false,
      "current_contract": {
        "start_datetime": "2025-06-10T10:00:00Z",
        "end_datetime": "2025-06-20T18:00:00Z"
      }
    }
  ]
}
```

---

### ➕ Créer une robe

```http
POST /dresses
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body (form-data):**
- `name` (string, required) - Nom de la robe
- `reference` (string, required) - Référence unique
- `price_ht` (number, required) - Prix HT
- `price_ttc` (number, required) - Prix TTC
- `price_per_day_ht` (number, required) - Prix/jour HT
- `price_per_day_ttc` (number, required) - Prix/jour TTC
- `type_id` (string, optional) - ID du type
- `size_id` (string, optional) - ID de la taille
- `color_id` (string, optional) - ID de la couleur
- `condition_id` (string, optional) - ID de l'état
- `images` (file[], optional) - Max 5 images

**Exemple avec curl:**
```bash
curl -X POST /dresses \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -F "name=Robe Princesse" \
  -F "reference=RDM-001" \
  -F "price_ht=800" \
  -F "price_ttc=960" \
  -F "price_per_day_ht=50" \
  -F "price_per_day_ttc=60" \
  -F "type_id=type-uuid" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid-new",
    "name": "Robe Princesse",
    "reference": "RDM-001",
    "images": [
      "https://bucket.com/dresses/image1.jpg",
      "https://bucket.com/dresses/image2.jpg"
    ]
  }
}
```

---

### ✏️ Mettre à jour une robe

```http
PUT /dresses/:id
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Robe Princesse Deluxe",
  "price_ht": 850.00,
  "price_ttc": 1020.00,
  "price_per_day_ht": 55.00,
  "price_per_day_ttc": 66.00,
  "type_id": "new-type-uuid"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid-1",
    "name": "Robe Princesse Deluxe",
    "price_ht": 850.00,
    "updated_at": "2025-06-08T14:30:00Z"
  }
}
```

---

### 🗑️ Supprimer une robe (Soft delete)

Marque la robe comme supprimée sans l'effacer définitivement.

```http
PATCH /dresses/:id/soft
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Dress soft deleted",
  "data": {
    "id": "dress-uuid-1",
    "deleted_at": "2025-06-08T15:00:00Z"
  }
}
```

---

### 💥 Supprimer une robe (Hard delete)

Supprime définitivement la robe de la base de données.

```http
DELETE /dresses/:id/hard
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Dress permanently deleted"
}
```

---

### 📢 Publier une robe

Rend la robe visible publiquement (ex: site e-commerce).

```http
POST /dresses/:id/publish
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid-1",
    "published_post": true,
    "published_at": "2025-06-08T16:00:00Z",
    "published_by": "user-uuid"
  }
}
```

---

### 📴 Dépublier une robe

Rend la robe invisible publiquement.

```http
POST /dresses/:id/unpublish
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid-1",
    "published_post": false,
    "published_at": null
  }
}
```

---

## 🖼️ Gestion des images

### ➕ Ajouter des images à une robe

```http
POST /dresses/:id/images
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body (form-data):**
- `images` (file[], required) - Max 5 images

**Exemple:**
```bash
curl -X POST /dresses/dress-uuid-1/images \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -F "images=@/path/to/image3.jpg" \
  -F "images=@/path/to/image4.jpg"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "dress-uuid-1",
    "images": [
      "https://bucket.com/dresses/image1.jpg",
      "https://bucket.com/dresses/image2.jpg",
      "https://bucket.com/dresses/image3.jpg",
      "https://bucket.com/dresses/image4.jpg"
    ]
  }
}
```

---

### ❌ Supprimer une image (par clé)

```http
DELETE /dresses/:id/images/:key
Authorization: Bearer {JWT_TOKEN}
```

**Exemple:**
```bash
DELETE /dresses/dress-uuid-1/images/dresses%2Fimage3.jpg
```

**Réponse:**
```json
{
  "success": true,
  "message": "Image removed",
  "data": {
    "images": [
      "https://bucket.com/dresses/image1.jpg",
      "https://bucket.com/dresses/image2.jpg",
      "https://bucket.com/dresses/image4.jpg"
    ]
  }
}
```

---

### ❌ Supprimer plusieurs images

```http
DELETE /dresses/:id/images
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "keys": [
    "dresses/image1.jpg",
    "dresses/image2.jpg"
  ]
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Images removed",
  "data": {
    "images": [
      "https://bucket.com/dresses/image4.jpg"
    ]
  }
}
```

---

## Types de robes (DressTypes)

**Base URL:** `/dress-types`

### Liste des types

```http
GET /dress-types
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "type-uuid-1",
      "name": "Robe de mariée",
      "description": "Robes pour mariages",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "type-uuid-2",
      "name": "Robe de soirée",
      "description": "Robes pour événements"
    }
  ]
}
```

### Créer un type

```http
POST /dress-types
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Robe cocktail",
  "description": "Robes courtes élégantes"
}
```

### Modifier un type

```http
PUT /dress-types/:id
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Robe de cocktail",
  "description": "Description mise à jour"
}
```

### Supprimer un type (Soft)

```http
PATCH /dress-types/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer un type (Hard)

```http
DELETE /dress-types/:id
Authorization: Bearer {JWT_TOKEN}
```

---

## Tailles (DressSizes)

**Base URL:** `/dress-sizes`

### Liste des tailles

```http
GET /dress-sizes
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "size-uuid-1",
      "name": "XS"
    },
    {
      "id": "size-uuid-2",
      "name": "S"
    },
    {
      "id": "size-uuid-3",
      "name": "M"
    },
    {
      "id": "size-uuid-4",
      "name": "L"
    }
  ]
}
```

### Créer une taille

```http
POST /dress-sizes
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "XL"
}
```

### Modifier une taille

```http
PUT /dress-sizes/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer une taille (Soft)

```http
PATCH /dress-sizes/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer une taille (Hard)

```http
DELETE /dress-sizes/:id
Authorization: Bearer {JWT_TOKEN}
```

---

## Couleurs (DressColors)

**Base URL:** `/dress-colors`

### Liste des couleurs

```http
GET /dress-colors
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "color-uuid-1",
      "name": "Blanc",
      "hex_code": "#FFFFFF"
    },
    {
      "id": "color-uuid-2",
      "name": "Ivoire",
      "hex_code": "#FFFFF0"
    },
    {
      "id": "color-uuid-3",
      "name": "Rose",
      "hex_code": "#FFC0CB"
    }
  ]
}
```

### Créer une couleur

```http
POST /dress-colors
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Champagne",
  "hex_code": "#F7E7CE"
}
```

### Modifier une couleur

```http
PUT /dress-colors/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer une couleur (Soft)

```http
PATCH /dress-colors/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer une couleur (Hard)

```http
DELETE /dress-colors/:id
Authorization: Bearer {JWT_TOKEN}
```

---

## États/Conditions (DressConditions)

**Base URL:** `/dress-conditions`

### Liste des états

```http
GET /dress-conditions
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "condition-uuid-1",
      "name": "Neuf"
    },
    {
      "id": "condition-uuid-2",
      "name": "Excellent"
    },
    {
      "id": "condition-uuid-3",
      "name": "Bon"
    },
    {
      "id": "condition-uuid-4",
      "name": "Correct"
    }
  ]
}
```

### Créer un état

```http
POST /dress-conditions
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Comme neuf"
}
```

### Modifier un état

```http
PUT /dress-conditions/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer un état (Soft)

```http
PATCH /dress-conditions/:id
Authorization: Bearer {JWT_TOKEN}
```

### Supprimer un état (Hard)

```http
DELETE /dress-conditions/:id
Authorization: Bearer {JWT_TOKEN}
```

---

## Exemples de code

### Exemple React/TypeScript - Créer une robe avec images

```typescript
async function createDress(dressData: {
  name: string;
  reference: string;
  price_ht: number;
  price_ttc: number;
  price_per_day_ht: number;
  price_per_day_ttc: number;
  type_id?: string;
  size_id?: string;
  color_id?: string;
  condition_id?: string;
  images?: File[];
}) {
  const formData = new FormData();

  // Ajouter les champs texte
  formData.append('name', dressData.name);
  formData.append('reference', dressData.reference);
  formData.append('price_ht', dressData.price_ht.toString());
  formData.append('price_ttc', dressData.price_ttc.toString());
  formData.append('price_per_day_ht', dressData.price_per_day_ht.toString());
  formData.append('price_per_day_ttc', dressData.price_per_day_ttc.toString());

  // Ajouter les IDs optionnels
  if (dressData.type_id) formData.append('type_id', dressData.type_id);
  if (dressData.size_id) formData.append('size_id', dressData.size_id);
  if (dressData.color_id) formData.append('color_id', dressData.color_id);
  if (dressData.condition_id) formData.append('condition_id', dressData.condition_id);

  // Ajouter les images
  if (dressData.images) {
    dressData.images.forEach(image => {
      formData.append('images', image);
    });
  }

  const response = await fetch('/api/dresses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
}
```

### Exemple - Vérifier disponibilité avant création contrat

```typescript
async function checkAvailability(startDate: string, endDate: string) {
  // Les dates doivent être au format ISO 8601
  const response = await fetch(
    `/api/dresses/availability?start=${startDate}&end=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const { data } = await response.json();
  return data; // Liste complète avec isAvailable
}

// Usage
const result = await checkAvailability('2025-06-15T00:00:00Z', '2025-06-18T23:59:59Z');
const availableDresses = result.filter(d => d.isAvailable);
console.log(`${availableDresses.length} robes disponibles`);
```

### Exemple - Publier une robe

```typescript
async function publishDress(dressId: string) {
  const response = await fetch(`/api/dresses/${dressId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}
```

### Exemple - Ajouter des images à une robe existante

```typescript
async function addImagesToDress(dressId: string, images: File[]) {
  const formData = new FormData();

  images.forEach(image => {
    formData.append('images', image);
  });

  const response = await fetch(`/api/dresses/${dressId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
}
```

### Exemple - Récupérer robes avec filtres

```typescript
async function getDresses(filters: {
  type_id?: string;
  size_id?: string;
  color_id?: string;
  published?: boolean;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (filters.type_id) params.append('type_id', filters.type_id);
  if (filters.size_id) params.append('size_id', filters.size_id);
  if (filters.color_id) params.append('color_id', filters.color_id);
  if (filters.published !== undefined) params.append('published', filters.published.toString());
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`/api/dresses?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}

// Usage
const dresses = await getDresses({
  type_id: 'wedding-type-uuid',
  size_id: 'M-uuid',
  published: true
});
```

---

## Récapitulatif des endpoints

### Robes principales

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/dresses` | Liste des robes |
| `GET` | `/dresses/:id` | Détails d'une robe |
| `GET` | `/dresses/details-view` | Vue avec jointures |
| `GET` | `/dresses/availability` | Vérifier disponibilité |
| `POST` | `/dresses` | Créer une robe |
| `PUT` | `/dresses/:id` | Modifier une robe |
| `PATCH` | `/dresses/:id/soft` | Soft delete |
| `DELETE` | `/dresses/:id/hard` | Hard delete |
| `POST` | `/dresses/:id/publish` | Publier |
| `POST` | `/dresses/:id/unpublish` | Dépublier |

### Images

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/dresses/:id/images` | Ajouter images |
| `DELETE` | `/dresses/:id/images/:key` | Supprimer une image |
| `DELETE` | `/dresses/:id/images` | Supprimer plusieurs images |

### Données auxiliaires

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET/POST/PUT/PATCH/DELETE` | `/dress-types` | Types de robes |
| `GET/POST/PUT/PATCH/DELETE` | `/dress-sizes` | Tailles |
| `GET/POST/PUT/PATCH/DELETE` | `/dress-colors` | Couleurs |
| `GET/POST/PUT/PATCH/DELETE` | `/dress-conditions` | États |

---

**Version:** 1.0
**Dernière mise à jour:** 2025-12-07
