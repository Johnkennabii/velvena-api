# 🔷 Stripe Integration Guide

Guide complet pour l'intégration de Stripe avec Velvena pour la gestion des abonnements, paiements récurrents, et périodes d'essai.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration](#configuration)
3. [Architecture](#architecture)
4. [Flux de paiement](#flux-de-paiement)
5. [API Endpoints](#api-endpoints)
6. [Webhooks](#webhooks)
7. [Synchronisation des plans](#synchronisation-des-plans)
8. [Tests](#tests)
9. [Déploiement](#déploiement)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

L'intégration Stripe gère :
- ✅ Abonnements mensuels et annuels
- ✅ Périodes d'essai (14-30 jours selon le plan)
- ✅ Facturation récurrente automatique
- ✅ Customer Portal (gestion de carte, factures, annulation)
- ✅ Webhooks temps réel
- ✅ Synchronisation bidirectionnelle (Stripe ↔ Base de données)

---

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...              # Clé secrète Stripe (test ou live)
STRIPE_PUBLISHABLE_KEY=pk_test_...          # Clé publique Stripe
STRIPE_WEBHOOK_SECRET=whsec_...             # Secret webhook Stripe
STRIPE_SUCCESS_URL=https://yourdomain.com/subscription/success
STRIPE_CANCEL_URL=https://yourdomain.com/subscription/cancel
```

### 2. Obtenir les clés Stripe

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans **Developers > API keys**
3. Copiez la **Secret key** et la **Publishable key**
4. Pour les tests, utilisez les clés de test (préfixées par `sk_test_` et `pk_test_`)

### 3. Configurer le webhook

1. Allez dans **Developers > Webhooks**
2. Cliquez sur **Add endpoint**
3. URL du webhook : `https://yourdomain.com/webhooks/stripe`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
5. Copiez le **Signing secret** (commence par `whsec_`)

### 4. Migrations de base de données

Appliquez les migrations Prisma pour ajouter les champs Stripe :

```bash
npx prisma migrate deploy
```

Ou en développement :

```bash
npx prisma migrate dev
```

---

## 🏗️ Architecture

### Composants

```
src/
├── lib/
│   └── stripe.ts                      # Client Stripe configuré
├── services/
│   ├── stripeService.ts               # Logique métier Stripe
│   └── webhookService.ts              # Traitement des webhooks
├── routes/
│   ├── stripe-webhooks.ts             # Endpoint webhooks
│   └── billing.ts                     # Routes billing + Stripe
└── types/
    └── stripe.ts                      # Types TypeScript
```

### Schéma de base de données

**Table `Organization`** - Nouveaux champs :
- `stripe_customer_id` : ID du client Stripe
- `stripe_subscription_id` : ID de l'abonnement actif

**Table `SubscriptionPlan`** - Nouveaux champs :
- `stripe_product_id` : ID du produit Stripe
- `stripe_price_id_monthly` : ID du prix mensuel
- `stripe_price_id_yearly` : ID du prix annuel

---

## 💳 Flux de paiement

### 1. Créer une session de paiement

```
Frontend → POST /api/billing/create-checkout-session
         ↓
    Créer session Checkout Stripe
         ↓
    Rediriger vers Stripe Checkout
         ↓
    Client effectue le paiement
         ↓
    Webhook: checkout.session.completed
         ↓
    Mise à jour de l'organisation
         ↓
    Redirection vers success_url
```

### 2. Gestion de l'abonnement

Le client peut gérer son abonnement via le Customer Portal :

```
Frontend → POST /api/billing/create-portal-session
         ↓
    Créer session Customer Portal
         ↓
    Rediriger vers Stripe Portal
         ↓
    Client modifie sa carte / consulte factures / annule
         ↓
    Webhook: customer.subscription.updated
         ↓
    Mise à jour automatique en base
```

---

## 🔌 API Endpoints

### Billing Routes (`/api/billing`)

#### GET `/api/billing/plans`
Liste tous les plans d'abonnement disponibles.

**Réponse :**
```json
[
  {
    "id": "uuid",
    "name": "Pro",
    "code": "pro",
    "description": "Pour les boutiques professionnelles",
    "price_monthly": 49,
    "price_yearly": 490,
    "currency": "EUR",
    "trial_days": 14,
    "limits": {...},
    "features": {...},
    "stripe_product_id": "prod_...",
    "stripe_price_id_monthly": "price_...",
    "stripe_price_id_yearly": "price_..."
  }
]
```

#### POST `/api/billing/create-checkout-session`
Créer une session Stripe Checkout pour souscrire à un plan.

**Requête :**
```json
{
  "plan_code": "pro",
  "billing_interval": "month",  // ou "year"
  "success_url": "https://app.velvena.fr/success",  // optionnel
  "cancel_url": "https://app.velvena.fr/cancel"     // optionnel
}
```

**Réponse :**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "publishableKey": "pk_test_..."
}
```

**Utilisation frontend :**
```javascript
const response = await fetch('/api/billing/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_code: 'pro',
    billing_interval: 'month'
  })
});

const { url } = await response.json();
window.location.href = url;  // Rediriger vers Stripe
```

#### POST `/api/billing/create-portal-session`
Créer une session Customer Portal pour gérer l'abonnement.

**Requête :**
```json
{
  "return_url": "https://app.velvena.fr/settings"  // optionnel
}
```

**Réponse :**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

#### POST `/api/billing/cancel-subscription`
Annuler l'abonnement actuel.

**Requête :**
```json
{
  "immediately": false  // true = annulation immédiate, false = fin de période
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end"
}
```

#### GET `/api/billing/status`
Récupérer le statut d'abonnement de l'organisation.

**Réponse :**
```json
{
  "status": "active",
  "plan": {...},
  "is_trial": false,
  "is_trial_expired": false,
  "is_subscription_expired": false,
  "is_active": true,
  "trial_ends_at": null,
  "subscription_ends_at": null,
  "days_remaining": null
}
```

#### GET `/api/billing/config`
Récupérer la configuration publique Stripe.

**Réponse :**
```json
{
  "publishableKey": "pk_test_...",
  "successUrl": "https://velvena.fr/subscription/success",
  "cancelUrl": "https://velvena.fr/subscription/cancel"
}
```

---

## 🎣 Webhooks

### Endpoint

**URL :** `POST /webhooks/stripe`

### Événements gérés

| Événement | Description | Action |
|-----------|-------------|--------|
| `checkout.session.completed` | Paiement initial réussi | Activation de l'abonnement |
| `customer.subscription.created` | Nouvel abonnement créé | Synchronisation en base |
| `customer.subscription.updated` | Abonnement modifié | Mise à jour du statut |
| `customer.subscription.deleted` | Abonnement annulé | Changement de statut |
| `customer.subscription.trial_will_end` | Fin de l'essai dans 3 jours | Notification email |
| `invoice.paid` | Facture payée | Confirmation du paiement |
| `invoice.payment_failed` | Échec de paiement | Notification + suspension |
| `invoice.payment_action_required` | Action requise | Notification client |

### Vérification de la signature

Les webhooks sont automatiquement vérifiés avec la signature Stripe pour garantir l'authenticité :

```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  webhookSecret
);
```

### Test des webhooks en local

Utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Forward les webhooks vers votre serveur local
stripe listen --forward-to localhost:3000/webhooks/stripe
```

---

## 🔄 Synchronisation des plans

### Synchroniser tous les plans vers Stripe

```bash
npm run stripe:sync
```

Ce script :
1. Récupère tous les plans (sauf "free")
2. Crée ou met à jour les produits Stripe
3. Crée les prix mensuels et annuels
4. Met à jour la base de données avec les IDs Stripe

### Synchroniser un plan individuellement

```typescript
import { syncProductToStripe } from './src/services/stripeService.js';

await syncProductToStripe({
  planId: 'uuid-du-plan',
  name: 'Pro',
  description: 'Plan professionnel',
  priceMonthly: 49,
  priceYearly: 490,
  currency: 'EUR',
  trialDays: 14
});
```

### Important

⚠️ Le plan **"Free"** n'est PAS synchronisé avec Stripe car il est gratuit et géré en interne.

---

## 🧪 Tests

### Cartes de test Stripe

| Carte | Comportement |
|-------|--------------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte refusée |
| `4000 0025 0000 3155` | 3D Secure requis |
| `4000 0000 0000 9995` | Fonds insuffisants |

**Date d'expiration :** N'importe quelle date future
**CVC :** N'importe quel 3 chiffres
**Code postal :** N'importe quel code

### Tester les webhooks

1. Utiliser Stripe CLI (recommandé) :
```bash
stripe trigger customer.subscription.created
```

2. Utiliser le Dashboard Stripe :
   - Allez dans **Developers > Webhooks**
   - Cliquez sur votre webhook
   - Cliquez sur **Send test webhook**

---

## 🚀 Déploiement

### Checklist pré-déploiement

- [ ] Migrer vers les clés **LIVE** Stripe (remplacer `sk_test_` par `sk_live_`)
- [ ] Configurer le webhook en production
- [ ] Appliquer les migrations de base de données
- [ ] Synchroniser les plans vers Stripe
- [ ] Tester un paiement de bout en bout
- [ ] Configurer les URLs de succès/annulation
- [ ] Vérifier les notifications par email

### Variables d'environnement en production

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://app.velvena.fr/subscription/success
STRIPE_CANCEL_URL=https://app.velvena.fr/pricing
```

### Synchroniser les plans en production

```bash
# En production
npm run stripe:sync
```

---

## 🔧 Troubleshooting

### Erreur : "Webhook signature verification failed"

**Cause :** Le secret webhook est incorrect ou le body n'est pas brut.

**Solution :**
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
2. Vérifiez que la route webhook utilise `express.raw()` (déjà configuré)

### Erreur : "Stripe price ID not found for plan"

**Cause :** Le plan n'a pas été synchronisé avec Stripe.

**Solution :**
```bash
npm run stripe:sync
```

### L'abonnement ne se met pas à jour

**Cause :** Les webhooks ne sont pas reçus.

**Solution :**
1. Vérifiez que l'URL du webhook est correcte dans Stripe
2. Vérifiez que le serveur est accessible publiquement
3. Regardez les logs de webhook dans Stripe Dashboard

### Le client ne voit pas sa période d'essai

**Cause :** `trial_period_days` n'est pas défini correctement.

**Solution :**
1. Vérifiez le champ `trial_days` dans `SubscriptionPlan`
2. Vérifiez que le prix Stripe a `trial_period_days` configuré

### Erreur : "Customer not found"

**Cause :** L'organisation n'a pas de `stripe_customer_id`.

**Solution :**
Le customer Stripe est créé automatiquement lors du premier checkout. Si problème persiste, vérifiez que le webhook `checkout.session.completed` a bien été traité.

---

## 📞 Support

### Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Dashboard Stripe](https://dashboard.stripe.com)
- [Status Stripe](https://status.stripe.com)

### Logs

Les logs Stripe sont disponibles dans :
- Logs applicatifs : Pino logger
- Dashboard Stripe : **Developers > Logs**
- Webhooks : **Developers > Webhooks > [Votre webhook] > Logs**

---

## ✅ Checklist finale

- [x] Variables d'environnement configurées
- [x] Migrations de base de données appliquées
- [x] Plans synchronisés vers Stripe
- [x] Webhook configuré et testé
- [x] Paiement de test réussi
- [x] Customer Portal testé
- [x] Annulation testée
- [x] Notifications par email configurées (TODO)

---

**🎉 Votre intégration Stripe est prête !**

Pour toute question, consultez la documentation Stripe ou les logs de l'application.
