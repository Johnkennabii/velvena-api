# ✅ Validation Backend - Intégration Stripe

Documentation de validation pour l'équipe frontend confirmant que tous les endpoints et configurations Stripe sont en place.

---

## 🎯 Statut global : ✅ PRÊT POUR LA PRODUCTION

---

## 1️⃣ Routes API - ✅ CONFIGURÉES

### Base URL
```
http://127.0.0.1:3000/api/billing
```

### Routes disponibles

#### ✅ GET `/api/billing/config`
**Description :** Retourne la configuration publique Stripe

**Authentification :** ❌ Non requise (publique)

**Réponse :**
```json
{
  "publishableKey": "pk_test_51ScqFKRJ7PlLrfUPNaSVKlC1rbZ6clN4yJvGDQAjDZfaDqQFTrMTgJCz1Xr41IejhX2YBnQjrUIqS258tkAokd1L00OaHU8w3O",
  "successUrl": "http://127.0.0.1:3000/subscription/success",
  "cancelUrl": "http://127.0.0.1:3000/pricing"
}
```

**Test cURL :**
```bash
curl http://127.0.0.1:3000/api/billing/config
```

---

#### ✅ POST `/api/billing/create-checkout-session`
**Description :** Crée une session Stripe Checkout pour un abonnement

**Authentification :** ✅ Requise (Bearer token)

**Headers requis :**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body :**
```json
{
  "plan_code": "pro",
  "billing_interval": "month",
  "success_url": "http://yourapp.com/success",  // Optionnel
  "cancel_url": "http://yourapp.com/cancel"      // Optionnel
}
```

**Valeurs acceptées :**
- `plan_code`: `"basic"`, `"pro"`, `"enterprise"`
- `billing_interval`: `"month"` ou `"year"`

**Réponse succès (200) :**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "publishableKey": "pk_test_..."
}
```

**Réponse erreur (400) :**
```json
{
  "error": "plan_code is required"
}
```

**Test cURL :**
```bash
curl -X POST http://127.0.0.1:3000/api/billing/create-checkout-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_code": "pro",
    "billing_interval": "month"
  }'
```

---

#### ✅ POST `/api/billing/create-portal-session`
**Description :** Crée une session Stripe Customer Portal

**Authentification :** ✅ Requise (Bearer token)

**Headers requis :**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body :**
```json
{
  "return_url": "http://yourapp.com/settings"  // Optionnel
}
```

**Réponse succès (200) :**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Réponse erreur (404) :**
```json
{
  "error": "Organization does not have a Stripe customer ID"
}
```

**Test cURL :**
```bash
curl -X POST http://127.0.0.1:3000/api/billing/create-portal-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "return_url": "http://127.0.0.1:3000/settings"
  }'
```

---

#### ✅ GET `/api/billing/status`
**Description :** Récupère le statut d'abonnement de l'organisation

**Authentification :** ✅ Requise (Bearer token)

**Headers requis :**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Réponse succès (200) :**
```json
{
  "status": "active",
  "plan": {
    "id": "uuid",
    "name": "Pro",
    "code": "pro",
    "price_monthly": 49,
    "price_yearly": 490,
    "currency": "EUR",
    "limits": {
      "users": 5,
      "dresses": 350,
      "customers": 700
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "electronic_signature": true
    }
  },
  "is_trial": false,
  "is_trial_expired": false,
  "is_subscription_expired": false,
  "is_active": true,
  "trial_ends_at": null,
  "subscription_ends_at": null,
  "days_remaining": null
}
```

**Test cURL :**
```bash
curl http://127.0.0.1:3000/api/billing/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### ✅ GET `/api/billing/plans`
**Description :** Liste tous les plans d'abonnement disponibles

**Authentification :** ❌ Non requise (publique)

**Réponse succès (200) :**
```json
[
  {
    "id": "uuid",
    "name": "Free",
    "code": "free",
    "description": "Plan gratuit pour démarrer",
    "price_monthly": 0,
    "price_yearly": 0,
    "currency": "EUR",
    "trial_days": 14,
    "limits": {
      "users": 1,
      "dresses": 5,
      "customers": 10
    },
    "features": {
      "planning": false,
      "dashboard": false,
      "contract_generation": true
    },
    "is_popular": false,
    "stripe_product_id": null,
    "stripe_price_id_monthly": null,
    "stripe_price_id_yearly": null
  },
  {
    "id": "uuid",
    "name": "Basic",
    "code": "basic",
    "description": "Pour les petites boutiques",
    "price_monthly": 19,
    "price_yearly": 190,
    "currency": "EUR",
    "trial_days": 14,
    "limits": {
      "users": 3,
      "dresses": 120,
      "customers": 1000
    },
    "features": {
      "planning": false,
      "dashboard": false,
      "contract_generation": true
    },
    "is_popular": false,
    "stripe_product_id": "prod_XXX",
    "stripe_price_id_monthly": "price_XXX",
    "stripe_price_id_yearly": "price_XXX"
  },
  {
    "id": "uuid",
    "name": "Pro",
    "code": "pro",
    "description": "Pour les boutiques professionnelles",
    "price_monthly": 49,
    "price_yearly": 490,
    "currency": "EUR",
    "trial_days": 14,
    "limits": {
      "users": 5,
      "dresses": 350,
      "customers": 700
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "electronic_signature": true
    },
    "is_popular": true,
    "stripe_product_id": "prod_XXX",
    "stripe_price_id_monthly": "price_XXX",
    "stripe_price_id_yearly": "price_XXX"
  },
  {
    "id": "uuid",
    "name": "Enterprise",
    "code": "enterprise",
    "description": "Pour les grandes organisations",
    "price_monthly": 149,
    "price_yearly": 1490,
    "currency": "EUR",
    "trial_days": 30,
    "limits": {
      "users": 15,
      "dresses": 1000,
      "customers": 3000
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "export_data": true,
      "prospect_management": true
    },
    "is_popular": false,
    "stripe_product_id": "prod_XXX",
    "stripe_price_id_monthly": "price_XXX",
    "stripe_price_id_yearly": "price_XXX"
  }
]
```

**Test cURL :**
```bash
curl http://127.0.0.1:3000/api/billing/plans
```

---

#### ✅ POST `/api/billing/cancel-subscription`
**Description :** Annule l'abonnement actuel

**Authentification :** ✅ Requise (Bearer token)

**Body :**
```json
{
  "immediately": false  // true = annulation immédiate, false = fin de période
}
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end"
}
```

---

## 2️⃣ Webhooks Stripe - ✅ CONFIGURÉS

### Endpoint webhook
```
POST http://127.0.0.1:3000/webhooks/stripe
```

⚠️ **IMPORTANT :** Cet endpoint utilise `express.raw()` pour la vérification de signature. Ne pas parser le body en JSON.

### Événements gérés

| Événement | Action | Statut |
|-----------|--------|--------|
| `checkout.session.completed` | Active l'abonnement après paiement | ✅ |
| `customer.subscription.created` | Synchronise le nouvel abonnement | ✅ |
| `customer.subscription.updated` | Met à jour l'abonnement (changement de plan, renouvellement) | ✅ |
| `customer.subscription.deleted` | Marque l'abonnement comme annulé | ✅ |
| `customer.subscription.trial_will_end` | Notification 3 jours avant fin d'essai | ✅ |
| `invoice.paid` | Confirme le paiement d'une facture | ✅ |
| `invoice.payment_failed` | Gère les échecs de paiement | ✅ |
| `invoice.payment_action_required` | Action requise (3D Secure) | ✅ |

### Configuration dans Stripe Dashboard

1. **Aller sur** : [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. **Cliquer sur** : "Add endpoint"
3. **URL** : `https://api.velvena.fr/webhooks/stripe` (en production)
4. **Événements à sélectionner** :
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - customer.subscription.trial_will_end
   - invoice.paid
   - invoice.payment_failed
   - invoice.payment_action_required

5. **Copier le signing secret** et le mettre dans `STRIPE_WEBHOOK_SECRET`

### Test du webhook en local

Utiliser Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Forward les webhooks
stripe listen --forward-to http://127.0.0.1:3000/webhooks/stripe
```

Le CLI affichera le webhook secret à utiliser dans `.env`.

---

## 3️⃣ Variables d'environnement - ✅ CONFIGURÉES

### Fichier `.env`

```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=http://127.0.0.1:3000/subscription/success
STRIPE_CANCEL_URL=http://127.0.0.1:3000/pricing
```

✅ **Statut** : Toutes les variables sont configurées avec les clés de test Stripe.

⚠️ **Pour la production** : Remplacer par les clés LIVE (préfixées par `sk_live_` et `pk_live_`).

---

## 4️⃣ Base de données - ✅ PRÊTE

### Migrations appliquées

```bash
# Vérifier que les migrations sont appliquées
npx prisma migrate deploy
```

Les tables ont été mises à jour avec :
- `Organization.stripe_customer_id`
- `Organization.stripe_subscription_id`
- `SubscriptionPlan.stripe_product_id`
- `SubscriptionPlan.stripe_price_id_monthly`
- `SubscriptionPlan.stripe_price_id_yearly`

### Plans synchronisés avec Stripe

```bash
# Synchroniser les plans vers Stripe
npm run stripe:sync
```

✅ **Statut** : Les plans Basic, Pro et Enterprise sont créés dans Stripe avec leurs prix.

---

## 5️⃣ CORS - ✅ CONFIGURÉ

Le serveur accepte les requêtes depuis :
- `http://127.0.0.1:*`
- `http://localhost:*`
- `https://velvena.fr`
- `https://app.velvena.fr`

Si votre frontend tourne sur un autre port/domaine, il faut l'ajouter dans `src/server.ts`.

---

## 6️⃣ Tests de validation

### Test 1 : Récupérer la config Stripe ✅

```bash
curl http://127.0.0.1:3000/api/billing/config
```

**Résultat attendu :**
```json
{
  "publishableKey": "pk_test_...",
  "successUrl": "...",
  "cancelUrl": "..."
}
```

---

### Test 2 : Lister les plans ✅

```bash
curl http://127.0.0.1:3000/api/billing/plans
```

**Résultat attendu :** Array de 4 plans (Free, Basic, Pro, Enterprise)

---

### Test 3 : Créer une session Checkout ✅

```bash
# Remplacer YOUR_TOKEN par un vrai JWT
curl -X POST http://127.0.0.1:3000/api/billing/create-checkout-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_code": "pro",
    "billing_interval": "month"
  }'
```

**Résultat attendu :**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "publishableKey": "pk_test_..."
}
```

---

### Test 4 : Vérifier le statut d'abonnement ✅

```bash
curl http://127.0.0.1:3000/api/billing/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu :**
```json
{
  "status": "trial",
  "plan": {...},
  "is_active": true
}
```

---

## 7️⃣ Flux complet de paiement

### Scénario de test end-to-end

1. ✅ **Frontend** : Appeler `/api/billing/create-checkout-session`
2. ✅ **Backend** : Créer une session Stripe et retourner l'URL
3. ✅ **Frontend** : Rediriger vers l'URL Stripe Checkout
4. ✅ **Utilisateur** : Entrer les infos de carte de test : `4242 4242 4242 4242`
5. ✅ **Stripe** : Valider le paiement et envoyer webhook `checkout.session.completed`
6. ✅ **Backend** : Recevoir le webhook, activer l'abonnement en DB
7. ✅ **Stripe** : Rediriger vers `success_url`
8. ✅ **Frontend** : Afficher la page de succès
9. ✅ **Frontend** : Appeler `/api/billing/status` pour confirmer l'abonnement actif

---

## 8️⃣ Cartes de test Stripe

| Carte | Comportement |
|-------|--------------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0025 0000 3155` | 🔐 3D Secure requis |
| `4000 0000 0000 9995` | 💰 Fonds insuffisants |

**Date** : N'importe quelle date future
**CVC** : N'importe quel 3 chiffres
**Code postal** : N'importe quel code

---

## 9️⃣ Gestion des erreurs

### Erreurs possibles côté frontend

| Code | Message | Solution |
|------|---------|----------|
| 400 | `plan_code is required` | Vérifier que `plan_code` est envoyé |
| 400 | `billing_interval is required` | Envoyer `"month"` ou `"year"` |
| 401 | `Organization context required` | Vérifier le token JWT |
| 404 | `Subscription plan not found` | Vérifier que le `plan_code` est valide |
| 500 | `Stripe price ID not found` | Les plans n'ont pas été synchronisés avec Stripe |

### Debug

Pour voir les logs en temps réel :

```bash
# Terminal 1 : Lancer le serveur
npm run dev

# Terminal 2 : Voir les logs
tail -f logs/app.log
```

---

## 🔟 Checklist finale pour le frontend

- [x] Toutes les routes API sont disponibles et testées
- [x] Les webhooks Stripe sont configurés et fonctionnels
- [x] Les variables d'environnement Stripe sont définies
- [x] Les plans sont synchronisés avec Stripe
- [x] La base de données contient les champs Stripe
- [x] Le CORS autorise le frontend
- [x] Les tests de paiement avec cartes de test fonctionnent
- [x] La documentation est complète et à jour

---

## ✅ VALIDATION FINALE

**Statut global : PRÊT POUR L'INTÉGRATION FRONTEND** 🎉

Tous les endpoints sont opérationnels, les webhooks sont configurés, et l'intégration Stripe est complète côté backend.

Le frontend peut maintenant :
1. ✅ Récupérer la liste des plans
2. ✅ Créer des sessions de paiement
3. ✅ Rediriger vers Stripe Checkout
4. ✅ Gérer les retours de paiement (succès/annulation)
5. ✅ Afficher le statut d'abonnement
6. ✅ Ouvrir le Customer Portal pour gérer l'abonnement

---

## 📞 Support

En cas de problème :
1. Vérifier les logs : `tail -f logs/app.log`
2. Vérifier les webhooks Stripe : [Dashboard Stripe > Webhooks](https://dashboard.stripe.com/test/webhooks)
3. Tester avec Stripe CLI : `stripe listen --forward-to http://127.0.0.1:3000/webhooks/stripe`
4. Consulter la documentation : `STRIPE_INTEGRATION.md` et `STRIPE_FRONTEND_INTEGRATION.md`

---

**Date de validation** : 10 décembre 2025
**Version API** : 1.0.0
**Environment** : Test (Stripe Test Mode)
