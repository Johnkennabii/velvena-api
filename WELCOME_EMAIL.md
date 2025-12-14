# Email de Bienvenue Automatique

## 🎯 Comportement

Lorsqu'une nouvelle organisation est créée via l'endpoint `/organizations/initialize`, un **email de bienvenue** est automatiquement envoyé à l'utilisateur.

---

## ✨ Fonctionnalités

### Email de Bienvenue

**Envoyé à** : L'email de l'utilisateur principal (manager) de l'organisation

**Envoyé quand** : Immédiatement après la création de l'organisation

**Contenu** :
- Message de bienvenue personnalisé
- Informations sur l'organisation créée
- Lien direct vers l'espace de l'organisation
- Nombre de jours d'essai restants
- Liste des fonctionnalités disponibles
- Premiers pas pour démarrer

**Type** : Email HTML responsive avec fallback texte brut

---

## 🔧 Implémentation

### Architecture

```
organizationController.ts
    ↓ Crée l'organisation
    ↓ Appelle sendWelcomeEmail()
    ↓
welcomeEmailService.ts
    ↓ Récupère le template
    ↓
emailTemplates.ts
    ↓ Génère HTML + texte
    ↓
mailer.ts
    ↓ Envoie via SMTP
```

### Fichiers créés

1. **`src/templates/emailTemplates.ts`**
   - Template HTML professionnel et responsive
   - Template texte brut (fallback)
   - Interface `WelcomeEmailData`

2. **`src/services/welcomeEmailService.ts`**
   - Service d'envoi d'email de bienvenue
   - Gestion des erreurs (non-bloquant)

3. **Modification de `src/controllers/organizationController.ts`**
   - Intégration dans `initializeOrganization()`
   - Envoi asynchrone (non-bloquant)

---

## 📧 Contenu de l'Email

### Sections principales

1. **Header avec gradient**
   - Logo Velvena
   - Titre "Gestion de Robes de Mariée"

2. **Message de bienvenue**
   - Salutation personnalisée avec prénom/nom
   - Message d'accueil chaleureux

3. **Informations du compte**
   - Nom de l'organisation
   - URL de l'espace (slug)
   - Période d'essai restante
   - Email de connexion

4. **Bouton CTA**
   - "Accéder à mon espace"
   - Lien direct vers `https://app.velvena.fr/`

5. **Liste des fonctionnalités**
   - Gestion des robes
   - Gestion des clients
   - Contrats intelligents
   - Messagerie intégrée
   - Tableaux de bord
   - Sécurité

6. **Premiers pas**
   - Guide en 4 étapes pour démarrer

7. **Footer**
   - Liens vers le site, support, documentation
   - Informations légales
   - Politique de confidentialité

### Design

- **Couleurs** : Gradient violet (#667eea, #764ba2)
- **Responsive** : Optimisé mobile et desktop
- **Accessibilité** : Texte brut disponible
- **Professionnalisme** : Design moderne et élégant

---

## 🚀 Utilisation

### Endpoint : `/organizations/initialize`

**Déclenchement automatique** : L'email est envoyé automatiquement après la création

```typescript
POST /organizations/initialize
{
  "organizationName": "Ma Boutique",
  "userEmail": "contact@example.com",
  "password": "password123",
  "firstName": "Marie",
  "lastName": "Dupont"
}
```

**Réponse** :
```json
{
  "message": "Organization created successfully",
  "token": "...",
  "organization": {
    "id": "...",
    "name": "Ma Boutique",
    "slug": "ma-boutique",
    "subscription_plan": "free",
    "trial_ends_at": "2025-01-01T00:00:00.000Z"
  },
  "user": {
    "id": "...",
    "email": "contact@example.com",
    "profile": {
      "firstName": "Marie",
      "lastName": "Dupont"
    }
  }
}
```

**En arrière-plan** :
- L'email de bienvenue est envoyé à `contact@example.com`
- L'envoi est asynchrone et ne bloque pas la réponse
- En cas d'erreur d'envoi, l'organisation est quand même créée

---

## 🔒 Gestion des Erreurs

### Comportement non-bloquant

L'envoi de l'email est **non-bloquant** :

```typescript
sendWelcomeEmail({...}).catch((err) => {
  logger.error({ err }, "Failed to send welcome email (non-blocking)");
});
```

**Pourquoi ?**
- L'inscription ne doit jamais échouer à cause d'un problème d'email
- L'utilisateur reçoit sa réponse immédiatement
- Les erreurs d'email sont loguées pour monitoring

### Logs

**Email envoyé avec succès** :
```json
{
  "level": "info",
  "msg": "Welcome email sent successfully",
  "organizationName": "Ma Boutique",
  "userEmail": "contact@example.com",
  "slug": "ma-boutique"
}
```

**Échec d'envoi** :
```json
{
  "level": "error",
  "msg": "Failed to send welcome email",
  "err": {...},
  "organizationName": "Ma Boutique",
  "userEmail": "contact@example.com"
}
```

---

## 🧪 Test

### Test manuel local

1. Créer une organisation via `/organizations/initialize`
2. Vérifier les logs pour confirmer l'envoi
3. Vérifier la réception de l'email

### Vérifier les variables d'environnement

**Requis** :
```env
SMTP_HOST=mail.gandi.net
SMTP_PORT=465
SMTP_USER=noreply@velvena.fr
SMTP_PASSWORD=***
SMTP_FROM=noreply@velvena.fr
```

### Test avec un vrai email

```bash
curl -X POST https://api.velvena.fr/organizations/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test Boutique",
    "userEmail": "votre-email@example.com",
    "password": "Test123456!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Vous devriez recevoir l'email de bienvenue dans quelques secondes.

---

## 📊 Données de l'Email

### Interface `WelcomeEmailData`

```typescript
interface WelcomeEmailData {
  organizationName: string;        // Nom de l'organisation
  firstName?: string | undefined;  // Prénom (optionnel)
  lastName?: string | undefined;   // Nom (optionnel)
  userEmail: string;               // Email de l'utilisateur
  slug: string;                    // Slug de l'organisation
  trialEndsAt: Date;               // Date de fin de la période d'essai
}
```

### Calcul des jours d'essai

```typescript
const trialDays = Math.ceil(
  (data.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
);
```

---

## 🎨 Personnalisation

### Modifier le template HTML

Fichier : `src/templates/emailTemplates.ts`

Fonction : `getWelcomeEmailTemplate()`

**Sections modifiables** :
- Couleurs du gradient
- Texte de bienvenue
- Liste des fonctionnalités
- Footer et liens

### Modifier le template texte

Fonction : `getWelcomeEmailText()`

Version texte brut pour les clients email sans support HTML.

### Ajouter d'autres emails

Créer de nouvelles fonctions dans `emailTemplates.ts` :

```typescript
export function getPasswordResetTemplate(data: {...}): string {
  return `...HTML template...`;
}

export function getPasswordResetText(data: {...}): string {
  return `...text template...`;
}
```

---

## 📈 Monitoring

### Métriques à surveiller

- **Taux de délivrabilité** : Emails envoyés vs échecs
- **Logs d'erreurs** : Surveiller les erreurs SMTP
- **Temps d'envoi** : Performance du serveur SMTP

### Améliorer la délivrabilité

✅ **SPF** : Configurer SPF pour votre domaine
✅ **DKIM** : Signer les emails avec DKIM
✅ **DMARC** : Politique DMARC pour éviter le spam
✅ **Reverse DNS** : Configurer le PTR record

---

## ❓ FAQ

**Q : L'email est-il obligatoire pour créer une organisation ?**
**R** : Non, l'inscription fonctionne même si l'email échoue (comportement non-bloquant).

**Q : Peut-on désactiver l'envoi d'email ?**
**R** : Oui, commenter l'appel à `sendWelcomeEmail()` dans `organizationController.ts`.

**Q : L'email est-il envoyé en production ?**
**R** : Oui, si les variables SMTP sont configurées correctement.

**Q : Combien de temps faut-il pour recevoir l'email ?**
**R** : Généralement moins de 10 secondes.

**Q : Que faire si l'email n'arrive pas ?**
**R** : Vérifier les logs, le spam, et la configuration SMTP.

**Q : Peut-on renvoyer l'email de bienvenue ?**
**R** : Actuellement non, mais on peut ajouter un endpoint `/resend-welcome-email` si besoin.

---

## ✅ Avantages

1. **Expérience utilisateur améliorée** : Confirmation immédiate de l'inscription
2. **Onboarding guidé** : L'email explique les prochaines étapes
3. **Professionnalisme** : Design soigné et cohérent avec la marque
4. **Information complète** : Toutes les infos essentielles en un seul email
5. **Non-bloquant** : N'interfère pas avec le flux d'inscription
6. **Traçabilité** : Logs pour debugging et monitoring

---

## 🔮 Évolutions Futures

**Idées d'amélioration** :

1. **Traduction** : Support multi-langues
2. **Email analytics** : Tracking des ouvertures et clics
3. **A/B testing** : Tester différentes versions du template
4. **Segmentation** : Templates différents selon le plan choisi
5. **Email de relance** : Si l'utilisateur ne se connecte pas après 48h
6. **Newsletter** : Inscription automatique à la newsletter
7. **Email de fin de trial** : Rappel avant la fin de la période d'essai
