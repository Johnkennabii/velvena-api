/**
 * Test Trial Expiration Email System
 *
 * This script allows you to manually test the trial expiration email system
 * by sending test emails without waiting for the cron job.
 *
 * Usage:
 * npx tsx scripts/test-trial-expiration.ts
 */

import { sendTrialExpiringEmail } from "../src/services/emailService.js";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
});

async function testTrialExpirationEmails() {
  logger.info("🧪 Starting trial expiration email test...");

  // Test data - Replace with your own email for testing
  const testEmail = process.env.TEST_EMAIL || "test@example.com";
  const organizationName = "Test Organization";
  const userName = "Test User";
  const upgradeUrl = `${process.env.APP_URL || "https://app.velvena.fr"}/settings/billing`;

  try {
    // Test 1: 7-day warning
    logger.info("📧 Test 1: Sending 7-day warning email...");
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sendTrialExpiringEmail(testEmail, {
      organizationName,
      userName,
      daysRemaining: 7,
      trialEndsAt: sevenDaysFromNow,
      upgradeUrl,
    });

    logger.info("✅ 7-day warning email sent successfully");

    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: 3-day warning
    logger.info("📧 Test 2: Sending 3-day warning email...");
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await sendTrialExpiringEmail(testEmail, {
      organizationName,
      userName,
      daysRemaining: 3,
      trialEndsAt: threeDaysFromNow,
      upgradeUrl,
    });

    logger.info("✅ 3-day warning email sent successfully");

    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: 1-day warning
    logger.info("📧 Test 3: Sending 1-day warning email...");
    const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

    await sendTrialExpiringEmail(testEmail, {
      organizationName,
      userName,
      daysRemaining: 1,
      trialEndsAt: oneDayFromNow,
      upgradeUrl,
    });

    logger.info("✅ 1-day warning email sent successfully");

    logger.info({
      testEmail,
      emailsSent: 3,
    }, "✅ All test emails sent successfully!");

    logger.info(`
📬 Check your inbox at ${testEmail} for 3 test emails:
   1. 7-day warning (blue theme)
   2. 3-day warning (amber theme)
   3. 1-day warning (red theme)
    `);

    process.exit(0);
  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack,
    }, "❌ Failed to send test emails");

    process.exit(1);
  }
}

// Run the test
testTrialExpirationEmails();
