# Structure des Dossiers sur O2Switch

## Architecture Complète

Votre projet MBOA NEXT STAR sera déployé sur O2Switch avec la structure suivante :

```
/home/cdiu8226/
├── public_html/
│   └── ngnipicba/
│       └── MboaNexstar/              # 🎯 RACINE DU PROJET
│           ├── index.html            # Frontend - Point d'entrée
│           ├── assets/               # CSS, JS, images du frontend
│           │   ├── index-xxxxx.js
│           │   ├── index-xxxxx.css
│           │   └── ...
│           ├── images/               # Images statiques
│           ├── .htaccess             # Configuration Apache (routing SPA)
│           │
│           └── api/                  # 🔧 BACKEND API
│               ├── dist/             # Code TypeScript compilé
│               │   ├── index.js
│               │   ├── config/
│               │   ├── controllers/
│               │   ├── services/
│               │   ├── routes/
│               │   └── ...
│               ├── node_modules/     # Dépendances Node.js
│               ├── prisma/           # Schéma et migrations DB
│               │   └── schema.prisma
│               ├── uploads/          # Uploads temporaires (avant Cloudinary)
│               │   ├── temp/
│               │   ├── candidates/
│               │   └── sponsors/
│               ├── whatsapp-auth/    # Session WhatsApp
│               ├── package.json
│               ├── .env              # Variables d'environnement
│               └── .htaccess         # Proxy vers Node.js
│
└── logs/                             # Logs PM2 (optionnel)
    └── mboa-backend-*.log
```

## URLs d'Accès

### Option 1 : Accès via sous-dossier (par défaut)
- **Frontend** : `https://votre-domaine.com/ngnipicba/MboaNexstar/`
- **Backend API** : `https://votre-domaine.com/ngnipicba/MboaNexstar/api/`

### Option 2 : Configurer un sous-domaine (recommandé)
- **Frontend** : `https://mboanextstar.votre-domaine.com`
- **Backend API** : `https://api.mboanextstar.votre-domaine.com`

Pour configurer l'option 2, dans cPanel :
1. **Sous-domaines** → Créer `mboanextstar`
2. Document Root : `/home/cdiu8226/public_html/ngnipicba/MboaNexstar`
3. **Sous-domaines** → Créer `api.mboanextstar`
4. Document Root : `/home/cdiu8226/public_html/ngnipicba/MboaNexstar/api`

## Fichiers Importants

### Frontend (.htaccess)
```apache
RewriteEngine On
RewriteBase /ngnipicba/MboaNexstar/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /ngnipicba/MboaNexstar/index.html [L]
```

### Backend (.env)
```env
PORT=3000
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
CLOUDINARY_CLOUD_NAME="dlcrb5pat"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
FRONTEND_URL="https://votre-domaine.com/ngnipicba/MboaNexstar"
NODE_ENV="production"
```

### Backend (.htaccess)
```apache
RewriteEngine On
RewriteBase /ngnipicba/MboaNexstar/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## Gestion PM2

```bash
# Démarrer l'application
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
pm2 start dist/index.js --name mboa-backend

# Voir les logs
pm2 logs mboa-backend

# Redémarrer
pm2 restart mboa-backend

# Status
pm2 status
```

## Permissions

Assurez-vous que les permissions sont correctes :

```bash
# Tous les fichiers frontend
chmod -R 755 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/

# Dossier API
chmod -R 755 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/

# Dossiers uploads (écriture)
chmod -R 777 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/uploads/
chmod -R 777 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/whatsapp-auth/
```

## Déploiement

Le script `deploy-o2switch.sh` créera automatiquement cette structure :

```bash
# Vérifier la préparation
./check-o2switch-readiness.sh

# Déployer tout
./deploy-o2switch.sh all
```

Les fichiers seront automatiquement uploadés dans :
- Frontend → `/home/cdiu8226/public_html/ngnipicba/MboaNexstar/`
- Backend → `/home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/`
