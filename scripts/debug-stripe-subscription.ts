/**
 * Debug Stripe subscription data
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function debugSubscription() {
  const subscriptionId = "sub_1ShCOORJ7PlLrfUPhG2A4d9F";

  console.log("🔍 Fetching subscription from Stripe...\n");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  console.log("📊 Subscription Details:");
  console.log("  ID:", subscription.id);
  console.log("  Status:", subscription.status);
  console.log("  cancel_at_period_end:", (subscription as any).cancel_at_period_end);
  console.log("  current_period_start:", (subscription as any).current_period_start);
  console.log("  current_period_end:", (subscription as any).current_period_end);
  console.log("  canceled_at:", (subscription as any).canceled_at);
  console.log("  ended_at:", subscription.ended_at);
  console.log("\n");

  const currentPeriodEnd = (subscription as any).current_period_end;
  if (currentPeriodEnd) {
    const date = new Date(currentPeriodEnd * 1000);
    console.log("📅 Current Period End Date:");
    console.log("  Timestamp:", currentPeriodEnd);
    console.log("  Date:", date.toISOString());
    console.log("  Date (FR):", date.toLocaleString('fr-FR'));
  } else {
    console.log("❌ current_period_end is NULL or undefined!");
  }

  console.log("\n🧮 Calculation Test:");
  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
  console.log("  cancelAtPeriodEnd:", cancelAtPeriodEnd);
  console.log("  currentPeriodEnd:", currentPeriodEnd);

  const subscriptionEnd = subscription.status === "canceled" && subscription.ended_at
    ? new Date(subscription.ended_at * 1000)
    : null;
  console.log("  subscriptionEnd:", subscriptionEnd);

  const effectiveSubscriptionEnd = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : subscriptionEnd;

  console.log("  effectiveSubscriptionEnd:", effectiveSubscriptionEnd);
  console.log("  Type:", typeof effectiveSubscriptionEnd);

  if (effectiveSubscriptionEnd) {
    console.log("  ✅ SHOULD BE SAVED:", effectiveSubscriptionEnd.toISOString());
  } else {
    console.log("  ❌ NULL - THIS IS THE BUG!");
  }
}

debugSubscription().catch(console.error);
