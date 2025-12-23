/**
 * Test complete cancellation flow
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function testFlow() {
  const subscriptionId = "sub_1ShCOORJ7PlLrfUPhG2A4d9F";

  console.log("🧪 TESTING FULL CANCELLATION FLOW\n");
  console.log("=".repeat(60));

  // STEP 1: Cancel in Stripe
  console.log("\n1️⃣ Cancelling subscription in Stripe...");
  const updated = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  console.log(`   ✓ Stripe updated`);
  console.log(`   cancel_at_period_end: ${(updated as any).cancel_at_period_end}`);
  console.log(`   current_period_end: ${(updated as any).current_period_end}`);

  // STEP 2: Fetch fresh data
  console.log("\n2️⃣ Fetching fresh data from Stripe...");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const organizationId = subscription.metadata.organizationId;
  const planCode = subscription.metadata.planCode;
  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
  const currentPeriodEnd = (subscription as any).current_period_end;

  console.log(`   organizationId: ${organizationId}`);
  console.log(`   planCode: ${planCode}`);
  console.log(`   cancel_at_period_end: ${cancelAtPeriodEnd}`);
  console.log(`   current_period_end: ${currentPeriodEnd}`);

  // STEP 3: Calculate effectiveSubscriptionEnd
  console.log("\n3️⃣ Calculating effectiveSubscriptionEnd...");

  const subscriptionEnd =
    subscription.status === "canceled" && subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null;

  const effectiveSubscriptionEnd = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : subscriptionEnd;

  console.log(`   subscriptionEnd: ${subscriptionEnd}`);
  console.log(`   effectiveSubscriptionEnd: ${effectiveSubscriptionEnd}`);

  if (!effectiveSubscriptionEnd && cancelAtPeriodEnd) {
    console.log(`\n   ❌ BUG DETECTED!`);
    console.log(`   cancelAtPeriodEnd is TRUE but effectiveSubscriptionEnd is NULL`);
    console.log(`   currentPeriodEnd value: ${currentPeriodEnd} (type: ${typeof currentPeriodEnd})`);
    return;
  }

  // STEP 4: Get plan from DB
  console.log("\n4️⃣ Getting plan from database...");
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { code: planCode },
  });

  if (!plan) {
    console.log(`   ❌ Plan NOT found for code: ${planCode}`);
  } else {
    console.log(`   ✓ Plan found: ${plan.name} (${plan.id})`);
  }

  // STEP 5: Update database
  console.log("\n5️⃣ Updating database...");

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    console.log(`   ❌ Organization not found`);
    return;
  }

  const dataToUpdate = {
    subscription_plan_id: plan?.id || organization.subscription_plan_id,
    subscription_status: subscription.status as any,
    subscription_ends_at: effectiveSubscriptionEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  };

  console.log(`   Data to update:`, JSON.stringify(dataToUpdate, null, 2));

  const result = await prisma.organization.update({
    where: { id: organizationId },
    data: dataToUpdate,
  });

  console.log(`\n   ✓ Database updated!`);
  console.log(`   subscription_plan_id: ${result.subscription_plan_id}`);
  console.log(`   subscription_ends_at: ${result.subscription_ends_at}`);
  console.log(`   cancel_at_period_end: ${result.cancel_at_period_end}`);

  // STEP 6: Verify
  console.log("\n6️⃣ Verification...");

  if (result.subscription_ends_at && result.cancel_at_period_end) {
    console.log(`\n   ✅ SUCCESS! subscription_ends_at is set: ${result.subscription_ends_at.toISOString()}`);
  } else if (result.cancel_at_period_end && !result.subscription_ends_at) {
    console.log(`\n   ❌ FAIL! cancel_at_period_end is TRUE but subscription_ends_at is NULL`);
  } else {
    console.log(`\n   ⚠️  Unexpected state`);
  }

  console.log("\n" + "=".repeat(60));

  await prisma.$disconnect();
}

testFlow().catch(console.error);
