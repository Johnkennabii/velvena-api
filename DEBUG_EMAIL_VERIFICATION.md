# Guide de Débogage - Vérification d'Email

**Date:** 20 Décembre 2025
**Problème:** Le lien de vérification d'email ne fonctionne pas

---

## 🔍 Diagnostic du problème

Vous rencontrez une erreur lors de la vérification d'email avec ce lien :
```
http://localhost:5173/verify-email?token=3e955c657e6a3c4303ac3a92d4c6b84974af1e46df85046146133c8309c8da47
```

### Changements effectués

✅ **Frontend corrigé :**
1. Clé localStorage changée de `"authToken"` → `"token"` (cohérence avec AuthContext)
2. Meilleure gestion de la structure de réponse API
3. Messages d'erreur plus détaillés
4. Logs console pour debugging

---

## 📋 Étapes de débogage

### Étape 1 : Vérifier la console du navigateur

1. Ouvrir les **DevTools** (F12)
2. Aller dans l'onglet **Console**
3. Cliquer sur le lien de vérification
4. Chercher les logs suivants :

```
📧 Réponse de vérification d'email: {...}
```

**Si vous voyez une erreur :**
- Note le code d'erreur (404, 400, 500, etc.)
- Note le message d'erreur
- Copie l'objet de réponse complet

### Étape 2 : Vérifier la console du backend

1. Ouvrir le terminal où le backend tourne
2. Chercher des logs lors de la requête
3. Vérifier s'il y a des erreurs

**Rechercher :**
```
GET /auth/verify-email/3e955c657e6a3c4303ac3a92d4c6b84974af1e46df85046146133c8309c8da47
```

### Étape 3 : Tester l'endpoint manuellement

Utiliser cURL ou Postman pour tester directement :

```bash
curl -X GET "http://localhost:3000/auth/verify-email/3e955c657e6a3c4303ac3a92d4c6b84974af1e46df85046146133c8309c8da47" \
  -H "Content-Type: application/json" \
  -v
```

**Réponse attendue :**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "email_verified": true,
    "role": "ADMIN",
    ...
  }
}
```

OU (structure alternative) :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "email_verified": true,
      ...
    }
  }
}
```

---

## 🚨 Erreurs possibles

### Erreur 404 - Endpoint non trouvé

**Symptôme :**
```
GET /auth/verify-email/... 404 Not Found
```

**Cause :** Le backend n'a pas l'endpoint de vérification d'email

**Solution :** Implémenter l'endpoint dans le backend (voir section ci-dessous)

---

### Erreur 400 - Token invalide

**Symptôme :**
```json
{
  "success": false,
  "message": "Token de vérification invalide"
}
```

**Causes possibles :**
1. Le token n'existe pas en base de données
2. Le token a déjà été utilisé
3. Mauvais format de token

**Solutions :**
- Vérifier que le token existe : `SELECT * FROM email_verification_tokens WHERE token = '...'`
- Vérifier que `used_at IS NULL`
- Vérifier que le token correspond à celui envoyé par email

---

### Erreur 400 - Token expiré

**Symptôme :**
```json
{
  "success": false,
  "message": "Le lien de vérification a expiré"
}
```

**Cause :** Le token a une date d'expiration dépassée

**Solution :**
- Augmenter la durée de validité (recommandé : 24h minimum)
- Renvoyer un nouvel email de vérification

---

### Erreur 500 - Erreur serveur

**Symptôme :**
```json
{
  "success": false,
  "message": "Erreur interne du serveur"
}
```

**Causes possibles :**
1. Erreur de base de données
2. Erreur de génération du JWT
3. Bug dans le code backend

**Solution :** Vérifier les logs backend pour l'erreur exacte

---

## 🔧 Implémentation Backend (si manquant)

### Structure de la table de vérification

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP NULL,

  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);
```

### Endpoint de vérification (Node.js/Express)

```typescript
// routes/auth.ts
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Chercher le token en base
    const verificationToken = await db.emailVerificationTokens.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: "Token de vérification invalide",
      });
    }

    // 2. Vérifier que le token n'a pas déjà été utilisé
    if (verificationToken.used_at) {
      return res.status(400).json({
        success: false,
        message: "Ce lien a déjà été utilisé",
      });
    }

    // 3. Vérifier que le token n'a pas expiré
    if (new Date() > verificationToken.expires_at) {
      return res.status(400).json({
        success: false,
        message: "Le lien de vérification a expiré",
      });
    }

    // 4. Marquer l'email comme vérifié
    await db.users.update({
      where: { id: verificationToken.user_id },
      data: { email_verified: true },
    });

    // 5. Marquer le token comme utilisé
    await db.emailVerificationTokens.update({
      where: { id: verificationToken.id },
      data: { used_at: new Date() },
    });

    // 6. Générer un JWT pour connecter l'utilisateur
    const jwtToken = jwt.sign(
      {
        userId: verificationToken.user.id,
        email: verificationToken.user.email,
        role: verificationToken.user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 7. Retourner le token et les données utilisateur
    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: verificationToken.user.id,
        email: verificationToken.user.email,
        email_verified: true,
        role: verificationToken.user.role,
        profile: verificationToken.user.profile,
        organizationId: verificationToken.user.organization_id,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la vérification d\'email:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de l'email",
    });
  }
});
```

### Endpoint de renvoi d'email

```typescript
// routes/auth.ts
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Chercher l'utilisateur
    const user = await db.users.findUnique({
      where: { email },
    });

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return res.json({
        success: true,
        message: "Si cet email existe, un lien de vérification a été envoyé",
      });
    }

    // 2. Vérifier si l'email est déjà vérifié
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà vérifié",
      });
    }

    // 3. Invalider les anciens tokens
    await db.emailVerificationTokens.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    // 4. Générer un nouveau token
    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h de validité

    await db.emailVerificationTokens.create({
      data: {
        user_id: user.id,
        token: newToken,
        expires_at: expiresAt,
      },
    });

    // 5. Envoyer l'email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}`;

    await sendEmail({
      to: user.email,
      subject: "Vérifiez votre adresse email",
      html: `
        <h1>Vérification d'email</h1>
        <p>Bonjour,</p>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
        <a href="${verificationLink}">Vérifier mon email</a>
        <p>Ce lien expire dans 24 heures.</p>
      `,
    });

    return res.json({
      success: true,
      message: "Email de vérification envoyé",
    });
  } catch (error) {
    console.error('Erreur lors du renvoi de l\'email:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du renvoi de l'email",
    });
  }
});
```

---

## 📝 Checklist de vérification

### Backend

- [ ] Table `email_verification_tokens` existe
- [ ] Endpoint `GET /auth/verify-email/:token` existe
- [ ] Endpoint `POST /auth/resend-verification` existe
- [ ] Les tokens sont générés lors du signup
- [ ] Les emails sont envoyés lors du signup
- [ ] Le JWT est généré après vérification
- [ ] L'utilisateur est marqué `email_verified: true`

### Frontend

- [✅] Route `/verify-email` existe dans App.tsx
- [✅] Composant `VerifyEmailForm` gère le token
- [✅] API client `verifyEmail()` appelle le bon endpoint
- [✅] localStorage utilise la clé `"token"`
- [✅] Gestion d'erreur avec messages explicites
- [✅] Redirection vers `/` après succès

### Base de données

- [ ] Token existe : `SELECT * FROM email_verification_tokens WHERE token = '...'`
- [ ] Token non utilisé : `used_at IS NULL`
- [ ] Token non expiré : `expires_at > NOW()`
- [ ] User associé existe : `user_id` valide
- [ ] User non vérifié : `email_verified = false`

---

## 🧪 Test complet du flux

### 1. Inscription d'un nouvel utilisateur

```bash
curl -X POST "http://localhost:3000/organizations/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Test Org",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

**Vérifier :**
- [✅] Status 200/201
- [✅] Message : "email_verification_required: true"
- [✅] Email reçu avec lien de vérification

### 2. Vérifier le token en base

```sql
SELECT t.*, u.email, u.email_verified
FROM email_verification_tokens t
JOIN users u ON u.id = t.user_id
WHERE u.email = 'john.doe@example.com'
ORDER BY t.created_at DESC
LIMIT 1;
```

**Résultat attendu :**
```
id       | ...
user_id  | ...
token    | 3e955c657e6a3c4303ac3a92d4c6b84974af1e46df85046146133c8309c8da47
expires_at | 2025-12-21 10:00:00
used_at  | NULL
email    | john.doe@example.com
email_verified | false
```

### 3. Tester l'endpoint de vérification

```bash
TOKEN="3e955c657e6a3c4303ac3a92d4c6b84974af1e46df85046146133c8309c8da47"

curl -X GET "http://localhost:3000/auth/verify-email/$TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

**Réponse attendue :**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "john.doe@example.com",
    "email_verified": true,
    ...
  }
}
```

### 4. Vérifier en base que l'email est vérifié

```sql
SELECT email, email_verified
FROM users
WHERE email = 'john.doe@example.com';
```

**Résultat attendu :**
```
email                  | email_verified
john.doe@example.com   | true
```

### 5. Vérifier que le token est marqué comme utilisé

```sql
SELECT used_at
FROM email_verification_tokens
WHERE token = '3e955c657e6a3c4303ac3a92d4c6b84974af1e46df85046146133c8309c8da47';
```

**Résultat attendu :**
```
used_at
2025-12-20 14:30:00
```

### 6. Tester le renvoi d'email

```bash
curl -X POST "http://localhost:3000/auth/resend-verification" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com"}'
```

**Si déjà vérifié :**
```json
{
  "success": false,
  "message": "Cet email est déjà vérifié"
}
```

---

## 🔗 Ressources

- **Frontend :** `src/components/auth/VerifyEmailForm.tsx`
- **API Client :** `src/api/endpoints/auth.ts`
- **Guide Email :** `EMAIL_VERIFICATION_GUIDE.md`
- **Contexte Auth :** `src/context/AuthContext.tsx`

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Collectez les logs :**
   - Console frontend (F12 > Console)
   - Logs backend (terminal)
   - Erreur SQL (si applicable)

2. **Vérifiez la configuration :**
   - Variables d'environnement (`FRONTEND_URL`, `JWT_SECRET`, `SMTP_*`)
   - URL de l'API dans `.env` frontend

3. **Testez manuellement :**
   - cURL pour tester l'endpoint
   - Vérifiez la base de données directement

---

**Date de création :** 20 Décembre 2025
**Dernière mise à jour :** 20 Décembre 2025
