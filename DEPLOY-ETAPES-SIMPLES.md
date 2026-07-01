# 🚀 Déploiement O2Switch - Guide Simple

## ✅ Fichiers Préparés

J'ai créé 2 fichiers ZIP prêts à uploader :

1. **`frontend_o2switch.zip`** - Tout le frontend compilé
2. **`backend_o2switch.zip`** - Backend + dépendances

---

## 📋 Étapes de Déploiement

### ÉTAPE 1 : Télécharger FileZilla

1. Aller sur : https://filezilla-project.org/download.php?type=client
2. Télécharger **FileZilla Client** (gratuit)
3. Installer

### ÉTAPE 2 : Se Connecter à O2Switch

Dans FileZilla :

1. Cliquer sur **Fichier** → **Gestionnaire de Sites** → **Nouveau site**

2. Configurer :
   ```
   Protocole : FTP - Protocole de transfert de fichiers
   Hôte : cdiu8226.cdwfs.net  (ou ftp.cdiu8226.cdwfs.net)
   Port : 21
   Chiffrement : Utiliser FTP explicite sur TLS si disponible
   Type d'authentification : Normal
   Identifiant : cdiu8226
   Mot de passe : [votre mot de passe O2Switch]
   ```

3. Cliquer **Connexion**

### ÉTAPE 3 : Créer la Structure

Dans FileZilla, côté **SERVEUR (droite)** :

1. Double-cliquer sur **`public_html`**
2. Double-cliquer sur **`ngnipicba`**
3. **Clic droit** → **Créer un dossier** → Nom : **`MboaNexstar`**
4. Entrer dans **`MboaNexstar`**
5. **Clic droit** → **Créer un dossier** → Nom : **`api`**

Vous devriez avoir :
```
public_html/
  └── ngnipicba/
      └── MboaNexstar/
          └── api/
```

### ÉTAPE 4 : Upload Frontend

Côté **LOCAL (gauche)** :

1. Naviguer vers votre projet : `D:\Mes projets\MboaProjet`
2. Trouver le fichier **`frontend_o2switch.zip`**

Côté **SERVEUR (droite)** :

3. Être dans `/public_html/ngnipicba/MboaNexstar/`
4. **Glisser-déposer** `frontend_o2switch.zip` vers le serveur
5. Attendre la fin du transfert
6. **Clic droit** sur `frontend_o2switch.zip` → **Extraire** ou **Décompresser**
7. Supprimer `frontend_o2switch.zip` après extraction

### ÉTAPE 5 : Upload .htaccess Frontend

Côté **LOCAL** :

1. Aller dans `Frontend/` (votre projet local)
2. Trouver le fichier **`.htaccess`** (fichier caché, activer "Afficher les fichiers cachés")

Côté **SERVEUR** :

3. Être dans `/public_html/ngnipicba/MboaNexstar/`
4. **Glisser-déposer** le fichier `.htaccess`

### ÉTAPE 6 : Upload Backend

Côté **LOCAL** :

1. Revenir à `D:\Mes projets\MboaProjet`
2. Trouver **`backend_o2switch.zip`**

Côté **SERVEUR** :

3. Aller dans `/public_html/ngnipicba/MboaNexstar/api/`
4. **Glisser-déposer** `backend_o2switch.zip`
5. Attendre la fin du transfert
6. **Clic droit** → **Extraire**
7. Supprimer `backend_o2switch.zip` après extraction

### ÉTAPE 7 : Renommer .htaccess Backend

Côté **SERVEUR** dans `/public_html/ngnipicba/MboaNexstar/api/` :

1. Trouver le fichier **`.htaccess.o2switch`**
2. **Clic droit** → **Renommer** → `.htaccess`

---

## 🔧 ÉTAPE 8 : Configuration SSH (Terminal cPanel)

### Option A : Terminal Web cPanel

1. Se connecter à **cPanel** : https://cpanel.o2switch.net
2. Chercher **"Terminal"** ou **"SSH Terminal"**
3. Ouvrir le terminal web

### Option B : PuTTY (si vous avez le hostname SSH)

1. Télécharger PuTTY : https://www.putty.org/
2. Host : [hostname SSH trouvé dans cPanel]
3. Login : `cdiu8226`

### Commandes à Exécuter

```bash
# 1. Aller dans le dossier API
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

# 2. Installer les dépendances Node.js
npm install --production

# 3. Générer le client Prisma
npx prisma generate

# 4. Créer les dossiers nécessaires
mkdir -p uploads/temp uploads/candidates uploads/sponsors whatsapp-auth

# 5. Donner les permissions
chmod -R 777 uploads whatsapp-auth

# 6. Installer PM2 (gestionnaire de processus)
npm install -g pm2

# 7. Démarrer le backend
pm2 start dist/index.js --name mboa-backend --cwd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

# 8. Sauvegarder la configuration PM2
pm2 save

# 9. Configurer le démarrage automatique
pm2 startup

# 10. Vérifier que tout tourne
pm2 status
pm2 logs mboa-backend
```

---

## ✅ ÉTAPE 9 : Tester

### Test Backend (dans le terminal)

```bash
curl http://localhost:3000/
```

Devrait retourner :
```json
{"success":true,"message":"API MBOA NEXT STAR opérationnelle."}
```

### Test Frontend (navigateur)

Ouvrir :
```
http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar/
```

---

## 🎯 Checklist Finale

- [ ] Frontend uploadé et extrait
- [ ] `.htaccess` frontend copié
- [ ] Backend uploadé et extrait
- [ ] `.htaccess.o2switch` renommé en `.htaccess`
- [ ] `npm install` exécuté
- [ ] `npx prisma generate` exécuté
- [ ] Dossiers `uploads/` et `whatsapp-auth/` créés
- [ ] PM2 installé et backend démarré
- [ ] Backend répond sur `localhost:3000`
- [ ] Frontend accessible dans le navigateur

---

## 🆘 Problèmes Courants

### FileZilla ne se connecte pas

- Essayer avec **SFTP** au lieu de FTP (Port 22)
- Vérifier le hostname dans cPanel → Section FTP

### "npm: command not found"

Node.js n'est pas installé. Dans cPanel :
- Chercher **"Setup Node.js App"**
- Créer une application Node.js

### PM2 ne démarre pas

```bash
# Voir les logs
pm2 logs mboa-backend --lines 50

# Redémarrer
pm2 restart mboa-backend

# Si ça ne marche toujours pas
pm2 delete mboa-backend
pm2 start dist/index.js --name mboa-backend
```

---

**Suivez ces étapes et votre application sera en ligne !** 🎉
