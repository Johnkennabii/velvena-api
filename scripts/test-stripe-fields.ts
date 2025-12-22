/**
 * Test script to verify Stripe field names
 */

import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

async function testFields() {
  const subscriptionId = "sub_1ShCOORJ7PlLrfUPhG2A4d9F"; // Your test subscription

  console.log("🔍 Fetching subscription from Stripe...\n");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  console.log("📊 Testing field access methods:\n");

  // Test snake_case
  console.log("1️⃣ Snake_case access:");
  console.log("   subscription.cancel_at_period_end =", (subscription as any).cancel_at_period_end);
  console.log("   subscription.current_period_end =", (subscription as any).current_period_end);

  // Test camelCase
  console.log("\n2️⃣ CamelCase access:");
  console.log("   subscription.cancelAtPeriodEnd =", subscription.cancelAtPeriodEnd);
  console.log("   subscription.currentPeriodEnd =", subscription.currentPeriodEnd);

  // Show actual keys
  console.log("\n3️⃣ All subscription keys:");
  const keys = Object.keys(subscription).filter(k =>
    k.includes('cancel') || k.includes('period') || k.includes('current')
  );
  console.log("   ", keys);

  console.log("\n✅ Result:");
  if (subscription.currentPeriodEnd) {
    console.log(`   ✓ camelCase works! currentPeriodEnd = ${subscription.currentPeriodEnd}`);
    console.log(`   ✓ Date: ${new Date(subscription.currentPeriodEnd * 1000).toISOString()}`);
  } else {
    console.log(`   ✗ camelCase doesn't work`);
  }

  if ((subscription as any).current_period_end) {
    console.log(`   ✓ snake_case works! current_period_end = ${(subscription as any).current_period_end}`);
  } else {
    console.log(`   ✗ snake_case doesn't work`);
  }
}

testFields().catch(console.error);
