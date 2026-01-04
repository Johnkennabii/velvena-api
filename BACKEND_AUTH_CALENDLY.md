# 🔐 Backend - Authentification OAuth Calendly

## ⚠️ Problème actuel

L'endpoint `/auth/calendly/callback` retourne un **401 Unauthorized**, ce qui :
- Déconnecte l'utilisateur
- Redirige vers `/signin`
- Empêche la connexion Calendly

---

## ✅ Solution recommandée

L'endpoint `/auth/calendly/callback` doit **accepter les requêtes authentifiées** mais ne doit **pas retourner 401** en cas d'erreur OAuth.

### Option 1 : Endpoint avec authentification (Recommandé)

```typescript
router.post('/auth/calendly/callback', authenticateToken, async (req: Request, res: Response) => {
  const { code, organizationId, redirectUri } = req.body;
  const userId = req.user.id; // Depuis le JWT

  try {
    // Vérifier que l'utilisateur a le droit de modifier cette organisation
    const userOrg = await getUserOrganization(userId);
    if (userOrg.id !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette organisation',
      });
    }

    // Échange du code OAuth...
    const tokenResponse = await axios.post('https://auth.calendly.com/oauth/token', ...);

    // Récupération des infos utilisateur...
    const userResponse = await axios.get('https://api.calendly.com/users/me', ...);

    // Sauvegarde...
    await updateOrganizationSettings(organizationId, { calendly: {...} });

    return res.status(200).json({
      success: true,
      message: 'Calendly connected successfully',
      email: userResponse.data.resource.email,
    });

  } catch (error: any) {
    // ⚠️ NE PAS retourner 401 ici, retourner 500 ou 400
    console.error('Erreur OAuth Calendly:', error);

    return res.status(500).json({
      success: false,
      message: error.response?.data?.error_description || 'Failed to connect Calendly',
    });
  }
});
```

### Option 2 : Endpoint sans authentification (Moins sécurisé)

Si vous voulez permettre le callback même sans JWT :

```typescript
router.post('/auth/calendly/callback', async (req: Request, res: Response) => {
  const { code, organizationId, redirectUri } = req.body;

  // ⚠️ Validez au minimum l'organizationId existe
  const org = await Organization.findByPk(organizationId);
  if (!org) {
    return res.status(404).json({
      success: false,
      message: 'Organization not found',
    });
  }

  // Suite du code...
});
```

---

## 🎯 Points importants

### 1. Ne jamais retourner 401 pour les erreurs OAuth

```typescript
// ❌ MAUVAIS
if (error) {
  return res.status(401).json({ error: 'OAuth failed' });
}

// ✅ BON
if (error) {
  return res.status(500).json({
    success: false,
    message: 'Failed to connect Calendly'
  });
}
```

### 2. Gérer les codes de statut correctement

| Code | Utilisation |
|------|-------------|
| 200 | Connexion réussie |
| 400 | Paramètres manquants (code, organizationId, redirectUri) |
| 403 | Utilisateur n'a pas accès à l'organisation |
| 404 | Organisation non trouvée |
| 500 | Erreur lors de l'échange OAuth ou de la sauvegarde |

**❌ Ne jamais retourner 401** pour cet endpoint car le frontend le traite comme une déconnexion.

### 3. Middleware d'authentification

Si vous utilisez un middleware JWT :

```typescript
// middleware/auth.ts
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      // ⚠️ Pour les endpoints OAuth, vous pourriez vouloir être plus permissif
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

Pour l'endpoint OAuth, vous pourriez vouloir un middleware plus permissif :

```typescript
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next(); // Continue même sans token valide
};
```

---

## 🔍 Debug

Pour identifier le problème, ajoutez des logs :

```typescript
router.post('/auth/calendly/callback', async (req, res) => {
  console.log('📥 Callback reçu:', {
    hasCode: !!req.body.code,
    hasOrgId: !!req.body.organizationId,
    hasRedirectUri: !!req.body.redirectUri,
    hasAuthHeader: !!req.headers.authorization,
  });

  // Vérifier le token JWT si présent
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log('✅ Token JWT valide:', decoded);
    } catch (error) {
      console.log('❌ Token JWT invalide:', error.message);
    }
  }

  // Suite du code...
});
```

---

## 🧪 Test avec cURL

```bash
# Test avec token valide
curl -X POST http://localhost:3000/auth/calendly/callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -d '{
    "code": "test_code",
    "organizationId": "2405d24f-97a3-45a8-aeee-f6ffa8fb463c",
    "redirectUri": "http://localhost:5173/auth/calendly/callback"
  }'

# Réponse attendue si code invalide : 500 (pas 401!)
# { "success": false, "message": "Invalid grant" }
```

---

## ✅ Checklist Backend

- [ ] L'endpoint `/auth/calendly/callback` existe
- [ ] L'endpoint accepte les requêtes POST avec `{ code, organizationId, redirectUri }`
- [ ] L'endpoint vérifie le Bearer token JWT
- [ ] **L'endpoint ne retourne JAMAIS 401** (utiliser 403, 500, ou 400)
- [ ] Les erreurs OAuth retournent 500 avec `{ success: false, message: '...' }`
- [ ] Les succès retournent 200 avec `{ success: true, email: '...' }`
- [ ] L'organizationId est validé (existence + droits utilisateur)
- [ ] Les logs de debug sont activés

---

## 📋 Exemple de réponse attendue

### Succès (200)
```json
{
  "success": true,
  "message": "Calendly connected successfully",
  "email": "user@example.com"
}
```

### Erreur - Code OAuth invalide (500)
```json
{
  "success": false,
  "message": "Invalid authorization code"
}
```

### Erreur - Paramètres manquants (400)
```json
{
  "success": false,
  "message": "Missing required parameters"
}
```

### Erreur - Accès refusé (403)
```json
{
  "success": false,
  "message": "You don't have access to this organization"
}
```

---

## 🆘 Si le problème persiste

1. Vérifier les logs du backend
2. Vérifier que le token JWT n'est pas expiré
3. Tester l'endpoint avec Postman/cURL
4. Vérifier que le middleware d'authentification ne bloque pas les requêtes
5. S'assurer que CORS est configuré correctement

---

## 📞 Support

Si vous avez besoin d'aide, fournissez :
- Les logs du backend lors de l'appel
- Le code de statut HTTP retourné
- Le contenu du header `Authorization`
- Les paramètres envoyés dans le body
