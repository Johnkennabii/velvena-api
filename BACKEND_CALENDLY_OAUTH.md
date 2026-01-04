# Backend - Endpoint OAuth Calendly

## 📌 Objectif
Créer un endpoint backend pour gérer le callback OAuth de Calendly et sauvegarder les informations de connexion dans l'organisation.

---

## 🎯 Endpoint à créer

### POST `/auth/calendly/callback`

**Fichier suggéré** : `routes/auth.ts` ou `routes/calendly.ts`

---

## 📥 Données reçues du frontend

Le frontend envoie ces données (voir CalendlyCallback.tsx:41-45) :

```typescript
{
  code: string,              // Code OAuth reçu de Calendly
  organizationId: string,    // ID de l'organisation
  redirectUri: string        // URI de redirection (http://localhost:5173/auth/calendly/callback)
}
```

---

## 🔄 Processus à implémenter

### Étape 1 : Échanger le code OAuth contre un access token

```typescript
const tokenResponse = await axios.post(
  'https://auth.calendly.com/oauth/token',
  new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.CALENDLY_CLIENT_ID,
    client_secret: process.env.CALENDLY_CLIENT_SECRET,
    code: code,
    redirect_uri: redirectUri,
  }),
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
);

const {
  access_token,
  refresh_token,
  expires_in,
  token_type,
} = tokenResponse.data;
```

### Étape 2 : Récupérer les infos de l'utilisateur Calendly

```typescript
const userResponse = await axios.get('https://api.calendly.com/users/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  },
});

const calendlyUser = userResponse.data.resource;
const { email, uri, name } = calendlyUser;
```

### Étape 3 : Sauvegarder dans l'organisation

Mettre à jour le champ `settings.calendly` de l'organisation :

```typescript
{
  enabled: true,
  mode: 'simple',
  oauth_connected: true,
  oauth_email: email,
  oauth_user_uri: uri,
  oauth_user_name: name,
  oauth_access_token: access_token,     // ⚠️ À CHIFFRER en production
  oauth_refresh_token: refresh_token,   // ⚠️ À CHIFFRER en production
  oauth_expires_at: new Date(Date.now() + expires_in * 1000),
  oauth_token_type: token_type,
}
```

### Étape 4 : Retourner la réponse au frontend

```typescript
res.json({
  success: true,
  message: 'Calendly connected successfully',
  email: email,
});
```

---

## 💻 Code complet de l'endpoint

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Endpoint OAuth Callback Calendly
 * POST /auth/calendly/callback
 */
router.post('/auth/calendly/callback', async (req: Request, res: Response) => {
  const { code, organizationId, redirectUri } = req.body;

  console.log('📥 Callback OAuth Calendly reçu:', {
    code: code?.substring(0, 15) + '...',
    organizationId,
    redirectUri,
  });

  // Validation des paramètres
  if (!code || !organizationId || !redirectUri) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters',
    });
  }

  try {
    // 1. Échanger le code OAuth contre un access token
    console.log('🔄 Échange du code contre un access token...');

    const tokenResponse = await axios.post(
      'https://auth.calendly.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CALENDLY_CLIENT_ID!,
        client_secret: process.env.CALENDLY_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
      token_type,
    } = tokenResponse.data;

    console.log('✅ Access token reçu:', {
      access_token: access_token?.substring(0, 20) + '...',
      token_type,
      expires_in,
    });

    // 2. Récupérer les informations de l'utilisateur Calendly
    console.log('👤 Récupération des infos utilisateur Calendly...');

    const userResponse = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const calendlyUser = userResponse.data.resource;
    const { email, uri, name } = calendlyUser;

    console.log('✅ Infos utilisateur récupérées:', {
      email,
      name,
      uri,
    });

    // 3. Sauvegarder dans l'organisation
    console.log('💾 Sauvegarde dans l\'organisation...');

    // ⚠️ ADAPTER SELON VOTRE ORM (voir exemples ci-dessous)
    await updateOrganizationSettings(organizationId, {
      calendly: {
        enabled: true,
        mode: 'simple',
        oauth_connected: true,
        oauth_email: email,
        oauth_user_uri: uri,
        oauth_user_name: name,
        oauth_access_token: access_token,      // ⚠️ À CHIFFRER en production
        oauth_refresh_token: refresh_token,    // ⚠️ À CHIFFRER en production
        oauth_expires_at: new Date(Date.now() + expires_in * 1000),
        oauth_token_type: token_type,
      },
    });

    console.log('✅ Organisation mise à jour avec succès');

    // 4. Retourner le succès au frontend
    res.json({
      success: true,
      message: 'Calendly connected successfully',
      email: email,
    });

  } catch (error: any) {
    console.error('❌ Erreur OAuth Calendly:', error.response?.data || error.message);

    // Afficher l'erreur complète pour débugger
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }

    res.status(500).json({
      success: false,
      message: error.response?.data?.error_description || error.message || 'Failed to connect Calendly',
      error: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
    });
  }
});

export default router;
```

---

## 🗄️ Exemples d'implémentation selon votre ORM

### Sequelize

```typescript
const { Organization } = require('../models');

async function updateOrganizationSettings(organizationId: string, settings: any) {
  const org = await Organization.findByPk(organizationId);

  if (!org) {
    throw new Error('Organization not found');
  }

  const currentSettings = org.settings || {};

  await Organization.update(
    {
      settings: {
        ...currentSettings,
        ...settings,
      },
    },
    {
      where: { id: organizationId },
    }
  );
}
```

### Prisma

```typescript
const { prisma } = require('../lib/prisma');

async function updateOrganizationSettings(organizationId: string, settings: any) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  const currentSettings = org.settings || {};

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      settings: {
        ...currentSettings,
        ...settings,
      },
    },
  });
}
```

### TypeORM

```typescript
import { getRepository } from 'typeorm';
import { Organization } from '../entities/Organization';

async function updateOrganizationSettings(organizationId: string, settings: any) {
  const orgRepo = getRepository(Organization);
  const org = await orgRepo.findOne(organizationId);

  if (!org) {
    throw new Error('Organization not found');
  }

  const currentSettings = org.settings || {};

  await orgRepo.update(organizationId, {
    settings: {
      ...currentSettings,
      ...settings,
    },
  });
}
```

### MongoDB/Mongoose

```typescript
const Organization = require('../models/Organization');

async function updateOrganizationSettings(organizationId: string, settings: any) {
  const org = await Organization.findById(organizationId);

  if (!org) {
    throw new Error('Organization not found');
  }

  await Organization.findByIdAndUpdate(organizationId, {
    $set: {
      'settings.calendly': settings.calendly,
    },
  });
}
```

---

## 📝 Variables d'environnement backend

Ajouter dans votre `.env` backend :

```bash
# Calendly OAuth (SANDBOX - Development)
CALENDLY_CLIENT_ID=C8PqDizYu-MyqJlRWMifsc4ct7GGJ90PeOew4n1F8xU
CALENDLY_CLIENT_SECRET=7nXV7MUFTFTqKY-1v7f5l_i6kDa6bFAVq1qTYmhX5Uc
CALENDLY_WEBHOOK_SIGNING_KEY=8gqbG4YCvY4Zd_apCIRqprzpycTfHHD4QyAJr-St_Ik
```

---

## 🔌 Enregistrer la route

Dans votre fichier principal (`server.ts`, `app.ts`, ou `index.ts`) :

```typescript
import authRoutes from './routes/auth';
// OU
// import calendlyRoutes from './routes/calendly';

// ...

app.use('/auth', authRoutes);
// OU
// app.use('/calendly', calendlyRoutes);
```

---

## 🧪 Tests

### 1. Vérifier que l'endpoint existe

```bash
curl -X POST http://localhost:3000/auth/calendly/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"test","organizationId":"test","redirectUri":"test"}'
```

**Réponse attendue** : Erreur mais pas 404 (prouve que l'endpoint existe)

### 2. Test complet du flux OAuth

1. Frontend : Aller sur `/integrations`
2. Cliquer sur "Connecter avec Calendly"
3. Autoriser dans Calendly
4. Vérifier les logs backend :
   ```
   📥 Callback OAuth Calendly reçu: { code: '...', organizationId: '...', redirectUri: '...' }
   🔄 Échange du code contre un access token...
   ✅ Access token reçu: { access_token: '...', token_type: 'Bearer', expires_in: 7200 }
   👤 Récupération des infos utilisateur Calendly...
   ✅ Infos utilisateur récupérées: { email: 'vous@example.com', name: '...', uri: '...' }
   💾 Sauvegarde dans l'organisation...
   ✅ Organisation mise à jour avec succès
   ```

### 3. Vérifier dans la base de données

Vérifiez que le champ `settings` de l'organisation contient :

```json
{
  "calendly": {
    "enabled": true,
    "mode": "simple",
    "oauth_connected": true,
    "oauth_email": "votre-email@calendly.com",
    "oauth_user_uri": "https://api.calendly.com/users/...",
    "oauth_user_name": "Votre Nom",
    "oauth_access_token": "...",
    "oauth_refresh_token": "...",
    "oauth_expires_at": "2026-01-02T14:00:00.000Z",
    "oauth_token_type": "Bearer"
  }
}
```

---

## 🐛 Gestion des erreurs courantes

### Erreur : "invalid_client"
- Vérifier `CALENDLY_CLIENT_ID` et `CALENDLY_CLIENT_SECRET`
- S'assurer qu'ils correspondent à votre app Calendly dev

### Erreur : "invalid_grant"
- Le code OAuth a expiré (10 minutes max)
- Recommencer le flux OAuth

### Erreur : "redirect_uri_mismatch"
- Le `redirectUri` envoyé ne correspond pas à celui configuré dans Calendly
- Vérifier que `http://localhost:5173/auth/calendly/callback` est bien enregistré dans Calendly

### Erreur 500 lors de la sauvegarde
- Vérifier que la table `organizations` existe
- Vérifier que le champ `settings` accepte du JSON/JSONB
- Adapter le code selon votre ORM

---

## 🔒 Sécurité (IMPORTANT pour la production)

### ⚠️ CHIFFRER LES TOKENS EN PRODUCTION

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 caractères
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Utilisation
const encryptedAccessToken = encrypt(access_token);
const encryptedRefreshToken = encrypt(refresh_token);
```

---

## ✅ Checklist

- [ ] Créer le fichier `routes/auth.ts` ou `routes/calendly.ts`
- [ ] Implémenter l'endpoint POST `/auth/calendly/callback`
- [ ] Ajouter les variables d'environnement backend
- [ ] Enregistrer la route dans le serveur
- [ ] Adapter la fonction `updateOrganizationSettings` selon votre ORM
- [ ] Tester le flux OAuth complet
- [ ] Vérifier les logs du backend
- [ ] Vérifier la sauvegarde dans la BDD
- [ ] Vérifier dans le frontend que "✅ Calendly connecté" s'affiche
- [ ] ⚠️ IMPORTANT : Implémenter le chiffrement des tokens pour la production

---

## 📚 Ressources

- [Calendly OAuth Documentation](https://developer.calendly.com/api-docs/f482379e09c42-oauth)
- [Calendly API Reference](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM0-calendly-developer-overview)

---

## 🆘 Support

En cas de problème, vérifier :
1. Les logs du backend (côté console serveur)
2. Les logs du frontend (console navigateur)
3. Que les variables d'environnement sont correctement chargées
4. Que l'URL de redirection est exactement la même dans Calendly et dans le `.env.development`
