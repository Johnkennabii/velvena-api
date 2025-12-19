# 🗑️ Guide Frontend - Suppression de Compte (Version 2 - Différenciation Admin/Owner)

## 🆕 Nouveauté : Suppression selon le rôle

### Pour les **ADMINS** 🔓
- ✅ **Pas de validation par email**
- ✅ **Suppression immédiate** après confirmation
- ✅ Ne nécessite **aucun code de validation**

### Pour les **OWNERS (Managers)** 📧
- ✅ **Validation par email obligatoire**
- ✅ Code à **6 chiffres** envoyé à **l'email de l'organisation** (PAS à l'email de l'utilisateur)
- ✅ Code valide pendant **30 minutes**
- ⚠️ **L'email de l'organisation doit être configuré** dans les paramètres

---

## 🔄 Flux utilisateur

### Flux ADMIN (simplifié) 🔓

```
┌────────────────────────────────────────────────┐
│  1. Admin clique "Supprimer mon compte"       │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  2. Modal de confirmation                      │
│     ⚠️ Action irréversible                     │
│     ⚠️ Toutes les données seront supprimées    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  3. POST /account/request-deletion             │
│     └─> Response: "Can proceed immediately"    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  4. Modal de confirmation finale               │
│     └─> Bouton "Confirmer la suppression"      │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  5. POST /account/confirm-deletion             │
│     body: { validationCode: "" }               │
│     └─> Suppression immédiate                  │
└────────────────────────────────────────────────┘
```

### Flux OWNER (avec email) 📧

```
┌────────────────────────────────────────────────┐
│  1. Owner clique "Supprimer mon compte"       │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  2. Modal de confirmation                      │
│     ⚠️ Code sera envoyé à l'email de l'orga    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  3. POST /account/request-deletion             │
│     └─> Email envoyé avec code à 6 chiffres    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  4. Modal de saisie du code (30 min)           │
│     [_] [_] [_] [_] [_] [_]                    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  5. POST /account/confirm-deletion             │
│     body: { validationCode: "123456" }         │
│     └─> Validation + Suppression               │
└────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1️⃣ POST /account/request-deletion

**Comportement selon le rôle:**

#### Pour ADMIN
```json
// Request
POST /account/request-deletion
Authorization: Bearer <ADMIN_JWT>

// Response
{
  "success": true,
  "message": "Admin deletion request approved. You can proceed immediately.",
  "expiresAt": "2025-12-20T14:00:00.000Z"
}
```

#### Pour OWNER
```json
// Request
POST /account/request-deletion
Authorization: Bearer <OWNER_JWT>

// Response (succès)
{
  "success": true,
  "message": "Validation code sent to organization email: contact@velvena.com. Code expires in 30 minutes.",
  "expiresAt": "2025-12-19T14:30:00.000Z"
}

// Response (erreur - email organisation manquant)
{
  "success": false,
  "error": "Organization email is required for validation. Please set it in organization settings."
}
```

---

### 2️⃣ POST /account/confirm-deletion

**Comportement selon le rôle:**

#### Pour ADMIN (sans code)
```json
// Request
POST /account/confirm-deletion
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "validationCode": ""  // ✅ Vide pour les admins
}

// OU

{
  "validationCode": "ADMIN_BYPASS"
}

// Response
{
  "success": true,
  "message": "Account successfully deleted. Export file has been sent to your email.",
  "deletedData": {
    "users": 5,
    "dresses": 120,
    "contracts": 45,
    "customers": 89,
    "prospects": 34
  }
}
```

#### Pour OWNER (avec code email)
```json
// Request
POST /account/confirm-deletion
Authorization: Bearer <OWNER_JWT>
Content-Type: application/json

{
  "validationCode": "123456"  // ✅ Code reçu par email
}

// Response (succès)
{
  "success": true,
  "message": "Account successfully deleted. Export file has been sent to your email.",
  "deletedData": {
    "users": 5,
    "dresses": 120,
    "contracts": 45,
    "customers": 89,
    "prospects": 34
  }
}

// Response (code invalide)
{
  "success": false,
  "error": "Invalid validation code"
}

// Response (code expiré)
{
  "success": false,
  "error": "Validation code expired. Please request deletion again."
}
```

---

## 💻 Exemples de code TypeScript/React

### Service API mis à jour

```typescript
// services/accountDeletionService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface DeleteAccountRequestResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  error?: string;
}

export interface DeleteAccountConfirmResponse {
  success: boolean;
  message: string;
  deletedData?: {
    users: number;
    dresses: number;
    contracts: number;
    customers: number;
    prospects: number;
  };
  error?: string;
}

/**
 * Step 1: Request account deletion
 * - ADMINS: No email validation, can proceed immediately
 * - OWNERS: Email validation code sent to organization email
 */
export const requestAccountDeletion = async (): Promise<DeleteAccountRequestResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/account/request-deletion`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
};

/**
 * Step 2: Confirm account deletion
 * - ADMINS: Send empty string or "ADMIN_BYPASS"
 * - OWNERS: Send 6-digit code from organization email
 */
export const confirmAccountDeletion = async (
  validationCode: string
): Promise<DeleteAccountConfirmResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/account/confirm-deletion`,
    { validationCode },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
};
```

---

### Hook personnalisé pour détecter le rôle

```typescript
// hooks/useAccountDeletionFlow.ts
import { useAuth } from '@/contexts/AuthContext';

export type DeletionFlow = 'admin' | 'owner' | null;

export const useAccountDeletionFlow = () => {
  const { user } = useAuth();

  const getFlow = (): DeletionFlow => {
    const role = user?.role?.toLowerCase();

    if (role === 'admin') return 'admin';
    if (role === 'owner') return 'owner';
    return null;
  };

  const flow = getFlow();

  return {
    flow,
    isAdmin: flow === 'admin',
    isOwner: flow === 'owner',
    canDelete: flow !== null,
    requiresEmailValidation: flow === 'owner',
  };
};
```

---

### Composant principal - Gestion des deux flux

```tsx
// pages/AccountSettings.tsx
import React, { useState } from 'react';
import { useAccountDeletionFlow } from '@/hooks/useAccountDeletionFlow';
import { AdminDeletionFlow } from '@/components/AccountDeletion/AdminDeletionFlow';
import { OwnerDeletionFlow } from '@/components/AccountDeletion/OwnerDeletionFlow';

export const AccountSettings: React.FC = () => {
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const { flow, isAdmin, isOwner, canDelete } = useAccountDeletionFlow();

  if (!canDelete) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
        ⚠️ Seuls les propriétaires et administrateurs peuvent supprimer le compte de l'organisation.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Paramètres du compte</h1>

      {/* Danger Zone */}
      <div className="mt-12 border-2 border-red-300 rounded-lg p-6 bg-red-50">
        <h2 className="text-xl font-bold text-red-800 mb-2">
          ⚠️ Zone dangereuse
        </h2>

        {isAdmin && (
          <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded mb-4">
            🔓 <strong>Mode Admin</strong> : Vous pouvez supprimer le compte sans validation par email.
          </div>
        )}

        {isOwner && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            📧 <strong>Mode Owner</strong> : Un code de validation sera envoyé à l'email de l'organisation.
          </div>
        )}

        <p className="text-red-700 mb-4">
          La suppression de votre compte est une action irréversible. Toutes vos données seront
          définitivement supprimées.
        </p>

        <button
          onClick={() => setShowDeletionModal(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* Conditional Flow Rendering */}
      {showDeletionModal && isAdmin && (
        <AdminDeletionFlow
          isOpen={showDeletionModal}
          onClose={() => setShowDeletionModal(false)}
        />
      )}

      {showDeletionModal && isOwner && (
        <OwnerDeletionFlow
          isOpen={showDeletionModal}
          onClose={() => setShowDeletionModal(false)}
        />
      )}
    </div>
  );
};
```

---

### Flux ADMIN (suppression immédiate)

```tsx
// components/AccountDeletion/AdminDeletionFlow.tsx
import React, { useState } from 'react';
import { requestAccountDeletion, confirmAccountDeletion } from '@/services/accountDeletionService';
import { useNavigate } from 'react-router-dom';

interface AdminDeletionFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDeletionFlow: React.FC<AdminDeletionFlowProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'confirm' | 'deleting' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedData, setDeletedData] = useState<any>(null);
  const navigate = useNavigate();

  const handleRequestDeletion = async () => {
    try {
      setLoading(true);
      setError(null);

      await requestAccountDeletion();
      setStep('deleting');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la demande');
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    try {
      setLoading(true);
      setError(null);

      // Admin can send empty string or "ADMIN_BYPASS"
      const result = await confirmAccountDeletion('');

      if (result.success) {
        setDeletedData(result.deletedData);
        setStep('success');

        // Logout and redirect
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login?deleted=true');
        }, 3000);
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Step 1: Confirm */}
        {step === 'confirm' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              🔓 Suppression Admin
            </h2>

            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                En tant qu'admin, vous pouvez supprimer le compte <strong>sans validation par email</strong>.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <h3 className="font-bold text-red-800 mb-2">⚠️ Action irréversible</h3>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Toutes les données seront supprimées</li>
                <li>• Abonnement Stripe annulé</li>
                <li>• Export de données envoyé par email</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleRequestDeletion}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Continuer'}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Final Confirmation */}
        {step === 'deleting' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Confirmation finale
            </h2>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-800 font-bold mb-2">
                Êtes-vous absolument certain ?
              </p>
              <p className="text-red-700 text-sm">
                Cette action ne peut pas être annulée. Toutes les données de l'organisation seront
                définitivement supprimées.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <button
                onClick={handleConfirmDeletion}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                disabled={loading}
              >
                {loading ? 'Suppression en cours...' : 'OUI, SUPPRIMER DÉFINITIVEMENT'}
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={loading}
              >
                Non, annuler
              </button>
            </div>
          </>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <>
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">✅</div>
              <h2 className="text-2xl font-bold text-green-600">
                Compte supprimé
              </h2>
            </div>

            {deletedData && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h3 className="font-bold text-blue-800 mb-2">📊 Données supprimées</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• {deletedData.users} utilisateurs</li>
                  <li>• {deletedData.dresses} robes</li>
                  <li>• {deletedData.contracts} contrats</li>
                  <li>• {deletedData.customers} clients</li>
                  <li>• {deletedData.prospects} prospects</li>
                </ul>
              </div>
            )}

            <p className="text-center text-gray-600 text-sm">
              Redirection dans quelques secondes...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
```

---

### Flux OWNER (avec validation email)

```tsx
// components/AccountDeletion/OwnerDeletionFlow.tsx
import React, { useState } from 'react';
import { DeleteAccountModal } from './DeleteAccountModal';
import { ValidationCodeModal } from './ValidationCodeModal';
import { DeletionSuccessModal } from './DeletionSuccessModal';

interface OwnerDeletionFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerDeletionFlow: React.FC<OwnerDeletionFlowProps> = ({ isOpen, onClose }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(isOpen);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [deletedData, setDeletedData] = useState<any>(null);

  const handleCodeSent = (expires: string) => {
    setExpiresAt(expires);
    setShowDeleteModal(false);
    setShowCodeModal(true);
  };

  const handleDeletionSuccess = (data: any) => {
    setDeletedData(data);
    setShowCodeModal(false);
    setShowSuccessModal(true);
  };

  return (
    <>
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          onClose();
        }}
        onCodeSent={handleCodeSent}
      />

      <ValidationCodeModal
        isOpen={showCodeModal}
        expiresAt={expiresAt}
        onClose={() => {
          setShowCodeModal(false);
          onClose();
        }}
        onSuccess={handleDeletionSuccess}
      />

      <DeletionSuccessModal
        isOpen={showSuccessModal}
        deletedData={deletedData}
      />
    </>
  );
};
```

(Les composants `DeleteAccountModal`, `ValidationCodeModal`, et `DeletionSuccessModal` restent identiques à la version précédente de la documentation)

---

## 📧 Emails reçus

### Email pour OWNER uniquement (validation)

```
Objet : 🚨 Account Deletion Confirmation - Validation Code

⚠️ Account Deletion Request

Un code de validation a été demandé pour supprimer le compte de [Organization Name].

┌──────────────────────────┐
│   Code de Validation     │
│                          │
│       123456             │
│                          │
│  Expire dans 30 minutes  │
└──────────────────────────┘

⚠️ Attention : Cette action est irréversible

Si vous n'avez pas demandé cette suppression, ignorez cet email.
```

### Email de confirmation (ADMIN et OWNER)

Identique pour les deux rôles, avec le ZIP en pièce jointe.

---

## 🔒 Résumé des Permissions

| Rôle | Peut supprimer ? | Validation email ? | Email utilisé |
|------|-----------------|-------------------|---------------|
| **Admin** | ✅ Oui | ❌ Non | - |
| **Owner** | ✅ Oui | ✅ Oui (30 min) | Email de l'**organization** |
| **User** | ❌ Non | - | - |

---

## ✅ Checklist Frontend

### Phase 1 : Détection du rôle
- [ ] Créer le hook `useAccountDeletionFlow`
- [ ] Détecter si l'utilisateur est Admin ou Owner
- [ ] Afficher le bon message selon le rôle

### Phase 2 : Flux Admin
- [ ] Créer `AdminDeletionFlow` component
- [ ] Modal de confirmation unique
- [ ] Appel API sans code de validation
- [ ] Gestion de la déconnexion

### Phase 3 : Flux Owner
- [ ] Créer `OwnerDeletionFlow` component
- [ ] Modal de demande avec info "email organisation"
- [ ] Modal de saisie du code à 6 chiffres
- [ ] Timer de 30 minutes
- [ ] Gestion des erreurs (code invalide, expiré)

### Phase 4 : Tests
- [ ] Tester en tant qu'Admin (suppression directe)
- [ ] Tester en tant qu'Owner (avec code email)
- [ ] Vérifier que l'email est envoyé à l'organisation
- [ ] Tester l'expiration du code (30 min)

---

**Dernière mise à jour** : 19 décembre 2025
**Version API** : 1.1.0 (Role-based deletion)
