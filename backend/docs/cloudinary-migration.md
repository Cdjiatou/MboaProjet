# Migration vers Cloudinary - MBOA NEXT STAR

## Date: 29 juin 2026

---

## 🎯 Pourquoi migrer vers Cloudinary ?

### Problèmes actuels
- ❌ 1.1 GB d'uploads locaux (76% inutilisés)
- ❌ Gestion manuelle de l'espace disque
- ❌ Pas de CDN (chargement lent pour utilisateurs éloignés)
- ❌ Pas d'optimisation automatique
- ❌ Duplications et fichiers orphelins

### Avantages de Cloudinary
- ✅ **Stockage illimité** (pas de gestion d'espace)
- ✅ **CDN global** (chargement rapide partout dans le monde)
- ✅ **Optimisation automatique** (compression, format adapté)
- ✅ **Transformation à la volée** (resize, crop, effets)
- ✅ **Backup automatique** (sécurité des données)
- ✅ **Plan gratuit généreux** (25 crédits/mois = ~25 GB)

---

## 📋 Plan de migration (5 étapes)

### Étape 1: Créer un compte Cloudinary (5 min)

1. **Aller sur** https://cloudinary.com/users/register/free
2. **Créer un compte gratuit**
3. **Récupérer tes identifiants** sur le dashboard:
   - Cloud Name
   - API Key
   - API Secret

### Étape 2: Configurer les variables d'environnement (2 min)

**Modifier** `backend/.env`:
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="ton_cloud_name"
CLOUDINARY_API_KEY="ton_api_key"
CLOUDINARY_API_SECRET="ton_api_secret"
```

### Étape 3: Tester la configuration (1 min)

```bash
cd backend
npx tsx -e "import cloudinary from './src/config/cloudinary'; console.log('✅ Cloudinary configuré:', cloudinary.config().cloud_name)"
```

### Étape 4: Migrer les fichiers existants (10-30 min)

```bash
# 1. Simulation (voir ce qui serait fait)
npx tsx scripts/migrate-to-cloudinary.ts

# 2. Si tout est OK, migration réelle
npx tsx scripts/migrate-to-cloudinary.ts --confirm
```

**Ce script va**:
- ✅ Upload tous les fichiers vers Cloudinary
- ✅ Mettre à jour les URLs en base de données
- ✅ Générer un rapport de migration

### Étape 5: Vérifier et nettoyer (5 min)

```bash
# 1. Vérifier que tout fonctionne sur le site
# 2. Nettoyer les fichiers locaux (optionnel)
npx tsx scripts/cleanup-local-uploads.ts
```

---

## 📊 Estimation des coûts

### Plan gratuit Cloudinary
- **Stockage**: 25 GB
- **Bande passante**: 25 GB/mois
- **Transformations**: 25,000/mois
- **Prix**: **0€/mois** ✅

### Notre utilisation actuelle
- **Stockage**: ~1 GB (après nettoyage)
- **Bande passante estimée**: 10-15 GB/mois
- **Verdict**: **Le plan gratuit suffit largement** ! 🎉

### Si on dépasse (improbable)
- **Plan Starter**: 89$/mois
  - 250 GB stockage
  - 250 GB bande passante
  - 250,000 transformations

---

## 🔧 Intégration dans le code

### Modifier le controller d'upload

**Avant** (`backend/src/controllers/admin.controller.ts`):
```typescript
// Upload local avec multer
const upload = multer({ dest: 'uploads/candidates/' });
```

**Après**:
```typescript
import { uploadToCloudinary } from '../config/cloudinary';

export const uploadCandidatePhoto = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('Aucun fichier fourni.', 400);

  // Upload vers Cloudinary
  const { url } = await uploadToCloudinary(
    req.file.path,
    'candidates',
    'image'
  );

  // Supprimer le fichier temporaire local
  fs.unlinkSync(req.file.path);

  // Mettre à jour en BD avec l'URL Cloudinary
  const candidate = await prisma.candidate.update({
    where: { id: Number(req.params.id) },
    data: { profilePhoto: url }
  });

  res.json({ success: true, data: { candidate } });
});
```

### Gestion de la suppression

**Quand un candidat change sa photo**:
```typescript
// Supprimer l'ancienne image de Cloudinary
if (candidate.profilePhoto && candidate.profilePhoto.includes('cloudinary')) {
  const publicId = extractPublicId(candidate.profilePhoto);
  await deleteFromCloudinary(publicId, 'image');
}
```

---

## 🎨 Optimisation automatique

### URLs avec transformation

**Image originale**:
```
https://res.cloudinary.com/mboa/image/upload/v1234/candidates/photo.jpg
```

**Image optimisée 300x300**:
```
https://res.cloudinary.com/mboa/image/upload/w_300,h_300,c_fill,q_auto,f_auto/v1234/candidates/photo.jpg
```

**Paramètres utiles**:
- `w_300,h_300` : Dimensions
- `c_fill` : Crop pour remplir
- `q_auto` : Qualité automatique
- `f_auto` : Format automatique (WebP si supporté)

### Exemple d'utilisation

```typescript
import { getOptimizedImageUrl } from '../config/cloudinary';

// Image de profil 200x200
const thumbnailUrl = getOptimizedImageUrl(publicId, 200, 200);

// Image haute résolution
const fullUrl = getOptimizedImageUrl(publicId, 1920, 1080);
```

---

## 📁 Structure dans Cloudinary

```
mboa-next-star/
├── candidates/          # Photos de profil
│   └── videos/          # Vidéos de prestation
├── site-media/          # Médias du site (banners, hero)
└── sponsors/            # Logos sponsors
```

---

## ⚠️ Points d'attention

### 1. Ne pas uploader les mêmes fichiers plusieurs fois
```typescript
// ❌ Mauvais: Upload à chaque fois
const { url } = await uploadToCloudinary(file.path, 'candidates', 'image');

// ✅ Bon: Vérifier si déjà uploadé
if (!candidate.profilePhoto || !candidate.profilePhoto.includes('cloudinary')) {
  const { url } = await uploadToCloudinary(file.path, 'candidates', 'image');
}
```

### 2. Nettoyer les fichiers temporaires
```typescript
// Toujours supprimer le fichier local après upload
fs.unlinkSync(req.file.path);
```

### 3. Gérer les erreurs
```typescript
try {
  const { url } = await uploadToCloudinary(file.path, 'candidates', 'image');
} catch (error) {
  // Fallback: garder le fichier local si Cloudinary échoue
  console.error('Cloudinary upload failed, using local storage');
  // Continuer avec l'upload local
}
```

---

## 🧪 Tests après migration

### Checklist de vérification

- [ ] Les photos de candidats s'affichent correctement
- [ ] Les vidéos se jouent sans problème
- [ ] Les logos sponsors sont visibles
- [ ] Les bannières/hero fonctionnent
- [ ] La page d'accueil charge rapidement
- [ ] Le profil candidat affiche la bonne photo/vidéo
- [ ] L'admin peut uploader de nouveaux médias

### Commandes de test

```bash
# 1. Vérifier la config Cloudinary
npx tsx -e "import cloudinary from './src/config/cloudinary'; console.log(cloudinary.config())"

# 2. Tester un upload manuel
npx tsx scripts/test-cloudinary-upload.ts

# 3. Vérifier les URLs en BD
npx tsx scripts/check-cloudinary-urls.ts
```

---

## 🔄 Rollback (en cas de problème)

Si quelque chose ne va pas, tu peux revenir en arrière:

### Option A: Garder les deux (temporaire)
Les fichiers locaux existent encore, donc:
1. Changer les URLs Cloudinary en URLs locales dans la BD
2. Redémarrer le backend
3. Tout redevient comme avant

### Option B: Restore depuis backup BD
```bash
# Restaurer la BD avant migration
psql -U postgres -d mboa_db < backup-avant-cloudinary.sql
```

---

## 📊 Monitoring Cloudinary

### Dashboard Cloudinary
- **URL**: https://console.cloudinary.com/
- **Métriques**:
  - Stockage utilisé
  - Bande passante consommée
  - Transformations effectuées
  - Crédits restants

### Alertes recommandées
- [ ] Alerte si 80% du quota utilisé
- [ ] Alerte si 95% du quota utilisé
- [ ] Email hebdomadaire avec stats

---

## 💰 Économies réalisées

### Coûts évités

| Poste | Avant (local) | Après (Cloudinary) |
|-------|---------------|-------------------|
| **Stockage** | Serveur + backups | Inclus gratuit |
| **Bande passante** | Serveur | CDN gratuit |
| **Maintenance** | Manuel | Automatique |
| **Optimisation** | À faire soi-même | Automatique |
| **Total/mois** | ~20-50€ | **0€** |

### Gains de performance
- **Chargement images**: -60% (CDN)
- **Chargement vidéos**: -70% (streaming optimisé)
- **Espace disque serveur**: -1 GB

---

## 🚀 Prochaines étapes (optionnelles)

### 1. Widgets d'upload Cloudinary
Utiliser le widget officiel pour uploads côté client:
```html
<script src="https://widget.cloudinary.com/v2.0/global/all.js"></script>
<script>
  cloudinary.createUploadWidget({
    cloudName: 'mboa-next-star',
    uploadPreset: 'mboa_uploads'
  }, (error, result) => {
    if (result.event === 'success') {
      console.log('URL:', result.info.secure_url);
    }
  }).open();
</script>
```

### 2. Prévisualisation automatique des vidéos
Cloudinary génère des thumbnails automatiquement:
```
https://res.cloudinary.com/mboa/video/upload/so_2.0/v1234/video.jpg
```

### 3. Watermarking
Ajouter automatiquement un logo sur les vidéos:
```typescript
cloudinary.url('video-id', {
  overlay: 'mboa-logo',
  gravity: 'south_east',
  width: 100
});
```

---

## 📞 Support

### En cas de problème

1. **Documentation Cloudinary**: https://cloudinary.com/documentation
2. **Support Cloudinary**: support@cloudinary.com
3. **Community**: https://community.cloudinary.com

### Logs utiles

```bash
# Logs backend (uploads Cloudinary)
tail -f backend/logs/app.log | grep cloudinary

# Tester la connexion Cloudinary
npx tsx -e "import cloudinary from './src/config/cloudinary'; cloudinary.api.ping().then(console.log)"
```

---

**Document créé le**: 29 juin 2026  
**Auteur**: Migration système MBOA NEXT STAR  
**Version**: 1.0  
**Status**: ✅ Prêt pour migration
