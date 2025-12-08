# Guide d'intégration - Système de Souscription Velvena

## 📚 Table des matières

1. [Initialisation des plans](#1-initialisation-des-plans)
2. [Protection des routes avec quotas](#2-protection-des-routes-avec-quotas)
3. [Protection des routes avec features](#3-protection-des-routes-avec-features)
4. [Vérifications programmatiques](#4-vérifications-programmatiques)
5. [Dashboard avec affichage conditionnel](#5-dashboard-avec-affichage-conditionnel)
6. [Endpoints de gestion de billing](#6-endpoints-de-gestion-de-billing)
7. [Frontend - Affichage UI](#7-frontend---affichage-ui)

---

## 1. Initialisation des plans

### Étape 1 : Créer les plans de souscription

```bash
# Exécuter le seed pour créer les 4 plans (Free, Basic, Pro, Enterprise)
npx tsx prisma/seed-subscriptions.ts
```

Résultat :
```
✅ Free plan created: 0€/mois (3 users, 50 robes)
✅ Basic plan created: 19€/mois (10 users, 500 robes)
✅ Pro plan created: 49€/mois (20 users, illimité) ⭐
✅ Enterprise plan created: 149€/mois (illimité)
```

### Étape 2 : Vérifier dans la base de données

```sql
SELECT name, code, price_monthly, is_popular FROM subscription_plans;
```

---

## 2. Protection des routes avec quotas

### Exemple 1 : Créer un utilisateur (vérifier quota)

**AVANT (sans protection) :**
```typescript
// src/routes/userRoutes/auth.ts
router.post("/register", authMiddleware, register);
```

**APRÈS (avec protection quota) :**
```typescript
// src/routes/userRoutes/auth.ts
import { requireQuota } from "../../middleware/subscriptionMiddleware.js";

router.post("/register",
  authMiddleware,          // ✅ Authentification
  requireQuota("users"),   // ✅ Vérifie quota users
  register                 // ✅ Crée l'utilisateur
);
```

**Comportement :**
- Si quota OK → Continue vers `register`
- Si quota dépassé → Retourne erreur 402

**Réponse quand quota dépassé :**
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

### Exemple 2 : Créer une robe

```typescript
// src/routes/dresses.ts
import { requireQuota } from "../middleware/subscriptionMiddleware.js";

router.post("/dresses",
  authMiddleware,
  requireQuota("dresses"),  // ✅ Vérifie quota robes
  createDress
);
```

### Exemple 3 : Créer un client

```typescript
// src/routes/customers.ts
import { requireQuota } from "../middleware/subscriptionMiddleware.js";

router.post("/customers",
  authMiddleware,
  requireQuota("customers"),  // ✅ Vérifie quota clients
  createCustomer
);
```

### Exemple 4 : Créer un contrat

```typescript
// src/routes/contracts.ts
import { requireQuota } from "../middleware/subscriptionMiddleware.js";

router.post("/contracts",
  authMiddleware,
  requireQuota("contracts"),  // ✅ Vérifie quota contrats/mois
  createContract
);
```

---

## 3. Protection des routes avec features

### Exemple 1 : Signature électronique (Pro+)

```typescript
// src/routes/contracts.ts
import { requireFeature } from "../middleware/subscriptionMiddleware.js";

// Signer un contrat électroniquement (feature Pro+)
router.post("/contracts/:id/sign",
  authMiddleware,
  requireFeature("electronic_signature"),  // ✅ Vérifie feature
  async (req, res) => {
    const { id } = req.params;
    const { signature } = req.body;

    // Logique de signature électronique
    const signedContract = await signContractElectronically(id, signature);

    res.json({ success: true, contract: signedContract });
  }
);
```

**Réponse si feature non disponible :**
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

### Exemple 2 : Analytics avancées (Pro+)

```typescript
// src/routes/analytics.ts
import { requireFeature } from "../middleware/subscriptionMiddleware.js";

// Analytics basiques (accessible à tous)
router.get("/analytics/basic", authMiddleware, async (req, res) => {
  const stats = {
    total_dresses: 120,
    total_customers: 85,
    total_contracts: 42
  };
  res.json(stats);
});

// Analytics avancées (Pro+ seulement)
router.get("/analytics/advanced",
  authMiddleware,
  requireFeature("advanced_analytics"),  // ✅ Pro+ uniquement
  async (req, res) => {
    const orgId = req.user.organizationId;

    const advancedStats = {
      revenue_trends: await getRevenueTrends(orgId),
      top_products: await getTopProducts(orgId),
      customer_lifetime_value: await getCustomerLTV(orgId),
      churn_rate: await getChurnRate(orgId)
    };

    res.json(advancedStats);
  }
);
```

### Exemple 3 : Export de données (Basic+)

```typescript
// src/routes/exports.ts
import { requireFeature } from "../middleware/subscriptionMiddleware.js";

// Export CSV (Basic+ seulement)
router.get("/exports/customers/csv",
  authMiddleware,
  requireFeature("export_data"),  // ✅ Basic+ uniquement
  async (req, res) => {
    const customers = await getCustomers(req.user.organizationId);
    const csv = convertToCSV(customers);

    res.header("Content-Type", "text/csv");
    res.attachment("customers.csv");
    res.send(csv);
  }
);

// Export PDF
router.get("/exports/contracts/pdf",
  authMiddleware,
  requireFeature("export_data"),
  async (req, res) => {
    const pdf = await generateContractsPDF(req.user.organizationId);

    res.contentType("application/pdf");
    res.send(pdf);
  }
);
```

### Exemple 4 : API publique (Pro+)

```typescript
// src/routes/api/v1/index.ts
import { requireFeature } from "../../middleware/subscriptionMiddleware.js";
import apiKeyMiddleware from "../../middleware/apiKeyMiddleware.js";

const router = Router();

// Toutes les routes API nécessitent la feature "api_access"
router.use(apiKeyMiddleware);
router.use(requireFeature("api_access"));  // ✅ Pro+ uniquement

// Endpoints API
router.get("/dresses", async (req, res) => {
  const dresses = await getDresses(req.apiKey.organization_id);
  res.json(dresses);
});

router.get("/customers", async (req, res) => {
  const customers = await getCustomers(req.apiKey.organization_id);
  res.json(customers);
});

export default router;
```

---

## 4. Vérifications programmatiques

### Exemple 1 : Vérifier un quota manuellement

```typescript
import { checkQuota } from "../utils/subscriptionManager.js";

export const someController = async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user.organizationId;

  // Vérifier le quota avant une action
  const quotaCheck = await checkQuota(orgId, "dresses");

  if (!quotaCheck.allowed) {
    return res.status(402).json({
      error: "Cannot create dress",
      message: `Quota limit reached (${quotaCheck.limit}). ${quotaCheck.remaining} remaining.`,
      upgrade_url: "/settings/billing"
    });
  }

  // Avertir si proche de la limite (>= 80%)
  if (quotaCheck.percentage_used >= 80) {
    console.warn(`⚠️ Organization ${orgId} approaching dress quota: ${quotaCheck.percentage_used}%`);
  }

  // Continuer avec la création...
  const dress = await createDress(data);
  res.json({ success: true, data: dress });
};
```

### Exemple 2 : Vérifier plusieurs quotas

```typescript
import { checkQuotas } from "../utils/subscriptionManager.js";

export const getQuotasStatus = async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user.organizationId;

  // Vérifier plusieurs quotas en une fois
  const quotas = await checkQuotas(orgId, [
    "users",
    "dresses",
    "customers",
    "contracts"
  ]);

  res.json({
    users: quotas.users,
    dresses: quotas.dresses,
    customers: quotas.customers,
    contracts: quotas.contracts
  });
};

// Réponse :
// {
//   users: { allowed: true, current_usage: 5, limit: 10, remaining: 5, percentage_used: 50 },
//   dresses: { allowed: true, current_usage: 45, limit: 50, remaining: 5, percentage_used: 90 },
//   customers: { allowed: false, current_usage: 200, limit: 200, remaining: 0, percentage_used: 100 },
//   contracts: { allowed: true, current_usage: 8, limit: 10, remaining: 2, percentage_used: 80 }
// }
```

### Exemple 3 : Vérifier une feature manuellement

```typescript
import { checkFeature } from "../utils/subscriptionManager.js";

export const conditionalFeature = async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user.organizationId;

  // Vérifier si l'organisation a accès à la feature
  const featureCheck = await checkFeature(orgId, "electronic_signature");

  if (!featureCheck.allowed) {
    return res.status(402).json({
      error: "Feature not available",
      feature: featureCheck.feature_name,
      upgrade_required: featureCheck.upgrade_required,
      message: `Upgrade to ${featureCheck.upgrade_required} plan to use this feature`
    });
  }

  // Continuer avec la feature...
  const result = await useElectronicSignature();
  res.json(result);
};
```

### Exemple 4 : Vérifier plusieurs features

```typescript
import { checkFeatures } from "../utils/subscriptionManager.js";

export const getFeaturesStatus = async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user.organizationId;

  // Vérifier plusieurs features
  const features = await checkFeatures(orgId, [
    "electronic_signature",
    "advanced_analytics",
    "api_access",
    "export_data",
    "white_label"
  ]);

  res.json(features);
};

// Réponse :
// {
//   electronic_signature: { allowed: false, feature_name: "electronic_signature", upgrade_required: "pro" },
//   advanced_analytics: { allowed: false, feature_name: "advanced_analytics", upgrade_required: "pro" },
//   api_access: { allowed: false, feature_name: "api_access", upgrade_required: "pro" },
//   export_data: { allowed: false, feature_name: "export_data", upgrade_required: "basic" },
//   white_label: { allowed: false, feature_name: "white_label", upgrade_required: "enterprise" }
// }
```

---

## 5. Dashboard avec affichage conditionnel

### Backend : Endpoint pour le dashboard

```typescript
// src/controllers/dashboardController.ts
import {
  checkQuotas,
  checkFeatures,
  getSubscriptionStatus
} from "../utils/subscriptionManager.js";

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user.organizationId;

  // 1. Vérifier les quotas
  const quotas = await checkQuotas(orgId, [
    "users",
    "dresses",
    "customers",
    "contracts"
  ]);

  // 2. Vérifier les features
  const features = await checkFeatures(orgId, [
    "electronic_signature",
    "advanced_analytics",
    "api_access",
    "export_data",
    "customer_portal",
    "white_label"
  ]);

  // 3. Récupérer le statut de souscription
  const subscription = await getSubscriptionStatus(orgId);

  res.json({
    quotas,
    features,
    subscription
  });
};
```

```typescript
// src/routes/dashboard.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = Router();

router.get("/dashboard", authMiddleware, getDashboard);

export default router;
```

### Frontend : Affichage React/Vue/Angular

**Réponse API exemple :**
```json
{
  "quotas": {
    "users": {
      "allowed": true,
      "current_usage": 5,
      "limit": 10,
      "remaining": 5,
      "percentage_used": 50
    },
    "dresses": {
      "allowed": true,
      "current_usage": 45,
      "limit": 50,
      "remaining": 5,
      "percentage_used": 90
    },
    "customers": {
      "allowed": false,
      "current_usage": 200,
      "limit": 200,
      "remaining": 0,
      "percentage_used": 100
    }
  },
  "features": {
    "electronic_signature": {
      "allowed": false,
      "feature_name": "electronic_signature",
      "upgrade_required": "pro"
    },
    "advanced_analytics": {
      "allowed": false,
      "upgrade_required": "pro"
    }
  },
  "subscription": {
    "status": "trial",
    "plan": { "name": "Free", "code": "free" },
    "is_trial": true,
    "is_trial_expired": false,
    "days_remaining": 12
  }
}
```

**Composant React :**

```tsx
// components/DashboardHeader.tsx
import React from 'react';
import { Alert, ProgressBar, Badge } from './ui';

interface DashboardHeaderProps {
  quotas: any;
  features: any;
  subscription: any;
}

export function DashboardHeader({ quotas, features, subscription }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      {/* Alerte trial expire bientôt */}
      {subscription.is_trial && subscription.days_remaining <= 3 && (
        <Alert variant="warning">
          ⏰ Votre période d'essai expire dans {subscription.days_remaining} jours.
          <a href="/settings/billing">Passer à un plan payant</a>
        </Alert>
      )}

      {/* Alerte quota proche de la limite (>= 80%) */}
      {quotas.dresses.percentage_used >= 80 && quotas.dresses.allowed && (
        <Alert variant="info">
          ⚠️ Vous avez utilisé {quotas.dresses.percentage_used}% de votre quota de robes.
          {quotas.dresses.remaining} robes restantes.
          <a href="/settings/billing">Upgrader</a>
        </Alert>
      )}

      {/* Alerte quota dépassé */}
      {!quotas.customers.allowed && (
        <Alert variant="error">
          🚫 Limite de clients atteinte ({quotas.customers.limit}).
          <a href="/settings/billing">Upgrader votre plan</a>
        </Alert>
      )}

      {/* Afficher le plan actuel */}
      <div className="current-plan">
        Plan actuel : <strong>{subscription.plan.name}</strong>
        {subscription.is_trial && <Badge variant="info">Trial</Badge>}
      </div>
    </div>
  );
}
```

```tsx
// components/QuotaDisplay.tsx
export function QuotaDisplay({ quotas }) {
  return (
    <div className="quotas-grid">
      <QuotaCard
        title="Utilisateurs"
        current={quotas.users.current_usage}
        limit={quotas.users.limit}
        percentage={quotas.users.percentage_used}
      />

      <QuotaCard
        title="Robes"
        current={quotas.dresses.current_usage}
        limit={quotas.dresses.limit}
        percentage={quotas.dresses.percentage_used}
      />

      <QuotaCard
        title="Clients"
        current={quotas.customers.current_usage}
        limit={quotas.customers.limit}
        percentage={quotas.customers.percentage_used}
      />
    </div>
  );
}

function QuotaCard({ title, current, limit, percentage }) {
  const color = percentage >= 100 ? 'red' : percentage >= 80 ? 'orange' : 'green';

  return (
    <div className="quota-card">
      <h3>{title}</h3>
      <div className="quota-numbers">
        {current} / {limit}
      </div>
      <ProgressBar value={percentage} color={color} />
      <span>{percentage}% utilisé</span>
    </div>
  );
}
```

```tsx
// components/FeatureButton.tsx
export function FeatureButton({ features, featureName, onClick, children }) {
  const feature = features[featureName];
  const isAllowed = feature.allowed;

  return (
    <div className="feature-button-wrapper">
      <button
        disabled={!isAllowed}
        onClick={isAllowed ? onClick : undefined}
        className={!isAllowed ? 'disabled-feature' : ''}
      >
        {children}
        {!isAllowed && (
          <Badge variant="premium">
            {feature.upgrade_required.toUpperCase()}
          </Badge>
        )}
      </button>

      {!isAllowed && (
        <Tooltip>
          Cette fonctionnalité nécessite le plan {feature.upgrade_required}.
          <a href="/settings/billing">Upgrader maintenant</a>
        </Tooltip>
      )}
    </div>
  );
}

// Usage :
<FeatureButton
  features={features}
  featureName="electronic_signature"
  onClick={handleSign}
>
  Signer électroniquement
</FeatureButton>
```

---

## 6. Endpoints de gestion de billing

### Créer les routes de billing

```typescript
// src/routes/billing.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getSubscriptionStatus,
  changeSubscriptionPlan
} from "../utils/subscriptionManager.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /billing/status - Récupérer le statut actuel
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const status = await getSubscriptionStatus(req.user.organizationId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /billing/plans - Lister les plans disponibles
router.get("/plans", async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_public: true },
      orderBy: { sort_order: 'asc' }
    });
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /billing/upgrade - Changer de plan (après paiement)
router.post("/upgrade", authMiddleware, async (req, res) => {
  try {
    const { plan_code } = req.body;

    // 1. Trouver le nouveau plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { code: plan_code }
    });

    if (!newPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // 2. TODO: Vérifier le paiement Stripe ici
    // const paymentSuccess = await verifyStripePayment(req.body.payment_id);
    // if (!paymentSuccess) return res.status(400).json({ error: "Payment failed" });

    // 3. Changer le plan
    await changeSubscriptionPlan(
      req.user.organizationId,
      newPlan.id,
      req.user.id
    );

    res.json({
      success: true,
      message: `Plan upgraded to ${newPlan.name}`,
      plan: newPlan
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

### Enregistrer les routes

```typescript
// src/server.ts
import billingRoutes from "./routes/billing.js";

app.use("/api/billing", billingRoutes);
```

---

## 7. Frontend - Affichage UI

### Page Pricing

```tsx
// pages/Pricing.tsx
import React, { useEffect, useState } from 'react';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    // Récupérer les plans depuis l'API
    fetch('/api/billing/plans')
      .then(res => res.json())
      .then(data => setPlans(data));
  }, []);

  return (
    <div className="pricing-page">
      <h1>Choisissez votre plan</h1>
      <div className="pricing-grid">
        {plans.map(plan => (
          <PricingCard key={plan.code} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PricingCard({ plan }) {
  const limits = plan.limits;
  const features = plan.features;

  return (
    <div className={`pricing-card ${plan.is_popular ? 'popular' : ''}`}>
      {plan.is_popular && <Badge>Plus populaire</Badge>}

      <h2>{plan.name}</h2>
      <div className="price">
        {plan.price_monthly}€<span>/mois</span>
      </div>
      <p className="description">{plan.description}</p>

      <ul className="features-list">
        <li>✅ {limits.users} utilisateurs</li>
        <li>✅ {limits.dresses} robes</li>
        <li>✅ {limits.customers} clients</li>
        <li>✅ {limits.contracts_per_month} contrats/mois</li>
        <li>✅ {limits.storage_gb} GB stockage</li>

        {features.electronic_signature && <li>✅ Signature électronique</li>}
        {features.advanced_analytics && <li>✅ Analytics avancées</li>}
        {features.api_access && <li>✅ Accès API</li>}
        {features.export_data && <li>✅ Export de données</li>}
      </ul>

      <button onClick={() => handleSelectPlan(plan.code)}>
        {plan.price_monthly === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
      </button>
    </div>
  );
}
```

---

## Récapitulatif : Checklist d'intégration

### ✅ Backend

- [ ] Exécuter `npx tsx prisma/seed-subscriptions.ts`
- [ ] Ajouter `requireQuota("users")` sur `/register`
- [ ] Ajouter `requireQuota("dresses")` sur `POST /dresses`
- [ ] Ajouter `requireQuota("customers")` sur `POST /customers`
- [ ] Ajouter `requireQuota("contracts")` sur `POST /contracts`
- [ ] Ajouter `requireFeature("electronic_signature")` sur signature
- [ ] Ajouter `requireFeature("advanced_analytics")` sur analytics
- [ ] Ajouter `requireFeature("export_data")` sur exports
- [ ] Créer route `GET /dashboard` avec quotas + features
- [ ] Créer routes `/billing/*` (status, plans, upgrade)

### ✅ Frontend

- [ ] Créer page `/pricing` avec liste des plans
- [ ] Afficher quotas dans le dashboard (barres de progression)
- [ ] Désactiver boutons si quota dépassé
- [ ] Afficher badges "Pro"/"Enterprise" sur features premium
- [ ] Alertes si trial expire bientôt
- [ ] Alertes si quota >= 80%
- [ ] Bouton "Upgrader" vers `/settings/billing`

C'est tout ! 🎉
