# 📧 Guide de Vérification d'Email - VELVENA

## 🎯 Vue d'ensemble

Le système de vérification d'email assure que les utilisateurs confirment leur adresse email avant de pouvoir se connecter à l'application. Cette fonctionnalité renforce la sécurité et garantit que les communications importantes peuvent atteindre les utilisateurs.

---

## 🔐 Fonctionnement

### 1. **Création d'organisation**

Lorsqu'un nouvel utilisateur initialise une organisation via `POST /organizations/initialize` :

1. ✅ L'organisation et l'utilisateur sont créés en base de données
2. ✅ Un token de vérification sécurisé est généré (32 bytes, hex)
3. ✅ Un email de vérification est envoyé à l'utilisateur
4. ❌ **Aucun JWT n'est retourné** → L'utilisateur ne peut pas se connecter immédiatement

**Réponse API :**
```json
{
  "message": "Organization created successfully. Please check your email to verify your account.",
  "success": true,
  "email_verification_required": true,
  "organization": {
    "id": "uuid",
    "name": "Ma Boutique",
    "slug": "ma-boutique"
  },
  "user": {
    "email": "user@example.com"
  }
}
```

### 2. **Vérification d'email**

L'utilisateur reçoit un email contenant un lien :
```
https://app.velvena.com/verify-email?token=XXXXXXXX
```

En cliquant sur le lien, une requête est envoyée à `GET /auth/verify-email/:token` :

1. ✅ Le token est validé (existence, expiration)
2. ✅ Le champ `email_verified` est mis à `true`
3. ✅ Un JWT est retourné pour connexion automatique
4. ✅ Le token est supprimé de la base de données

**Réponse API :**
```json
{
  "message": "Email verified successfully. You can now login.",
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "MANAGER",
    "organization": {
      "id": "uuid",
      "name": "Ma Boutique",
      "slug": "ma-boutique"
    }
  }
}
```

### 3. **Tentative de connexion sans vérification**

Si l'utilisateur tente de se connecter via `POST /auth/login` sans avoir vérifié son email :

```json
{
  "error": "Email not verified",
  "message": "Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception.",
  "email_verification_required": true
}
```

**Status Code :** `403 Forbidden`

### 4. **Renvoi d'email de vérification**

Si l'email n'arrive pas ou a expiré, l'utilisateur peut demander un nouveau lien via `POST /auth/resend-verification` :

**Requête :**
```json
{
  "email": "user@example.com"
}
```

**Réponse :**
```json
{
  "message": "Verification email resent successfully. Please check your inbox.",
  "success": true
}
```

---

## 🛠️ API Endpoints

### **POST /organizations/initialize**
Créer une nouvelle organisation et envoyer l'email de vérification.

**Body :**
```json
{
  "organizationName": "Ma Boutique",
  "email": "contact@boutique.com",
  "userEmail": "manager@boutique.com",
  "password": "MotDePasse123!",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Réponse (201) :**
```json
{
  "message": "Organization created successfully. Please check your email to verify your account.",
  "success": true,
  "email_verification_required": true,
  "organization": { ... },
  "user": { ... }
}
```

---

### **GET /auth/verify-email/:token**
Vérifier l'email avec le token reçu par email.

**Paramètres :**
- `token` (string, required) - Token de vérification

**Réponse (200) :**
```json
{
  "message": "Email verified successfully. You can now login.",
  "success": true,
  "token": "JWT_TOKEN_HERE",
  "user": { ... }
}
```

**Erreurs possibles :**
- `400 Bad Request` - Token invalide ou expiré
- `404 Not Found` - Utilisateur introuvable
- `500 Internal Server Error` - Erreur serveur

---

### **POST /auth/resend-verification**
Renvoyer l'email de vérification.

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Réponse (200) :**
```json
{
  "message": "Verification email resent successfully. Please check your inbox.",
  "success": true
}
```

**Erreurs possibles :**
- `400 Bad Request` - Email déjà vérifié ou utilisateur introuvable
- `500 Internal Server Error` - Erreur serveur

---

### **POST /auth/login**
Se connecter (nécessite email vérifié).

**Body :**
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse (200) :**
```json
{
  "token": "JWT_TOKEN_HERE",
  "id": "uuid",
  "email": "user@example.com",
  "role": "MANAGER",
  "organization": { ... }
}
```

**Erreurs possibles :**
- `403 Forbidden` - Email non vérifié
- `401 Unauthorized` - Email ou mot de passe incorrect

---

## 📊 Métriques Prometheus

Le système expose les métriques suivantes pour le monitoring :

### **email_verification_sent_total**
Nombre total d'emails de vérification envoyés.
- **Type :** Counter
- **Labels :** `status` (success/failure)

**Exemple de requête PromQL :**
```promql
# Taux d'envoi d'emails de vérification
rate(email_verification_sent_total{status="success"}[5m])

# Taux d'échec d'envoi
rate(email_verification_sent_total{status="failure"}[5m])
```

---

### **email_verified_total**
Nombre total de vérifications d'email réussies.
- **Type :** Counter

**Exemple de requête PromQL :**
```promql
# Nombre total de vérifications réussies
sum(email_verified_total)

# Taux de vérification par minute
rate(email_verified_total[5m]) * 60
```

---

### **email_verification_failed_total**
Nombre total de vérifications échouées.
- **Type :** Counter
- **Labels :** `reason` (invalid_token/expired_token/already_verified)

**Exemple de requête PromQL :**
```promql
# Échecs par raison
sum by (reason) (email_verification_failed_total)

# Taux de tokens expirés
rate(email_verification_failed_total{reason="expired_token"}[5m])
```

---

### **email_verification_resend_total**
Nombre total de renvois d'email de vérification.
- **Type :** Counter
- **Labels :** `status` (success/failure)

**Exemple de requête PromQL :**
```promql
# Nombre de renvois
sum(email_verification_resend_total{status="success"})

# Taux de renvoi par heure
rate(email_verification_resend_total[1h]) * 3600
```

---

## 🎨 Dashboard Grafana Recommandé

### **Panel 1 : Envois d'emails de vérification**
- **Type :** Time series
- **Query :** `sum(rate(email_verification_sent_total{status="success"}[5m])) * 60`
- **Unit :** emails/min

### **Panel 2 : Vérifications réussies**
- **Type :** Stat
- **Query :** `sum(email_verified_total)`
- **Unit :** short

### **Panel 3 : Taux de vérification**
- **Type :** Gauge
- **Query :** `sum(email_verified_total) / sum(email_verification_sent_total{status="success"}) * 100`
- **Unit :** percent

### **Panel 4 : Échecs de vérification (par raison)**
- **Type :** Pie chart
- **Query :** `sum by (reason) (email_verification_failed_total)`

### **Panel 5 : Renvois d'emails**
- **Type :** Time series
- **Query :** `sum(rate(email_verification_resend_total[5m])) * 60`
- **Unit :** resends/min

---

## 🔧 Configuration

### **Variables d'environnement**

```env
# Frontend URL (pour les liens de vérification)
APP_URL=https://app.velvena.com

# SMTP Configuration (pour l'envoi d'emails)
SMTP_HOST=mail.gandi.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@velvena.com
SMTP_PASSWORD=your_password
SMTP_FROM=Velvena <noreply@velvena.com>
```

### **Paramètres du système**

Dans `src/services/emailVerificationService.ts` :

```typescript
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24; // Expiration du token (24 heures par défaut)
```

---

## 📧 Template d'email

L'email de vérification inclut :

✅ **Sujet :** `🔐 Vérifiez votre adresse email - [Nom Organisation]`

✅ **Contenu :**
- Message de bienvenue personnalisé
- Bouton CTA clair "Vérifier mon email"
- Lien de vérification en texte brut (backup)
- Avertissement d'expiration (24 heures)
- Explication de l'importance de la vérification

✅ **Design :**
- Responsive (mobile-friendly)
- Branding Velvena (gradient violet)
- Format HTML + Plain text (fallback)

---

## 🚨 Audit Logs

Toutes les opérations de vérification d'email sont enregistrées dans la table `AuditLog` pour conformité RGPD :

### **EMAIL_VERIFICATION_SENT**
```json
{
  "action": "EMAIL_VERIFICATION_SENT",
  "user_id": "uuid",
  "status": "SUCCESS",
  "metadata": {
    "email": "user@example.com",
    "expires_at": "2025-12-21T20:00:00.000Z"
  }
}
```

### **EMAIL_VERIFIED**
```json
{
  "action": "EMAIL_VERIFIED",
  "user_id": "uuid",
  "organization_id": "uuid",
  "status": "SUCCESS",
  "metadata": {
    "email": "user@example.com"
  }
}
```

**Rétention :** 7 ans (conformité RGPD)

---

## 🐛 Dépannage

### **Problème : L'utilisateur ne reçoit pas l'email de vérification**

**Causes possibles :**
1. Email dans les spams
2. Configuration SMTP incorrecte
3. Email invalide

**Solutions :**
```bash
# Vérifier les logs du serveur
tail -f logs/app.log | grep "verification"

# Vérifier la configuration SMTP
curl -X POST http://localhost:3000/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Vérifier les métriques
curl http://localhost:3000/metrics | grep email_verification
```

---

### **Problème : Token expiré**

**Message d'erreur :**
```json
{
  "error": "Invalid or expired token",
  "message": "Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.",
  "token_invalid": true
}
```

**Solution :**
L'utilisateur doit demander un nouveau lien via `/auth/resend-verification`.

---

### **Problème : Email déjà vérifié**

Si l'utilisateur clique plusieurs fois sur le lien, la vérification reste valide :

```json
{
  "message": "Email verified successfully. You can now login.",
  "success": true,
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées (`APP_URL`, `SMTP_*`)
- [ ] Migration Prisma appliquée (`20251220205219_add_email_verification_fields`)
- [ ] Service SMTP testé et fonctionnel
- [ ] Template d'email personnalisé (optionnel)
- [ ] Dashboard Grafana créé pour le monitoring
- [ ] Alertes Prometheus configurées
- [ ] Documentation partagée avec l'équipe
- [ ] Tests e2e effectués

---

## 📚 Ressources

### **Fichiers modifiés**
- `prisma/schema.prisma` - Ajout champs `email_verified`, `email_verification_token`, `email_verification_token_expires_at`
- `src/services/emailVerificationService.ts` - Service de vérification
- `src/controllers/userController/authController.ts` - Endpoints `verifyEmail`, `resendVerification`
- `src/controllers/organizationController.ts` - Modification `initializeOrganization`
- `src/routes/userRoutes/auth.ts` - Routes de vérification
- `src/utils/metrics.ts` - Métriques Prometheus

### **Nouveaux endpoints**
- `GET /auth/verify-email/:token`
- `POST /auth/resend-verification`

### **Base de données**
- Migration : `20251220205219_add_email_verification_fields`

---

**Dernière mise à jour** : 2025-12-20
**Version** : 1.0
**Status** : ✅ PRODUCTION READY
