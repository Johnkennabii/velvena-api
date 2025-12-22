# Guide d'Intégration Frontend - Système d'Abonnement Velvena

## Vue d'ensemble

Ce document décrit comment le frontend doit intégrer le système d'abonnement Stripe avec le backend Velvena.

## URL de Base

- **Local** : `http://localhost:3000`
- **Production** : `https://api.velvena.fr`

---

## 1. Période d'Essai

### Règles Métier

- **Plan Free** : 14 jours d'essai gratuit
- **Plans payants (Starter, Pro, Enterprise)** : **PAS de période d'essai**, abonnement actif immédiatement après paiement

### Rappels Automatiques (Plan Free uniquement)

Les utilisateurs MANAGER et ADMIN reçoivent des emails de rappel automatiques :
- **7 jours** avant la fin de l'essai
- **3 jours** avant la fin de l'essai
- **1 jour** avant la fin de l'essai

### Ce qui se passe quand l'essai expire

Si l'utilisateur ne souscrit pas à un abonnement payant :
- **Toutes les routes protégées** retournent `402 Payment Required`
- **Les données sont conservées** (pas de suppression)
- L'utilisateur peut souscrire à tout moment pour retrouver l'accès

---

## 2. Endpoints API Disponibles

### 2.1 Récupérer le Statut d'Abonnement

```http
GET /billing/status
Authorization: Bearer {jwt_token}
```

**Réponse 200 OK :**
```json
{
  "plan_code": "starter",
  "plan_name": "Starter",
  "subscription_status": "active",
  "subscription_ends_at": "2025-01-22T14:30:00.000Z",
  "trial_ends_at": null,
  "stripe_subscription_id": "sub_1234567890",
  "is_trial": false,
  "is_active": true,
  "is_expired": false,
  "days_remaining": null,
  "is_cancelling": false,
  "cancellation_type": null,
  "cancellation_date": null,
  "days_until_cancellation": null,
  "limits": {
    "users": 10,
    "dresses": 500,
    "customers": 1000,
    "contracts_per_month": 200,
    "storage_gb": 50
  },
  "features": {
    "planning": true,
    "dashboard": true,
    "export_data": true,
    "customer_portal": true,
    "notification_push": true,
    "contract_generation": true,
    "prospect_management": true,
    "electronic_signature": true,
    "inventory_management": true,
    "contract_builder": true
  }
}
```

**Nouveaux champs de résiliation :**

- `is_cancelling: boolean` - `true` si l'abonnement est programmé pour être annulé
- `cancellation_type: "end_of_period" | "immediate" | null`
  - `"end_of_period"` - L'abonnement sera annulé à la fin de la période
  - `"immediate"` - L'abonnement a été annulé immédiatement
  - `null` - Aucune annulation en cours
- `cancellation_date: string | null` - Date ISO 8601 de la résiliation effective
- `days_until_cancellation: number | null` - Nombre de jours avant la résiliation

**États possibles de `subscription_status` :**
- `"trial"` - En période d'essai (Free plan uniquement)
- `"active"` - Abonnement payant actif
- `"past_due"` - Paiement échoué (1er essai)
- `"cancelled"` - Abonnement annulé
- `"incomplete"` - Paiement incomplet
- `"unpaid"` - Impayé après plusieurs tentatives

### 2.2 Lister les Plans Disponibles

```http
GET /billing/plans
```

**Aucune authentification requise** (route publique)

**Réponse 200 OK :**
```json
[
  {
    "id": "uuid-free",
    "name": "Free",
    "code": "free",
    "description": "Plan gratuit pour découvrir Velvena",
    "price_monthly": 0,
    "price_yearly": 0,
    "currency": "EUR",
    "trial_days": 14,
    "is_popular": false,
    "sort_order": 1,
    "limits": {
      "users": 3,
      "dresses": 50,
      "customers": 100,
      "contracts_per_month": 20,
      "storage_gb": 5
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "export_data": false,
      "customer_portal": false
    }
  },
  {
    "id": "uuid-starter",
    "name": "Starter",
    "code": "starter",
    "description": "Parfait pour les petites boutiques",
    "price_monthly": 19,
    "price_yearly": 190,
    "currency": "EUR",
    "trial_days": 14,
    "is_popular": true,
    "sort_order": 2,
    "limits": {
      "users": 10,
      "dresses": 500,
      "customers": 1000,
      "contracts_per_month": 200,
      "storage_gb": 50
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "export_data": true,
      "customer_portal": true,
      "notification_push": true
    }
  }
  // ... autres plans (Pro, Enterprise)
]
```

### 2.3 Vérifier les Quotas

```http
GET /billing/quotas
Authorization: Bearer {jwt_token}
```

**Réponse 200 OK :**
```json
{
  "users": {
    "limit": 10,
    "current": 3,
    "remaining": 7,
    "percentage": 30,
    "exceeded": false
  },
  "dresses": {
    "limit": 500,
    "current": 42,
    "remaining": 458,
    "percentage": 8.4,
    "exceeded": false
  },
  "customers": {
    "limit": 1000,
    "current": 156,
    "remaining": 844,
    "percentage": 15.6,
    "exceeded": false
  },
  "prospects": {
    "limit": 500,
    "current": 23,
    "remaining": 477,
    "percentage": 4.6,
    "exceeded": false
  },
  "contracts": {
    "limit": 200,
    "current": 18,
    "remaining": 182,
    "percentage": 9,
    "exceeded": false
  }
}
```

**Usage Frontend :**
- Afficher une barre de progression pour chaque quota
- Alerter l'utilisateur quand `percentage > 80`
- Bloquer la création si `exceeded: true`

### 2.4 Vérifier les Features

```http
GET /billing/features
Authorization: Bearer {jwt_token}
```

**Réponse 200 OK :**
```json
{
  "planning": {
    "enabled": true,
    "available": true
  },
  "dashboard": {
    "enabled": true,
    "available": true
  },
  "export_data": {
    "enabled": false,
    "available": true
  },
  "customer_portal": {
    "enabled": false,
    "available": true
  }
}
```

**Usage Frontend :**
- `enabled: true` → Afficher la fonctionnalité
- `enabled: false` → Masquer ou afficher avec badge "Upgrade to Pro"

### 2.5 Dashboard Complet (Tout-en-un)

```http
GET /billing/dashboard
Authorization: Bearer {jwt_token}
```

**Réponse 200 OK :**
```json
{
  "quotas": { /* ... voir /billing/quotas ... */ },
  "features": { /* ... voir /billing/features ... */ },
  "subscription": { /* ... voir /billing/status ... */ }
}
```

**Recommandation :** Utiliser cet endpoint pour la page "Paramètres > Abonnement"

---

## 3. Souscrire à un Abonnement (Stripe Checkout)

### Flow Utilisateur

```
1. Utilisateur clique sur "S'abonner à Starter (Mensuel)"
   ↓
2. Frontend appelle POST /billing/create-checkout-session
   ↓
3. Backend crée une session Stripe et retourne une URL
   ↓
4. Frontend redirige vers l'URL Stripe
   ↓
5. Utilisateur paie sur Stripe
   ↓
6. Stripe redirige vers success_url (votre frontend)
   ↓
7. Frontend affiche "Merci, votre abonnement est actif!"
   ↓
8. Webhook Stripe → Backend active automatiquement l'abonnement
```

### 3.1 Créer une Session Checkout

```http
POST /billing/create-checkout-session
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "plan_code": "starter",
  "billing_interval": "month",
  "success_url": "https://app.velvena.fr/billing/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://app.velvena.fr/billing/cancel"
}
```

**Paramètres :**
- `plan_code` : `"free"`, `"starter"`, `"pro"`, `"enterprise"`
- `billing_interval` : `"month"` ou `"year"`
- `success_url` : URL de redirection après paiement réussi
- `cancel_url` : URL de redirection si l'utilisateur annule

**Réponse 200 OK :**
```json
{
  "sessionId": "cs_test_a1b2c3d4...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4...",
  "publishableKey": "pk_test_51..."
}
```

**Usage Frontend :**
```javascript
// Option 1: Redirection directe (recommandé)
window.location.href = response.url;

// Option 2: Utiliser Stripe.js
const stripe = Stripe(response.publishableKey);
stripe.redirectToCheckout({ sessionId: response.sessionId });
```

### 3.2 Page de Succès

Après paiement, Stripe redirige vers votre `success_url`.

**URL reçue :**
```
https://app.velvena.fr/billing/success?session_id=cs_test_a1b2c3d4...
```

**Actions Frontend :**
1. Extraire `session_id` de l'URL
2. Afficher un message de confirmation
3. Appeler `GET /billing/status` pour récupérer le nouveau statut
4. Rediriger vers le dashboard après 3 secondes

**Important :** L'activation de l'abonnement est gérée par le webhook Stripe. Ne pas essayer d'activer manuellement.

---

## 4. Changer de Plan (Upgrade/Downgrade)

### Flow Utilisateur

```
1. Utilisateur clique sur "Passer à Pro"
   ↓
2. Frontend appelle POST /billing/change-plan
   ↓
3. Backend modifie l'abonnement Stripe
   ↓
4. Webhook Stripe → Backend met à jour l'organisation
   ↓
5. Frontend affiche "Votre plan a été changé avec succès"
```

### 4.1 Changer de Plan

```http
POST /billing/change-plan
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "plan_code": "pro",
  "billing_interval": "year",
  "proration_behavior": "create_prorations"
}
```

**Paramètres :**
- `proration_behavior` :
  - `"create_prorations"` (défaut) - Calcule le prorata
  - `"none"` - Pas de prorata, changement immédiat
  - `"always_invoice"` - Facture le prorata immédiatement

**Réponse 200 OK :**
```json
{
  "success": true,
  "message": "Subscription plan changed successfully",
  "subscription": {
    "id": "sub_1234567890",
    "status": "active",
    "currentPeriodEnd": "2025-12-22T14:30:00.000Z"
  }
}
```

**Erreur 400 - Pas d'abonnement Stripe :**
```json
{
  "error": "No active Stripe subscription found. Please use /create-checkout-session to subscribe first."
}
```

**Usage Frontend :**
- Si l'utilisateur n'a pas encore d'abonnement Stripe → Utiliser `/create-checkout-session`
- Si l'utilisateur a déjà un abonnement → Utiliser `/change-plan`

---

## 5. Portail Client Stripe

Le portail client Stripe permet à l'utilisateur de :
- Voir ses factures
- Mettre à jour sa carte bancaire
- Annuler son abonnement
- Voir l'historique de paiement

### 5.1 Créer une Session Portail

```http
POST /billing/create-portal-session
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "return_url": "https://app.velvena.fr/settings/billing"
}
```

**Réponse 200 OK :**
```json
{
  "url": "https://billing.stripe.com/session/live_abc123..."
}
```

**Usage Frontend :**
```javascript
// Ouvrir le portail dans un nouvel onglet
window.open(response.url, '_blank');

// Ou redirection dans la même fenêtre
window.location.href = response.url;
```

---

## 6. Annuler un Abonnement

### 6.1 Annulation depuis le Frontend

```http
POST /billing/cancel-subscription
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "immediately": false
}
```

**Paramètres :**
- `immediately: false` - Annule à la fin de la période (recommandé)
- `immediately: true` - Annule immédiatement

**Réponse 200 OK :**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end"
}
```

**Webhooks déclenchés :**

**Option 1 - Annulation à la fin de la période :**
```
customer.subscription.updated → cancel_at_period_end = true
```
L'utilisateur garde l'accès jusqu'à `subscription_ends_at`

**Option 2 - Annulation immédiate :**
```
customer.subscription.deleted
```
L'utilisateur perd l'accès immédiatement, `subscription_status` devient `"cancelled"`

### 6.2 Réactiver un Abonnement Annulé

Si un utilisateur a annulé son abonnement **à la fin de la période** (`cancel_at_period_end = true`), il peut le réactiver avant la date de fin.

```http
POST /billing/reactivate-subscription
Authorization: Bearer {jwt_token}
```

**Aucun body requis**

**Réponse 200 OK :**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully. It will continue at the end of the current period."
}
```

**Erreur 500 - Abonnement non annulé :**
```json
{
  "error": "Subscription is not scheduled for cancellation"
}
```

**Usage Frontend :**

```typescript
async function reactivateSubscription() {
  try {
    await axios.post('/billing/reactivate-subscription', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert('Votre abonnement a été réactivé avec succès !');

    // Rafraîchir le statut
    const status = await axios.get('/billing/status', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // is_cancelling devrait maintenant être false
  } catch (error) {
    console.error('Failed to reactivate subscription:', error);
  }
}
```

### 6.3 Recommandation UX

#### Dialogue d'Annulation

```
┌─────────────────────────────────────────────┐
│  Êtes-vous sûr de vouloir annuler ?         │
│                                             │
│  Vous avez 2 options :                      │
│                                             │
│  ○ Annuler à la fin de la période          │
│     Vous gardez l'accès jusqu'au 22/01/2025│
│     (Vous pourrez réactiver votre          │
│      abonnement à tout moment)             │
│                                             │
│  ○ Annuler immédiatement                   │
│     Vous perdez l'accès tout de suite      │
│     (Action irréversible)                  │
│                                             │
│  [Retour]  [Confirmer l'annulation]        │
└─────────────────────────────────────────────┘
```

#### Bannière de Résiliation Planifiée

Si `is_cancelling: true`, afficher une bannière :

```
┌────────────────────────────────────────────────────────┐
│  ⚠️  Votre abonnement sera résilié le 22/01/2025      │
│     Plus que 15 jours avant la fin de votre abonnement│
│                                                        │
│     [Réactiver mon abonnement]                        │
└────────────────────────────────────────────────────────┘
```

**Code React :**

```tsx
function CancellationBanner({ status }: { status: SubscriptionStatus }) {
  if (!status.is_cancelling) return null;

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
      // Rafraîchir le statut
    } catch (error) {
      alert('Erreur lors de la réactivation');
    }
  };

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-orange-700 font-semibold">
            ⚠️ Votre abonnement sera résilié le{' '}
            {new Date(status.cancellation_date).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-orange-600 text-sm">
            Plus que {status.days_until_cancellation} jour
            {status.days_until_cancellation > 1 ? 's' : ''} avant la fin de
            votre abonnement
          </p>
        </div>
        <button
          onClick={handleReactivate}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Réactiver mon abonnement
        </button>
      </div>
    </div>
  );
}
```

---

## 7. Voir les Factures

```http
GET /billing/invoices?limit=100
Authorization: Bearer {jwt_token}
```

**Réponse 200 OK :**
```json
{
  "success": true,
  "has_more": false,
  "count": 3,
  "invoices": [
    {
      "id": "in_1234567890",
      "number": "VELVENA-001",
      "status": "paid",
      "amount_due": 1900,
      "amount_paid": 1900,
      "currency": "eur",
      "created": 1703251200,
      "period_start": 1703251200,
      "period_end": 1705929600,
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_abc/invst_xyz",
      "invoice_pdf": "https://pay.stripe.com/invoice/acct_abc/invst_xyz/pdf"
    }
  ]
}
```

**Usage Frontend :**
Créer un tableau avec :
- Numéro de facture
- Date
- Montant (convertir centimes → euros : `amount_paid / 100`)
- Statut (`paid`, `open`, `void`, `uncollectible`)
- Lien de téléchargement PDF

---

## 8. Configuration Stripe

### 8.1 Récupérer la Clé Publique

```http
GET /billing/config
```

**Aucune authentification requise**

**Réponse 200 OK :**
```json
{
  "publishableKey": "pk_test_51...",
  "successUrl": "https://app.velvena.fr/billing/success",
  "cancelUrl": "https://app.velvena.fr/billing/cancel"
}
```

**Usage :** Initialiser Stripe.js
```javascript
const stripe = Stripe(config.publishableKey);
```

---

## 9. Gestion des Erreurs

### 9.1 Essai Expiré

**Requête :**
```http
GET /dresses
Authorization: Bearer {jwt_token}
```

**Réponse 402 Payment Required :**
```json
{
  "success": false,
  "error": "Trial period expired",
  "code": "TRIAL_EXPIRED",
  "message": "Your trial period has expired. Please subscribe to continue using the service.",
  "upgrade_url": "/settings/billing"
}
```

**Action Frontend :**
1. Détecter le status code `402`
2. Afficher une modal :
   ```
   ┌──────────────────────────────────────────┐
   │  Votre période d'essai a expiré         │
   │                                          │
   │  Pour continuer à utiliser Velvena,     │
   │  choisissez un abonnement.              │
   │                                          │
   │  [Voir les plans]                       │
   └──────────────────────────────────────────┘
   ```
3. Rediriger vers `/settings/billing`

### 9.2 Quota Dépassé

**Requête :**
```http
POST /dresses
Authorization: Bearer {jwt_token}
```

**Réponse 403 Forbidden :**
```json
{
  "success": false,
  "error": "Quota exceeded",
  "code": "QUOTA_EXCEEDED",
  "message": "You have reached your plan limit for dresses (500/500). Please upgrade your plan.",
  "quota": "dresses",
  "limit": 500,
  "current": 500,
  "upgrade_url": "/settings/billing"
}
```

**Action Frontend :**
Afficher une modal avec suggestion d'upgrade

### 9.3 Feature Non Disponible

**Requête :**
```http
GET /exports/all-data
Authorization: Bearer {jwt_token}
```

**Réponse 403 Forbidden :**
```json
{
  "success": false,
  "error": "Feature not available",
  "code": "FEATURE_UNAVAILABLE",
  "message": "Data export is only available on Pro and Enterprise plans. Please upgrade your plan.",
  "feature": "export_data",
  "upgrade_url": "/settings/billing"
}
```

---

## 10. Exemples d'Intégration Frontend

### 10.1 Afficher le Statut d'Abonnement (React)

```typescript
import { useEffect, useState } from 'react';
import axios from 'axios';

interface SubscriptionStatus {
  plan_name: string;
  subscription_status: string;
  is_trial: boolean;
  days_remaining: number | null;
  trial_ends_at: string | null;
}

export function SubscriptionBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    axios.get('/billing/status', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStatus(res.data))
    .catch(console.error);
  }, []);

  if (!status) return null;

  if (status.is_trial && status.days_remaining !== null) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-700">
          ⏰ Essai gratuit - Plus que {status.days_remaining} jour{status.days_remaining > 1 ? 's' : ''}
          <a href="/settings/billing" className="ml-2 underline">
            Choisir un abonnement
          </a>
        </p>
      </div>
    );
  }

  if (status.subscription_status === 'active') {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <p className="text-green-700">
          ✓ Plan {status.plan_name} actif
        </p>
      </div>
    );
  }

  return null;
}
```

### 10.2 Souscrire à un Plan (React)

```typescript
async function subscribeToPlan(planCode: string, interval: 'month' | 'year') {
  try {
    const response = await axios.post('/billing/create-checkout-session', {
      plan_code: planCode,
      billing_interval: interval,
      success_url: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/pricing`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Rediriger vers Stripe Checkout
    window.location.href = response.data.url;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    alert('Erreur lors de la création de la session de paiement');
  }
}

// Usage
<button onClick={() => subscribeToPlan('starter', 'month')}>
  S'abonner à Starter (19€/mois)
</button>
```

### 10.3 Intercepter les Erreurs 402 (Axios)

```typescript
// Intercepteur global pour détecter les essais expirés
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 402) {
      const data = error.response.data;

      if (data.code === 'TRIAL_EXPIRED') {
        // Afficher modal d'upgrade
        showUpgradeModal({
          title: 'Période d\'essai expirée',
          message: data.message,
          upgradeUrl: '/settings/billing'
        });
      }
    }

    return Promise.reject(error);
  }
);
```

### 10.4 Vérifier les Quotas Avant Création

```typescript
async function createDress(dressData: any) {
  // 1. Vérifier les quotas
  const quotas = await axios.get('/billing/quotas', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (quotas.data.dresses.exceeded) {
    // Afficher modal d'upgrade
    showUpgradeModal({
      title: 'Limite atteinte',
      message: `Vous avez atteint la limite de ${quotas.data.dresses.limit} robes. Passez au plan Pro pour ajouter plus de robes.`,
      upgradeUrl: '/settings/billing'
    });
    return;
  }

  // 2. Créer la robe
  await axios.post('/dresses', dressData, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

---

## 11. Checklist d'Intégration

### Pages à Créer

- [ ] `/pricing` - Liste des plans avec boutons "S'abonner"
- [ ] `/settings/billing` - Gestion de l'abonnement
  - [ ] Afficher le plan actuel
  - [ ] Bouton "Changer de plan"
  - [ ] Bouton "Gérer l'abonnement" (portail Stripe)
  - [ ] Liste des factures
  - [ ] Affichage des quotas (barres de progression)
- [ ] `/billing/success` - Confirmation après paiement
- [ ] `/billing/cancel` - Page si l'utilisateur annule le checkout

### Composants à Créer

- [ ] `<SubscriptionBanner />` - Bandeau essai/abonnement dans le header
- [ ] `<PlanCard />` - Carte de plan sur la page pricing
- [ ] `<QuotaProgressBar />` - Barre de progression pour chaque quota
- [ ] `<UpgradeModal />` - Modal pour suggérer l'upgrade
- [ ] `<TrialExpiredModal />` - Modal quand l'essai expire
- [ ] `<InvoiceList />` - Liste des factures

### Logique à Implémenter

- [ ] Intercepteur Axios pour détecter les 402 et afficher modal d'upgrade
- [ ] Vérification des quotas avant création (robes, clients, contrats)
- [ ] Masquer/afficher les features selon le plan
- [ ] Afficher badges "Pro" ou "Enterprise" sur les features verrouillées
- [ ] Timer countdown pour la fin de l'essai (si `is_trial: true`)

---

## 12. Variables d'Environnement Frontend

```bash
# .env.local
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...  # Récupéré via GET /billing/config
```

```bash
# .env.production
VITE_API_URL=https://api.velvena.fr
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51...
```

---

## 13. Support & Questions

Pour toute question sur l'intégration :
- **Email** : contact@velvena.fr
- **Documentation Stripe** : https://stripe.com/docs/billing/subscriptions/overview
- **Swagger API** : https://api.velvena.fr/api-docs

---

**Document créé le** : 22 décembre 2025
**Dernière mise à jour** : 22 décembre 2025
**Version** : 1.0.0
