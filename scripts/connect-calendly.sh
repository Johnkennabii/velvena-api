#!/bin/bash

# Script de connexion Calendly
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

API_URL="http://localhost:3000"

# Charger les variables depuis .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep CALENDLY_CLIENT_ID | xargs)
    export $(grep -v '^#' .env | grep CALENDLY_REDIRECT_URI | xargs)
fi

CLIENT_ID="${CALENDLY_CLIENT_ID:-C8PqDizYu-MyqJlRWMifsc4ct7GGJ90PeOew4n1F8xU}"
REDIRECT_URI="${CALENDLY_REDIRECT_URI:-http://localhost:5173/auth/calendly/callback}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}${BOLD}🔗 Connexion de votre compte Calendly${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Étape 1 : Credentials Velvena
echo -e "${YELLOW}${BOLD}Étape 1/4 : Authentification Velvena${NC}"
echo ""
read -p "Email Velvena: " VELVENA_EMAIL
read -sp "Mot de passe Velvena: " VELVENA_PASSWORD
echo ""
echo ""

# Se connecter à Velvena
echo -e "${BLUE}Connexion à Velvena...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VELVENA_EMAIL\",\"password\":\"$VELVENA_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Échec de l'authentification Velvena${NC}"
    echo -e "${RED}Vérifiez votre email et mot de passe${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authentification réussie${NC}"
echo ""

# Étape 2 : Générer l'URL OAuth
echo -e "${YELLOW}${BOLD}Étape 2/4 : Autorisation Calendly${NC}"
echo ""

AUTH_URL="https://auth.calendly.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}"

echo -e "${BLUE}Une page va s'ouvrir dans votre navigateur pour autoriser l'accès à Calendly.${NC}"
echo ""
echo -e "${YELLOW}Si la page ne s'ouvre pas automatiquement, copiez cette URL :${NC}"
echo -e "${BLUE}${AUTH_URL}${NC}"
echo ""
read -p "Appuyez sur Entrée pour ouvrir le navigateur..."

# Ouvrir le navigateur
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$AUTH_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$AUTH_URL"
else
    echo -e "${YELLOW}Ouvrez manuellement cette URL dans votre navigateur :${NC}"
    echo -e "${BLUE}${AUTH_URL}${NC}"
fi

echo ""
echo -e "${YELLOW}${BOLD}Étape 3/4 : Récupération du code d'autorisation${NC}"
echo ""
echo -e "${BLUE}Après avoir autorisé l'application sur Calendly, vous serez redirigé vers une page.${NC}"
echo -e "${BLUE}L'URL ressemblera à :${NC}"
echo -e "${YELLOW}http://localhost:5173/auth/calendly/callback?code=XXXXXXXXXX${NC}"
echo ""
echo -e "${BLUE}Copiez le CODE qui apparaît après '?code=' dans l'URL${NC}"
echo ""
read -p "Collez le code ici : " OAUTH_CODE
echo ""

if [ -z "$OAUTH_CODE" ]; then
    echo -e "${RED}❌ Code vide, abandon.${NC}"
    exit 1
fi

# Étape 4 : Compléter l'OAuth
echo -e "${YELLOW}${BOLD}Étape 4/4 : Finalisation de la connexion${NC}"
echo ""
echo -e "${BLUE}Connexion de votre compte Calendly à Velvena...${NC}"

CALLBACK_RESPONSE=$(curl -s -X POST $API_URL/calendly/oauth/callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$OAUTH_CODE\"}")

SUCCESS=$(echo $CALLBACK_RESPONSE | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ Connexion réussie !${NC}"
    echo ""

    # Afficher les infos de l'intégration
    CALENDLY_NAME=$(echo $CALLBACK_RESPONSE | jq -r '.integration.calendly_user_name')
    CALENDLY_EMAIL=$(echo $CALLBACK_RESPONSE | jq -r '.integration.calendly_email')

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}🎉 Intégration Calendly configurée !${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Utilisateur Calendly : ${BOLD}$CALENDLY_NAME${NC}"
    echo -e "${BLUE}Email               : ${BOLD}$CALENDLY_EMAIL${NC}"
    echo ""
    echo -e "${YELLOW}La synchronisation de vos événements va démarrer automatiquement.${NC}"
    echo ""

    # Attendre 5 secondes pour la première sync
    echo -e "${BLUE}Attente de la première synchronisation...${NC}"
    sleep 5

    # Vérifier les événements
    echo ""
    echo -e "${BLUE}Vérification des événements synchronisés...${NC}"
    EVENTS_RESPONSE=$(curl -s -X GET "$API_URL/calendly/events?limit=5" \
      -H "Authorization: Bearer $TOKEN")

    EVENTS_COUNT=$(echo $EVENTS_RESPONSE | jq -r '.total')

    if [ "$EVENTS_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ $EVENTS_COUNT événements synchronisés !${NC}"
        echo ""
        echo -e "${BLUE}Derniers événements :${NC}"
        echo "$EVENTS_RESPONSE" | jq -r '.events[] | "  • \(.event_name) - \(.invitee_name) (\(.event_start_time))"' | head -3
    else
        echo -e "${YELLOW}ℹ️  Aucun événement trouvé dans votre Calendly${NC}"
        echo -e "${YELLOW}   Créez des rendez-vous sur Calendly et relancez la synchronisation :${NC}"
        echo -e "${BLUE}   curl -X POST http://localhost:3000/calendly/sync -H \"Authorization: Bearer $TOKEN\"${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ Configuration terminée avec succès !${NC}"
    echo ""

else
    echo -e "${RED}❌ Échec de la connexion${NC}"
    echo -e "${RED}Erreur : $(echo $CALLBACK_RESPONSE | jq -r '.error // .message')${NC}"
    echo ""
    echo -e "${YELLOW}Vérifiez que :${NC}"
    echo -e "${YELLOW}1. Le code est correct et n'a pas expiré (10 min)${NC}"
    echo -e "${YELLOW}2. Vous avez bien autorisé l'application sur Calendly${NC}"
    exit 1
fi
