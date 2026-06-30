# Plan de Migration vers Firebase Firestore - MBOA NEXT STAR

## Date : 29 juin 2026

---

## 🎯 Objectif

Migrer la base de données PostgreSQL (via Prisma) vers **Firebase Firestore** pour bénéficier de :
- ✅ Hébergement cloud gratuit (quota généreux)
- ✅ Scalabilité automatique
- ✅ Temps réel intégré
- ✅ Pas de gestion de serveur PostgreSQL
- ✅ SDK officiel pour web/mobile

---

## 📊 Structure des données exportées

### Fichiers d'export disponibles
- `backend/exports/mboa_db_export_2026-06-29T18-37-10.json` ✅
- `backend/exports/mboa_db_export_2026-06-29T18-37-43.sql`

### Tables à migrer

| Table PostgreSQL | Collection Firestore | Documents |
|------------------|---------------------|-----------|
| `users` | `users` | ~3 admins |
| `categories` | `categories` | ~4-5 catégories |
| `candidates` | `candidates` | ~2 candidats |
| `votes` | `votes` | Votes payants |
| `site_configuration` | `siteConfig` | Config du site |
| `withdrawals` | `withdrawals` | Retraits financiers |
| `sponsors` | `sponsors` | Sponsors |
| `sponsor_media` | Sous-collection de `sponsors` | Médias sponsors |

---

## 🏗️ Architecture Firestore

### Structure des collections

```
firestore/
├── users/
│   └── {userId}/
│       ├── id: string
│       ├── name: string
│       ├── email: string
│       ├── password: string (hash bcrypt)
│       ├── role: "SUPER_ADMIN" | "COACH"
│       └── createdAt: timestamp
│
├── categories/
│   └── {categoryId}/
│       ├── id: string
│       ├── name: string
│       └── slug: string
│
├── candidates/
│   └── {candidateId}/
│       ├── id: string
│       ├── categoryId: string (référence)
│       ├── firstName: string
│       ├── lastName: string
│       ├── email: string
│       ├── phone: string
│       ├── birthDate: timestamp
│       ├── city: string
│       ├── country: string
│       ├── biography: string
│       ├── profilePhoto: string (URL Cloudinary)
│       ├── videoUrl: string (URL Cloudinary)
│       ├── socialLinks: object
│       ├── slug: string
│       ├── verificationCode: string
│       ├── status: string
│       ├── totalVotesCache: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── votes/
│   └── {voteId}/
│       ├── id: string
│       ├── candidateId: string (référence)
│       ├── voterIdentifier: string
│       ├── paymentReference: string (unique)
│       ├── amount: number
│       ├── paymentMethod: string
│       ├── status: "PENDING" | "SUCCESS" | "FAILED"
│       ├── paidAt: timestamp
│       └── createdAt: timestamp
│
├── siteConfig/
│   └── {configKey}/
│       ├── key: string
│       ├── value: string
│       └── updatedAt: timestamp
│
├── withdrawals/
│   └── {withdrawalId}/
│       ├── id: string
│       ├── requestedAmount: number
│       ├── feeAmount: number
│       ├── netAmount: number
│       ├── status: "PENDING" | "COMPLETED"
│       └── createdAt: timestamp
│
└── sponsors/
    └── {sponsorId}/
        ├── id: string
        ├── name: string
        ├── description: string
        ├── websiteUrl: string
        ├── logoUrl: string
        ├── tier: string
        ├── displayOrder: number
        ├── isActive: boolean
        ├── createdAt: timestamp
        ├── updatedAt: timestamp
        └── media/ (sous-collection)
            └── {mediaId}/
                ├── id: string
                ├── mediaType: "IMAGE" | "VIDEO"
                ├── mediaUrl: string
                ├── thumbnailUrl: string
                ├── title: string
                ├── description: string
                ├── displayOrder: number
                ├── isActive: boolean
                ├── createdAt: timestamp
                └── updatedAt: timestamp
```

---

## 📋 Plan de migration (7 étapes)

### Étape 1 : Configuration Firebase (15 min)

1. **Créer un projet Firebase**
   - Aller sur https://console.firebase.google.com/
   - Cliquer sur "Ajouter un projet"
   - Nom : "MBOA NEXT STAR"
   - Activer Google Analytics (optionnel)

2. **Activer Firestore**
   - Dans le menu, aller dans "Firestore Database"
   - Cliquer sur "Créer une base de données"
   - Mode : **Production** (règles de sécurité)
   - Région : **europe-west** (ou la plus proche)

3. **Récupérer les identifiants**
   - Paramètres du projet → Comptes de service
   - Générer une nouvelle clé privée (JSON)
   - Télécharger `mboa-firebase-adminsdk.json`

4. **Configuration Web (Frontend)**
   - Paramètres du projet → Applications Web
   - Ajouter une application web
   - Copier la configuration Firebase

### Étape 2 : Installation des dépendances

```bash
# Backend
cd backend
npm install firebase-admin
npm install @google-cloud/firestore

# Frontend (si migration complète)
cd ../Frontend
npm install firebase
```

### Étape 3 : Configuration Backend

Créer `backend/src/config/firebase.ts` :

```typescript
import admin from 'firebase-admin';
import * as path from 'path';

// Charger les credentials depuis le fichier JSON
const serviceAccount = require(path.join(__dirname, '../../config/mboa-firebase-adminsdk.json'));

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// Export Firestore
export const db = admin.firestore();
export default admin;
```

### Étape 4 : Script de migration

Créer `backend/scripts/migrate-to-firebase.ts` :

```typescript
import { db } from '../src/config/firebase';
import * as fs from 'fs';
import * as path from 'path';

async function migrateToFirebase() {
  console.log('🚀 Début de la migration vers Firebase Firestore...\n');

  // Charger l'export JSON
  const exportPath = path.join(__dirname, '../exports/mboa_db_export_2026-06-29T18-37-10.json');
  const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  const stats = {
    users: 0,
    categories: 0,
    candidates: 0,
    votes: 0,
    siteConfig: 0,
    withdrawals: 0,
    sponsors: 0,
    sponsorMedia: 0,
  };

  // Migration des utilisateurs
  console.log('👥 Migration des utilisateurs...');
  for (const user of data.tables.users) {
    await db.collection('users').doc(user.id.toString()).set({
      ...user,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(user.createdAt))
    });
    stats.users++;
  }

  // Migration des catégories
  console.log('📂 Migration des catégories...');
  for (const category of data.tables.categories) {
    await db.collection('categories').doc(category.id.toString()).set(category);
    stats.categories++;
  }

  // Migration des candidats
  console.log('🎤 Migration des candidats...');
  for (const candidate of data.tables.candidates) {
    await db.collection('candidates').doc(candidate.id.toString()).set({
      ...candidate,
      birthDate: candidate.birthDate ? admin.firestore.Timestamp.fromDate(new Date(candidate.birthDate)) : null,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(candidate.createdAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(candidate.updatedAt))
    });
    stats.candidates++;
  }

  // Migration des votes
  console.log('🗳️  Migration des votes...');
  for (const vote of data.tables.votes) {
    await db.collection('votes').doc(vote.id.toString()).set({
      ...vote,
      paidAt: vote.paidAt ? admin.firestore.Timestamp.fromDate(new Date(vote.paidAt)) : null,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(vote.createdAt))
    });
    stats.votes++;
  }

  // Migration de la configuration
  console.log('⚙️  Migration de la configuration du site...');
  for (const config of data.tables.site_configuration) {
    await db.collection('siteConfig').doc(config.configKey).set({
      key: config.configKey,
      value: config.configValue,
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(config.updatedAt))
    });
    stats.siteConfig++;
  }

  // Migration des retraits
  console.log('💰 Migration des retraits...');
  for (const withdrawal of data.tables.withdrawals) {
    await db.collection('withdrawals').doc(withdrawal.id.toString()).set({
      ...withdrawal,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(withdrawal.createdAt))
    });
    stats.withdrawals++;
  }

  // Migration des sponsors
  console.log('🤝 Migration des sponsors...');
  for (const sponsor of data.tables.sponsors) {
    await db.collection('sponsors').doc(sponsor.id.toString()).set({
      ...sponsor,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(sponsor.createdAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(sponsor.updatedAt))
    });
    stats.sponsors++;

    // Migration des médias sponsors (sous-collection)
    const sponsorMedia = data.tables.sponsor_media.filter(m => m.sponsorId === sponsor.id);
    for (const media of sponsorMedia) {
      await db.collection('sponsors')
        .doc(sponsor.id.toString())
        .collection('media')
        .doc(media.id.toString())
        .set({
          ...media,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(media.createdAt)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(media.updatedAt))
        });
      stats.sponsorMedia++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS!');
  console.log('='.repeat(60));
  console.log('\n📊 Statistiques:');
  console.log(`   Utilisateurs: ${stats.users}`);
  console.log(`   Catégories: ${stats.categories}`);
  console.log(`   Candidats: ${stats.candidates}`);
  console.log(`   Votes: ${stats.votes}`);
  console.log(`   Configuration: ${stats.siteConfig}`);
  console.log(`   Retraits: ${stats.withdrawals}`);
  console.log(`   Sponsors: ${stats.sponsors}`);
  console.log(`   Médias sponsors: ${stats.sponsorMedia}`);
  console.log('\n');
}

migrateToFirebase().catch(console.error);
```

### Étape 5 : Adapter les services

Créer `backend/src/repositories/firebase/` avec des adaptateurs pour chaque collection.

### Étape 6 : Tester la migration

```bash
cd backend
npx tsx scripts/migrate-to-firebase.ts
```

### Étape 7 : Mettre à jour le code

Remplacer progressivement les appels Prisma par des appels Firestore.

---

## 🔄 Comparaison Prisma vs Firestore

| Opération | Prisma (PostgreSQL) | Firestore |
|-----------|---------------------|-----------|
| **Créer** | `prisma.user.create({...})` | `db.collection('users').add({...})` |
| **Lire un** | `prisma.user.findUnique({...})` | `db.collection('users').doc(id).get()` |
| **Lire tous** | `prisma.user.findMany()` | `db.collection('users').get()` |
| **Mettre à jour** | `prisma.user.update({...})` | `db.collection('users').doc(id).update({...})` |
| **Supprimer** | `prisma.user.delete({...})` | `db.collection('users').doc(id).delete()` |
| **Filtrer** | `where: { status: 'ACTIVE' }` | `.where('status', '==', 'ACTIVE')` |
| **Trier** | `orderBy: { createdAt: 'desc' }` | `.orderBy('createdAt', 'desc')` |
| **Limiter** | `take: 10` | `.limit(10)` |

---

## ⚠️ Points d'attention

### 1. Auto-increment IDs
Firestore n'a pas d'auto-increment. Solutions :
- **Option A** : Utiliser les IDs PostgreSQL existants (migration)
- **Option B** : Laisser Firestore générer des IDs uniques
- **Option C** : Créer un compteur custom

### 2. Relations
Firestore n'a pas de joins. Solutions :
- Dénom normalisati on (dupliquer certaines données)
- Requêtes multiples
- Sous-collections

### 3. Transactions
Firestore supporte les transactions mais avec limites (500 documents max).

### 4. Indexes
Créer des indexes composites si nécessaire :
```typescript
// Firestore créera automatiquement les indexes simples
// Pour les indexes composites, suivre les suggestions dans la console
```

---

## 💰 Coûts Firebase

### Plan Gratuit (Spark)
- **Stockage** : 1 GB
- **Lectures** : 50,000/jour
- **Écritures** : 20,000/jour
- **Suppressions** : 20,000/jour
- **Bande passante** : 10 GB/mois

### Notre utilisation estimée
- Stockage : < 100 MB ✅
- Lectures : ~5,000/jour ✅
- Écritures : ~500/jour ✅

**Verdict** : Le plan gratuit suffit largement ! 🎉

---

## 🚀 Avantages Firebase

| Critère | PostgreSQL | Firebase Firestore |
|---------|------------|-------------------|
| **Hébergement** | Serveur à gérer | ☁️ Cloud géré |
| **Scalabilité** | Manuel | 🤖 Automatique |
| **Temps réel** | Polling/WebSocket | ✅ Intégré natif |
| **Coût** | Serveur + backup | 🆓 Gratuit (usage normal) |
| **Mobile** | API REST | 📱 SDK natif |
| **Offline** | Non | ✅ Sync automatique |

---

## 📞 Support

### Documentation Firebase
- **Firestore** : https://firebase.google.com/docs/firestore
- **Admin SDK** : https://firebase.google.com/docs/admin/setup
- **Sécurité** : https://firebase.google.com/docs/firestore/security/get-started

---

**Document créé le** : 29 juin 2026  
**Auteur** : Migration système MBOA NEXT STAR  
**Version** : 1.0  
**Status** : ✅ Plan prêt - En attente d'exécution
