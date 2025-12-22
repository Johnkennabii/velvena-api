/**
 * Force sync subscription from Stripe
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function forceSync() {
  const subscriptionId = "sub_1ShCOORJ7PlLrfUPhG2A4d9F";

  console.log("🔄 Fetching subscription from Stripe...");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const organizationId = subscription.metadata.organizationId;
  console.log("📦 Organization ID:", organizationId);

  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
  const currentPeriodEnd = (subscription as any).current_period_end;

  console.log("📊 Data from Stripe:");
  console.log("  cancel_at_period_end:", cancelAtPeriodEnd);
  console.log("  current_period_end:", currentPeriodEnd);

  const effectiveSubscriptionEnd = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : null;

  console.log("\n🧮 Calculated:");
  console.log("  effectiveSubscriptionEnd:", effectiveSubscriptionEnd);
  console.log("  Type:", typeof effectiveSubscriptionEnd);

  if (!effectiveSubscriptionEnd) {
    console.log("❌ effectiveSubscriptionEnd is NULL, cannot update");
    process.exit(1);
  }

  console.log("\n💾 Updating database...");

  const result = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscription_ends_at: effectiveSubscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    },
  });

  console.log("✅ Updated successfully!");
  console.log("  subscription_ends_at:", result.subscription_ends_at);
  console.log("  cancel_at_period_end:", result.cancel_at_period_end);

  await prisma.$disconnect();
}

forceSync().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
