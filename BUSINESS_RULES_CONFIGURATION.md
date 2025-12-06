# Configuration des Règles Métier

Ce document explique comment configurer les règles métier spécifiques à chaque organisation dans Velvena.

## 🎯 Vue d'Ensemble

Chaque organisation peut configurer :
1. **Types de prestations** (location courte/longue durée, vente, etc.)
2. **Règles de tarification** (calcul au nombre de jours, forfaitaire, fixe, dégressif)
3. **Paramètres métier** (TVA, cautions, devise, etc.)

## 📊 Modèles de Données

### Organization.business_rules

Champ JSON dans le modèle `Organization` pour stocker les règles globales :

```json
{
  "pricing": {
    "default_strategy": "per_day",
    "tax_rate": 20,
    "currency": "EUR",
    "allow_custom_pricing": true
  },
  "services": {
    "rental_types": ["short_term", "long_term", "event"],
    "default_rental_duration": 3
  },
  "billing": {
    "deposit_required": true,
    "deposit_percentage": 30,
    "payment_terms_days": 30
  }
}
```

### ServiceType (Table)

Définit les types de prestations disponibles :

```typescript
{
  id: uuid,
  name: "Location courte durée",
  code: "rental_short",
  organization_id: "uuid" | null,  // null = global
  description: "Location de 1 à 7 jours",
  is_active: true,
  config: {
    "min_duration_days": 1,
    "max_duration_days": 7,
    "requires_deposit": true,
    "default_deposit_percentage": 30
  }
}
```

### PricingRule (Table)

Définit les règles de calcul de prix :

```typescript
{
  id: uuid,
  name: "Location journalière standard",
  organization_id: "uuid" | null,
  service_type_id: "uuid" | null,
  strategy: "per_day" | "flat_rate" | "fixed_price" | "tiered",
  calculation_config: {...},  // Voir ci-dessous
  applies_to: {...},          // Conditions d'application
  priority: 0,                // Plus élevé = prioritaire
  is_active: true
}
```

## 💰 Stratégies de Tarification

### 1. Per Day (Par Jour)

**Formule :** `Prix total = prix_par_jour × nombre_de_jours`

**Configuration :**
```json
{
  "strategy": "per_day",
  "calculation_config": {
    "base_price_source": "dress",
    "apply_tax": true,
    "tax_rate": 20,
    "rounding": "nearest"
  }
}
```

**Exemple :**
- Robe à 50€/jour HT
- Location de 3 jours
- **Résultat :** 150€ HT / 180€ TTC

### 2. Flat Rate (Forfait Période)

**Formule :** `Prix total = prix_par_jour` (peu importe la durée dans la période)

**Configuration :**
```json
{
  "strategy": "flat_rate",
  "calculation_config": {
    "applies_to_period": "weekend",
    "fixed_multiplier": 1.0,
    "tax_rate": 20,
    "rounding": "nearest"
  }
}
```

**Exemple :**
- Robe à 50€/jour HT
- Location weekend (2 jours)
- **Résultat :** 50€ HT / 60€ TTC (forfait weekend)

**Périodes disponibles :**
- `day` - Journée
- `weekend` - Weekend (vendredi-dimanche)
- `week` - Semaine
- `month` - Mois

### 3. Fixed Price (Prix Fixe)

**Formule :** `Prix total = forfait fixe défini`

**Configuration :**
```json
{
  "strategy": "fixed_price",
  "calculation_config": {
    "fixed_amount_ht": 150.00,
    "fixed_amount_ttc": 180.00
  }
}
```

**Exemple :**
- Forfait mariage : 150€ HT / 180€ TTC
- Peu importe la robe ou la durée
- **Résultat :** 150€ HT / 180€ TTC

### 4. Tiered (Prix Dégressif)

**Formule :** `Prix total = (prix_par_jour × jours) - réduction selon palier`

**Configuration :**
```json
{
  "strategy": "tiered",
  "calculation_config": {
    "tiers": [
      { "min_days": 1, "max_days": 3, "discount_percentage": 0 },
      { "min_days": 4, "max_days": 7, "discount_percentage": 10 },
      { "min_days": 8, "max_days": null, "discount_percentage": 20 }
    ],
    "tax_rate": 20,
    "rounding": "nearest"
  }
}
```

**Exemple :**
- Robe à 50€/jour HT
- Location de 5 jours (palier 2)
- Base : 250€ HT
- Réduction 10% : -25€
- **Résultat :** 225€ HT / 270€ TTC

## 🎯 Règles d'Application (applies_to)

Définir quand une règle de pricing s'applique :

```json
{
  "applies_to": {
    "dress_types": ["robe_soiree", "robe_cocktail"],
    "min_duration_days": 3,
    "max_duration_days": 7,
    "customer_types": ["vip", "regular"]
  }
}
```

**Champs disponibles :**
- `dress_types` : Types de robes concernés
- `min_duration_days` : Durée minimum
- `max_duration_days` : Durée maximum
- `customer_types` : Types de clients (à implémenter)
- `seasons` : Saisons (à implémenter)

## 📋 Utilisation de l'API

### Créer un Type de Service

```bash
POST /service-types
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Location longue durée",
  "code": "rental_long",
  "description": "Location de 8 jours ou plus",
  "config": {
    "min_duration_days": 8,
    "requires_deposit": true,
    "default_deposit_percentage": 50
  }
}
```

### Créer une Règle de Pricing

```bash
POST /pricing-rules
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Forfait weekend",
  "service_type_id": "uuid-du-service",
  "strategy": "flat_rate",
  "calculation_config": {
    "applies_to_period": "weekend",
    "fixed_multiplier": 1.5,
    "tax_rate": 20
  },
  "applies_to": {
    "min_duration_days": 2,
    "max_duration_days": 3
  },
  "priority": 10
}
```

### Calculer un Prix

```bash
POST /pricing-rules/calculate
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "dress_id": "uuid-de-la-robe",
  "start_date": "2025-12-10",
  "end_date": "2025-12-13",
  "pricing_rule_id": "uuid-optionnel",
  "overrides": {
    "discount_percentage": 5
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "strategy_used": "per_day",
    "base_price_ht": 150.00,
    "base_price_ttc": 180.00,
    "discount_amount": 7.50,
    "discount_percentage": 5,
    "final_price_ht": 142.50,
    "final_price_ttc": 171.00,
    "tax_amount": 28.50,
    "tax_rate": 20,
    "duration_days": 3,
    "breakdown": [
      {
        "description": "Location 3 jour(s) à 50€/jour",
        "amount_ht": 150.00,
        "amount_ttc": 180.00
      },
      {
        "description": "Réduction 5%",
        "amount_ht": -7.50,
        "amount_ttc": -9.00
      }
    ],
    "pricing_rule_used": {
      "id": "uuid",
      "name": "Location journalière standard",
      "strategy": "per_day"
    },
    "dress": {
      "id": "uuid",
      "name": "Robe Rouge",
      "reference": "RR-001"
    }
  }
}
```

## 🔧 Configuration par Organisation

### 1. Boutique avec Location Standard

```typescript
// Service Types
[
  {
    name: "Location courte durée",
    code: "rental_short",
    config: { min_duration_days: 1, max_duration_days: 7 }
  }
]

// Pricing Rules
[
  {
    name: "Tarif journalier",
    strategy: "per_day",
    priority: 0
  }
]
```

### 2. Boutique avec Forfaits Weekend

```typescript
// Service Types
[
  {
    name: "Location weekend",
    code: "rental_weekend",
    config: { min_duration_days: 2, max_duration_days: 3 }
  }
]

// Pricing Rules
[
  {
    name: "Forfait weekend",
    strategy: "flat_rate",
    calculation_config: {
      applies_to_period: "weekend",
      fixed_multiplier: 1.5
    },
    priority: 10
  },
  {
    name: "Tarif journalier (fallback)",
    strategy: "per_day",
    priority: 0
  }
]
```

### 3. Boutique avec Prix Dégressifs

```typescript
// Pricing Rules
[
  {
    name: "Prix dégressif",
    strategy: "tiered",
    calculation_config: {
      tiers: [
        { min_days: 1, max_days: 3, discount_percentage: 0 },
        { min_days: 4, max_days: 7, discount_percentage: 10 },
        { min_days: 8, max_days: null, discount_percentage: 15 }
      ]
    },
    priority: 5
  }
]
```

### 4. Boutique Haut de Gamme avec Forfaits Fixes

```typescript
// Pricing Rules
[
  {
    name: "Forfait mariage",
    strategy: "fixed_price",
    calculation_config: {
      fixed_amount_ht: 500.00,
      fixed_amount_ttc: 600.00
    },
    applies_to: {
      dress_types: ["robe_mariee"]
    },
    priority: 20
  },
  {
    name: "Forfait soirée VIP",
    strategy: "fixed_price",
    calculation_config: {
      fixed_amount_ht: 200.00,
      fixed_amount_ttc: 240.00
    },
    applies_to: {
      dress_types: ["robe_soiree"],
      customer_types: ["vip"]
    },
    priority: 15
  }
]
```

## 🧮 Priorité des Règles

Quand plusieurs règles peuvent s'appliquer, le système choisit celle avec la **priorité la plus élevée**.

**Exemple :**
```typescript
// Règle 1 : Forfait weekend (priorité 10)
{
  strategy: "flat_rate",
  applies_to: { min_duration_days: 2, max_duration_days: 3 },
  priority: 10
}

// Règle 2 : Tarif journalier (priorité 0)
{
  strategy: "per_day",
  applies_to: {},
  priority: 0
}

// Pour une location de 2 jours weekend :
// -> Règle 1 s'applique (priorité plus élevée)
```

## 🔄 Seed Data

Ajouter des règles de pricing globales dans le seed :

```typescript
// prisma/seed.ts

const globalPricingRules = [
  {
    name: "Tarif journalier standard",
    strategy: "per_day",
    organization_id: null, // Global
    calculation_config: {
      base_price_source: "dress",
      apply_tax: true,
      tax_rate: 20,
      rounding: "nearest"
    },
    priority: 0,
    is_active: true
  },
  {
    name: "Forfait weekend",
    strategy: "flat_rate",
    organization_id: null,
    calculation_config: {
      applies_to_period: "weekend",
      fixed_multiplier: 1.5,
      tax_rate: 20
    },
    applies_to: {
      min_duration_days: 2,
      max_duration_days: 3
    },
    priority: 5,
    is_active: true
  }
];

for (const rule of globalPricingRules) {
  await prisma.pricingRule.upsert({
    where: { name_organization_id: { name: rule.name, organization_id: null } },
    update: {},
    create: rule
  });
}
```

## 📝 Exemples d'Utilisation dans le Code

### Calculer le prix d'une location

```typescript
import { calculatePrice, type PricingContext } from "./utils/pricingCalculator.js";

const context: PricingContext = {
  dress: {
    id: dress.id,
    price_per_day_ht: dress.price_per_day_ht,
    price_per_day_ttc: dress.price_per_day_ttc,
  },
  rental: {
    start_date: new Date("2025-12-10"),
    end_date: new Date("2025-12-13"),
    duration_days: 3,
  },
  pricing_rule: {
    strategy: "per_day",
    calculation_config: {
      tax_rate: 20,
      rounding: "nearest"
    }
  }
};

const result = calculatePrice(context);
console.log(result);
// {
//   strategy_used: "per_day",
//   final_price_ht: 150.00,
//   final_price_ttc: 180.00,
//   ...
// }
```

### Trouver la meilleure règle de pricing

```typescript
import { findBestPricingRule } from "./utils/pricingCalculator.js";

const rules = await prisma.pricingRule.findMany({
  where: { organization_id: orgId, is_active: true }
});

const bestRule = findBestPricingRule(rules, {
  dress_type: "robe_soiree",
  duration_days: 5,
  customer_type: "vip"
});

console.log(bestRule); // Règle avec la priorité la plus élevée qui s'applique
```

## 🧪 Tests

### Test des différentes stratégies

```typescript
// Test per_day
const result1 = calculatePrice({
  dress: { price_per_day_ht: new Decimal(50), price_per_day_ttc: new Decimal(60) },
  rental: { start_date: new Date(), end_date: new Date(), duration_days: 3 },
  pricing_rule: { strategy: "per_day", calculation_config: { tax_rate: 20 } }
});
// Expect: 150 HT / 180 TTC

// Test flat_rate
const result2 = calculatePrice({
  dress: { price_per_day_ht: new Decimal(50), price_per_day_ttc: new Decimal(60) },
  rental: { start_date: new Date(), end_date: new Date(), duration_days: 2 },
  pricing_rule: {
    strategy: "flat_rate",
    calculation_config: { fixed_multiplier: 1.5, tax_rate: 20 }
  }
});
// Expect: 75 HT / 90 TTC

// Test tiered
const result3 = calculatePrice({
  dress: { price_per_day_ht: new Decimal(50), price_per_day_ttc: new Decimal(60) },
  rental: { start_date: new Date(), end_date: new Date(), duration_days: 5 },
  pricing_rule: {
    strategy: "tiered",
    calculation_config: {
      tiers: [
        { min_days: 1, max_days: 3, discount_percentage: 0 },
        { min_days: 4, max_days: 7, discount_percentage: 10 }
      ],
      tax_rate: 20
    }
  }
});
// Expect: 225 HT (250 - 10%) / 270 TTC
```

## 🚀 Prochaines Étapes

1. **Ajouter les routes** dans `server.ts` :
   ```typescript
   import serviceTypeRoutes from "./routes/serviceTypes.js";
   import pricingRuleRoutes from "./routes/pricingRules.js";

   app.use("/service-types", serviceTypeRoutes);
   app.use("/pricing-rules", pricingRuleRoutes);
   ```

2. **Appliquer la migration** :
   ```bash
   npx prisma migrate dev --name add_business_rules
   ```

3. **Seed les données globales** :
   ```bash
   npm run prisma:seed
   ```

4. **Tester via l'API** :
   - Créer des types de services
   - Créer des règles de pricing
   - Calculer des prix

## 📚 Documentation API Complète

Voir `BUSINESS_RULES_API.md` pour tous les endpoints et exemples de requêtes.

---

**Version :** 1.0.0
**Dernière mise à jour :** 2025-12-06
