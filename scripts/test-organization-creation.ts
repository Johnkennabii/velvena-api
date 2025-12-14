/**
 * Test Organization Creation with Welcome Email
 * Run with: npx tsx scripts/test-organization-creation.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "../src/services/welcomeEmailService.js";

const prisma = new PrismaClient();

async function testOrganizationCreation() {
  console.log("🧪 Testing organization creation with welcome email...\n");

  const testOrgName = `Test Org ${Date.now()}`;
  const testUserEmail = process.env.TEST_EMAIL || process.env.SMTP_USER || "contact@velvena.fr";
  const slug = testOrgName.toLowerCase().replace(/\s+/g, "-");

  try {
    console.log("📋 Creating test organization...");
    console.log(`   Name: ${testOrgName}`);
    console.log(`   Email: ${testUserEmail}`);
    console.log(`   Slug: ${slug}\n`);

    // Get FREE plan
    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { code: "free" },
    });

    if (!freePlan) {
      console.error("❌ FREE plan not found in database");
      process.exit(1);
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create organization
      const organization = await tx.organization.create({
        data: {
          name: testOrgName,
          slug,
          email: testUserEmail,
          subscription_plan_id: freePlan.id,
          subscription_plan: "free",
          subscription_status: "trial",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          is_active: true,
          created_at: now,
        },
      });

      // 2. Create MANAGER role
      const managerRole = await tx.role.create({
        data: {
          name: "MANAGER",
          description: "Organization manager with full access",
          organization_id: organization.id,
          created_at: now,
        },
      });

      // 3. Create first user
      const user = await tx.user.create({
        data: {
          email: testUserEmail,
          password: hashedPassword,
          organization_id: organization.id,
          created_at: now,
          profile: {
            create: {
              role_id: managerRole.id,
              firstName: "Test",
              lastName: "User",
              created_at: now,
            },
          },
        },
        include: {
          profile: {
            include: {
              role: true,
            },
          },
        },
      });

      return { organization, user };
    });

    console.log("✅ Organization created successfully!");
    console.log(`   Organization ID: ${result.organization.id}`);
    console.log(`   User ID: ${result.user.id}\n`);

    // Send welcome email
    console.log("📧 Sending welcome email...");
    await sendWelcomeEmail({
      organizationName: result.organization.name,
      firstName: result.user.profile?.firstName ?? undefined,
      lastName: result.user.profile?.lastName ?? undefined,
      userEmail: result.user.email,
      slug: result.organization.slug,
      trialEndsAt: result.organization.trial_ends_at!,
    });

    console.log("✅ Welcome email sent successfully!");
    console.log(`\n📬 Check your inbox at: ${testUserEmail}`);
    console.log("   (Don't forget to check spam folder)\n");

    // Cleanup
    console.log("🧹 Cleaning up test data...");
    await prisma.user.delete({ where: { id: result.user.id } });
    await prisma.role.delete({ where: { id: result.user.profile?.role_id! } });
    await prisma.organization.delete({ where: { id: result.organization.id } });
    console.log("✅ Test data cleaned up\n");

    console.log("✅ All tests passed!");
  } catch (error: any) {
    console.error("❌ Test failed:");
    console.error(`   Error: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testOrganizationCreation().catch(console.error);
