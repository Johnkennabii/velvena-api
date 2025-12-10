#!/usr/bin/env tsx
/**
 * Sync Subscription Plans to Stripe
 *
 * This script synchronizes all subscription plans from the database to Stripe.
 * It creates products and prices in Stripe for each plan (except "free").
 *
 * Usage:
 *   npm run sync-plans-to-stripe
 *   OR
 *   tsx scripts/sync-plans-to-stripe.ts
 *
 * Requirements:
 * - STRIPE_SECRET_KEY must be set in .env
 * - Database must contain subscription plans
 */

// Load environment variables FIRST using dynamic import
import "./load-env.js";

async function main() {
  // Dynamic imports after env is loaded
  const { syncAllProductsToStripe } = await import("../src/services/stripeService.js");
  const { default: logger } = await import("../src/lib/logger.js");
  const { verifyStripeConfig } = await import("../src/lib/stripe.js");
  console.log("🚀 Starting Stripe synchronization...\n");

  // Verify Stripe configuration
  if (!verifyStripeConfig()) {
    console.error("❌ Stripe configuration is incomplete. Please check your .env file.");
    process.exit(1);
  }

  try {
    const results = await syncAllProductsToStripe();

    console.log("\n📊 Synchronization Results:\n");
    console.log("═".repeat(80));

    let successCount = 0;
    let failureCount = 0;

    for (const result of results) {
      if (result.success) {
        successCount++;
        console.log(`✅ ${result.planCode.toUpperCase()}`);
        console.log(`   Product ID: ${result.stripeProductId}`);
        console.log(`   Monthly Price ID: ${result.stripePriceIdMonthly || "N/A"}`);
        console.log(`   Yearly Price ID: ${result.stripePriceIdYearly || "N/A"}`);
        console.log("");
      } else {
        failureCount++;
        console.log(`❌ ${result.planCode.toUpperCase()}`);
        console.log(`   Error: ${result.error}`);
        console.log("");
      }
    }

    console.log("═".repeat(80));
    console.log(`\n✨ Synchronization complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failures: ${failureCount}`);
    console.log("");

    if (failureCount > 0) {
      console.error("⚠️  Some plans failed to sync. Please check the errors above.");
      process.exit(1);
    }

    console.log("🎉 All plans synchronized successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ Synchronization failed:");
    console.error(err.message);
    logger.error({ err }, "Failed to sync plans to Stripe");
    process.exit(1);
  }
}

main();
