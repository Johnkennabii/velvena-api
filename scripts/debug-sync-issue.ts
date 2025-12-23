/**
 * Debug script to test full sync
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function debugSync() {
  const subscriptionId = "sub_1ShCOORJ7PlLrfUPhG2A4d9F";

  console.log("🔍 Debugging sync issue...\n");

  // 1. Fetch from Stripe
  console.log("1️⃣ Fetching from Stripe...");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const organizationId = subscription.metadata.organizationId;
  const planCode = subscription.metadata.planCode;

  console.log(`   Organization ID: ${organizationId}`);
  console.log(`   Plan Code: ${planCode}`);
  console.log(`   Status: ${subscription.status}`);
  console.log(`   cancel_at_period_end: ${(subscription as any).cancel_at_period_end}`);
  console.log(`   current_period_end: ${(subscription as any).current_period_end}`);

  // 2. Check plan in DB
  console.log("\n2️⃣ Looking up plan in database...");
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { code: planCode },
  });

  if (plan) {
    console.log(`   ✓ Plan found: ${plan.name} (ID: ${plan.id})`);
  } else {
    console.log(`   ✗ Plan NOT found for code: ${planCode}`);
  }

  // 3. Calculate values
  console.log("\n3️⃣ Calculating values...");
  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
  const currentPeriodEnd = (subscription as any).current_period_end;

  console.log(`   cancelAtPeriodEnd: ${cancelAtPeriodEnd}`);
  console.log(`   currentPeriodEnd: ${currentPeriodEnd}`);

  const subscriptionEnd =
    subscription.status === "canceled" && subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null;

  const effectiveSubscriptionEnd = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : subscriptionEnd;

  console.log(`   subscriptionEnd: ${subscriptionEnd}`);
  console.log(`   effectiveSubscriptionEnd: ${effectiveSubscriptionEnd}`);

  // 4. What would be saved
  console.log("\n4️⃣ Data that SHOULD be saved:");
  const dataToUpdate = {
    stripe_subscription_id: subscription.id,
    subscription_plan_id: plan?.id || null,
    subscription_status: subscription.status,
    subscription_started_at: new Date(subscription.created * 1000),
    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    subscription_ends_at: effectiveSubscriptionEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  };

  console.log(JSON.stringify(dataToUpdate, null, 2));

  // 5. Current state in DB
  console.log("\n5️⃣ Current state in database:");
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      subscription_plan_id: true,
      subscription_status: true,
      subscription_ends_at: true,
      cancel_at_period_end: true,
      stripe_subscription_id: true,
    },
  });

  console.log(JSON.stringify(org, null, 2));

  // 6. Update NOW
  console.log("\n6️⃣ Updating database NOW...");
  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: dataToUpdate,
  });

  console.log(`   ✓ Updated!`);
  console.log(`   subscription_plan_id: ${updated.subscription_plan_id}`);
  console.log(`   subscription_ends_at: ${updated.subscription_ends_at}`);
  console.log(`   cancel_at_period_end: ${updated.cancel_at_period_end}`);

  await prisma.$disconnect();
}

debugSync().catch(console.error);
