import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function fix() {
  const subscriptionId = "sub_1ShE70RJ7PlLrfUP4I7cDnl0";  // ✅ Le VRAI subscription ID local

  console.log("🔧 Fixing real subscription...\n");

  // 1. Fetch from Stripe
  console.log("1️⃣ Fetching from Stripe...");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  console.log(`   Status: ${subscription.status}`);
  console.log(`   cancel_at_period_end: ${(subscription as any).cancel_at_period_end}`);
  console.log(`   current_period_end: ${(subscription as any).current_period_end}`);
  console.log(`   ended_at: ${subscription.ended_at}`);

  const organizationId = subscription.metadata.organizationId;
  const planCode = subscription.metadata.planCode;

  //2. Calculate
  console.log("\n2️⃣ Calculating...");

  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
  const currentPeriodEnd = (subscription as any).current_period_end;

  const subscriptionEnd =
    subscription.status === "canceled" && subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null;

  const effectiveSubscriptionEnd = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : subscriptionEnd;

  console.log(`   cancelAtPeriodEnd: ${cancelAtPeriodEnd}`);
  console.log(`   currentPeriodEnd: ${currentPeriodEnd}`);
  console.log(`   subscriptionEnd: ${subscriptionEnd}`);
  console.log(`   effectiveSubscriptionEnd: ${effectiveSubscriptionEnd}`);

  // 3. Get plan
  console.log("\n3️⃣ Getting plan...");
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { code: planCode },
  });

  console.log(`   Plan: ${plan?.name} (${plan?.id})`);

  // 4. Update
  console.log("\n4️⃣ Updating database...");

  const result = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscription_plan_id: plan?.id,
      subscription_ends_at: effectiveSubscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    },
  });

  console.log(`\n✅ DONE!`);
  console.log(`   subscription_plan_id: ${result.subscription_plan_id}`);
  console.log(`   subscription_ends_at: ${result.subscription_ends_at}`);
  console.log(`   cancel_at_period_end: ${result.cancel_at_period_end}`);

  await prisma.$disconnect();
}

fix().catch(console.error);
