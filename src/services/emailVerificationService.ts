/**
 * Email Verification Service
 * Handles email verification for new user accounts
 */

import crypto from "crypto";
import prisma from "../lib/prisma.js";
import { sendMail } from "../lib/mailer.js";
import logger from "../lib/logger.js";
import { logAudit, AuditAction, AuditStatus } from "./auditLogger.js";
import {
  emailVerificationSentCounter,
  emailVerifiedCounter,
  emailVerificationFailedCounter,
  emailVerificationResendCounter,
} from "../utils/metrics.js";

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const APP_URL = process.env.APP_URL || "http://localhost:4173";

export interface VerificationEmailData {
  userId: string;
  userEmail: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  organizationName: string;
}

/**
 * Generate a secure random token for email verification
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate token expiration date (24 hours from now)
 */
function getTokenExpiryDate(): Date {
  return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
}

/**
 * Generate and store email verification token for a user
 *
 * @param userId - User ID to generate token for
 * @returns The generated token
 */
export async function generateEmailVerificationToken(
  userId: string
): Promise<string> {
  try {
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiryDate();

    await prisma.user.update({
      where: { id: userId },
      data: {
        email_verification_token: token,
        email_verification_token_expires_at: expiresAt,
      },
    });

    logger.info(
      { userId, expiresAt },
      "Email verification token generated"
    );

    return token;
  } catch (error: any) {
    logger.error(
      { err: error, userId },
      "Failed to generate email verification token"
    );
    throw error;
  }
}

/**
 * Send email verification email to user
 *
 * @param data - User and organization data
 * @param token - Verification token
 */
export async function sendVerificationEmail(
  data: VerificationEmailData,
  token: string
): Promise<void> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
    const userName = data.firstName
      ? `${data.firstName} ${data.lastName || ""}`.trim()
      : data.userEmail;

    const htmlContent = getVerificationEmailTemplate({
      userName,
      organizationName: data.organizationName,
      verificationUrl,
      expiryHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
    });

    const textContent = getVerificationEmailText({
      userName,
      organizationName: data.organizationName,
      verificationUrl,
      expiryHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
    });

    await sendMail({
      to: data.userEmail,
      subject: `🔐 Vérifiez votre adresse email - ${data.organizationName}`,
      html: htmlContent,
      text: textContent,
    });

    logger.info(
      { userId: data.userId, userEmail: data.userEmail },
      "Verification email sent successfully"
    );

    // 📊 Metrics: Track verification email sent
    emailVerificationSentCounter.inc({ status: "success" });

    // 📊 Log audit
    await logAudit({
      action: AuditAction.EMAIL_VERIFICATION_SENT,
      user_id: data.userId,
      status: AuditStatus.SUCCESS,
      metadata: {
        email: data.userEmail,
        expires_at: getTokenExpiryDate().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error(
      { err: error, userId: data.userId, userEmail: data.userEmail },
      "Failed to send verification email"
    );

    // 📊 Metrics: Track verification email failure
    emailVerificationSentCounter.inc({ status: "failure" });

    // 📊 Log audit failure
    await logAudit({
      action: AuditAction.EMAIL_VERIFICATION_SENT,
      user_id: data.userId,
      status: AuditStatus.FAILURE,
      error_message: error.message,
      metadata: {
        email: data.userEmail,
      },
    });

    throw error;
  }
}

/**
 * Verify email verification token
 *
 * @param token - Verification token from email link
 * @returns User ID if token is valid, null otherwise
 */
export async function verifyEmailToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email_verification_token: token },
      select: {
        id: true,
        email: true,
        email_verified: true,
        email_verification_token_expires_at: true,
        organization_id: true,
      },
    });

    if (!user) {
      logger.warn({ token }, "Invalid verification token");
      // 📊 Metrics: Track invalid token
      emailVerificationFailedCounter.inc({ reason: "invalid_token" });
      return null;
    }

    // Check if already verified
    if (user.email_verified) {
      logger.info({ userId: user.id }, "Email already verified");
      // 📊 Metrics: Track already verified
      emailVerificationFailedCounter.inc({ reason: "already_verified" });
      return { userId: user.id, email: user.email };
    }

    // Check if token expired
    if (
      user.email_verification_token_expires_at &&
      user.email_verification_token_expires_at < new Date()
    ) {
      logger.warn({ userId: user.id }, "Verification token expired");
      // 📊 Metrics: Track expired token
      emailVerificationFailedCounter.inc({ reason: "expired_token" });
      return null;
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verification_token: null,
        email_verification_token_expires_at: null,
      },
    });

    logger.info({ userId: user.id, email: user.email }, "Email verified successfully");

    // 📊 Metrics: Track successful verification
    emailVerifiedCounter.inc();

    // 📊 Log audit
    await logAudit({
      action: AuditAction.EMAIL_VERIFIED,
      user_id: user.id,
      organization_id: user.organization_id,
      status: AuditStatus.SUCCESS,
      metadata: {
        email: user.email,
      },
    });

    return { userId: user.id, email: user.email };
  } catch (error: any) {
    logger.error({ err: error, token }, "Failed to verify email token");
    throw error;
  }
}

/**
 * Resend verification email to a user
 *
 * @param email - User email address
 * @returns True if email was sent, false if user not found or already verified
 */
export async function resendVerificationEmail(
  email: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: { name: true },
        },
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn({ email }, "User not found for resend verification");
      return false;
    }

    if (user.email_verified) {
      logger.info({ email }, "Email already verified, skipping resend");
      return false;
    }

    // Generate new token
    const token = await generateEmailVerificationToken(user.id);

    // Send email
    await sendVerificationEmail(
      {
        userId: user.id,
        userEmail: user.email,
        firstName: user.profile?.firstName ?? undefined,
        lastName: user.profile?.lastName ?? undefined,
        organizationName: user.organization.name,
      },
      token
    );

    // 📊 Metrics: Track successful resend
    emailVerificationResendCounter.inc({ status: "success" });

    return true;
  } catch (error: any) {
    logger.error({ err: error, email }, "Failed to resend verification email");

    // 📊 Metrics: Track failed resend
    emailVerificationResendCounter.inc({ status: "failure" });

    throw error;
  }
}

/**
 * Get HTML template for verification email
 */
function getVerificationEmailTemplate(data: {
  userName: string;
  organizationName: string;
  verificationUrl: string;
  expiryHours: number;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérifiez votre adresse email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px 20px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Vérifiez votre adresse email</h1>
  </div>
  <div class="content">
    <p>Bonjour ${data.userName},</p>

    <p>Bienvenue sur <strong>Velvena</strong> ! Pour activer votre compte <strong>${data.organizationName}</strong>, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>

    <div style="text-align: center;">
      <a href="${data.verificationUrl}" class="button">✅ Vérifier mon email</a>
    </div>

    <p>Ou copiez ce lien dans votre navigateur :</p>
    <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
      <a href="${data.verificationUrl}">${data.verificationUrl}</a>
    </p>

    <div class="warning">
      <p style="margin: 0;">
        ⏰ <strong>Important :</strong> Ce lien de vérification expire dans <strong>${data.expiryHours} heures</strong>.
      </p>
    </div>

    <p><strong>Pourquoi dois-je vérifier mon email ?</strong></p>
    <ul>
      <li>🔒 Sécuriser votre compte</li>
      <li>📧 Recevoir les notifications importantes</li>
      <li>✅ Confirmer que l'adresse email vous appartient</li>
    </ul>

    <p>Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.</p>

    <p>À très bientôt sur Velvena !</p>
    <p><strong>L'équipe Velvena</strong></p>
  </div>
  <div class="footer">
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    <p>© ${new Date().getFullYear()} Velvena - Gestion de location de robes</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get plain text version of verification email
 */
function getVerificationEmailText(data: {
  userName: string;
  organizationName: string;
  verificationUrl: string;
  expiryHours: number;
}): string {
  return `
🔐 Vérifiez votre adresse email

Bonjour ${data.userName},

Bienvenue sur Velvena ! Pour activer votre compte ${data.organizationName}, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :

${data.verificationUrl}

⏰ Important : Ce lien de vérification expire dans ${data.expiryHours} heures.

Pourquoi dois-je vérifier mon email ?
- Sécuriser votre compte
- Recevoir les notifications importantes
- Confirmer que l'adresse email vous appartient

Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.

À très bientôt sur Velvena !
L'équipe Velvena

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} Velvena - Gestion de location de robes
  `.trim();
}
