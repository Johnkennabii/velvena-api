import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Seed script pour initialiser la base de données multi-tenant
 *
 * Ce script crée :
 * 1. Une organisation par défaut
 * 2. Des rôles globaux
 * 3. Des données de référence globales (types, tailles, couleurs)
 * 4. Un super-admin
 */

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Créer l'organisation par défaut
  console.log("📦 Creating default organization...");
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "Default Organization",
      slug: "default",
      email: "contact@example.com",
      subscription_plan: "pro",
      is_active: true,
    },
  });
  console.log(`✅ Organization created: ${defaultOrg.name} (${defaultOrg.id})`);

  // 2. Créer les rôles globaux (system roles)
  console.log("👥 Creating global roles...");
  const roles = [
    { name: "super_admin", description: "Super administrateur avec accès complet" },
    { name: "admin", description: "Administrateur de l'organisation" },
    { name: "manager", description: "Gestionnaire avec accès étendu" },
    { name: "user", description: "Utilisateur standard" },
  ];

  for (const roleData of roles) {
    // Check if role already exists (global role with organization_id = null)
    const existing = await prisma.role.findFirst({
      where: { name: roleData.name, organization_id: null },
    });

    if (!existing) {
      const role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          organization_id: null, // Global role
        },
      });
      console.log(`  ✅ Role: ${role.name}`);
    } else {
      console.log(`  ⏭️  Role already exists: ${existing.name}`);
    }
  }

  // 3. Créer les types de robes globaux
  console.log("👗 Creating global dress types...");
  const dressTypes = [
    { name: "Robe de soirée", description: "Robe longue élégante pour les événements formels" },
    { name: "Robe cocktail", description: "Robe mi-longue pour les soirées cocktail" },
    { name: "Robe de mariée", description: "Robe blanche traditionnelle" },
    { name: "Robe de demoiselle d'honneur", description: "Robe assortie pour cortège" },
    { name: "Robe casual", description: "Robe décontractée pour tous les jours" },
  ];

  for (const typeData of dressTypes) {
    const existing = await prisma.dressType.findFirst({
      where: { name: typeData.name, organization_id: null },
    });

    if (!existing) {
      const type = await prisma.dressType.create({
        data: {
          name: typeData.name,
          description: typeData.description,
          organization_id: null, // Global
        },
      });
      console.log(`  ✅ Type: ${type.name}`);
    } else {
      console.log(`  ⏭️  Type already exists: ${existing.name}`);
    }
  }

  // 4. Créer les tailles globales
  console.log("📏 Creating global dress sizes...");
  const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "34", "36", "38", "40", "42", "44", "46", "48"];

  for (const sizeName of sizes) {
    const existing = await prisma.dressSize.findFirst({
      where: { name: sizeName, organization_id: null },
    });

    if (!existing) {
      const size = await prisma.dressSize.create({
        data: {
          name: sizeName,
          organization_id: null, // Global
        },
      });
      console.log(`  ✅ Size: ${size.name}`);
    } else {
      console.log(`  ⏭️  Size already exists: ${existing.name}`);
    }
  }

  // 5. Créer les couleurs globales
  console.log("🎨 Creating global dress colors...");
  const colors = [
    { name: "Blanc", hex_code: "#FFFFFF" },
    { name: "Noir", hex_code: "#000000" },
    { name: "Rouge", hex_code: "#FF0000" },
    { name: "Bleu", hex_code: "#0000FF" },
    { name: "Vert", hex_code: "#00FF00" },
    { name: "Rose", hex_code: "#FFC0CB" },
    { name: "Violet", hex_code: "#8B00FF" },
    { name: "Jaune", hex_code: "#FFFF00" },
    { name: "Orange", hex_code: "#FFA500" },
    { name: "Beige", hex_code: "#F5F5DC" },
    { name: "Gris", hex_code: "#808080" },
    { name: "Argenté", hex_code: "#C0C0C0" },
    { name: "Doré", hex_code: "#FFD700" },
  ];

  for (const colorData of colors) {
    const existing = await prisma.dressColor.findFirst({
      where: { name: colorData.name, organization_id: null },
    });

    if (!existing) {
      const color = await prisma.dressColor.create({
        data: {
          name: colorData.name,
          hex_code: colorData.hex_code,
          organization_id: null, // Global
        },
      });
      console.log(`  ✅ Color: ${color.name} (${color.hex_code})`);
    } else {
      console.log(`  ⏭️  Color already exists: ${existing.name}`);
    }
  }

  // 6. Créer les conditions globales
  console.log("⭐ Creating global dress conditions...");
  const conditions = [
    "Neuve",
    "Excellente",
    "Très bonne",
    "Bonne",
    "Correcte",
    "À réparer",
  ];

  for (const conditionName of conditions) {
    const existing = await prisma.dressCondition.findFirst({
      where: { name: conditionName, organization_id: null },
    });

    if (!existing) {
      const condition = await prisma.dressCondition.create({
        data: {
          name: conditionName,
          organization_id: null, // Global
        },
      });
      console.log(`  ✅ Condition: ${condition.name}`);
    } else {
      console.log(`  ⏭️  Condition already exists: ${existing.name}`);
    }
  }

  // 7. Créer les types de contrats globaux
  console.log("📄 Creating global contract types...");
  const contractTypes = [
    "Location standard",
    "Location longue durée",
    "Location avec option d'achat",
    "Vente",
  ];

  for (const typeName of contractTypes) {
    const existing = await prisma.contractType.findFirst({
      where: { name: typeName, organization_id: null },
    });

    if (!existing) {
      const type = await prisma.contractType.create({
        data: {
          name: typeName,
          organization_id: null, // Global
        },
      });
      console.log(`  ✅ Contract Type: ${type.name}`);
    } else {
      console.log(`  ⏭️  Contract Type already exists: ${existing.name}`);
    }
  }

  // 8. Créer un super-admin
  console.log("🔐 Creating super admin user...");
  const superAdminRole = await prisma.role.findFirst({
    where: { name: "super_admin", organization_id: null },
  });

  if (!superAdminRole) {
    throw new Error("Super admin role not found");
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@velvena.com" },
    update: {},
    create: {
      email: "admin@velvena.com",
      password: hashedPassword,
      organization_id: defaultOrg.id,
      profile: {
        create: {
          firstName: "Super",
          lastName: "Admin",
          role_id: superAdminRole.id,
        },
      },
    },
  });

  console.log(`✅ Super admin created: ${superAdmin.email}`);
  console.log(`   Password: admin123 (CHANGE THIS IN PRODUCTION!)`);

  // 9. Créer un utilisateur de test
  console.log("👤 Creating test user...");
  const userRole = await prisma.role.findFirst({
    where: { name: "user", organization_id: null },
  });

  if (userRole) {
    const testUserPassword = await bcrypt.hash("user123", 10);
    const testUser = await prisma.user.upsert({
      where: { email: "user@velvena.com" },
      update: {},
      create: {
        email: "user@velvena.com",
        password: testUserPassword,
        organization_id: defaultOrg.id,
        profile: {
          create: {
            firstName: "Test",
            lastName: "User",
            role_id: userRole.id,
          },
        },
      },
    });

    console.log(`✅ Test user created: ${testUser.email}`);
    console.log(`   Password: user123`);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - Organizations: 1`);
  console.log(`   - Roles: ${roles.length} (global)`);
  console.log(`   - Dress Types: ${dressTypes.length} (global)`);
  console.log(`   - Sizes: ${sizes.length} (global)`);
  console.log(`   - Colors: ${colors.length} (global)`);
  console.log(`   - Conditions: ${conditions.length} (global)`);
  console.log(`   - Contract Types: ${contractTypes.length} (global)`);
  console.log(`   - Users: 2 (1 super admin + 1 test user)`);
  console.log("\n🔑 Login credentials:");
  console.log(`   Super Admin: admin@velvena.com / admin123`);
  console.log(`   Test User: user@velvena.com / user123`);
  console.log("\n⚠️  IMPORTANT: Change passwords in production!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
