# Guide du Système de Souscription Velvena

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Plans de souscription](#plans-de-souscription)
3. [Comment vérifier les quotas](#comment-vérifier-les-quotas)
4. [Comment vérifier les fonctionnalités](#comment-vérifier-les-fonctionnalités)
5. [Utilisation des middlewares](#utilisation-des-middlewares)
6. [Exemples pratiques](#exemples-pratiques)
7. [Créer les plans initiaux](#créer-les-plans-initiaux)

---

## Vue d'ensemble

Le système de souscription Velvena gère :
- **Quotas** : Limites sur les ressources (users, robes, clients, contrats, etc.)
- **Fonctionnalités** : Accès aux features premium (signature électronique, analytics, etc.)
- **Suivi d'utilisation** : Tracking automatique de l'usage
- **Gestion de la période d'essai** : Trial de 14 jours par défaut

---

## Plans de souscription

### Structure d'un plan

```typescript
{
  name: "Pro",
  code: "pro",
  price_monthly: 49.00,
  price_yearly: 490.00,
  trial_days: 14,

  // QUOTAS (limites numériques)
  limits: {
    users: 20,                    // Max 20 utilisateurs
    dresses: 1000,                // Max 1000 robes
    customers: 5000,              // Max 5000 clients
    contracts_per_month: 200,     // Max 200 contrats/mois
    storage_gb: 50,               // 50 GB de stockage
    api_calls_per_day: 10000,     // 10k appels API/jour
    email_notifications: 1000     // 1000 emails/mois
  },

  // FEATURES (fonctionnalités boolean)
  features: {
    prospect_management: true,      // Gestion des prospects
    contract_generation: true,      // Génération de contrats
    electronic_signature: true,     // Signature électronique
    inventory_management: true,     // Gestion d'inventaire
    customer_portal: true,          // Portail client
    advanced_analytics: true,       // Analytics avancées
    export_data: true,              // Export de données
    api_access: true,               // Accès API
    white_label: false,             // White label (Enterprise only)
    sms_notifications: true         // Notifications SMS
  }
}
```

### Plans recommandés

| Plan | Prix/mois | Users | Robes | Clients | Contrats/mois | Features clés |
|------|-----------|-------|-------|---------|---------------|---------------|
| **Free** | 0€ | 3 | 50 | 200 | 10 | Basique uniquement |
| **Basic** | 19€ | 10 | 500 | 2000 | 50 | + Prospects, Export |
| **Pro** | 49€ | 20 | Illimité | 5000 | 200 | + Signature, API, Analytics |
| **Enterprise** | 149€ | Illimité | Illimité | Illimité | Illimité | Toutes les features |

---

## Comment vérifier les quotas

### 1. Dans votre code (programmatique)

```typescript
import { checkQuota } from "../utils/subscriptionManager.js";

// Vérifier un quota spécifique
const quotaCheck = await checkQuota(organizationId, "users");

console.log(quotaCheck);
// {
//   allowed: false,           // false = limite atteinte
//   current_usage: 10,        // Utilisation actuelle
//   limit: 10,                // Limite du plan
//   remaining: 0,             // Places restantes
//   percentage_used: 100      // Pourcentage utilisé
// }

// Bloquer si limite atteinte
if (!quotaCheck.allowed) {
  throw new Error(`Limite atteinte : ${quotaCheck.limit} users maximum`);
}

// Avertir si proche de la limite (>= 80%)
if (quotaCheck.percentage_used >= 80) {
  console.warn(`Attention : ${quotaCheck.remaining} users restants`);
}
```

### 2. Avec un middleware (automatique)

```typescript
import { requireQuota } from "../middleware/subscriptionMiddleware.js";

// Protéger une route avec vérification automatique
router.post("/users",
  authMiddleware,
  requireQuota("users"),  // ✅ Vérifie automatiquement le quota
  createUser
);

// Si le quota est dépassé, retourne automatiquement :
// Status 402 Payment Required
// {
//   error: "Quota limit reached",
//   code: "QUOTA_EXCEEDED",
//   details: { current_usage: 10, limit: 10 },
//   message: "You have reached your users limit (10). Please upgrade your plan.",
//   upgrade_url: "/settings/billing"
// }
```

---

## Comment vérifier les fonctionnalités

### 1. Dans votre code (programmatique)

```typescript
import { checkFeature } from "../utils/subscriptionManager.js";

// Vérifier l'accès à une feature
const featureCheck = await checkFeature(organizationId, "electronic_signature");

console.log(featureCheck);
// {
//   allowed: false,
//   feature_name: "electronic_signature",
//   upgrade_required: "pro"  // Plan minimum requis
// }

if (!featureCheck.allowed) {
  throw new Error(
    `Feature non disponible. Upgrade vers le plan ${featureCheck.upgrade_required}`
  );
}
```

### 2. Avec un middleware (automatique)

```typescript
import { requireFeature } from "../middleware/subscriptionMiddleware.js";

// Protéger une route premium
router.post("/contracts/sign",
  authMiddleware,
  requireFeature("electronic_signature"),  // ✅ Vérifie la feature
  signContract
);

// Si pas accès à la feature, retourne :
// Status 402 Payment Required
// {
//   error: "Feature not available in your plan",
//   code: "FEATURE_NOT_AVAILABLE",
//   details: { feature_name: "electronic_signature", upgrade_required: "pro" },
//   message: "The feature 'electronic_signature' requires the 'pro' plan.",
//   upgrade_url: "/settings/billing"
// }
```

---

## Utilisation des middlewares

### 1. Quota uniquement

```typescript
// Vérifier le quota avant de créer une ressource
router.post("/dresses", authMiddleware, requireQuota("dresses"), createDress);
router.post("/customers", authMiddleware, requireQuota("customers"), createCustomer);
router.post("/contracts", authMiddleware, requireQuota("contracts"), createContract);
```

### 2. Feature uniquement

```typescript
// Vérifier l'accès à une fonctionnalité premium
router.get("/analytics", authMiddleware, requireFeature("advanced_analytics"), getAnalytics);
router.post("/export", authMiddleware, requireFeature("export_data"), exportData);
router.post("/contracts/:id/sign", authMiddleware, requireFeature("electronic_signature"), signContract);
```

### 3. Quota + Feature combinés

```typescript
import { requireQuotaAndFeature } from "../middleware/subscriptionMiddleware.js";

// Vérifier les deux en même temps
router.post("/contracts/advanced",
  authMiddleware,
  requireQuotaAndFeature("contracts", "advanced_analytics"),  // Les 2
  createAdvancedContract
);
```

### 4. Subscription active (général)

```typescript
import { requireActiveSubscription } from "../middleware/subscriptionMiddleware.js";

// Bloquer toute l'API si trial/subscription expirée
router.use("/api", authMiddleware, requireActiveSubscription);
```

---

## Exemples pratiques

### Exemple 1 : Créer un utilisateur avec vérification quota

```typescript
// src/routes/users.ts
import { requireQuota } from "../middleware/subscriptionMiddleware.js";

router.post("/users",
  authMiddleware,           // 1. Authentifier
  requireQuota("users"),    // 2. Vérifier quota users
  async (req, res) => {     // 3. Créer user
    const { email, password, roleName } = req.body;

    // Le quota a déjà été vérifié par le middleware
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        organization_id: req.user.organizationId,
        profile: { create: { role_id: roleId } }
      }
    });

    res.json({ success: true, data: user });
  }
);
```

### Exemple 2 : Feature premium avec upgrade message

```typescript
// src/routes/analytics.ts
import { requireFeature } from "../middleware/subscriptionMiddleware.js";

router.get("/analytics/advanced",
  authMiddleware,
  requireFeature("advanced_analytics"),  // Vérifie la feature
  async (req, res) => {
    // Si on arrive ici, l'organisation a accès aux analytics
    const data = await generateAdvancedAnalytics(req.user.organizationId);
    res.json(data);
  }
);

// Si pas accès, le client reçoit automatiquement :
// {
//   error: "Feature not available in your plan",
//   upgrade_required: "pro",
//   upgrade_url: "/settings/billing"
// }
```

### Exemple 3 : Vérification manuelle pour affichage UI

```typescript
// src/controllers/dashboardController.ts
import { checkQuotas, checkFeatures } from "../utils/subscriptionManager.js";

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user.organizationId;

  // Vérifier plusieurs quotas en même temps
  const quotas = await checkQuotas(orgId, ["users", "dresses", "customers"]);

  // Vérifier plusieurs features
  const features = await checkFeatures(orgId, [
    "electronic_signature",
    "advanced_analytics",
    "api_access"
  ]);

  res.json({
    quotas,        // Pour afficher des barres de progression
    features,      // Pour show/hide des boutons premium
    subscription: await getSubscriptionStatus(orgId)
  });
};

// Réponse :
// {
//   quotas: {
//     users: { allowed: true, current_usage: 5, limit: 10, remaining: 5, percentage_used: 50 },
//     dresses: { allowed: true, current_usage: 80, limit: 100, remaining: 20, percentage_used: 80 },
//     customers: { allowed: false, current_usage: 500, limit: 500, remaining: 0, percentage_used: 100 }
//   },
//   features: {
//     electronic_signature: { allowed: false, upgrade_required: "pro" },
//     advanced_analytics: { allowed: false, upgrade_required: "pro" },
//     api_access: { allowed: false, upgrade_required: "pro" }
//   },
//   subscription: {
//     status: "trial",
//     is_trial_expired: false,
//     days_remaining: 12
//   }
// }
```

### Exemple 4 : Tracking d'utilisation

```typescript
// Après création d'une ressource, tracker l'usage
import { trackUsage } from "../utils/subscriptionManager.js";

const dress = await prisma.dress.create({ data: dressData });

// Enregistrer l'événement
await trackUsage(
  organizationId,
  "dress_created",      // Type d'événement
  "dress",              // Type de ressource
  dress.id,             // ID de la ressource
  { user_id: req.user.id }  // Metadata optionnelle
);
```

---

## Créer les plans initiaux

Créez un fichier seed pour initialiser vos plans de souscription :

```typescript
// prisma/seed-subscriptions.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  // Free Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: "free" },
    update: {},
    create: {
      name: "Free",
      code: "free",
      description: "Plan gratuit pour démarrer",
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 14,
      limits: {
        users: 3,
        dresses: 50,
        customers: 200,
        contracts_per_month: 10,
        storage_gb: 1,
        api_calls_per_day: 100,
        email_notifications: 50
      },
      features: {
        prospect_management: false,
        contract_generation: true,
        electronic_signature: false,
        inventory_management: true,
        customer_portal: false,
        advanced_analytics: false,
        export_data: false,
        api_access: false,
        white_label: false,
        sms_notifications: false
      },
      is_public: true,
      sort_order: 1
    }
  });

  // Basic Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: "basic" },
    update: {},
    create: {
      name: "Basic",
      code: "basic",
      description: "Pour les petites boutiques",
      price_monthly: 19,
      price_yearly: 190,
      trial_days: 14,
      limits: {
        users: 10,
        dresses: 500,
        customers: 2000,
        contracts_per_month: 50,
        storage_gb: 10,
        api_calls_per_day: 1000,
        email_notifications: 500
      },
      features: {
        prospect_management: true,
        contract_generation: true,
        electronic_signature: false,
        inventory_management: true,
        customer_portal: false,
        advanced_analytics: false,
        export_data: true,
        api_access: false,
        white_label: false,
        sms_notifications: false
      },
      is_public: true,
      sort_order: 2
    }
  });

  // Pro Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: "pro" },
    update: {},
    create: {
      name: "Pro",
      code: "pro",
      description: "Pour les boutiques professionnelles",
      price_monthly: 49,
      price_yearly: 490,
      trial_days: 14,
      limits: {
        users: 20,
        dresses: 9999999,  // Illimité (grande valeur)
        customers: 9999999,
        contracts_per_month: 200,
        storage_gb: 50,
        api_calls_per_day: 10000,
        email_notifications: 2000
      },
      features: {
        prospect_management: true,
        contract_generation: true,
        electronic_signature: true,
        inventory_management: true,
        customer_portal: true,
        advanced_analytics: true,
        export_data: true,
        api_access: true,
        white_label: false,
        sms_notifications: true
      },
      is_public: true,
      is_popular: true,  // Badge "Populaire"
      sort_order: 3
    }
  });

  // Enterprise Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      code: "enterprise",
      description: "Pour les grandes organisations",
      price_monthly: 149,
      price_yearly: 1490,
      trial_days: 30,
      limits: {
        users: 9999999,
        dresses: 9999999,
        customers: 9999999,
        contracts_per_month: 9999999,
        storage_gb: 500,
        api_calls_per_day: 100000,
        email_notifications: 10000
      },
      features: {
        prospect_management: true,
        contract_generation: true,
        electronic_signature: true,
        inventory_management: true,
        customer_portal: true,
        advanced_analytics: true,
        export_data: true,
        api_access: true,
        white_label: true,
        sms_notifications: true
      },
      is_public: true,
      sort_order: 4
    }
  });

  console.log("✅ Subscription plans seeded successfully");
}

seedSubscriptionPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Exécutez le seed :

```bash
npx tsx prisma/seed-subscriptions.ts
```

---

## Résumé

### ✅ Ce qui est déjà en place :
- ✅ Modèle `SubscriptionPlan` avec limites et features
- ✅ Middleware `requireQuota()` pour vérifier les quotas
- ✅ Middleware `requireFeature()` pour vérifier les features
- ✅ Fonction `checkQuota()` pour vérifications programmatiques
- ✅ Fonction `checkFeature()` pour vérifications programmatiques
- ✅ Tracking automatique avec `trackUsage()`

### 🔧 À faire :
1. Créer les plans initiaux (seed)
2. Ajouter les middlewares sur vos routes
3. Implémenter le système de paiement (Stripe)
4. Créer l'interface de gestion de billing

### 📝 Codes HTTP utilisés :
- **402 Payment Required** : Quota dépassé ou feature non disponible
- **403 Forbidden** : Account suspendu ou inactif
