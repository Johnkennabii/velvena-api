#!/bin/bash

# Delete old Calendly webhook with incorrect URL
# This script removes the webhook pointing to the frontend URL

set -e

echo "🗑️  Deleting old Calendly webhook..."
echo ""

# Get integration details from database
INTEGRATION_DATA=$(docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -t -c "SELECT id, access_token FROM \"CalendlyIntegration\" WHERE is_active = true;" 2>/dev/null)

if [[ -z "$INTEGRATION_DATA" ]]; then
    echo "❌ No active Calendly integration found in database"
    exit 1
fi

# Parse the data (format: id | access_token)
INTEGRATION_ID=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $1}' | tr -d ' \r\n')
ENCRYPTED_TOKEN=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $2}' | tr -d ' \r\n')

echo "✅ Found integration: $INTEGRATION_ID"
echo ""

# Decrypt the access token using Node.js in the container (using AES-256-GCM with PBKDF2)
echo "🔑 Decrypting access token..."

ACCESS_TOKEN=$(docker exec velvena-api node -e "
const crypto = require('crypto');
const encryptedToken = '$ENCRYPTED_TOKEN';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

try {
  // Format: iv:authTag:salt:encrypted
  const parts = encryptedToken.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const salt = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];

  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');

  // Decrypt
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
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

# Get organization URI from Calendly API
echo "📍 Fetching organization URI from Calendly..."
USER_RESPONSE=$(curl -s -X GET \
  "https://api.calendly.com/users/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

if echo "$USER_RESPONSE" | grep -q "error"; then
    echo "❌ Failed to fetch user info from Calendly:"
    echo "$USER_RESPONSE" | jq '.' 2>/dev/null || echo "$USER_RESPONSE"
    exit 1
fi

ORG_URI=$(echo "$USER_RESPONSE" | jq -r '.resource.current_organization')

if [[ -z "$ORG_URI" ]] || [[ "$ORG_URI" == "null" ]]; then
    echo "❌ Organization URI not found in user response"
    exit 1
fi

echo "✅ Organization URI: $ORG_URI"
echo ""

# Encode organization URI for URL
ENCODED_ORG_URI=$(echo "$ORG_URI" | sed 's/:/%3A/g' | sed 's/\//%2F/g')

# List webhooks
echo "📋 Listing webhooks from Calendly..."
WEBHOOKS_RESPONSE=$(curl -s -X GET \
  "https://api.calendly.com/webhook_subscriptions?organization=${ENCODED_ORG_URI}&scope=organization" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

if echo "$WEBHOOKS_RESPONSE" | grep -q "error"; then
    echo "❌ Failed to fetch webhooks from Calendly:"
    echo "$WEBHOOKS_RESPONSE" | jq '.' 2>/dev/null || echo "$WEBHOOKS_RESPONSE"
    exit 1
fi

# Count webhooks
WEBHOOK_COUNT=$(echo "$WEBHOOKS_RESPONSE" | jq '.collection | length' 2>/dev/null || echo "0")

if [[ "$WEBHOOK_COUNT" == "0" ]]; then
    echo "ℹ️  No webhooks found in Calendly"
    exit 0
fi

echo "✅ Found $WEBHOOK_COUNT webhook(s)"
echo ""

# Find and delete the old webhook with incorrect URL
OLD_WEBHOOK_URL="https://app.velvena.fr/api/calendly/webhook"
OLD_WEBHOOK=$(echo "$WEBHOOKS_RESPONSE" | jq -r ".collection[] | select(.callback_url == \"$OLD_WEBHOOK_URL\")")

if [[ -z "$OLD_WEBHOOK" ]]; then
    echo "ℹ️  No old webhook found with URL: $OLD_WEBHOOK_URL"
    echo ""
    echo "Existing webhooks:"
    echo "$WEBHOOKS_RESPONSE" | jq -r '.collection[] | "  - \(.callback_url) (\(.state))"'
    echo ""
    echo "No deletion needed."
    exit 0
fi

OLD_WEBHOOK_URI=$(echo "$OLD_WEBHOOK" | jq -r '.uri')
OLD_WEBHOOK_STATE=$(echo "$OLD_WEBHOOK" | jq -r '.state')

echo "🎯 Found old webhook to delete:"
echo "   URI: $OLD_WEBHOOK_URI"
echo "   URL: $OLD_WEBHOOK_URL"
echo "   State: $OLD_WEBHOOK_STATE"
echo ""

echo "🗑️  Deleting old webhook..."

DELETE_RESPONSE=$(curl -s -X DELETE \
  "$OLD_WEBHOOK_URI" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | sed '/HTTP_STATUS/d')

if [[ "$HTTP_STATUS" == "204" ]] || [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ Old webhook deleted successfully!"
    echo ""
    echo "🎉 You can now reconnect Calendly from the frontend."
    echo ""
    echo "Next steps:"
    echo "1. Go to https://app.velvena.fr"
    echo "2. Settings > Integrations"
    echo "3. Disconnect Calendly (if still connected)"
    echo "4. Reconnect Calendly"
    echo ""
    echo "The new webhook will be created with the correct URL:"
    echo "  ✅ https://api.velvena.fr/calendly/webhook"
    echo ""
else
    echo "⚠️  Unexpected response status: $HTTP_STATUS"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi
