#!/bin/bash

# Verify Calendly Webhook Configuration
# Run this script on the VPS to check if webhooks are properly configured

set -e

echo "🔍 Verifying Calendly webhook configuration..."
echo ""

# Check if backend is running
echo "1️⃣ Checking backend container status..."
if docker ps | grep -q velvena-api; then
    echo "   ✅ Backend container is running"
else
    echo "   ❌ Backend container is NOT running"
    exit 1
fi

echo ""
echo "2️⃣ Checking webhook configuration in database..."
WEBHOOK_STATUS=$(docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -t -c "SELECT webhook_active, webhook_subscription_uri FROM \"CalendlyIntegration\" WHERE is_active = true;" 2>/dev/null || echo "error")

if [[ "$WEBHOOK_STATUS" == "error" ]]; then
    echo "   ❌ Failed to query database"
    exit 1
fi

echo "$WEBHOOK_STATUS" | while IFS='|' read -r active uri; do
    active=$(echo "$active" | tr -d ' ')
    uri=$(echo "$uri" | tr -d ' ')

    if [[ "$active" == "t" ]] && [[ -n "$uri" ]]; then
        echo "   ✅ Webhook is active"
        echo "   ✅ Webhook URI: $uri"
    else
        echo "   ⚠️  Webhook is NOT active or URI is missing"
        echo "   webhook_active: $active"
        echo "   webhook_subscription_uri: $uri"
        echo ""
        echo "   📝 To fix this:"
        echo "      1. Disconnect Calendly from frontend"
        echo "      2. Reconnect Calendly to trigger webhook creation"
    fi
done

echo ""
echo "3️⃣ Checking recent backend logs for webhook activity..."
docker logs --tail=100 velvena-api 2>&1 | grep -i "webhook" || echo "   ℹ️  No webhook logs found in recent activity"

echo ""
echo "4️⃣ Checking environment variables..."
if docker exec velvena-api printenv | grep -q "CALENDLY_WEBHOOK_SIGNING_KEY"; then
    echo "   ✅ CALENDLY_WEBHOOK_SIGNING_KEY is set"
else
    echo "   ❌ CALENDLY_WEBHOOK_SIGNING_KEY is NOT set"
fi

echo ""
echo "5️⃣ Webhook endpoint availability..."
echo "   Webhook URL should be: https://api.velvena.fr/calendly/webhook"
echo "   Testing endpoint..."
WEBHOOK_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://api.velvena.fr/calendly/webhook -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "error")

if [[ "$WEBHOOK_TEST" == "500" ]] || [[ "$WEBHOOK_TEST" == "401" ]]; then
    echo "   ✅ Endpoint is accessible (returned $WEBHOOK_TEST - expected for test payload)"
else
    echo "   ⚠️  Endpoint returned: $WEBHOOK_TEST"
fi

echo ""
echo "✅ Verification complete!"
