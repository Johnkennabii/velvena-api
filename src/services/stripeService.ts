/**
 * Stripe Service
 *
 * Business logic for Stripe integration:
 * - Create checkout sessions
 * - Manage customers
 * - Manage subscriptions
 * - Create customer portal sessions
 * - Sync products and prices
 */

import stripe, { stripeConfig } from "../lib/stripe.js";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import type {
  CreateCheckoutSessionParams,
  CreatePortalSessionParams,
  SubscriptionSyncResult,
  SyncProductParams,
  SyncProductResult,
  StripeCustomerMetadata,
  StripeSubscriptionMetadata,
  StripeProductMetadata,
  StripePriceMetadata,
  SUBSCRIPTION_STATUS_MAP,
} from "../types/stripe.js";
import type Stripe from "stripe";

// ============================================
// CHECKOUT & PAYMENT
// ============================================

/**
 * Create a Stripe Checkout Session for a subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const {
    organizationId,
    planCode,
    billingInterval,
    customerEmail,
    successUrl,
    cancelUrl,
    trialDays,
  } = params;

  try {
    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new Error(`Subscription plan '${planCode}' not found`);
    }

    // Get the appropriate Stripe price ID
    const stripePriceId =
      billingInterval === "year"
        ? plan.stripe_price_id_yearly
        : plan.stripe_price_id_monthly;

    if (!stripePriceId) {
      throw new Error(
        `Stripe price ID not found for plan '${planCode}' with interval '${billingInterval}'`
      );
    }

    // Check if customer already exists in Stripe
    let customerId = organization.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customerParams: any = {
        name: organization.name,
        metadata: {
          organizationId: organization.id,
          organizationName: organization.name,
          organizationSlug: organization.slug,
        } as StripeCustomerMetadata,
      };

      if (customerEmail || organization.email) {
        customerParams.email = customerEmail || organization.email;
      }

      const customer = await stripe.customers.create(customerParams);

      customerId = customer.id;

      // Update organization with Stripe customer ID
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripe_customer_id: customerId },
      });

      logger.info(
        { organizationId, customerId },
        "Created Stripe customer for organization"
      );
    }

    // Prepare subscription data
    const subscriptionData: any = {
      metadata: {
        organizationId: organization.id,
        planCode: plan.code,
        billingInterval,
      } as StripeSubscriptionMetadata,
    };

    // Only add trial if explicitly requested via trialDays parameter
    // Plans payants n'ont PAS de période d'essai par défaut
    if (trialDays && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: successUrl || stripeConfig.successUrl,
      cancel_url: cancelUrl || stripeConfig.cancelUrl,
      metadata: {
        organizationId: organization.id,
        planCode: plan.code,
      },
    });

    logger.info(
      { organizationId, planCode, billingInterval, sessionId: session.id },
      "Created Stripe checkout session"
    );

    return session;
  } catch (err: any) {
    logger.error(
      { err, organizationId, planCode, billingInterval },
      "Failed to create checkout session"
    );
    throw err;
  }
}

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage their subscription, payment methods, and invoices
 */
export async function createPortalSession(
  params: CreatePortalSessionParams
): Promise<Stripe.BillingPortal.Session> {
  const { organizationId, returnUrl } = params;

  try {
    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!organization.stripe_customer_id) {
      throw new Error("Organization does not have a Stripe customer ID");
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: returnUrl || stripeConfig.successUrl,
    });

    logger.info(
      { organizationId, sessionId: session.id },
      "Created Stripe customer portal session"
    );

    return session;
  } catch (err: any) {
    logger.error(
      { err, organizationId },
      "Failed to create customer portal session"
    );
    throw err;
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Sync subscription from Stripe to local database
 */
export async function syncSubscription(
  stripeSubscriptionId: string
): Promise<SubscriptionSyncResult> {
  try {
    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const organizationId = subscription.metadata.organizationId;
    const planCode = subscription.metadata.planCode;

    if (!organizationId) {
      throw new Error("Subscription metadata missing organizationId");
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    // Get subscription plan by code
    let plan = null;
    if (planCode) {
      plan = await prisma.subscriptionPlan.findUnique({
        where: { code: planCode },
      });
    }

    // Map Stripe status to our status
    const statusMap: Record<
      Stripe.Subscription.Status,
      "trial" | "active" | "suspended" | "cancelled"
    > = {
      incomplete: "suspended",
      incomplete_expired: "cancelled",
      trialing: "trial",
      active: "active",
      past_due: "suspended",
      canceled: "cancelled",
      unpaid: "suspended",
      paused: "suspended",
    };

    const status = statusMap[subscription.status] || "suspended";

    // Calculate trial and subscription end dates
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;
    const subscriptionEnd =
      subscription.status === "canceled" && subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : null;

    // Update organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripe_subscription_id: subscription.id,
        subscription_plan_id: plan?.id || organization.subscription_plan_id,
        subscription_status: status,
        subscription_started_at: new Date(subscription.created * 1000),
        trial_ends_at: trialEnd,
        subscription_ends_at: subscriptionEnd,
      },
    });

    logger.info(
      { organizationId, subscriptionId: subscription.id, status, planCode },
      "Synced subscription from Stripe"
    );

    const result: SubscriptionSyncResult = {
      success: true,
      organizationId,
      subscriptionId: subscription.id,
      status,
    };

    if (planCode) {
      result.planCode = planCode;
    }

    return result;
  } catch (err: any) {
    logger.error(
      { err, stripeSubscriptionId },
      "Failed to sync subscription from Stripe"
    );
    return {
      success: false,
      organizationId: "",
      subscriptionId: stripeSubscriptionId,
      status: "error",
      error: err.message,
    };
  }
}

/**
 * Update/Change subscription plan (Upgrade or Downgrade)
 */
export async function updateSubscription(
  organizationId: string,
  newPlanCode: string,
  billingInterval: "month" | "year" = "month",
  prorationBehavior: "create_prorations" | "none" | "always_invoice" = "create_prorations"
): Promise<Stripe.Subscription> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!organization.stripe_subscription_id) {
      throw new Error("Organization does not have an active Stripe subscription");
    }

    // Get new plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { code: newPlanCode },
    });

    if (!newPlan) {
      throw new Error(`Subscription plan '${newPlanCode}' not found`);
    }

    // Get the appropriate Stripe price ID
    const newStripePriceId =
      billingInterval === "year"
        ? newPlan.stripe_price_id_yearly
        : newPlan.stripe_price_id_monthly;

    if (!newStripePriceId) {
      throw new Error(
        `Stripe price ID not found for plan '${newPlanCode}' with interval '${billingInterval}'`
      );
    }

    // Retrieve current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(
      organization.stripe_subscription_id
    );

    // Get current subscription item (first item)
    if (!currentSubscription.items.data[0]) {
      throw new Error("No subscription items found");
    }
    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      organization.stripe_subscription_id,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newStripePriceId,
          },
        ],
        proration_behavior: prorationBehavior,
        metadata: {
          organizationId: organization.id,
          planCode: newPlan.code,
          billingInterval,
        } as StripeSubscriptionMetadata,
      }
    );

    // Update organization in database
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscription_plan_id: newPlan.id,
      },
    });

    logger.info(
      {
        organizationId,
        oldPlanId: organization.subscription_plan_id,
        newPlanCode,
        billingInterval,
        prorationBehavior,
      },
      "Updated subscription plan in Stripe"
    );

    return updatedSubscription;
  } catch (err: any) {
    logger.error(
      { err, organizationId, newPlanCode },
      "Failed to update subscription"
    );
    throw err;
  }
}

/**
 * Cancel a subscription in Stripe
 */
export async function cancelSubscription(
  organizationId: string,
  immediately = false
): Promise<void> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!organization.stripe_subscription_id) {
      throw new Error("Organization does not have an active Stripe subscription");
    }

    // Cancel in Stripe
    if (immediately) {
      await stripe.subscriptions.cancel(organization.stripe_subscription_id);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(organization.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    logger.info(
      { organizationId, immediately },
      "Cancelled subscription in Stripe"
    );
  } catch (err: any) {
    logger.error({ err, organizationId }, "Failed to cancel subscription");
    throw err;
  }
}

// ============================================
// PRODUCT & PRICE MANAGEMENT
// ============================================

/**
 * Sync a subscription plan to Stripe (create/update product and prices)
 */
export async function syncProductToStripe(
  params: SyncProductParams
): Promise<SyncProductResult> {
  const {
    planId,
    name,
    description,
    priceMonthly,
    priceYearly,
    currency,
    trialDays,
  } = params;

  try {
    // Get plan from database
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    let productId = plan.stripe_product_id;
    let product;

    // Create or update product
    if (productId) {
      // Update existing product
      const productParams: any = {
        name,
        metadata: {
          planId: plan.id,
          planCode: plan.code,
        } as StripeProductMetadata,
      };

      if (description) {
        productParams.description = description;
      }

      product = await stripe.products.update(productId, productParams);
    } else {
      // Create new product
      const productParams: any = {
        name,
        metadata: {
          planId: plan.id,
          planCode: plan.code,
        } as StripeProductMetadata,
      };

      if (description) {
        productParams.description = description;
      }

      product = await stripe.products.create(productParams);
      productId = product.id;
    }

    // Create or update monthly price
    let priceIdMonthly = plan.stripe_price_id_monthly;
    if (!priceIdMonthly && priceMonthly > 0) {
      const priceMonthlyObj = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(priceMonthly * 100), // Convert to cents
        currency: currency.toLowerCase(),
        recurring: {
          interval: "month",
          trial_period_days: trialDays,
        },
        metadata: {
          planId: plan.id,
          planCode: plan.code,
          billingInterval: "month",
        } as StripePriceMetadata,
      });
      priceIdMonthly = priceMonthlyObj.id;
    }

    // Create or update yearly price
    let priceIdYearly = plan.stripe_price_id_yearly;
    if (!priceIdYearly && priceYearly > 0) {
      const priceYearlyObj = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(priceYearly * 100), // Convert to cents
        currency: currency.toLowerCase(),
        recurring: {
          interval: "year",
          trial_period_days: trialDays,
        },
        metadata: {
          planId: plan.id,
          planCode: plan.code,
          billingInterval: "year",
        } as StripePriceMetadata,
      });
      priceIdYearly = priceYearlyObj.id;
    }

    // Update plan with Stripe IDs
    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        stripe_product_id: productId,
        stripe_price_id_monthly: priceIdMonthly,
        stripe_price_id_yearly: priceIdYearly,
      },
    });

    logger.info(
      {
        planId,
        planCode: plan.code,
        productId,
        priceIdMonthly,
        priceIdYearly,
      },
      "Synced product to Stripe"
    );

    const result: SyncProductResult = {
      success: true,
      planId,
      planCode: plan.code,
    };

    if (productId) {
      result.stripeProductId = productId;
    }

    if (priceIdMonthly) {
      result.stripePriceIdMonthly = priceIdMonthly;
    }

    if (priceIdYearly) {
      result.stripePriceIdYearly = priceIdYearly;
    }

    return result;
  } catch (err: any) {
    logger.error({ err, planId }, "Failed to sync product to Stripe");
    return {
      success: false,
      planId,
      planCode: "",
      error: err.message,
    };
  }
}

/**
 * Sync all subscription plans to Stripe
 */
export async function syncAllProductsToStripe(): Promise<SyncProductResult[]> {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        code: {
          not: "free", // Don't sync free plan to Stripe
        },
      },
    });

    const results: SyncProductResult[] = [];

    for (const plan of plans) {
      const params: SyncProductParams = {
        planId: plan.id,
        name: plan.name,
        priceMonthly: Number(plan.price_monthly),
        priceYearly: Number(plan.price_yearly),
        currency: plan.currency,
        trialDays: plan.trial_days,
      };

      if (plan.description) {
        params.description = plan.description;
      }

      const result = await syncProductToStripe(params);
      results.push(result);
    }

    return results;
  } catch (err: any) {
    logger.error({ err }, "Failed to sync all products to Stripe");
    throw err;
  }
}

// ============================================
// INVOICES
// ============================================

/**
 * Get invoice history for an organization
 */
export async function getInvoices(organizationId: string, limit = 100) {
  try {
    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!organization.stripe_customer_id) {
      // No Stripe customer = no invoices
      return {
        has_more: false,
        data: [],
      };
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: organization.stripe_customer_id,
      limit,
    });

    // Format invoices for frontend
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount_due: invoice.amount_due / 100, // Convert from cents to currency
      amount_paid: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      created: new Date(invoice.created * 1000).toISOString(),
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
      due_date: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : null,
      paid: invoice.status === "paid",
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      description: invoice.description,
    }));

    logger.info(
      { organizationId, count: formattedInvoices.length },
      "Retrieved invoices from Stripe"
    );

    return {
      has_more: invoices.has_more,
      data: formattedInvoices,
    };
  } catch (err: any) {
    logger.error({ err, organizationId }, "Failed to retrieve invoices");
    throw err;
  }
}
