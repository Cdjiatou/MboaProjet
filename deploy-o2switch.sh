#!/bin/bash

# Script de déploiement automatisé pour O2Switch
# Usage: ./deploy-o2switch.sh [frontend|backend|all]

set -e  # Arrêter en cas d'erreur

# Configuration O2Switch
O2SWITCH_USER="cdiu8226"
O2SWITCH_HOST="cdwfs.net"
O2SWITCH_FRONTEND_PATH="/home/cdiu8226/public_html/ngnipicba/MboaNexstar"
O2SWITCH_BACKEND_PATH="/home/cdiu8226/public_html/ngnipicba/MboaNexstar/api"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'affichage
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction de déploiement Frontend
deploy_frontend() {
    log_info "🚀 Déploiement du Frontend..."
    
    # Build du frontend
    log_info "📦 Build du frontend..."
    cd Frontend
    npm run build
    
    # Compression pour upload plus rapide
    log_info "📦 Compression des fichiers..."
    cd dist
    tar -czf frontend.tar.gz *
    
    # Upload vers O2Switch
    log_info "📤 Upload vers O2Switch..."
    scp frontend.tar.gz $O2SWITCH_USER@$O2SWITCH_HOST:$O2SWITCH_FRONTEND_PATH/
    
    # Upload du .htaccess aussi
    log_info "� Upload ide .htaccess..."
    scp ../.htaccess $O2SWITCH_USER@$O2SWITCH_HOST:$O2SWITCH_FRONTEND_PATH/
    
    # Extraction sur le serveur
    log_info "📂 Extraction sur le serveur..."
    ssh $O2SWITCH_USER@$O2SWITCH_HOST << EOF
# Créer la structure de dossiers
mkdir -p $O2SWITCH_FRONTEND_PATH

cd $O2SWITCH_FRONTEND_PATH
tar -xzf frontend.tar.gz
rm frontend.tar.gz
chmod -R 755 *

echo "📄 Configuration .htaccess installée"
EOF
    
    # Nettoyage local
    rm frontend.tar.gz
    cd ../..
    
    log_info "✅ Frontend déployé avec succès!"
}

# Fonction de déploiement Backend
deploy_backend() {
    log_info "🚀 Déploiement du Backend..."
    
    # Build du backend
    log_info "📦 Build du backend..."
    cd backend
    npm run build
    
    # Compression pour upload
    log_info "📦 Compression des fichiers..."
    tar -czf backend.tar.gz dist/ prisma/ package.json package-lock.json .env .htaccess.o2switch
    
    # Upload vers O2Switch
    log_info "📤 Upload vers O2Switch..."
    scp backend.tar.gz $O2SWITCH_USER@$O2SWITCH_HOST:/home/cdiu8226/public_html/ngnipicba/
    
    # Extraction et installation sur le serveur
    log_info "📂 Extraction et installation sur le serveur..."
    ssh $O2SWITCH_USER@$O2SWITCH_HOST << 'ENDSSH'
# Créer la structure de dossiers
mkdir -p /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
tar -xzf ../../../backend.tar.gz
rm ../../../backend.tar.gz

# Renommer .htaccess.o2switch en .htaccess
if [ -f ".htaccess.o2switch" ]; then
    mv .htaccess.o2switch .htaccess
    echo "✅ .htaccess configuré"
fi

# Installation des dépendances
echo "� Iénstallation des dépendances..."
npm install --production

# Génération du client Prisma
echo "� Générartion du client Prisma..."
npx prisma generate

# Créer les dossiers nécessaires
mkdir -p uploads/temp uploads/candidates uploads/sponsors whatsapp-auth
chmod -R 777 uploads whatsapp-auth

# Redémarrage de l'application avec PM2
echo "🔄 Redémarrage de l'application..."
if pm2 list | grep -q "mboa-backend"; then
    pm2 restart mboa-backend
else
    pm2 start dist/index.js --name mboa-backend --cwd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
    pm2 save
fi

echo "✅ Backend redémarré avec succès!"
pm2 status
ENDSSH
    
    cd ..
    
    log_info "✅ Backend déployé avec succès!"
}

# Menu principal
case "$1" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo "Usage: $0 {frontend|backend|all}"
        echo ""
        echo "  frontend  - Déployer uniquement le frontend"
        echo "  backend   - Déployer uniquement le backend"
        echo "  all       - Déployer frontend et backend"
        exit 1
        ;;
esac

log_info "🎉 Déploiement terminé!"
log_info "📁 Structure créée dans: public_html/ngnipicba/MboaNexstar/"
log_info "🌐 Frontend: Le frontend sera accessible selon la configuration de votre domaine"
log_info "🔧 Backend: L'API Node.js tourne via PM2 sur le port 3000"
