# Déploiement via FTP (Plus Simple pour O2Switch)

## Étape 1 : Build en local

Dans Git Bash ou PowerShell :

```bash
# Frontend
cd Frontend
npm run build

# Backend  
cd ../backend
npm run build
cd ..
```

## Étape 2 : Télécharger FileZilla ou WinSCP

- **FileZilla** : https://filezilla-project.org/
- **WinSCP** : https://winscp.net/

## Étape 3 : Connexion FTP

### Informations de connexion

Dans votre cPanel O2Switch, cherchez :
- **Comptes FTP** ou **Gestionnaire FTP**
- Hôte : probablement `ftp.cdiu8226.cdwfs.net` ou voir dans cPanel
- Utilisateur : `cdiu8226`
- Mot de passe : [votre mot de passe]
- Port : 21 (FTP) ou 22 (SFTP)

### Configuration FileZilla

1. **Fichier** → **Gestionnaire de Sites**
2. **Nouveau site**
3. Configurer :
   - Protocole : **SFTP** (recommandé) ou **FTP**
   - Hôte : [à vérifier dans cPanel]
   - Port : 22 (SFTP) ou 21 (FTP)
   - Identifiant : `cdiu8226`
   - Mot de passe : [votre mot de passe]
4. **Connexion**

## Étape 4 : Upload des fichiers

### 4.1 Créer la structure

Sur le serveur (panneau droit de FileZilla) :

```
Aller dans : /public_html/ngnipicba/
Créer dossier : MboaNexstar
```

### 4.2 Upload Frontend

Depuis votre PC (panneau gauche) → Vers serveur (panneau droit) :

```
Frontend/dist/* 
  → /public_html/ngnipicba/MboaNexstar/

Frontend/.htaccess
  → /public_html/ngnipicba/MboaNexstar/.htaccess
```

### 4.3 Upload Backend

```
Créer : /public_html/ngnipicba/MboaNexstar/api/

backend/dist/
  → /public_html/ngnipicba/MboaNexstar/api/dist/

backend/prisma/
  → /public_html/ngnipicba/MboaNexstar/api/prisma/

backend/package.json
  → /public_html/ngnipicba/MboaNexstar/api/package.json

backend/package-lock.json
  → /public_html/ngnipicba/MboaNexstar/api/package-lock.json

backend/.env
  → /public_html/ngnipicba/MboaNexstar/api/.env

backend/.htaccess.o2switch
  → /public_html/ngnipicba/MboaNexstar/api/.htaccess
```

## Étape 5 : Configuration SSH (Terminal dans cPanel)

O2Switch propose un **Terminal SSH dans cPanel** :

1. Connexion à **cPanel**
2. Chercher **"Terminal"** ou **"SSH Access"**
3. Lancer le terminal web

Ou utiliser **PuTTY** si vous trouvez le bon hostname SSH.

### Commandes à exécuter

```bash
# Aller dans le dossier API
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

# Installer les dépendances
npm install --production

# Générer Prisma
npx prisma generate

# Créer les dossiers
mkdir -p uploads/temp uploads/candidates uploads/sponsors whatsapp-auth
chmod -R 777 uploads whatsapp-auth

# Démarrer avec PM2
npm install -g pm2
pm2 start dist/index.js --name mboa-backend
pm2 save
pm2 startup
```

## Étape 6 : Tester

Ouvrir dans le navigateur :
```
http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar/
```

---

## Alternative : Chercher les bonnes infos SSH

Dans votre **cPanel**, cherchez :
- Section **"SSH Access"** ou **"Accès SSH"**
- Vous devriez y trouver le bon hostname

Types possibles :
- `ssh.cluster0XX.o2switch.net`
- `cdiu8226.o2switch.net`
- Votre domaine principal si configuré

Une fois trouvé, je mettrai à jour le script `deploy-o2switch.sh` !
