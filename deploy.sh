#!/bin/bash

# Script de déploiement automatique pour l'application Expo sur Firebase Hosting
# Usage: ./deploy.sh [--clean] [--skip-build]

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet (là où se trouvent package.json et firebase.json)"
    exit 1
fi

# Variables
CLEAN=false
SKIP_BUILD=false

# Parser les arguments
for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --clean      Nettoie les dossiers de build avant de construire"
            echo "  --skip-build Ignore l'étape de build et déploie directement"
            echo "  --help, -h   Affiche cette aide"
            exit 0
            ;;
        *)
            print_warning "Option inconnue: $arg"
            ;;
    esac
done

print_info "🚀 Début du déploiement de l'application Expo"

# Nettoyage si demandé
if [ "$CLEAN" = true ]; then
    print_info "🧹 Nettoyage des fichiers de build..."
    rm -rf dist
    rm -rf .expo
    rm -rf node_modules/.cache
    print_success "Nettoyage terminé"
fi

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    print_info "📦 Installation des dépendances..."
    npm install
    print_success "Dépendances installées"
fi

# Build de l'application
if [ "$SKIP_BUILD" = false ]; then
    print_info "🔨 Construction de l'application web..."
    
    # Vérifier si le dossier dist existe déjà
    if [ -d "dist" ]; then
        print_warning "Le dossier dist existe déjà, suppression..."
        rm -rf dist
    fi
    
    # Lancer le build
    npm run build:web
    
    # Vérifier si le build a réussi
    if [ ! -d "dist" ]; then
        print_error "Le build a échoué - le dossier dist n'a pas été créé"
        exit 1
    fi
    
    print_success "Build terminé avec succès"
else
    print_warning "⏭️  Étape de build ignorée"
    
    # Vérifier si le dossier dist existe
    if [ ! -d "dist" ]; then
        print_error "Le dossier dist n'existe pas. Vous devez faire un build avant de déployer."
        exit 1
    fi
fi

# Vérifier la connexion Firebase
print_info "🔐 Vérification de la connexion Firebase..."
if ! firebase projects:list > /dev/null 2>&1; then
    print_warning "Vous n'êtes pas connecté à Firebase. Connexion en cours..."
    firebase login
fi

# Afficher le projet Firebase actuel
PROJECT_ID=$(firebase use | grep "active project" | cut -d' ' -f4 | tr -d '()')
if [ ! -z "$PROJECT_ID" ]; then
    print_info "📋 Projet Firebase actuel: $PROJECT_ID"
else
    print_warning "Aucun projet Firebase sélectionné"
fi

# Déploiement
print_info "Déploiement sur Firebase Hosting..."
firebase deploy --only hosting

# Vérifier le succès du déploiement
if [ $? -eq 0 ]; then
    print_success "Déploiement terminé avec succès!"
    
    # Afficher l'URL de l'application
    if [ ! -z "$PROJECT_ID" ]; then
        echo ""
        print_info "🌐 Votre application est accessible à:"
        echo -e "${GREEN}   https://$PROJECT_ID.web.app${NC}"
        echo ""
        print_info "📊 Console Firebase:"
        echo -e "${BLUE}   https://console.firebase.google.com/project/$PROJECT_ID/overview${NC}"
    fi
else
    print_error "Le déploiement a échoué"
    exit 1
fi

print_success "✨ Processus de déploiement terminé!"
