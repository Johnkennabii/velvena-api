/**
 * Test Welcome Email
 * Run with: npx tsx scripts/test-welcome-email.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { sendWelcomeEmail } from "../src/services/welcomeEmailService.js";

async function testWelcomeEmail() {
  console.log("🧪 Testing welcome email...\n");

  const testData = {
    organizationName: "Test Boutique",
    firstName: "Jean",
    lastName: "Dupont",
    userEmail: process.env.TEST_EMAIL || process.env.SMTP_USER || "contact@velvena.fr",
    slug: "test-boutique",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  };

  console.log("📋 Test data:");
  console.log(`   Organization: ${testData.organizationName}`);
  console.log(`   User: ${testData.firstName} ${testData.lastName}`);
  console.log(`   Email: ${testData.userEmail}`);
  console.log(`   Slug: ${testData.slug}`);
  console.log(`   Trial ends: ${testData.trialEndsAt.toLocaleDateString('fr-FR')}\n`);

  try {
    console.log("📧 Sending welcome email...");
    await sendWelcomeEmail(testData);
    console.log("✅ Welcome email sent successfully!");
    console.log(`\n📬 Check your inbox at: ${testData.userEmail}`);
    console.log("   (Don't forget to check spam folder)\n");
  } catch (error: any) {
    console.error("❌ Failed to send welcome email:");
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }

  console.log("✅ Test completed!");
}

testWelcomeEmail().catch(console.error);
