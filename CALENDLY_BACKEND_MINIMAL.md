# Backend Minimum - Endpoint OAuth Calendly

Code backend minimum pour tester le flux OAuth Calendly.

## 📁 Fichier à créer : `routes/calendly.ts` (ou `routes/auth.ts`)

```typescript
import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Endpoint OAuth Callback Calendly
 * POST /auth/calendly/callback
 *
 * Ce endpoint reçoit le code OAuth de Calendly et :
 * 1. Échange le code contre un access token
 * 2. Récupère les infos de l'utilisateur Calendly
 * 3. Sauvegarde le tout dans l'organisation
 */
router.post('/auth/calendly/callback', async (req, res) => {
  const { code, organizationId, redirectUri } = req.body;

  console.log('📥 Callback OAuth reçu:', {
    code: code?.substring(0, 15) + '...',
    organizationId,
    redirectUri,
  });

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
    // ⚠️ ADAPTER SELON VOTRE ORM (Sequelize, Prisma, etc.)
    console.log('💾 Sauvegarde dans l\'organisation...');

    // EXEMPLE AVEC SEQUELIZE
    const { Organization } = require('../models'); // Adapter selon votre structure

    await Organization.update(
      {
        settings: {
          calendly: {
            enabled: true,
            mode: 'simple',
            oauth_connected: true,
            oauth_email: email,
            oauth_user_uri: uri,
            oauth_user_name: name,
            oauth_access_token: access_token, // ⚠️ À CHIFFRER en production !
            oauth_refresh_token: refresh_token, // ⚠️ À CHIFFRER en production !
            oauth_expires_at: new Date(Date.now() + expires_in * 1000),
            oauth_token_type: token_type,
          },
        },
      },
      {
        where: { id: organizationId },
      }
    );

    // OU EXEMPLE AVEC PRISMA
    /*
    const { prisma } = require('../lib/prisma');

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          calendly: {
            enabled: true,
            mode: 'simple',
            oauth_connected: true,
            oauth_email: email,
            oauth_user_uri: uri,
            oauth_user_name: name,
            oauth_access_token: access_token,
            oauth_refresh_token: refresh_token,
            oauth_expires_at: new Date(Date.now() + expires_in * 1000),
            oauth_token_type: token_type,
          },
        },
      },
    });
    */

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

## 📝 Variables d'environnement backend

Dans votre `.env` backend, ajoutez :

```bash
# Calendly OAuth (SANDBOX - Development)
CALENDLY_CLIENT_ID=C8PqDizYu-MyqJlRWMifsc4ct7GGJ90PeOew4n1F8xU
CALENDLY_CLIENT_SECRET=7nXV7MUFTFTqKY-1v7f5l_i6kDa6bFAVq1qTYmhX5Uc
CALENDLY_WEBHOOK_SIGNING_KEY=8gqbG4YCvY4Zd_apCIRqprzpycTfHHD4QyAJr-St_Ik
```

## 🔌 Enregistrer la route

Dans votre fichier principal (ex: `server.ts`, `app.ts`, `index.ts`) :

```typescript
import calendlyRoutes from './routes/calendly'; // ou './routes/auth'

// ...

app.use('/auth', calendlyRoutes);
// OU
// app.use(calendlyRoutes);
```

## ⚙️ Adapter selon votre ORM

### Si vous utilisez Sequelize

```typescript
const { Organization } = require('../models');

await Organization.update(
  { settings: { calendly: { ... } } },
  { where: { id: organizationId } }
);
```

### Si vous utilisez Prisma

```typescript
const { prisma } = require('../lib/prisma');

await prisma.organization.update({
  where: { id: organizationId },
  data: { settings: { calendly: { ... } } },
});
```

### Si vous utilisez TypeORM

```typescript
import { getRepository } from 'typeorm';
import { Organization } from '../entities/Organization';

const orgRepo = getRepository(Organization);
await orgRepo.update(organizationId, {
  settings: { calendly: { ... } },
});
```

### Si vous utilisez MongoDB/Mongoose

```typescript
const Organization = require('../models/Organization');

await Organization.findByIdAndUpdate(organizationId, {
  $set: {
    'settings.calendly': { ... },
  },
});
```

## 🧪 Tester

### 1. Démarrer le backend

```bash
npm run dev
# ou
yarn dev
```

### 2. Vérifier que l'endpoint existe

```bash
curl http://localhost:3000/auth/calendly/callback
# Devrait retourner une erreur (normal), mais pas 404
```

### 3. Tester le flux OAuth complet

1. Frontend : Cliquez sur "Connecter avec Calendly"
2. Autorisez sur Calendly
3. Vérifiez les logs du backend :
   ```
   📥 Callback OAuth reçu: { code: '...', organizationId: '...', redirectUri: '...' }
   🔄 Échange du code contre un access token...
   ✅ Access token reçu: { access_token: '...', token_type: 'Bearer', expires_in: 7200 }
   👤 Récupération des infos utilisateur Calendly...
   ✅ Infos utilisateur récupérées: { email: 'vous@example.com', name: '...', uri: '...' }
   💾 Sauvegarde dans l'organisation...
   ✅ Organisation mise à jour avec succès
   ```

### 4. Vérifier dans la base de données

```sql
SELECT settings FROM organizations WHERE id = 'votre-org-id';
```

Vous devriez voir :
```json
{
  "calendly": {
    "enabled": true,
    "mode": "simple",
    "oauth_connected": true,
    "oauth_email": "votre-email@calendly.com",
    "oauth_access_token": "...",
    "oauth_refresh_token": "..."
  }
}
```

### 5. Vérifier dans le frontend

Retournez sur `/integrations` :
- Badge vert "✓ Connecté" visible
- Modal "Détails" montre votre email
- Toggle fonctionne

## 🐛 Troubleshooting

### Erreur : "Invalid client"
- Vérifier `CALENDLY_CLIENT_ID` et `CALENDLY_CLIENT_SECRET`

### Erreur : "Invalid grant"
- Le code OAuth a expiré (10 minutes max)
- Recommencer le flux OAuth

### Erreur : "Invalid redirect URI"
- Vérifier que le redirect URI est exactement le même dans Calendly dashboard

### Erreur 500 lors de la sauvegarde
- Vérifier que la table `organizations` existe
- Vérifier que le champ `settings` accepte du JSON
- Adapter le code selon votre ORM

## 🔒 Production

En production, **CHIFFREZ** les tokens avant de les sauvegarder !

Voir `CALENDLY_OAUTH_BACKEND.md` section "Sécurité" pour le code de chiffrement.

---

## ✅ Checklist

- [ ] Créer le fichier `routes/calendly.ts`
- [ ] Ajouter les variables d'environnement
- [ ] Enregistrer la route dans le serveur
- [ ] Adapter le code selon votre ORM
- [ ] Démarrer le backend
- [ ] Tester le flux OAuth
- [ ] Vérifier les logs du backend
- [ ] Vérifier dans la BDD
- [ ] Vérifier dans le frontend
