# Migration PostgreSQL vers Firebase - MBOA NEXT STAR

## Date : 29 juin 2026

---

## 🎯 Objectif

Migrer la base de données PostgreSQL actuelle vers **Firebase Firestore** pour bénéficier de :
- ✅ Base de données NoSQL cloud
- ✅ Scaling automatique
- ✅ Real-time updates
- ✅ Pas de gestion de serveur PostgreSQL
- ✅ Intégration facile avec Vercel/frontend

---

## 📊 Structure actuelle (PostgreSQL)

### Modèles Prisma
1. **User** - Administrateurs et coaches
2. **Category** - Catégories du concours
3. **Candidate** - Candidats inscrits
4. **Vote** - Votes avec paiements
5. **SiteConfiguration** - Configuration dynamique du site
6. **Withdrawal** - Retraits financiers
7. **Sponsor** - Sponsors/partenaires
8. **SponsorMedia** - Médias des sponsors

### Relations
- Category → Candidate (1:N)
- Candidate → Vote (1:N)
- Sponsor → SponsorMedia (1:N)

---

## 🔄 Structure Firebase (Firestore)

### Collections Firestore

```
firestore/
├── users/                    # Administrateurs
│   └── {userId}/
│       ├── name
│       ├── email
│       ├── role
│       └── createdAt
│
├── categories/               # Catégories
│   └── {categoryId}/
│       ├── name
│       ├── slug
│       └── candidatesCount
│
├── candidates/               # Candidats
│   └── {candidateId}/
│       ├── categoryId
│       ├── firstName
│       ├── lastName
│       ├── email
│       ├── phone
│       ├── profilePhoto (URL Cloudinary)
│       ├── videoUrl (URL Cloudinary)
│       ├── status
│       ├── totalVotesCache
│       └── createdAt
│
├── votes/                    # Votes
│   └── {voteId}/
│       ├── candidateId
│       ├── voterIdentifier
│       ├── paymentReference
│       ├── amount
│       ├── status
│       └── createdAt
│
├── siteConfiguration/        # Config du site
│   └── {configKey}/
│       ├── value
│       └── updatedAt
│
├── withdrawals/              # Retraits
│   └── {withdrawalId}/
│       ├── requestedAmount
│       ├── status
│       └── createdAt
│
└── sponsors/                 # Sponsors
    └── {sponsorId}/
        ├── name
        ├── logoUrl
        ├── tier
        ├── isActive
        └── media/            # Sous-collection
            └── {mediaId}/
                ├── mediaType
                ├── mediaUrl
                └── displayOrder
```

---

## 📦 Plan de migration (8 étapes)

### Étape 1 : Configuration Firebase (15 min)

#### 1.1 Créer un projet Firebase

1. Aller sur https://console.firebase.google.com/
2. Cliquer sur "Add project"
3. Nom du projet : `mboa-next-star-prod`
4. Activer Google Analytics (optionnel)

#### 1.2 Activer Firestore

1. Dans le menu latéral : **Build** → **Firestore Database**
2. Cliquer sur "Create database"
3. Choisir le mode : **Production mode** (règles de sécurité strictes)
4. Région : **europe-west3** (Frankfurt) ou **us-central1**

#### 1.3 Récupérer les credentials

1. Aller dans **Project Settings** (⚙️)
2. Onglet **Service accounts**
3. Cliquer sur "Generate new private key"
4. Télécharger le fichier JSON → sauvegarder comme `backend/firebase-service-account.json`

**⚠️ IMPORTANT** : Ajouter à `.gitignore` :
```gitignore
firebase-service-account.json
```

#### 1.4 Installer les dépendances

```bash
cd backend
npm install firebase-admin
npm install --save-dev @types/node
```

---

### Étape 2 : Configuration Firebase dans le code (10 min)

#### 2.1 Créer le fichier de configuration

**Fichier** : `backend/src/config/firebase.ts`

```typescript
import admin from 'firebase-admin';
import path from 'path';

// Charger les credentials
const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'mboa-next-star-prod.appspot.com' // Remplacer par votre bucket
});

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
```

#### 2.2 Mettre à jour `.env`

```env
# Firebase
FIREBASE_PROJECT_ID="mboa-next-star-prod"
FIREBASE_STORAGE_BUCKET="mboa-next-star-prod.appspot.com"
```

---

### Étape 3 : Script de migration (30 min)

#### 3.1 Créer le script de migration

**Fichier** : `backend/scripts/migrate-to-firebase.ts`

```typescript
import { db } from '../src/config/firebase';
import prisma from '../src/utils/prisma';

async function migrateToFirestore() {
  console.log('🔄 Migration PostgreSQL → Firestore...\n');

  try {
    // 1. Migrer les Users
    console.log('👤 Migration des Users...');
    const users = await prisma.user.findMany();
    const userBatch = db.batch();
    users.forEach((user) => {
      const userRef = db.collection('users').doc(user.id.toString());
      userBatch.set(userRef, {
        name: user.name,
        email: user.email,
        password: user.password, // Hash déjà présent
        role: user.role,
        createdAt: admin.firestore.Timestamp.fromDate(user.createdAt),
      });
    });
    await userBatch.commit();
    console.log(`✅ ${users.length} users migrés\n`);

    // 2. Migrer les Categories
    console.log('📂 Migration des Categories...');
    const categories = await prisma.category.findMany();
    const categoryBatch = db.batch();
    categories.forEach((category) => {
      const catRef = db.collection('categories').doc(category.id.toString());
      categoryBatch.set(catRef, {
        name: category.name,
        slug: category.slug,
        candidatesCount: 0, // Sera calculé après
      });
    });
    await categoryBatch.commit();
    console.log(`✅ ${categories.length} categories migrées\n`);

    // 3. Migrer les Candidates
    console.log('🎤 Migration des Candidates...');
    const candidates = await prisma.candidate.findMany();
    for (const candidate of candidates) {
      await db.collection('candidates').doc(candidate.id.toString()).set({
        categoryId: candidate.categoryId.toString(),
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        birthDate: candidate.birthDate ? admin.firestore.Timestamp.fromDate(candidate.birthDate) : null,
        city: candidate.city || '',
        country: candidate.country || '',
        biography: candidate.biography || '',
        profilePhoto: candidate.profilePhoto || '',
        videoUrl: candidate.videoUrl || '',
        socialLinks: candidate.socialLinks || {},
        slug: candidate.slug || '',
        verificationCode: candidate.verificationCode || '',
        status: candidate.status,
        totalVotesCache: candidate.totalVotesCache,
        createdAt: admin.firestore.Timestamp.fromDate(candidate.createdAt),
        updatedAt: admin.firestore.Timestamp.fromDate(candidate.updatedAt),
      });
    }
    console.log(`✅ ${candidates.length} candidates migrés\n`);

    // 4. Migrer les Votes
    console.log('🗳️  Migration des Votes...');
    const votes = await prisma.vote.findMany();
    for (const vote of votes) {
      await db.collection('votes').doc(vote.id.toString()).set({
        candidateId: vote.candidateId.toString(),
        voterIdentifier: vote.voterIdentifier,
        paymentReference: vote.paymentReference,
        amount: vote.amount,
        paymentMethod: vote.paymentMethod || '',
        maviansQuoteId: vote.maviansQuoteId || '',
        maviansPtn: vote.maviansPtn || '',
        paymentUrl: vote.paymentUrl || '',
        status: vote.status,
        paidAt: vote.paidAt ? admin.firestore.Timestamp.fromDate(vote.paidAt) : null,
        createdAt: admin.firestore.Timestamp.fromDate(vote.createdAt),
      });
    }
    console.log(`✅ ${votes.length} votes migrés\n`);

    // 5. Migrer la Configuration
    console.log('⚙️  Migration de la Configuration...');
    const configs = await prisma.siteConfiguration.findMany();
    for (const config of configs) {
      await db.collection('siteConfiguration').doc(config.configKey).set({
        value: config.configValue,
        updatedAt: admin.firestore.Timestamp.fromDate(config.updatedAt),
      });
    }
    console.log(`✅ ${configs.length} configurations migrées\n`);

    // 6. Migrer les Withdrawals
    console.log('💰 Migration des Withdrawals...');
    const withdrawals = await prisma.withdrawal.findMany();
    for (const withdrawal of withdrawals) {
      await db.collection('withdrawals').doc(withdrawal.id.toString()).set({
        requestedAmount: withdrawal.requestedAmount,
        feeAmount: withdrawal.feeAmount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        createdAt: admin.firestore.Timestamp.fromDate(withdrawal.createdAt),
      });
    }
    console.log(`✅ ${withdrawals.length} withdrawals migrés\n`);

    // 7. Migrer les Sponsors
    console.log('🤝 Migration des Sponsors...');
    const sponsors = await prisma.sponsor.findMany({
      include: { media: true }
    });
    for (const sponsor of sponsors) {
      const sponsorRef = db.collection('sponsors').doc(sponsor.id.toString());
      await sponsorRef.set({
        name: sponsor.name,
        description: sponsor.description || '',
        websiteUrl: sponsor.websiteUrl || '',
        logoUrl: sponsor.logoUrl || '',
        tier: sponsor.tier,
        displayOrder: sponsor.displayOrder,
        isActive: sponsor.isActive,
        createdAt: admin.firestore.Timestamp.fromDate(sponsor.createdAt),
        updatedAt: admin.firestore.Timestamp.fromDate(sponsor.updatedAt),
      });

      // Migrer les médias du sponsor (sous-collection)
      for (const media of sponsor.media) {
        await sponsorRef.collection('media').doc(media.id.toString()).set({
          mediaType: media.mediaType,
          mediaUrl: media.mediaUrl,
          thumbnailUrl: media.thumbnailUrl || '',
          title: media.title || '',
          description: media.description || '',
          displayOrder: media.displayOrder,
          isActive: media.isActive,
          createdAt: admin.firestore.Timestamp.fromDate(media.createdAt),
          updatedAt: admin.firestore.Timestamp.fromDate(media.updatedAt),
        });
      }
    }
    console.log(`✅ ${sponsors.length} sponsors migrés\n`);

    console.log('='.repeat(60));
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${candidates.length} candidates`);
    console.log(`   - ${votes.length} votes`);
    console.log(`   - ${configs.length} configurations`);
    console.log(`   - ${withdrawals.length} withdrawals`);
    console.log(`   - ${sponsors.length} sponsors`);
    console.log('\n🎯 Prochaines étapes:');
    console.log('   1. Vérifier les données dans Firebase Console');
    console.log('   2. Configurer les règles de sécurité Firestore');
    console.log('   3. Créer les index nécessaires');
    console.log('   4. Mettre à jour le code pour utiliser Firebase\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToFirestore();
```

---

### Étape 4 : Exécuter la migration (5-10 min)

```bash
cd backend
npx tsx scripts/migrate-to-firebase.ts
```

**Vérifier dans Firebase Console** :
1. Aller sur https://console.firebase.google.com/
2. Firestore Database
3. Vérifier que toutes les collections sont présentes

---

### Étape 5 : Configurer les règles de sécurité (10 min)

**Dans Firebase Console** → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - Lecture par admins uniquement
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.role == 'SUPER_ADMIN';
    }
    
    // Categories - Lecture publique, écriture par admins
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH'];
    }
    
    // Candidates - Lecture publique (status ACTIVE uniquement), écriture par admins
    match /candidates/{candidateId} {
      allow read: if resource.data.status == 'ACTIVE' || 
                     (request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH']);
      allow write: if request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH'];
    }
    
    // Votes - Création publique, lecture par admins
    match /votes/{voteId} {
      allow read: if request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH'];
      allow create: if true; // Le paiement sera vérifié côté serveur
    }
    
    // Configuration - Lecture publique, écriture par admins
    match /siteConfiguration/{configKey} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'SUPER_ADMIN';
    }
    
    // Withdrawals - Admins uniquement
    match /withdrawals/{withdrawalId} {
      allow read, write: if request.auth != null && request.auth.token.role == 'SUPER_ADMIN';
    }
    
    // Sponsors - Lecture publique, écriture par admins
    match /sponsors/{sponsorId} {
      allow read: if resource.data.isActive == true || 
                     (request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH']);
      allow write: if request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH'];
      
      // Sous-collection media
      match /media/{mediaId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.token.role in ['SUPER_ADMIN', 'COACH'];
      }
    }
  }
}
```

---

### Étape 6 : Créer les index Firestore (5 min)

**Dans Firebase Console** → Firestore Database → Indexes

Créer les index suivants :

1. **Candidates** :
   - Collection: `candidates`
   - Champs: `categoryId` (Ascending), `status` (Ascending), `totalVotesCache` (Descending)

2. **Votes** :
   - Collection: `votes`
   - Champs: `candidateId` (Ascending), `status` (Ascending), `createdAt` (Descending)

3. **Sponsors** :
   - Collection: `sponsors`
   - Champs: `isActive` (Ascending), `displayOrder` (Ascending)

---

### Étape 7 : Adapter le code backend (LONGUE ÉTAPE)

#### 7.1 Créer un service Firestore abstrait

**Fichier** : `backend/src/services/firestore.service.ts`

```typescript
import { db } from '../config/firebase';
import admin from 'firebase-admin';

export class FirestoreService {
  /**
   * Récupère un document par ID
   */
  async getById(collection: string, id: string) {
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Récupère tous les documents d'une collection
   */
  async getAll(collection: string, filters?: any) {
    let query: any = db.collection(collection);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.where(key, '==', value);
      });
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Crée un document
   */
  async create(collection: string, data: any) {
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  }

  /**
   * Met à jour un document
   */
  async update(collection: string, id: string, data: any) {
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return this.getById(collection, id);
  }

  /**
   * Supprime un document
   */
  async delete(collection: string, id: string) {
    await db.collection(collection).doc(id).delete();
  }
}

export const firestoreService = new FirestoreService();
```

#### 7.2 Adapter chaque service existant

**Exemple** : Adapter `candidate.service.ts`

```typescript
// AVANT (Prisma)
const candidate = await prisma.candidate.findUnique({
  where: { id: candidateId }
});

// APRÈS (Firestore)
const candidate = await firestoreService.getById('candidates', candidateId.toString());

// AVANT (Prisma)
const candidates = await prisma.candidate.findMany({
  where: { status: 'ACTIVE' }
});

// APRÈS (Firestore)
const candidates = await firestoreService.getAll('candidates', { status: 'ACTIVE' });
```

---

### Étape 8 : Tests et validation (30 min)

#### 8.1 Tester chaque endpoint

```bash
# 1. Config publique
curl http://localhost:3000/api/config

# 2. Liste des catégories
curl http://localhost:3000/api/categories

# 3. Profil d'un candidat
curl http://localhost:3000/api/candidates/jean-dupont

# 4. Créer un vote (nécessite auth)
curl -X POST http://localhost:3000/api/votes/initiate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 1, "voterIdentifier": "+237650240560", "amount": 100}'
```

#### 8.2 Vérifier les données dans Firebase Console

---

## ⚖️ Comparaison PostgreSQL vs Firebase

| Critère | PostgreSQL + Prisma | Firebase Firestore |
|---------|---------------------|-------------------|
| **Type** | SQL relationnel | NoSQL document |
| **Scaling** | Vertical (RAM/CPU) | ☁️ Automatique |
| **Hébergement** | Serveur à gérer | 🤖 Managed (Google) |
| **Real-time** | Polling nécessaire | ✅ Built-in |
| **Coût** | Serveur constant | 💰 Pay-per-use |
| **Queries complexes** | ✅ SQL puissant | ⚠️ Limité |
| **Transactions** | ✅ ACID complètes | ⚠️ Limitées |
| **Migrations** | Prisma Migrate | 🔧 Manuelle |

---

## 💰 Coûts Firebase (estimation)

### Plan Gratuit (Spark)
- **Stockage** : 1 GB
- **Reads** : 50,000/jour
- **Writes** : 20,000/jour
- **Deletes** : 20,000/jour

### Estimation MBOA NEXT STAR
- **Stockage** : ~100 MB (config + candidats + votes)
- **Reads** : ~10,000/jour (navigation site)
- **Writes** : ~500/jour (votes + admin)

**Verdict** : Le plan gratuit devrait suffire pour démarrer ! 🎉

---

## 🚨 Points d'attention

### 1. Relations entre documents

Firebase n'a pas de jointures SQL. Solutions :

```typescript
// Option 1: Dénormalisation
// Stocker categoryName directement dans candidate
{
  candidateId: '1',
  firstName: 'Jean',
  categoryId: '2',
  categoryName: 'Chant' // Dupliqué pour éviter une requête
}

// Option 2: Requêtes multiples
const candidate = await getCandidate('1');
const category = await getCategory(candidate.categoryId);
```

### 2. Compteurs (totalVotesCache)

Utiliser Firestore Transactions :

```typescript
await db.runTransaction(async (transaction) => {
  const candidateRef = db.collection('candidates').doc(candidateId);
  const candidateDoc = await transaction.get(candidateRef);
  
  const newVoteCount = (candidateDoc.data()?.totalVotesCache || 0) + 1;
  transaction.update(candidateRef, { totalVotesCache: newVoteCount });
});
```

### 3. Slugs uniques

Firebase n'a pas de contrainte UNIQUE. Solution :

```typescript
// Vérifier manuellement avant l'insertion
const existingSlug = await db.collection('candidates')
  .where('slug', '==', slug)
  .limit(1)
  .get();

if (!existingSlug.empty) {
  throw new Error('Slug already exists');
}
```

---

## 📞 Support

### Documentation Firebase
- **Firestore** : https://firebase.google.com/docs/firestore
- **Admin SDK** : https://firebase.google.com/docs/admin/setup
- **Security Rules** : https://firebase.google.com/docs/firestore/security/get-started

### Commandes utiles

```bash
# Voir les logs Firebase
firebase functions:log

# Exporter les données Firestore
firebase firestore:export gs://backup-bucket

# Importer les données Firestore
firebase firestore:import gs://backup-bucket
```

---

**Document créé le** : 29 juin 2026  
**Auteur** : Migration système MBOA NEXT STAR  
**Version** : 1.0  
**Status** : 📋 Guide prêt pour implémentation
