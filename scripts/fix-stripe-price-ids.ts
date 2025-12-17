import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import prisma from "../src/lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function fixStripePriceIds() {
  try {
    console.log("🔍 Checking subscription plans with Stripe IDs...\n");

    // Récupérer tous les plans avec des Stripe IDs
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        OR: [
          { stripe_product_id: { not: null } },
          { stripe_price_id_monthly: { not: null } },
          { stripe_price_id_yearly: { not: null } },
        ],
      },
    });

    console.log(`Found ${plans.length} plan(s) with Stripe IDs\n`);

    for (const plan of plans) {
      console.log(`\n📋 Plan: ${plan.name}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Stripe Product ID: ${plan.stripe_product_id || "N/A"}`);
      console.log(`   Stripe Price ID (Monthly): ${plan.stripe_price_id_monthly || "N/A"}`);
      console.log(`   Stripe Price ID (Yearly): ${plan.stripe_price_id_yearly || "N/A"}`);
    }

    console.log("\n⚠️  Invalid Stripe IDs detected!");
    console.log("These IDs need to be reset and re-synchronized with Stripe.\n");

    // Réinitialiser tous les Stripe IDs invalides
    const result = await prisma.subscriptionPlan.updateMany({
      where: {
        OR: [
          { stripe_product_id: { not: null } },
          { stripe_price_id_monthly: { not: null } },
          { stripe_price_id_yearly: { not: null } },
        ],
      },
      data: {
        stripe_product_id: null,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
      },
    });

    console.log(`✅ Reset ${result.count} plan(s)`);
    console.log("\n📝 Next steps:");
    console.log("1. Make sure your Stripe API keys are correctly set in .env");
    console.log("2. Call the API endpoint to sync plans with Stripe:");
    console.log("   POST /api/subscription-plans/sync-stripe");
    console.log("   This will create new products and prices in Stripe\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixStripePriceIds();
