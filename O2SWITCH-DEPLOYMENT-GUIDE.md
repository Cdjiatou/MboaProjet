# Guide de Déploiement sur O2Switch

## Vue d'ensemble

Ce guide vous aidera à héberger votre application MBOA NEXT STAR sur O2Switch, en migrant depuis Vercel vers un hébergement cPanel avec Node.js.

## Architecture du Projet

- **Frontend** : Application React + Vite (statique)
- **Backend** : API Node.js + Express + Prisma
- **Base de données** : PostgreSQL (Supabase - peut rester ou migrer vers O2Switch)
- **Stockage média** : Cloudinary (reste inchangé)
- **WhatsApp** : Service Baileys (nécessite Node.js actif)

## Prérequis O2Switch

### 1. Vérifications à faire dans votre cPanel O2Switch

- ✅ **Node.js** : Version 18+ installée
- ✅ **PostgreSQL** : Base de données disponible (ou continuer avec Supabase)
- ✅ **PM2 ou Node.js App Manager** : Pour garder le backend actif
- ✅ **SSL/HTTPS** : Certificat Let's Encrypt
- ✅ **Accès SSH** : Pour déployer et gérer l'application

### 2. Domaines à configurer

- Domaine principal : `mboanextstar.com` (Frontend)
- Sous-domaine API : `api.mboanextstar.com` (Backend)

---

## Étape 1 : Préparer la Base de Données

### Option A : Utiliser PostgreSQL sur O2Switch

1. **Créer une base de données PostgreSQL dans cPanel**
   - Nom : `mboa_production`
   - Utilisateur : `mboa_user`
   - Mot de passe : (généré par cPanel)

2. **Obtenir l'URL de connexion**
   ```
   postgresql://mboa_user:PASSWORD@localhost:5432/mboa_production
   ```

3. **Importer les données**
   ```bash
   # Via SSH sur O2Switch
   psql -U mboa_user -d mboa_production -f mboa_db_export.sql
   ```

### Option B : Continuer avec Supabase (Recommandé pour débuter)

- Garder le `DATABASE_URL` actuel dans `.env`
- Aucune migration nécessaire
- Plus simple pour commencer

---

## Étape 2 : Préparer le Backend pour O2Switch

### 2.1 Créer un fichier de production


Créons un script de démarrage pour production :

```javascript
// backend/server.production.js
const app = require('./dist/index.js');
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MBOA Backend running on port ${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});
```

### 2.2 Modifier package.json pour la production

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "prod": "npm run build && npm start"
  }
}
```

### 2.3 Variables d'environnement pour O2Switch

Créer `.env.production` :

```env
# Port (O2Switch peut assigner un port spécifique)
PORT=3000

# Database (Supabase ou PostgreSQL O2Switch)
DATABASE_URL="postgresql://mboa_user:PASSWORD@localhost:5432/mboa_production"

# JWT Secret (CHANGER EN PRODUCTION!)
JWT_SECRET="NOUVEAU_SECRET_TRES_LONG_ET_SECURISE_12345"

# Mavians API
MAVIANS_API_KEY="pvk_pfp8rh|01KVX56SRT5TSN5A8W3X8V46E9"

# Cloudinary (même config)
CLOUDINARY_CLOUD_NAME="dlcrb5pat"
CLOUDINARY_API_KEY="284645167296527"
CLOUDINARY_API_SECRET="3x9Ugn1IkEbBLAX9Snb46x7Af2M"

# CORS Origins (mettre votre domaine)
FRONTEND_URL="https://mboanextstar.com"
```

---

## Étape 3 : Préparer le Frontend pour O2Switch

### 3.1 Configuration de production

Créer `Frontend/.env.production` :

```env
VITE_API_URL=https://api.mboanextstar.com
```

### 3.2 Build du Frontend

```bash
cd Frontend
npm run build
```

Cela crée un dossier `Frontend/dist/` avec les fichiers statiques.

---

## Étape 4 : Déploiement sur O2Switch

### 4.1 Structure des dossiers sur O2Switch

```
/home/votre_user/
├── public_html/                 # Domaine principal (Frontend)
│   ├── index.html
│   ├── assets/
│   └── ...
├── api/                         # Sous-domaine api (Backend)
│   ├── node_modules/
│   ├── dist/
│   ├── prisma/
│   ├── uploads/
│   ├── package.json
│   ├── .env
│   └── whatsapp-auth/
└── logs/
```

### 4.2 Déployer le Frontend

**Via SSH** :
```bash
# Sur votre machine locale
cd Frontend
npm run build

# Upload vers O2Switch
scp -r dist/* user@votre-serveur.o2switch.net:/home/user/public_html/
```

**Via cPanel File Manager** :
1. Compresser le dossier `Frontend/dist/` en ZIP
2. Upload dans cPanel → File Manager → `public_html/`
3. Extraire le ZIP
4. Supprimer le ZIP

### 4.3 Déployer le Backend

**Via SSH** :
```bash
# Se connecter à O2Switch
ssh user@votre-serveur.o2switch.net

# Créer le dossier API
cd /home/user
mkdir api
cd api

# Cloner ou uploader les fichiers
# (utiliser git clone ou scp)

# Installer les dépendances
npm install --production

# Build du TypeScript
npm run build

# Configurer les variables d'environnement
nano .env
# (coller le contenu de .env.production)

# Générer le client Prisma
npx prisma generate

# Synchroniser le schéma avec la DB
npx prisma db push
```

### 4.4 Configurer PM2 (Gestionnaire de processus)

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start dist/index.js --name mboa-backend

# Configurer le démarrage automatique
pm2 startup
pm2 save

# Vérifier le status
pm2 status
pm2 logs mboa-backend
```

---

## Étape 5 : Configuration cPanel

### 5.1 Configurer le sous-domaine API

1. **cPanel** → **Subdomains**
2. Créer : `api.mboanextstar.com`
3. Document Root : `/home/user/api/dist`

### 5.2 Configurer le proxy inverse (si nécessaire)

Créer `.htaccess` dans `/home/user/api/` :

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### 5.3 Activer SSL/HTTPS

1. **cPanel** → **SSL/TLS Status**
2. Activer AutoSSL pour :
   - `mboanextstar.com`
   - `api.mboanextstar.com`

### 5.4 Configurer Node.js App (si disponible)

Si O2Switch propose "Setup Node.js App" dans cPanel :

1. **cPanel** → **Setup Node.js App**
2. **Create Application** :
   - Node.js version : 18+
   - Application mode : Production
   - Application root : `/home/user/api`
   - Application URL : `api.mboanextstar.com`
   - Application startup file : `dist/index.js`
   - Environment variables : (ajouter toutes les variables .env)

---

## Étape 6 : Configuration CORS Backend

Modifier `backend/src/index.ts` pour accepter votre nouveau domaine :

```typescript
app.use(cors({
  origin: [
    'https://mboanextstar.com',
    'https://www.mboanextstar.com',
    'http://localhost:5173' // Pour le dev local
  ],
  credentials: true
}));
```

---

## Étape 7 : Tests Post-Déploiement

### 7.1 Tester le Backend

```bash
curl https://api.mboanextstar.com/api/health
```

Réponse attendue : `{"status":"ok"}`

### 7.2 Tester le Frontend

1. Ouvrir `https://mboanextstar.com`
2. Vérifier la console développeur (F12) pour les erreurs
3. Tester la connexion API (candidats, votes, etc.)

### 7.3 Tester WhatsApp

```bash
# Sur le serveur O2Switch
cd /home/user/api
pm2 logs mboa-backend

# Vérifier les logs WhatsApp
```

---

## Étape 8 : Migration de la Base de Données (Optionnel)

Si vous voulez migrer de Supabase vers PostgreSQL O2Switch :

### 8.1 Exporter depuis Supabase

```bash
# Sur votre machine locale
pg_dump "postgresql://postgres.sdqwttehgugafugapcmw:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres" > mboa_export.sql
```

### 8.2 Importer vers O2Switch

```bash
# Sur le serveur O2Switch
psql -U mboa_user -d mboa_production -f mboa_export.sql
```

### 8.3 Mettre à jour DATABASE_URL

```env
DATABASE_URL="postgresql://mboa_user:PASSWORD@localhost:5432/mboa_production"
```

---

## Commandes Utiles pour la Maintenance

### PM2 (Gestion du Backend)

```bash
# Redémarrer l'application
pm2 restart mboa-backend

# Voir les logs
pm2 logs mboa-backend

# Voir les métriques
pm2 monit

# Arrêter l'application
pm2 stop mboa-backend

# Supprimer du PM2
pm2 delete mboa-backend
```

### Mise à jour du code

```bash
# Backend
cd /home/user/api
git pull origin main
npm install
npm run build
pm2 restart mboa-backend

# Frontend
cd /home/user/public_html
# Upload les nouveaux fichiers ou git pull
```

---

## Checklist Finale

- [ ] Base de données PostgreSQL créée (ou Supabase configuré)
- [ ] Backend déployé dans `/home/user/api/`
- [ ] Frontend déployé dans `/home/user/public_html/`
- [ ] Variables d'environnement configurées (`.env`)
- [ ] PM2 configuré et application démarrée
- [ ] Sous-domaine `api.mboanextstar.com` créé
- [ ] SSL/HTTPS activé pour les deux domaines
- [ ] CORS configuré dans le backend
- [ ] Tests backend réussis (`/api/health`)
- [ ] Tests frontend réussis (navigation)
- [ ] WhatsApp connecté et fonctionnel

---

## Dépannage Courant

### Le backend ne démarre pas

```bash
# Vérifier les logs
pm2 logs mboa-backend

# Vérifier les variables d'environnement
cat /home/user/api/.env

# Vérifier les permissions
chmod -R 755 /home/user/api
```

### Erreur CORS

- Vérifier que `FRONTEND_URL` est correct dans `.env`
- Vérifier la configuration CORS dans `backend/src/index.ts`

### Base de données inaccessible

```bash
# Tester la connexion
psql -U mboa_user -d mboa_production

# Vérifier DATABASE_URL dans .env
```

### WhatsApp ne se connecte pas

```bash
# Vérifier les logs
pm2 logs mboa-backend | grep -i whatsapp

# Supprimer l'ancien auth et régénérer
rm -rf /home/user/api/whatsapp-auth
pm2 restart mboa-backend
```

---

## Support

- Documentation O2Switch : https://faq.o2switch.fr/
- Support O2Switch : support@o2switch.fr
- Node.js sur O2Switch : https://faq.o2switch.fr/hebergement-mutualise/nodejs

---

**Prochaine étape** : Voulez-vous que je crée les scripts de déploiement automatisés ou que je vous aide à configurer quelque chose de spécifique ?
