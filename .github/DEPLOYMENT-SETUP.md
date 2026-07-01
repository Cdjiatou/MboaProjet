# Configuration du Déploiement Automatique GitHub Actions

## 📋 Vue d'ensemble

Le pipeline GitHub Actions déploie automatiquement votre projet sur O2Switch à chaque push sur la branche `main`.

## 🔐 Configuration des Secrets GitHub

### Étape 1 : Accéder aux Secrets

1. Aller sur votre repository GitHub
2. Cliquer sur **Settings** (Paramètres)
3. Dans le menu de gauche : **Secrets and variables** → **Actions**
4. Cliquer sur **New repository secret**

### Étape 2 : Ajouter les Secrets

Créer ces secrets un par un :

#### Secrets FTP/SSH

| Nom du Secret | Valeur | Description |
|--------------|--------|-------------|
| `FTP_SERVER` | `cdiu8226.cdwfs.net` | Serveur FTP O2Switch |
| `FTP_USERNAME` | `cdiu8226` | Nom d'utilisateur FTP |
| `FTP_PASSWORD` | `[votre mot de passe]` | Mot de passe FTP |
| `SSH_HOST` | `cdiu8226.cdwfs.net` | Serveur SSH (ou hostname SSH trouvé) |
| `SSH_USERNAME` | `cdiu8226` | Nom d'utilisateur SSH |
| `SSH_PASSWORD` | `[votre mot de passe]` | Mot de passe SSH |

#### Secrets Base de Données

| Nom du Secret | Valeur |
|--------------|--------|
| `DATABASE_URL` | `postgresql://postgres.sdqwttehgugafugapcmw:Mboa%4012345%4025@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require` |

#### Secrets API

| Nom du Secret | Valeur |
|--------------|--------|
| `JWT_SECRET` | `GENERER_UNE_NOUVELLE_CLE_LONGUE_ET_ALEATOIRE` |
| `MAVIANS_API_KEY` | `pvk_pfp8rh\|01KVX56SRT5TSN5A8W3X8V46E9` |

#### Secrets Cloudinary

| Nom du Secret | Valeur |
|--------------|--------|
| `CLOUDINARY_CLOUD_NAME` | `dlcrb5pat` |
| `CLOUDINARY_API_KEY` | `284645167296527` |
| `CLOUDINARY_API_SECRET` | `3x9Ugn1IkEbBLAX9Snb46x7Af2M` |

#### Autres Secrets

| Nom du Secret | Valeur |
|--------------|--------|
| `FRONTEND_URL` | `http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar` |

### Étape 3 : Vérifier les Secrets

Une fois tous ajoutés, vous devriez avoir **12 secrets** au total :
- FTP_SERVER
- FTP_USERNAME
- FTP_PASSWORD
- SSH_HOST
- SSH_USERNAME
- SSH_PASSWORD
- DATABASE_URL
- JWT_SECRET
- MAVIANS_API_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- FRONTEND_URL

---

## 🚀 Utilisation du Pipeline

### Déploiement Automatique

À chaque fois que vous faites un `git push` sur la branche `main` :

```bash
git add .
git commit -m "Mise à jour du projet"
git push origin main
```

Le déploiement se lance automatiquement !

### Déploiement Manuel

1. Aller sur votre repository GitHub
2. Cliquer sur **Actions**
3. Sélectionner **Deploy to O2Switch**
4. Cliquer sur **Run workflow** → **Run workflow**

---

## 📊 Suivre le Déploiement

1. Aller sur **Actions** dans votre repository
2. Cliquer sur le workflow en cours
3. Voir les logs en temps réel

### Étapes du Pipeline

1. 📥 **Checkout code** - Récupération du code
2. 🔧 **Setup Node.js** - Installation de Node.js
3. 📦 **Build Frontend** - Compilation du frontend
4. 📦 **Build Backend** - Compilation du backend
5. 📋 **Prepare deployment files** - Préparation des fichiers
6. 🚀 **Deploy Frontend** - Upload FTP du frontend
7. 🚀 **Deploy Backend** - Upload FTP du backend
8. 🔄 **Install dependencies** - Installation via SSH
9. ✅ **Success** ou ❌ **Failed** - Résultat

---

## 🔍 Vérification Post-Déploiement

Après un déploiement réussi :

### Vérifier le Frontend
```
http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar/
```

### Vérifier le Backend (via SSH)
```bash
ssh cdiu8226@cdiu8226.cdwfs.net
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
pm2 status
pm2 logs mboa-backend
```

---

## 🆘 Dépannage

### Le workflow échoue sur "Deploy Frontend"

**Problème** : Erreur FTP de connexion

**Solution** :
- Vérifier `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
- Tester la connexion FTP manuellement avec FileZilla

### Le workflow échoue sur "Install dependencies"

**Problème** : SSH ne peut pas se connecter

**Solution** :
- Vérifier `SSH_HOST` (peut être différent de `FTP_SERVER`)
- Dans cPanel → SSH Access → noter le hostname exact
- Mettre à jour le secret `SSH_HOST`

### PM2 ne redémarre pas

**Problème** : Le backend ne se lance pas

**Solution SSH** :
```bash
ssh cdiu8226@cdiu8226.cdwfs.net
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api

# Voir les erreurs
pm2 logs mboa-backend --lines 50

# Redémarrer manuellement
pm2 restart mboa-backend

# Si nécessaire, supprimer et recréer
pm2 delete mboa-backend
pm2 start dist/index.js --name mboa-backend
pm2 save
```

### Les secrets ne sont pas chargés

**Problème** : Variables d'environnement manquantes

**Solution** :
- Vérifier que TOUS les secrets sont bien créés dans GitHub
- Les noms doivent être EXACTS (majuscules)
- Relancer le workflow après ajout des secrets

---

## 🔒 Sécurité

### ⚠️ Important

- **NE JAMAIS** commiter le fichier `.env` dans Git
- Utiliser uniquement les **GitHub Secrets** pour les données sensibles
- Le fichier `.env` est créé automatiquement pendant le déploiement

### .gitignore

Vérifier que `.env` est bien dans `.gitignore` :

```
# Backend
backend/.env
backend/.env.*
backend/node_modules

# Frontend  
Frontend/.env
Frontend/.env.*
Frontend/node_modules
Frontend/dist
```

---

## 📝 Modification du Pipeline

Pour modifier le pipeline :

1. Éditer `.github/workflows/deploy-o2switch.yml`
2. Commit et push les changements
3. Le nouveau workflow sera utilisé au prochain déploiement

### Exemples de Modifications

**Changer la branche de déploiement** :
```yaml
on:
  push:
    branches:
      - production  # Au lieu de main
```

**Ajouter des tests avant déploiement** :
```yaml
- name: 🧪 Run Tests
  working-directory: ./backend
  run: npm test
```

**Déployer uniquement le frontend** :
Commenter les étapes Backend dans le fichier YAML

---

## ✅ Checklist de Configuration

- [ ] Tous les secrets GitHub créés (12 au total)
- [ ] Fichier `.github/workflows/deploy-o2switch.yml` présent
- [ ] `.env` dans `.gitignore`
- [ ] Premier push sur `main` effectué
- [ ] Workflow exécuté avec succès
- [ ] Frontend accessible
- [ ] Backend PM2 actif
- [ ] Tests de l'application OK

---

**Votre pipeline de déploiement continu est maintenant configuré !** 🎉
