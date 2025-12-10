/**
 * Test Stripe Webhook Endpoint
 *
 * This script tests if the webhook endpoint is properly configured
 * and can receive events.
 */

import "./load-env.js";

async function testWebhookEndpoint() {
  const baseUrl = process.env.API_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/webhooks/stripe/health`;

  console.log("\n🔍 Testing Stripe Webhook Endpoint...\n");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Webhook URL: ${webhookUrl}\n`);

  try {
    const response = await fetch(webhookUrl);
    const data = await response.json();

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Data:", JSON.stringify(data, null, 2));

    if (data.status === "configured" && data.webhookSecretConfigured) {
      console.log("\n✅ Webhook endpoint is properly configured!");
      console.log(`✅ STRIPE_WEBHOOK_SECRET is set`);
      return true;
    } else {
      console.log("\n❌ Webhook endpoint is NOT configured");
      console.log("❌ STRIPE_WEBHOOK_SECRET is missing or invalid");
      console.log("\n💡 To fix this:");
      console.log("   1. Run: stripe listen --forward-to localhost:3000/webhooks/stripe");
      console.log("   2. Copy the webhook secret (whsec_xxxxx) from the output");
      console.log("   3. Update STRIPE_WEBHOOK_SECRET in your .env file");
      console.log("   4. Restart your server");
      return false;
    }
  } catch (err: any) {
    console.error("\n❌ Failed to connect to webhook endpoint");
    console.error("Error:", err.message);
    console.log("\n💡 Make sure your server is running:");
    console.log("   npm run dev");
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log("\n🔐 Checking Environment Variables...\n");

  const requiredVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  let allSet = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      const maskedValue = value.substring(0, 20) + "...";
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allSet = false;
    }
  }

  return allSet;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     Stripe Webhook Configuration Test                 ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  const envOk = await testEnvironmentVariables();

  if (!envOk) {
    console.log("\n⚠️  Some environment variables are missing!");
    console.log("Please check your .env file and restart the test.\n");
    process.exit(1);
  }

  console.log("\n" + "─".repeat(60));

  const webhookOk = await testWebhookEndpoint();

  console.log("\n" + "═".repeat(60));

  if (envOk && webhookOk) {
    console.log("\n🎉 All checks passed! Your Stripe integration is ready.");
    console.log("\n📝 Next steps:");
    console.log("   1. Make sure Stripe CLI is running:");
    console.log("      stripe listen --forward-to localhost:3000/webhooks/stripe");
    console.log("   2. Test a payment in your application");
    console.log("   3. Watch the Stripe CLI output for webhook events");
    console.log("   4. Check your database to confirm the subscription was updated\n");
  } else {
    console.log("\n⚠️  Some checks failed. Please fix the issues above and retry.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n💥 Unexpected error:", err);
  process.exit(1);
});
