# ✅ Vérification Automatique des Quotas - Implémentée

## 📋 Résumé

La vérification automatique des quotas a été implémentée sur toutes les routes de création de ressources. Le système vérifie automatiquement les limites avant d'autoriser la création d'utilisateurs, robes, clients et contrats.

---

## 🎯 Routes Protégées

### 1. Création d'utilisateurs ✅

**Fichier** : `src/routes/userRoutes/auth.ts`

```typescript
// AVANT
router.post("/register", authMiddleware, register);

// APRÈS
router.post("/register",
  authMiddleware,
  requireQuota("users"),  // ✅ Vérifie quota users
  register
);
```

**Comportement** :
- Vérifie le quota `users` avant de créer un utilisateur
- Si quota dépassé → retourne erreur 402 avec message d'upgrade
- Si quota >= 80% → ajoute un warning dans les headers

---

### 2. Création de robes ✅

**Fichier** : `src/routes/dressRoutes/dresses.ts`

```typescript
// AVANT
router.post("/", authMiddleware, upload.array("images", 5), createDress);

// APRÈS
router.post("/",
  authMiddleware,
  requireQuota("dresses"),  // ✅ Vérifie quota robes
  upload.array("images", 5),
  createDress
);
```

**Comportement** :
- Vérifie le quota `dresses` avant de créer une robe
- Si quota dépassé → erreur 402

---

### 3. Création de clients ✅

**Fichier** : `src/routes/customers.ts`

```typescript
// AVANT
router.post("/", authMiddleware, createCustomer);

// APRÈS
router.post("/",
  authMiddleware,
  requireQuota("customers"),  // ✅ Vérifie quota clients
  createCustomer
);
```

**Comportement** :
- Vérifie le quota `customers` avant de créer un client
- Si quota dépassé → erreur 402

---

### 4. Création de contrats ✅

**Fichier** : `src/routes/contractRoutes/contractRoutes.ts`

```typescript
// AVANT
router.post("/", createContract);

// APRÈS
router.post("/",
  requireQuota("contracts"),  // ✅ Vérifie quota contrats/mois
  createContract
);
```

**Comportement** :
- Vérifie le quota `contracts` (par mois) avant de créer un contrat
- Si quota dépassé → erreur 402

---

## 🚀 Nouvelles Routes Billing

**Fichier créé** : `src/routes/billing.ts`

### Endpoints disponibles :

#### 1. `GET /billing/status`
Récupère le statut de souscription de l'organisation

**Réponse** :
```json
{
  "status": "trial",
  "plan": { "name": "Free", "code": "free" },
  "is_trial": true,
  "is_trial_expired": false,
  "days_remaining": 12,
  "trial_ends_at": "2025-12-21T00:00:00.000Z"
}
```

---

#### 2. `GET /billing/plans` (public)
Liste tous les plans de souscription disponibles

**Réponse** :
```json
[
  {
    "id": "uuid",
    "name": "Free",
    "code": "free",
    "description": "Plan gratuit pour démarrer",
    "price_monthly": 0,
    "price_yearly": 0,
    "limits": { "users": 3, "dresses": 50, "customers": 200 },
    "features": { "electronic_signature": false, "advanced_analytics": false },
    "is_popular": false
  },
  {
    "id": "uuid",
    "name": "Pro",
    "code": "pro",
    "price_monthly": 49,
    "price_yearly": 490,
    "limits": { "users": 20, "dresses": 9999999, "customers": 9999999 },
    "features": { "electronic_signature": true, "advanced_analytics": true },
    "is_popular": true
  }
]
```

---

#### 3. `GET /billing/quotas`
Récupère l'état des quotas de l'organisation

**Réponse** :
```json
{
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
  },
  "contracts": {
    "allowed": true,
    "current_usage": 8,
    "limit": 10,
    "remaining": 2,
    "percentage_used": 80
  }
}
```

---

#### 4. `GET /billing/features`
Récupère l'état des features de l'organisation

**Réponse** :
```json
{
  "electronic_signature": {
    "allowed": false,
    "feature_name": "electronic_signature",
    "upgrade_required": "pro"
  },
  "advanced_analytics": {
    "allowed": false,
    "feature_name": "advanced_analytics",
    "upgrade_required": "pro"
  },
  "api_access": {
    "allowed": false,
    "feature_name": "api_access",
    "upgrade_required": "pro"
  }
}
```

---

#### 5. `GET /billing/dashboard`
Récupère quotas + features + subscription (tout en un)

**Réponse** :
```json
{
  "quotas": { /* ... */ },
  "features": { /* ... */ },
  "subscription": { /* ... */ }
}
```

**Usage** : Endpoint idéal pour le dashboard frontend

---

#### 6. `POST /billing/upgrade`
Change le plan de souscription (après paiement)

**Requête** :
```json
{
  "plan_code": "pro"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Plan successfully upgraded to Pro",
  "plan": {
    "code": "pro",
    "name": "Pro",
    "price_monthly": 49
  }
}
```

---

## 📊 Réponses d'Erreur Standardisées

### Quota dépassé (402 Payment Required)

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

### Feature non disponible (402 Payment Required)

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

---

## 🎨 Intégration Frontend

### 1. Vérifier le quota avant d'afficher le bouton

```typescript
// Récupérer les quotas
const response = await fetch('/api/billing/quotas', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const quotas = await response.json();

// Désactiver le bouton si quota dépassé
<button
  disabled={!quotas.users.allowed}
  onClick={createUser}
>
  Créer un utilisateur
  {!quotas.users.allowed && (
    <span className="quota-badge">Limite atteinte</span>
  )}
</button>
```

### 2. Afficher une alerte si proche de la limite

```tsx
{quotas.dresses.percentage_used >= 80 && (
  <Alert variant="warning">
    ⚠️ Vous avez utilisé {quotas.dresses.percentage_used}% de votre quota de robes.
    {quotas.dresses.remaining} robes restantes.
    <a href="/settings/billing">Upgrader</a>
  </Alert>
)}
```

### 3. Gérer l'erreur 402 côté frontend

```typescript
try {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  if (response.status === 402) {
    const error = await response.json();

    // Afficher modal d'upgrade
    showUpgradeModal({
      message: error.message,
      currentUsage: error.details.current_usage,
      limit: error.details.limit,
      upgradeUrl: error.upgrade_url
    });

    return;
  }

  const user = await response.json();
  // Succès...
} catch (err) {
  console.error(err);
}
```

---

## 🧪 Tests

### Test 1 : Créer un utilisateur avec quota OK

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "roleName": "USER"
  }'
```

**Résultat attendu** : 201 Created (si quota OK)

---

### Test 2 : Créer un utilisateur avec quota dépassé

```bash
# Même requête qu'au-dessus
```

**Résultat attendu** : 402 Payment Required avec message d'erreur

```json
{
  "error": "Quota limit reached",
  "code": "QUOTA_EXCEEDED",
  "message": "You have reached your users limit (10). Please upgrade your plan."
}
```

---

### Test 3 : Récupérer les quotas

```bash
curl -X GET http://localhost:3000/api/billing/quotas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** : 200 OK avec quotas

---

### Test 4 : Lister les plans disponibles (public)

```bash
curl -X GET http://localhost:3000/api/billing/plans
```

**Résultat attendu** : 200 OK avec liste des plans

---

## 📁 Fichiers Modifiés

### Routes protégées
- ✅ `src/routes/userRoutes/auth.ts` - Ajout `requireQuota("users")`
- ✅ `src/routes/dressRoutes/dresses.ts` - Ajout `requireQuota("dresses")`
- ✅ `src/routes/customers.ts` - Ajout `requireQuota("customers")`
- ✅ `src/routes/contractRoutes/contractRoutes.ts` - Ajout `requireQuota("contracts")`

### Nouvelles routes
- ✅ `src/routes/billing.ts` - 6 nouveaux endpoints

### Configuration
- ✅ `src/server.ts` - Enregistrement de `billingRoutes`

---

## 📚 Documentation Créée

1. **`SUBSCRIPTION_GUIDE.md`** - Guide complet du système de souscription
2. **`INTEGRATION_EXAMPLE.md`** - Exemples d'intégration pratiques
3. **`prisma/seed-subscriptions.ts`** - Script de création des plans
4. **`test-initialize-org.sh`** - Script de test d'initialisation
5. **`VERIFICATION_AUTOMATIQUE_IMPLEMENTED.md`** (ce fichier)

---

## ✅ Prochaines Étapes

### 1. Initialiser les plans de souscription

```bash
npx tsx prisma/seed-subscriptions.ts
```

Cela va créer les 4 plans : Free, Basic, Pro, Enterprise

---

### 2. Tester les endpoints

```bash
# Lister les plans (public)
curl http://localhost:3000/api/billing/plans

# Récupérer les quotas (auth required)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/billing/quotas

# Dashboard complet
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/billing/dashboard
```

---

### 3. Intégration Frontend

- [ ] Créer page `/pricing` avec liste des plans
- [ ] Créer composant `QuotaDisplay` pour afficher les quotas
- [ ] Créer composant `FeatureButton` pour features premium
- [ ] Gérer erreurs 402 avec modal d'upgrade
- [ ] Ajouter alertes si trial expire bientôt
- [ ] Ajouter alertes si quota >= 80%

---

### 4. Intégration Paiement (optionnel)

Pour intégrer Stripe :

1. Installer Stripe SDK
```bash
npm install stripe @stripe/stripe-js
```

2. Créer endpoint `/billing/create-checkout-session`
3. Implémenter webhook Stripe `/webhooks/stripe`
4. Appeler automatiquement `changeSubscriptionPlan()` après paiement réussi

---

## 🎉 Résultat Final

### Avant
- ❌ Aucune limite sur les créations
- ❌ Pas de différenciation entre plans
- ❌ Pas de suivi des quotas

### Après
- ✅ Vérification automatique sur toutes les créations
- ✅ Limites respectées selon le plan
- ✅ Messages d'erreur clairs avec call-to-action
- ✅ Dashboard complet pour suivre l'usage
- ✅ API complète pour le frontend

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifier que les plans sont créés : `SELECT * FROM subscription_plans;`
2. Vérifier que l'organisation a un plan : `SELECT subscription_plan_id FROM organizations WHERE id = 'YOUR_ORG_ID';`
3. Tester les middlewares avec curl
4. Consulter les logs avec `logger.info()` et `logger.error()`

---

**✅ La vérification automatique est maintenant active sur toutes les routes !**
