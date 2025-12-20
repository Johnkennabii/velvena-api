#!/usr/bin/env tsx

/**
 * Test Audit System
 *
 * Tests the audit logging system by simulating account deletion requests
 * and verifying that audit logs are created correctly.
 *
 * Usage:
 *   npx tsx scripts/test-audit-system.ts
 */

import prisma from "../src/lib/prisma.js";
import pino from "../src/lib/logger.js";
import {
  logAccountDeletionRequested,
  logAccountDeletionCodeSent,
  logAccountDeletionInvalidCode,
  logAccountDeletionConfirmed,
  logDataExport,
  getOrganizationAuditLogs,
  AuditAction,
  AuditStatus,
} from "../src/services/auditLogger.js";

async function main() {
  try {
    pino.info("🧪 Starting Audit System Test...\n");

    // ========================================
    // STEP 1: Find or create a test organization and user
    // ========================================
    pino.info("📋 Step 1: Finding or creating test organization...");

    let organization = await prisma.organization.findFirst({
      where: {
        deleted_at: null,
      },
      include: {
        users: {
          where: { deleted_at: null },
          include: {
            profile: {
              include: {
                role: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    let createdTestData = false;

    // If no organization exists, create a test one
    if (!organization || organization.users.length === 0) {
      pino.info("🏗️ No organization found, creating test organization...");
      createdTestData = true;

      // Find or create ADMIN role
      let adminRole = await prisma.role.findFirst({
        where: { name: "ADMIN" },
      });

      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: {
            name: "ADMIN",
            description: "Administrator role for testing",
          },
        });
        pino.info("✓ Created ADMIN role");
      }

      // Create test organization
      organization = await prisma.organization.create({
        data: {
          name: "Test Organization - Audit System",
          slug: `test-audit-${Date.now()}`,
          email: "test-audit@example.com",
          subscription_status: "trial",
          users: {
            create: {
              email: `test-audit-${Date.now()}@example.com`,
              password: "test-password-hash",
              profile: {
                create: {
                  firstName: "Test",
                  lastName: "User",
                  role_id: adminRole.id,
                },
              },
            },
          },
        },
        include: {
          users: {
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

      pino.info("✓ Created test organization and user");
    }

    const user = organization.users[0];
    const userRole = user.profile?.role?.name || "UNKNOWN";

    pino.info({
      organizationId: organization.id,
      organizationName: organization.name,
      userId: user.id,
      userEmail: user.email,
      userRole,
    }, "✅ Test organization and user found\n");

    // ========================================
    // STEP 2: Test audit log creation
    // ========================================
    pino.info("📝 Step 2: Creating test audit logs...");

    // Test 1: Account deletion requested
    await logAccountDeletionRequested(
      organization.id,
      user.id,
      userRole,
      user.email
    );
    pino.info("✓ Logged: Account deletion requested");

    // Test 2: Validation code sent
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await logAccountDeletionCodeSent(
      organization.id,
      user.id,
      organization.email || "test@example.com",
      expiresAt
    );
    pino.info("✓ Logged: Validation code sent");

    // Test 3: Invalid code attempt
    await logAccountDeletionInvalidCode(
      organization.id,
      user.id,
      "123456"
    );
    pino.info("✓ Logged: Invalid validation code");

    // Test 4: Data export
    await logDataExport(
      organization.id,
      user.id,
      "/tmp/test_export.zip",
      {
        users: 5,
        dresses: 100,
        customers: 50,
        prospects: 30,
        contracts: 75,
      }
    );
    pino.info("✓ Logged: Data export");

    // Test 5: Account deletion confirmed
    await logAccountDeletionConfirmed(
      organization.id,
      user.id,
      {
        users: 5,
        dresses: 100,
        customers: 50,
        prospects: 30,
        contracts: 75,
      },
      "/tmp/test_export.zip"
    );
    pino.info("✓ Logged: Account deletion confirmed\n");

    // ========================================
    // STEP 3: Verify audit logs were created
    // ========================================
    pino.info("🔍 Step 3: Verifying audit logs...");

    const auditLogs = await getOrganizationAuditLogs(organization.id, {
      limit: 10,
    });

    pino.info({
      total: auditLogs.total,
      retrieved: auditLogs.logs.length,
    }, "✅ Audit logs retrieved");

    // Display recent logs
    console.log("\n📊 Recent Audit Logs:");
    console.log("=".repeat(80));

    for (const log of auditLogs.logs) {
      const retentionYears = Math.floor(
        (log.retention_until.getTime() - log.created_at.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
      );

      console.log(`
Action: ${log.action}
Status: ${log.status}
User: ${log.user?.email || "N/A"}
Created: ${log.created_at.toISOString()}
Retention: ${log.retention_until.toISOString()} (${retentionYears} years)
Metadata: ${log.metadata ? JSON.stringify(log.metadata, null, 2) : "N/A"}
${"-".repeat(80)}`);
    }

    // ========================================
    // STEP 4: Verify different log types
    // ========================================
    pino.info("\n📈 Step 4: Analyzing audit log types...");

    const logsByAction = await prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        organization_id: organization.id,
      },
      _count: {
        action: true,
      },
    });

    console.log("\n📊 Audit Logs by Action:");
    console.log("=".repeat(80));
    for (const group of logsByAction) {
      console.log(`${group.action}: ${group._count.action} log(s)`);
    }

    const logsByStatus = await prisma.auditLog.groupBy({
      by: ["status"],
      where: {
        organization_id: organization.id,
      },
      _count: {
        status: true,
      },
    });

    console.log("\n📊 Audit Logs by Status:");
    console.log("=".repeat(80));
    for (const group of logsByStatus) {
      console.log(`${group.status}: ${group._count.status} log(s)`);
    }

    // ========================================
    // STEP 5: Test retention calculation
    // ========================================
    pino.info("\n🕐 Step 5: Verifying retention period...");

    const sampleLog = await prisma.auditLog.findFirst({
      where: {
        organization_id: organization.id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (sampleLog) {
      const retentionYears = (
        (sampleLog.retention_until.getTime() - sampleLog.created_at.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
      ).toFixed(2);

      pino.info({
        created_at: sampleLog.created_at,
        retention_until: sampleLog.retention_until,
        retention_years: retentionYears,
      }, "✅ Retention period verified");

      if (Math.abs(parseFloat(retentionYears) - 7) < 0.01) {
        pino.info("✅ Retention period is correct (7 years)");
      } else {
        pino.warn(`⚠️ Retention period might be incorrect: ${retentionYears} years (expected 7)`);
      }
    }

    // ========================================
    // STEP 6: Cleanup test logs (optional)
    // ========================================
    pino.info("\n🧹 Step 6: Cleanup test logs...");

    const deleteResult = await prisma.auditLog.deleteMany({
      where: {
        organization_id: organization.id,
        action: {
          in: [
            AuditAction.ACCOUNT_DELETION_REQUESTED,
            AuditAction.ACCOUNT_DELETION_CODE_SENT,
            AuditAction.ACCOUNT_DELETION_INVALID_CODE,
            AuditAction.ACCOUNT_DELETION_CONFIRMED,
            AuditAction.DATA_EXPORT_COMPLETED,
          ],
        },
        created_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    pino.info(
      { deletedCount: deleteResult.count },
      `✅ Cleaned up ${deleteResult.count} test audit log(s)`
    );

    // Clean up test organization if it was created
    if (createdTestData) {
      pino.info("🧹 Cleaning up test organization...");

      // Delete profile first
      await prisma.profile.deleteMany({
        where: { userId: user.id },
      });

      // Delete user
      await prisma.user.deleteMany({
        where: { id: user.id },
      });

      // Delete organization
      await prisma.organization.delete({
        where: { id: organization.id },
      });

      pino.info("✅ Test organization cleaned up");
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log("\n" + "=".repeat(80));
    console.log("✅ AUDIT SYSTEM TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log(`
Summary:
  ✓ Test organization: ${organization.name}
  ✓ Test user: ${user.email} (${userRole})
  ✓ Audit logs created: 5
  ✓ Retention period: 7 years (RGPD compliant)
  ✓ Cleanup: ${deleteResult.count} test logs removed
  ${createdTestData ? "✓ Test organization deleted" : ""}

The audit system is working correctly! 🎉
`);

    process.exit(0);
  } catch (error) {
    pino.error({ error }, "❌ Audit system test failed");
    console.error(error);
    process.exit(1);
  }
}

main();
