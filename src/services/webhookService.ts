/**
 * Stripe Webhook Service
 *
 * Handles all Stripe webhook events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - invoice.paid
 * - invoice.payment_failed
 * - invoice.payment_action_required
 */

import type Stripe from "stripe";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { syncSubscription } from "./stripeService.js";
import type { WebhookHandlerResult } from "../types/stripe.js";

// ============================================
// WEBHOOK EVENT HANDLERS
// ============================================

/**
 * Handle checkout.session.completed event
 * Triggered when a customer completes a checkout session
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<WebhookHandlerResult> {
  try {
    const organizationId = session.metadata?.organizationId;
    const planCode = session.metadata?.planCode;

    if (!organizationId) {
      logger.warn(
        { sessionId: session.id },
        "Checkout session missing organizationId in metadata"
      );
      return {
        success: false,
        eventType: "checkout.session.completed",
        error: "Missing organizationId in metadata",
      };
    }

    // Get the subscription ID
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      logger.warn(
        { sessionId: session.id, organizationId },
        "Checkout session has no subscription"
      );
      return {
        success: false,
        eventType: "checkout.session.completed",
        organizationId,
        error: "No subscription in session",
      };
    }

    // Sync the subscription
    const result = await syncSubscription(subscriptionId);

    logger.info(
      { organizationId, planCode, subscriptionId },
      "Checkout session completed"
    );

    return {
      success: result.success,
      eventType: "checkout.session.completed",
      organizationId,
      message: "Subscription activated",
    };
  } catch (err: any) {
    logger.error({ err, session }, "Failed to handle checkout session completed");
    return {
      success: false,
      eventType: "checkout.session.completed",
      error: err.message,
    };
  }
}

/**
 * Handle customer.subscription.created event
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  try {
    const result = await syncSubscription(subscription.id);

    logger.info(
      { subscriptionId: subscription.id, organizationId: result.organizationId },
      "Subscription created"
    );

    return {
      success: result.success,
      eventType: "customer.subscription.created",
      organizationId: result.organizationId,
      message: "Subscription created",
    };
  } catch (err: any) {
    logger.error({ err, subscription }, "Failed to handle subscription created");
    return {
      success: false,
      eventType: "customer.subscription.created",
      error: err.message,
    };
  }
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  try {
    const result = await syncSubscription(subscription.id);

    logger.info(
      { subscriptionId: subscription.id, organizationId: result.organizationId },
      "Subscription updated"
    );

    return {
      success: result.success,
      eventType: "customer.subscription.updated",
      organizationId: result.organizationId,
      message: "Subscription updated",
    };
  } catch (err: any) {
    logger.error({ err, subscription }, "Failed to handle subscription updated");
    return {
      success: false,
      eventType: "customer.subscription.updated",
      error: err.message,
    };
  }
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  try {
    const organizationId = subscription.metadata?.organizationId;

    if (!organizationId) {
      logger.warn(
        { subscriptionId: subscription.id },
        "Subscription missing organizationId in metadata"
      );
      return {
        success: false,
        eventType: "customer.subscription.deleted",
        error: "Missing organizationId in metadata",
      };
    }

    // Update organization to cancelled status
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscription_status: "cancelled",
        subscription_ends_at: new Date(),
        stripe_subscription_id: null,
        cancel_at_period_end: false, // Reset flag when deleted
      },
    });

    logger.info(
      { subscriptionId: subscription.id, organizationId },
      "Subscription deleted"
    );

    return {
      success: true,
      eventType: "customer.subscription.deleted",
      organizationId,
      message: "Subscription cancelled",
    };
  } catch (err: any) {
    logger.error({ err, subscription }, "Failed to handle subscription deleted");
    return {
      success: false,
      eventType: "customer.subscription.deleted",
      error: err.message,
    };
  }
}

/**
 * Handle customer.subscription.trial_will_end event
 * Send notification to customer that trial is ending soon
 */
export async function handleTrialWillEnd(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  try {
    const organizationId = subscription.metadata?.organizationId;

    if (!organizationId) {
      return {
        success: false,
        eventType: "customer.subscription.trial_will_end",
        error: "Missing organizationId in metadata",
      };
    }

    // TODO: Send email notification to organization
    // You can integrate with your email service here

    logger.info(
      { subscriptionId: subscription.id, organizationId },
      "Trial will end soon"
    );

    return {
      success: true,
      eventType: "customer.subscription.trial_will_end",
      organizationId,
      message: "Trial ending notification sent",
    };
  } catch (err: any) {
    logger.error({ err, subscription }, "Failed to handle trial will end");
    return {
      success: false,
      eventType: "customer.subscription.trial_will_end",
      error: err.message,
    };
  }
}

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  try {
    // invoice.subscription is a string ID or expandable subscription object
    const subscriptionId = (invoice as any).subscription as string | undefined;

    if (!subscriptionId) {
      return {
        success: true,
        eventType: "invoice.paid",
        message: "Invoice paid (no subscription)",
      };
    }

    // Sync subscription to ensure status is up to date
    const result = await syncSubscription(subscriptionId);

    logger.info(
      { invoiceId: invoice.id, subscriptionId, organizationId: result.organizationId },
      "Invoice paid"
    );

    return {
      success: result.success,
      eventType: "invoice.paid",
      organizationId: result.organizationId,
      message: "Invoice paid",
    };
  } catch (err: any) {
    logger.error({ err, invoice }, "Failed to handle invoice paid");
    return {
      success: false,
      eventType: "invoice.paid",
      error: err.message,
    };
  }
}

/**
 * Handle invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  try {
    // invoice.subscription is a string ID or expandable subscription object
    const subscriptionId = (invoice as any).subscription as string | undefined;

    if (!subscriptionId) {
      return {
        success: true,
        eventType: "invoice.payment_failed",
        message: "Invoice payment failed (no subscription)",
      };
    }

    // Sync subscription (might be in past_due status)
    const result = await syncSubscription(subscriptionId);

    // TODO: Send email notification to customer about failed payment
    // You can integrate with your email service here

    logger.warn(
      { invoiceId: invoice.id, subscriptionId, organizationId: result.organizationId },
      "Invoice payment failed"
    );

    return {
      success: result.success,
      eventType: "invoice.payment_failed",
      organizationId: result.organizationId,
      message: "Invoice payment failed",
    };
  } catch (err: any) {
    logger.error({ err, invoice }, "Failed to handle invoice payment failed");
    return {
      success: false,
      eventType: "invoice.payment_failed",
      error: err.message,
    };
  }
}

/**
 * Handle invoice.payment_action_required event
 */
export async function handleInvoicePaymentActionRequired(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  try {
    // invoice.subscription is a string ID or expandable subscription object
    const subscriptionId = (invoice as any).subscription as string | undefined;

    if (!subscriptionId) {
      return {
        success: true,
        eventType: "invoice.payment_action_required",
        message: "Invoice payment action required (no subscription)",
      };
    }

    // TODO: Send email notification to customer that action is required
    // Include the invoice.hosted_invoice_url for the customer to take action

    logger.info(
      { invoiceId: invoice.id, subscriptionId },
      "Invoice payment action required"
    );

    return {
      success: true,
      eventType: "invoice.payment_action_required",
      message: "Invoice payment action required notification sent",
    };
  } catch (err: any) {
    logger.error(
      { err, invoice },
      "Failed to handle invoice payment action required"
    );
    return {
      success: false,
      eventType: "invoice.payment_action_required",
      error: err.message,
    };
  }
}

// ============================================
// WEBHOOK EVENT ROUTER
// ============================================

/**
 * Route webhook event to appropriate handler
 */
export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  logger.info({ eventType: event.type, eventId: event.id }, "Processing webhook event");

  try {
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );

      case "customer.subscription.created":
        return await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );

      case "customer.subscription.updated":
        return await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );

      case "customer.subscription.deleted":
        return await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );

      case "customer.subscription.trial_will_end":
        return await handleTrialWillEnd(event.data.object as Stripe.Subscription);

      case "invoice.paid":
        return await handleInvoicePaid(event.data.object as Stripe.Invoice);

      case "invoice.payment_failed":
        return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

      case "invoice.payment_action_required":
        return await handleInvoicePaymentActionRequired(
          event.data.object as Stripe.Invoice
        );

      default:
        logger.debug({ eventType: event.type }, "Unhandled webhook event type");
        return {
          success: true,
          eventType: event.type,
          message: "Event type not handled",
        };
    }
  } catch (err: any) {
    logger.error({ err, eventType: event.type, eventId: event.id }, "Webhook handler error");
    return {
      success: false,
      eventType: event.type,
      error: err.message,
    };
  }
}
