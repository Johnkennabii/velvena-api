/**
 * Stripe Webhooks Routes
 *
 * Handles incoming webhook events from Stripe
 *
 * IMPORTANT: This endpoint must use raw body (not JSON parsed)
 * for signature verification to work properly.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import stripe, { stripeConfig } from "../lib/stripe.js";
import logger from "../lib/logger.js";
import { handleWebhookEvent } from "../services/webhookService.js";

const router = Router();

/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events
 *
 * IMPORTANT: This route must be configured in your server to receive
 * raw body data (not JSON parsed) for signature verification.
 *
 * In your main server file (server.ts), you need to add:
 *
 * ```typescript
 * app.post('/api/webhooks/stripe',
 *   express.raw({ type: 'application/json' }),
 *   stripeWebhooksRouter
 * );
 * ```
 */
router.post("/", async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    logger.error("Missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  if (!stripeConfig.webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;

  try {
    // Verify webhook signature
    // req.body should be raw Buffer here, not parsed JSON
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (err: any) {
    logger.error({ err }, "Webhook signature verification failed");
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Process the event
  try {
    const result = await handleWebhookEvent(event);

    if (result.success) {
      logger.info(
        {
          eventType: result.eventType,
          organizationId: result.organizationId,
        },
        "Webhook event processed successfully"
      );
      return res.json({ received: true, result });
    } else {
      logger.error(
        {
          eventType: result.eventType,
          error: result.error,
        },
        "Webhook event processing failed"
      );
      // Still return 200 to acknowledge receipt to Stripe
      // This prevents Stripe from retrying events that have business logic errors
      return res.json({ received: true, result });
    }
  } catch (err: any) {
    logger.error({ err, eventType: event.type }, "Webhook processing error");
    // Return 500 to tell Stripe to retry
    return res.status(500).json({ error: "Webhook processing error" });
  }
});

/**
 * GET /api/webhooks/stripe/health
 *
 * Health check endpoint for webhook configuration
 */
router.get("/health", (_req: Request, res: Response) => {
  const isConfigured = !!stripeConfig.webhookSecret;

  res.json({
    status: isConfigured ? "configured" : "not_configured",
    webhookSecretConfigured: isConfigured,
  });
});

export default router;
