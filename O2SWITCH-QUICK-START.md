# Démarrage Rapide - Déploiement O2Switch

## 🚀 En 5 étapes

### 1️⃣ Préparer les fichiers localement

```bash
# Vérifier que tout est prêt
chmod +x check-o2switch-readiness.sh
./check-o2switch-readiness.sh

# Si OK, rendre le script de déploiement exécutable
chmod +x deploy-o2switch.sh
```

### 2️⃣ Configurer vos identifiants O2Switch

Éditer `deploy-o2switch.sh` et modifier :

```bash
O2SWITCH_USER="votre_user"              # Votre nom d'utilisateur O2Switch
O2SWITCH_HOST="votre-serveur.o2switch.net"  # Votre serveur O2Switch
```

### 3️⃣ Préparer la base de données

**Option A : Utiliser Supabase (Recommandé - plus simple)**
- Garder la configuration actuelle
- Rien à faire, déjà configuré !

**Option B : PostgreSQL sur O2Switch**
1. Connectez-vous à cPanel
2. **Bases de données PostgreSQL** → Créer une base
3. Nom : `mboa_production`
4. Créer un utilisateur et lui donner tous les privilèges
5. Noter l'URL : `postgresql://user:pass@localhost:5432/mboa_production`

### 4️⃣ Configurer les variables d'environnement sur O2Switch

Via SSH sur O2Switch :

```bash
# Se connecter
ssh votre_user@votre-serveur.o2switch.net

# Créer le dossier API
mkdir -p /home/votre_user/api
cd /home/votre_user/api

# Créer le fichier .env
nano .env
```

Coller cette configuration :

```env
PORT=3000
DATABASE_URL="postgresql://postgres.sdqwttehgugafugapcmw:Mboa%4012345%4025@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
JWT_SECRET="GENERER_UNE_NOUVELLE_CLE_LONGUE_ET_ALEATOIRE"
MAVIANS_API_KEY="pvk_pfp8rh|01KVX56SRT5TSN5A8W3X8V46E9"
CLOUDINARY_CLOUD_NAME="dlcrb5pat"
CLOUDINARY_API_KEY="284645167296527"
CLOUDINARY_API_SECRET="3x9Ugn1IkEbBLAX9Snb46x7Af2M"
FRONTEND_URL="https://mboanextstar.com"
NODE_ENV="production"
```

**⚠️ IMPORTANT** : Changer le `JWT_SECRET` par une nouvelle valeur aléatoire !

### 5️⃣ Déployer !

Sur votre machine locale :

```bash
# Déployer tout (Frontend + Backend)
./deploy-o2switch.sh all

# Ou déployer séparément
./deploy-o2switch.sh frontend
./deploy-o2switch.sh backend
```

---

## 🔧 Configuration cPanel après le déploiement

### A. Configurer les domaines

1. **Domaine principal (Frontend)**
   - cPanel → **Domaines**
   - Pointer `mboanextstar.com` vers `/home/votre_user/public_html`

2. **Sous-domaine API (Backend)**
   - cPanel → **Sous-domaines**
   - Créer : `api.mboanextstar.com`
   - Document Root : `/home/votre_user/api`

### B. Activer SSL/HTTPS

1. cPanel → **SSL/TLS Status**
2. Activer AutoSSL pour :
   - ✅ `mboanextstar.com`
   - ✅ `api.mboanextstar.com`

### C. Démarrer le Backend avec PM2

Via SSH :

```bash
# Se connecter
ssh votre_user@votre-serveur.o2switch.net

# Aller dans le dossier API
cd /home/votre_user/api

# Installer PM2 globalement (si pas déjà fait)
npm install -g pm2

# Démarrer l'application
pm2 start dist/index.js --name mboa-backend

# Configurer le redémarrage automatique
pm2 startup
pm2 save

# Vérifier le statut
pm2 status
pm2 logs mboa-backend
```

---

## ✅ Tests Post-Déploiement

### 1. Tester le Backend

```bash
# Test simple
curl https://api.mboanextstar.com/

# Devrait retourner :
# {"success":true,"message":"API MBOA NEXT STAR opérationnelle."}
```

### 2. Tester le Frontend

1. Ouvrir `https://mboanextstar.com` dans le navigateur
2. Ouvrir la console développeur (F12)
3. Vérifier qu'il n'y a pas d'erreurs CORS ou API
4. Tester la navigation (candidats, votes, etc.)

### 3. Tester WhatsApp

```bash
# Sur le serveur O2Switch
pm2 logs mboa-backend | grep -i whatsapp

# Scanner le QR code si nécessaire
```

---

## 🔄 Mises à jour futures

Pour mettre à jour le code après des modifications :

```bash
# Sur votre machine locale
./deploy-o2switch.sh all

# Ou seulement le backend
./deploy-o2switch.sh backend

# Ou seulement le frontend
./deploy-o2switch.sh frontend
```

---

## 🆘 Dépannage Rapide

### Le backend ne démarre pas

```bash
# Voir les logs
pm2 logs mboa-backend

# Redémarrer
pm2 restart mboa-backend

# Si ça ne marche toujours pas
pm2 delete mboa-backend
cd /home/votre_user/api
pm2 start dist/index.js --name mboa-backend
```

### Erreur CORS (Frontend ne peut pas accéder à l'API)

1. Vérifier que `FRONTEND_URL` est correct dans `/home/votre_user/api/.env`
2. Redémarrer le backend : `pm2 restart mboa-backend`

### Base de données inaccessible

```bash
# Tester la connexion
psql -U mboa_user -d mboa_production

# Vérifier DATABASE_URL dans .env
cat /home/votre_user/api/.env | grep DATABASE_URL
```

---

## 📞 Support

- **Documentation complète** : `O2SWITCH-DEPLOYMENT-GUIDE.md`
- **FAQ O2Switch** : https://faq.o2switch.fr/
- **Support O2Switch** : support@o2switch.fr

---

**Votre projet est maintenant hébergé sur O2Switch !** 🎉
