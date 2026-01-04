#!/bin/bash

# Fix Calendly Webhook URL Bug
# This script deploys the fix for the critical webhook URL bug

set -e

echo "🔧 Fixing Calendly Webhook URL Bug..."
echo ""
echo "PROBLEM: Webhook was using APP_URL (frontend) instead of API_URL (backend)"
echo "SOLUTION: Updated code to use correct API_URL for webhook subscription"
echo ""

# Use current directory (script should be run from project root)
PROJECT_DIR=$(pwd)

# Pull latest code
echo "📥 Step 1/3: Pulling latest code from git..."
git pull origin main

# Restart backend container
echo "🔄 Step 2/3: Restarting backend container..."
docker restart velvena-api

# Wait for container to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Show recent logs
echo "📋 Step 3/3: Showing recent logs..."
docker logs --tail=50 velvena-api

echo ""
echo "✅ Code deployment complete!"
echo ""
echo "⚠️  CRITICAL NEXT STEP - YOU MUST DO THIS:"
echo ""
echo "The old webhook is still using the WRONG URL. You MUST recreate it:"
echo ""
echo "1. Go to https://app.velvena.fr"
echo "2. Go to Settings > Integrations"
echo "3. DISCONNECT Calendly (this deletes the old webhook with wrong URL)"
echo "4. RECONNECT Calendly (this creates new webhook with correct URL)"
echo ""
echo "Expected webhook URL after reconnection:"
echo "  ✅ https://api.velvena.fr/calendly/webhook"
echo ""
echo "After reconnecting, test by creating a new Calendly appointment."
echo ""
echo "Monitor logs with:"
echo "  docker logs -f velvena-api | grep -E 'webhook|📥|✅'"
echo ""
echo "You should see:"
echo "  ✅ Calendly webhook signature verified"
echo "  📥 Received Calendly webhook - FULL DETAILS"
echo "  ✅ Successfully processed invitee.created webhook"
echo ""
