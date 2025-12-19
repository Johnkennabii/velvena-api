import crypto from "crypto";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import { exportOrganizationData } from "./dataExportService.js";
import fs from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

interface DeletionRequest {
  organizationId: string;
  validationCode: string;
  expiresAt: Date;
  requestedBy: string;
  requestedAt: Date;
}

// In-memory store for deletion codes (in production, use Redis)
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
  requestedByUserId: string
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
    if (userRole !== "owner" && userRole !== "admin") {
      return {
        success: false,
        message:
          "Only organization owners and admins can request account deletion",
      };
    }

    // Generate 6-digit validation code
    const validationCode = crypto.randomInt(100000, 999999).toString();

    // Code expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Store deletion request
    deletionRequests.set(organizationId, {
      organizationId,
      validationCode,
      expiresAt,
      requestedBy: requestedByUserId,
      requestedAt: new Date(),
    });

    pino.info(
      { organizationId, expiresAt },
      "📧 Deletion validation code generated, sending email..."
    );

    // Send validation email
    await sendDeletionValidationEmail(
      organization.email || requestingUser.email,
      organization.name,
      validationCode,
      expiresAt
    );

    // Cleanup expired codes (run async)
    cleanupExpiredDeletionRequests();

    return {
      success: true,
      message: `Validation code sent to ${organization.email || requestingUser.email}. Code expires in 30 minutes.`,
      expiresAt,
    };
  } catch (error) {
    pino.error(
      { organizationId, error },
      "❌ Failed to request account deletion"
    );

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
  requestedByUserId: string
): Promise<ConfirmDeletionResult> {
  try {
    pino.info(
      { organizationId, requestedByUserId },
      "🔐 Validating deletion code..."
    );

    // Verify deletion request exists
    const request = deletionRequests.get(organizationId);

    if (!request) {
      return {
        success: false,
        message: "No deletion request found. Please request deletion first.",
      };
    }

    // Verify code matches
    if (request.validationCode !== validationCode) {
      pino.warn(
        { organizationId },
        "⚠️ Invalid deletion code provided"
      );

      return {
        success: false,
        message: "Invalid validation code",
      };
    }

    // Verify code hasn't expired
    if (new Date() > request.expiresAt) {
      deletionRequests.delete(organizationId);
      return {
        success: false,
        message: "Validation code expired. Please request deletion again.",
      };
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
      // 1. Delete contracts (references dresses and customers)
      const contractsResult = await prisma.contract.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.contracts = contractsResult.count;
      pino.info({ count: contractsResult.count }, "✓ Contracts deleted");

      // 2. Delete dresses
      const dressesResult = await prisma.dress.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.dresses = dressesResult.count;
      pino.info({ count: dressesResult.count }, "✓ Dresses deleted");

      // 3. Delete customers
      const customersResult = await prisma.customer.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.customers = customersResult.count;
      pino.info({ count: customersResult.count }, "✓ Customers deleted");

      // 4. Delete prospects
      const prospectsResult = await prisma.prospect.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.prospects = prospectsResult.count;
      pino.info({ count: prospectsResult.count }, "✓ Prospects deleted");

      // 5. Delete reference data (dress types, sizes, colors, conditions)
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

      // 6. Delete user profiles and users
      const users = await prisma.user.findMany({
        where: { organization_id: organizationId },
        select: { id: true },
      });

      for (const user of users) {
        await prisma.profile.deleteMany({
          where: { userId: user.id },
        });
      }

      const usersResult = await prisma.user.deleteMany({
        where: { organization_id: organizationId },
      });
      deletedData.users = usersResult.count;
      pino.info({ count: usersResult.count }, "✓ Users deleted");

      // 7. Finally, delete the organization itself
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
    const orgEmail = organization?.stripe_customer_id || "deleted-org";
    await sendDeletionConfirmationEmail(
      request.requestedBy,
      organizationId,
      exportResult.zipPath!,
      deletedData
    );

    // Remove deletion request from memory
    deletionRequests.delete(organizationId);

    pino.info(
      { organizationId, deletedData },
      "✅ Account deletion completed successfully"
    );

    return {
      success: true,
      message: "Account successfully deleted. Export file has been sent to your email.",
      deletedData,
    };
  } catch (error) {
    pino.error(
      { organizationId, error },
      "❌ Failed to confirm account deletion"
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
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@velvena.com",
    to: email,
    subject: "🚨 Account Deletion Confirmation - Validation Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">⚠️ Account Deletion Request</h2>

        <p>A request to delete the account for <strong>${organizationName}</strong> has been initiated.</p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Validation Code</h3>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; color: #212529;">
            ${validationCode}
          </p>
          <p style="margin-bottom: 0; font-size: 14px; color: #856404;">
            This code expires at ${expiresAt.toLocaleString("en-US", { timeZone: "UTC" })} UTC (30 minutes)
          </p>
        </div>

        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #721c24;">⚠️ Warning: This action is irreversible</h4>
          <p style="margin-bottom: 0; color: #721c24;">
            Confirming this deletion will:
          </p>
          <ul style="color: #721c24;">
            <li>Permanently delete all your data (users, dresses, contracts, clients, prospects)</li>
            <li>Cancel your Stripe subscription</li>
            <li>Export your data as a ZIP file and send it to this email</li>
          </ul>
        </div>

        <p style="color: #666;">
          If you did not request this deletion, please ignore this email and contact support immediately.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #999;">
          This email was sent by Velvena. This is an automated message, please do not reply.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  pino.info({ email }, "📧 Deletion validation email sent");
}

/**
 * Send deletion confirmation email with ZIP attachment
 */
async function sendDeletionConfirmationEmail(
  userId: string,
  organizationId: string,
  zipPath: string,
  deletedData: any
): Promise<void> {
  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    pino.warn({ userId }, "⚠️ User not found, cannot send confirmation email");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@velvena.com",
    to: user.email,
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

  pino.info({ email: user.email }, "📧 Deletion confirmation email sent with ZIP attachment");

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
 */
function cleanupExpiredDeletionRequests(): void {
  const now = new Date();
  let cleaned = 0;

  for (const [orgId, request] of deletionRequests.entries()) {
    if (now > request.expiresAt) {
      deletionRequests.delete(orgId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    pino.info({ cleaned }, "🧹 Cleaned up expired deletion requests");
  }
}

/**
 * Get pending deletion request (for debugging/admin)
 */
export function getPendingDeletionRequest(
  organizationId: string
): DeletionRequest | undefined {
  return deletionRequests.get(organizationId);
}
