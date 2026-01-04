#!/bin/bash

# Test manuel de l'intégration Calendly
# Usage: ./scripts/test-calendly-manual.sh <email> <password>

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3000"
TEST_EMAIL="${1:-contact@velvena.fr}"
TEST_PASSWORD="${2}"

if [ -z "$TEST_PASSWORD" ]; then
    echo -e "${RED}❌ Usage: ./scripts/test-calendly-manual.sh <email> <password>${NC}"
    echo -e "${YELLOW}   Exemple: ./scripts/test-calendly-manual.sh contact@velvena.fr votre_mot_de_passe${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Test de l'intégration Calendly${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Vérifier le serveur
echo -e "${YELLOW}▶ 1. Vérification du serveur${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Serveur accessible${NC}"
else
    echo -e "${RED}❌ Serveur non accessible (code: $HTTP_CODE)${NC}"
    exit 1
fi

# 2. Authentification
echo ""
echo -e "${YELLOW}▶ 2. Authentification${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Token JWT obtenu${NC}"
    echo -e "${BLUE}   Email: $TEST_EMAIL${NC}"
else
    echo -e "${RED}❌ Échec de l'authentification${NC}"
    echo -e "${RED}   Réponse: $LOGIN_RESPONSE${NC}"
    exit 1
fi

# 3. Vérifier l'intégration
echo ""
echo -e "${YELLOW}▶ 3. Vérification de l'intégration Calendly${NC}"
STATUS_RESPONSE=$(curl -s -X GET $API_URL/calendly/status \
  -H "Authorization: Bearer $TOKEN")

CONNECTED=$(echo $STATUS_RESPONSE | jq -r '.connected')

if [ "$CONNECTED" == "true" ]; then
    echo -e "${GREEN}✅ Intégration Calendly connectée${NC}"

    CALENDLY_USER=$(echo $STATUS_RESPONSE | jq -r '.integration.calendly_user_name')
    CALENDLY_EMAIL=$(echo $STATUS_RESPONSE | jq -r '.integration.calendly_email')
    LAST_SYNC=$(echo $STATUS_RESPONSE | jq -r '.integration.last_synced_at')
    AUTO_SYNC=$(echo $STATUS_RESPONSE | jq -r '.integration.auto_sync_enabled')

    echo -e "${BLUE}   Utilisateur: $CALENDLY_USER${NC}"
    echo -e "${BLUE}   Email: $CALENDLY_EMAIL${NC}"
    echo -e "${BLUE}   Dernière sync: $LAST_SYNC${NC}"
    echo -e "${BLUE}   Sync auto: $AUTO_SYNC${NC}"
else
    echo -e "${YELLOW}⚠️  Intégration non connectée${NC}"
    echo -e "${YELLOW}   Pour connecter:${NC}"
    echo -e "${YELLOW}   1. Ouvrir: http://localhost:5173${NC}"
    echo -e "${YELLOW}   2. Aller dans: Paramètres > Intégrations${NC}"
    echo -e "${YELLOW}   3. Cliquer sur: 'Connecter Calendly'${NC}"
    echo ""
    echo -e "${YELLOW}   Ou utiliser cette URL pour OAuth:${NC}"
    echo -e "${BLUE}   https://auth.calendly.com/oauth/authorize?client_id=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM&response_type=code&redirect_uri=http://localhost:5173/auth/calendly/callback${NC}"
    exit 0
fi

# 4. Lister les événements
echo ""
echo -e "${YELLOW}▶ 4. Événements synchronisés${NC}"
EVENTS_RESPONSE=$(curl -s -X GET "$API_URL/calendly/events?limit=5" \
  -H "Authorization: Bearer $TOKEN")

EVENTS_COUNT=$(echo $EVENTS_RESPONSE | jq -r '.total')
echo -e "${BLUE}   Total: $EVENTS_COUNT événements${NC}"

if [ "$EVENTS_COUNT" -gt 0 ]; then
    echo -e "${BLUE}   Derniers événements:${NC}"
    echo "$EVENTS_RESPONSE" | jq -r '.events[] | "     • \(.event_name) - \(.invitee_name) (\(.event_start_time))"' | head -3
else
    echo -e "${YELLOW}   Aucun événement synchronisé${NC}"
fi

# 5. Vérifier les prospects
echo ""
echo -e "${YELLOW}▶ 5. Prospects créés depuis Calendly${NC}"
PROSPECTS_RESPONSE=$(curl -s -X GET "$API_URL/prospects?limit=50" \
  -H "Authorization: Bearer $TOKEN")

CALENDLY_PROSPECTS=$(echo "$PROSPECTS_RESPONSE" | jq '[.prospects[] | select(.source == "calendly")] | length')

if [ "$CALENDLY_PROSPECTS" -gt 0 ]; then
    echo -e "${GREEN}✅ $CALENDLY_PROSPECTS prospects créés depuis Calendly${NC}"
    echo -e "${BLUE}   Prospects:${NC}"
    echo "$PROSPECTS_RESPONSE" | jq -r '.prospects[] | select(.source == "calendly") | "     • \(.firstname) \(.lastname) - \(.email)"' | head -5
else
    echo -e "${YELLOW}   Aucun prospect créé depuis Calendly${NC}"
fi

# 6. Synchronisation manuelle
echo ""
echo -e "${YELLOW}▶ 6. Test de synchronisation manuelle${NC}"
SYNC_RESPONSE=$(curl -s -X POST $API_URL/calendly/sync \
  -H "Authorization: Bearer $TOKEN")

SYNC_SUCCESS=$(echo "$SYNC_RESPONSE" | jq -r '.success')
SYNCED_COUNT=$(echo "$SYNC_RESPONSE" | jq -r '.synced_count')

if [ "$SYNC_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ Synchronisation réussie ($SYNCED_COUNT événements)${NC}"
else
    echo -e "${RED}❌ Échec de la synchronisation${NC}"
fi

# Résumé
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Tests terminés avec succès !${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Résumé:${NC}"
echo -e "${BLUE}   • Intégration: $CONNECTED${NC}"
echo -e "${BLUE}   • Événements: $EVENTS_COUNT${NC}"
echo -e "${BLUE}   • Prospects Calendly: $CALENDLY_PROSPECTS${NC}"
echo ""
