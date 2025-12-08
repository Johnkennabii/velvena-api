# Guide API Frontend - Gestion des Contrats

## Table des matières
1. [Architecture des contrats](#architecture-des-contrats)
2. [Workflow Contrat Forfait](#workflow-contrat-forfait)
3. [Workflow Contrat Location par jour](#workflow-contrat-location-par-jour)
4. [API Endpoints](#api-endpoints)
5. [Exemples de code](#exemples-de-code)

---

## Architecture des contrats

Votre application supporte **deux modes de facturation** :

### 1. Contrat FORFAIT (Package-based)
- Prix fixe pour un nombre de robes déterminé
- Addons inclus dans le forfait
- Pas de calcul dynamique
- **Exemple:** "Forfait Mariage 5 robes = 600€" (peu importe la durée)

### 2. Contrat LOCATION PAR JOUR (Daily rental)
- Calcul dynamique selon la durée et les robes sélectionnées
- Utilise ServiceTypes + PricingRules
- Pricing flexible (per_day, tiered, flat_rate, fixed_price)
- **Exemple:** "3 jours × 50€/jour = 150€" ou avec dégressif

---

## Workflow Contrat FORFAIT

### Étape 1 : Récupérer les forfaits disponibles

```http
GET /contract-packages
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg-uuid-1",
      "name": "Forfait Mariage Premium",
      "num_dresses": 5,
      "price_ht": 500.00,
      "price_ttc": 600.00,
      "addons": [
        {
          "addon": {
            "id": "addon-1",
            "name": "Pressing Premium",
            "price_ht": 0,
            "included": true
          }
        }
      ]
    },
    {
      "id": "pkg-uuid-2",
      "name": "Forfait Essai - 2 robes",
      "num_dresses": 2,
      "price_ht": 150.00,
      "price_ttc": 180.00,
      "addons": []
    }
  ]
}
```

### Étape 2 : Créer le contrat avec forfait

```http
POST /contracts
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "contract_number": "CTR-2025-001",
  "customer_id": "customer-uuid",
  "contract_type_id": "contract-type-forfait-uuid",

  "package_id": "pkg-uuid-1",

  "start_datetime": "2025-06-15T10:00:00Z",
  "end_datetime": "2025-06-18T18:00:00Z",

  "dresses": [
    { "dress_id": "dress-uuid-1" },
    { "dress_id": "dress-uuid-2" },
    { "dress_id": "dress-uuid-3" },
    { "dress_id": "dress-uuid-4" },
    { "dress_id": "dress-uuid-5" }
  ],

  "total_price_ht": 500.00,
  "total_price_ttc": 600.00,

  "account_ht": 500.00,
  "account_ttc": 600.00,
  "account_paid_ht": 0,
  "account_paid_ttc": 0,

  "caution_ht": 200.00,
  "caution_ttc": 240.00,
  "caution_paid_ht": 0,
  "caution_paid_ttc": 0,

  "deposit_payment_method": "card",
  "status": "draft",

  "addons": []
}
```

**Notes importantes:**
- `num_dresses` du package limite le nombre de robes
- Prix fixe du package, peu importe la durée
- Addons du package sont automatiquement inclus
- Vous pouvez ajouter des addons supplémentaires (payants)

---

## Workflow Contrat LOCATION PAR JOUR

### Étape 1 : Récupérer les ServiceTypes disponibles

```http
GET /service-types
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "service-uuid-1",
      "name": "Location courte durée",
      "code": "rental_short",
      "description": "Location de 1 à 7 jours",
      "config": {
        "min_duration_days": 1,
        "max_duration_days": 7,
        "requires_deposit": true,
        "default_deposit_percentage": 30
      },
      "pricing_rules": [
        {
          "id": "rule-uuid-1",
          "name": "Tarif dégressif courte durée",
          "strategy": "tiered",
          "priority": 10
        }
      ]
    },
    {
      "id": "service-uuid-2",
      "name": "Location longue durée",
      "code": "rental_long",
      "config": {
        "min_duration_days": 8,
        "max_duration_days": null,
        "requires_deposit": true,
        "default_deposit_percentage": 50
      },
      "pricing_rules": [
        {
          "id": "rule-uuid-2",
          "name": "Tarif longue durée",
          "strategy": "per_day"
        }
      ]
    }
  ]
}
```

### Étape 2 : Calculer le prix pour chaque robe

Pour **chaque robe** sélectionnée, appelez l'endpoint de calcul :

```http
POST /pricing-rules/calculate
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "dress_id": "dress-uuid-1",
  "start_date": "2025-06-15",
  "end_date": "2025-06-18",
  "pricing_rule_id": "rule-uuid-1"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "strategy_used": "tiered",
    "base_price_ht": 150.00,
    "base_price_ttc": 180.00,
    "discount_amount": 15.00,
    "discount_percentage": 10,
    "final_price_ht": 135.00,
    "final_price_ttc": 162.00,
    "tax_amount": 27.00,
    "tax_rate": 20,
    "duration_days": 3,
    "breakdown": [
      {
        "description": "Location 3 jour(s) à 50€/jour",
        "amount_ht": 150.00,
        "amount_ttc": 180.00
      },
      {
        "description": "Réduction palier 10% (3 jours)",
        "amount_ht": -15.00,
        "amount_ttc": -18.00
      }
    ],
    "pricing_rule_used": {
      "id": "rule-uuid-1",
      "name": "Tarif dégressif courte durée",
      "strategy": "tiered"
    },
    "dress": {
      "id": "dress-uuid-1",
      "name": "Robe de mariée Princesse",
      "reference": "RDM-001"
    }
  }
}
```

### Étape 3 : Calculer le total

```javascript
// Frontend calcule la somme
const dress1Result = { final_price_ht: 135.00, final_price_ttc: 162.00 };
const dress2Result = { final_price_ht: 80.00, final_price_ttc: 96.00 };
const dress3Result = { final_price_ht: 100.00, final_price_ttc: 120.00 };

const totalHT = 135.00 + 80.00 + 100.00; // = 315.00
const totalTTC = 162.00 + 96.00 + 120.00; // = 378.00
```

### Étape 4 : Créer le contrat

```http
POST /contracts
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "contract_number": "CTR-2025-002",
  "customer_id": "customer-uuid",
  "contract_type_id": "contract-type-location-uuid",

  "start_datetime": "2025-06-15T10:00:00Z",
  "end_datetime": "2025-06-18T18:00:00Z",

  "dresses": [
    { "dress_id": "dress-uuid-1" },
    { "dress_id": "dress-uuid-2" },
    { "dress_id": "dress-uuid-3" }
  ],

  "total_price_ht": 315.00,
  "total_price_ttc": 378.00,

  "account_ht": 315.00,
  "account_ttc": 378.00,
  "account_paid_ht": 0,
  "account_paid_ttc": 0,

  "caution_ht": 94.50,
  "caution_ttc": 113.40,
  "caution_paid_ht": 0,
  "caution_paid_ttc": 0,

  "deposit_payment_method": "card",
  "status": "draft",

  "addons": [
    { "addon_id": "addon-pressing-uuid" }
  ]
}
```

**Notes importantes:**
- Caution calculée selon `config.default_deposit_percentage` du ServiceType
- Prix calculés par `/pricing-rules/calculate` pour chaque robe
- Total = somme des prix de toutes les robes

---

## API Endpoints

### Contrats

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/contracts` | Liste tous les contrats |
| `GET` | `/contracts/:id` | Détails d'un contrat |
| `POST` | `/contracts` | Créer un contrat |
| `PUT` | `/contracts/:id` | Mettre à jour un contrat |
| `DELETE` | `/contracts/:id` | Supprimer un contrat |

### Forfaits (Packages)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/contract-packages` | Liste tous les forfaits |
| `GET` | `/contract-packages/:id` | Détails d'un forfait |
| `POST` | `/contract-packages` | Créer un forfait (Admin) |
| `PUT` | `/contract-packages/:id` | Modifier un forfait (Admin) |

### ServiceTypes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/service-types` | Liste tous les types de service |
| `GET` | `/service-types/:id` | Détails d'un service type |
| `POST` | `/service-types` | Créer un service type (Admin) |
| `PUT` | `/service-types/:id` | Modifier un service type (Admin) |

### PricingRules

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/pricing-rules` | Liste toutes les règles de pricing |
| `GET` | `/pricing-rules/:id` | Détails d'une règle |
| `POST` | `/pricing-rules` | Créer une règle (Admin) |
| `PUT` | `/pricing-rules/:id` | Modifier une règle (Admin) |
| `POST` | `/pricing-rules/calculate` | **Calculer un prix** |

### ContractTypes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/contract-types` | Liste tous les types de contrat |
| `GET` | `/contract-types/:id` | Détails d'un type |

### ContractAddons

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/contract-addons` | Liste tous les addons |
| `GET` | `/contract-addons/:id` | Détails d'un addon |

---

## Exemples de code

### Exemple React/TypeScript - Création contrat forfait

```typescript
interface Package {
  id: string;
  name: string;
  num_dresses: number;
  price_ht: number;
  price_ttc: number;
}

async function createPackageContract(
  customerId: string,
  packageId: string,
  selectedDresses: string[],
  startDate: Date,
  endDate: Date
) {
  // 1. Récupérer le package
  const packageResponse = await fetch(`/api/contract-packages/${packageId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data: pkg } = await packageResponse.json();

  // 2. Vérifier le nombre de robes
  if (selectedDresses.length > pkg.num_dresses) {
    throw new Error(`Ce forfait permet max ${pkg.num_dresses} robes`);
  }

  // 3. Calculer la caution (exemple: 30% du forfait)
  const cautionHT = pkg.price_ht * 0.30;
  const cautionTTC = pkg.price_ttc * 0.30;

  // 4. Créer le contrat
  const contract = {
    contract_number: `CTR-${Date.now()}`,
    customer_id: customerId,
    contract_type_id: "forfait-type-uuid",
    package_id: packageId,
    start_datetime: startDate.toISOString(),
    end_datetime: endDate.toISOString(),
    dresses: selectedDresses.map(id => ({ dress_id: id })),
    total_price_ht: pkg.price_ht,
    total_price_ttc: pkg.price_ttc,
    account_ht: pkg.price_ht,
    account_ttc: pkg.price_ttc,
    account_paid_ht: 0,
    account_paid_ttc: 0,
    caution_ht: cautionHT,
    caution_ttc: cautionTTC,
    caution_paid_ht: 0,
    caution_paid_ttc: 0,
    deposit_payment_method: "card",
    status: "draft",
    addons: []
  };

  const response = await fetch('/api/contracts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(contract)
  });

  return response.json();
}
```

### Exemple React/TypeScript - Création contrat location

```typescript
interface PricingResult {
  final_price_ht: number;
  final_price_ttc: number;
  duration_days: number;
  breakdown: Array<{
    description: string;
    amount_ht: number;
    amount_ttc: number;
  }>;
}

async function calculateDressPrice(
  dressId: string,
  startDate: string,
  endDate: string,
  pricingRuleId?: string
): Promise<PricingResult> {
  const response = await fetch('/api/pricing-rules/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      dress_id: dressId,
      start_date: startDate,
      end_date: endDate,
      pricing_rule_id: pricingRuleId
    })
  });

  const { data } = await response.json();
  return data;
}

async function createRentalContract(
  customerId: string,
  selectedDresses: string[],
  startDate: Date,
  endDate: Date,
  serviceTypeId: string
) {
  // 1. Récupérer le ServiceType pour la config de caution
  const serviceResponse = await fetch(`/api/service-types/${serviceTypeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data: serviceType } = await serviceResponse.json();

  // 2. Calculer le prix pour chaque robe
  const priceCalculations = await Promise.all(
    selectedDresses.map(dressId =>
      calculateDressPrice(
        dressId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
    )
  );

  // 3. Calculer le total
  const totalHT = priceCalculations.reduce((sum, calc) => sum + calc.final_price_ht, 0);
  const totalTTC = priceCalculations.reduce((sum, calc) => sum + calc.final_price_ttc, 0);

  // 4. Calculer la caution selon le ServiceType
  const depositPercentage = serviceType.config?.default_deposit_percentage || 30;
  const cautionHT = totalHT * (depositPercentage / 100);
  const cautionTTC = totalTTC * (depositPercentage / 100);

  // 5. Créer le contrat
  const contract = {
    contract_number: `CTR-${Date.now()}`,
    customer_id: customerId,
    contract_type_id: "location-type-uuid",
    start_datetime: startDate.toISOString(),
    end_datetime: endDate.toISOString(),
    dresses: selectedDresses.map(id => ({ dress_id: id })),
    total_price_ht: totalHT,
    total_price_ttc: totalTTC,
    account_ht: totalHT,
    account_ttc: totalTTC,
    account_paid_ht: 0,
    account_paid_ttc: 0,
    caution_ht: cautionHT,
    caution_ttc: cautionTTC,
    caution_paid_ht: 0,
    caution_paid_ttc: 0,
    deposit_payment_method: "card",
    status: "draft",
    addons: []
  };

  const response = await fetch('/api/contracts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(contract)
  });

  return response.json();
}
```

### Exemple - Afficher le breakdown du prix

```typescript
function PriceBreakdown({ dressId, startDate, endDate }: Props) {
  const [breakdown, setBreakdown] = useState<PricingResult | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      const result = await calculateDressPrice(dressId, startDate, endDate);
      setBreakdown(result);
    }
    fetchPrice();
  }, [dressId, startDate, endDate]);

  if (!breakdown) return <Spinner />;

  return (
    <div className="price-breakdown">
      <h3>Détail du prix</h3>
      {breakdown.breakdown.map((item, idx) => (
        <div key={idx} className="breakdown-line">
          <span>{item.description}</span>
          <span>{item.amount_ttc.toFixed(2)}€</span>
        </div>
      ))}

      {breakdown.discount_percentage && (
        <div className="discount">
          Réduction: -{breakdown.discount_percentage}%
        </div>
      )}

      <div className="total">
        <strong>Total TTC:</strong>
        <strong>{breakdown.final_price_ttc.toFixed(2)}€</strong>
      </div>

      <div className="duration">
        Durée: {breakdown.duration_days} jour(s)
      </div>
    </div>
  );
}
```

---

## Règles Métier Importantes

### 1. Validation du nombre de robes (Forfait)
```typescript
if (selectedDresses.length > package.num_dresses) {
  throw new Error(`Ce forfait autorise maximum ${package.num_dresses} robes`);
}
```

### 2. Calcul de la caution
```typescript
// Selon le ServiceType
const depositPercentage = serviceType.config?.default_deposit_percentage || 30;
const caution = totalPrice * (depositPercentage / 100);
```

### 3. Durée de location
```typescript
// Vérifier les limites du ServiceType
const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

if (duration < serviceType.config.min_duration_days) {
  throw new Error(`Durée minimum: ${serviceType.config.min_duration_days} jours`);
}

if (serviceType.config.max_duration_days && duration > serviceType.config.max_duration_days) {
  throw new Error(`Durée maximum: ${serviceType.config.max_duration_days} jours`);
}
```

### 4. Génération du numéro de contrat
```typescript
// Format recommandé: CTR-YYYYMMDD-XXX
const contractNumber = `CTR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${randomId}`;
// Exemple: CTR-20250615-A3F
```

### 5. Statuts de contrat
- `draft` - Brouillon (modifiable)
- `pending` - En attente de signature
- `active` - Actif (signé)
- `completed` - Terminé
- `cancelled` - Annulé

---

## Stratégies de Pricing

### 1. `per_day` - Prix par jour
```
Prix = prix_par_jour × nombre_de_jours
Exemple: 50€/jour × 3 jours = 150€
```

### 2. `tiered` - Prix dégressif
```json
{
  "strategy": "tiered",
  "calculation_config": {
    "tiers": [
      { "min_days": 1, "max_days": 3, "discount_percentage": 0 },
      { "min_days": 4, "max_days": 7, "discount_percentage": 10 },
      { "min_days": 8, "max_days": null, "discount_percentage": 20 }
    ]
  }
}
```
```
Exemple: 5 jours
Base: 50€/jour × 5 = 250€
Réduction: -10% = -25€
Total: 225€
```

### 3. `flat_rate` - Forfait période
```
Prix fixe pour une période (weekend, semaine)
Exemple: Forfait weekend = 100€ (peu importe 2 ou 3 jours)
```

### 4. `fixed_price` - Prix fixe
```
Prix fixe défini dans la règle
Exemple: 150€ (utilisé pour vente ou tarif spécial)
```

---

## Questions Fréquentes

### Q: Comment savoir quel ContractType utiliser ?
**R:** Récupérez la liste des ContractTypes via `GET /contract-types` et laissez l'utilisateur choisir. Généralement:
- "Contrat Forfait" → utiliser `package_id`
- "Contrat Location" → utiliser calcul dynamique via `/pricing-rules/calculate`

### Q: Que faire si aucune PricingRule ne correspond ?
**R:** L'API utilise automatiquement la stratégie `per_day` par défaut avec le `price_per_day_ht` de la robe.

### Q: Comment gérer les addons ?
**R:** Les addons d'un package sont automatiquement inclus (gratuits). Vous pouvez ajouter des addons supplémentaires dans le tableau `addons` du contrat.

### Q: Peut-on modifier un contrat après création ?
**R:** Oui via `PUT /contracts/:id`, mais attention aux contrats déjà signés (`signed_at` non null).

### Q: Comment calculer la TVA ?
**R:** L'API retourne toujours HT et TTC. Le taux par défaut est 20% (configurable dans `organization.business_rules.pricing.tax_rate`).

---

## Support et Documentation

- **Swagger:** `/docs` (documentation interactive)
- **Support:** Contactez votre administrateur système
- **Repository:** Voir CHANGELOG.md pour les mises à jour

---

**Version:** 1.0
**Dernière mise à jour:** 2025-12-07
