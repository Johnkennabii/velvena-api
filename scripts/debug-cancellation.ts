/**
 * Debug script to test subscription cancellation and sync
 */

import stripe from "../src/lib/stripe.js";
import prisma from "../src/lib/prisma.js";
import { syncSubscription } from "../src/services/stripeService.js";

async function main() {
  try {
    // Get an organization with an active subscription
    const org = await prisma.organization.findFirst({
      where: {
        stripe_subscription_id: { not: null },
        subscription_status: "active",
      },
    });

    if (!org) {
      console.log("❌ No organization with active subscription found");
      return;
    }

    console.log("\n📋 Organization:");
    console.log({
      id: org.id,
      name: org.name,
      subscription_status: org.subscription_status,
      subscription_ends_at: org.subscription_ends_at,
      cancel_at_period_end: org.cancel_at_period_end,
      stripe_subscription_id: org.stripe_subscription_id,
    });

    if (!org.stripe_subscription_id) {
      console.log("❌ No stripe_subscription_id");
      return;
    }

    // Fetch subscription from Stripe
    console.log("\n📊 Fetching subscription from Stripe...");
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);

    console.log("\n🔍 Stripe Subscription Data:");
    console.log({
      id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      current_period_end_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at,
      ended_at: subscription.ended_at,
    });

    // Check if subscription is set to cancel at period end
    if (subscription.cancel_at_period_end) {
      console.log("\n✅ Subscription IS set to cancel at period end");
      console.log("Current period ends at:", new Date(subscription.current_period_end * 1000).toISOString());
    } else {
      console.log("\n❌ Subscription is NOT set to cancel at period end");
    }

    // Now sync and check what gets saved
    console.log("\n🔄 Syncing subscription...");
    const syncResult = await syncSubscription(org.stripe_subscription_id);
    console.log("Sync result:", syncResult);

    // Re-fetch organization from database
    const updatedOrg = await prisma.organization.findUnique({
      where: { id: org.id },
    });

    console.log("\n💾 Updated Organization in DB:");
    console.log({
      subscription_status: updatedOrg?.subscription_status,
      subscription_ends_at: updatedOrg?.subscription_ends_at,
      cancel_at_period_end: updatedOrg?.cancel_at_period_end,
    });

    if (updatedOrg?.cancel_at_period_end && !updatedOrg?.subscription_ends_at) {
      console.log("\n🚨 BUG DETECTED: cancel_at_period_end is true but subscription_ends_at is null!");
    } else if (updatedOrg?.cancel_at_period_end && updatedOrg?.subscription_ends_at) {
      console.log("\n✅ Correctly synced: subscription_ends_at is set to", updatedOrg.subscription_ends_at);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
