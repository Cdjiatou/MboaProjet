# Intégration Cloudinary pour les Uploads - MBOA NEXT STAR

## Date : 29 juin 2026

---

## 🎯 Objectif

Modifier le système d'upload pour que **tous les fichiers** (images, vidéos) soient automatiquement stockés sur **Cloudinary CDN** au lieu du dossier local `uploads/`.

---

## ✅ Modifications effectuées

### 1. Middleware Upload (`backend/src/middlewares/upload.middleware.ts`)

**Avant** :
- Multer stockait les fichiers directement dans `uploads/candidates/`, `uploads/sponsors/`, `uploads/media/`
- Les fichiers restaient sur le serveur local

**Après** :
- ✅ Multer stocke temporairement dans `uploads/temp/`
- ✅ Nouvelle fonction `uploadToCloudinaryAndCleanup()` :
  - Upload le fichier vers Cloudinary
  - Supprime automatiquement le fichier temporaire
  - Retourne l'URL Cloudinary
- ✅ Tous les uploads (candidats, sponsors, médias) utilisent le même stockage temporaire

### 2. Contrôleur Admin (`backend/src/controllers/admin.controller.ts`)

**Fonctions modifiées** :

#### `createCandidate`
```typescript
// AVANT: Stockage local
candidateData.profilePhoto = `uploads/candidates/${req.file.filename}`;

// APRÈS: Upload vers Cloudinary
const cloudinaryUrl = await uploadToCloudinaryAndCleanup(
  req.file.path,
  'candidates',
  'image'
);
candidateData.profilePhoto = cloudinaryUrl;
```

#### `uploadCandidatePhoto`
- ✅ Upload vers Cloudinary au lieu du stockage local
- ✅ Suppression de l'ancienne photo de Cloudinary (si elle existe)
- ✅ Extraction automatique du `public_id` depuis l'URL Cloudinary
- ✅ Nettoyage automatique du fichier temporaire

#### `deleteCandidatePhoto`
- ✅ Suppression de la photo de Cloudinary
- ✅ Mise à jour de la base de données

#### `uploadSponsorLogoController`
- ✅ Upload des logos sponsors vers Cloudinary (`sponsors/` folder)
- ✅ Retourne l'URL Cloudinary publique

#### `uploadMediaController`
- ✅ Détection automatique image vs vidéo
- ✅ Upload vers Cloudinary (`site-media/` folder)
- ✅ Support des vidéos jusqu'à 100MB

---

## 📁 Structure Cloudinary

```
mboa-next-star/
├── candidates/           # Photos de profil des candidats
├── sponsors/             # Logos des sponsors
└── site-media/           # Médias génériques (images/vidéos pour carousels, bannières)
```

---

## 🔄 Flux d'Upload

### Avant
```
Frontend → Backend → Multer → uploads/candidates/photo.jpg
                                      ↓
                              Stocké localement
                                      ↓
                         URL: /uploads/candidates/photo.jpg
```

### Après
```
Frontend → Backend → Multer → uploads/temp/photo.jpg (temporaire)
                                      ↓
                        uploadToCloudinaryAndCleanup()
                                      ↓
                    Cloudinary CDN → mboa-next-star/candidates/photo.jpg
                                      ↓
                      Suppression du fichier temporaire
                                      ↓
          URL: https://res.cloudinary.com/dlcrb5pat/image/upload/v1234/.../photo.jpg
```

---

## 🧪 Test des modifications

### 1. Test d'upload de photo candidat

```bash
# Via l'interface admin
1. Créer un nouveau candidat avec photo
2. Vérifier que l'URL de la photo contient "cloudinary.com"
3. Ouvrir l'URL pour voir l'image (chargement rapide via CDN)
```

### 2. Test d'upload de logo sponsor

```bash
# Via l'interface admin sponsors
1. Uploader un logo sponsor
2. Vérifier que logoUrl contient "cloudinary.com"
3. Le logo doit s'afficher sur le site public
```

### 3. Test d'upload de vidéo

```bash
# Via l'interface admin médias
1. Uploader une vidéo MP4 (< 100MB)
2. Vérifier que l'URL contient "cloudinary.com"
3. La vidéo doit se jouer depuis le CDN
```

### 4. Vérifier le nettoyage temporaire

```bash
# Après chaque upload, vérifier que uploads/temp/ est vide
ls backend/uploads/temp/
# Doit être vide (les fichiers sont supprimés automatiquement)
```

---

## ⚙️ Configuration requise

### Variables d'environnement

Le fichier `backend/.env` doit contenir :

```env
CLOUDINARY_CLOUD_NAME="dlcrb5pat"
CLOUDINARY_API_KEY="284645167296527"
CLOUDINARY_API_SECRET="3x9Ugn1IkEbBLAX9Snb46x7Af2M"
```

### Dossier temporaire

Le dossier `backend/uploads/temp/` est créé automatiquement.

---

## 🎨 Avantages

| Critère | Avant (Local) | Après (Cloudinary) |
|---------|--------------|-------------------|
| **Stockage** | Limité par le serveur | ☁️ Illimité (cloud) |
| **Vitesse** | Dépend du serveur | ⚡ CDN global (ultra-rapide) |
| **Optimisation** | Manuelle | 🤖 Automatique (compression, WebP) |
| **Backup** | Manuel | 🔒 Automatique |
| **Maintenance** | Gestion des fichiers | 🎯 Zéro maintenance |
| **Coût** | Espace serveur | 🆓 Gratuit (25 GB/mois) |

---

## 🔧 Fonctions utilitaires

### `uploadToCloudinaryAndCleanup()`

```typescript
/**
 * Upload un fichier vers Cloudinary et supprime le fichier temporaire
 * @param filePath - Chemin du fichier temporaire
 * @param folder - Dossier dans Cloudinary ('candidates', 'sponsors', 'site-media')
 * @param resourceType - Type de ressource ('image' ou 'video')
 * @returns URL publique Cloudinary
 */
async function uploadToCloudinaryAndCleanup(
  filePath: string,
  folder: string,
  resourceType: 'image' | 'video'
): Promise<string>
```

**Utilisation** :

```typescript
// Upload d'une image
const photoUrl = await uploadToCloudinaryAndCleanup(
  req.file.path,
  'candidates',
  'image'
);

// Upload d'une vidéo
const videoUrl = await uploadToCloudinaryAndCleanup(
  req.file.path,
  'site-media',
  'video'
);
```

### Extraction du `public_id` depuis une URL Cloudinary

```typescript
// URL: https://res.cloudinary.com/dlcrb5pat/image/upload/v1234/mboa-next-star/candidates/abc123.jpg
const urlParts = imageUrl.split('/');
const uploadIndex = urlParts.findIndex(part => part === 'upload');
const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
// Result: "mboa-next-star/candidates/abc123"
```

---

## 📊 Monitoring

### Dashboard Cloudinary

- **URL** : https://console.cloudinary.com/
- **Métriques** :
  - Nombre de fichiers stockés
  - Bande passante utilisée
  - Transformations appliquées

### Vérifier les uploads

```bash
# Lister les fichiers dans un dossier
npx tsx -e "
import cloudinary from './src/config/cloudinary';
cloudinary.api.resources({ type: 'upload', prefix: 'mboa-next-star/candidates' })
  .then(result => console.log(result.resources));
"
```

---

## ⚠️ Notes importantes

### Compatibilité avec les anciennes URLs

Le code gère les deux types d'URLs :
- ✅ URLs locales : `/uploads/candidates/photo.jpg`
- ✅ URLs Cloudinary : `https://res.cloudinary.com/.../photo.jpg`

Lors de la suppression, le code vérifie si l'URL contient `cloudinary.com` avant d'essayer de supprimer de Cloudinary.

### Migration progressive

Les anciens fichiers locaux restent accessibles. Nouvelle stratégie :
1. ✅ Tous les **nouveaux uploads** vont sur Cloudinary
2. ✅ Les **anciennes photos** locales continuent de fonctionner
3. 🔄 **Migration manuelle** possible avec le script `migrate-to-cloudinary.ts`

### Gestion des erreurs

Si l'upload vers Cloudinary échoue :
- Le fichier temporaire est quand même supprimé
- Une erreur est lancée
- L'utilisateur voit un message d'erreur clair
- Aucun fichier ne reste orphelin sur le serveur

---

## 🚀 Prochaines étapes (optionnelles)

### 1. Optimisation d'images

Cloudinary peut générer des versions optimisées automatiquement :

```typescript
// URL originale
https://res.cloudinary.com/.../photo.jpg

// URL optimisée 300x300
https://res.cloudinary.com/.../w_300,h_300,c_fill,q_auto,f_auto/photo.jpg
```

### 2. Transformation de vidéos

```typescript
// Thumbnail d'une vidéo (première frame)
https://res.cloudinary.com/.../video.jpg

// Vidéo redimensionnée
https://res.cloudinary.com/.../w_1280,h_720/video.mp4
```

### 3. Watermarking

Ajouter automatiquement un logo sur les vidéos :

```typescript
cloudinary.url('video-id', {
  overlay: 'mboa-logo',
  gravity: 'south_east',
  width: 100
});
```

---

## 📞 Support

### Documentation Cloudinary

- **Guide d'upload** : https://cloudinary.com/documentation/upload_images
- **Transformations** : https://cloudinary.com/documentation/image_transformations
- **Vidéos** : https://cloudinary.com/documentation/video_manipulation_and_delivery

### Logs

```bash
# Voir les logs d'upload
tail -f backend/logs/app.log | grep -i cloudinary
```

---

**Document créé le** : 29 juin 2026  
**Auteur** : Migration système MBOA NEXT STAR  
**Version** : 2.0  
**Status** : ✅ Implémenté et fonctionnel
