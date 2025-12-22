#!/usr/bin/env tsx

import prisma from "../src/lib/prisma.js";
import { logAccountDeletionRequested } from "../src/services/auditLogger.js";

async function main() {
  try {
    console.log("\n🔍 DEBUG: Testing audit log insertion with organization_id and user_id\n");

    // Use existing test data
    const organizationId = "00000000-0000-0000-0000-000000000001";
    const userId = "00000000-0000-0000-0000-000000000099";

    console.log("📋 Test data:");
    console.log(`   Organization ID: ${organizationId}`);
    console.log(`   User ID: ${userId}\n`);

    // Call the specialized function
    console.log("📝 Calling logAccountDeletionRequested...");
    const result = await logAccountDeletionRequested(
      organizationId,
      userId,
      "MANAGER",
      "test@example.com"
    );

    console.log(`\n✅ Function returned:`);
    console.log(`   Audit Log ID: ${result?.id}`);
    console.log(`   Organization ID: ${result?.organization_id || "NULL ❌"}`);
    console.log(`   User ID: ${result?.user_id || "NULL ❌"}`);

    // Verify in database
    if (result) {
      console.log("\n🔍 Querying database directly...");
      const dbResult = await prisma.auditLog.findUnique({
        where: { id: result.id },
        select: {
          id: true,
          organization_id: true,
          user_id: true,
          action: true,
          metadata: true,
        },
      });

      console.log("\n📊 Database result:");
      console.log(JSON.stringify(dbResult, null, 2));

      // Cleanup
      await prisma.auditLog.delete({ where: { id: result.id } });
      console.log("\n🧹 Cleaned up test log");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
