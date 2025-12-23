/**
 * Check current subscription state in database
 */

import prisma from "../src/lib/prisma.js";

async function main() {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        stripe_subscription_id: { not: null },
      },
      select: {
        id: true,
        name: true,
        subscription_status: true,
        subscription_ends_at: true,
        cancel_at_period_end: true,
        stripe_subscription_id: true,
      },
      take: 10,
    });

    console.log("\n📊 Organizations with Stripe subscriptions:");
    console.log("=".repeat(80));

    if (orgs.length === 0) {
      console.log("No organizations with Stripe subscriptions found.");
    } else {
      orgs.forEach((org) => {
        console.log(`\n📋 ${org.name} (${org.id})`);
        console.log(`   Status: ${org.subscription_status}`);
        console.log(`   Stripe Sub ID: ${org.stripe_subscription_id}`);
        console.log(`   Cancel at period end: ${org.cancel_at_period_end}`);
        console.log(`   Subscription ends at: ${org.subscription_ends_at || "null"}`);

        if (org.cancel_at_period_end && !org.subscription_ends_at) {
          console.log("   ⚠️  BUG: cancel_at_period_end is true but subscription_ends_at is null!");
        }
      });
    }

    console.log("\n" + "=".repeat(80));
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
