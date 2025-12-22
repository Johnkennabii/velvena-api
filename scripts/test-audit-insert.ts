#!/usr/bin/env tsx

/**
 * Test Audit Insert - Test direct insertion of audit logs
 */

import prisma from "../src/lib/prisma.js";
import pino from "../src/lib/logger.js";
import { logAudit, AuditAction, AuditStatus, ResourceType } from "../src/services/auditLogger.js";

async function main() {
  try {
    pino.info("🧪 Testing audit log insertion with organization_id and user_id...\n");

    // Find a test organization and user
    const organization = await prisma.organization.findFirst({
      where: { deleted_at: null },
      include: {
        users: {
          where: { deleted_at: null },
          take: 1,
        },
      },
    });

    if (!organization || organization.users.length === 0) {
      console.error("❌ No organization or user found. Please create test data first.");
      process.exit(1);
    }

    const user = organization.users[0];

    console.log("✅ Found test data:");
    console.log(`   Organization: ${organization.name} (${organization.id})`);
    console.log(`   User: ${user.email} (${user.id})\n`);

    // Test 1: Create audit log using the current implementation
    console.log("📝 Test 1: Creating audit log using logAudit function...");
    const result1 = await logAudit({
      action: AuditAction.USER_CREATED,
      status: AuditStatus.SUCCESS,
      organization_id: organization.id,
      user_id: user.id,
      resource_type: ResourceType.USER,
      resource_id: user.id,
      metadata: { test: "test1" },
    });

    console.log(`   Created audit log: ${result1?.id}`);
    console.log(`   Organization ID: ${result1?.organization_id || "NULL"}`);
    console.log(`   User ID: ${result1?.user_id || "NULL"}\n`);

    // Test 2: Create audit log using direct Prisma call
    console.log("📝 Test 2: Creating audit log using direct Prisma call...");
    const retention_until = new Date();
    retention_until.setFullYear(retention_until.getFullYear() + 7);

    const result2 = await prisma.auditLog.create({
      data: {
        organization_id: organization.id,
        user_id: user.id,
        action: AuditAction.USER_UPDATED,
        resource_type: ResourceType.USER,
        resource_id: user.id,
        status: AuditStatus.SUCCESS,
        metadata: { test: "test2" },
        retention_until,
      },
    });

    console.log(`   Created audit log: ${result2.id}`);
    console.log(`   Organization ID: ${result2.organization_id || "NULL"}`);
    console.log(`   User ID: ${result2.user_id || "NULL"}\n`);

    // Verify in database
    console.log("🔍 Verifying audit logs in database...");
    const logs = await prisma.auditLog.findMany({
      where: {
        id: { in: [result1?.id, result2.id].filter(Boolean) as string[] },
      },
      select: {
        id: true,
        organization_id: true,
        user_id: true,
        action: true,
        status: true,
      },
    });

    console.log("\n📊 Results from database:");
    console.table(logs);

    // Cleanup
    console.log("\n🧹 Cleaning up test logs...");
    await prisma.auditLog.deleteMany({
      where: {
        id: { in: [result1?.id, result2.id].filter(Boolean) as string[] },
      },
    });
    console.log("✅ Cleanup complete");

    process.exit(0);
  } catch (error) {
    pino.error({ error }, "❌ Test failed");
    console.error(error);
    process.exit(1);
  }
}

main();
