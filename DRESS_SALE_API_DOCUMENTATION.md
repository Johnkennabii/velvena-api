# Documentation API - Mise en Vente de Robes

## Vue d'ensemble

Cette fonctionnalité permet de vendre des robes (et non uniquement de les louer) avec une gestion automatique du stock. Le système supporte :
- Mise en vente de robes via un flag `is_for_sale`
- Gestion de stock avec décrémentation automatique lors de ventes
- Filtrage des robes disponibles à la vente
- Validation du stock avant création de contrat de vente

## 1. Modifications du Modèle Dress

### Nouveaux Champs

| Champ | Type | Valeur par défaut | Description |
|-------|------|-------------------|-------------|
| `stock_quantity` | `Int` | `1` | Quantité en stock de la robe |
| `is_for_sale` | `Boolean` | `false` | Indique si la robe est disponible à la vente |

### Exemple de Robe

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Robe de soirée élégante",
  "reference": "RS-2024-001",
  "price_ht": 1200.00,
  "price_ttc": 1440.00,
  "price_per_day_ht": 150.00,
  "price_per_day_ttc": 180.00,
  "stock_quantity": 3,
  "is_for_sale": true,
  "images": [
    "https://velvena-medias.hel1.your-objectstorage.com/org-id/dresses/image-uuid.jpg"
  ],
  "type_id": "type-uuid",
  "size_id": "size-uuid",
  "color_id": "color-uuid",
  "condition_id": "condition-uuid"
}
```

## 2. Endpoints API

### 2.1 GET /api/dresses/details-view

Récupère les robes avec détails et supporte des filtres pour la gestion de stock et de vente.

#### Query Parameters

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `page` | `number` | Numéro de page (défaut: 1) | `?page=1` |
| `limit` | `number` | Nombre d'éléments par page (défaut: 10) | `?limit=20` |
| `is_for_sale` | `boolean` | Filtre par disponibilité à la vente | `?is_for_sale=true` |
| `stock_quantity` | `number` | Filtre par quantité exacte en stock | `?stock_quantity=5` |
| `in_stock` | `boolean` | Filtre par disponibilité en stock (> 0 ou <= 0) | `?in_stock=true` |
| `sizes` | `string` | Liste d'IDs de tailles séparés par virgule | `?sizes=uuid1,uuid2` |
| `types` | `string` | Liste d'IDs de types séparés par virgule | `?types=uuid1,uuid2` |
| `colors` | `string` | Liste d'IDs de couleurs séparés par virgule | `?colors=uuid1,uuid2` |
| `priceMax` | `number` | Prix maximum TTC | `?priceMax=2000` |
| `pricePerDayMax` | `number` | Prix maximum par jour TTC | `?pricePerDayMax=200` |
| `search` | `string` | Recherche par nom ou référence | `?search=robe+soirée` |

#### Exemples de Requêtes

**Récupérer toutes les robes disponibles à la vente :**
```bash
GET /api/dresses/details-view?is_for_sale=true
```

**Récupérer les robes en stock à vendre :**
```bash
GET /api/dresses/details-view?is_for_sale=true&in_stock=true
```

**Récupérer les robes en rupture de stock :**
```bash
GET /api/dresses/details-view?in_stock=false
```

**Récupérer les robes avec exactement 5 unités en stock :**
```bash
GET /api/dresses/details-view?stock_quantity=5
```

#### Réponse

```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Robe de soirée élégante",
      "reference": "RS-2024-001",
      "price_ht": 1200.00,
      "price_ttc": 1440.00,
      "price_per_day_ht": 150.00,
      "price_per_day_ttc": 180.00,
      "stock_quantity": 3,
      "is_for_sale": true,
      "images": ["https://..."],
      "rental_count": 12,
      "type": {
        "id": "type-uuid",
        "name": "Robe de soirée"
      },
      "size": {
        "id": "size-uuid",
        "name": "M"
      },
      "color": {
        "id": "color-uuid",
        "name": "Rouge",
        "hex_code": "#FF0000"
      },
      "condition": {
        "id": "condition-uuid",
        "name": "Neuf"
      }
    }
  ]
}
```

### 2.2 GET /api/dresses/availability

Récupère la disponibilité des robes pour une période donnée (location). **Exclut automatiquement les robes en rupture de stock (`stock_quantity = 0`)**.

#### Query Parameters

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `start` | `ISO Date` | Date de début de période | `?start=2024-12-25T00:00:00Z` |
| `end` | `ISO Date` | Date de fin de période | `?end=2024-12-31T23:59:59Z` |

#### Exemple de Requête

```bash
GET /api/dresses/availability?start=2024-12-25T00:00:00Z&end=2024-12-31T23:59:59Z
```

#### Réponse

```json
{
  "success": true,
  "count": 38,
  "filters": {
    "start": "2024-12-25T00:00:00.000Z",
    "end": "2024-12-31T23:59:59.000Z"
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Robe de soirée élégante",
      "reference": "RS-2024-001",
      "price_ht": 1200.00,
      "price_ttc": 1440.00,
      "price_per_day_ht": 150.00,
      "price_per_day_ttc": 180.00,
      "stock_quantity": 3,
      "is_for_sale": true,
      "images": ["https://..."],
      "isAvailable": true,
      "current_contract": null
    },
    {
      "id": "another-dress-uuid",
      "name": "Robe cocktail",
      "reference": "RC-2024-042",
      "stock_quantity": 2,
      "is_for_sale": false,
      "isAvailable": false,
      "current_contract": {
        "start_datetime": "2024-12-26T00:00:00.000Z",
        "end_datetime": "2024-12-30T23:59:59.000Z"
      }
    }
  ]
}
```

### 2.3 POST /api/dresses

Créer une nouvelle robe (supporte les nouveaux champs `stock_quantity` et `is_for_sale`).

#### Body (multipart/form-data ou JSON)

```json
{
  "name": "Robe de mariée princesse",
  "reference": "RM-2025-001",
  "price_ht": 2500.00,
  "price_ttc": 3000.00,
  "price_per_day_ht": 300.00,
  "price_per_day_ttc": 360.00,
  "stock_quantity": 5,
  "is_for_sale": true,
  "type_id": "type-uuid",
  "size_id": "size-uuid",
  "color_id": "color-uuid",
  "condition_id": "condition-uuid"
}
```

#### Réponse

```json
{
  "success": true,
  "data": {
    "id": "new-dress-uuid",
    "name": "Robe de mariée princesse",
    "reference": "RM-2025-001",
    "stock_quantity": 5,
    "is_for_sale": true,
    "created_at": "2024-12-26T12:00:00.000Z"
  }
}
```

### 2.4 PUT /api/dresses/:id

Mettre à jour une robe existante (inclut `stock_quantity` et `is_for_sale`).

#### Body

```json
{
  "name": "Robe de mariée princesse (mise à jour)",
  "price_ht": 2600.00,
  "price_ttc": 3120.00,
  "stock_quantity": 3,
  "is_for_sale": true
}
```

## 3. Création de Contrat de Vente

### 3.1 POST /api/contracts

Pour créer un contrat de vente, utilisez le `ContractType` avec le nom **"Vente"**.

#### Validation Automatique

Lors de la création d'un contrat de vente, le système effectue automatiquement :

1. **Vérification du type de contrat** : Le `contract_type_id` doit correspondre au type "Vente"
2. **Validation de disponibilité à la vente** : Chaque robe doit avoir `is_for_sale = true`
3. **Validation du stock** : Chaque robe doit avoir `stock_quantity > 0`
4. **Décrémentation automatique** : Le `stock_quantity` est automatiquement décrémenté de 1 pour chaque robe vendue

#### Body

```json
{
  "customer_id": "customer-uuid",
  "contract_type_id": "vente-contract-type-uuid",
  "start_datetime": "2024-12-26T10:00:00Z",
  "end_datetime": "2024-12-26T10:00:00Z",
  "dresses": [
    {
      "dress_id": "dress-uuid-1"
    },
    {
      "dress_id": "dress-uuid-2"
    }
  ],
  "deposit_payment_method": "card",
  "status": "SIGNED"
}
```

#### Réponses d'Erreur

**Robe non disponible à la vente :**
```json
{
  "success": false,
  "error": "Dress \"Robe de soirée élégante\" (RS-2024-001) is not available for sale"
}
```

**Robe en rupture de stock :**
```json
{
  "success": false,
  "error": "Dress \"Robe de soirée élégante\" (RS-2024-001) is out of stock"
}
```

#### Réponse de Succès

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "contract_number": "CONT-2024-12345",
    "status": "SIGNED",
    "total_price_ht": 2400.00,
    "total_price_ttc": 2880.00,
    "dresses": [
      {
        "dress_id": "dress-uuid-1"
      }
    ]
  }
}
```

**Note** : Après la création du contrat, le `stock_quantity` de chaque robe vendue est automatiquement décrémenté de 1.

## 4. Workflow Frontend

### 4.1 Affichage des Robes à Vendre

```javascript
// Récupérer les robes disponibles à la vente avec stock
const fetchDressesForSale = async () => {
  const response = await fetch('/api/dresses/details-view?is_for_sale=true&in_stock=true');
  const data = await response.json();

  return data.data.map(dress => ({
    ...dress,
    canBeSold: dress.stock_quantity > 0 && dress.is_for_sale
  }));
};
```

### 4.2 Affichage du Badge Stock

```javascript
const StockBadge = ({ dress }) => {
  if (!dress.is_for_sale) return null;

  if (dress.stock_quantity === 0) {
    return <span className="badge badge-danger">Rupture de stock</span>;
  }

  if (dress.stock_quantity <= 3) {
    return <span className="badge badge-warning">Stock limité ({dress.stock_quantity})</span>;
  }

  return <span className="badge badge-success">En stock ({dress.stock_quantity})</span>;
};
```

### 4.3 Création d'un Contrat de Vente

```javascript
const createSaleContract = async (customerId, dresses) => {
  // 1. Récupérer l'ID du ContractType "Vente"
  const typesResponse = await fetch('/api/contract-types');
  const types = await typesResponse.json();
  const saleType = types.data.find(t => t.name === 'Vente');

  if (!saleType) {
    throw new Error('Contract type "Vente" not found');
  }

  // 2. Créer le contrat
  const response = await fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      contract_type_id: saleType.id,
      start_datetime: new Date().toISOString(),
      end_datetime: new Date().toISOString(),
      dresses: dresses.map(d => ({ dress_id: d.id })),
      deposit_payment_method: 'card',
      status: 'SIGNED'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
};
```

### 4.4 Gestion des Erreurs

```javascript
try {
  await createSaleContract(customerId, selectedDresses);
  alert('Vente créée avec succès !');

  // Recharger les robes pour obtenir les stocks mis à jour
  await fetchDressesForSale();

} catch (error) {
  if (error.message.includes('is not available for sale')) {
    alert('Une ou plusieurs robes ne sont pas disponibles à la vente');
  } else if (error.message.includes('is out of stock')) {
    alert('Une ou plusieurs robes sont en rupture de stock');
  } else {
    alert(`Erreur : ${error.message}`);
  }
}
```

## 5. Règles Métier

### 5.1 Stock

- Valeur par défaut : `1`
- Minimum : `0` (rupture de stock)
- Décrémentation automatique lors d'une vente
- Les robes avec `stock_quantity = 0` sont automatiquement exclues de l'endpoint `/availability`

### 5.2 Vente

- Une robe peut être à la fois louable ET vendable (`is_for_sale` peut être `true` tout en ayant `price_per_day_ht`)
- Pour vendre une robe, elle DOIT avoir :
  - `is_for_sale = true`
  - `stock_quantity > 0`
- Le type de contrat doit être "Vente" (nom exact à respecter)
- Les prix de vente utilisent les champs `price_ht` et `price_ttc`

### 5.3 Règles de Tarification

Les règles de tarification (`PricingRule`) peuvent être filtrées par `contract_type_id` pour différencier :
- Tarifs de location (ContractType "Location courte durée", etc.)
- Tarifs de vente (ContractType "Vente")

## 6. Authentification

Tous les endpoints nécessitent :
- Header `Authorization: Bearer <jwt_token>`
- Header `X-Organization-Slug: <organization-slug>` (pour SUPER_ADMIN uniquement)

## 7. Cas d'Usage Complets

### Cas 1 : Boutique en Ligne (Vente Uniquement)

```javascript
// Afficher uniquement les robes à vendre en stock
const response = await fetch(
  '/api/dresses/details-view?is_for_sale=true&in_stock=true&page=1&limit=20'
);
```

### Cas 2 : Interface Mixte (Location + Vente)

```javascript
// Onglet "Location"
const rentals = await fetch('/api/dresses/details-view?is_for_sale=false');

// Onglet "Vente"
const sales = await fetch('/api/dresses/details-view?is_for_sale=true&in_stock=true');
```

### Cas 3 : Alerte Stock Faible

```javascript
// Robes en stock faible (1 à 3 unités)
const lowStock = await fetch('/api/dresses/details-view?is_for_sale=true');
const data = await lowStock.json();

const alertDresses = data.data.filter(d => d.stock_quantity > 0 && d.stock_quantity <= 3);
```

## 8. Notes Techniques

- La décrémentation du stock se fait dans une transaction Prisma pour garantir la cohérence
- Les robes sont filtrées au niveau de la base de données (performance optimale)
- Le champ `rental_count` est calculé dynamiquement (nombre de locations historiques)
- Le système est multi-tenant : chaque organisation a ses propres robes et stocks

## 9. Migration Base de Données

Migration appliquée : `20251226203132_add_dress_stock_and_sale_fields`

```sql
ALTER TABLE "Dress"
  ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "is_for_sale" BOOLEAN NOT NULL DEFAULT false;
```

## 10. Support

Pour toute question ou problème :
- Consulter les logs serveur (pino logger)
- Vérifier les erreurs dans la console navigateur
- Tester les endpoints avec Postman/Insomnia
- Contacter l'équipe backend

---

**Dernière mise à jour** : 26 décembre 2024
**Version** : 1.0.0
**Auteur** : Équipe Velvena Backend
