#!/bin/bash

# Deploy Calendly Webhook Fix to VPS
# This script pulls the latest code and restarts the backend container

set -e

echo "🚀 Deploying Calendly webhook fix..."

# Use current directory (script should be run from project root)
PROJECT_DIR=$(pwd)

# Pull latest code
echo "📥 Pulling latest code from git..."
git pull origin main

# Restart backend container
echo "🔄 Restarting backend container..."
docker restart velvena-api

# Wait for container to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Show recent logs
echo "📋 Showing recent logs..."
docker logs --tail=50 velvena-api

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to the frontend and disconnect Calendly (Settings > Integrations)"
echo "2. Reconnect Calendly to trigger webhook creation"
echo "3. Monitor logs with: docker logs -f velvena-api | grep -E 'webhook|organization'"
echo "4. Verify in database:"
echo "   docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c \"SELECT webhook_active, webhook_subscription_uri FROM \\\"CalendlyIntegration\\\" WHERE is_active = true;\""
echo ""
echo "Expected log output:"
echo "  ✅ Creating webhook subscription for organization https://api.calendly.com/organizations/..."
echo "  ✅ Webhook subscription created"
