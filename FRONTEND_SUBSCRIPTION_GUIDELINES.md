# 📱 Consignes Frontend - Gestion des Abonnements et Trials

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Statuts de souscription](#statuts-de-souscription)
3. [Endpoints API](#endpoints-api)
4. [Gestion des trials expirés](#gestion-des-trials-expirés)
5. [Flux de souscription](#flux-de-souscription)
6. [Affichage conditionnel](#affichage-conditionnel)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Exemples de code](#exemples-de-code)
9. [Checklist d'implémentation](#checklist-dimplémentation)

---

## 🎯 Vue d'ensemble

### Comportement du système

1. **Inscription** → Trial gratuit de 14 jours commence
2. **Pendant le trial** → Accès complet aux fonctionnalités
3. **Souscription pendant le trial** → Trial se termine immédiatement, abonnement actif instantanément
4. **Expiration du trial sans souscription** → Blocage total de l'accès, redirection vers page de pricing
5. **Expiration d'abonnement payant** → Blocage total, demande de renouvellement

---

## 🔴 Statuts de souscription

| Statut | Description | Accès | Action requise |
|--------|-------------|-------|----------------|
| `trial` | Période d'essai active | ✅ Complet | Afficher countdown + CTA upgrade |
| `active` | Abonnement payant actif | ✅ Complet | Afficher date de renouvellement |
| `trial_expired` | Trial terminé sans souscription | ❌ BLOQUÉ | **Redirection forcée vers pricing** |
| `expired` | Abonnement payant expiré | ❌ BLOQUÉ | **Redirection forcée vers pricing** |
| `suspended` | Paiement échoué | ❌ BLOQUÉ | Demande de mise à jour paiement |
| `cancelled` | Abonnement annulé | ❌ BLOQUÉ | Proposition de réabonnement |

---

## 🌐 Endpoints API

### 1. Récupérer le statut de souscription

```http
GET /billing/status
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "subscription": {
    "status": "trial",
    "plan": {
      "code": "free",
      "name": "Plan Gratuit",
      "price_monthly": 0,
      "price_yearly": 0,
      "limits": {
        "users": 3,
        "dresses": 50,
        "customers": 100,
        "contracts": 50
      },
      "features": {
        "planning": true,
        "dashboard": true,
        "export_data": false,
        "electronic_signature": false
      }
    },
    "trial_ends_at": "2025-12-25T23:59:59Z",
    "subscription_ends_at": null,
    "days_remaining": 7
  }
}
```

### 2. Récupérer les plans disponibles

```http
GET /billing/plans
```

**Réponse :**
```json
[
  {
    "id": "uuid",
    "code": "starter",
    "name": "Starter",
    "description": "Idéal pour débuter",
    "price_monthly": 29.99,
    "price_yearly": 299.99,
    "currency": "EUR",
    "trial_days": 14,
    "is_popular": false,
    "limits": {
      "users": 5,
      "dresses": 100,
      "customers": 500
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "export_data": true,
      "electronic_signature": false
    }
  },
  {
    "id": "uuid",
    "code": "pro",
    "name": "Pro",
    "description": "Pour les professionnels",
    "price_monthly": 79.99,
    "price_yearly": 799.99,
    "is_popular": true,
    "limits": {
      "users": -1,
      "dresses": -1,
      "customers": -1
    },
    "features": {
      "planning": true,
      "dashboard": true,
      "export_data": true,
      "electronic_signature": true,
      "contract_builder": true
    }
  }
]
```

### 3. Créer une session de paiement Stripe

```http
POST /billing/create-checkout-session
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan_code": "pro",
  "billing_interval": "month",
  "success_url": "https://app.velvena.fr/billing/success",
  "cancel_url": "https://app.velvena.fr/pricing"
}
```

**Réponse :**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx",
  "publishableKey": "pk_test_xxx"
}
```

### 4. Dashboard complet (quotas + features + status)

```http
GET /billing/dashboard
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "quotas": {
    "users": { "used": 2, "limit": 3, "percentage": 66 },
    "dresses": { "used": 45, "limit": 50, "percentage": 90 },
    "customers": { "used": 120, "limit": 500, "percentage": 24 },
    "contracts": { "used": 30, "limit": 50, "percentage": 60 }
  },
  "features": {
    "planning": { "enabled": true, "name": "Planning" },
    "dashboard": { "enabled": true, "name": "Tableau de bord" },
    "export_data": { "enabled": false, "name": "Export des données" },
    "electronic_signature": { "enabled": false, "name": "Signature électronique" }
  },
  "subscription": {
    "status": "trial",
    "plan": { /* ... */ },
    "trial_ends_at": "2025-12-25T23:59:59Z",
    "days_remaining": 7
  }
}
```

### 5. Portail client Stripe

```http
POST /billing/create-portal-session
Authorization: Bearer {token}
Content-Type: application/json

{
  "return_url": "https://app.velvena.fr/settings/billing"
}
```

**Réponse :**
```json
{
  "url": "https://billing.stripe.com/session/xxx"
}
```

---

## 🚨 Gestion des trials expirés

### ⚠️ COMPORTEMENT CRITIQUE

Lorsqu'un utilisateur a laissé expirer sa période d'essai **sans souscrire**, voici ce qui se passe :

#### 1. **Blocage API automatique**

Toutes les requêtes vers les routes protégées retournent :

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "success": false,
  "error": "Trial period expired",
  "code": "TRIAL_EXPIRED",
  "message": "Votre période d'essai a expiré. Veuillez souscrire à un abonnement pour continuer.",
  "upgrade_url": "/settings/billing"
}
```

#### 2. **Routes BLOQUÉES** (retournent 402)

- ❌ `/contracts`
- ❌ `/customers`
- ❌ `/dresses`
- ❌ `/users`
- ❌ Toutes les routes métier

#### 3. **Routes ACCESSIBLES** (même avec trial expiré)

- ✅ `/auth/login`
- ✅ `/auth/refresh`
- ✅ `/billing/*` (toutes les routes billing)
- ✅ `/health`

### 🎨 UX à implémenter pour trial expiré

#### **Modal plein écran obligatoire**

```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useBilling } from '@/hooks/useBilling';

const TrialExpiredGuard = ({ children }) => {
  const router = useRouter();
  const { subscription, isLoading } = useBilling();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Si trial expiré ou abonnement expiré
    if (subscription.status === 'trial_expired' || subscription.status === 'expired') {
      // Autoriser uniquement les pages de billing et auth
      const allowedPaths = ['/pricing', '/billing', '/auth', '/logout'];
      const isAllowedPath = allowedPaths.some(path => router.pathname.startsWith(path));

      if (!isAllowedPath) {
        setShowModal(true);
        // Rediriger vers pricing après 3 secondes
        setTimeout(() => {
          router.push('/pricing?reason=trial_expired');
        }, 3000);
      }
    }
  }, [subscription, isLoading, router]);

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-xl">
          <div className="mb-4 text-6xl text-center">⏰</div>
          <h2 className="mb-4 text-2xl font-bold text-center text-gray-900">
            Période d'essai expirée
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Votre période d'essai de 14 jours est terminée.
            Pour continuer à utiliser Velvena, veuillez choisir un abonnement.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Voir les plans disponibles
            </button>
            <button
              onClick={() => router.push('/logout')}
              className="w-full px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TrialExpiredGuard;
```

#### **Intégration dans le layout**

```tsx
// app/layout.tsx ou _app.tsx
import TrialExpiredGuard from '@/components/TrialExpiredGuard';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <TrialExpiredGuard>
            {children}
          </TrialExpiredGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 💳 Flux de souscription

### Étape 1 : Afficher les plans

```tsx
const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    fetch('/billing/plans')
      .then(res => res.json())
      .then(setPlans);
  }, []);

  return (
    <div>
      <h1>Choisissez votre plan</h1>

      {/* Toggle mensuel/annuel */}
      <Toggle value={interval} onChange={setInterval}>
        <Option value="month">Mensuel</Option>
        <Option value="year">Annuel (2 mois offerts)</Option>
      </Toggle>

      {/* Grille de plans */}
      <div className="grid grid-cols-3 gap-6">
        {plans.map(plan => (
          <PlanCard
            key={plan.code}
            plan={plan}
            interval={interval}
            onSubscribe={() => handleSubscribe(plan.code, interval)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Étape 2 : Créer la session Stripe

```tsx
const handleSubscribe = async (planCode: string, interval: 'month' | 'year') => {
  try {
    setLoading(true);

    const response = await fetch('/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan_code: planCode,
        billing_interval: interval,
        success_url: `${window.location.origin}/billing/success`,
        cancel_url: `${window.location.origin}/pricing`
      })
    });

    const data = await response.json();

    // Rediriger vers Stripe Checkout
    window.location.href = data.url;

  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    toast.error('Une erreur est survenue. Veuillez réessayer.');
  } finally {
    setLoading(false);
  }
};
```

### Étape 3 : Page de succès

```tsx
const SuccessPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'pending'>('checking');

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Attendre 2 secondes pour laisser le webhook traiter
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch('/billing/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.subscription.status === 'active') {
          setStatus('success');

          // Message de succès
          toast.success('🎉 Votre abonnement est maintenant actif !');

          // Rediriger vers dashboard après 3 secondes
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          // Le webhook n'a pas encore été traité
          setStatus('pending');

          // Réessayer après 2 secondes
          setTimeout(checkSubscription, 2000);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus('pending');
        setTimeout(checkSubscription, 2000);
      }
    };

    checkSubscription();
  }, []);

  if (status === 'checking' || status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="mt-4 text-lg">Activation de votre abonnement en cours...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-6xl">✅</div>
      <h1 className="mt-4 text-3xl font-bold">Paiement réussi !</h1>
      <p className="mt-2 text-gray-600">
        Votre période d'essai est terminée et votre abonnement est maintenant actif.
      </p>
      <p className="mt-2 font-semibold text-green-600">
        Vous avez accès à toutes les fonctionnalités immédiatement.
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        className="px-6 py-3 mt-6 text-white bg-blue-600 rounded-lg"
      >
        Accéder au tableau de bord
      </button>
    </div>
  );
};
```

---

## 🎨 Affichage conditionnel

### 1. Badge de statut dans le header

```tsx
const SubscriptionBadge = () => {
  const { subscription } = useBilling();

  if (subscription.status === 'trial') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-sm bg-yellow-100 rounded-full">
        <span>⏰</span>
        <span>Essai : {subscription.days_remaining} jours restants</span>
        <Link href="/pricing" className="ml-2 font-semibold text-blue-600">
          Upgrader
        </Link>
      </div>
    );
  }

  if (subscription.status === 'active') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 rounded-full">
        <span>✅</span>
        <span>Plan {subscription.plan.name}</span>
      </div>
    );
  }

  if (subscription.status === 'trial_expired' || subscription.status === 'expired') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-sm bg-red-100 rounded-full">
        <span>❌</span>
        <span>Expiré</span>
        <Link href="/pricing" className="ml-2 font-semibold text-blue-600">
          S'abonner
        </Link>
      </div>
    );
  }

  return null;
};
```

### 2. Alertes proactives (J-3, J-1)

```tsx
const TrialExpirationAlert = () => {
  const { subscription } = useBilling();

  if (subscription.status !== 'trial') return null;

  const daysRemaining = subscription.days_remaining;

  // Alerte J-3
  if (daysRemaining === 3) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertIcon>⚠️</AlertIcon>
        <AlertTitle>Votre période d'essai se termine bientôt</AlertTitle>
        <AlertDescription>
          Plus que 3 jours pour profiter de toutes les fonctionnalités.
          <Link href="/pricing" className="ml-2 underline">
            Souscrire maintenant
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Alerte J-1
  if (daysRemaining === 1) {
    return (
      <Alert variant="danger" className="mb-4">
        <AlertIcon>🚨</AlertIcon>
        <AlertTitle>Dernière chance !</AlertTitle>
        <AlertDescription>
          Votre essai se termine demain. Ne perdez pas l'accès à vos données.
          <Button onClick={() => router.push('/pricing')} className="ml-4">
            S'abonner maintenant
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Alerte J-0 (dernier jour)
  if (daysRemaining === 0) {
    return (
      <Alert variant="danger" className="mb-4">
        <AlertIcon>⏰</AlertIcon>
        <AlertTitle>Votre essai expire aujourd'hui !</AlertTitle>
        <AlertDescription>
          Agissez maintenant pour éviter la perte d'accès.
          <Button onClick={() => router.push('/pricing')} className="ml-4" variant="danger">
            S'abonner immédiatement
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
```

### 3. Indicateurs de quotas

```tsx
const QuotaIndicator = ({ resource }: { resource: 'users' | 'dresses' | 'customers' }) => {
  const { quotas } = useBilling();
  const quota = quotas[resource];

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 80) return 'orange';
    return 'green';
  };

  const color = getColor(quota.percentage);

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold capitalize">{resource}</h4>
        <span className="text-sm text-gray-600">
          {quota.used} / {quota.limit === -1 ? '∞' : quota.limit}
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-2 rounded-full bg-${color}-500`}
          style={{ width: `${quota.percentage}%` }}
        />
      </div>

      {quota.percentage >= 80 && quota.limit !== -1 && (
        <p className="mt-2 text-sm text-orange-600">
          ⚠️ Vous approchez de la limite.
          <Link href="/pricing" className="ml-1 underline">
            Passer à un plan supérieur
          </Link>
        </p>
      )}
    </div>
  );
};
```

### 4. Feature toggles

```tsx
const FeatureGate = ({ feature, children, fallback }: FeatureGateProps) => {
  const { features } = useBilling();

  if (features[feature]?.enabled) {
    return <>{children}</>;
  }

  return fallback || (
    <div className="p-6 text-center border border-gray-300 border-dashed rounded-lg">
      <div className="text-4xl">🔒</div>
      <h3 className="mt-2 font-semibold">Fonctionnalité premium</h3>
      <p className="mt-1 text-sm text-gray-600">
        {features[feature]?.name} disponible avec le plan Pro
      </p>
      <Button onClick={() => router.push('/pricing')} className="mt-4">
        Upgrader maintenant
      </Button>
    </div>
  );
};

// Utilisation
<FeatureGate feature="electronic_signature">
  <SignatureComponent />
</FeatureGate>
```

---

## ⚠️ Gestion des erreurs

### Intercepteur Axios pour les erreurs 402

```typescript
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Créer une instance axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Intercepteur de requête (ajouter le token)
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Intercepteur de réponse (gérer les erreurs)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 402) {
      const { code, message } = error.response.data;

      if (code === 'TRIAL_EXPIRED') {
        toast.error('Votre période d\'essai est expirée');

        // Rediriger vers pricing
        window.location.href = '/pricing?reason=trial_expired';
      }

      if (code === 'SUBSCRIPTION_EXPIRED') {
        toast.error('Votre abonnement a expiré');

        window.location.href = '/pricing?reason=subscription_expired';
      }
    }

    if (error.response?.status === 401) {
      // Token invalide ou expiré
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 📝 Exemples de code complets

### Hook personnalisé `useBilling`

```typescript
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Subscription {
  status: 'trial' | 'active' | 'trial_expired' | 'expired' | 'suspended' | 'cancelled';
  plan: {
    code: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
  };
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  days_remaining: number;
}

interface BillingData {
  subscription: Subscription;
  quotas: {
    [key: string]: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  features: {
    [key: string]: {
      enabled: boolean;
      name: string;
    };
  };
}

export const useBilling = () => {
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBilling = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/billing/dashboard');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  return {
    subscription: data?.subscription,
    quotas: data?.quotas || {},
    features: data?.features || {},
    isLoading,
    error,
    refresh: fetchBilling,
  };
};
```

### Page de pricing complète

```tsx
import { useState } from 'react';
import { useBilling } from '@/hooks/useBilling';
import api from '@/lib/api';

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const { subscription } = useBilling();

  useEffect(() => {
    api.get('/billing/plans').then(res => setPlans(res.data));
  }, []);

  const handleSubscribe = async (planCode: string) => {
    try {
      setLoading(true);

      const response = await api.post('/billing/create-checkout-session', {
        plan_code: planCode,
        billing_interval: interval,
        success_url: `${window.location.origin}/billing/success`,
        cancel_url: `${window.location.origin}/pricing`
      });

      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-16 mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Choisissez votre plan</h1>
        {subscription?.status === 'trial' && (
          <p className="text-lg text-gray-600">
            Il vous reste {subscription.days_remaining} jours d'essai gratuit
          </p>
        )}
        {(subscription?.status === 'trial_expired' || subscription?.status === 'expired') && (
          <div className="p-4 mx-auto mt-4 bg-red-100 border border-red-400 rounded-lg max-w-2xl">
            <p className="text-lg font-semibold text-red-800">
              ⚠️ Votre {subscription.status === 'trial_expired' ? 'période d\'essai' : 'abonnement'} a expiré
            </p>
            <p className="text-red-700">
              Sélectionnez un plan pour retrouver l'accès à vos données
            </p>
          </div>
        )}
      </div>

      {/* Toggle mensuel/annuel */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-gray-200 rounded-lg">
          <button
            onClick={() => setInterval('month')}
            className={`px-6 py-2 rounded-md transition ${
              interval === 'month'
                ? 'bg-white shadow text-blue-600 font-semibold'
                : 'text-gray-700'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-6 py-2 rounded-md transition ${
              interval === 'year'
                ? 'bg-white shadow text-blue-600 font-semibold'
                : 'text-gray-700'
            }`}
          >
            Annuel
            <span className="ml-2 text-xs text-green-600">-20%</span>
          </button>
        </div>
      </div>

      {/* Grille de plans */}
      <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-3">
        {plans.map(plan => (
          <div
            key={plan.code}
            className={`relative p-6 bg-white border-2 rounded-lg shadow-lg ${
              plan.is_popular ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            {plan.is_popular && (
              <div className="absolute top-0 right-0 px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-bl-lg rounded-tr-lg">
                Populaire
              </div>
            )}

            <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
            <p className="mb-4 text-gray-600">{plan.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">
                {interval === 'month' ? plan.price_monthly : plan.price_yearly}€
              </span>
              <span className="text-gray-600">
                /{interval === 'month' ? 'mois' : 'an'}
              </span>
            </div>

            <button
              onClick={() => handleSubscribe(plan.code)}
              disabled={loading || subscription?.plan?.code === plan.code}
              className={`w-full py-3 font-semibold rounded-lg transition ${
                plan.is_popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {subscription?.plan?.code === plan.code ? 'Plan actuel' : 'Choisir ce plan'}
            </button>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                {plan.limits.users === -1 ? 'Utilisateurs illimités' : `${plan.limits.users} utilisateurs`}
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                {plan.limits.dresses === -1 ? 'Robes illimitées' : `${plan.limits.dresses} robes`}
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                {plan.limits.customers === -1 ? 'Clients illimités' : `${plan.limits.customers} clients`}
              </li>
              {Object.entries(plan.features).map(([key, enabled]) => (
                enabled && (
                  <li key={key} className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                )
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
```

---

## ✅ Checklist d'implémentation

### Phase 1 : Setup de base
- [ ] Créer l'instance Axios avec intercepteurs
- [ ] Créer le hook `useBilling()`
- [ ] Créer le composant `TrialExpiredGuard`
- [ ] Intégrer le guard dans le layout principal

### Phase 2 : Affichage conditionnel
- [ ] Badge de statut dans le header
- [ ] Alertes J-3, J-1, J-0
- [ ] Indicateurs de quotas
- [ ] Feature gates (lock/unlock)

### Phase 3 : Pages principales
- [ ] Page `/pricing` avec grille de plans
- [ ] Page `/billing/success` avec polling
- [ ] Page `/settings/billing` (dashboard)
- [ ] Modal trial expiré (plein écran)

### Phase 4 : Intégration Stripe
- [ ] Fonction `handleSubscribe()` avec checkout
- [ ] Fonction `handleManageSubscription()` avec portail
- [ ] Gestion des redirections Stripe
- [ ] Gestion du polling post-paiement

### Phase 5 : Tests
- [ ] Tester le flux complet trial → souscription
- [ ] Tester l'expiration du trial (bloquer l'accès)
- [ ] Tester le passage trial → active (instantané)
- [ ] Tester les erreurs 402 et redirections
- [ ] Tester le portail client Stripe

---

## 🔑 Points critiques à retenir

### ⚡ Instant activation
Après paiement, le statut passe **immédiatement** de `trial` à `active`. Pas besoin d'attendre.

### 🚫 Blocage total
Les statuts `trial_expired` et `expired` bloquent **toutes** les routes métier. Seules les routes `/billing` et `/auth` restent accessibles.

### 🔄 Polling nécessaire
Sur la page `/billing/success`, faire un **polling** pour détecter le changement de statut (webhooks = asynchrones).

### 🎯 UX proactive
Afficher des **alertes** à J-3, J-1, J-0 pour inciter à la souscription avant expiration.

### 🔒 Modal obligatoire
Si trial expiré, afficher un **modal plein écran** qui force l'utilisateur à aller sur `/pricing` ou à se déconnecter.

---

## 📞 Support

Pour toute question ou problème, contactez l'équipe backend :
- API Documentation : https://api.velvena.fr/api-docs
- Logs : Consultez la console réseau pour les erreurs 402
- Debug : Utilisez `GET /billing/status` pour vérifier le statut actuel

---

**Dernière mise à jour :** 19 décembre 2025
**Version :** 1.0.0
