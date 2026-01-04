# Calendly OAuth 2.0 - Guide d'implémentation Backend

Ce guide explique comment implémenter l'authentification OAuth 2.0 avec Calendly pour créer automatiquement des prospects dans Velvena.

## 📋 Table des matières

1. [Configuration initiale Calendly](#configuration-initiale-calendly)
2. [Variables d'environnement](#variables-denvironnement)
3. [Endpoint Callback OAuth](#endpoint-callback-oauth)
4. [Récupération des événements](#récupération-des-événements)
5. [Création automatique de prospects](#création-automatique-de-prospects)
6. [Refresh Token](#refresh-token)
7. [Sécurité](#sécurité)

---

## 🔧 Configuration initiale Calendly

### 1. Créer une application OAuth sur Calendly

1. Allez sur https://calendly.com/integrations/api_webhooks
2. Cliquez sur **"Register New OAuth App"**
3. Remplissez les informations :
   - **Application Name** : `Velvena`
   - **Redirect URI** : `https://votre-domaine.fr/auth/calendly/callback`
   - **Description** : `Intégration Calendly pour Velvena`

4. Notez les informations :
   - **Client ID** : `xxxxxxxxxxxxxxxx`
   - **Client Secret** : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Webhook signing key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Configurer les Scopes

Demandez les permissions suivantes :
- `default` - Accès de base aux événements planifiés

---

## 🔐 Variables d'environnement

Fichier : `.env`

```bash
# Calendly OAuth
CALENDLY_CLIENT_ID=xxxxxxxxxxxxxxxx
CALENDLY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CALENDLY_REDIRECT_URI=https://votre-domaine.fr/auth/calendly/callback

# Frontend (à ajouter aussi dans .env.local du frontend)
VITE_CALENDLY_CLIENT_ID=xxxxxxxxxxxxxxxx
```

---

## 🛠️ Endpoint Callback OAuth

### Endpoint : `POST /auth/calendly/callback`

**Rôle :** Échanger le code OAuth contre un access token

**Request Body :**
```json
{
  "code": "abc123...",
  "organizationId": "org-uuid",
  "redirectUri": "https://votre-domaine.fr/auth/calendly/callback"
}
```

**Implémentation :**

```typescript
// routes/auth.ts
import axios from 'axios';

router.post('/auth/calendly/callback', async (req, res) => {
  const { code, organizationId, redirectUri } = req.body;

  try {
    // 1. Échanger le code contre un access token
    const tokenResponse = await axios.post('https://auth.calendly.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.CALENDLY_CLIENT_ID,
      client_secret: process.env.CALENDLY_CLIENT_SECRET,
      code: code,
      redirect_uri: redirectUri,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const {
      access_token,
      refresh_token,
      expires_in,
    } = tokenResponse.data;

    // 2. Récupérer les informations de l'utilisateur Calendly
    const userResponse = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const { email, uri } = userResponse.data.resource;

    // 3. Sauvegarder les tokens dans l'organisation
    await Organization.update({
      settings: {
        calendly: {
          enabled: true,
          mode: 'simple',
          oauth_connected: true,
          oauth_email: email,
          oauth_user_uri: uri,
          oauth_access_token: access_token, // À chiffrer !
          oauth_refresh_token: refresh_token, // À chiffrer !
          oauth_expires_at: new Date(Date.now() + expires_in * 1000),
        },
      },
    }, {
      where: { id: organizationId },
    });

    res.json({
      success: true,
      message: 'Calendly connected successfully',
      email,
    });

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to connect Calendly',
    });
  }
});
```

---

## 📅 Récupération des événements

### Cron Job : Synchronisation toutes les heures

**Fichier :** `cron/syncCalendlyEvents.ts`

```typescript
import axios from 'axios';
import { Organization, Prospect } from '../models';

export async function syncCalendlyEvents() {
  console.log('🔄 Starting Calendly sync...');

  // Récupérer toutes les organisations avec Calendly OAuth connecté
  const organizations = await Organization.findAll({
    where: {
      'settings.calendly.oauth_connected': true,
      'settings.calendly.mode': 'simple',
    },
  });

  for (const org of organizations) {
    try {
      await syncOrganizationEvents(org);
    } catch (error) {
      console.error(`Error syncing org ${org.id}:`, error);
    }
  }

  console.log('✅ Calendly sync completed');
}

async function syncOrganizationEvents(organization: Organization) {
  const calendlySettings = organization.settings.calendly;

  // Vérifier si le token n'a pas expiré
  const now = new Date();
  const expiresAt = new Date(calendlySettings.oauth_expires_at);

  if (now >= expiresAt) {
    // Refresh le token
    await refreshAccessToken(organization);
    // Recharger l'organisation
    await organization.reload();
  }

  const accessToken = calendlySettings.oauth_access_token;
  const userUri = calendlySettings.oauth_user_uri;

  // Récupérer les événements des 7 derniers jours
  const minStartTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const response = await axios.get('https://api.calendly.com/scheduled_events', {
    params: {
      user: userUri,
      min_start_time: minStartTime,
      status: 'active',
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const events = response.data.collection;

  for (const event of events) {
    await processEvent(organization, event);
  }
}

async function processEvent(organization: Organization, event: any) {
  const eventUri = event.uri;

  // Vérifier si on a déjà créé un prospect pour cet événement
  const existingProspect = await Prospect.findOne({
    where: {
      organization_id: organization.id,
      'metadata.calendly_event_uri': eventUri,
    },
  });

  if (existingProspect) {
    console.log(`Event ${eventUri} already processed, skipping...`);
    return;
  }

  // Récupérer les invités de l'événement
  const inviteesResponse = await axios.get(`${eventUri}/invitees`, {
    headers: {
      'Authorization': `Bearer ${organization.settings.calendly.oauth_access_token}`,
      'Content-Type': 'application/json',
    },
  });

  const invitees = inviteesResponse.data.collection;

  for (const invitee of invitees) {
    await createProspectFromInvitee(organization, event, invitee);
  }
}

async function createProspectFromInvitee(
  organization: Organization,
  event: any,
  invitee: any
) {
  // Extraire les informations
  const { email, name } = invitee;
  const [firstName, ...lastNameParts] = name.split(' ');
  const lastName = lastNameParts.join(' ');

  // Extraire le téléphone depuis les questions
  const phoneQuestion = invitee.questions_and_answers?.find(
    (qa: any) =>
      qa.question.toLowerCase().includes('phone') ||
      qa.question.toLowerCase().includes('téléphone')
  );
  const phone = phoneQuestion?.answer || null;

  // Créer le prospect
  const prospect = await Prospect.create({
    organization_id: organization.id,
    first_name: firstName,
    last_name: lastName || '',
    email: email,
    phone: phone,
    status: 'nouveau',
    source: 'calendly',
    type: 'prospect',
    notes: `RDV Calendly : ${event.name}\nDate : ${event.start_time}\n\n${invitee.text_reminder_number ? `Tel: ${invitee.text_reminder_number}` : ''}`,
    metadata: {
      calendly_event_uri: event.uri,
      calendly_invitee_uri: invitee.uri,
      event_name: event.name,
      event_start: event.start_time,
      event_end: event.end_time,
      event_location: event.location?.join_url || event.location?.location,
    },
  });

  console.log(`✅ Created prospect ${prospect.id} from Calendly event ${event.uri}`);
}
```

### Configuration du Cron Job

**Avec node-cron :**

```typescript
// server.ts
import cron from 'node-cron';
import { syncCalendlyEvents } from './cron/syncCalendlyEvents';

// Exécuter toutes les heures
cron.schedule('0 * * * *', async () => {
  await syncCalendlyEvents();
});
```

---

## 🔄 Refresh Token

**Fonction :** `refreshAccessToken()`

```typescript
async function refreshAccessToken(organization: Organization) {
  const calendlySettings = organization.settings.calendly;
  const refreshToken = calendlySettings.oauth_refresh_token;

  try {
    const response = await axios.post('https://auth.calendly.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: process.env.CALENDLY_CLIENT_ID,
      client_secret: process.env.CALENDLY_CLIENT_SECRET,
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const {
      access_token,
      refresh_token: new_refresh_token,
      expires_in,
    } = response.data;

    // Mettre à jour les tokens
    await organization.update({
      settings: {
        ...organization.settings,
        calendly: {
          ...calendlySettings,
          oauth_access_token: access_token,
          oauth_refresh_token: new_refresh_token || refreshToken,
          oauth_expires_at: new Date(Date.now() + expires_in * 1000),
        },
      },
    });

    console.log(`✅ Refreshed Calendly token for org ${organization.id}`);
  } catch (error) {
    console.error(`Failed to refresh token for org ${organization.id}:`, error);
    throw error;
  }
}
```

---

## 🔒 Sécurité

### 1. Chiffrement des tokens

**⚠️ IMPORTANT** : Les tokens doivent être chiffrés en base de données !

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
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
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Utilisation
calendlySettings.oauth_access_token = encrypt(access_token);
```

### 2. Validation du state

Toujours valider le paramètre `state` pour éviter les attaques CSRF :

```typescript
// Lors du callback
const receivedState = req.query.state;
const decodedState = JSON.parse(atob(receivedState));

// Vérifier que l'organizationId correspond à l'utilisateur connecté
if (decodedState.organizationId !== req.user.organizationId) {
  throw new Error('Invalid state');
}
```

### 3. Stockage sécurisé

- ✅ Chiffrer `oauth_access_token` et `oauth_refresh_token`
- ✅ Ne JAMAIS logger les tokens
- ✅ Utiliser HTTPS uniquement
- ✅ Rotation automatique des tokens via refresh

---

## 📊 Tests

### Test du callback OAuth

```bash
# 1. Obtenir un code via le navigateur
# Ouvrez cette URL dans votre navigateur :
https://auth.calendly.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/auth/calendly/callback&state=test

# 2. Récupérez le code dans l'URL de redirection

# 3. Testez le callback
curl -X POST http://localhost:5000/auth/calendly/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "YOUR_CODE_HERE",
    "organizationId": "org-uuid",
    "redirectUri": "http://localhost:3000/auth/calendly/callback"
  }'
```

---

## 🔗 Ressources

- [Documentation OAuth Calendly](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDQw-getting-started-with-oauth)
- [API Reference](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM0-calendly-developer-overview)
- [Scheduled Events API](https://developer.calendly.com/api-docs/b3A6NTEyMjI0Nw-list-events)

---

## ✅ Checklist d'implémentation

- [ ] Créer l'application OAuth sur Calendly
- [ ] Ajouter les variables d'environnement
- [ ] Implémenter l'endpoint `/auth/calendly/callback`
- [ ] Créer le cron job de synchronisation
- [ ] Implémenter le refresh token
- [ ] Chiffrer les tokens en base de données
- [ ] Tester le flux OAuth complet
- [ ] Tester la création automatique de prospects
- [ ] Mettre en production

---

## 🐛 Troubleshooting

**Erreur : "Invalid grant"**
- Le code OAuth a expiré (10 minutes max)
- Le redirect_uri ne correspond pas

**Erreur : "Invalid client"**
- Client ID ou Secret incorrect
- Vérifier les variables d'environnement

**Token refresh échoue**
- Le refresh token a été révoqué
- L'utilisateur a déconnecté l'app depuis Calendly
- Demander une nouvelle autorisation OAuth
