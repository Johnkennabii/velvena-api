#!/usr/bin/env tsx

import prisma from "../src/lib/prisma.js";
import pino from "../src/lib/logger.js";
import {
  logAccountDeletionRequested,
} from "../src/services/auditLogger.js";

async function testAuditLogWithRequest() {
  try {
    pino.info("🧪 Testing audit log with simulated Request object...");

    // Créer une organisation et un utilisateur de test
    const testOrg = await prisma.organization.create({
      data: {
        name: "Test Org for Audit",
        slug: `test-audit-${Date.now()}`,
        email: "test@audit.com",
        subscription_status: "trial",
      },
    });

    const testUser = await prisma.user.create({
      data: {
        email: `test-audit-${Date.now()}@example.com`,
        password: "test-hash",
        organization_id: testOrg.id,
      },
    });

    pino.info({ orgId: testOrg.id, userId: testUser.id }, "Test data created");

    // Simuler un objet Request
    const mockRequest = {
      ip: "127.0.0.1",
      headers: {
        "user-agent": "Mozilla/5.0 Test",
        "x-forwarded-for": "127.0.0.1",
      },
      method: "POST",
      originalUrl: "/account/request-deletion",
      url: "/account/request-deletion",
      socket: {
        remoteAddress: "127.0.0.1",
      },
    } as any;

    pino.info("Calling logAccountDeletionRequested...");

    // Appeler la fonction d'audit logging
    const result = await logAccountDeletionRequested(
      testOrg.id,
      testUser.id,
      "MANAGER",
      testUser.email,
      mockRequest
    );

    if (result) {
      pino.info({ auditLogId: result.id }, "✅ Audit log created successfully!");

      // Vérifier en base
      const found = await prisma.auditLog.findUnique({
        where: { id: result.id },
      });

      if (found) {
        pino.info({ found }, "✅ Audit log found in database!");
      } else {
        pino.error("❌ Audit log NOT found in database!");
      }

      // Cleanup audit log
      await prisma.auditLog.delete({ where: { id: result.id } });
    } else {
      pino.error("❌ logAccountDeletionRequested returned null!");
    }

    // Cleanup test data
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });

    pino.info("✅ TEST PASSED: Audit logging works with Request object");
    process.exit(0);
  } catch (error) {
    pino.error({ error }, "❌ TEST FAILED");
    console.error(error);
    process.exit(1);
  }
}

testAuditLogWithRequest();
