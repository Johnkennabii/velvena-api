# 📧 Charte Graphique Email Unifiée

## 🎨 Design

Tous les emails Velvena utilisent désormais une charte graphique unifiée avec :

- **Gradient violet** : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Design moderne** : Bordures arrondies, ombres douces, espacement harmonieux
- **Responsive** : Compatible mobile et desktop
- **En français** : Tous les contenus en français

---

## 📄 Templates Disponibles

### 1. Email de Bienvenue
**Fichier** : `src/templates/emailTemplates.ts`
**Fonction** : `getWelcomeEmailTemplate(data: WelcomeEmailData)`

**Envoyé lors de** : Création d'une nouvelle organisation

**Contenu** :
- Header avec gradient violet ✨ VELVENA
- Message de bienvenue personnalisé
- Informations du compte (organisation, slug, période d'essai)
- Bouton CTA "🚀 Accéder à mon espace"
- Liste des fonctionnalités disponibles
- Guide des premiers pas
- Footer avec liens (Site web, Support, Guide)

---

### 2. Email de Signature de Contrat
**Fichier** : `src/templates/emailTemplates.ts`
**Fonction** : `getContractSignEmailTemplate(data: ContractSignEmailData)`

**Envoyé lors de** : Génération d'un lien de signature électronique

**Contenu** :
- Header avec gradient violet ✨ ORGANISATION_NAME
- Salutation personnalisée au client
- Carte d'information avec détails du contrat (numéro, organisation, expiration)
- Bouton CTA "✍️ Signer mon contrat" (gradient violet)
- Warning jaune pour la date d'expiration
- Footer standard

**Fichier modifié** : `src/controllers/contractController/contractController.ts`

---

### 3. Email de Validation de Suppression de Compte
**Fichier** : `src/templates/emailTemplates.ts`
**Fonction** : `getAccountDeletionValidationEmailTemplate(data: AccountDeletionValidationEmailData)`

**Envoyé lors de** : Demande de suppression de compte (managers uniquement)

**Contenu** :
- Header avec gradient violet ✨ ORGANISATION_NAME
- Titre d'alerte "⚠️ Demande de suppression de compte"
- Warning rouge avec liste des données supprimées
- Carte violet avec code de validation (grande taille, monospace)
- Instructions de confirmation
- Information sur l'expiration (30 minutes)
- Note de sécurité
- Footer standard

**Fichier modifié** : `src/services/accountDeletionService.ts`

---

## 🎨 Composants Réutilisables

### Template de Base
```typescript
function getEmailBaseHTML(content: string, organizationName: string): string
```

**Fournit** :
- Header avec gradient violet et logo ✨ VELVENA
- Zone de contenu personnalisée
- Footer avec liens (Site web, Support, Guide)
- Copyright automatique

---

## 🔧 Structure des Templates

### Header (Gradient Violet)
```html
<td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:40px 20px; text-align:center;">
  <div style="font-size:32px; font-weight:bold; color:#ffffff; letter-spacing:1px;">
    ✨ VELVENA
  </div>
  <div style="color:rgba(255,255,255,0.9); font-size:16px;">
    Gestion de Robes de Mariée
  </div>
</td>
```

### Bouton CTA (Gradient Violet)
```html
<a href="URL" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#ffffff; padding:16px 40px; border-radius:8px; font-weight:600; box-shadow:0 4px 12px rgba(102,126,234,0.3);">
  Texte du bouton
</a>
```

### Card d'Information
```html
<div style="background:linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-left:4px solid #667eea; padding:20px; border-radius:4px;">
  <h3 style="color:#667eea;">Titre</h3>
  <!-- Contenu -->
</div>
```

### Warning/Alert
```html
<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; border-radius:4px;">
  <p style="color:#92400e;">
    ⚠️ Message d'alerte
  </p>
</div>
```

---

## 🎨 Palette de Couleurs

### Couleurs Principales
- **Violet foncé** : `#667eea`
- **Violet clair** : `#764ba2`
- **Gradient** : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Couleurs de Fond
- **Fond global** : `#f5f5f5`
- **Card** : `#ffffff`
- **Info card** : `linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%)`
- **Footer** : `#f7fafc`

### Couleurs de Texte
- **Titre principal** : `#111827`
- **Titre secondaire** : `#667eea`
- **Texte standard** : `#4a5568`
- **Texte secondaire** : `#6b7280`
- **Texte footer** : `#718096`
- **Texte legal** : `#a0aec0`

### Couleurs d'Alerte
- **Warning (fond)** : `#fef3c7`
- **Warning (bordure)** : `#f59e0b`
- **Warning (texte)** : `#92400e`
- **Danger (fond)** : `#fee2e2`
- **Danger (bordure)** : `#dc2626`
- **Danger (texte)** : `#991b1b`

---

## 📐 Spacing & Sizing

### Conteneur Principal
- **Largeur max** : `600px`
- **Padding** : `40px 30px`
- **Border-radius** : `8px`

### Header
- **Padding** : `40px 20px`
- **Logo size** : `32px`
- **Sous-titre size** : `16px`

### Titres
- **H2** : `24px` / `font-weight: 700`
- **H3** : `18px` / `font-weight: 600`

### Texte
- **Standard** : `16px` / `line-height: 1.6`
- **Petit** : `14px` / `line-height: 1.6`

### Boutons
- **Padding** : `16px 40px`
- **Font-size** : `16px`
- **Font-weight** : `600`
- **Border-radius** : `8px`

---

## 🚀 Utilisation

### Exemple : Email de signature de contrat

```typescript
import {
  getContractSignEmailTemplate,
  type ContractSignEmailData,
} from "../templates/emailTemplates.js";

const emailData: ContractSignEmailData = {
  organizationName: "Ma Boutique",
  customerName: "Marie Dupont",
  contractNumber: "CT-2025-001",
  signatureUrl: "https://app.velvena.fr/sign/abc123",
  expiresAt: "mardi 24 décembre 2025 à 14:30",
};

const mailOptions = {
  from: process.env.SMTP_FROM,
  to: "client@example.com",
  subject: `✍️ Signature de votre contrat – Ma Boutique`,
  html: getContractSignEmailTemplate(emailData),
};

await transporter.sendMail(mailOptions);
```

---

## ✅ Avantages

1. **Cohérence visuelle** : Tous les emails ont le même look professionnel
2. **Maintenance facile** : Un seul fichier à modifier pour tous les templates
3. **Gradient violet** : Identité visuelle forte et moderne
4. **Responsive** : Fonctionne sur mobile et desktop
5. **Multilingue** : Tous les emails en français
6. **Composants réutilisables** : Header, footer, boutons, cards
7. **Accessibilité** : Bon contraste, tailles de police lisibles

---

## 📋 Checklist pour Nouveaux Emails

Lorsque vous créez un nouvel email :

- [ ] Utiliser `getEmailBaseHTML()` pour le wrapper
- [ ] Header avec gradient violet automatique
- [ ] Texte en français uniquement
- [ ] Utiliser les couleurs de la palette
- [ ] Boutons CTA avec gradient violet
- [ ] Informations importantes dans des cards
- [ ] Warnings/alerts avec codes couleur appropriés
- [ ] Footer automatique avec liens
- [ ] Tester sur mobile et desktop
- [ ] Vérifier l'accessibilité (contraste, taille)

---

## 🔮 Emails Futurs

Templates à créer avec la même charte :

1. **Email de réinitialisation de mot de passe**
2. **Email de notification de contrat signé**
3. **Email de rappel de paiement**
4. **Email de confirmation de paiement**
5. **Email de fin de période d'essai**
6. **Email de renouvellement d'abonnement**
7. **Email de notification de message**

---

## 📝 Notes Techniques

### Variables d'Environnement Requises
```env
SMTP_HOST=mail.gandi.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@velvena.fr
SMTP_PASS=***
SMTP_FROM="Velvena <contact@velvena.fr>"
```

### Test Local
```bash
# Créer une organisation
curl -X POST http://localhost:3000/organizations/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test",
    "userEmail": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## 🎨 Exemple Visuel

```
┌─────────────────────────────────────────────┐
│  [Gradient Violet Header]                   │
│     ✨ VELVENA                              │
│     Gestion de Robes de Mariée             │
└─────────────────────────────────────────────┘
│                                             │
│  Bonjour Client,                            │
│                                             │
│  Votre contrat est prêt...                  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 📋 Détails du contrat [Violet]       │  │
│  │ Numéro: CT-2025-001                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│       [Bouton Violet Gradient]              │
│       ✍️ Signer mon contrat                │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ ⚠️ Important: Expire le... [Jaune]   │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│  [Footer Gris Clair]                        │
│  L'équipe Velvena                           │
│  Site • Support • Guide                     │
│  © 2025 Velvena                             │
└─────────────────────────────────────────────┘
```

---

**Date de création** : 2025-12-19
**Version** : 1.0
**Status** : ✅ IMPLÉMENTÉ
