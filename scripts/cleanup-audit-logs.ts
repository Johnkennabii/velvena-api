#!/usr/bin/env tsx

/**
 * Cleanup Expired Audit Logs
 *
 * This script removes audit logs older than their retention period (7 years).
 * Should be run daily via cron job.
 *
 * Usage:
 *   npx tsx scripts/cleanup-audit-logs.ts
 *
 * Cron schedule (daily at 2 AM):
 *   0 2 * * * cd /path/to/velvena && npx tsx scripts/cleanup-audit-logs.ts >> /var/log/velvena/audit-cleanup.log 2>&1
 */

import { cleanupExpiredAuditLogs } from "../src/services/auditLogger.js";
import pino from "../src/lib/logger.js";

async function main() {
  try {
    pino.info("🧹 Starting audit logs cleanup...");

    const deletedCount = await cleanupExpiredAuditLogs();

    if (deletedCount > 0) {
      pino.info(
        { deletedCount },
        `✅ Successfully deleted ${deletedCount} expired audit log(s)`
      );
    } else {
      pino.info("✅ No expired audit logs to clean up");
    }

    process.exit(0);
  } catch (error) {
    pino.error({ error }, "❌ Failed to cleanup audit logs");
    process.exit(1);
  }
}

main();
