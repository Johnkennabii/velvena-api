#!/bin/bash

# Script de test rapide pour l'intégration Calendly
# Usage: ./scripts/test-calendly.sh

set -e

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
TEST_EMAIL="user@velvena.com"
TEST_PASSWORD="user123"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Test de l'intégration Calendly${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Fonction pour afficher les résultats
function print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Fonction pour afficher une section
function print_section() {
    echo ""
    echo -e "${YELLOW}▶ $1${NC}"
}

# 1. Vérifier que le serveur est accessible
print_section "1. Vérification du serveur"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Serveur accessible"
else
    print_result 1 "Serveur non accessible (code: $HTTP_CODE)"
fi

# 2. Connexion et récupération du token
print_section "2. Authentification"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    print_result 0 "Token JWT obtenu"
    echo -e "${BLUE}   Token: ${TOKEN:0:20}...${NC}"
else
    print_result 1 "Échec de l'authentification"
fi

# 3. Vérifier l'état de l'intégration
print_section "3. Vérification de l'état de l'intégration"
STATUS_RESPONSE=$(curl -s -X GET $API_URL/calendly/status \
  -H "Authorization: Bearer $TOKEN")

CONNECTED=$(echo $STATUS_RESPONSE | jq -r '.connected')

if [ "$CONNECTED" == "true" ]; then
    print_result 0 "Intégration Calendly connectée"

    # Afficher les détails
    CALENDLY_USER=$(echo $STATUS_RESPONSE | jq -r '.integration.calendly_user_name')
    CALENDLY_EMAIL=$(echo $STATUS_RESPONSE | jq -r '.integration.calendly_email')
    LAST_SYNC=$(echo $STATUS_RESPONSE | jq -r '.integration.last_synced_at')
    AUTO_SYNC=$(echo $STATUS_RESPONSE | jq -r '.integration.auto_sync_enabled')
    WEBHOOK_ACTIVE=$(echo $STATUS_RESPONSE | jq -r '.integration.webhook_active')

    echo -e "${BLUE}   Utilisateur: $CALENDLY_USER${NC}"
    echo -e "${BLUE}   Email: $CALENDLY_EMAIL${NC}"
    echo -e "${BLUE}   Dernière sync: $LAST_SYNC${NC}"
    echo -e "${BLUE}   Sync auto: $AUTO_SYNC${NC}"
    echo -e "${BLUE}   Webhook actif: $WEBHOOK_ACTIVE${NC}"
elif [ "$CONNECTED" == "false" ]; then
    echo -e "${YELLOW}⚠️  Intégration non connectée${NC}"
    echo -e "${YELLOW}   Pour connecter:${NC}"
    echo -e "${YELLOW}   1. Ouvrir http://localhost:5173${NC}"
    echo -e "${YELLOW}   2. Aller dans Paramètres > Intégrations${NC}"
    echo -e "${YELLOW}   3. Cliquer sur 'Connecter Calendly'${NC}"
    exit 0
else
    print_result 1 "Erreur lors de la récupération du statut"
fi

# 4. Lister les événements synchronisés
print_section "4. Événements Calendly synchronisés"
EVENTS_RESPONSE=$(curl -s -X GET "$API_URL/calendly/events?limit=5" \
  -H "Authorization: Bearer $TOKEN")

EVENTS_COUNT=$(echo $EVENTS_RESPONSE | jq -r '.total')
echo -e "${BLUE}   Total d'événements: $EVENTS_COUNT${NC}"

if [ "$EVENTS_COUNT" -gt 0 ]; then
    print_result 0 "Événements trouvés"

    # Afficher les 3 premiers événements
    echo -e "${BLUE}   Derniers événements:${NC}"
    echo $EVENTS_RESPONSE | jq -r '.events[] | "     • \(.event_name) - \(.invitee_name) (\(.event_start_time))"' | head -3
else
    echo -e "${YELLOW}⚠️  Aucun événement synchronisé${NC}"
fi

# 5. Vérifier les prospects créés depuis Calendly
print_section "5. Prospects créés depuis Calendly"
PROSPECTS_RESPONSE=$(curl -s -X GET "$API_URL/prospects?limit=50" \
  -H "Authorization: Bearer $TOKEN")

CALENDLY_PROSPECTS=$(echo $PROSPECTS_RESPONSE | jq '[.prospects[] | select(.source == "calendly")] | length')

if [ "$CALENDLY_PROSPECTS" -gt 0 ]; then
    print_result 0 "$CALENDLY_PROSPECTS prospects créés depuis Calendly"

    # Afficher les prospects
    echo -e "${BLUE}   Prospects Calendly:${NC}"
    echo $PROSPECTS_RESPONSE | jq -r '.prospects[] | select(.source == "calendly") | "     • \(.firstname) \(.lastname) - \(.email)"' | head -5
else
    echo -e "${YELLOW}⚠️  Aucun prospect créé depuis Calendly${NC}"
fi

# 6. Déclencher une synchronisation manuelle
print_section "6. Synchronisation manuelle"
SYNC_RESPONSE=$(curl -s -X POST $API_URL/calendly/sync \
  -H "Authorization: Bearer $TOKEN")

SYNC_SUCCESS=$(echo $SYNC_RESPONSE | jq -r '.success')
SYNCED_COUNT=$(echo $SYNC_RESPONSE | jq -r '.synced_count')

if [ "$SYNC_SUCCESS" == "true" ]; then
    print_result 0 "Synchronisation réussie ($SYNCED_COUNT événements)"
else
    print_result 1 "Échec de la synchronisation"
fi

# 7. Vérifier la base de données
print_section "7. Vérification de la base de données"

echo -e "${BLUE}   Vérification des intégrations actives...${NC}"
DB_INTEGRATIONS=$(psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -t -c "SELECT COUNT(*) FROM \"CalendlyIntegration\" WHERE is_active = true;" 2>/dev/null || echo "0")

if [ "$DB_INTEGRATIONS" -gt 0 ]; then
    print_result 0 "$DB_INTEGRATIONS intégration(s) active(s) en base"
else
    echo -e "${YELLOW}⚠️  Aucune intégration active en base${NC}"
fi

echo -e "${BLUE}   Vérification des événements...${NC}"
DB_EVENTS=$(psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -t -c "SELECT COUNT(*) FROM \"CalendlyEvent\";" 2>/dev/null || echo "0")

if [ "$DB_EVENTS" -gt 0 ]; then
    print_result 0 "$DB_EVENTS événement(s) en base"
else
    echo -e "${YELLOW}⚠️  Aucun événement en base${NC}"
fi

# Résumé final
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Tests terminés avec succès !${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Résumé:${NC}"
echo -e "${BLUE}   • Intégration: ${CONNECTED}${NC}"
echo -e "${BLUE}   • Événements: $EVENTS_COUNT${NC}"
echo -e "${BLUE}   • Prospects Calendly: $CALENDLY_PROSPECTS${NC}"
echo -e "${BLUE}   • Dernière sync: $(echo $SYNC_RESPONSE | jq -r '.message')${NC}"
echo ""
