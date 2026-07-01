# 🚀 Déploiement Automatique - Résumé

## Ce qui a été créé

✅ **Pipeline GitHub Actions** : `.github/workflows/deploy-o2switch.yml`  
✅ **Guide de configuration** : `.github/DEPLOYMENT-SETUP.md`

## Comment ça marche ?

### 1️⃣ Configuration Initiale (À faire UNE FOIS)

**Ajouter les secrets dans GitHub** :

1. Aller sur votre repo GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Créer 12 secrets (voir liste ci-dessous)

### 2️⃣ Déploiement Automatique

Chaque fois que vous faites :
```bash
git add .
git commit -m "Mise à jour"
git push origin main
```

**Le pipeline se déclenche automatiquement et** :
1. ✅ Build le frontend
2. ✅ Build le backend  
3. ✅ Upload les fichiers via FTP
4. ✅ Installe les dépendances via SSH
5. ✅ Redémarre PM2

---

## 🔐 Liste des Secrets à Créer

| Secret | Valeur | Où le trouver ? |
|--------|--------|-----------------|
| `FTP_SERVER` | `cdiu8226.cdwfs.net` | cPanel → Comptes FTP |
| `FTP_USERNAME` | `cdiu8226` | Votre user O2Switch |
| `FTP_PASSWORD` | `[votre mot de passe]` | Votre mot de passe O2Switch |
| `SSH_HOST` | `cdiu8226.cdwfs.net` | cPanel → SSH Access |
| `SSH_USERNAME` | `cdiu8226` | Votre user O2Switch |
| `SSH_PASSWORD` | `[votre mot de passe]` | Votre mot de passe O2Switch |
| `DATABASE_URL` | `postgresql://...` | Votre `.env` actuel |
| `JWT_SECRET` | Nouvelle clé aléatoire | Générer une nouvelle |
| `MAVIANS_API_KEY` | `pvk_pfp8rh\|...` | Votre `.env` actuel |
| `CLOUDINARY_CLOUD_NAME` | `dlcrb5pat` | Votre `.env` actuel |
| `CLOUDINARY_API_KEY` | `284645167296527` | Votre `.env` actuel |
| `CLOUDINARY_API_SECRET` | `3x9Ugn1IkEbBLAX9...` | Votre `.env` actuel |
| `FRONTEND_URL` | `http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar` | URL de votre frontend |

---

## 🎯 Démarrage Rapide

### Étape 1 : Configurer les Secrets

```bash
# Sur GitHub:
Repo → Settings → Secrets and variables → Actions → New repository secret
```

Créer les 13 secrets ci-dessus

### Étape 2 : Push Initial

```bash
git add .
git commit -m "Configure CI/CD pipeline"
git push origin main
```

### Étape 3 : Vérifier

1. Aller sur **Actions** dans votre repo GitHub
2. Voir le workflow en cours d'exécution
3. Attendre le ✅ vert

### Étape 4 : Tester

Ouvrir : `http://cdiu8226.cdwfs.net/ngnipicba/MboaNexstar/`

---

## 📊 Suivre un Déploiement

1. **GitHub** → **Actions** → Cliquer sur le workflow
2. Voir les logs en temps réel
3. Chaque étape affiche sa progression

---

## 🔄 Workflow Complet

```
┌─────────────────────┐
│  git push origin    │
│       main          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  se déclenche       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Build Frontend     │
│  (npm run build)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Build Backend      │
│  (npm run build)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Upload via FTP     │
│  → O2Switch         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SSH: npm install   │
│  + PM2 restart      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ✅ Déploiement OK  │
│  Site mis à jour !  │
└─────────────────────┘
```

---

## 🆘 Si Ça Ne Marche Pas

### Erreur FTP
- Vérifier `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
- Tester avec FileZilla

### Erreur SSH
- `SSH_HOST` peut être différent de `FTP_SERVER`
- Vérifier dans cPanel → SSH Access
- Tester : `ssh cdiu8226@[SSH_HOST]`

### PM2 ne redémarre pas
```bash
ssh cdiu8226@cdiu8226.cdwfs.net
cd /home/cdiu8226/public_html/ngnipicba/MboaNexstar/api
pm2 logs mboa-backend
```

---

## 💡 Avantages

✅ **Déploiement en 1 commande** : `git push`  
✅ **Automatique** : Plus besoin de FileZilla  
✅ **Tracé** : Logs complets de chaque déploiement  
✅ **Rollback facile** : `git revert` + push  
✅ **Sécurisé** : Secrets chiffrés dans GitHub  

---

## 📚 Documentation Complète

Pour plus de détails, voir : `.github/DEPLOYMENT-SETUP.md`

---

**Prêt à déployer automatiquement !** 🎉
