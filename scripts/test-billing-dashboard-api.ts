/**
 * Test billing dashboard API response
 */

import prisma from "../src/lib/prisma.js";
import { getSubscriptionStatus } from "../src/utils/subscriptionManager.js";

async function main() {
  try {
    // Find organization with cancelled subscription
    const org = await prisma.organization.findFirst({
      where: {
        stripe_subscription_id: { not: null },
        cancel_at_period_end: true,
      },
    });

    if (!org) {
      console.log("❌ No organization with cancelled subscription found");
      return;
    }

    console.log("\n📋 Testing API response for organization:", org.name);
    console.log("Organization ID:", org.id);

    // Get subscription status (this is what the API returns)
    const status = await getSubscriptionStatus(org.id);

    console.log("\n✅ API Response:");
    console.log(JSON.stringify(status, null, 2));

    // Check specific fields
    console.log("\n🔍 Key fields:");
    console.log("  is_cancelling:", status.is_cancelling);
    console.log("  cancellation_type:", status.cancellation_type);
    console.log("  cancellation_date:", status.cancellation_date);
    console.log("  subscription_ends_at:", status.subscription_ends_at);
    console.log("  days_until_cancellation:", status.days_until_cancellation);

    if (status.is_cancelling && status.subscription_ends_at && status.cancellation_date) {
      console.log("\n✅ SUCCESS! All cancellation fields are correctly set");
    } else {
      console.log("\n❌ FAILED! Some fields are missing:");
      if (!status.subscription_ends_at) console.log("  - subscription_ends_at is null");
      if (!status.cancellation_date) console.log("  - cancellation_date is null");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
