#!/usr/bin/env tsx

import prisma from "../src/lib/prisma.js";
import pino from "../src/lib/logger.js";

async function testDirectAuditLogCreation() {
  try {
    pino.info("🧪 Testing direct AuditLog creation with Prisma...");

    const retention_until = new Date();
    retention_until.setFullYear(retention_until.getFullYear() + 7);

    pino.info("Creating audit log...");
    const auditLog = await prisma.auditLog.create({
      data: {
        action: "TEST_DIRECT_CREATE",
        status: "SUCCESS",
        organization_id: null,
        user_id: null,
        metadata: { test: true },
        retention_until,
      },
    });

    pino.info({ auditLog }, "✅ Audit log created successfully!");

    // Vérifier qu'il est bien en base
    const found = await prisma.auditLog.findUnique({
      where: { id: auditLog.id },
    });

    if (found) {
      pino.info("✅ Audit log found in database!");
    } else {
      pino.error("❌ Audit log NOT found in database!");
    }

    // Cleanup
    await prisma.auditLog.delete({ where: { id: auditLog.id } });
    pino.info("🧹 Test audit log deleted");

    pino.info("✅ TEST PASSED: Prisma can create AuditLog entries");
    process.exit(0);
  } catch (error) {
    pino.error({ error }, "❌ TEST FAILED: Error creating audit log");
    console.error(error);
    process.exit(1);
  }
}

testDirectAuditLogCreation();
