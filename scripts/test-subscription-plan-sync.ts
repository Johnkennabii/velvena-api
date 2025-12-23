/**
 * Force sync to test subscription_plan field update
 */

import prisma from "../src/lib/prisma.js";
import { syncSubscription } from "../src/services/stripeService.js";

async function main() {
  try {
    // Find any organization with Stripe subscription
    const org = await prisma.organization.findFirst({
      where: {
        stripe_subscription_id: { not: null },
      },
    });

    if (!org) {
      console.log("❌ No organization with Stripe subscription found");
      return;
    }

    console.log("\n📋 Organization:", org.name);
    console.log("Before sync:");
    console.log("  subscription_plan_id:", org.subscription_plan_id);
    console.log("  subscription_plan (deprecated):", org.subscription_plan);

    if (!org.stripe_subscription_id) {
      console.log("❌ No stripe_subscription_id");
      return;
    }

    console.log("\n🔄 Forcing sync...");
    await syncSubscription(org.stripe_subscription_id);

    // Re-fetch organization
    const updatedOrg = await prisma.organization.findUnique({
      where: { id: org.id },
      include: {
        subscription: true,
      },
    });

    console.log("\n✅ After sync:");
    console.log("  subscription_plan_id:", updatedOrg?.subscription_plan_id);
    console.log("  subscription_plan (deprecated):", updatedOrg?.subscription_plan);
    console.log("  Plan code from relation:", updatedOrg?.subscription?.code);

    if (updatedOrg?.subscription?.code === updatedOrg?.subscription_plan) {
      console.log("\n✅ SUCCESS! Both fields are now synchronized");
    } else {
      console.log("\n❌ FAILED! Fields are still out of sync:");
      console.log(`  Expected: ${updatedOrg?.subscription?.code}`);
      console.log(`  Got: ${updatedOrg?.subscription_plan}`);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
