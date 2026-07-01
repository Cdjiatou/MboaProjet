# Déploiement Manuel depuis Windows vers O2Switch

## Prérequis

1. **WinSCP** ou **FileZilla** (pour transférer les fichiers)
2. **PuTTY** (pour SSH)
3. Identifiants O2Switch :
   - User : `cdiu8226`
   - Host : `cdiu8226.cdwfs.net`
   - Mot de passe : (votre mot de passe O2Switch)

---

## Étape 1 : Build en Local

### 1.1 Build du Frontend

Ouvrir PowerShell dans le dossier du projet :

```powershell
cd Frontend
npm run build
```

Cela crée le dossier `Frontend/dist/`

### 1.2 Build du Backend

```powershell
cd ../backend
npm run build
```

Cela crée le dossier `backend/dist/`

---

## Étape 2 : Préparer les fichiers

### 2.1 Frontend

Fichiers à uploader depuis `Frontend/dist/` :
- Tous les fichiers (index.html, assets/, images/, etc.)
- Le fichier `Frontend/.htaccess`

### 2.2 Backend

Fichiers à uploader depuis `backend/` :
- Le dossier `dist/` (compilé)
- Le dossier `prisma/`
- Les fichiers :
  - `package.json`
  - `package-lock.json`
  - `.env`
  - `.htaccess.o2switch` (à renommer en `.htaccess`)

---

## Étape 3 : Upload avec WinSCP/FileZilla

### 3.1 Connexion

**WinSCP** :
1. Protocole : SFTP
2. Nom d'hôte : `cdiu8226.cdwfs.net`
3. Utilisateur : `cdiu8226`
4. Mot de passe : [votre mot de passe]
5. Port : 22

### 3.2 Créer la structure

Sur le serveur, créer la structure :

```
/home/cdiu8226/public_html/ngnipicba/MboaNexstar/
```

### 3.3 Upload Frontend

1. Aller dans `/home/cdiu8226/public_html/ngnipicba/MboaNexstar/`
2. Uploader tous les fichiers de `Frontend/dist/`
3. Uploader `Frontend/.htaccess`

### 3.4 Upload Backend

1. Créer le dossier : `/home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/`
2. Uploader :
   - `backend/dist/` → vers `api/dist/`
   - `backend/prisma/` → vers `api/prisma/`
   - `backend/package.json` → vers `api/package.json`
   - `backend/package-lock.json` → vers `api/package-lock.json`
   - `backend/.env` → vers `api/.env`
   - `backend/.htaccess.o2switch` → vers `api/.htaccess`

---

## Étape 4 : Configuration SSH avec PuTTY

### 4.1 Connexion SSH

1. Ouvrir **PuTTY**
2. Host : `cdiu8226.cdwfs.net`
3. Port : 22
4. Cliquer **Open**
5. Login : `cdiu8226`
6. Password : [votre mot de passe]

### 4.2 Installation des dépendances Backend

```bash
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

# Installer les dépendances
npm install --production

# Générer le client Prisma
npx prisma generate

# Créer les dossiers nécessaires
mkdir -p uploads/temp uploads/candidates uploads/sponsors whatsapp-auth
chmod -R 777 uploads whatsapp-auth
```

### 4.3 Démarrer le Backend avec PM2

```bash
# Installer PM2 (si pas déjà installé)
npm install -g pm2

# Démarrer l'application
pm2 start dist/index.js --name mboa-backend --cwd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

# Sauvegarder la config PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup

# Vérifier le statut
pm2 status
pm2 logs mboa-backend
```

---

## Étape 5 : Configuration du domaine (cPanel)

### 5.1 Si vous avez un domaine

1. **cPanel** → **Domaines**
2. Pointer votre domaine vers `/home/cdiu8226/public_html/ngnipicba/MboaNexstar`

### 5.2 Si vous utilisez le sous-dossier

L'application sera accessible via :
```
http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar/
```

---

## Étape 6 : Vérification

### 6.1 Tester le Backend

Dans PuTTY :
```bash
curl http://localhost:3000/
```

Devrait retourner :
```json
{"success":true,"message":"API MBOA NEXT STAR opérationnelle."}
```

### 6.2 Tester le Frontend

Ouvrir dans le navigateur :
```
http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar/
```

---

## Commandes Utiles (PuTTY)

### Voir les logs du Backend
```bash
pm2 logs mboa-backend
```

### Redémarrer le Backend
```bash
pm2 restart mboa-backend
```

### Arrêter le Backend
```bash
pm2 stop mboa-backend
```

### Voir le statut
```bash
pm2 status
```

### Mise à jour du code

Après avoir uploadé de nouveaux fichiers :

```bash
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
npm install --production
npx prisma generate
pm2 restart mboa-backend
```

---

## Dépannage

### Le backend ne démarre pas

```bash
# Voir les logs
pm2 logs mboa-backend --lines 100

# Vérifier les permissions
chmod -R 755 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
chmod -R 777 /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/uploads
```

### Erreur "Module not found"

```bash
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
rm -rf node_modules
npm install --production
pm2 restart mboa-backend
```

### Base de données inaccessible

Vérifier le fichier `.env` :
```bash
cat /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api/.env
```

Assurez-vous que `DATABASE_URL` est correct.

---

## Alternative : Utiliser Git Bash

Si vous avez Git installé, vous pouvez utiliser le script bash :

1. Ouvrir **Git Bash** dans le dossier du projet
2. Lancer :
```bash
./deploy-o2switch.sh all
```

C'est beaucoup plus rapide que le déploiement manuel !

---

**Voilà ! Votre application est maintenant sur O2Switch** 🚀
