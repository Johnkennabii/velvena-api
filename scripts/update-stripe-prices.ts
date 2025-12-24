#!/usr/bin/env tsx
/**
 * Update Stripe Prices
 *
 * Ce script permet de créer de nouveaux prix dans Stripe et de mettre à jour
 * les price IDs dans la base de données.
 *
 * ⚠️  IMPORTANT : Les prix Stripe ne peuvent PAS être modifiés une fois créés.
 * Ce script crée de NOUVEAUX prix et met à jour les références dans la DB.
 *
 * Usage:
 *   tsx scripts/update-stripe-prices.ts <plan_code> <monthly_price> <yearly_price>
 *
 * Exemples:
 *   tsx scripts/update-stripe-prices.ts basic 29.99 299.99
 *   tsx scripts/update-stripe-prices.ts pro 79.99 799.99
 *   tsx scripts/update-stripe-prices.ts enterprise 199.99 1999.99
 *
 * Options:
 *   --archive-old   Archive les anciens prix dans Stripe (les marque comme inactifs)
 */

// Load environment variables FIRST
import "./load-env.js";

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("❌ Usage: tsx scripts/update-stripe-prices.ts <plan_code> <monthly_price> <yearly_price>");
    console.error("\nExemples:");
    console.error("  tsx scripts/update-stripe-prices.ts basic 29.99 299.99");
    console.error("  tsx scripts/update-stripe-prices.ts pro 79.99 799.99");
    console.error("  tsx scripts/update-stripe-prices.ts enterprise 199.99 1999.99");
    console.error("\nOptions:");
    console.error("  --archive-old   Archive les anciens prix dans Stripe");
    process.exit(1);
  }

  const planCode = args[0];
  const monthlyPrice = parseFloat(args[1]);
  const yearlyPrice = parseFloat(args[2]);
  const archiveOld = args.includes("--archive-old");

  if (isNaN(monthlyPrice) || isNaN(yearlyPrice)) {
    console.error("❌ Les prix doivent être des nombres valides");
    process.exit(1);
  }

  // Dynamic imports after env is loaded
  const { default: stripe } = await import("../src/lib/stripe.js");
  const { default: prisma } = await import("../src/lib/prisma.js");
  const { default: logger } = await import("../src/lib/logger.js");

  console.log("🚀 Mise à jour des prix Stripe...\n");
  console.log(`Plan: ${planCode}`);
  console.log(`Prix mensuel: ${monthlyPrice} EUR`);
  console.log(`Prix annuel: ${yearlyPrice} EUR`);
  console.log(`Archiver anciens prix: ${archiveOld ? "Oui" : "Non"}`);
  console.log("═".repeat(80));

  try {
    // 1. Get the plan from database
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      console.error(`❌ Plan '${planCode}' non trouvé dans la base de données`);
      process.exit(1);
    }

    if (!plan.stripe_product_id) {
      console.error(`❌ Le plan '${planCode}' n'a pas de Product ID Stripe`);
      console.error("Exécutez d'abord: npm run sync-plans-to-stripe");
      process.exit(1);
    }

    console.log(`\n✅ Plan trouvé: ${plan.name}`);
    console.log(`   Product ID: ${plan.stripe_product_id}`);

    // Store old price IDs for archiving
    const oldMonthlyPriceId = plan.stripe_price_id_monthly;
    const oldYearlyPriceId = plan.stripe_price_id_yearly;

    // 2. Create new monthly price
    console.log("\n📝 Création du nouveau prix mensuel...");
    const newMonthlyPrice = await stripe.prices.create({
      product: plan.stripe_product_id,
      unit_amount: Math.round(monthlyPrice * 100), // Convert to cents
      currency: "eur",
      recurring: {
        interval: "month",
        trial_period_days: plan.trial_days,
      },
      metadata: {
        planId: plan.id,
        planCode: plan.code,
        billingInterval: "month",
        replacedPriceId: oldMonthlyPriceId || "",
        updatedAt: new Date().toISOString(),
      },
    });

    console.log(`✅ Nouveau prix mensuel créé: ${newMonthlyPrice.id}`);
    console.log(`   Montant: ${monthlyPrice} EUR/mois`);

    // 3. Create new yearly price
    console.log("\n📝 Création du nouveau prix annuel...");
    const newYearlyPrice = await stripe.prices.create({
      product: plan.stripe_product_id,
      unit_amount: Math.round(yearlyPrice * 100), // Convert to cents
      currency: "eur",
      recurring: {
        interval: "year",
        trial_period_days: plan.trial_days,
      },
      metadata: {
        planId: plan.id,
        planCode: plan.code,
        billingInterval: "year",
        replacedPriceId: oldYearlyPriceId || "",
        updatedAt: new Date().toISOString(),
      },
    });

    console.log(`✅ Nouveau prix annuel créé: ${newYearlyPrice.id}`);
    console.log(`   Montant: ${yearlyPrice} EUR/an`);

    // 4. Update database
    console.log("\n💾 Mise à jour de la base de données...");
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        price_monthly: monthlyPrice,
        price_yearly: yearlyPrice,
        stripe_price_id_monthly: newMonthlyPrice.id,
        stripe_price_id_yearly: newYearlyPrice.id,
      },
    });

    console.log("✅ Base de données mise à jour");

    // 5. Archive old prices if requested
    if (archiveOld) {
      console.log("\n🗄️  Archivage des anciens prix...");

      if (oldMonthlyPriceId) {
        await stripe.prices.update(oldMonthlyPriceId, {
          active: false,
        });
        console.log(`✅ Ancien prix mensuel archivé: ${oldMonthlyPriceId}`);
      }

      if (oldYearlyPriceId) {
        await stripe.prices.update(oldYearlyPriceId, {
          active: false,
        });
        console.log(`✅ Ancien prix annuel archivé: ${oldYearlyPriceId}`);
      }
    }

    // 6. Summary
    console.log("\n" + "═".repeat(80));
    console.log("🎉 Mise à jour réussie !\n");
    console.log("📊 Résumé:");
    console.log(`   Plan: ${plan.name} (${planCode})`);
    console.log(`   Nouveau prix mensuel: ${monthlyPrice} EUR → ${newMonthlyPrice.id}`);
    console.log(`   Nouveau prix annuel: ${yearlyPrice} EUR → ${newYearlyPrice.id}`);

    if (archiveOld) {
      console.log("\n🗄️  Anciens prix archivés:");
      if (oldMonthlyPriceId) console.log(`   Mensuel: ${oldMonthlyPriceId}`);
      if (oldYearlyPriceId) console.log(`   Annuel: ${oldYearlyPriceId}`);
    }

    console.log("\n⚠️  IMPORTANT:");
    console.log("   • Les NOUVEAUX abonnements utiliseront les nouveaux prix");
    console.log("   • Les abonnements EXISTANTS gardent leur prix actuel");
    console.log("   • Pour migrer les abonnements existants, utilisez le dashboard Stripe");
    console.log("     ou créez un script de migration personnalisé");
    console.log("");

    logger.info({
      planCode,
      newMonthlyPrice: monthlyPrice,
      newYearlyPrice: yearlyPrice,
      newMonthlyPriceId: newMonthlyPrice.id,
      newYearlyPriceId: newYearlyPrice.id,
    }, "Stripe prices updated");

    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ Erreur lors de la mise à jour des prix:");
    console.error(err.message);
    logger.error({ err, planCode }, "Failed to update Stripe prices");
    process.exit(1);
  }
}

main();
