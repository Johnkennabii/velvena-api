# Gestion des Abonnements Stripe - Guide Complet

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Plan FREE vs Plans PAYANTS](#plan-free-vs-plans-payants)
3. [Changement d'abonnement](#changement-dabonnement)
4. [Facturation et Prorata](#facturation-et-prorata)
5. [Implémentation Frontend](#implémentation-frontend)
6. [Webhooks Stripe](#webhooks-stripe)

---

## Vue d'ensemble

### Plans disponibles
- **FREE** : Gratuit, 14 jours d'essai, pas de Stripe
- **STARTER** : 29€/mois, géré par Stripe
- **PRO** : 79€/mois, géré par Stripe
- **ENTERPRISE** : Prix personnalisé, géré par Stripe

---

## Plan FREE vs Plans PAYANTS

### Plan FREE (sans Stripe)

**Caractéristiques** :
- ✅ Pas de `stripe_customer_id`
- ✅ Pas de `stripe_subscription_id`
- ✅ `subscription_plan: "free"`
- ✅ `subscription_status: "trial"`
- ✅ `trial_ends_at`: 14 jours après création
- ❌ **Aucune interaction avec Stripe**

**Création** :
```typescript
POST /api/organizations/initialize
{
  "organizationName": "Ma Boutique",
  "slug": "ma-boutique",
  "subscription_plan": "free",  // ← Important !
  "userEmail": "manager@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

// Réponse :
{
  "token": "eyJhbGc...",
  "organization": {
    "id": "...",
    "subscription_plan": "free",
    "subscription_status": "trial",
    "trial_ends_at": "2025-12-27T..."
  },
  "user": { ... }
}
```

**⚠️ Pas de redirection Stripe** - L'utilisateur est directement connecté.

### Plans PAYANTS (avec Stripe)

**Flux d'inscription** :

```typescript
// 1. Créer l'organisation en FREE d'abord
POST /api/organizations/initialize
{
  "organizationName": "Ma Boutique Pro",
  "slug": "boutique-pro",
  "subscription_plan": "free",  // ← Commence toujours en FREE
  ...
}

// 2. Créer immédiatement une session Stripe Checkout
POST /api/billing/create-checkout-session
Headers: { "Authorization": "Bearer <token>" }
{
  "plan_code": "starter",  // ou "pro", "enterprise"
  "billing_interval": "month",  // ou "year"
  "success_url": "https://app.velvena.fr/subscription/success",
  "cancel_url": "https://app.velvena.fr/pricing"
}

// Réponse :
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "publishableKey": "pk_live_..."
}

// 3. Rediriger vers Stripe
window.location.href = response.url;

// 4. Après paiement, Stripe webhook met à jour :
// - stripe_customer_id
// - stripe_subscription_id
// - subscription_plan_id
// - subscription_status: "active"
```

---

## Changement d'abonnement

### Trois cas possibles

#### 1. FREE → PAYANT (Premier abonnement)

**Endpoint** : `POST /api/billing/create-checkout-session`

```typescript
// Utilisateur sur FREE, veut passer à STARTER
const response = await fetch('/api/billing/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_code: 'starter',
    billing_interval: 'month',
    success_url: 'https://app.velvena.fr/subscription/success',
    cancel_url: 'https://app.velvena.fr/settings/subscription'
  })
});

const { url } = await response.json();
window.location.href = url;  // Redirection Stripe Checkout
```

**Ce qui se passe** :
1. ✅ Création d'un customer Stripe
2. ✅ Création d'une subscription Stripe
3. ✅ Paiement immédiat du premier mois
4. ✅ Webhook Stripe met à jour l'organisation

#### 2. PAYANT → PAYANT (Upgrade)

**Endpoint** : `POST /api/billing/change-plan`

```typescript
// Utilisateur sur STARTER (29€), veut passer à PRO (79€)
const response = await fetch('/api/billing/change-plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_code: 'pro',
    billing_interval: 'month',
    proration_behavior: 'create_prorations'  // ← Important pour upgrade
  })
});

// Réponse immédiate :
{
  "success": true,
  "message": "Subscription plan changed successfully",
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "current_period_end": 1735689600
  }
}
```

**Facturation (avec prorata)** :
```
Utilisateur sur STARTER (29€/mois) - 15 jours écoulés
Upgrade vers PRO (79€/mois)

Calcul Stripe :
- Crédit restant STARTER : 29€ × (15/30) = 14,50€
- Coût PRO pour 15 jours : 79€ × (15/30) = 39,50€
- Montant facturé immédiatement : 39,50€ - 14,50€ = 25€
```

**✅ Pas de redirect** - Le changement est immédiat, l'utilisateur paie la différence.

#### 3. PAYANT → PAYANT (Downgrade)

**Endpoint** : `POST /api/billing/change-plan`

```typescript
// Utilisateur sur PRO (79€), veut passer à STARTER (29€)
const response = await fetch('/api/billing/change-plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_code: 'starter',
    billing_interval: 'month',
    proration_behavior: 'none'  // ← Changement à la fin de la période
  })
});
```

**Comportement** :
- ✅ L'utilisateur garde PRO jusqu'à la fin du mois
- ✅ Le downgrade prend effet à la prochaine facturation
- ✅ Pas de remboursement, pas de crédit
- ✅ `subscription.cancel_at_period_end` reste `false`
- ✅ Le plan change automatiquement le jour de renouvellement

---

## Facturation et Prorata

### Paramètre `proration_behavior`

| Valeur | Description | Utilisation recommandée |
|--------|-------------|------------------------|
| `create_prorations` | Calcule et facture immédiatement la différence | **Upgrades** (FREE→STARTER, STARTER→PRO) |
| `none` | Pas de prorata, changement à la fin de la période | **Downgrades** (PRO→STARTER) |
| `always_invoice` | Créé une facture séparée pour le prorata | Cas spéciaux |

### Exemples de facturation

#### Upgrade STARTER → PRO (au milieu du mois)

```
Date : 15 décembre 2025
Plan actuel : STARTER (29€/mois) - Payé le 1er décembre
Prochain renouvellement : 1er janvier 2026
Upgrade vers : PRO (79€/mois)

Calcul :
- Jours restants : 17 jours (du 15 déc au 31 déc)
- Crédit STARTER : 29€ × (17/31) = 15,90€
- Coût PRO prorata : 79€ × (17/31) = 43,35€
- Facture immédiate : 43,35€ - 15,90€ = 27,45€

Résultat :
- Facturé aujourd'hui : 27,45€
- Prochain renouvellement : 1er janvier 2026 → 79€ (plein tarif PRO)
```

#### Downgrade PRO → STARTER (avec `proration_behavior: none`)

```
Date : 15 décembre 2025
Plan actuel : PRO (79€/mois) - Payé le 1er décembre
Prochain renouvellement : 1er janvier 2026
Downgrade vers : STARTER (29€/mois)

Résultat :
- Facturé aujourd'hui : 0€
- L'utilisateur garde PRO jusqu'au 31 décembre
- Prochain renouvellement : 1er janvier 2026 → 29€ (STARTER)
```

---

## Implémentation Frontend

### 1. Page Pricing

```typescript
const PricingPage = () => {
  const { organization } = useAuth();

  const plans = [
    {
      code: 'free',
      name: 'Gratuit',
      price: '0€',
      interval: null,
      features: ['14 jours d\'essai', '10 robes max'],
      cta: 'Commencer',
      requiresStripe: false
    },
    {
      code: 'starter',
      name: 'Starter',
      price: '29€',
      interval: 'mois',
      features: ['50 robes', 'Support prioritaire'],
      cta: 'Souscrire',
      requiresStripe: true
    },
    {
      code: 'pro',
      name: 'Pro',
      price: '79€',
      interval: 'mois',
      features: ['Robes illimitées', 'Analytics avancés'],
      cta: 'Upgrade',
      requiresStripe: true
    }
  ];

  const handleSelectPlan = async (plan) => {
    if (!plan.requiresStripe) {
      // Plan FREE - Inscription directe
      navigate('/register');
      return;
    }

    // Plan PAYANT
    if (!organization) {
      // Pas encore d'organisation → Inscription puis Stripe
      navigate(`/register?plan=${plan.code}`);
    } else if (!organization.stripe_subscription_id) {
      // Organisation FREE → Premier checkout Stripe
      handleFirstSubscription(plan.code);
    } else {
      // Déjà abonné → Changement de plan
      handleChangePlan(plan.code);
    }
  };

  return (
    <div className="pricing-grid">
      {plans.map(plan => (
        <PricingCard
          key={plan.code}
          plan={plan}
          current={organization?.subscription_plan === plan.code}
          onSelect={() => handleSelectPlan(plan)}
        />
      ))}
    </div>
  );
};
```

### 2. Premier abonnement (FREE → PAYANT)

```typescript
const handleFirstSubscription = async (planCode: string) => {
  try {
    setLoading(true);

    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_code: planCode,
        billing_interval: billingInterval,  // 'month' ou 'year'
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/settings/subscription`
      })
    });

    const { url } = await response.json();

    // Redirection vers Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    toast.error('Impossible de créer la session de paiement');
  } finally {
    setLoading(false);
  }
};
```

### 3. Changement de plan (PAYANT → PAYANT)

```typescript
const handleChangePlan = async (newPlanCode: string) => {
  const currentPlan = organization.subscription_plan;

  // Déterminer si c'est un upgrade ou downgrade
  const planHierarchy = { free: 0, starter: 1, pro: 2, enterprise: 3 };
  const isUpgrade = planHierarchy[newPlanCode] > planHierarchy[currentPlan];

  // Confirmer avec l'utilisateur
  const confirmed = await showConfirmDialog({
    title: isUpgrade ? 'Upgrade de plan' : 'Downgrade de plan',
    message: isUpgrade
      ? `Vous allez être facturé au prorata pour la différence. Le changement est immédiat.`
      : `Votre plan actuel restera actif jusqu'à la fin de la période de facturation.`,
    confirmText: isUpgrade ? 'Upgrade maintenant' : 'Programmer le downgrade'
  });

  if (!confirmed) return;

  try {
    setLoading(true);

    const response = await fetch('/api/billing/change-plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_code: newPlanCode,
        billing_interval: billingInterval,
        proration_behavior: isUpgrade ? 'create_prorations' : 'none'
      })
    });

    const result = await response.json();

    if (result.success) {
      toast.success(
        isUpgrade
          ? 'Plan upgradé avec succès ! Vous avez maintenant accès à toutes les fonctionnalités.'
          : 'Downgrade programmé. Votre plan actuel reste actif jusqu\'à la fin de la période.'
      );

      // Rafraîchir les données de l'organisation
      await refetchOrganization();
    }
  } catch (error) {
    console.error('Erreur lors du changement de plan:', error);
    toast.error('Impossible de changer de plan');
  } finally {
    setLoading(false);
  }
};
```

### 4. Badge d'abonnement

```typescript
const SubscriptionBadge = ({ organization }) => {
  const { subscription_plan, subscription_status, trial_ends_at } = organization;

  // Plan FREE en période d'essai
  if (subscription_plan === 'free' && subscription_status === 'trial') {
    const daysLeft = Math.ceil(
      (new Date(trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="badge trial">
        🎁 Essai gratuit - {daysLeft} jours restants
        <Button onClick={() => navigate('/pricing')}>
          Passer à Premium
        </Button>
      </div>
    );
  }

  // Plan FREE (essai expiré)
  if (subscription_plan === 'free') {
    return (
      <div className="badge free">
        📦 Plan Gratuit
        <Button onClick={() => navigate('/pricing')}>Upgrade</Button>
      </div>
    );
  }

  // Plan PAYANT
  const planNames = {
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  return (
    <div className="badge premium">
      ⭐ Plan {planNames[subscription_plan]}
      {subscription_status === 'active' ? ' ✅' : ' ⚠️'}
      <Button onClick={() => navigate('/settings/subscription')}>
        Gérer
      </Button>
    </div>
  );
};
```

### 5. Vérification des limites

```typescript
const useQuotaCheck = (resource: 'dresses' | 'users' | 'customers') => {
  const { organization } = useAuth();

  const checkQuota = async () => {
    if (organization.subscription_plan === 'free') {
      const limits = {
        dresses: 10,
        users: 2,
        customers: 50
      };

      const response = await fetch('/api/billing/quotas');
      const quotas = await response.json();

      if (quotas[resource].current >= limits[resource]) {
        const shouldUpgrade = await showUpgradeModal(
          `Vous avez atteint la limite de ${limits[resource]} ${resource} du plan gratuit.`
        );

        if (shouldUpgrade) {
          navigate('/pricing');
        }

        return false;
      }
    }

    return true;
  };

  return { checkQuota };
};

// Utilisation
const handleCreateDress = async () => {
  const { checkQuota } = useQuotaCheck('dresses');

  if (!(await checkQuota())) {
    return;  // Quota dépassé
  }

  // Créer la robe
  await createDress(data);
};
```

---

## Webhooks Stripe

### Events importants

```typescript
// src/routes/stripe-webhooks.ts

// 1. checkout.session.completed
// → Créé quand l'utilisateur paie pour la première fois
// → Met à jour stripe_customer_id et stripe_subscription_id

// 2. customer.subscription.created
// → Confirme la création de l'abonnement
// → Met à jour subscription_status: "active"

// 3. customer.subscription.updated
// → Déclenché lors d'un changement de plan
// → Met à jour subscription_plan_id

// 4. invoice.paid
// → Confirme le paiement d'une facture
// → Utile pour les renouvellements automatiques

// 5. customer.subscription.deleted
// → L'abonnement a été annulé
// → Met à jour subscription_status: "cancelled"
```

---

## Résumé

### FREE → PAYANT
- **Endpoint** : `/api/billing/create-checkout-session`
- **Comportement** : Redirect vers Stripe Checkout
- **Facturation** : Paiement immédiat du premier mois

### UPGRADE (STARTER → PRO)
- **Endpoint** : `/api/billing/change-plan`
- **Proration** : `create_prorations`
- **Comportement** : Changement immédiat avec prorata
- **Facturation** : Différence facturée immédiatement

### DOWNGRADE (PRO → STARTER)
- **Endpoint** : `/api/billing/change-plan`
- **Proration** : `none`
- **Comportement** : Changement à la fin de la période
- **Facturation** : Aucune, pas de remboursement

---

## Questions fréquentes

**Q : L'ancien abonnement est-il annulé automatiquement lors d'un upgrade ?**
R : Non, l'abonnement n'est pas "annulé". Stripe modifie la subscription existante en changeant le price_id. C'est plus élégant et préserve l'historique.

**Q : Que se passe-t-il si l'utilisateur annule pendant un downgrade programmé ?**
R : Le downgrade est annulé, l'utilisateur garde son plan actuel.

**Q : Peut-on passer de PAYANT à FREE ?**
R : Oui, en utilisant `/api/billing/cancel-subscription`. L'abonnement Stripe est annulé et le plan repasse à FREE.

**Q : Comment gérer les coupons/réductions ?**
R : Utiliser les coupons Stripe dans `createCheckoutSession` avec le paramètre `allow_promotion_codes: true`.
