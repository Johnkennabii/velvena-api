/**
 * Check both subscription_plan and subscription_plan_id fields
 */

import prisma from "../src/lib/prisma.js";

async function main() {
  try {
    const org = await prisma.organization.findFirst({
      where: {
        stripe_subscription_id: { not: null },
      },
      include: {
        subscription: true,
      },
    });

    if (!org) {
      console.log("❌ No organization with Stripe subscription found");
      return;
    }

    console.log("\n📋 Organization:", org.name);
    console.log("=".repeat(80));

    console.log("\n🆔 Subscription Plan ID (UUID, nouveau):");
    console.log("  subscription_plan_id:", org.subscription_plan_id);
    console.log("  Plan référencé:", org.subscription?.code);

    console.log("\n📝 Subscription Plan (string, déprécié):");
    console.log("  subscription_plan:", org.subscription_plan);

    if (org.subscription_plan_id && org.subscription?.code !== org.subscription_plan) {
      console.log("\n⚠️  BUG DÉTECTÉ:");
      console.log(`  - subscription_plan_id pointe vers le plan: ${org.subscription?.code}`);
      console.log(`  - subscription_plan (déprécié) dit: ${org.subscription_plan}`);
      console.log("  Ces deux champs devraient avoir la même valeur !");
    } else if (org.subscription_plan_id && org.subscription?.code === org.subscription_plan) {
      console.log("\n✅ Les deux champs sont synchronisés");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
