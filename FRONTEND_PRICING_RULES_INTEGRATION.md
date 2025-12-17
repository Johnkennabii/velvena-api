# Guide d'intégration Frontend - Règles de tarification (PricingRule)

## ⚠️ Changements importants

### 1. Suppression du soft delete
- **Les règles de tarification utilisent maintenant un DELETE définitif (hard delete)**
- Plus de champs `deleted_at` ou `deleted_by`
- Quand une règle est supprimée, elle disparaît définitivement de la base de données
- **Action frontend** : Ajoutez une confirmation avant suppression pour éviter les pertes de données

### 2. Lien avec ContractType (plus ServiceType)
- Les règles de tarification sont maintenant liées à `ContractType` via `contract_type_id`
- Le modèle `ServiceType` a été supprimé
- **Action frontend** : Remplacez toutes les références `service_type_id` par `contract_type_id`

### 3. ContractType et Role sont maintenant des entités GLOBALES
- `ContractType` et `Role` ne sont plus liés à une organisation spécifique
- Ils sont partagés entre toutes les organisations
- **Action frontend** :
  - Ne pas filtrer ContractType ou Role par `organization_id`
  - Ces entités sont communes à toute la plateforme
  - Une organisation ne peut pas créer ses propres ContractType ou Role

---

## API Endpoints - Règles de tarification

### 📌 URL de base
```
/api/pricing-rules
```

---

## 1. GET /pricing-rules
**Récupérer la liste de toutes les règles de tarification**

### Query Parameters (optionnels)
| Paramètre | Type | Description |
|-----------|------|-------------|
| `contract_type_id` | string | Filtrer par type de contrat |
| `strategy` | string | Filtrer par stratégie (`per_day`, `flat_rate`, `fixed_price`, `tiered`) |
| `is_active` | string | Filtrer par statut actif (`"true"` ou `"false"`) |

### Exemple de requête
```typescript
// TypeScript/React example
const fetchPricingRules = async (filters?: {
  contract_type_id?: string;
  strategy?: string;
  is_active?: boolean;
}) => {
  const params = new URLSearchParams();

  if (filters?.contract_type_id) {
    params.append('contract_type_id', filters.contract_type_id);
  }
  if (filters?.strategy) {
    params.append('strategy', filters.strategy);
  }
  if (filters?.is_active !== undefined) {
    params.append('is_active', String(filters.is_active));
  }

  const response = await fetch(`/api/pricing-rules?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
};
```

### Réponse
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tarification standard",
      "organization_id": "org-uuid",
      "contract_type_id": "contract-type-uuid",
      "strategy": "per_day",
      "calculation_config": {
        "rate": 50.0,
        "currency": "EUR"
      },
      "applies_to": {
        "dress_types": ["Robe de mariée", "Robe de soirée"]
      },
      "priority": 100,
      "is_active": true,
      "created_at": "2025-12-15T10:00:00.000Z",
      "created_by": "user-uuid",
      "updated_at": "2025-12-15T12:00:00.000Z",
      "updated_by": "user-uuid",
      "contract_type": {
        "id": "contract-type-uuid",
        "name": "Location simple",
        "config": {}
      }
    }
  ]
}
```

---

## 2. GET /pricing-rules/:id
**Récupérer une règle de tarification par ID**

### Exemple de requête
```typescript
const fetchPricingRuleById = async (id: string) => {
  const response = await fetch(`/api/pricing-rules/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Pricing rule not found');
  }

  return response.json();
};
```

### Réponse
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Tarification standard",
    "organization_id": "org-uuid",
    "contract_type_id": "contract-type-uuid",
    "strategy": "per_day",
    "calculation_config": {},
    "applies_to": {},
    "priority": 100,
    "is_active": true,
    "contract_type": {
      "id": "contract-type-uuid",
      "name": "Location simple"
    }
  }
}
```

---

## 3. POST /pricing-rules
**Créer une nouvelle règle de tarification**

### Body (JSON)
```typescript
interface CreatePricingRuleRequest {
  name: string;                    // Requis
  contract_type_id?: string;       // Optionnel - lien vers ContractType
  strategy: 'per_day' | 'flat_rate' | 'fixed_price' | 'tiered'; // Requis
  calculation_config?: object;     // Configuration de calcul
  applies_to?: object;             // Conditions d'application
  priority?: number;               // Défaut: 0
}
```

### Exemple de requête
```typescript
const createPricingRule = async (data: CreatePricingRuleRequest) => {
  const response = await fetch('/api/pricing-rules', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};

// Exemple d'utilisation
const newRule = await createPricingRule({
  name: "Tarif weekend",
  contract_type_id: "contract-type-uuid",
  strategy: "per_day",
  calculation_config: {
    rate: 75.0,
    weekend_multiplier: 1.5
  },
  applies_to: {
    days_of_week: ["saturday", "sunday"]
  },
  priority: 150
});
```

### Réponse
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "Tarif weekend",
    "organization_id": "org-uuid",
    "contract_type_id": "contract-type-uuid",
    "strategy": "per_day",
    "calculation_config": {
      "rate": 75.0,
      "weekend_multiplier": 1.5
    },
    "applies_to": {
      "days_of_week": ["saturday", "sunday"]
    },
    "priority": 150,
    "is_active": true,
    "created_at": "2025-12-15T14:00:00.000Z",
    "created_by": "user-uuid",
    "contract_type": {
      "id": "contract-type-uuid",
      "name": "Location simple"
    }
  }
}
```

---

## 4. PUT /pricing-rules/:id
**Mettre à jour une règle de tarification**

### ⚠️ Important
- Seules les règles appartenant à votre organisation peuvent être modifiées
- Les règles globales (`organization_id: null`) ne peuvent pas être modifiées
- Le champ `strategy` ne peut pas être modifié (créez une nouvelle règle si besoin)

### Body (JSON)
```typescript
interface UpdatePricingRuleRequest {
  name?: string;
  contract_type_id?: string | null;
  calculation_config?: object;
  applies_to?: object;
  priority?: number;
  is_active?: boolean;
}
```

### Exemple de requête
```typescript
const updatePricingRule = async (id: string, data: UpdatePricingRuleRequest) => {
  const response = await fetch(`/api/pricing-rules/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};

// Exemple: Désactiver une règle
const disabledRule = await updatePricingRule('rule-uuid', {
  is_active: false
});

// Exemple: Changer la priorité
const updatedRule = await updatePricingRule('rule-uuid', {
  priority: 200
});
```

### Réponse
```json
{
  "success": true,
  "data": {
    "id": "rule-uuid",
    "name": "Tarif weekend",
    "is_active": false,
    "priority": 200,
    ...
  }
}
```

---

## 5. DELETE /pricing-rules/:id
**⚠️ SUPPRESSION DÉFINITIVE (Hard Delete)**

### ⚠️ TRÈS IMPORTANT
- **Cette action est IRRÉVERSIBLE**
- La règle sera DÉFINITIVEMENT supprimée de la base de données
- **Toujours demander confirmation à l'utilisateur avant suppression**
- Seules les règles appartenant à votre organisation peuvent être supprimées

### Exemple de requête
```typescript
const deletePricingRule = async (id: string) => {
  // ⚠️ Toujours confirmer avant suppression
  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir supprimer cette règle de tarification ? ' +
    'Cette action est définitive et ne peut pas être annulée.'
  );

  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/pricing-rules/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};
```

### Exemple avec React + UI moderne
```typescript
import { useState } from 'react';

const DeletePricingRuleButton = ({ ruleId, ruleName, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/pricing-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      onDeleted?.();
      toast.success('Règle de tarification supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowConfirmation(true)}>
        Supprimer
      </button>

      {showConfirmation && (
        <ConfirmDialog
          title="Supprimer la règle de tarification"
          message={`Êtes-vous sûr de vouloir supprimer "${ruleName}" ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirmation(false)}
          isLoading={isDeleting}
          destructive
        />
      )}
    </>
  );
};
```

### Réponse
```json
{
  "success": true,
  "message": "Pricing rule deleted successfully"
}
```

---

## 6. POST /pricing-rules/calculate
**Calculer le prix pour un contexte donné**

### Body (JSON)
```typescript
interface CalculatePriceRequest {
  dress_id: string;                // Requis
  start_date: string;              // Requis (ISO 8601)
  end_date: string;                // Requis (ISO 8601)
  pricing_rule_id?: string;        // Optionnel - force une règle spécifique
  overrides?: {                    // Optionnel - surcharges
    base_price?: number;
    discount_percent?: number;
    [key: string]: any;
  };
}
```

### Exemple de requête
```typescript
const calculatePrice = async (data: CalculatePriceRequest) => {
  const response = await fetch('/api/pricing-rules/calculate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};

// Exemple: Calcul automatique (meilleure règle)
const priceEstimate = await calculatePrice({
  dress_id: "dress-uuid",
  start_date: "2025-12-20T00:00:00.000Z",
  end_date: "2025-12-25T00:00:00.000Z"
});

// Exemple: Forcer une règle spécifique
const priceWithRule = await calculatePrice({
  dress_id: "dress-uuid",
  start_date: "2025-12-20T00:00:00.000Z",
  end_date: "2025-12-25T00:00:00.000Z",
  pricing_rule_id: "rule-uuid"
});

// Exemple: Avec surcharges
const priceWithDiscount = await calculatePrice({
  dress_id: "dress-uuid",
  start_date: "2025-12-20T00:00:00.000Z",
  end_date: "2025-12-25T00:00:00.000Z",
  overrides: {
    discount_percent: 10
  }
});
```

### Réponse
```json
{
  "success": true,
  "data": {
    "total_price_ht": 250.00,
    "total_price_ttc": 300.00,
    "duration_days": 5,
    "strategy_used": "per_day",
    "breakdown": {
      "base_price": 250.00,
      "tax": 50.00,
      "discount": 0
    },
    "pricing_rule_used": {
      "id": "rule-uuid",
      "name": "Tarification standard",
      "strategy": "per_day"
    },
    "dress": {
      "id": "dress-uuid",
      "name": "Robe de mariée Princesse",
      "reference": "REF-001"
    }
  }
}
```

---

## Stratégies de tarification disponibles

### 1. `per_day` - Par jour
Calcul basé sur le nombre de jours de location.

**Configuration exemple:**
```json
{
  "rate": 50.00,
  "currency": "EUR",
  "minimum_days": 3
}
```

### 2. `flat_rate` - Tarif forfaitaire
Tarif fixe quelle que soit la durée.

**Configuration exemple:**
```json
{
  "amount": 500.00,
  "currency": "EUR"
}
```

### 3. `fixed_price` - Prix fixe
Prix prédéfini sans calcul.

**Configuration exemple:**
```json
{
  "price_ht": 400.00,
  "price_ttc": 480.00
}
```

### 4. `tiered` - Par paliers
Tarifs différents selon la durée.

**Configuration exemple:**
```json
{
  "tiers": [
    { "max_days": 3, "rate": 60.00 },
    { "max_days": 7, "rate": 50.00 },
    { "max_days": null, "rate": 40.00 }
  ]
}
```

---

## Gestion des erreurs

### Codes d'erreur courants

| Code HTTP | Erreur | Description |
|-----------|--------|-------------|
| 400 | Bad Request | Paramètres manquants ou invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Pas de contexte organisation |
| 404 | Not Found | Règle de tarification introuvable |
| 500 | Internal Server Error | Erreur serveur |

### Exemple de gestion d'erreurs
```typescript
const handlePricingRuleError = (error: any) => {
  if (error.response?.status === 404) {
    toast.error('Règle de tarification introuvable');
  } else if (error.response?.status === 403) {
    toast.error('Vous n\'avez pas les permissions nécessaires');
  } else if (error.response?.status === 400) {
    toast.error(error.response.data.error || 'Données invalides');
  } else {
    toast.error('Une erreur est survenue');
  }
};
```

---

## Bonnes pratiques

### 1. Toujours confirmer les suppressions
```typescript
// ❌ Mauvais
const handleDelete = (id) => {
  fetch(`/api/pricing-rules/${id}`, { method: 'DELETE' });
};

// ✅ Bon
const handleDelete = async (id, name) => {
  const confirmed = await confirmDialog({
    title: 'Supprimer la règle ?',
    message: `"${name}" sera définitivement supprimée.`,
    confirmLabel: 'Supprimer',
    cancelLabel: 'Annuler',
    destructive: true,
  });

  if (confirmed) {
    await fetch(`/api/pricing-rules/${id}`, { method: 'DELETE' });
  }
};
```

### 2. Afficher les règles inactives différemment
```typescript
const PricingRuleCard = ({ rule }) => (
  <div className={rule.is_active ? '' : 'opacity-50'}>
    <h3>{rule.name}</h3>
    {!rule.is_active && (
      <Badge variant="warning">Inactive</Badge>
    )}
  </div>
);
```

### 3. Filtrer intelligemment
```typescript
// Charger uniquement les règles actives par défaut
const [showInactive, setShowInactive] = useState(false);

const { data } = useQuery(['pricing-rules', showInactive], () =>
  fetchPricingRules({
    is_active: showInactive ? undefined : true
  })
);
```

### 4. Optimiser avec React Query
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Récupération
const usePricingRules = (filters?) => {
  return useQuery(
    ['pricing-rules', filters],
    () => fetchPricingRules(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

// Création
const useCreatePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data) => createPricingRule(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['pricing-rules']);
      },
    }
  );
};

// Suppression
const useDeletePricingRule = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id) => deletePricingRule(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['pricing-rules']);
        toast.success('Règle supprimée');
      },
      onError: (error) => {
        toast.error('Erreur lors de la suppression');
      },
    }
  );
};
```

---

## Checklist d'intégration

- [ ] Remplacer toutes les références `service_type_id` par `contract_type_id`
- [ ] Supprimer les filtres par `deleted_at` (plus de soft delete)
- [ ] Ajouter des confirmations avant toute suppression
- [ ] Gérer les erreurs 404 pour les règles supprimées
- [ ] Ne pas filtrer ContractType par `organization_id` (entités globales)
- [ ] Mettre à jour les formulaires de création/édition
- [ ] Tester le calcul de prix avec différentes stratégies
- [ ] Implémenter la gestion des règles globales vs organization-specific
- [ ] Ajouter des indicateurs visuels pour les règles inactives
- [ ] Optimiser le cache des requêtes API

---

## Support

Pour toute question ou problème d'intégration, contactez l'équipe backend.
