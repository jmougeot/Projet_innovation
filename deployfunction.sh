#!/bin/bash

# 🚀 Script de déploiement automatisé Firebase Functions
# Usage: ./deployfunction.sh [fonction] [--force]

set -e  # Arrête le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions disponibles
AVAILABLE_FUNCTIONS=(
    "setRestaurantAccess"
    "removeRestaurantAccess" 
    "getUserRestaurantAccess"
    "emergencyLockdown"
    "liftEmergencyLockdown"
    "debugUserClaims"
)

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTIONS_DIR="$PROJECT_ROOT/functions"
TARGET_FUNCTION="$1"
FORCE_DEPLOY="$2"

echo -e "${BLUE}🚀 Script de déploiement Firebase Functions${NC}"
echo -e "${BLUE}===============================================${NC}"

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI n'est pas installé${NC}"
    echo -e "${YELLOW}Installation: npm install -g firebase-tools${NC}"
    exit 1
fi

# Vérifier que nous sommes dans le bon projet
echo -e "${YELLOW}🔍 Vérification du projet Firebase...${NC}"
cd "$PROJECT_ROOT"

CURRENT_PROJECT=$(firebase use --config --token 2>/dev/null | grep "active" | cut -d'"' -f4 || echo "")
if [ "$CURRENT_PROJECT" != "app-restaurant-a6370" ]; then
    echo -e "${RED}❌ Projet Firebase incorrect: $CURRENT_PROJECT${NC}"
    echo -e "${YELLOW}Configuration du bon projet...${NC}"
    firebase use app-restaurant-a6370
fi

echo -e "${GREEN}✅ Projet: $CURRENT_PROJECT${NC}"

# Aller dans le dossier functions
cd "$FUNCTIONS_DIR"

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
fi

# Compiler TypeScript
echo -e "${YELLOW}🔨 Compilation TypeScript...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur de compilation TypeScript${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Compilation réussie${NC}"

# Fonction d'aide
show_help() {
    echo -e "${BLUE}Usage:${NC}"
    echo -e "  ./deployfunction.sh                    # Déploie toutes les fonctions"
    echo -e "  ./deployfunction.sh [fonction]         # Déploie une fonction spécifique"
    echo -e "  ./deployfunction.sh all --force        # Force le déploiement de tout"
    echo -e ""
    echo -e "${BLUE}Fonctions disponibles:${NC}"
    for func in "${AVAILABLE_FUNCTIONS[@]}"; do
        echo -e "  - $func"
    done
    echo -e ""
    echo -e "${BLUE}Exemples:${NC}"
    echo -e "  ./deployfunction.sh setRestaurantAccess"
    echo -e "  ./deployfunction.sh emergencyLockdown"
    echo -e "  ./deployfunction.sh all"
}

# Vérifier les arguments
if [ "$TARGET_FUNCTION" == "--help" ] || [ "$TARGET_FUNCTION" == "-h" ]; then
    show_help
    exit 0
fi

# Déploiement
if [ -z "$TARGET_FUNCTION" ] || [ "$TARGET_FUNCTION" == "all" ]; then
    # Déployer toutes les fonctions
    echo -e "${YELLOW}🚀 Déploiement de TOUTES les fonctions...${NC}"
    
    if [ "$FORCE_DEPLOY" == "--force" ]; then
        echo -e "${YELLOW}⚠️  Mode force activé${NC}"
        firebase deploy --only functions --force
    else
        firebase deploy --only functions
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Toutes les fonctions déployées avec succès !${NC}"
    else
        echo -e "${RED}❌ Erreur lors du déploiement${NC}"
        exit 1
    fi
    
else
    # Vérifier que la fonction existe
    if [[ ! " ${AVAILABLE_FUNCTIONS[@]} " =~ " ${TARGET_FUNCTION} " ]]; then
        echo -e "${RED}❌ Fonction inconnue: $TARGET_FUNCTION${NC}"
        echo -e "${YELLOW}Fonctions disponibles:${NC}"
        for func in "${AVAILABLE_FUNCTIONS[@]}"; do
            echo -e "  - $func"
        done
        exit 1
    fi
    
    # Déployer la fonction spécifique
    echo -e "${YELLOW}🎯 Déploiement de la fonction: $TARGET_FUNCTION${NC}"
    
    if [ "$FORCE_DEPLOY" == "--force" ]; then
        echo -e "${YELLOW}⚠️  Mode force activé${NC}"
        firebase deploy --only functions:$TARGET_FUNCTION --force
    else
        firebase deploy --only functions:$TARGET_FUNCTION
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Fonction $TARGET_FUNCTION déployée avec succès !${NC}"
        
        # Afficher l'URL de la fonction
        echo -e "${BLUE}🌐 URL de la fonction:${NC}"
        echo -e "https://us-central1-app-restaurant-a6370.cloudfunctions.net/$TARGET_FUNCTION"
    else
        echo -e "${RED}❌ Erreur lors du déploiement de $TARGET_FUNCTION${NC}"
        exit 1
    fi
fi

# Afficher les logs récents
echo -e "${YELLOW}📋 Logs récents:${NC}"
firebase functions:log --limit 5

echo -e "${GREEN}🎉 Déploiement terminé !${NC}"

# Afficher les URLs de toutes les fonctions
echo -e "${BLUE}🌐 URLs des fonctions:${NC}"
for func in "${AVAILABLE_FUNCTIONS[@]}"; do
    echo -e "  📡 $func:"
    echo -e "     https://us-central1-app-restaurant-a6370.cloudfunctions.net/$func"
done

echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}✨ Firebase Functions prêtes à l'emploi ! ✨${NC}"
