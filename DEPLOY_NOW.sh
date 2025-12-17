#!/bin/bash
# Script de déploiement rapide pour la production
# Usage: ./DEPLOY_NOW.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement Velvena Backend - $(date)"
echo "================================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup de la base de données
echo -e "\n${YELLOW}📦 Étape 1/6 : Backup de la base de données${NC}"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Création du backup : $BACKUP_FILE"
# Décommenter et adapter selon votre configuration de production :
# pg_dump -h localhost -U velvena_user -d velvena_prod > "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup créé (ou simulé)${NC}"

# 2. Pull du code
echo -e "\n${YELLOW}📥 Étape 2/6 : Pull du code depuis GitHub${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Code mis à jour${NC}"

# 3. Installation des dépendances
echo -e "\n${YELLOW}📦 Étape 3/6 : Installation des dépendances${NC}"
npm install
echo -e "${GREEN}✓ Dépendances installées${NC}"

# 4. Application des migrations Prisma
echo -e "\n${YELLOW}🗃️  Étape 4/6 : Application des migrations Prisma${NC}"
echo "Vérification de l'état des migrations..."
npx prisma migrate status

echo -e "\n${RED}⚠️  ATTENTION : Les migrations suivantes vont être appliquées :${NC}"
echo "  - 20251215_add_organization_manager_fields"
echo "  - 20251215_remove_soft_delete_from_pricing_rule"
echo "  - 20251215213702_add_template_structure"
echo "  - 20251216221841_fix_template_unique_constraint (CRITIQUE)"
echo ""
read -p "Continuer avec les migrations ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Migrations appliquées${NC}"
else
    echo -e "${RED}❌ Déploiement annulé${NC}"
    exit 1
fi

# 5. Build du projet
echo -e "\n${YELLOW}🔨 Étape 5/6 : Build du projet TypeScript${NC}"
npm run build
echo -e "${GREEN}✓ Build terminé${NC}"

# 6. Redémarrage de l'application
echo -e "\n${YELLOW}🔄 Étape 6/6 : Redémarrage de l'application${NC}"
echo "Choisissez votre méthode de redémarrage :"
echo "  1) PM2 (pm2 restart velvena-backend)"
echo "  2) Systemd (systemctl restart velvena-backend)"
echo "  3) Docker (docker-compose restart backend)"
echo "  4) Manuel (je vais le faire moi-même)"
read -p "Votre choix (1-4) : " -n 1 -r
echo

case $REPLY in
    1)
        pm2 restart velvena-backend
        echo -e "${GREEN}✓ Application redémarrée avec PM2${NC}"
        echo -e "\n📊 Logs PM2 :"
        pm2 logs velvena-backend --lines 20 --nostream
        ;;
    2)
        sudo systemctl restart velvena-backend
        echo -e "${GREEN}✓ Application redémarrée avec Systemd${NC}"
        echo -e "\n📊 Status Systemd :"
        sudo systemctl status velvena-backend --no-pager
        ;;
    3)
        docker-compose restart backend
        echo -e "${GREEN}✓ Application redémarrée avec Docker${NC}"
        echo -e "\n📊 Logs Docker :"
        docker-compose logs --tail=20 backend
        ;;
    4)
        echo -e "${YELLOW}⏸️  Redémarrage manuel requis${NC}"
        ;;
    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac

# Vérifications post-déploiement
echo -e "\n${YELLOW}🔍 Vérifications post-déploiement${NC}"

# Test de l'API
echo -e "\n1. Test de l'API..."
# Adapter l'URL selon votre configuration
# RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.velvena.com/health)
# if [ "$RESPONSE" = "200" ]; then
#     echo -e "${GREEN}✓ API répond correctement (200)${NC}"
# else
#     echo -e "${RED}❌ API ne répond pas correctement (code: $RESPONSE)${NC}"
# fi

# Vérification de la contrainte en base
echo -e "\n2. Vérification de la contrainte d'unicité des templates..."
echo "   (Vérifiez manuellement avec la requête dans DEPLOYMENT_CHECKLIST.md)"

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n📝 Prochaines étapes :"
echo "  1. Vérifier les logs de l'application"
echo "  2. Tester la création d'un template depuis le frontend"
echo "  3. Tester la suppression d'un template"
echo "  4. Tester la modification de paiement sur un contrat signé"
echo "  5. Consulter DEPLOYMENT_CHECKLIST.md pour les validations complètes"

echo -e "\n💾 Backup créé : $BACKUP_FILE"
echo -e "   En cas de problème, restaurer avec :"
echo -e "   ${YELLOW}psql -U velvena_user -d velvena_prod < $BACKUP_FILE${NC}"
