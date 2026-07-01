# ✅ Checklist de Déploiement O2Switch

## Préparation Locale (sur votre machine)

- [ ] Installer les dépendances
  ```bash
  cd backend && npm install
  cd ../Frontend && npm install
  ```

- [ ] Tester le build local
  ```bash
  ./check-o2switch-readiness.sh
  ```

- [ ] Vérifier que les fichiers suivants existent :
  - [ ] `deploy-o2switch.sh`
  - [ ] `Frontend/.env.production`
  - [ ] `backend/.env.production.example`
  - [ ] `Frontend/.htaccess`
  - [ ] `backend/.htaccess.o2switch`

- [ ] Rendre le script exécutable
  ```bash
  chmod +x deploy-o2switch.sh
  chmod +x check-o2switch-readiness.sh
  ```

---

## Configuration SSH (Première fois uniquement)

- [ ] Tester la connexion SSH
  ```bash
  ssh cdiu8226@cdiu8226.o2switch.net
  ```

- [ ] (Optionnel) Configurer une clé SSH pour éviter de taper le mot de passe
  ```bash
  # Sur votre machine locale
  ssh-keygen -t rsa -b 4096
  ssh-copy-id cdiu8226@cdiu8226.o2switch.net
  ```

---

## Configuration sur O2Switch

### 1. Créer la structure de dossiers (via SSH)

```bash
ssh cdiu8226@cdiu8226.o2switch.net

# Créer la structure
mkdir -p /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
mkdir -p /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/uploads/temp
mkdir -p /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/whatsapp-auth

# Permissions
chmod -R 755 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/
chmod -R 777 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/uploads/
chmod -R 777 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/whatsapp-auth/
```

- [ ] Structure de dossiers créée

### 2. Configurer les variables d'environnement Backend

```bash
# Toujours connecté en SSH
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
nano .env
```

Coller cette configuration :

```env
PORT=3000
DATABASE_URL="postgresql://postgres.sdqwttehgugafugapcmw:Mboa%4012345%4025@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
JWT_SECRET="mboa_production_secret_key_2026_super_secure_12345"
MAVIANS_API_KEY="pvk_pfp8rh|01KVX56SRT5TSN5A8W3X8V46E9"
CLOUDINARY_CLOUD_NAME="dlcrb5pat"
CLOUDINARY_API_KEY="284645167296527"
CLOUDINARY_API_SECRET="3x9Ugn1IkEbBLAX9Snb46x7Af2M"
FRONTEND_URL="https://ngnipicba.com/ngnipicba/MboaNexstar"
NODE_ENV="production"
```

Sauvegarder : `Ctrl+O`, `Enter`, `Ctrl+X`

- [ ] Fichier `.env` créé et configuré

### 3. Installer Node.js et PM2 (si pas déjà fait)

```bash
# Vérifier la version Node.js
node --version  # Doit être 18+

# Installer PM2 globalement
npm install -g pm2
```

- [ ] Node.js installé (version 18+)
- [ ] PM2 installé

### 4. Mettre à jour l'URL de l'API dans Frontend

Sur votre machine locale, éditer `Frontend/.env.production` :

```env
VITE_API_URL=https://ngnipicba.com/ngnipicba/MboaNexstar/api
```

- [ ] URL API mise à jour

---

## Déploiement

### 1. Lancer le déploiement

Sur votre machine locale :

```bash
# Déployer tout (Frontend + Backend)
./deploy-o2switch.sh all
```

Ou étape par étape :

```bash
# 1. Frontend d'abord
./deploy-o2switch.sh frontend

# 2. Backend ensuite
./deploy-o2switch.sh backend
```

- [ ] Frontend dé