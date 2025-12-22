/**
 * Test script to verify cancellation fix
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function testCancellation() {
  const subscriptionId = "sub_1ShCOORJ7PlLrfUPhG2A4d9F";

  console.log("🧪 Testing cancellation fix...\n");

  // 1. Fetch from Stripe
  console.log("1️⃣ Fetching subscription from Stripe...");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
  const currentPeriodEnd = (subscription as any).current_period_end;

  console.log(`   cancel_at_period_end: ${cancelAtPeriodEnd}`);
  console.log(`   current_period_end: ${currentPeriodEnd}`);

  // 2. Calculate effectiveSubscriptionEnd
  console.log("\n2️⃣ Calculating effectiveSubscriptionEnd...");

  const subscriptionEnd =
    subscription.status === "canceled" && subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null;

  const effectiveSubscriptionEnd = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : subscriptionEnd;

  console.log(`   subscriptionEnd: ${subscriptionEnd}`);
  console.log(`   effectiveSubscriptionEnd: ${effectiveSubscriptionEnd}`);
  console.log(`   effectiveSubscriptionEnd ISO: ${effectiveSubscriptionEnd?.toISOString()}`);

  // 3. Check in database
  console.log("\n3️⃣ Checking database...");
  const organizationId = subscription.metadata.organizationId;
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      subscription_ends_at: true,
      cancel_at_period_end: true,
    },
  });

  console.log(`   DB subscription_ends_at: ${org?.subscription_ends_at}`);
  console.log(`   DB cancel_at_period_end: ${org?.cancel_at_period_end}`);

  // 4. Result
  console.log("\n✅ Result:");
  if (cancelAtPeriodEnd && effectiveSubscriptionEnd && org?.subscription_ends_at) {
    console.log(`   ✓ FIX WORKS! Subscription will end at: ${effectiveSubscriptionEnd.toISOString()}`);
  } else if (cancelAtPeriodEnd && !effectiveSubscriptionEnd) {
    console.log(`   ✗ BUG: cancelAtPeriodEnd=true but effectiveSubscriptionEnd is NULL`);
    console.log(`   ✗ currentPeriodEnd was: ${currentPeriodEnd}`);
  } else if (!cancelAtPeriodEnd) {
    console.log(`   ℹ️  Subscription is not set to cancel at period end`);
  } else {
    console.log(`   ✗ Unknown state`);
  }

  await prisma.$disconnect();
}

testCancellation().catch(console.error);
