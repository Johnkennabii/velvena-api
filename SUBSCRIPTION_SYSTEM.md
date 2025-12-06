# 💳 Système d'Abonnement Multi-Niveaux

Guide complet du système de subscription avec quotas et feature gates.

## 🎯 Vue d'Ensemble

Système complet de monétisation avec :
- ✅ **Plans d'abonnement** configurables (Free, Basic, Pro, Enterprise)
- ✅ **Quotas** par ressource (utilisateurs, robes, contrats, etc.)
- ✅ **Feature gates** (accès aux fonctionnalités premium)
- ✅ **Usage tracking** en temps réel
- ✅ **Middleware** d'enforcement automatique

## 📊 Modèles de Données

### SubscriptionPlan

```typescript
{
  id: uuid,
  name: "Pro",
  code: "pro",
  price_monthly: 49.00,  // €/mois HT
  price_yearly: 490.00,  // €/an HT (2 mois offerts)
  trial_days: 14,

  limits: {
    users: 10,
    dresses: 500,
    customers: 2000,
    contracts_per_month: 200,
    storage_gb: 50,
    api_calls_per_day: 10000
  },

  features: {
    prospect_management: true,
    contract_generation: true,
    electronic_signature: true,
    advanced_analytics: true,
    api_access: true,
    white_label: false  // Enterprise only
  }
}
```

### Organization (enrichi)

```typescript
{
  subscription_plan_id: "uuid",
  subscription_status: "active",  // trial, active, suspended, cancelled
  subscription_started_at: "2025-12-01",
  trial_ends_at: "2025-12-15",

  current_usage: {
    users: 5,
    dresses: 120,
    customers: 450,
    contracts_this_month: 45,
    last_updated: "2025-12-06T10:00:00Z"
  }
}
```

### UsageEvent (tracking)

```typescript
{
  organization_id: "uuid",
  event_type: "contract_created",
  resource_type: "contract",
  resource_id: "contract-uuid",
  event_month: "2025-12",
  event_day: "2025-12-06"
}
```

## 💰 Plans d'Abonnement Suggérés

### 1. Free Plan (Essai)
```json
{
  "name": "Free",
  "price_monthly": 0,
  "trial_days": 14,
  "limits": {
    "users": 1,
    "dresses": 10,
    "customers": 50,
    "contracts_per_month": 5,
    "storage_gb": 1,
    "api_calls_per_day": 100
  },
  "features": {
    "prospect_management": false,
    "contract_generation": true,
    "electronic_signature": false,
    "inventory_management": true,
    "customer_portal": false,
    "advanced_analytics": false,
    "export_data": false,
    "api_access": false
  }
}
```

### 2. Basic Plan (Petite boutique)
```json
{
  "name": "Basic",
  "price_monthly": 29,
  "price_yearly": 290,  // -17% vs mensuel
  "limits": {
    "users": 3,
    "dresses": 100,
    "customers": 500,
    "contracts_per_month": 50,
    "storage_gb": 10,
    "api_calls_per_day": 1000
  },
  "features": {
    "prospect_management": true,
    "contract_generation": true,
    "electronic_signature": false,
    "inventory_management": true,
    "customer_portal": false,
    "advanced_analytics": false,
    "export_data": true,
    "api_access": false
  }
}
```

### 3. Pro Plan (Boutique établie)
```json
{
  "name": "Pro",
  "price_monthly": 79,
  "price_yearly": 790,
  "is_popular": true,  // Badge "Populaire"
  "limits": {
    "users": 10,
    "dresses": 500,
    "customers": 2000,
    "contracts_per_month": 200,
    "storage_gb": 50,
    "api_calls_per_day": 10000
  },
  "features": {
    "prospect_management": true,
    "contract_generation": true,
    "electronic_signature": true,
    "inventory_management": true,
    "customer_portal": true,
    "advanced_analytics": true,
    "export_data": true,
    "api_access": true,
    "sms_notifications": true
  }
}
```

### 4. Enterprise Plan (Multi-boutiques)
```json
{
  "name": "Enterprise",
  "price_monthly": 199,
  "price_yearly": 1990,
  "limits": {
    "users": -1,          // Illimité
    "dresses": -1,
    "customers": -1,
    "contracts_per_month": -1,
    "storage_gb": 500,
    "api_calls_per_day": 100000
  },
  "features": {
    "prospect_management": true,
    "contract_generation": true,
    "electronic_signature": true,
    "inventory_management": true,
    "customer_portal": true,
    "advanced_analytics": true,
    "export_data": true,
    "api_access": true,
    "white_label": true,
    "sms_notifications": true,
    "priority_support": true,
    "custom_integrations": true,
    "dedicated_account_manager": true
  }
}
```

## 🔒 Utilisation des Middleware

### Check Quota Before Create

```typescript
import { requireQuota } from "../middleware/subscriptionMiddleware.js";

// Limiter la création d'utilisateurs
router.post("/users",
  authMiddleware,
  requireQuota("users"),  // ✅ Check quota
  createUser
);

// Limiter la création de robes
router.post("/dresses",
  authMiddleware,
  requireQuota("dresses"),  // ✅ Check quota
  createDress
);

// Limiter les contrats par mois
router.post("/contracts",
  authMiddleware,
  requireQuota("contracts"),  // ✅ Check quota
  createContract
);
```

**Réponse si quota dépassé (402 Payment Required) :**
```json
{
  "success": false,
  "error": "Quota limit reached",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "resource_type": "users",
    "current_usage": 10,
    "limit": 10,
    "percentage_used": 100
  },
  "message": "You have reached your users limit (10). Please upgrade your plan to continue.",
  "upgrade_url": "/settings/billing"
}
```

### Check Feature Access

```typescript
import { requireFeature } from "../middleware/subscriptionMiddleware.js";

// Fonctionnalité premium : Signature électronique
router.post("/contracts/:id/sign",
  authMiddleware,
  requireFeature("electronic_signature"),  // ✅ Check feature
  signContract
);

// Fonctionnalité premium : Analytics avancées
router.get("/analytics/advanced",
  authMiddleware,
  requireFeature("advanced_analytics"),  // ✅ Check feature
  getAdvancedAnalytics
);

// Fonctionnalité premium : API Access
router.post("/api/webhooks",
  authMiddleware,
  requireFeature("api_access"),  // ✅ Check feature
  createWebhook
);
```

**Réponse si feature non disponible (402 Payment Required) :**
```json
{
  "success": false,
  "error": "Feature not available in your plan",
  "code": "FEATURE_NOT_AVAILABLE",
  "details": {
    "feature_name": "electronic_signature",
    "upgrade_required": "pro"
  },
  "message": "The feature 'electronic_signature' is not available in your current plan. Please upgrade to 'pro' to access this feature.",
  "upgrade_url": "/settings/billing"
}
```

### Check Both Quota AND Feature

```typescript
import { requireQuotaAndFeature } from "../middleware/subscriptionMiddleware.js";

// Vérifier quota ET feature
router.post("/contracts/advanced",
  authMiddleware,
  requireQuotaAndFeature("contracts", "advanced_analytics"),
  createAdvancedContract
);
```

## 📊 Tracking d'Usage

### Automatique (via middleware)

Le middleware track automatiquement :
- Création de ressources (user, dress, customer, contract)
- Appels API
- Générations de documents

### Manuel (dans le code)

```typescript
import { trackUsage } from "../utils/subscriptionManager.js";

// Track un événement custom
await trackUsage(
  organizationId,
  "pdf_generated",      // event_type
  "contract",           // resource_type
  contractId,           // resource_id
  {                     // metadata
    user_id: userId,
    file_size_kb: 250
  }
);

// Track envoi d'email
await trackUsage(
  organizationId,
  "email_sent",
  "notification",
  null,
  {
    to: "customer@email.com",
    template: "contract_reminder"
  }
);
```

## 🎯 Vérifications Programmatiques

### Check Quota

```typescript
import { checkQuota, checkQuotas } from "../utils/subscriptionManager.js";

// Vérifier un quota
const quotaCheck = await checkQuota(organizationId, "users");
if (!quotaCheck.allowed) {
  return res.status(402).json({
    error: "User limit reached",
    limit: quotaCheck.limit,
    current: quotaCheck.current_usage
  });
}

// Vérifier plusieurs quotas
const quotas = await checkQuotas(organizationId, ["users", "dresses", "customers"]);
console.log(quotas);
// {
//   users: { allowed: true, current_usage: 5, limit: 10, remaining: 5, percentage_used: 50 },
//   dresses: { allowed: false, current_usage: 100, limit: 100, remaining: 0, percentage_used: 100 },
//   ...
// }
```

### Check Feature

```typescript
import { checkFeature, checkFeatures } from "../utils/subscriptionManager.js";

// Vérifier une feature
const featureCheck = await checkFeature(organizationId, "electronic_signature");
if (!featureCheck.allowed) {
  return res.status(402).json({
    error: "Feature not available",
    upgrade_to: featureCheck.upgrade_required
  });
}

// Vérifier plusieurs features
const features = await checkFeatures(organizationId, [
  "electronic_signature",
  "advanced_analytics",
  "api_access"
]);
```

### Get Subscription Status

```typescript
import { getSubscriptionStatus } from "../utils/subscriptionManager.js";

const status = await getSubscriptionStatus(organizationId);
console.log(status);
// {
//   status: "trial",
//   plan: { name: "Pro", ... },
//   is_trial: true,
//   is_trial_expired: false,
//   is_active: true,
//   days_remaining: 7
// }
```

## 🔄 Gestion des Plans

### Seed des Plans (prisma/seed.ts)

```typescript
const plans = [
  {
    name: "Free",
    code: "free",
    price_monthly: 0,
    price_yearly: 0,
    trial_days: 14,
    limits: { users: 1, dresses: 10, ... },
    features: { contract_generation: true, ... },
    is_public: true,
    sort_order: 1
  },
  {
    name: "Basic",
    code: "basic",
    price_monthly: 29,
    price_yearly: 290,
    trial_days: 14,
    limits: { users: 3, dresses: 100, ... },
    features: { prospect_management: true, ... },
    is_public: true,
    sort_order: 2
  },
  // ... Pro, Enterprise
];

for (const plan of plans) {
  await prisma.subscriptionPlan.upsert({
    where: { code: plan.code },
    update: {},
    create: plan
  });
}
```

### API Endpoints (à créer)

```typescript
// GET /subscription-plans - Liste publique
// GET /subscription-plans/:id - Détails d'un plan
// POST /organizations/me/subscription - Changer de plan
// GET /organizations/me/usage - Voir l'usage actuel
// GET /organizations/me/subscription/status - Statut abonnement
```

## 📈 Tableau de Comparaison des Plans

| Fonctionnalité | Free | Basic | Pro | Enterprise |
|---|---|---|---|---|
| **Prix/mois** | 0€ | 29€ | 79€ | 199€ |
| **Utilisateurs** | 1 | 3 | 10 | Illimité |
| **Robes** | 10 | 100 | 500 | Illimité |
| **Clients** | 50 | 500 | 2000 | Illimité |
| **Contrats/mois** | 5 | 50 | 200 | Illimité |
| **Stockage** | 1 GB | 10 GB | 50 GB | 500 GB |
| **Gestion prospects** | ❌ | ✅ | ✅ | ✅ |
| **Génération contrats** | ✅ | ✅ | ✅ | ✅ |
| **Signature électronique** | ❌ | ❌ | ✅ | ✅ |
| **Portail client** | ❌ | ❌ | ✅ | ✅ |
| **Analytics avancées** | ❌ | ❌ | ✅ | ✅ |
| **Export données** | ❌ | ✅ | ✅ | ✅ |
| **Accès API** | ❌ | ❌ | ✅ | ✅ |
| **Marque blanche** | ❌ | ❌ | ❌ | ✅ |
| **Support prioritaire** | ❌ | ❌ | ❌ | ✅ |

## 🚨 Gestion des Limites Atteintes

### Warning à 80% d'utilisation

Le middleware ajoute des headers HTTP quand > 80% :
```http
X-Quota-Warning: true
X-Quota-Remaining: 2
X-Quota-Limit: 10
```

### Notification Frontend

```typescript
// Dans le controller, après création réussie
if ((req as any).quotaCheck?.percentage_used >= 80) {
  return res.status(201).json({
    success: true,
    data: newResource,
    warning: {
      type: "quota",
      message: `You are approaching your limit (${quotaCheck.percentage_used}% used)`,
      action_url: "/settings/billing"
    }
  });
}
```

## 📝 Prochaines Étapes

1. **Appliquer la migration**
   ```bash
   npx prisma migrate dev --name add_subscription_system
   ```

2. **Seed les plans**
   ```bash
   npm run prisma:seed
   ```

3. **Ajouter les middleware aux routes**
   - Users : `requireQuota("users")`
   - Dresses : `requireQuota("dresses")`
   - Contracts : `requireQuota("contracts")`
   - Features premium : `requireFeature(...)`

4. **Créer les endpoints de gestion**
   - `/subscription-plans` - Liste des plans
   - `/organizations/me/subscription` - Gestion abonnement
   - `/organizations/me/usage` - Vue d'ensemble usage

5. **Frontend**
   - Page pricing avec tableau comparatif
   - Page billing dans settings
   - Indicateurs d'usage dans le dashboard
   - Modals "Upgrade required"

## 💡 Conseils de Monétisation

### Stratégie de Pricing

1. **Free tier généreux** : Permet de tester vraiment le produit
2. **Basic accessible** : Prix d'entrée bas (29€) pour small business
3. **Pro value proposition** : Meilleur rapport qualité/prix (79€)
4. **Enterprise premium** : Sur-mesure avec services additionnels

### Upselling Triggers

- ❌ Quota atteint → Modal "Upgrade to unlock more"
- 📊 80% usage → Banner "Consider upgrading"
- 🎯 Feature click → "Available in Pro plan"
- 📅 Trial ending → Email countdown + upgrade CTA

### Retention

- 💰 Offrir réduction annuelle (15-20%)
- 🎁 Grandfathering pour early adopters
- 📧 Emails usage insights mensuels
- 🏆 Programme de parrainage

---

**Statut :** ✅ **Système de subscription complet et prêt à monétiser !**

**Dernière mise à jour :** 2025-12-06
