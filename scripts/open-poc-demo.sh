#!/bin/bash

# Script pour ouvrir la démo du POC Template System

echo "🚀 Ouverture de la démo POC Template System..."

# Ouvrir dans le navigateur
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open public/poc-demo.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open public/poc-demo.html
else
  echo "Ouvrez manuellement le fichier: public/poc-demo.html"
fi

echo "✅ Page de démo ouverte !"
echo ""
echo "📋 Endpoints disponibles:"
echo "  - Démo:      http://localhost:3000/poc/template/demo"
echo "  - Structure: http://localhost:3000/poc/template/structure"
echo "  - Contrat:   http://localhost:3000/poc/template/contract/:id"
echo ""
echo "📚 Documentation:"
echo "  - POC_TEMPLATE_SYSTEM.md"
echo "  - SIMPLIFIED_CONTRACT_SYSTEM_PROPOSAL.md"
