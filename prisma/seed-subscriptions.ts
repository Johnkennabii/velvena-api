import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");

  // Trial/Free Plan
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { code: "free" },
    update: {},
    create: {
      name: "Trial",
      code: "free",
      description: "Plan d'essai pour découvrir Velvena",
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 14,
      limits: {
        users: 1,
        dresses: 5,
        customers: 10,
        prospects: 10,
        contracts_per_month: 5,
        storage_gb: 1,
        api_calls_per_day: 100,
      },
      features: {
        planning: false,
        dashboard: false,
        export_data: false,
        customer_portal: false,
        notification_push: false,
        contract_generation: true,
        prospect_management: false,
        electronic_signature: false,
        inventory_management: true,
        contract_builder: false,
      },
      is_public: true,
      is_popular: false,
      sort_order: 1,
    },
  });
  console.log("✅ Trial plan created/updated:", freePlan.id);

  // Basic Plan
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { code: "basic" },
    update: {},
    create: {
      name: "Basic",
      code: "basic",
      description: "Pour les petites boutiques et créateurs indépendants",
      price_monthly: 19,
      price_yearly: 190, // ~16€/mois (économie de 2 mois)
      trial_days: 14,
      limits: {
        users: 3,
        dresses: 120,
        customers: 1000,
        prospects: 100,
        contracts_per_month: 50,
        storage_gb: 3,
        api_calls_per_day: 1000,
      },
      features: {
        planning: false,
        dashboard: false,
        export_data: false,
        customer_portal: true,
        notification_push: false,
        contract_generation: true,
        prospect_management: false,
        electronic_signature: false,
        inventory_management: true,
        contract_builder: false,
      },
      is_public: true,
      is_popular: false,
      sort_order: 2,
    },
  });
  console.log("✅ Basic plan created/updated:", basicPlan.id);

  // Premium Plan (Most Popular)
  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { code: "pro" },
    update: {},
    create: {
      name: "Premium",
      code: "pro",
      description: "Pour les boutiques professionnelles en croissance",
      price_monthly: 49,
      price_yearly: 490, // ~41€/mois (économie de 2 mois)
      trial_days: 14,
      limits: {
        users: 7,
        dresses: 10000,
        customers: 100000,
        prospects: 10000,
        contracts_per_month: 500,
        storage_gb: 8,
        api_calls_per_day: 10000,
      },
      features: {
        planning: true,
        dashboard: true,
        export_data: false,
        customer_portal: true,
        notification_push: true,
        contract_generation: true,
        prospect_management: false,
        electronic_signature: true,
        inventory_management: true,
        contract_builder: true,
      },
      is_public: true,
      is_popular: true, // Badge "Plus populaire"
      sort_order: 3,
    },
  });
  console.log("✅ Premium plan created/updated:", proPlan.id);

  // Enterprise Plan
  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { code: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      code: "enterprise",
      description: "Pour les grandes organisations avec besoins avancés",
      price_monthly: 149,
      price_yearly: 1490, // ~124€/mois (économie de 2 mois)
      trial_days: 30,
      limits: {
        users: 9999999, // Illimité
        dresses: 9999999, // Illimité
        customers: 9999999, // Illimité
        prospects: 9999999, // Illimité
        contracts_per_month: 9999999, // Illimité
        storage_gb: 15,
        api_calls_per_day: 100000,
      },
      features: {
        planning: true,
        dashboard: true,
        export_data: true,
        customer_portal: true,
        notification_push: true,
        contract_generation: true,
        prospect_management: true,
        electronic_signature: true,
        inventory_management: true,
        contract_builder: true,
      },
      is_public: true,
      is_popular: false,
      sort_order: 4,
    },
  });
  console.log("✅ Enterprise plan created/updated:", enterprisePlan.id);

  console.log("\n🎉 All subscription plans seeded successfully!");
  console.log("\nCreated plans:");
  console.log("- Trial: 0€/mois (1 user, 5 robes, 10 clients)");
  console.log("- Basic: 19€/mois (3 users, 120 robes, 1000 clients)");
  console.log("- Premium: 49€/mois (7 users, 10000 robes, 100000 clients) ⭐ Plus populaire");
  console.log("- Enterprise: 149€/mois (illimité)");
}

seedSubscriptionPlans()
  .catch((e) => {
    console.error("❌ Error seeding subscription plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
