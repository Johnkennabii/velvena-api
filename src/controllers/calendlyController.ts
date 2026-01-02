import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import logger from "../lib/logger.js";
import {
  exchangeCodeForToken,
  getCalendlyUser,
  storeCalendlyIntegration,
  syncCalendlyEvents,
  createWebhookSubscription,
  deleteWebhookSubscription,
} from "../services/calendlyService.js";
import prisma from "../lib/prisma.js";
import crypto from "crypto";

/**
 * OAuth callback - Exchange authorization code for access token
 */
export const oauthCallback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "No organization context" });
    }

    // Exchange code for token
    const tokens = await exchangeCodeForToken(code);

    // Get user information
    const user = await getCalendlyUser(tokens.access_token);

    // Store integration
    const integration = await storeCalendlyIntegration(
      req.user.organizationId,
      tokens,
      user,
      req.user.id
    );

    logger.info(
      {
        organizationId: req.user.organizationId,
        userId: req.user.id,
        integrationId: integration.id,
      },
      "Calendly integration connected"
    );

    // Start initial sync asynchronously
    syncCalendlyEvents(integration.id).catch((err) => {
      logger.error({ err, integrationId: integration.id }, "Failed initial sync (non-blocking)");
    });

    // Create webhook subscription asynchronously
    const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/calendly/webhook`;
    createWebhookSubscription(integration.id, webhookUrl).catch((err) => {
      logger.error({ err, integrationId: integration.id }, "Failed to create webhook (non-blocking)");
    });

    res.json({
      success: true,
      message: "Calendly integration connected successfully",
      integration: {
        id: integration.id,
        calendly_user_name: integration.calendly_user_name,
        calendly_email: integration.calendly_email,
        auto_sync_enabled: integration.auto_sync_enabled,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to complete OAuth callback");
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get current Calendly integration status
 */
export const getIntegrationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "No organization context" });
    }

    const integration = await prisma.calendlyIntegration.findFirst({
      where: {
        organization_id: req.user.organizationId,
        is_active: true,
      },
      select: {
        id: true,
        calendly_user_name: true,
        calendly_email: true,
        auto_sync_enabled: true,
        sync_interval_minutes: true,
        last_synced_at: true,
        last_sync_error: true,
        next_sync_at: true,
        webhook_active: true,
        created_at: true,
      },
    });

    if (!integration) {
      return res.json({
        connected: false,
        integration: null,
      });
    }

    res.json({
      connected: true,
      integration,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get integration status");
    res.status(500).json({ error: err.message });
  }
};

/**
 * Disconnect Calendly integration
 */
export const disconnectIntegration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "No organization context" });
    }

    const integration = await prisma.calendlyIntegration.findFirst({
      where: {
        organization_id: req.user.organizationId,
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "No active integration found" });
    }

    // Delete webhook subscription
    await deleteWebhookSubscription(integration.id).catch((err) => {
      logger.error({ err }, "Failed to delete webhook (non-blocking)");
    });

    // Soft delete integration
    await prisma.calendlyIntegration.update({
      where: { id: integration.id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: req.user.id,
      },
    });

    logger.info(
      { organizationId: req.user.organizationId, integrationId: integration.id },
      "Calendly integration disconnected"
    );

    res.json({
      success: true,
      message: "Calendly integration disconnected successfully",
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to disconnect integration");
    res.status(500).json({ error: err.message });
  }
};

/**
 * Manually trigger sync
 */
export const triggerSync = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "No organization context" });
    }

    const integration = await prisma.calendlyIntegration.findFirst({
      where: {
        organization_id: req.user.organizationId,
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "No active integration found" });
    }

    const syncedCount = await syncCalendlyEvents(integration.id);

    res.json({
      success: true,
      message: `Synced ${syncedCount} events successfully`,
      synced_count: syncedCount,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to trigger sync");
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get synced Calendly events
 */
export const getCalendlyEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "No organization context" });
    }

    const { limit = "50", offset = "0", status, prospect_id } = req.query;

    const where: any = {
      organization_id: req.user.organizationId,
    };

    if (status) {
      where.event_status = status;
    }

    if (prospect_id) {
      where.prospect_id = prospect_id;
    }

    const events = await prisma.calendlyEvent.findMany({
      where,
      include: {
        prospect: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { event_start_time: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.calendlyEvent.count({ where });

    res.json({
      events,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get Calendly events");
    res.status(500).json({ error: err.message });
  }
};

/**
 * Webhook handler for Calendly events
 */
export const handleWebhook = async (req: any, res: Response) => {
  try {
    const signature = req.headers["calendly-webhook-signature"];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.CALENDLY_WEBHOOK_SIGNING_KEY!)
        .update(body)
        .digest("base64");

      if (signature !== expectedSignature) {
        logger.warn("Invalid Calendly webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const event = req.body;
    logger.info({ event: event.event }, "Received Calendly webhook event");

    // Handle different event types
    switch (event.event) {
      case "invitee.created":
        // Trigger sync for the organization
        await handleInviteeCreated(event.payload);
        break;

      case "invitee.canceled":
        await handleInviteeCanceled(event.payload);
        break;

      case "invitee.rescheduled":
        // Trigger sync to update the event
        await handleInviteeCreated(event.payload);
        break;

      default:
        logger.info({ eventType: event.event }, "Unhandled webhook event type");
    }

    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Failed to handle webhook");
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle invitee.created webhook event
 */
async function handleInviteeCreated(payload: any) {
  const eventUri = payload.event?.uri;
  if (!eventUri) {
    logger.warn("No event URI in webhook payload");
    return;
  }

  // Find integration by event owner
  const integration = await prisma.calendlyIntegration.findFirst({
    where: {
      calendly_user_uri: payload.event?.event_memberships?.[0]?.user,
      is_active: true,
    },
  });

  if (integration) {
    // Trigger sync for this integration
    syncCalendlyEvents(integration.id).catch((err) => {
      logger.error({ err, integrationId: integration.id }, "Failed to sync after webhook");
    });
  }
}

/**
 * Handle invitee.canceled webhook event
 */
async function handleInviteeCanceled(payload: any) {
  const eventUri = payload.event?.uri;
  if (!eventUri) {
    logger.warn("No event URI in webhook payload");
    return;
  }

  // Update event status to canceled
  await prisma.calendlyEvent.updateMany({
    where: { calendly_event_uri: eventUri },
    data: { event_status: "canceled" },
  });

  logger.info({ eventUri }, "Calendly event marked as canceled");
}
