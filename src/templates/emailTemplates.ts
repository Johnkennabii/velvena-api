/**
 * Email Templates
 * Professional HTML email templates for Velvena
 * Charte graphique unifiée avec gradient violet
 */

/**
 * Template HTML de base réutilisable
 * Retourne le HTML complet avec header/footer violet
 */
function getEmailBaseHTML(content: string, organizationName: string = "Velvena"): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${organizationName}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.05);">

          <!-- HEADER avec gradient violet -->
          <tr>
            <td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:40px 20px; text-align:center;">
              <div style="font-size:32px; font-weight:bold; color:#ffffff; letter-spacing:1px; margin-bottom:10px;">
                ✨ ${organizationName.toUpperCase()}
              </div>
              <div style="color:rgba(255,255,255,0.9); font-size:16px;">
                Gestion de Robes de Mariée
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f7fafc; padding:30px; text-align:center; border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 10px 0; color:#718096; font-size:14px;">
                L'équipe <strong>${organizationName}</strong>
              </p>
              <div style="margin:20px 0;">
                <a href="https://velvena.fr" style="color:#667eea; text-decoration:none; font-size:14px; margin:0 8px;">Site web</a>
                <span style="color:#cbd5e0;">•</span>
                <a href="https://velvena.fr/support" style="color:#667eea; text-decoration:none; font-size:14px; margin:0 8px;">Support</a>
                <span style="color:#cbd5e0;">•</span>
                <a href="https://velvena.fr/guide" style="color:#667eea; text-decoration:none; font-size:14px; margin:0 8px;">Guide</a>
              </div>
              <p style="margin:20px 0 0 0; color:#a0aec0; font-size:12px;">
                © ${new Date().getFullYear()} ${organizationName}. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface WelcomeEmailData {
  organizationName: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  userEmail: string;
  slug: string;
  trialEndsAt: Date;
}

/**
 * Welcome email template for new organizations
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): string {
  const userName = data.firstName
    ? `${data.firstName}${data.lastName ? ` ${data.lastName}` : ""}`
    : data.userEmail;

  const appUrl = "https://app.velvena.fr/";
  const trialDays = Math.ceil(
    (data.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Velvena</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 20px;
    }

    .text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 20px;
    }

    .highlight-box {
      background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }

    .highlight-box h3 {
      color: #667eea;
      font-size: 18px;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .org-info {
      background-color: #ffffff;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
    }

    .org-info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .org-info-item:last-child {
      border-bottom: none;
    }

    .org-info-label {
      font-weight: 600;
      color: #4a5568;
    }

    .org-info-value {
      color: #667eea;
      font-weight: 500;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
    }

    .features {
      margin: 30px 0;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .feature-icon {
      font-size: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .feature-text {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.5;
    }

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e2e8f0, transparent);
      margin: 30px 0;
    }

    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      color: #718096;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .social-links {
      margin: 20px 0;
    }

    .social-link {
      display: inline-block;
      margin: 0 8px;
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
    }

    .legal {
      color: #a0aec0;
      font-size: 12px;
      margin-top: 20px;
    }

    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }

      .greeting {
        font-size: 20px;
      }

      .cta-button {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">✨ VELVENA</div>
      <div class="header-subtitle">Gestion de Robes de Mariée</div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Bienvenue, ${userName} ! 🎉
      </div>

      <p class="text">
        Nous sommes ravis de vous accueillir sur <strong>Velvena</strong>, votre solution complète de gestion de boutique de robes de mariée.
      </p>

      <p class="text">
        Votre organisation <strong>${data.organizationName}</strong> a été créée avec succès et est maintenant prête à être utilisée.
      </p>

      <!-- Organization Info Box -->
      <div class="highlight-box">
        <h3>📋 Informations de votre compte</h3>
        <div class="org-info">
          <div class="org-info-item">
            <span class="org-info-label">Organisation :</span>
            <span class="org-info-value">${data.organizationName}</span>
          </div>
          <div class="org-info-item">
            <span class="org-info-label">URL de votre espace :</span>
            <span class="org-info-value">${data.slug}</span>
          </div>
          <div class="org-info-item">
            <span class="org-info-label">Période d'essai :</span>
            <span class="org-info-value">${trialDays} jours gratuits</span>
          </div>
          <div class="org-info-item">
            <span class="org-info-label">Email :</span>
            <span class="org-info-value">${data.userEmail}</span>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <center>
        <a href="${appUrl}" class="cta-button">
          🚀 Accéder à mon espace
        </a>
      </center>

      <div class="divider"></div>

      <!-- Features -->
      <div class="features">
        <p class="text" style="font-weight: 600; margin-bottom: 20px;">
          Découvrez ce que vous pouvez faire avec Velvena :
        </p>

        <div class="feature-item">
          <span class="feature-icon">👗</span>
          <div class="feature-text">
            <strong>Gestion des robes</strong> – Catalogue complet avec photos, tailles, couleurs et disponibilités
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">👰</span>
          <div class="feature-text">
            <strong>Gestion des clients</strong> – Fiches clients détaillées, historique et notes personnalisées
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">📄</span>
          <div class="feature-text">
            <strong>Contrats intelligents</strong> – Génération automatique de contrats et signature électronique
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">📧</span>
          <div class="feature-text">
            <strong>Messagerie intégrée</strong> – Communiquez directement avec vos clients depuis l'application
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <div class="feature-text">
            <strong>Tableaux de bord</strong> – Visualisez vos performances et statistiques en temps réel
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">🔐</span>
          <div class="feature-text">
            <strong>Sécurité</strong> – Vos données sont protégées et sauvegardées quotidiennement
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Next Steps -->
      <div class="highlight-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
        <h3 style="color: #d97706;">💡 Premiers pas</h3>
        <p class="text" style="margin-top: 10px; margin-bottom: 10px;">
          1. Connectez-vous à votre espace<br/>
          2. Complétez les informations de votre boutique<br/>
          3. Ajoutez vos premières robes<br/>
          4. Invitez votre équipe à collaborer
        </p>
      </div>

      <p class="text">
        Vous avez des questions ? Notre équipe support est disponible pour vous accompagner dans la prise en main de Velvena.
      </p>

      <p class="text">
        À très bientôt sur Velvena ! 💜
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text" style="font-weight: 600; color: #4a5568;">
        L'équipe Velvena
      </p>

      <div class="social-links">
        <a href="https://velvena.fr" class="social-link">Site web</a>
        <span style="color: #cbd5e0;">•</span>
        <a href="https://velvena.fr/support" class="social-link">Support</a>
        <span style="color: #cbd5e0;">•</span>
        <a href="https://velvena.fr/guide" class="social-link">Guide d'utilisation</a>
      </div>

      <p class="legal">
        © ${new Date().getFullYear()} Velvena. Tous droits réservés.<br/>
        Vous recevez cet email car vous avez créé un compte sur Velvena.<br/>
        <a href="https://velvena.fr/privacy" style="color: #a0aec0; text-decoration: none;">Politique de confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Plain text version of the welcome email (fallback)
 */
export function getWelcomeEmailText(data: WelcomeEmailData): string {
  const userName = data.firstName
    ? `${data.firstName}${data.lastName ? ` ${data.lastName}` : ""}`
    : data.userEmail;

  const appUrl = "https://app.velvena.fr/";
  const trialDays = Math.ceil(
    (data.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
Bienvenue sur Velvena, ${userName} !

Nous sommes ravis de vous accueillir sur Velvena, votre solution complète de gestion de boutique de robes de mariée.

Votre organisation "${data.organizationName}" a été créée avec succès et est maintenant prête à être utilisée.

📋 INFORMATIONS DE VOTRE COMPTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organisation : ${data.organizationName}
URL de votre espace : ${data.slug}
Période d'essai : ${trialDays} jours gratuits
Email : ${data.userEmail}

🚀 ACCÉDER À VOTRE ESPACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${appUrl}

✨ DÉCOUVREZ VELVENA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👗 Gestion des robes – Catalogue complet avec photos, tailles, couleurs et disponibilités
👰 Gestion des clients – Fiches clients détaillées, historique et notes personnalisées
📄 Contrats intelligents – Génération automatique de contrats et signature électronique
📧 Messagerie intégrée – Communiquez directement avec vos clients depuis l'application
📊 Tableaux de bord – Visualisez vos performances et statistiques en temps réel
🔐 Sécurité – Vos données sont protégées et sauvegardées quotidiennement

💡 PREMIERS PAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Connectez-vous à votre espace
2. Complétez les informations de votre boutique
3. Ajoutez vos premières robes
4. Invitez votre équipe à collaborer

Vous avez des questions ? Notre équipe support est disponible pour vous accompagner dans la prise en main de Velvena.

À très bientôt sur Velvena ! 💜

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
L'équipe Velvena

Site web : https://velvena.fr
Support : https://velvena.fr/support
Guide : https://velvena.fr/guide

© ${new Date().getFullYear()} Velvena. Tous droits réservés.
Vous recevez cet email car vous avez créé un compte sur Velvena.
  `.trim();
}

// ============================================
// EMAIL DE SIGNATURE DE CONTRAT
// ============================================

export interface ContractSignEmailData {
  organizationName: string;
  customerName: string;
  contractNumber: string;
  signatureUrl: string;
  expiresAt: string;
}

export function getContractSignEmailTemplate(data: ContractSignEmailData): string {
  const content = `
<h2 style="margin:0 0 16px 0; color:#111827; font-size:24px; font-weight:700;">
  Bonjour ${data.customerName},
</h2>

<p style="margin:0 0 16px 0; color:#4a5568; font-size:16px; line-height:1.6;">
  Votre contrat de location de robe est prêt pour signature électronique.
</p>

<div style="background:linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-left:4px solid #667eea; padding:20px; margin:24px 0; border-radius:4px;">
  <h3 style="margin:0 0 12px 0; color:#667eea; font-size:18px; font-weight:600;">
    📋 Détails du contrat
  </h3>
  <table width="100%" cellpadding="6" cellspacing="0">
    <tr>
      <td style="color:#4a5568; font-weight:600; font-size:14px;">Numéro de contrat :</td>
      <td style="color:#667eea; font-weight:600; font-size:14px; text-align:right;">${data.contractNumber}</td>
    </tr>
    <tr>
      <td style="color:#4a5568; font-weight:600; font-size:14px;">Organisation :</td>
      <td style="color:#667eea; font-weight:600; font-size:14px; text-align:right;">${data.organizationName}</td>
    </tr>
    <tr>
      <td style="color:#4a5568; font-weight:600; font-size:14px;">Expire le :</td>
      <td style="color:#d97706; font-weight:600; font-size:14px; text-align:right;">${data.expiresAt}</td>
    </tr>
  </table>
</div>

<p style="margin:24px 0 16px 0; color:#4a5568; font-size:16px; line-height:1.6;">
  Pour signer votre contrat en ligne de manière sécurisée, cliquez sur le bouton ci-dessous :
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td align="center">
      <a href="${data.signatureUrl}" style="display:inline-block; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#ffffff; text-decoration:none; padding:16px 40px; border-radius:8px; font-weight:600; font-size:16px; box-shadow:0 4px 12px rgba(102,126,234,0.3);">
        ✍️ Signer mon contrat
      </a>
    </td>
  </tr>
</table>

<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:24px 0; border-radius:4px;">
  <p style="margin:0; color:#92400e; font-size:14px; line-height:1.6;">
    <strong>⚠️ Important :</strong> Ce lien de signature est personnel et expire le <strong>${data.expiresAt}</strong>.
    Ne le partagez avec personne.
  </p>
</div>

<hr style="border:none; border-top:1px solid #e2e8f0; margin:32px 0;">

<p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
  Si vous rencontrez des difficultés, contactez <strong>${data.organizationName}</strong> directement.
</p>
  `;

  return getEmailBaseHTML(content, data.organizationName);
}

// ============================================
// EMAIL DE VALIDATION DE SUPPRESSION DE COMPTE
// ============================================

export interface AccountDeletionValidationEmailData {
  organizationName: string;
  organizationEmail: string;
  validationCode: string;
  expiresAt: Date;
}

export function getAccountDeletionValidationEmailTemplate(data: AccountDeletionValidationEmailData): string {
  const expiresAtFormatted = data.expiresAt.toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const content = `
<h2 style="margin:0 0 16px 0; color:#dc2626; font-size:24px; font-weight:700;">
  ⚠️ Demande de suppression de compte
</h2>

<p style="margin:0 0 16px 0; color:#4a5568; font-size:16px; line-height:1.6;">
  Une demande de suppression de compte pour <strong>${data.organizationName}</strong> a été initiée.
</p>

<div style="background:#fee2e2; border-left:4px solid #dc2626; padding:20px; margin:24px 0; border-radius:4px;">
  <p style="margin:0; color:#991b1b; font-size:15px; line-height:1.6; font-weight:600;">
    <strong>⚠️ ATTENTION : Cette action est irréversible !</strong>
  </p>
  <p style="margin:8px 0 0 0; color:#991b1b; font-size:14px; line-height:1.6;">
    La suppression du compte entraînera la perte définitive de toutes vos données :
  </p>
  <ul style="margin:8px 0 0 20px; padding:0; color:#991b1b; font-size:14px; line-height:1.6;">
    <li>Toutes les robes et leur historique</li>
    <li>Tous les clients et prospects</li>
    <li>Tous les contrats</li>
    <li>Toutes les factures et paiements</li>
  </ul>
</div>

<div style="background:linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-left:4px solid #667eea; padding:24px; margin:24px 0; border-radius:8px; text-align:center;">
  <h3 style="margin:0 0 12px 0; color:#667eea; font-size:18px; font-weight:600;">
    🔐 Votre code de validation
  </h3>
  <div style="font-size:42px; font-weight:700; color:#667eea; letter-spacing:12px; font-family:monospace; margin:16px 0;">
    ${data.validationCode}
  </div>
  <p style="margin:12px 0 0 0; color:#6b7280; font-size:14px;">
    Expire le ${expiresAtFormatted} (30 minutes)
  </p>
</div>

<p style="margin:24px 0 16px 0; color:#4a5568; font-size:16px; line-height:1.6;">
  Pour confirmer la suppression de votre compte, saisissez ce code dans l'interface de confirmation.
</p>

<hr style="border:none; border-top:1px solid #e2e8f0; margin:32px 0;">

<div style="background:#f3f4f6; border-radius:4px; padding:16px; margin:24px 0;">
  <p style="margin:0 0 8px 0; color:#374151; font-size:14px; font-weight:600;">
    Vous n'avez pas demandé cette suppression ?
  </p>
  <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.6;">
    Ignorez cet email et contactez immédiatement le support si vous pensez qu'il s'agit d'un accès non autorisé.
  </p>
</div>
  `;

  return getEmailBaseHTML(content, data.organizationName);
}
