#!/bin/bash

# Script to recover Calendly webhook URI and update database
# This handles the case where webhooks exist in Calendly but not in our DB

set -e

echo "🔍 Recovering Calendly webhook..."
echo ""

# Get integration details from database
INTEGRATION_DATA=$(docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -t -c "SELECT id, access_token, organization_uri FROM \"CalendlyIntegration\" WHERE is_active = true;" 2>/dev/null)

if [[ -z "$INTEGRATION_DATA" ]]; then
    echo "❌ No active Calendly integration found in database"
    exit 1
fi

# Parse the data (format: id | access_token | organization_uri)
INTEGRATION_ID=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $1}' | tr -d ' \r\n')
ENCRYPTED_TOKEN=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $2}' | tr -d ' \r\n')
ORG_URI=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $3}' | tr -d ' \r\n')

echo "✅ Found integration: $INTEGRATION_ID"
echo "📍 Organization: $ORG_URI"
echo ""

# Get ENCRYPTION_KEY from container environment
ENCRYPTION_KEY=$(docker exec velvena-api printenv ENCRYPTION_KEY)

if [[ -z "$ENCRYPTION_KEY" ]]; then
    echo "❌ ENCRYPTION_KEY not found in container environment"
    exit 1
fi

echo "🔑 Decrypting access token..."

# Decrypt the access token using Node.js in the container
ACCESS_TOKEN=$(docker exec velvena-api node -e "
const crypto = require('crypto');
const encryptedToken = '$ENCRYPTED_TOKEN';
const key = process.env.ENCRYPTION_KEY;

try {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  console.log(decrypted);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
")

if [[ $? -ne 0 ]] || [[ -z "$ACCESS_TOKEN" ]]; then
    echo "❌ Failed to decrypt access token"
    exit 1
fi

echo "✅ Token decrypted successfully"
echo ""

# Get API_URL from container
API_URL=$(docker exec velvena-api printenv API_URL)
EXPECTED_WEBHOOK_URL="${API_URL}/calendly/webhook"

echo "📥 Fetching webhooks from Calendly API..."
echo "   Expected webhook URL: $EXPECTED_WEBHOOK_URL"
echo ""

# Encode organization URI for URL
ENCODED_ORG_URI=$(echo "$ORG_URI" | sed 's/:/%3A/g' | sed 's/\//%2F/g')

# Call Calendly API to list webhooks
WEBHOOKS_RESPONSE=$(curl -s -X GET \
  "https://api.calendly.com/webhook_subscriptions?organization=${ENCODED_ORG_URI}&scope=organization" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

# Check if request was successful
if echo "$WEBHOOKS_RESPONSE" | grep -q "error"; then
    echo "❌ Failed to fetch webhooks from Calendly:"
    echo "$WEBHOOKS_RESPONSE" | jq '.' 2>/dev/null || echo "$WEBHOOKS_RESPONSE"
    exit 1
fi

# Count webhooks
WEBHOOK_COUNT=$(echo "$WEBHOOKS_RESPONSE" | jq '.collection | length' 2>/dev/null || echo "0")

if [[ "$WEBHOOK_COUNT" == "0" ]]; then
    echo "⚠️  No webhooks found in Calendly"
    echo ""
    echo "This means the webhook was never created or was deleted."
    echo "Try disconnecting and reconnecting Calendly from the frontend."
    exit 0
fi

echo "✅ Found $WEBHOOK_COUNT webhook(s)"
echo ""

# Find the webhook matching our URL
MATCHING_WEBHOOK=$(echo "$WEBHOOKS_RESPONSE" | jq -r ".collection[] | select(.callback_url == \"$EXPECTED_WEBHOOK_URL\")")

if [[ -z "$MATCHING_WEBHOOK" ]]; then
    echo "⚠️  No webhook found matching our URL: $EXPECTED_WEBHOOK_URL"
    echo ""
    echo "Existing webhooks:"
    echo "$WEBHOOKS_RESPONSE" | jq -r '.collection[] | "  - \(.callback_url) (\(.state))"'
    echo ""
    echo "Try disconnecting and reconnecting Calendly from the frontend."
    exit 0
fi

WEBHOOK_URI=$(echo "$MATCHING_WEBHOOK" | jq -r '.uri')
WEBHOOK_STATE=$(echo "$MATCHING_WEBHOOK" | jq -r '.state')

echo "🎯 Found matching webhook!"
echo "   URI: $WEBHOOK_URI"
echo "   URL: $EXPECTED_WEBHOOK_URL"
echo "   State: $WEBHOOK_STATE"
echo ""

if [[ "$WEBHOOK_STATE" != "active" ]]; then
    echo "⚠️  Warning: Webhook state is '$WEBHOOK_STATE' (not 'active')"
fi

echo "🔄 Updating database..."

# Update database with webhook URI
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c \
  "UPDATE \"CalendlyIntegration\"
   SET webhook_active = true,
       webhook_subscription_uri = '$WEBHOOK_URI'
   WHERE id = '$INTEGRATION_ID';" > /dev/null 2>&1

echo "✅ Database updated successfully!"
echo ""

# Verify the update
echo "📋 Verifying database update..."
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c \
  "SELECT webhook_active, webhook_subscription_uri FROM \"CalendlyIntegration\" WHERE id = '$INTEGRATION_ID';"

echo ""
echo "🎉 Webhook recovery complete!"
echo ""
echo "Next steps:"
echo "1. Create a new Calendly appointment to test"
echo "2. Monitor logs: docker logs -f velvena-api | grep -E 'webhook|📥|✅'"
echo ""
echo "You should see:"
echo "  ✅ Calendly webhook signature verified"
echo "  📥 Received Calendly webhook - FULL DETAILS"
echo "  ✅ Successfully processed invitee.created webhook"
echo ""
