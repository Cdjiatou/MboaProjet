#!/bin/bash

# Script de vérification de préparation pour O2Switch
# Vérifie que tous les fichiers nécessaires sont en place avant le déploiement

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Vérification de préparation pour O2Switch${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Compteurs
ERRORS=0
WARNINGS=0
SUCCESS=0

# Fonction de vérification
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $2 - MANQUANT"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠${NC} $2 - MANQUANT (sera créé)"
        ((WARNINGS++))
    fi
}

echo -e "${BLUE}[1/6] Vérification du Backend${NC}"
echo "─────────────────────────────────────────────────────"
check_file "backend/package.json" "package.json"
check_file "backend/tsconfig.json" "tsconfig.json"
check_file "backend/src/index.ts" "Point d'entrée (index.ts)"
check_file "backend/.env" "Fichiers d'environnement (.env)"
check_file "backend/.env.production.example" "Exemple .env production"
check_file "backend/prisma/schema.prisma" "Schéma Prisma"
check_dir "backend/src" "Code source"
echo ""

echo -e "${BLUE}[2/6] Vérification du Frontend${NC}"
echo "─────────────────────────────────────────────────────"
check_file "Frontend/package.json" "package.json"
check_file "Frontend/vite.config.ts" "Configuration Vite"
check_file "Frontend/index.html" "Point d'entrée HTML"
check_file "Frontend/.env.production" "Variables d'environnement production"
check_file "Frontend/.htaccess" "Configuration Apache"
check_dir "Frontend/src" "Code source"
echo ""

echo -e "${BLUE}[3/6] Vérification des fichiers de déploiement${NC}"
echo "─────────────────────────────────────────────────────"
check_file "deploy-o2switch.sh" "Script de déploiement"
check_file "O2SWITCH-DEPLOYMENT-GUIDE.md" "Guide de déploiement"
check_file "backend/.htaccess.o2switch" "Configuration Apache Backend"
echo ""

echo -e "${BLUE}[4/6] Test de build du Backend${NC}"
echo "─────────────────────────────────────────────────────"
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build Backend réussie"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Build Backend échouée"
    ((ERRORS++))
fi
cd ..
echo ""

echo -e "${BLUE}[5/6] Test de build du Frontend${NC}"
echo "─────────────────────────────────────────────────────"
cd Frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build Frontend réussie"
    ((SUCCESS++))
    
    # Vérifier la taille du build
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo -e "  ${GREEN}→${NC} Taille du build: $BUILD_SIZE"
else
    echo -e "${RED}✗${NC} Build Frontend échouée"
    ((ERRORS++))
fi
cd ..
echo ""

echo -e "${BLUE}[6/6] Vérification de la configuration${NC}"
echo "─────────────────────────────────────────────────────"

# Vérifier que l'URL de l'API est configurée
if grep -q "VITE_API_URL" Frontend/.env.production; then
    API_URL=$(grep VITE_API_URL Frontend/.env.production | cut -d '=' -f2)
    echo -e "${GREEN}✓${NC} URL API configurée: $API_URL"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} URL API non configurée"
    ((ERRORS++))
fi

# Vérifier les variables d'environnement critiques
if grep -q "DATABASE_URL" backend/.env; then
    echo -e "${GREEN}✓${NC} DATABASE_URL configurée"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} DATABASE_URL manquante"
    ((ERRORS++))
fi

if grep -q "JWT_SECRET" backend/.env; then
    echo -e "${GREEN}✓${NC} JWT_SECRET configurée"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} JWT_SECRET manquante"
    ((ERRORS++))
fi

if grep -q "CLOUDINARY_CLOUD_NAME" backend/.env; then
    echo -e "${GREEN}✓${NC} Configuration Cloudinary présente"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠${NC} Configuration Cloudinary manquante"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Résumé${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Succès:${NC}        $SUCCESS"
echo -e "${YELLOW}Avertissements:${NC} $WARNINGS"
echo -e "${RED}Erreurs:${NC}       $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Le projet est prêt pour le déploiement sur O2Switch!${NC}"
    echo ""
    echo -e "${BLUE}Prochaines étapes:${NC}"
    echo "1. Configurer les informations SSH dans deploy-o2switch.sh"
    echo "2. Copier backend/.env.production.example vers backend/.env sur O2Switch"
    echo "3. Créer la base de données PostgreSQL sur O2Switch (ou utiliser Supabase)"
    echo "4. Lancer: ./deploy-o2switch.sh all"
    exit 0
else
    echo -e "${RED}✗ Le projet a $ERRORS erreur(s) à corriger avant le déploiement${NC}"
    exit 1
fi
