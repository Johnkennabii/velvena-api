/**
 * Calendly Sync Job
 *
 * Automatically syncs Calendly events for all active integrations
 * Runs every 30 minutes (configurable per integration)
 */

import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { syncCalendlyEvents } from "../services/calendlyService.js";

/**
 * Sync Calendly events for all active integrations that are due for sync
 */
export async function runCalendlySyncJob(): Promise<{
  totalIntegrations: number;
  synced: number;
  failed: number;
  errors: Array<{ integrationId: string; error: string }>;
}> {
  const now = new Date();
  const results = {
    totalIntegrations: 0,
    synced: 0,
    failed: 0,
    errors: [] as Array<{ integrationId: string; error: string }>,
  };

  try {
    // Get all active integrations that are due for sync
    const integrations = await prisma.calendlyIntegration.findMany({
      where: {
        is_active: true,
        auto_sync_enabled: true,
        OR: [
          { next_sync_at: null }, // Never synced before
          { next_sync_at: { lte: now } }, // Sync time has passed
        ],
      },
      select: {
        id: true,
        organization_id: true,
        calendly_user_name: true,
        sync_interval_minutes: true,
        last_synced_at: true,
      },
    });

    results.totalIntegrations = integrations.length;

    if (integrations.length === 0) {
      logger.info("No Calendly integrations due for sync");
      return results;
    }

    logger.info(
      { count: integrations.length },
      "Starting Calendly sync job for active integrations"
    );

    // Sync each integration
    for (const integration of integrations) {
      try {
        const syncedCount = await syncCalendlyEvents(integration.id);

        logger.info(
          {
            integrationId: integration.id,
            organizationId: integration.organization_id,
            syncedCount,
          },
          "Calendly integration synced successfully"
        );

        results.synced++;
      } catch (error: any) {
        logger.error(
          {
            integrationId: integration.id,
            error: error.message,
          },
          "Failed to sync Calendly integration"
        );

        results.failed++;
        results.errors.push({
          integrationId: integration.id,
          error: error.message,
        });
      }
    }

    logger.info(
      {
        totalIntegrations: results.totalIntegrations,
        synced: results.synced,
        failed: results.failed,
      },
      "Calendly sync job completed"
    );

    return results;
  } catch (error: any) {
    logger.error(
      { error: error.message },
      "Failed to run Calendly sync job"
    );
    throw error;
  }
}

/**
 * Cleanup old Calendly events (older than 90 days with status 'canceled')
 */
export async function cleanupOldCalendlyEvents(): Promise<number> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.calendlyEvent.deleteMany({
      where: {
        event_status: "canceled",
        event_end_time: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(
      { deletedCount: result.count },
      "Cleaned up old Calendly events"
    );

    return result.count;
  } catch (error: any) {
    logger.error(
      { error: error.message },
      "Failed to cleanup old Calendly events"
    );
    throw error;
  }
}
