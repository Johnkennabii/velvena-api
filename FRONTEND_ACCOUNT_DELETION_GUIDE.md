# 🗑️ Guide Frontend - Suppression de Compte avec Export de Données

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Flux utilisateur](#flux-utilisateur)
3. [API Endpoints](#api-endpoints)
4. [Exemples de code](#exemples-de-code)
5. [Composants UI recommandés](#composants-ui-recommandés)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Sécurité et permissions](#sécurité-et-permissions)

---

## 🎯 Vue d'ensemble

Le système de suppression de compte permet aux propriétaires et administrateurs d'organisations de supprimer définitivement leur compte avec un processus en deux étapes :

1. **Demande de suppression** : Génère un code de validation à 6 chiffres envoyé par email
2. **Confirmation** : Valide le code, exporte toutes les données, et supprime le compte

### ⚠️ Points Importants

- ✅ Action **IRRÉVERSIBLE**
- ✅ Réservé aux rôles : **Owner** et **Admin** uniquement
- ✅ Validation par **email obligatoire** (code à 6 chiffres)
- ✅ Export automatique des données avant suppression
- ✅ Conforme **RGPD** (droit à la portabilité et à l'effacement)
- ✅ Code valide pendant **30 minutes**

---

## 🔄 Flux Utilisateur

```
┌─────────────────────────────────────────────────────────┐
│  1. Utilisateur clique "Supprimer mon compte"          │
│     └─> Vérification du rôle (owner/admin)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. Modal de confirmation avec avertissements           │
│     ⚠️ Action irréversible                              │
│     ⚠️ Toutes les données seront supprimées             │
│     ⚠️ Abonnement Stripe annulé                         │
│     └─> Bouton "Continuer"                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. POST /account/request-deletion                      │
│     └─> Email envoyé avec code à 6 chiffres             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. Modal de saisie du code (30 min)                    │
│     [_] [_] [_] [_] [_] [_]                             │
│     └─> Bouton "Confirmer la suppression"               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. POST /account/confirm-deletion                      │
│     ├─> Export des données (ZIP)                        │
│     ├─> Annulation abonnement Stripe                    │
│     ├─> Suppression de toutes les données               │
│     └─> Email de confirmation avec ZIP                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  6. Déconnexion automatique + redirection               │
│     └─> Message de succès                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1️⃣ Demander la suppression de compte

**Endpoint:** `POST /account/request-deletion`

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:** Aucun (l'organization et l'utilisateur sont identifiés via le JWT)

**Réponse 200 (Succès):**
```json
{
  "success": true,
  "message": "Validation code sent to contact@velvena.com. Code expires in 30 minutes.",
  "expiresAt": "2025-12-19T14:30:00.000Z"
}
```

**Réponse 400 (Erreur - Pas autorisé):**
```json
{
  "success": false,
  "error": "Only organization owners and admins can request account deletion"
}
```

**Réponse 401 (Non authentifié):**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 2️⃣ Confirmer la suppression avec le code

**Endpoint:** `POST /account/confirm-deletion`

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "validationCode": "123456"
}
```

**Réponse 200 (Succès):**
```json
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

**Réponses d'erreur 400:**

**Code invalide:**
```json
{
  "success": false,
  "error": "Invalid validation code"
}
```

**Code expiré:**
```json
{
  "success": false,
  "error": "Validation code expired. Please request deletion again."
}
```

**Aucune demande en cours:**
```json
{
  "success": false,
  "error": "No deletion request found. Please request deletion first."
}
```

**Utilisateur différent:**
```json
{
  "success": false,
  "error": "Only the user who requested deletion can confirm it"
}
```

---

## 💻 Exemples de Code

### React + Axios Example

```typescript
// services/accountDeletionService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
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
 * Sends a 6-digit validation code to the user's email
 */
export const requestAccountDeletion = async (): Promise<DeleteAccountResponse> => {
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
 * Step 2: Confirm account deletion with validation code
 */
export const confirmAccountDeletion = async (
  validationCode: string
): Promise<DeleteAccountResponse> => {
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

### Composant React - Étape 1 : Demande de suppression

```tsx
// components/AccountDeletion/DeleteAccountModal.tsx
import React, { useState } from 'react';
import { requestAccountDeletion } from '@/services/accountDeletionService';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeSent: (expiresAt: string) => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onCodeSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestDeletion = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await requestAccountDeletion();

      if (response.success && response.expiresAt) {
        onCodeSent(response.expiresAt);
      } else {
        setError(response.error || 'Failed to request deletion');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-red-600">
            ⚠️ Supprimer mon compte
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <h3 className="font-bold text-red-800 mb-2">
            ⚠️ Cette action est IRRÉVERSIBLE
          </h3>
          <ul className="text-red-700 text-sm space-y-1">
            <li>• Toutes vos données seront supprimées définitivement</li>
            <li>• Votre abonnement Stripe sera annulé</li>
            <li>• Tous vos utilisateurs perdront l'accès</li>
            <li>• Vos contrats, clients et prospects seront supprimés</li>
          </ul>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <h3 className="font-bold text-blue-800 mb-2">
            📦 Export de vos données
          </h3>
          <p className="text-blue-700 text-sm">
            Avant la suppression, nous vous enverrons un fichier ZIP contenant :
          </p>
          <ul className="text-blue-700 text-sm space-y-1 mt-2">
            <li>• Tous vos contrats signés (PDF)</li>
            <li>• Vos factures Stripe (PDF)</li>
            <li>• Vos clients et prospects (JSON + CSV)</li>
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
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
            {loading ? 'Envoi en cours...' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Composant React - Étape 2 : Validation du code

```tsx
// components/AccountDeletion/ValidationCodeModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { confirmAccountDeletion } from '@/services/accountDeletionService';
import { useNavigate } from 'react-router-dom';

interface ValidationCodeModalProps {
  isOpen: boolean;
  expiresAt: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ValidationCodeModal: React.FC<ValidationCodeModalProps> = ({
  isOpen,
  expiresAt,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
  };

  const handleConfirm = async () => {
    const validationCode = code.join('');
    if (validationCode.length !== 6) {
      setError('Veuillez saisir les 6 chiffres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await confirmAccountDeletion(validationCode);

      if (response.success) {
        // Success! Show summary and logout
        onSuccess();

        // Logout user
        localStorage.removeItem('token');

        // Redirect to homepage or login with success message
        setTimeout(() => {
          navigate('/login?deleted=true');
        }, 3000);
      } else {
        setError(response.error || 'Code invalide');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const timeLeft = Math.max(0, Math.floor((expiresDate.getTime() - now.getTime()) / 1000));
  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">📧</div>
          <h2 className="text-2xl font-bold text-gray-800">
            Code de validation
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Nous avons envoyé un code à 6 chiffres à votre adresse email
          </p>
        </div>

        {/* Timer */}
        <div className="text-center mb-4">
          <div className="inline-block bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded">
            ⏱️ Expire dans {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Code Input */}
        <div className="flex justify-center space-x-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {/* Warning */}
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
          <p className="text-red-700 text-sm">
            ⚠️ En confirmant, votre compte sera <strong>définitivement supprimé</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleConfirm}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            disabled={loading || code.join('').length !== 6}
          >
            {loading ? 'Suppression en cours...' : 'Confirmer la suppression'}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Composant React - Écran de succès

```tsx
// components/AccountDeletion/DeletionSuccessModal.tsx
import React from 'react';

interface DeletionSuccessModalProps {
  isOpen: boolean;
  deletedData?: {
    users: number;
    dresses: number;
    contracts: number;
    customers: number;
    prospects: number;
  };
}

export const DeletionSuccessModal: React.FC<DeletionSuccessModalProps> = ({
  isOpen,
  deletedData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Success Icon */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">✅</div>
          <h2 className="text-2xl font-bold text-green-600">
            Compte supprimé avec succès
          </h2>
        </div>

        {/* Summary */}
        {deletedData && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <h3 className="font-bold text-blue-800 mb-2">
              📊 Données supprimées
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• {deletedData.users} utilisateurs</li>
              <li>• {deletedData.dresses} robes</li>
              <li>• {deletedData.contracts} contrats</li>
              <li>• {deletedData.customers} clients</li>
              <li>• {deletedData.prospects} prospects</li>
            </ul>
          </div>
        )}

        {/* Export info */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <h3 className="font-bold text-green-800 mb-2">
            📦 Export de vos données
          </h3>
          <p className="text-green-700 text-sm">
            Nous avons envoyé un email avec toutes vos données en pièce jointe (fichier ZIP).
          </p>
        </div>

        {/* Redirect message */}
        <p className="text-center text-gray-600 text-sm">
          Vous allez être redirigé dans quelques secondes...
        </p>
      </div>
    </div>
  );
};
```

---

### Page complète - Paramètres de compte

```tsx
// pages/AccountSettings.tsx
import React, { useState } from 'react';
import { DeleteAccountModal } from '@/components/AccountDeletion/DeleteAccountModal';
import { ValidationCodeModal } from '@/components/AccountDeletion/ValidationCodeModal';
import { DeletionSuccessModal } from '@/components/AccountDeletion/DeletionSuccessModal';

export const AccountSettings: React.FC = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [deletedData, setDeletedData] = useState<any>(null);

  // Assuming you have user context
  const userRole = 'owner'; // or 'admin' - get from your auth context

  const canDeleteAccount = userRole === 'owner' || userRole === 'admin';

  const handleCodeSent = (expires: string) => {
    setExpiresAt(expires);
    setShowDeleteModal(false);
    setShowCodeModal(true);
  };

  const handleDeletionSuccess = () => {
    setShowCodeModal(false);
    setShowSuccessModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Paramètres du compte</h1>

      {/* Other settings sections... */}

      {/* Danger Zone */}
      <div className="mt-12 border-2 border-red-300 rounded-lg p-6 bg-red-50">
        <h2 className="text-xl font-bold text-red-800 mb-2">
          ⚠️ Zone dangereuse
        </h2>
        <p className="text-red-700 mb-4">
          La suppression de votre compte est une action irréversible. Toutes vos données seront
          définitivement supprimées.
        </p>

        {canDeleteAccount ? (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
            ⚠️ Seuls les propriétaires et administrateurs peuvent supprimer le compte de l'organisation.
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onCodeSent={handleCodeSent}
      />

      <ValidationCodeModal
        isOpen={showCodeModal}
        expiresAt={expiresAt}
        onClose={() => setShowCodeModal(false)}
        onSuccess={handleDeletionSuccess}
      />

      <DeletionSuccessModal
        isOpen={showSuccessModal}
        deletedData={deletedData}
      />
    </div>
  );
};
```

---

## 🎨 Composants UI Recommandés

### Recommandations de design

1. **Couleurs** :
   - Rouge pour les actions destructives (`bg-red-600`, `text-red-700`)
   - Jaune pour les avertissements (`bg-yellow-100`, `border-yellow-400`)
   - Vert pour le succès (`bg-green-50`, `text-green-700`)
   - Bleu pour les informations (`bg-blue-50`, `text-blue-700`)

2. **Icônes** :
   - ⚠️ Pour les avertissements
   - 🗑️ Pour la suppression
   - 📧 Pour l'email/validation
   - ✅ Pour le succès
   - 📦 Pour l'export de données
   - ⏱️ Pour le timer

3. **Animations** :
   - Fade in/out pour les modals
   - Loading spinner pendant les requêtes
   - Countdown timer pour l'expiration du code

---

## 🚨 Gestion des Erreurs

### Erreurs courantes et messages

| Code | Erreur | Message utilisateur | Action suggérée |
|------|--------|-------------------|-----------------|
| 400 | Code invalide | "Le code saisi est incorrect. Veuillez vérifier et réessayer." | Permettre une nouvelle tentative |
| 400 | Code expiré | "Le code a expiré. Veuillez demander un nouveau code." | Retour à l'étape 1 |
| 400 | Pas de demande | "Aucune demande de suppression en cours." | Retour à l'étape 1 |
| 400 | Utilisateur différent | "Seul l'utilisateur ayant demandé la suppression peut la confirmer." | Bloquer l'action |
| 401 | Non authentifié | "Votre session a expiré. Veuillez vous reconnecter." | Redirection vers login |
| 403 | Pas autorisé | "Vous n'avez pas les permissions nécessaires." | Afficher message d'erreur |
| 500 | Erreur serveur | "Une erreur est survenue. Veuillez réessayer plus tard." | Proposer de contacter le support |

### Intercepteur Axios pour les erreurs

```typescript
// utils/axiosInterceptor.ts
import axios from 'axios';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expirée
      localStorage.removeItem('token');
      window.location.href = '/login?sessionExpired=true';
    }
    return Promise.reject(error);
  }
);
```

---

## 🔒 Sécurité et Permissions

### Vérification côté frontend

```typescript
// hooks/useCanDeleteAccount.ts
import { useAuth } from '@/contexts/AuthContext';

export const useCanDeleteAccount = () => {
  const { user } = useAuth();

  const canDelete = user?.role === 'owner' || user?.role === 'admin';

  return {
    canDelete,
    reason: !canDelete
      ? 'Seuls les propriétaires et administrateurs peuvent supprimer le compte'
      : null,
  };
};
```

### Utilisation dans un composant

```tsx
const { canDelete, reason } = useCanDeleteAccount();

if (!canDelete) {
  return (
    <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
      ⚠️ {reason}
    </div>
  );
}
```

---

## 📧 Email reçu par l'utilisateur

L'utilisateur recevra **2 emails** :

### Email 1 - Code de validation (Étape 1)

```
Objet : 🚨 Account Deletion Confirmation - Validation Code

⚠️ Account Deletion Request

A request to delete the account for [Organization Name] has been initiated.

┌──────────────────────────┐
│   Validation Code        │
│                          │
│       123456             │
│                          │
│  Expires in 30 minutes   │
└──────────────────────────┘

⚠️ Warning: This action is irreversible

Confirming this deletion will:
• Permanently delete all your data
• Cancel your Stripe subscription
• Export your data as a ZIP file and send it to this email

If you did not request this deletion, please ignore this email.
```

### Email 2 - Confirmation de suppression avec ZIP (Étape 2)

```
Objet : ✅ Account Deleted - Your Data Export

✅ Account Successfully Deleted

Your organization account has been permanently deleted as requested.

📊 Deleted Data Summary:
• 5 users
• 120 dresses
• 45 contracts
• 89 customers
• 34 prospects

Your data export is attached to this email as a ZIP file.

The ZIP file contains:
• 📄 All signed contracts (PDFs)
• 💳 Stripe invoices (PDFs + JSON metadata)
• 👥 Clients data (JSON + CSV)
• 🔍 Prospects data (JSON + CSV)
• 📋 Export manifest (MANIFEST.json)

Thank you for using Velvena.
```

---

## 🧪 Tests Recommandés

### Tests unitaires

```typescript
// __tests__/accountDeletionService.test.ts
import { requestAccountDeletion, confirmAccountDeletion } from '@/services/accountDeletionService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Account Deletion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request account deletion successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Validation code sent',
        expiresAt: '2025-12-19T14:30:00.000Z',
      },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await requestAccountDeletion();

    expect(result.success).toBe(true);
    expect(result.expiresAt).toBeDefined();
  });

  it('should handle invalid validation code', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          success: false,
          error: 'Invalid validation code',
        },
      },
    });

    await expect(confirmAccountDeletion('000000')).rejects.toThrow();
  });
});
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Setup
- [ ] Créer le service API (`accountDeletionService.ts`)
- [ ] Configurer les variables d'environnement (`REACT_APP_API_URL`)
- [ ] Installer les dépendances nécessaires

### Phase 2 : Composants
- [ ] Créer `DeleteAccountModal` (Étape 1)
- [ ] Créer `ValidationCodeModal` (Étape 2)
- [ ] Créer `DeletionSuccessModal` (Confirmation)
- [ ] Créer le hook `useCanDeleteAccount`

### Phase 3 : Intégration
- [ ] Intégrer dans la page Paramètres
- [ ] Ajouter la vérification des permissions
- [ ] Implémenter la déconnexion automatique après suppression
- [ ] Ajouter la redirection après succès

### Phase 4 : UX
- [ ] Ajouter les animations de transition
- [ ] Implémenter le countdown timer (30 min)
- [ ] Ajouter le focus automatique sur les inputs
- [ ] Implémenter le paste du code à 6 chiffres

### Phase 5 : Tests
- [ ] Tester le flux complet (Demande → Code → Suppression)
- [ ] Tester les cas d'erreur (code invalide, expiré, etc.)
- [ ] Tester les permissions (owner/admin uniquement)
- [ ] Tester la déconnexion et redirection

---

## 🆘 Support et Questions

Pour toute question technique sur l'API :
- Consulter la documentation Swagger : `https://api.velvena.fr/api-docs`
- Endpoint de test : `GET /health`

Points d'attention :
1. Le code de validation expire après **30 minutes**
2. Le ZIP contient **toutes les données** de l'organisation
3. La suppression est **irréversible**
4. Seuls les **owners et admins** peuvent supprimer le compte
5. L'utilisateur est **automatiquement déconnecté** après suppression

---

**Dernière mise à jour** : 19 décembre 2025
**Version API** : 1.0.0
