/**
 * Stripe Client Configuration
 *
 * Centralized Stripe client instance for all subscription and payment operations
 */

import Stripe from "stripe";
import logger from "./logger.js";

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY is not set. Stripe integration will not work.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
  typescript: true,
  appInfo: {
    name: "Velvena",
    version: "1.0.0",
    url: "https://velvena.fr",
  },
});

export default stripe;

/**
 * Stripe configuration constants
 */
export const stripeConfig = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  successUrl: process.env.STRIPE_SUCCESS_URL || "https://velvena.fr/subscription/success",
  cancelUrl: process.env.STRIPE_CANCEL_URL || "https://velvena.fr/subscription/cancel",
};

/**
 * Verify Stripe configuration is complete
 */
export function verifyStripeConfig(): boolean {
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error({ missing }, "Missing required Stripe configuration");
    return false;
  }

  return true;
}
