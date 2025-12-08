# 📚 Documentation Swagger - Billing & Subscription

## ✅ Ce qui a été ajouté

### 1. Nouveau tag "Billing & Subscription"

Un nouveau tag a été créé dans Swagger pour regrouper tous les endpoints de facturation et souscription.

```typescript
{
  name: "Billing & Subscription",
  description: "Endpoints for managing subscriptions, quotas, and features"
}
```

---

### 2. Nouveaux Endpoints Documentés

#### 📊 GET /billing/status
Récupère le statut de souscription de l'organisation

**Authentification** : Bearer Token requis

**Réponse 200** :
```json
{
  "status": "trial",
  "plan": {
    "id": "uuid",
    "name": "Free",
    "code": "free"
  },
  "is_trial": true,
  "is_trial_expired": false,
  "is_subscription_expired": false,
  "is_active": true,
  "trial_ends_at": "2025-12-21T00:00:00.000Z",
  "subscription_ends_at": null,
  "days_remaining": 12
}
```

---

#### 💳 GET /billing/plans
Liste tous les plans de souscription disponibles

**Authentification** : Aucune (endpoint public)

**Réponse 200** :
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
    "limits": {
      "users": 20,
      "dresses": 9999999,
      "customers": 9999999,
      "contracts_per_month": 200,
      "storage_gb": 50,
      "api_calls_per_day": 10000,
      "email_notifications": 2000
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
      "white_label": false,
      "sms_notifications": true
    },
    "is_popular": true,
    "sort_order": 3
  }
]
```

---

#### 📈 GET /billing/quotas
Récupère l'état des quotas de l'organisation

**Authentification** : Bearer Token requis

**Réponse 200** :
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

#### ⚡ GET /billing/features
Récupère l'état des features de l'organisation

**Authentification** : Bearer Token requis

**Réponse 200** :
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

#### 🎯 GET /billing/dashboard
Récupère quotas + features + subscription (tout en un)

**Authentification** : Bearer Token requis

**Réponse 200** :
```json
{
  "quotas": {
    "users": { /* QuotaCheck */ },
    "dresses": { /* QuotaCheck */ },
    "customers": { /* QuotaCheck */ },
    "contracts": { /* QuotaCheck */ }
  },
  "features": {
    "electronic_signature": { /* FeatureCheck */ },
    "advanced_analytics": { /* FeatureCheck */ }
  },
  "subscription": {
    "status": "trial",
    "plan": { /* Plan */ },
    "is_trial": true,
    "days_remaining": 12
  }
}
```

---

#### 🚀 POST /billing/upgrade
Change le plan de souscription

**Authentification** : Bearer Token requis

**Body** :
```json
{
  "plan_code": "pro"
}
```

**Réponse 200** :
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

### 3. Nouveaux Schémas (Components)

#### QuotaCheck
Schema pour représenter l'état d'un quota

```yaml
QuotaCheck:
  type: object
  properties:
    allowed: boolean          # true si création autorisée
    current_usage: number     # Usage actuel
    limit: number             # Limite du plan
    remaining: number         # Restant avant limite
    percentage_used: number   # Pourcentage utilisé (0-100)
```

---

#### FeatureCheck
Schema pour représenter l'accès à une feature

```yaml
FeatureCheck:
  type: object
  properties:
    allowed: boolean          # true si feature disponible
    feature_name: string      # Nom de la feature
    upgrade_required: string  # Plan minimum requis (si allowed = false)
```

---

#### QuotaExceededError
Schema pour l'erreur 402 (quota dépassé)

```yaml
QuotaExceededError:
  type: object
  properties:
    success: false
    error: "Quota limit reached"
    code: "QUOTA_EXCEEDED"
    details:
      resource_type: string   # "users", "dresses", etc.
      current_usage: number
      limit: number
      percentage_used: number
    message: string
    upgrade_url: "/settings/billing"
```

---

#### FeatureNotAvailableError
Schema pour l'erreur 402 (feature non disponible)

```yaml
FeatureNotAvailableError:
  type: object
  properties:
    success: false
    error: "Feature not available in your plan"
    code: "FEATURE_NOT_AVAILABLE"
    details:
      feature_name: string
      upgrade_required: string
    message: string
    upgrade_url: "/settings/billing"
```

---

#### SubscriptionPlan
Schema complet d'un plan de souscription

```yaml
SubscriptionPlan:
  type: object
  properties:
    id: uuid
    name: string
    code: string
    description: string
    price_monthly: number
    price_yearly: number
    currency: string
    trial_days: number
    limits: object
    features: object
    is_popular: boolean
    sort_order: number
```

---

### 4. Routes Existantes Mises à Jour

#### POST /auth/register
Ajout de la documentation sur la vérification automatique des quotas

**Modifications** :
- Description mise à jour : "**Automatically checks the users quota** before creation"
- Métadonnées ajoutées :
  - `x-quota-protected: true`
  - `x-quota-resource: "users"`
- Nouvelle réponse **402 Payment Required** ajoutée

**Nouvelle réponse 402** :
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

---

## 📁 Fichiers Créés/Modifiés

### Nouveaux fichiers
1. ✅ `src/docs/paths/billing/index.ts` - Documentation des 6 endpoints billing
2. ✅ `src/docs/components/schemas/billing/index.ts` - 5 nouveaux schémas

### Fichiers modifiés
3. ✅ `src/docs/swagger.ts` - Enregistrement des nouveaux paths et schemas
4. ✅ `src/docs/paths/auth/register.json` - Ajout doc quota + erreur 402

---

## 🎨 Accès à la Documentation

### URL Swagger UI
```
http://localhost:3000/api-docs
```

### Tester les endpoints
1. Ouvrir Swagger UI
2. Cliquer sur "Authorize" (en haut à droite)
3. Entrer votre JWT token : `Bearer YOUR_TOKEN`
4. Tester les endpoints directement depuis Swagger

---

## 📊 Structure dans Swagger UI

```
📁 Billing & Subscription
  ├── GET /billing/status           (Statut de souscription)
  ├── GET /billing/plans            (Liste des plans) 🔓 Public
  ├── GET /billing/quotas           (État des quotas)
  ├── GET /billing/features         (État des features)
  ├── GET /billing/dashboard        (Dashboard complet)
  └── POST /billing/upgrade         (Changer de plan)

📁 Auth
  └── POST /auth/register           ⚠️ Vérifie quota "users"
```

---

## 🔍 Exemples de Réponses

### Quota OK (quota < limite)
```bash
POST /auth/register
Authorization: Bearer YOUR_TOKEN

✅ 201 Created
{
  "id": "uuid",
  "email": "newuser@example.com",
  "role": "USER"
}
```

### Quota Dépassé
```bash
POST /auth/register
Authorization: Bearer YOUR_TOKEN

❌ 402 Payment Required
{
  "error": "Quota limit reached",
  "code": "QUOTA_EXCEEDED",
  "message": "You have reached your users limit (10). Please upgrade your plan.",
  "upgrade_url": "/settings/billing"
}
```

---

## 🎯 Utilisation Frontend

### Récupérer les quotas avant d'afficher un bouton

```typescript
// Appeler l'API
const response = await fetch('/api/billing/quotas', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const quotas = await response.json();

// Désactiver le bouton si quota dépassé
<button disabled={!quotas.users.allowed}>
  Créer un utilisateur
</button>
```

### Afficher une alerte si proche de la limite

```typescript
if (quotas.dresses.percentage_used >= 80) {
  showWarning(`Attention : ${quotas.dresses.remaining} robes restantes`);
}
```

### Gérer l'erreur 402

```typescript
try {
  const response = await fetch('/api/auth/register', {
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

## ✅ Récapitulatif

### Endpoints documentés
- ✅ 6 nouveaux endpoints billing
- ✅ 1 endpoint existant mis à jour (register)

### Schémas créés
- ✅ QuotaCheck
- ✅ FeatureCheck
- ✅ QuotaExceededError
- ✅ FeatureNotAvailableError
- ✅ SubscriptionPlan

### Tags ajoutés
- ✅ "Billing & Subscription"

---

## 🚀 Prochaines Étapes

1. **Tester la documentation**
   ```bash
   npm run dev
   # Ouvrir http://localhost:3000/api-docs
   ```

2. **Mettre à jour la doc des autres routes**
   - POST /dresses (quota "dresses")
   - POST /customers (quota "customers")
   - POST /contracts (quota "contracts")

3. **Ajouter des exemples cURL**
   ```bash
   curl -X GET http://localhost:3000/api/billing/plans
   ```

---

**✅ La documentation Swagger est maintenant complète et interactive !**
