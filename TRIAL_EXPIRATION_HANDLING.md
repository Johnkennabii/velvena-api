# Gestion de l'expiration du trial FREE

## 🎯 Comportement

### Plan FREE - Période d'essai de 14 jours

Lorsqu'un utilisateur s'inscrit avec le plan FREE :
- ✅ **14 jours d'accès complet** à toutes les fonctionnalités
- ✅ `subscription_status: "trial"`
- ✅ `trial_ends_at`: Date d'expiration (14 jours après création)

### Après expiration du trial (> 14 jours)

**Toutes les routes protégées retournent une erreur 402** :

```json
{
  "success": false,
  "error": "Trial period expired",
  "code": "TRIAL_EXPIRED",
  "message": "Your trial period has expired. Please subscribe to continue using the service.",
  "upgrade_url": "/settings/billing"
}
```

**L'utilisateur NE PEUT PLUS** :
- ❌ Accéder au dashboard
- ❌ Gérer les robes
- ❌ Gérer les clients
- ❌ Créer des contrats
- ❌ Toute autre action dans l'application

**L'utilisateur PEUT TOUJOURS** :
- ✅ Se connecter (`POST /auth/login`)
- ✅ Accéder à `/billing` pour upgrader
- ✅ Créer une session Stripe Checkout
- ✅ Payer et activer un plan payant

---

## 🔧 Implémentation Backend

### Middleware `requireActiveSubscription`

**Fichier** : `src/middleware/subscriptionMiddleware.ts`

```typescript
export async function requireActiveSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // 1. Récupérer l'organisation
  const org = await prisma.organization.findUnique({
    where: { id: req.user.organizationId },
    select: {
      subscription_status: true,
      trial_ends_at: true,
      subscription_ends_at: true,
      is_active: true,
    },
  });

  // 2. Vérifier si le trial est expiré
  if (org.subscription_status === "trial" && org.trial_ends_at) {
    if (org.trial_ends_at < new Date()) {
      return res.status(402).json({
        success: false,
        error: "Trial period expired",
        code: "TRIAL_EXPIRED",
        message: "Your trial period has expired. Please subscribe to continue.",
        upgrade_url: "/settings/billing",
      });
    }
  }

  // 3. Vérifier les autres cas (subscription expirée, compte suspendu, etc.)
  // ...

  next();
}
```

### Application du middleware

**Fichier** : `src/server.ts`

Le middleware est appliqué **globalement** sur toutes les routes, sauf :
- `/auth` (login, register)
- `/billing` (upgrade, checkout)
- `/organizations/initialize` (inscription)
- `/sign-links` (signature électronique)
- `/health` (health check)
- `/metrics` (Prometheus)
- `/webhooks` (Stripe webhooks)
- `/api-docs` (Swagger)

```typescript
const publicRoutes = [
  '/auth',
  '/billing',
  '/organizations/initialize',
  '/sign-links',
  '/health',
  '/metrics',
  '/webhooks',
  '/api-docs',
  '/'
];

app.use(async (req, res, next) => {
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

  if (isPublicRoute) {
    return next();  // Pas de vérification
  }

  // Si authentifié, vérifier le trial
  if (req.user) {
    return requireActiveSubscription(req, res, next);
  }

  next();
});
```

---

## 💻 Implémentation Frontend

### 1. Intercepteur Axios pour détecter l'erreur 402

```typescript
// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.velvena.fr',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour gérer l'expiration du trial
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      const { code, message, upgrade_url } = error.response.data;

      if (code === 'TRIAL_EXPIRED') {
        // Afficher modal d'upgrade
        window.dispatchEvent(new CustomEvent('trial-expired', {
          detail: { message, upgrade_url }
        }));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 2. Modal d'expiration du trial

```tsx
// src/components/TrialExpiredModal.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const TrialExpiredModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleTrialExpired = (event: CustomEvent) => {
      setMessage(event.detail.message);
      setIsOpen(true);
    };

    window.addEventListener('trial-expired', handleTrialExpired as EventListener);

    return () => {
      window.removeEventListener('trial-expired', handleTrialExpired as EventListener);
    };
  }, []);

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-icon">⏰</div>
        <h2>Période d'essai expirée</h2>
        <p>{message}</p>

        <div className="modal-actions">
          <button onClick={handleUpgrade} className="btn-primary">
            Voir les plans
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3. Vérifier l'état du trial au chargement

```tsx
// src/hooks/useTrialStatus.ts
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

export const useTrialStatus = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!organization) return;

    const { subscription_status, trial_ends_at } = organization;

    if (subscription_status === 'trial' && trial_ends_at) {
      const daysLeft = Math.ceil(
        (new Date(trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Trial expiré
      if (daysLeft <= 0) {
        navigate('/trial-expired');
        return;
      }

      // Avertir si moins de 3 jours restants
      if (daysLeft <= 3) {
        console.warn(`⚠️ Trial expires in ${daysLeft} days`);
      }
    }
  }, [organization, navigate]);
};
```

### 4. Page dédiée pour trial expiré

```tsx
// src/pages/TrialExpired.tsx
import { useNavigate } from 'react-router-dom';

export const TrialExpiredPage = () => {
  const navigate = useNavigate();

  return (
    <div className="trial-expired-page">
      <div className="container">
        <div className="icon">⏰</div>
        <h1>Votre période d'essai a expiré</h1>
        <p>
          Votre période d'essai gratuite de 14 jours est terminée.
          Pour continuer à utiliser Velvena, veuillez souscrire à un plan.
        </p>

        <div className="features">
          <h3>Continuez avec un plan premium :</h3>
          <ul>
            <li>✅ Accès illimité à toutes les fonctionnalités</li>
            <li>✅ Support prioritaire</li>
            <li>✅ Stockage illimité</li>
            <li>✅ Analytics avancés</li>
          </ul>
        </div>

        <div className="actions">
          <button onClick={() => navigate('/pricing')} className="btn-primary">
            Voir les plans
          </button>
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 5. Badge de compte à rebours

```tsx
// src/components/TrialCountdown.tsx
import { useAuth } from '../hooks/useAuth';

export const TrialCountdown = () => {
  const { organization } = useAuth();

  if (!organization || organization.subscription_status !== 'trial') {
    return null;
  }

  const daysLeft = Math.ceil(
    (new Date(organization.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) {
    return (
      <div className="trial-badge expired">
        ⚠️ Trial expiré - Veuillez upgrader
      </div>
    );
  }

  const isUrgent = daysLeft <= 3;

  return (
    <div className={`trial-badge ${isUrgent ? 'urgent' : ''}`}>
      🎁 {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
      {isUrgent && (
        <button onClick={() => navigate('/pricing')} className="btn-sm">
          Upgrader maintenant
        </button>
      )}
    </div>
  );
};
```

---

## 🧪 Tests

### Test manuel 1 : Créer un compte avec trial expiré

```sql
-- Dans la base de données
UPDATE organizations
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE id = 'YOUR_ORG_ID';
```

Résultat attendu :
- ✅ Login fonctionne
- ✅ Routes protégées retournent 402
- ✅ Modal s'affiche
- ✅ `/billing` reste accessible

### Test manuel 2 : Upgrade depuis trial expiré

1. Trial expiré (comme ci-dessus)
2. Aller sur `/billing/create-checkout-session`
3. Payer avec Stripe
4. Webhook met à jour `subscription_status: "active"`
5. L'utilisateur peut à nouveau accéder à l'application

---

## 📊 Scénarios

### Scénario 1 : Trial actif (< 14 jours)

```
Utilisateur inscrit il y a 5 jours
trial_ends_at: dans 9 jours
subscription_status: "trial"

→ ✅ Accès complet à l'application
→ ✅ Badge : "9 jours restants"
```

### Scénario 2 : Trial expiré

```
Utilisateur inscrit il y a 20 jours
trial_ends_at: il y a 6 jours
subscription_status: "trial"

→ ❌ Accès bloqué (402)
→ ✅ Modal : "Trial period expired"
→ ✅ Redirect vers /pricing
```

### Scénario 3 : Upgrade vers plan payant

```
Trial expiré
→ Utilisateur clique "Upgrade"
→ Stripe Checkout
→ Paiement réussi
→ Webhook: subscription_status = "active"
→ ✅ Accès restauré immédiatement
```

### Scénario 4 : Plan payant actif

```
subscription_status: "active"
stripe_subscription_id: "sub_..."

→ ✅ Accès complet
→ ✅ Pas de vérification de trial_ends_at
→ ✅ Vérification uniquement de subscription_ends_at (si annulé)
```

---

## 🚨 Codes d'erreur

| Code | Status | Description | Action frontend |
|------|--------|-------------|----------------|
| `TRIAL_EXPIRED` | 402 | Période d'essai expirée | Modal + Redirect /pricing |
| `SUBSCRIPTION_EXPIRED` | 402 | Abonnement payant expiré | Modal + Redirect /billing |
| `ACCOUNT_SUSPENDED` | 403 | Compte suspendu par admin | Message "Contact support" |
| `ACCOUNT_INACTIVE` | 403 | Compte désactivé | Message "Contact support" |
| `QUOTA_EXCEEDED` | 402 | Limite de quota atteinte | Modal "Upgrade to continue" |

---

## ✅ Checklist frontend

- [ ] Intercepteur Axios pour 402
- [ ] Modal TrialExpiredModal
- [ ] Page /trial-expired
- [ ] Badge TrialCountdown dans le header
- [ ] Hook useTrialStatus
- [ ] Routes publiques accessibles (/billing, /pricing)
- [ ] Test avec trial expiré
- [ ] Test upgrade depuis trial expiré
