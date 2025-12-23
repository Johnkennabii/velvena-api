/**
 * Force subscription sync from Stripe to fix missing subscription_ends_at
 */

import prisma from "../src/lib/prisma.js";
import { syncSubscription } from "../src/services/stripeService.js";

async function main() {
  try {
    // Find organization with the bug
    const org = await prisma.organization.findFirst({
      where: {
        stripe_subscription_id: { not: null },
        cancel_at_period_end: true,
        subscription_ends_at: null,
      },
    });

    if (!org) {
      console.log("✅ No organizations with the bug found (or all are fixed)");
      return;
    }

    console.log("\n📋 Found organization with bug:");
    console.log({
      id: org.id,
      name: org.name,
      stripe_subscription_id: org.stripe_subscription_id,
      cancel_at_period_end: org.cancel_at_period_end,
      subscription_ends_at: org.subscription_ends_at,
    });

    if (!org.stripe_subscription_id) {
      console.log("❌ No stripe_subscription_id found");
      return;
    }

    console.log("\n🔄 Forcing sync from Stripe...\n");

    // Sync subscription
    const result = await syncSubscription(org.stripe_subscription_id);

    console.log("\n✅ Sync result:", result);

    // Re-fetch organization
    const updatedOrg = await prisma.organization.findUnique({
      where: { id: org.id },
      select: {
        subscription_ends_at: true,
        cancel_at_period_end: true,
      },
    });

    console.log("\n📊 Updated organization:");
    console.log(updatedOrg);

    if (updatedOrg?.cancel_at_period_end && updatedOrg?.subscription_ends_at) {
      console.log("\n✅ BUG FIXED! subscription_ends_at is now set to:", updatedOrg.subscription_ends_at);
    } else if (updatedOrg?.cancel_at_period_end && !updatedOrg?.subscription_ends_at) {
      console.log("\n❌ BUG STILL EXISTS! subscription_ends_at is still null");
      console.log("Check the logs above to see what Stripe returned for current_period_end");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
