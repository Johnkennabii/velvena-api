/**
 * Script pour créer un code promo Stripe
 * Usage: tsx scripts/create-promo-code.ts
 */

import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

async function createPromoCode() {
  try {
    console.log("🎟️  Création d'un code promo Stripe...\n");

    // 1. Créer le coupon (la réduction)
    console.log("1️⃣  Création du coupon avec 100% de réduction...");
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once", // "once", "forever", ou "repeating"
      // duration_in_months: 3, // Si duration = "repeating"
      name: "Offre 100% - Gratuit",
      currency: "eur", // Important pour les coupons en pourcentage
    });

    console.log(`✅ Coupon créé : ${coupon.id}\n`);

    // 2. Créer le code promo (le code que les utilisateurs vont taper)
    console.log("2️⃣  Création du code promo...");
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: "FREE100", // Le code que les utilisateurs vont utiliser
      max_redemptions: 100, // Limite d'utilisation (optionnel)
      // expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Expire dans 30 jours
    });

    console.log(`✅ Code promo créé : ${promoCode.code}\n`);

    // 3. Afficher le résumé
    console.log("📊 Résumé :");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Code promo : ${promoCode.code}`);
    console.log(`   Réduction : ${coupon.percent_off}%`);
    console.log(`   Durée : ${coupon.duration}`);
    console.log(`   Max utilisations : ${promoCode.max_redemptions || "Illimité"}`);
    console.log(`   Actif : ${promoCode.active ? "Oui ✅" : "Non ❌"}`);
    console.log(`   URL Dashboard : https://dashboard.stripe.com/promotion_codes/${promoCode.id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🎉 Code promo créé avec succès !");
    console.log(`   Les utilisateurs peuvent maintenant utiliser le code : ${promoCode.code}`);

  } catch (error: any) {
    console.error("❌ Erreur lors de la création du code promo :");
    console.error(error.message);

    if (error.code === "resource_already_exists") {
      console.log("\n💡 Ce code promo existe déjà. Essayez un autre code ou supprimez l'ancien.");
    }
  }
}

createPromoCode();
