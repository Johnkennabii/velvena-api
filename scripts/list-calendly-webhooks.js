#!/usr/bin/env node

/**
 * Script to list existing Calendly webhooks and update the database
 * This helps recover from situations where webhooks exist in Calendly but not in our DB
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAndUpdateWebhooks() {
  try {
    // Get the active integration
    const integration = await prisma.calendlyIntegration.findFirst({
      where: { is_active: true },
    });

    if (!integration) {
      console.error('❌ No active Calendly integration found');
      process.exit(1);
    }

    console.log('✅ Found integration:', integration.id);
    console.log('📧 Email:', integration.calendly_email);
    console.log('');

    // Decrypt access token
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

    if (!ENCRYPTION_KEY) {
      console.error('❌ ENCRYPTION_KEY not found in environment');
      process.exit(1);
    }

    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let accessToken = decipher.update(integration.access_token, 'hex', 'utf8');
    accessToken += decipher.final('utf8');

    console.log('🔑 Access token decrypted');
    console.log('');

    // List webhooks from Calendly API
    console.log('📥 Fetching webhooks from Calendly...');
    const response = await fetch(
      `https://api.calendly.com/webhook_subscriptions?organization=${encodeURIComponent(integration.organization_uri)}&scope=organization`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to fetch webhooks:', error);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Webhooks fetched successfully');
    console.log('');

    if (!data.collection || data.collection.length === 0) {
      console.log('⚠️  No webhooks found in Calendly');
      process.exit(0);
    }

    console.log(`📋 Found ${data.collection.length} webhook(s):`);
    console.log('');

    for (const webhook of data.collection) {
      console.log('Webhook:');
      console.log('  URI:', webhook.uri);
      console.log('  URL:', webhook.callback_url);
      console.log('  State:', webhook.state);
      console.log('  Events:', webhook.events);
      console.log('  Created:', webhook.created_at);
      console.log('');

      // Check if this webhook URL matches our API URL
      const expectedUrl = `${process.env.API_URL}/calendly/webhook`;
      if (webhook.callback_url === expectedUrl && webhook.state === 'active') {
        console.log('✅ This webhook matches our expected URL!');
        console.log('🔄 Updating database...');

        await prisma.calendlyIntegration.update({
          where: { id: integration.id },
          data: {
            webhook_active: true,
            webhook_subscription_uri: webhook.uri,
          },
        });

        console.log('✅ Database updated successfully!');
        console.log('');
        console.log('🎉 Webhook is now active in the database');
        console.log('');
        console.log('Next steps:');
        console.log('1. Verify with: docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c "SELECT webhook_active, webhook_subscription_uri FROM \\"CalendlyIntegration\\" WHERE is_active = true;"');
        console.log('2. Create a new Calendly appointment to test');
        console.log('3. Monitor logs: docker logs -f velvena-api | grep -E "webhook|📥|✅"');
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

listAndUpdateWebhooks();
