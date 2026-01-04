#!/bin/bash

# List ALL Calendly webhooks (not just matching ones)

set -e

echo "📋 Listing ALL Calendly webhooks..."
echo ""

# Get integration details from database
INTEGRATION_DATA=$(docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -t -c "SELECT id, access_token FROM \"CalendlyIntegration\" WHERE is_active = true;" 2>/dev/null)

if [[ -z "$INTEGRATION_DATA" ]]; then
    echo "❌ No active Calendly integration found in database"
    exit 1
fi

# Parse the data
INTEGRATION_ID=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $1}' | tr -d ' \r\n')
ENCRYPTED_TOKEN=$(echo "$INTEGRATION_DATA" | awk -F'|' '{print $2}' | tr -d ' \r\n')

echo "✅ Found integration: $INTEGRATION_ID"
echo ""

# Decrypt token
echo "🔑 Decrypting access token..."

ACCESS_TOKEN=$(docker exec velvena-api node -e "
const crypto = require('crypto');
const encryptedToken = '$ENCRYPTED_TOKEN';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const parts = encryptedToken.split(':');
const iv = Buffer.from(parts[0], 'hex');
const authTag = Buffer.from(parts[1], 'hex');
const salt = Buffer.from(parts[2], 'hex');
const encrypted = parts[3];
const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');
const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
")

echo "✅ Token ready"
echo ""

# List ALL webhooks
echo "📥 Fetching ALL webhooks from Calendly..."

ORG_URI="https://api.calendly.com/organizations/807f45d2-8a86-4958-b770-c036ec019d90"

RESPONSE=$(curl -s "https://api.calendly.com/webhook_subscriptions?organization=${ORG_URI}&scope=organization" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

# Count webhooks
COUNT=$(echo "$RESPONSE" | jq '.collection | length' 2>/dev/null || echo "0")

echo "✅ Found $COUNT webhook(s)"
echo ""

# Display each webhook
echo "$RESPONSE" | jq -r '.collection[] |
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
  "URI:    \(.uri)\n" +
  "URL:    \(.callback_url)\n" +
  "State:  \(.state)\n" +
  "Events: \(.events | join(", "))\n"'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Complete!"
