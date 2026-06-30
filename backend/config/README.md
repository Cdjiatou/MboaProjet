# 🔐 Configuration Firebase

## 📁 Ce dossier contient

- `mboa-firebase-adminsdk.json` - Clés d'administration Firebase (**confidentiel**)

## ⚠️ IMPORTANT

Ce fichier contient des **credentials sensibles** et ne doit **JAMAIS** être commité dans Git.

Il est déjà ajouté au `.gitignore` pour votre sécurité.

---

## 📥 Comment obtenir ce fichier ?

### 1. Aller dans la console Firebase

https://console.firebase.google.com/

### 2. Sélectionner votre projet

"MBOA NEXT STAR"

### 3. Paramètres du projet

Cliquer sur l'icône **engrenage** ⚙️ → **Paramètres du projet**

### 4. Comptes de service

Onglet **"Comptes de service"**

### 5. Générer une nouvelle clé privée

Cliquer sur **"Générer une nouvelle clé privée"**

### 6. Télécharger et renommer

- Téléchargez le fichier JSON
- Renommez-le en : `mboa-firebase-adminsdk.json`
- Placez-le dans ce dossier (`backend/config/`)

---

## ✅ Vérification

Une fois le fichier placé, vérifiez qu'il existe :

```bash
ls backend/config/
```

Vous devriez voir :
```
README.md
mboa-firebase-adminsdk.json
```

---

## 🚀 Prêt pour la migration

Une fois ce fichier en place, vous pouvez lancer la migration :

```bash
cd backend
npm install firebase-admin
npx tsx scripts/migrate-to-firebase.ts
```

---

## 🆘 Problème ?

### Le fichier n'est pas reconnu

Vérifiez :
- ✅ Le nom est exactement : `mboa-firebase-adminsdk.json`
- ✅ Il est bien dans `backend/config/`
- ✅ C'est un fichier JSON valide (ouvrez-le pour vérifier)

### Erreur de permissions

Vérifiez que le compte de service a les permissions :
- Firestore Admin
- Firebase Admin

---

**Date de création** : 29 juin 2026  
**Ne pas supprimer ce README**
