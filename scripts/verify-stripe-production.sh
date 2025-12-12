#!/bin/bash

# Script de vérification de la configuration Stripe en production
# Usage: ./scripts/verify-stripe-production.sh

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Vérification Configuration Stripe Production         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0
SUCCESS=0

# Fonction de vérification
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((ERRORS++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

info() {
    echo -e "ℹ️  $1"
}

# Charger les variables d'environnement
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    info "Fichier .env.production chargé"
else
    echo -e "${RED}❌ Fichier .env.production introuvable${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Vérification des Variables d'Environnement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# STRIPE_SECRET_KEY
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY non définie${NC}"
    ((ERRORS++))
elif [[ $STRIPE_SECRET_KEY == sk_test_* ]]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY est une clé de TEST (sk_test_)${NC}"
    echo -e "${RED}   Vous devez utiliser une clé LIVE (sk_live_) en production${NC}"
    ((ERRORS++))
elif [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
    echo -e "${GREEN}✅ STRIPE_SECRET_KEY configurée (LIVE)${NC}"
    echo "   ${STRIPE_SECRET_KEY:0:20}..."
    ((SUCCESS++))
else
    echo -e "${RED}❌ STRIPE_SECRET_KEY format invalide${NC}"
    ((ERRORS++))
fi

# STRIPE_PUBLISHABLE_KEY
if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    echo -e "${RED}❌ STRIPE_PUBLISHABLE_KEY non définie${NC}"
    ((ERRORS++))
elif [[ $STRIPE_PUBLISHABLE_KEY == pk_test_* ]]; then
    echo -e "${RED}❌ STRIPE_PUBLISHABLE_KEY est une clé de TEST (pk_test_)${NC}"
    echo -e "${RED}   Vous devez utiliser une clé LIVE (pk_live_) en production${NC}"
    ((ERRORS++))
elif [[ $STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
    echo -e "${GREEN}✅ STRIPE_PUBLISHABLE_KEY configurée (LIVE)${NC}"
    echo "   ${STRIPE_PUBLISHABLE_KEY:0:20}..."
    ((SUCCESS++))
else
    echo -e "${RED}❌ STRIPE_PUBLISHABLE_KEY format invalide${NC}"
    ((ERRORS++))
fi

# STRIPE_WEBHOOK_SECRET
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET non définie${NC}"
    ((ERRORS++))
elif [[ $STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET configurée${NC}"
    echo "   ${STRIPE_WEBHOOK_SECRET:0:20}..."
    ((SUCCESS++))
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET format invalide (doit commencer par whsec_)${NC}"
    ((ERRORS++))
fi

# URLs de redirection
if [ -z "$STRIPE_SUCCESS_URL" ]; then
    warn "STRIPE_SUCCESS_URL non définie"
elif [[ $STRIPE_SUCCESS_URL == http://localhost* ]]; then
    echo -e "${RED}❌ STRIPE_SUCCESS_URL pointe vers localhost${NC}"
    echo -e "${RED}   En production, utilisez: https://velvena.fr/subscription/success${NC}"
    ((ERRORS++))
elif [[ $STRIPE_SUCCESS_URL == https://velvena.fr* ]]; then
    echo -e "${GREEN}✅ STRIPE_SUCCESS_URL configurée (production)${NC}"
    echo "   $STRIPE_SUCCESS_URL"
    ((SUCCESS++))
else
    warn "STRIPE_SUCCESS_URL: $STRIPE_SUCCESS_URL"
fi

if [ -z "$STRIPE_CANCEL_URL" ]; then
    warn "STRIPE_CANCEL_URL non définie"
elif [[ $STRIPE_CANCEL_URL == http://localhost* ]]; then
    echo -e "${RED}❌ STRIPE_CANCEL_URL pointe vers localhost${NC}"
    echo -e "${RED}   En production, utilisez: https://velvena.fr/pricing${NC}"
    ((ERRORS++))
elif [[ $STRIPE_CANCEL_URL == https://velvena.fr* ]]; then
    echo -e "${GREEN}✅ STRIPE_CANCEL_URL configurée (production)${NC}"
    echo "   $STRIPE_CANCEL_URL"
    ((SUCCESS++))
else
    warn "STRIPE_CANCEL_URL: $STRIPE_CANCEL_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Vérification de la Base de Données"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier si Prisma est configuré
if command -v npx &> /dev/null; then
    info "Vérification des colonnes Stripe dans la DB..."

    # Test si les colonnes existent (via Prisma)
    if npx prisma db execute --stdin <<< "SELECT stripe_customer_id FROM \"Organization\" LIMIT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Colonne stripe_customer_id existe${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ Colonne stripe_customer_id n'existe pas${NC}"
        echo -e "${RED}   Exécutez: npx prisma migrate deploy${NC}"
        ((ERRORS++))
    fi
else
    warn "npx non disponible, impossible de vérifier la DB"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Vérification des Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Déterminer l'URL de l'API
if [ -z "$API_URL" ]; then
    API_URL="https://api.velvena.fr"
    info "API_URL non définie, utilisation de: $API_URL"
fi

# Test du endpoint de santé
info "Test de $API_URL/health..."
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API accessible${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ API non accessible à $API_URL/health${NC}"
    ((ERRORS++))
fi

# Test du endpoint webhook health
info "Test de $API_URL/webhooks/stripe/health..."
WEBHOOK_RESPONSE=$(curl -s "$API_URL/webhooks/stripe/health" 2>/dev/null || echo "error")

if [[ $WEBHOOK_RESPONSE == *"configured"* ]]; then
    echo -e "${GREEN}✅ Endpoint webhook configuré${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ Endpoint webhook non accessible${NC}"
    echo -e "${RED}   Vérifiez que le serveur est démarré${NC}"
    ((ERRORS++))
fi

# Test du endpoint de configuration
info "Test de $API_URL/api/billing/config..."
CONFIG_RESPONSE=$(curl -s "$API_URL/api/billing/config" 2>/dev/null || echo "error")

if [[ $CONFIG_RESPONSE == *"publishableKey"* ]]; then
    echo -e "${GREEN}✅ Endpoint /api/billing/config accessible${NC}"

    # Vérifier que la clé publique est bien une clé LIVE
    if [[ $CONFIG_RESPONSE == *"pk_live_"* ]]; then
        echo -e "${GREEN}✅ Clé publique LIVE exposée${NC}"
        ((SUCCESS++))
    elif [[ $CONFIG_RESPONSE == *"pk_test_"* ]]; then
        echo -e "${RED}❌ Clé publique TEST exposée (pk_test_)${NC}"
        echo -e "${RED}   Le serveur utilise encore les clés de test !${NC}"
        ((ERRORS++))
    fi
else
    warn "Endpoint /api/billing/config non accessible"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Instructions Stripe Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
info "Vérifications manuelles à faire dans Stripe Dashboard:"
echo ""
echo "1. Webhook endpoint configuré:"
echo "   → https://dashboard.stripe.com/webhooks"
echo "   → URL: $API_URL/webhooks/stripe"
echo "   → Mode: LIVE (pas Test)"
echo ""
echo "2. Produits synchronisés:"
echo "   → https://dashboard.stripe.com/products"
echo "   → Vérifier que 'Velvena Pro' et 'Velvena Enterprise' existent"
echo ""
echo "3. Customer Portal activé:"
echo "   → https://dashboard.stripe.com/settings/billing/portal"
echo "   → Activer: Cancel subscription, Update payment method"
echo ""
echo "4. Compte activé:"
echo "   → https://dashboard.stripe.com/dashboard"
echo "   → Bannière 'Activate your account' doit être complétée"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Résumé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Succès: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
echo -e "${RED}❌ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Configuration Stripe prête pour la production !${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Synchroniser les plans: npm run stripe:sync"
    echo "2. Redémarrer l'application: pm2 restart velvena-api"
    echo "3. Tester un paiement: https://velvena.fr/pricing"
    exit 0
else
    echo -e "${RED}⚠️  Des erreurs doivent être corrigées avant le déploiement${NC}"
    echo ""
    echo "Consultez le guide: STRIPE_PRODUCTION_DEPLOYMENT.md"
    exit 1
fi
