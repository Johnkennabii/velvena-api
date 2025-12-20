import crypto from "crypto";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import { exportOrganizationData } from "./dataExportService.js";
import {
  getAccountDeletionValidationEmailTemplate,
  type AccountDeletionValidationEmailData,
} from "../templates/emailTemplates.js";
import fs from "fs";
import { getRedisClient } from "../lib/redis.js";
import type { Request } from "express";
import {
  logAccountDeletionRequested,
  logAccountDeletionCodeSent,
  logAccountDeletionInvalidCode,
  logAccountDeletionExpiredCode,
  logAccountDeletionConfirmed,
  logAccountDeletionFailed,
  logDataExport,
} from "./auditLogger.js";
import {
  deletionRequestsCounter,
  deletionValidationFailuresCounter,
  deletionConfirmedCounter,
  deletionDurationHistogram,
  deletionRecordsGauge,
  emailsSentCounter,
  emailSendDurationHistogram,
} from "../utils/metrics.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

interface DeletionRequest {
  organizationId: string;
  validationCode: string;
  expiresAt: Date;
  requestedBy: string;
  requestedAt: Date;
  userRole: string; // Role of the user who requested deletion
}

// Redis key prefix for deletion requests
const REDIS_PREFIX = "account_deletion:";

/**
 * Sauvegarde une demande de suppression dans Redis
 */
async function saveDeletionRequest(organizationId: string, request: DeletionRequest): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `${REDIS_PREFIX}${organizationId}`;
    const ttl = Math.floor((request.expiresAt.getTime() - Date.now()) / 1000); // TTL en secondes

    await redis.set(key, JSON.stringify(request), "EX", ttl);
    pino.info({ organizationId, ttl }, "✅ Demande de suppression sauvegardée dans Redis");
  } catch (err) {
    pino.error({ err, organizationId }, "❌ Erreur sauvegarde Redis, fallback sur Map en mémoire");
    // Fallback sur Map en mémoire si Redis est indisponible
    deletionRequests.set(organizationId, request);
  }
}

/**
 * Récupère une demande de suppression depuis Redis
 */
async function getDeletionRequest(organizationId: string): Promise<DeletionRequest | null> {
  try {
    const redis = getRedisClient();
    const key = `${REDIS_PREFIX}${organizationId}`;
    const data = await redis.get(key);

    if (!data) {
      // Fallback: vérifier le Map en mémoire
      const memoryRequest = deletionRequests.get(organizationId);
      return memoryRequest || null;
    }

    const request = JSON.parse(data) as DeletionRequest;
    // Reconvertir les dates (JSON les transforme en string)
    request.expiresAt = new Date(request.expiresAt);
    request.requestedAt = new Date(request.requestedAt);

    return request;
  } catch (err) {
    pino.error({ err, organizationId }, "❌ Erreur lecture Redis, fallback sur Map");
    return deletionRequests.get(organizationId) || null;
  }
}

/**
 * Supprime une demande de suppression de Redis
 */
async function deleteDeletionRequest(organizationId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `${REDIS_PREFIX}${organizationId}`;
    await redis.del(key);
    pino.info({ organizationId }, "🗑️ Demande de suppression retirée de Redis");
  } catch (err) {
    pino.error({ err, organizationId }, "❌ Erreur suppression Redis");
  }

  // Nettoyer aussi le Map en mémoire (fallback)
  deletionRequests.delete(organizationId);
}

// In-memory fallback store (used only if Redis is unavailable)
const deletionRequests = new Map<string, DeletionRequest>();

interface RequestDeletionResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

interface ConfirmDeletionResult {
  success: boolean;
  message: string;
  zipDownloadUrl?: string;
  deletedData?: {
    users: number;
    dresses: number;
    customers: number;
    prospects: number;
    contracts: number;
  };
  error?: string;
}

/**
 * Step 1: Request account deletion
 * Generates validation code and sends email
 */
export async function requestAccountDeletion(
  organizationId: string,
  requestedByUserId: string,
  req?: Request
): Promise<RequestDeletionResult> {
  try {
    pino.info(
      { organizationId, requestedByUserId },
      "🚨 Account deletion requested"
    );

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          where: { id: requestedByUserId },
          include: {
            profile: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return {
        success: false,
        message: "Organization not found",
      };
    }

    // Verify user belongs to organization and has owner/admin role
    const requestingUser = organization.users[0];
    if (!requestingUser) {
      return {
        success: false,
        message: "User not authorized",
      };
    }

    const userRole = requestingUser.profile?.role?.name;

    // Check if user has permission to delete
    // ADMIN and MANAGER can delete, others cannot
    const canDelete = userRole === "ADMIN" || userRole === "MANAGER";

    if (!canDelete) {
      // Log unauthorized attempt
      await logAccountDeletionFailed(
        organizationId,
        requestedByUserId,
        `Unauthorized: User role '${userRole}' cannot request account deletion`,
        req
      );

      return {
        success: false,
        message:
          "Only organization managers and admins can request account deletion",
      };
    }

    // ✅ ADMIN can delete without email validation
    // ✅ MANAGER must validate via email code
    const isAdmin = userRole === "ADMIN";

    if (isAdmin) {
      // For admins: No email validation required
      // Store a dummy request for confirmation step
      const adminRequest = {
        organizationId,
        validationCode: "ADMIN_BYPASS", // Special code for admins
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h validity
        requestedBy: requestedByUserId,
        requestedAt: new Date(),
        userRole: "admin",
      };

      await saveDeletionRequest(organizationId, adminRequest);

      pino.info(
        { organizationId, userId: requestedByUserId },
        "🔓 Admin deletion request - no email validation required"
      );

      // Log admin deletion request
      await logAccountDeletionRequested(
        organizationId,
        requestedByUserId,
        "ADMIN",
        requestingUser.email,
        req
      );

      // 📊 Metrics: Count successful deletion request
      deletionRequestsCounter.inc({ status: "success", role: "ADMIN" });

      return {
        success: true,
        message: "Admin deletion request approved. You can proceed immediately.",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    // For managers: Email validation required
    const validationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store deletion request
    const managerRequest = {
      organizationId,
      validationCode,
      expiresAt,
      requestedBy: requestedByUserId,
      requestedAt: new Date(),
      userRole: "manager",
    };

    await saveDeletionRequest(organizationId, managerRequest);

    pino.info(
      { organizationId, expiresAt },
      "📧 Manager deletion request - sending validation code to organization email..."
    );

    // Send validation email to ORGANIZATION email (not user email)
    if (!organization.email) {
      return {
        success: false,
        message: "Organization email is required for validation. Please set it in organization settings.",
      };
    }

    // 📊 Metrics: Measure email send duration
    const emailTimer = emailSendDurationHistogram.startTimer();

    try {
      await sendDeletionValidationEmail(
        organization.email, // Always send to organization email for owners
        organization.name,
        validationCode,
        expiresAt
      );

      // 📊 Metrics: Email sent successfully
      emailTimer();
      emailsSentCounter.inc({ type: "validation", status: "success" });
    } catch (emailError) {
      emailTimer();
      emailsSentCounter.inc({ type: "validation", status: "failure" });
      throw emailError;
    }

    // Log manager deletion request with code sent
    await logAccountDeletionRequested(
      organizationId,
      requestedByUserId,
      "MANAGER",
      requestingUser.email,
      req
    );

    await logAccountDeletionCodeSent(
      organizationId,
      requestedByUserId,
      organization.email,
      expiresAt,
      req
    );

    // 📊 Metrics: Count successful deletion request
    deletionRequestsCounter.inc({ status: "success", role: "MANAGER" });

    // Cleanup expired codes (run async)
    cleanupExpiredDeletionRequests();

    return {
      success: true,
      message: `Validation code sent to organization email: ${organization.email}. Code expires in 30 minutes.`,
      expiresAt,
    };
  } catch (error) {
    pino.error(
      { organizationId, error },
      "❌ Failed to request account deletion"
    );

    // Log failure
    await logAccountDeletionFailed(
      organizationId,
      requestedByUserId,
      error instanceof Error ? error.message : "Unknown error",
      req
    );

    // 📊 Metrics: Count failed deletion request
    deletionRequestsCounter.inc({ status: "failure", role: "unknown" });

    return {
      success: false,
      message: "Failed to process deletion request",
    };
  }
}

/**
 * Step 2: Confirm account deletion with validation code
 * Exports data, deletes all organization data, cancels Stripe subscription
 */
export async function confirmAccountDeletion(
  organizationId: string,
  validationCode: string,
  requestedByUserId: string,
  req?: Request
): Promise<ConfirmDeletionResult> {
  // 📊 Metrics: Start timer for total deletion duration
  const deletionTimer = deletionDurationHistogram.startTimer();

  try {
    pino.info(
      { organizationId, requestedByUserId },
      "🔐 Validating deletion code..."
    );

    // Verify deletion request exists
    const request = await getDeletionRequest(organizationId);

    if (!request) {
      return {
        success: false,
        message: "No deletion request found. Please request deletion first.",
      };
    }

    // ✅ ADMIN BYPASS: Admins can use special code or no code
    const isAdminRequest = request.userRole === "admin";

    if (isAdminRequest) {
      // For admin requests, accept either "ADMIN_BYPASS" or empty string
      if (validationCode !== "ADMIN_BYPASS" && validationCode !== "") {
        pino.warn(
          { organizationId },
          "⚠️ Admin attempting to use code instead of bypass"
        );
        // Still allow admin to proceed without code validation
      }

      pino.info(
        { organizationId, userId: requestedByUserId },
        "🔓 Admin deletion confirmed - bypassing email validation"
      );
    } else {
      // For manager requests, strict validation required

      // Verify code matches
      if (request.validationCode !== validationCode) {
        pino.warn(
          { organizationId },
          "⚠️ Invalid deletion code provided by manager"
        );

        // Log invalid code attempt
        await logAccountDeletionInvalidCode(
          organizationId,
          requestedByUserId,
          validationCode,
          req
        );

        // 📊 Metrics: Count invalid code attempts
        deletionValidationFailuresCounter.inc({ reason: "invalid_code" });

        return {
          success: false,
          message: "Invalid validation code",
        };
      }

      // Verify code hasn't expired
      if (new Date() > request.expiresAt) {
        // Log expired code attempt
        await logAccountDeletionExpiredCode(
          organizationId,
          requestedByUserId,
          request.expiresAt,
          req
        );

        // 📊 Metrics: Count expired code attempts
        deletionValidationFailuresCounter.inc({ reason: "expired_code" });

        await deleteDeletionRequest(organizationId);
        return {
          success: false,
          message: "Validation code expired. Please request deletion again.",
        };
      }

      pino.info(
        { organizationId },
        "✅ Manager deletion code validated successfully"
      );
    }

    // Verify requester matches
    if (request.requestedBy !== requestedByUserId) {
      return {
        success: false,
        message: "Only the user who requested deletion can confirm it",
      };
    }

    pino.info(
      { organizationId },
      "✅ Validation successful, proceeding with deletion..."
    );

    // ========================================
    // STEP 0: GET USER EMAIL BEFORE DELETION
    // ========================================
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestedByUserId },
      select: { email: true },
    });

    if (!requestingUser?.email) {
      pino.error({ userId: requestedByUserId }, "❌ Cannot find user email");
      return {
        success: false,
        message: "User email not found. Cannot proceed with deletion.",
      };
    }

    const userEmail = requestingUser.email;
    pino.info({ userEmail }, "✅ User email retrieved for confirmation");

    // ========================================
    // STEP 1: EXPORT DATA
    // ========================================
    pino.info({ organizationId }, "📦 Exporting organization data...");

    const exportResult = await exportOrganizationData(organizationId);

    if (!exportResult.success) {
      pino.error(
        { organizationId, error: exportResult.error },
        "❌ Data export failed, aborting deletion"
      );

      return {
        success: false,
        message: "Failed to export data. Deletion aborted for safety.",
      };
    }

    pino.info(
      { organizationId, stats: exportResult.stats },
      "✅ Data exported successfully"
    );

    // Log data export
    await logDataExport(
      organizationId,
      requestedByUserId,
      exportResult.zipPath!,
      exportResult.stats,
      req
    );

    // ========================================
    // STEP 2: CANCEL STRIPE SUBSCRIPTION
    // ========================================
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        stripe_subscription_id: true,
        stripe_customer_id: true,
      },
    });

    if (organization?.stripe_subscription_id) {
      try {
        pino.info(
          { subscriptionId: organization.stripe_subscription_id },
          "💳 Canceling Stripe subscription..."
        );

        await stripe.subscriptions.cancel(organization.stripe_subscription_id);

        pino.info("✅ Stripe subscription canceled");
      } catch (error) {
        pino.error(
          { error },
          "⚠️ Failed to cancel Stripe subscription, continuing with deletion..."
        );
      }
    }

    // ========================================
    // STEP 3: DELETE ALL ORGANIZATION DATA
    // ========================================
    pino.info(
      { organizationId },
      "🗑️ Deleting all organization data..."
    );

    const deletedData = {
      users: 0,
      dresses: 0,
      customers: 0,
      prospects: 0,
      contracts: 0,
    };

    // Prisma cascade delete should handle most relations,
    // but we'll be explicit for safety and tracking

    // Delete in correct order to respect foreign key constraints
    try {
      // 1. First, delete contract-related junction tables
      // Get all contract IDs for this organization
      const contractIds = await prisma.contract.findMany({
        where: { organization_id: organizationId },
        select: { id: true },
      });
      const contractIdList = contractIds.map(c => c.id);

      if (contractIdList.length > 0) {
        // Delete contract sign links
        await prisma.contractSignLink.deleteMany({
          where: { contract_id: { in: contractIdList } },
        });
        // Delete contract dress links
        await prisma.contractDress.deleteMany({
          where: { contract_id: { in: contractIdList } },
        });
        // Delete contract addon links
        await prisma.contractAddonLink.deleteMany({
          where: { contract_id: { in: contractIdList } },
        });
        pino.info("✓ Contract junction tables deleted");
      }

      // 2. Now delete contracts
      const contractsResult = await prisma.contract.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.contracts = contractsResult.count;
      pino.info({ count: contractsResult.count }, "✓ Contracts deleted");

      // 3. Delete dresses
      const dressesResult = await prisma.dress.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.dresses = dressesResult.count;
      pino.info({ count: dressesResult.count }, "✓ Dresses deleted");

      // 4. Delete customers
      const customersResult = await prisma.customer.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.customers = customersResult.count;
      pino.info({ count: customersResult.count }, "✓ Customers deleted");

      // 5. Delete prospects
      const prospectsResult = await prisma.prospect.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.prospects = prospectsResult.count;
      pino.info({ count: prospectsResult.count }, "✓ Prospects deleted");

      // 6. Delete contract templates, addons, packages, and pricing rules
      await prisma.contractTemplate.deleteMany({
        where: { organization_id: organizationId },
      });

      // Get all package IDs for this organization before deleting packages
      const packageIds = await prisma.contractPackage.findMany({
        where: { organization_id: organizationId },
        select: { id: true },
      });
      const packageIdList = packageIds.map(p => p.id);

      // Delete PackageAddon links before deleting packages
      if (packageIdList.length > 0) {
        await prisma.packageAddon.deleteMany({
          where: { package_id: { in: packageIdList } },
        });
        pino.info("✓ Package addon links deleted");
      }

      await prisma.contractPackage.deleteMany({
        where: { organization_id: organizationId },
      });
      await prisma.contractAddon.deleteMany({
        where: { organization_id: organizationId },
      });
      await prisma.pricingRule.deleteMany({
        where: { organization_id: organizationId },
      });
      pino.info("✓ Contract-related data deleted");

      // 7. Delete reference data (dress types, sizes, colors, conditions)
      await prisma.dressType.deleteMany({
        where: { organization_id: organizationId },
      });
      await prisma.dressSize.deleteMany({
        where: { organization_id: organizationId },
      });
      await prisma.dressColor.deleteMany({
        where: { organization_id: organizationId },
      });
      await prisma.dressCondition.deleteMany({
        where: { organization_id: organizationId },
      });
      pino.info("✓ Reference data deleted");

      // 8. Delete user-related data (profiles, notifications, then users)
      const users = await prisma.user.findMany({
        where: { organization_id: organizationId },
        select: { id: true },
      });
      const userIdList = users.map(u => u.id);

      if (userIdList.length > 0) {
        // Delete notification links
        await prisma.notificationUserLink.deleteMany({
          where: { user_id: { in: userIdList } },
        });
        pino.info("✓ Notification links deleted");

        // Delete profiles
        for (const user of users) {
          await prisma.profile.deleteMany({
            where: { userId: user.id },
          });
        }
        pino.info("✓ User profiles deleted");
      }

      // Finally delete users
      const usersResult = await prisma.user.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.users = usersResult.count;
      pino.info({ count: usersResult.count }, "✓ Users deleted");

      // 9. Finally, delete the organization itself
      await prisma.organization.delete({
        where: { id: organizationId },
      });
      pino.info("✓ Organization deleted");
    } catch (error) {
      pino.error(
        { organizationId, error },
        "❌ Error during data deletion"
      );

      return {
        success: false,
        message: "Failed to delete organization data",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // ========================================
    // STEP 4: SEND CONFIRMATION EMAIL WITH ZIP
    // ========================================
    await sendDeletionConfirmationEmail(
      userEmail,
      organizationId,
      exportResult.zipPath!,
      deletedData
    );

    // Remove deletion request from Redis
    await deleteDeletionRequest(organizationId);

    pino.info(
      { organizationId, deletedData },
      "✅ Account deletion completed successfully"
    );

    // Log successful deletion
    await logAccountDeletionConfirmed(
      organizationId,
      requestedByUserId,
      deletedData,
      exportResult.zipPath,
      req
    );

    // 📊 Metrics: Stop timer and record successful deletion
    deletionTimer();
    deletionConfirmedCounter.inc({ role: request.userRole || "unknown" });

    // 📊 Metrics: Record number of deleted records by type
    deletionRecordsGauge.set({ resource_type: "users" }, deletedData.users);
    deletionRecordsGauge.set({ resource_type: "dresses" }, deletedData.dresses);
    deletionRecordsGauge.set({ resource_type: "customers" }, deletedData.customers);
    deletionRecordsGauge.set({ resource_type: "prospects" }, deletedData.prospects);
    deletionRecordsGauge.set({ resource_type: "contracts" }, deletedData.contracts);

    return {
      success: true,
      message: "Account successfully deleted. Export file has been sent to your email.",
      deletedData,
    };
  } catch (error) {
    // 📊 Metrics: Stop timer even on failure
    deletionTimer();

    pino.error(
      { organizationId, error },
      "❌ Failed to confirm account deletion"
    );

    // Log failure
    await logAccountDeletionFailed(
      organizationId,
      requestedByUserId,
      error instanceof Error ? error.message : "Unknown error during confirmation",
      req
    );

    return {
      success: false,
      message: "Failed to complete account deletion",
    };
  }
}

/**
 * Send validation code email
 */
async function sendDeletionValidationEmail(
  email: string,
  organizationName: string,
  validationCode: string,
  expiresAt: Date
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailData: AccountDeletionValidationEmailData = {
    organizationName,
    organizationEmail: email,
    validationCode,
    expiresAt,
  };

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@velvena.com",
    to: email,
    subject: `⚠️ Suppression de compte – Code de validation`,
    html: getAccountDeletionValidationEmailTemplate(emailData),
  };

  await transporter.sendMail(mailOptions);

  pino.info({ email }, "📧 Deletion validation email sent");
}

/**
 * Send deletion confirmation email with ZIP attachment
 */
async function sendDeletionConfirmationEmail(
  userEmail: string,
  organizationId: string,
  zipPath: string,
  deletedData: any
): Promise<void> {

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@velvena.com",
    to: userEmail,
    subject: "✅ Account Deleted - Your Data Export",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #388e3c;">✅ Account Successfully Deleted</h2>

        <p>Your organization account has been permanently deleted as requested.</p>

        <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0c5460;">📊 Deleted Data Summary</h3>
          <ul style="color: #0c5460;">
            <li>${deletedData.users} users</li>
            <li>${deletedData.dresses} dresses</li>
            <li>${deletedData.contracts} contracts</li>
            <li>${deletedData.customers} customers</li>
            <li>${deletedData.prospects} prospects</li>
          </ul>
        </div>

        <p>
          <strong>Your data export is attached to this email as a ZIP file.</strong>
        </p>

        <p>The ZIP file contains:</p>
        <ul>
          <li>📄 All signed contracts (PDFs)</li>
          <li>💳 Stripe invoices (PDFs + JSON metadata)</li>
          <li>👥 Clients data (JSON + CSV)</li>
          <li>🔍 Prospects data (JSON + CSV)</li>
          <li>📋 Export manifest (MANIFEST.json)</li>
        </ul>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This export complies with GDPR data portability requirements.
          Please save this file to a secure location. The download link will expire in 7 days.
        </p>

        <p style="color: #666;">
          Thank you for using Velvena. We're sorry to see you go.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #999;">
          This email was sent by Velvena. This is an automated message, please do not reply.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `organization_export_${organizationId}.zip`,
        path: zipPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);

  pino.info({ email: userEmail }, "📧 Deletion confirmation email sent with ZIP attachment");

  // Clean up ZIP file after sending email (7 days retention)
  setTimeout(() => {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      pino.info({ zipPath }, "🗑️ Cleaned up export ZIP file");
    }
  }, 7 * 24 * 60 * 60 * 1000); // 7 days
}

/**
 * Cleanup expired deletion requests
 * Note: Redis gère l'expiration automatiquement avec TTL
 * Cette fonction nettoie seulement le fallback Map en mémoire
 */
function cleanupExpiredDeletionRequests(): void {
  const now = new Date();
  let cleaned = 0;

  // Nettoyer seulement le Map en mémoire (fallback)
  for (const [orgId, request] of deletionRequests.entries()) {
    if (now > request.expiresAt) {
      deletionRequests.delete(orgId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    pino.info({ cleaned }, "🧹 Cleaned up expired deletion requests from memory");
  }
}

/**
 * Get pending deletion request (for debugging/admin)
 */
export async function getPendingDeletionRequest(
  organizationId: string
): Promise<DeletionRequest | null> {
  return await getDeletionRequest(organizationId);
}
