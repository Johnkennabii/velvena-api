/**
 * Stripe TypeScript Types and Interfaces
 */

import type Stripe from "stripe";

/**
 * Billing interval for subscriptions
 */
export type BillingInterval = "month" | "year";

/**
 * Checkout session creation parameters
 */
export interface CreateCheckoutSessionParams {
  organizationId: string;
  planCode: string;
  billingInterval: BillingInterval;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
}

/**
 * Customer portal session parameters
 */
export interface CreatePortalSessionParams {
  organizationId: string;
  returnUrl?: string;
}

/**
 * Subscription sync result
 */
export interface SubscriptionSyncResult {
  success: boolean;
  organizationId: string;
  subscriptionId: string;
  status: string;
  planCode?: string;
  error?: string;
}

/**
 * Webhook event types we handle
 */
export type StripeWebhookEvent =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "customer.subscription.trial_will_end"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "invoice.payment_action_required";

/**
 * Webhook handler result
 */
export interface WebhookHandlerResult {
  success: boolean;
  eventType: string;
  organizationId?: string;
  message?: string;
  error?: string;
}

/**
 * Product sync parameters
 */
export interface SyncProductParams {
  planId: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
}

/**
 * Product sync result
 */
export interface SyncProductResult {
  success: boolean;
  planId: string;
  planCode: string;
  stripeProductId?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  error?: string;
}

/**
 * Extended Stripe types with our metadata
 */
export interface StripeCustomerMetadata {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  [key: string]: string;
}

export interface StripeSubscriptionMetadata {
  organizationId: string;
  planCode: string;
  billingInterval: BillingInterval;
  [key: string]: string;
}

export interface StripeProductMetadata {
  planId: string;
  planCode: string;
  [key: string]: string;
}

export interface StripePriceMetadata {
  planId: string;
  planCode: string;
  billingInterval: BillingInterval;
  [key: string]: string;
}

/**
 * Subscription status mapping
 */
export const SUBSCRIPTION_STATUS_MAP: Record<
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
