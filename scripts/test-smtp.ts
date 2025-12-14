/**
 * Test SMTP Connection and Email Sending
 * Run with: npx tsx scripts/test-smtp.ts
 */

import nodemailer from "nodemailer";

async function testSMTP() {
  console.log("🔍 Testing SMTP configuration...\n");

  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const secureFromEnv = process.env.SMTP_SECURE;
  const isSecure = secureFromEnv ? secureFromEnv !== "false" : smtpPort === 465;

  const config = {
    host: process.env.SMTP_HOST || "mail.gandi.net",
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER || "contact@velvena.fr",
      pass: process.env.SMTP_PASS || "jytmud-rosQep-2fowku",
    },
  };

  console.log("📋 Configuration:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure (SSL): ${config.secure}`);
  console.log(`   User: ${config.auth.user}`);
  console.log(`   Password: ${config.auth.pass ? "***" + config.auth.pass.slice(-4) : "NOT SET"}\n`);

  if (!config.auth.pass) {
    console.error("❌ SMTP_PASS is not set in .env file!");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport(config);

  try {
    console.log("⏳ Testing connection to SMTP server...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!\n");
  } catch (error: any) {
    console.error("❌ SMTP connection failed:");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}\n`);

    if (error.code === "EAUTH") {
      console.log("💡 Authentication failed. Check:");
      console.log("   1. Email address is correct");
      console.log("   2. Password is correct");
      console.log("   3. Account exists on Gandi.net");
      console.log("   4. No typos in credentials\n");
    } else if (error.code === "ECONNREFUSED") {
      console.log("💡 Connection refused. Check:");
      console.log("   1. SMTP_HOST is correct (mail.gandi.net)");
      console.log("   2. SMTP_PORT is correct (465 for SSL)");
      console.log("   3. Firewall is not blocking port 465\n");
    }

    process.exit(1);
  }

  // Test sending email
  const testEmail = process.env.TEST_EMAIL || config.auth.user;

  console.log(`📧 Sending test email to ${testEmail}...`);

  try {
    const info = await transporter.sendMail({
      from: `"Velvena Test" <${config.auth.user}>`,
      to: testEmail,
      subject: "✅ Test SMTP - Velvena",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">🎉 SMTP Configuration Successful!</h2>
          <p>This is a test email to confirm your SMTP settings are working correctly.</p>
          <p><strong>Server:</strong> ${config.host}</p>
          <p><strong>Port:</strong> ${config.port}</p>
          <p><strong>From:</strong> ${config.auth.user}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, your SMTP configuration is working properly.
          </p>
        </div>
      `,
      text: `SMTP Configuration Test - Successful!\n\nServer: ${config.host}\nPort: ${config.port}\nFrom: ${config.auth.user}\nDate: ${new Date().toLocaleString()}`,
    });

    console.log("✅ Test email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);
    console.log(`📬 Check your inbox at: ${testEmail}`);
    console.log("   (Don't forget to check spam folder)\n");
  } catch (error: any) {
    console.error("❌ Failed to send test email:");
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }

  console.log("✅ All tests passed!");
}

testSMTP().catch(console.error);
