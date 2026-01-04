# ⚠️ URGENT - Backend ne sauvegarde pas les données OAuth Calendly

## 🚨 Problème identifié

L'endpoint `/auth/calendly/callback` **ne sauvegarde PAS** les informations OAuth dans l'organisation.

### Preuve du problème

**Ce qui est actuellement sauvegardé** :
```json
{
  "mode": "simple",
  "enabled": false,
  "calendly_link": "https://calendly.com/jeunechilichiild"
}
```

**Ce qui DEVRAIT être sauvegardé** :
```json
{
  "enabled": true,
  "mode": "simple",
  "oauth_connected": true,
  "oauth_email": "user@example.com",
  "oauth_user_uri": "https://api.calendly.com/users/...",
  "oauth_user_name": "Nom Utilisateur",
  "oauth_access_token": "...",
  "oauth_refresh_token": "...",
  "oauth_expires_at": "2026-01-03T14:00:00.000Z",
  "oauth_token_type": "Bearer"
}
```

---

## ✅ Code backend à implémenter

### Endpoint `/auth/calendly/callback`

```typescript
router.post('/auth/calendly/callback', authenticateToken, async (req: Request, res: Response) => {
  const { code, organizationId, redirectUri } = req.body;
  const userId = req.user.id;

  try {
    // 1. Vérifier que l'utilisateur a accès à l'organisation
    const org = await Organization.findByPk(organizationId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // 2. Échanger le code OAuth contre un access token
    const tokenResponse = await axios.post(
      'https://auth.calendly.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CALENDLY_CLIENT_ID!,
        client_secret: process.env.CALENDLY_CLIENT_SECRET!,
        code,
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

    console.log('✅ Access token reçu');

    // 3. Récupérer les infos utilisateur Calendly
    const userResponse = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const calendlyUser = userResponse.data.resource;
    const { email, uri, name } = calendlyUser;

    console.log('✅ Infos utilisateur récupérées:', { email, name });

    // 4. ⚠️ IMPORTANT : Récupérer les settings actuels et les fusionner
    const currentSettings = org.settings || {};
    const currentCalendlySettings = currentSettings.calendly || {};

    // 5. Créer les nouveaux settings Calendly
    const newCalendlySettings = {
      ...currentCalendlySettings,  // Garder les anciennes valeurs (ex: calendly_link)
      enabled: true,                // ✅ Activer l'intégration
      mode: 'simple',
      oauth_connected: true,        // ✅ Marquer comme connecté
      oauth_email: email,
      oauth_user_uri: uri,
      oauth_user_name: name,
      oauth_access_token: access_token,      // ⚠️ À chiffrer en production
      oauth_refresh_token: refresh_token,    // ⚠️ À chiffrer en production
      oauth_expires_at: new Date(Date.now() + expires_in * 1000),
      oauth_token_type: token_type,
    };

    console.log('📦 Nouveaux settings Calendly:', newCalendlySettings);

    // 6. ⚠️ CRITIQUE : Sauvegarder dans l'organisation
    await org.update({
      settings: {
        ...currentSettings,
        calendly: newCalendlySettings,
      },
    });

    console.log('✅ Organisation mise à jour avec succès');

    // 7. Vérifier que la sauvegarde a bien fonctionné
    await org.reload();
    console.log('🔍 Vérification après sauvegarde:', org.settings.calendly);

    // 8. Retourner le succès au frontend
    return res.status(200).json({
      success: true,
      message: 'Calendly connected successfully',
      email: email,  // ⚠️ Important pour le frontend
    });

  } catch (error: any) {
    console.error('❌ Erreur OAuth Calendly:', error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: error.response?.data?.error_description || 'Failed to connect Calendly',
    });
  }
});
```

---

## 🔍 Points critiques à vérifier

### 1. Type de données du champ `settings`

**Le champ `settings` doit être de type JSON/JSONB dans la base de données.**

#### Sequelize
```typescript
// models/Organization.js
settings: {
  type: DataTypes.JSONB,  // ou DataTypes.JSON pour MySQL
  allowNull: true,
  defaultValue: {},
}
```

#### Prisma
```prisma
model Organization {
  id       String @id @default(uuid())
  settings Json?  // Type JSON
  // ...
}
```

### 2. Fusion correcte des settings

**⚠️ NE PAS écraser tout l'objet `settings` !**

```typescript
// ❌ MAUVAIS - Écrase tout
await org.update({
  settings: {
    calendly: newCalendlySettings,
  },
});

// ✅ BON - Fusionne avec les settings existants
await org.update({
  settings: {
    ...org.settings,           // Garder tous les autres settings
    calendly: newCalendlySettings,
  },
});
```

### 3. Mettre `enabled: true`

```typescript
const newCalendlySettings = {
  enabled: true,              // ✅ Important !
  mode: 'simple',
  oauth_connected: true,      // ✅ Important !
  oauth_email: email,
  // ...
};
```

---

## 🧪 Tests

### 1. Test manuel

```bash
# 1. Faire le flux OAuth complet depuis le frontend
# 2. Vérifier les logs backend :

✅ Access token reçu
✅ Infos utilisateur récupérées: { email: '...', name: '...' }
📦 Nouveaux settings Calendly: { enabled: true, oauth_connected: true, ... }
✅ Organisation mise à jour avec succès
🔍 Vérification après sauvegarde: { enabled: true, oauth_connected: true, ... }
```

### 2. Test SQL direct

```sql
-- Vérifier dans la base de données
SELECT settings FROM organizations WHERE id = 'votre-org-id';
```

**Résultat attendu** :
```json
{
  "calendly": {
    "enabled": true,
    "mode": "simple",
    "oauth_connected": true,
    "oauth_email": "user@example.com",
    "oauth_user_uri": "https://api.calendly.com/users/...",
    "oauth_user_name": "Nom Utilisateur",
    "oauth_access_token": "...",
    "oauth_refresh_token": "...",
    "oauth_expires_at": "2026-01-03T14:00:00.000Z",
    "oauth_token_type": "Bearer"
  }
}
```

### 3. Test de l'API `/organizations/me`

```bash
curl http://localhost:3000/organizations/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Vérifier** que la réponse contient bien `settings.calendly.oauth_connected = true`

---

## 📋 Checklist Backend

- [ ] Le champ `settings` est de type JSON/JSONB
- [ ] Le code fusionne correctement les settings existants avec `...org.settings`
- [ ] Le code met `enabled: true`
- [ ] Le code met `oauth_connected: true`
- [ ] Le code sauvegarde `oauth_email`
- [ ] Le code sauvegarde `oauth_user_uri`
- [ ] Le code sauvegarde `oauth_user_name`
- [ ] Le code sauvegarde `oauth_access_token`
- [ ] Le code sauvegarde `oauth_refresh_token`
- [ ] Le code sauvegarde `oauth_expires_at`
- [ ] Les logs de debug sont activés
- [ ] La vérification `org.reload()` affiche les bonnes données
- [ ] L'endpoint retourne `{ success: true, email: '...' }`

---

## 🐛 Debugging

Si ça ne fonctionne toujours pas, ajoutez ces logs :

```typescript
// Avant la sauvegarde
console.log('📦 Settings actuels:', org.settings);
console.log('📦 Nouveaux settings Calendly:', newCalendlySettings);
console.log('📦 Settings à sauvegarder:', {
  ...org.settings,
  calendly: newCalendlySettings,
});

// Après la sauvegarde
await org.update({ settings: { ...org.settings, calendly: newCalendlySettings } });
await org.reload();
console.log('🔍 Settings après sauvegarde:', org.settings);
console.log('🔍 Calendly après sauvegarde:', org.settings.calendly);
```

---

## 📞 Support

**Si le problème persiste**, fournir :
1. Les logs complets de l'endpoint
2. Le résultat de la requête SQL
3. La définition du modèle `Organization`
4. L'ORM utilisé (Sequelize, Prisma, TypeORM, etc.)
