# Guide API - CRUD Templates de Contrats (Frontend)

## Base URL
```
http://127.0.0.1:3000/contract-templates
```

## Authentication
Toutes les requêtes nécessitent un header d'authentification :
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📋 READ - Lire les templates

### 1. Récupérer tous les templates
```typescript
GET /contract-templates
```

**Query Parameters (optionnels) :**
- `contract_type_id` : Filtrer par type de contrat (UUID)
- `is_active` : Filtrer par statut actif (`"true"` ou `"false"`)

**Exemple :**
```typescript
// Tous les templates
const response = await fetch('http://127.0.0.1:3000/contract-templates', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Filtrer par type de contrat
const response = await fetch('http://127.0.0.1:3000/contract-templates?contract_type_id=82f38e35-72a6-42bf-9e04-48f1089c31d7', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Contrat de Location Standard",
      "description": "Template par défaut...",
      "contract_type_id": "uuid",
      "organization_id": "uuid",
      "content": "<html>...</html>",
      "structure": { ... },
      "is_active": true,
      "is_default": false,
      "version": 1,
      "created_at": "2025-12-17T...",
      "contract_type": {
        "id": "uuid",
        "name": "Location"
      },
      "organization": {
        "id": "uuid",
        "name": "Ma Boutique",
        "slug": "ma-boutique"
      }
    }
  ]
}
```

**Notes importantes :**
- ✅ Les templates supprimés (`deleted_at != null`) sont automatiquement filtrés
- ✅ Retourne les templates de l'organisation + les templates globaux
- ✅ Triés par `is_default DESC, created_at DESC`

---

### 2. Récupérer un template par ID
```typescript
GET /contract-templates/:id
```

**Exemple :**
```typescript
const response = await fetch('http://127.0.0.1:3000/contract-templates/e8d0e54a-5519-4d4f-a63d-20f889b9effc', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Contrat de Location Standard",
    ...
  }
}
```

**Erreurs possibles :**
- `404` : Template non trouvé ou supprimé
- `401` : Non authentifié

---

## ➕ CREATE - Créer un template

```typescript
POST /contract-templates
```

**Body (JSON) :**
```json
{
  "name": "Nom du template",                    // Requis
  "description": "Description du template",     // Optionnel
  "contract_type_id": "uuid",                   // Requis
  "structure": {                                 // Requis (ou content)
    "version": "2.0",
    "metadata": {
      "name": "...",
      "description": "...",
      "category": "location"
    },
    "sections": [...]
  },
  "content": "<html>...</html>",                 // Optionnel (legacy)
  "is_default": false,                          // Optionnel (défaut: false)
  "is_active": true                             // Optionnel (défaut: true)
}
```

**Exemple complet :**
```typescript
const response = await fetch('http://127.0.0.1:3000/contract-templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Contrat de Location Standard",
    description: "Template par défaut pour les contrats de location",
    contract_type_id: "82f38e35-72a6-42bf-9e04-48f1089c31d7",
    structure: {
      version: "2.0",
      metadata: {
        name: "Contrat de Location Standard",
        description: "Template par défaut",
        category: "location"
      },
      sections: [
        {
          id: "header",
          type: "header",
          content: {
            title: "Contrat de Location",
            subtitle: "Contrat n° {{contract_number}}"
          }
        }
      ]
    },
    is_active: true
  })
});
```

**Réponse succès (201) :**
```json
{
  "success": true,
  "data": {
    "id": "nouveau-uuid",
    "name": "Contrat de Location Standard",
    ...
  }
}
```

**Erreurs possibles :**
- `400` : Champs requis manquants ou structure invalide
- `500` : Erreur serveur (ex: contrainte d'unicité violée)

**Contraintes importantes :**
- ✅ Un seul template **actif + par défaut** par `contract_type_id` et `organization_id`
- ✅ Plusieurs templates **inactifs** autorisés
- ✅ Plusieurs templates **non-default** autorisés

---

## ✏️ UPDATE - Modifier un template

```typescript
PUT /contract-templates/:id
```

**Body (JSON) - Tous les champs sont optionnels :**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "content": "<html>...</html>",
  "structure": { ... },
  "is_active": false,
  "is_default": true
}
```

**Exemple :**
```typescript
const response = await fetch('http://127.0.0.1:3000/contract-templates/e8d0e54a-5519-4d4f-a63d-20f889b9effc', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Nouveau nom",
    is_active: false
  })
});
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nouveau nom",
    "version": 2,
    ...
  }
}
```

**Notes importantes :**
- ✅ Le champ `version` est automatiquement incrémenté
- ✅ Le champ `html_cache` est invalidé si `content` ou `structure` change
- ✅ Si `is_default` passe à `true`, les autres templates du même type seront mis à `false`

---

## 🗑️ DELETE - Supprimer un template (soft delete)

```typescript
DELETE /contract-templates/:id
```

**Exemple :**
```typescript
const response = await fetch('http://127.0.0.1:3000/contract-templates/e8d0e54a-5519-4d4f-a63d-20f889b9effc', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Template deleted"
}
```

**⚠️ IMPORTANT - Soft Delete :**
- Le template n'est **PAS physiquement supprimé** de la base de données
- Un champ `deleted_at` est rempli avec la date/heure de suppression
- Le template **n'apparaît plus** dans les résultats de `GET /contract-templates`
- Le template peut être **restauré** en mettant `deleted_at` à `null` via une requête SQL

**📌 Action requise côté frontend après suppression :**
```typescript
// ✅ BON : Recharger les données après suppression
await fetch(`/contract-templates/${id}`, { method: 'DELETE', ... });
await refetchTemplates(); // Rappeler GET /contract-templates

// ❌ MAUVAIS : Ne rien faire après la suppression
await fetch(`/contract-templates/${id}`, { method: 'DELETE', ... });
// Le template reste affiché car les données ne sont pas rechargées
```

---

## 📄 DUPLICATE - Dupliquer un template

```typescript
POST /contract-templates/:id/duplicate
```

**Exemple :**
```typescript
const response = await fetch('http://127.0.0.1:3000/contract-templates/e8d0e54a-5519-4d4f-a63d-20f889b9effc/duplicate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Réponse succès (201) :**
```json
{
  "success": true,
  "data": {
    "id": "nouveau-uuid",
    "name": "Contrat de Location Standard (Copie)",
    "is_default": false,
    ...
  }
}
```

**Notes :**
- ✅ Le nom est automatiquement suffixé avec " (Copie)"
- ✅ `is_default` est forcé à `false`
- ✅ Le template est toujours créé pour l'organisation courante

---

## 👁️ PREVIEW - Prévisualiser un template

```typescript
GET /contract-templates/:id/preview?contract_id=xxx
```

**Query Parameters :**
- `contract_id` (optionnel) : ID d'un contrat existant pour utiliser ses vraies données

**Exemple :**
```typescript
// Avec données de démo
const response = await fetch('http://127.0.0.1:3000/contract-templates/e8d0e54a-5519-4d4f-a63d-20f889b9effc/preview', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Avec un vrai contrat
const response = await fetch('http://127.0.0.1:3000/contract-templates/e8d0e54a-5519-4d4f-a63d-20f889b9effc/preview?contract_id=29baaa5c-a6b7-4d91-8323-e81b5521cbad', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "html": "<html>...</html>"
  }
}
```

---

## ✅ VALIDATE - Valider la syntaxe d'un template

```typescript
POST /contract-templates/validate
```

**Body (JSON) :**
```json
{
  "content": "<html>{{customer_firstname}}</html>"
}
```

**Exemple :**
```typescript
const response = await fetch('http://127.0.0.1:3000/contract-templates/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: "<html>{{customer_firstname}}</html>"
  })
});
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

**Réponse erreur (200 mais validation échouée) :**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "error": "Syntax error: unclosed tag at line 5"
  }
}
```

---

## 🛡️ Gestion des erreurs

### Codes de statut HTTP
- `200` : Succès (GET, PUT, DELETE)
- `201` : Créé (POST)
- `400` : Requête invalide (champs manquants, validation échouée)
- `401` : Non authentifié
- `403` : Accès refusé
- `404` : Ressource non trouvée
- `500` : Erreur serveur

### Format de réponse d'erreur
```json
{
  "success": false,
  "error": "Message d'erreur",
  "details": "Détails techniques (optionnel)"
}
```

---

## 📝 Exemple complet d'intégration Frontend

### Service API TypeScript
```typescript
// services/contractTemplates.ts

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  contract_type_id: string;
  structure?: any;
  content?: string;
  is_active: boolean;
  is_default: boolean;
  version: number;
}

class ContractTemplatesAPI {
  private baseUrl = 'http://127.0.0.1:3000/contract-templates';

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data.data;
  }

  // GET all
  async getAll(filters?: { contract_type_id?: string; is_active?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.contract_type_id) params.append('contract_type_id', filters.contract_type_id);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(query) as Promise<ContractTemplate[]>;
  }

  // GET by ID
  async getById(id: string) {
    return this.request(`/${id}`) as Promise<ContractTemplate>;
  }

  // CREATE
  async create(template: Partial<ContractTemplate>) {
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(template)
    }) as Promise<ContractTemplate>;
  }

  // UPDATE
  async update(id: string, updates: Partial<ContractTemplate>) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }) as Promise<ContractTemplate>;
  }

  // DELETE
  async delete(id: string) {
    return this.request(`/${id}`, {
      method: 'DELETE'
    });
  }

  // DUPLICATE
  async duplicate(id: string) {
    return this.request(`/${id}/duplicate`, {
      method: 'POST'
    }) as Promise<ContractTemplate>;
  }

  // PREVIEW
  async preview(id: string, contractId?: string) {
    const query = contractId ? `?contract_id=${contractId}` : '';
    return this.request(`/${id}/preview${query}`) as Promise<{ html: string }>;
  }
}

export const contractTemplatesAPI = new ContractTemplatesAPI();
```

### Composant React Example
```typescript
// components/ContractTemplates.tsx
import { useState, useEffect } from 'react';
import { contractTemplatesAPI } from '../services/contractTemplates';

export function ContractTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les templates
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await contractTemplatesAPI.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Supprimer un template
  const handleDelete = async (id: string) => {
    try {
      await contractTemplatesAPI.delete(id);
      // ✅ IMPORTANT: Recharger les données après suppression
      await loadTemplates();
      // Ou mise à jour optimiste:
      // setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // Créer un template
  const handleCreate = async (newTemplate) => {
    try {
      await contractTemplatesAPI.create(newTemplate);
      // ✅ IMPORTANT: Recharger les données après création
      await loadTemplates();
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  return (
    <div>
      {loading ? <p>Chargement...</p> : (
        <ul>
          {templates.map(template => (
            <li key={template.id}>
              {template.name}
              <button onClick={() => handleDelete(template.id)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## ⚠️ Points d'attention

### 1. Rechargement après opérations
**TOUJOURS recharger les données après :**
- ✅ CREATE (POST)
- ✅ UPDATE (PUT)
- ✅ DELETE
- ✅ DUPLICATE

### 2. Gestion du cache
Si vous utilisez React Query ou SWR :
```typescript
// Invalider le cache après mutation
mutate('/contract-templates'); // SWR
queryClient.invalidateQueries(['templates']); // React Query
```

### 3. Contraintes d'unicité
- Un seul template **actif + par défaut** par type de contrat
- Tenter de créer un doublon retournera une erreur 500

### 4. Soft Delete
- Les templates supprimés restent en base
- Pour restaurer : requête SQL directe sur `deleted_at`
- Pour purge définitive : requête SQL `DELETE FROM`

---

## 🔍 Debug

### Vérifier les templates en base
```sql
SELECT id, name, is_active, is_default, deleted_at
FROM "ContractTemplate"
WHERE deleted_at IS NULL;
```

### Vérifier un template supprimé
```sql
SELECT id, name, deleted_at
FROM "ContractTemplate"
WHERE id = 'uuid';
```

### Restaurer un template supprimé
```sql
UPDATE "ContractTemplate"
SET deleted_at = NULL
WHERE id = 'uuid';
```
