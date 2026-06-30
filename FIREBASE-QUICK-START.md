# 🚀 Démarrage Rapide - Migration Firebase

## 📋 Checklist de migration

### ✅ Prérequis
- [x] Export de la base de données effectué
- [ ] Compte Firebase créé
- [ ] Projet Firebase configuré
- [ ] Firestore activé
- [ ] Clés d'administration téléchargées

---

## 🎯 Étapes rapides (30 minutes)

### 1️⃣ Créer le projet Firebase (5 min)

1. Aller sur https://console.firebase.google.com/
2. Cliquer sur "Ajouter un projet"
3. Nom du projet : **MBOA NEXT STAR**
4. Suivre les étapes

### 2️⃣ Activer Firestore (3 min)

1. Dans le menu, cliquer sur "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Mode : **Production**
4. Région : **europe-west** (ou la plus proche du Cameroun)

### 3️⃣ Télécharger les credentials (2 min)

1. Paramètres du projet (icône engrenage) → "Comptes de service"
2. Cliquer sur "Générer une nouvelle clé privée"
3. Télécharger le fichier JSON
4. **Le placer dans** : `backend/config/mboa-firebase-adminsdk.json`

⚠️ **IMPORTANT** : Ne JAMAIS commit ce fichier dans Git !

### 4️⃣ Installer les dépendances (2 min)

```bash
cd backend
npm install firebase-admin
```

### 5️⃣ Configuration (5 min)

Créer le dossier et ajouter le fichier de credentials :

```bash
# Créer le dossier config
mkdir backend/config

# Placer le fichier téléchargé dans backend/config/
# Renommer en: mboa-firebase-adminsdk.json
```

Ajouter au `.gitignore` :

```bash
echo "backend/config/mboa-firebase-adminsdk.json" >> backend/.gitignore
```

### 6️⃣ Lancer la migration (10 min)

```bash
cd backend
npx tsx scripts/migrate-to-firebase.ts
```

**Le script va** :
- ✅ Lire l'export JSON
- ✅ Migrer toutes les tables vers Firestore
- ✅ Afficher les statistiques

### 7️⃣ Vérifier (3 min)

1. Ouvrir la console Firebase
2. Aller dans "Firestore Database"
3. Vérifier que les collections sont créées :
   - users
   - categories
   - candidates
   - votes
   - siteConfig
   - withdrawals
   - sponsors

---

## 📝 Fichiers à créer

Je vais créer automatiquement :

1. ✅ `backend/docs/firebase-migration-plan.md` - Plan complet
2. ⏳ `backend/src/config/firebase.ts` - Configuration Firebase
3. ⏳ `backend/scripts/migrate-to-firebase.ts` - Script de migration
4. ⏳ `backend/.gitignore` - Mise à jour pour exclure les credentials

---

## ⚡ Commandes rapides

```bash
# 1. Installation
cd backend && npm install firebase-admin

# 2. Migration
npx tsx scripts/migrate-to-firebase.ts

# 3. Vérification
npx tsx scripts/verify-firebase-migration.ts
```

---

## 🆘 En cas de problème

### Erreur : "Must supply api_key"
➡️ Le fichier `mboa-firebase-adminsdk.json` n'est pas au bon endroit ou mal nommé

### Erreur : "Permission denied"
➡️ Les règles de sécurité Firestore sont trop restrictives. Utiliser le mode Test temporairement.

### Erreur : "ENOENT: no such file"
➡️ Le chemin vers l'export JSON est incorrect. Vérifier le nom du fichier.

---

## 📞 Besoin d'aide ?

Consultez le plan complet : `backend/docs/firebase-migration-plan.md`

---

**Prêt à commencer ?** Suivez les étapes ci-dessus ! 🚀
