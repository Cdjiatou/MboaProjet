# Gestion des fichiers uploads - MBOA NEXT STAR

## Date: 29 juin 2026

---

## 🔍 Problème identifié

### Situation actuelle
- **41 fichiers** uploads = **1.1 GB** d'espace disque
- **9 fichiers utilisés** (274 MB) ✅
- **32 fichiers NON utilisés** (850 MB) ❌ = **76% de gaspillage !**

### Causes du problème

1. **Uploads multiples lors des tests**
   - Chaque upload sauvegarde immédiatement le fichier
   - Même si l'opération est annulée après

2. **Pas de nettoyage automatique**
   - Les anciens fichiers restent même quand remplacés
   - Duplications lors des modifications

3. **Doublons**
   - `TEASER_MBOA_NEXT_STAR` : **6 copies** = 306 MB gaspillés
   - `BE_save.mp4` : **5 copies** = 361 MB gaspillés
   - `LOGO_MBOA_NEXT_STAR` : **5 copies** = 145 MB gaspillés

---

## ✅ Solutions implémentées

### 1. Script d'analyse
**Fichier**: `backend/scripts/analyze-uploads.ts`

**Utilisation**:
```bash
cd backend
npx tsx scripts/analyze-uploads.ts
```

**Ce qu'il fait**:
- Liste tous les fichiers uploads
- Vérifie leur utilisation dans la BD
- Affiche les statistiques détaillées
- Identifie les fichiers non utilisés

### 2. Script de nettoyage
**Fichier**: `backend/scripts/cleanup-unused-uploads.ts`

**Utilisation**:
```bash
# Mode simulation (recommandé d'abord)
npx tsx scripts/cleanup-unused-uploads.ts

# Suppression réelle (IRRÉVERSIBLE!)
npx tsx scripts/cleanup-unused-uploads.ts --confirm
```

**Ce qu'il fait**:
- Identifie les fichiers non référencés en BD
- Mode dry-run par défaut (sécurité)
- Supprime les fichiers inutilisés
- Affiche l'espace libéré

---

## 🎯 Recommandations

### Actions immédiates

1. **Analyser les uploads**
   ```bash
   npx tsx scripts/analyze-uploads.ts
   ```

2. **Tester le nettoyage (simulation)**
   ```bash
   npx tsx scripts/cleanup-unused-uploads.ts
   ```

3. **Nettoyer réellement**
   ```bash
   npx tsx scripts/cleanup-unused-uploads.ts --confirm
   ```
   ⚠️ **ATTENTION**: Cette action est **IRRÉVERSIBLE** !

4. **Économie d'espace attendue**: **850 MB** libérés

### Prévention future

#### A. Nettoyage automatique lors des remplacements

**Modifier** `backend/src/controllers/admin.controller.ts`:

```typescript
// Lors du remplacement d'une photo de candidat
export const uploadCandidatePhoto = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    throw new AppError('Aucun fichier fourni.', 400);
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: Number(id) } });
  if (!candidate) throw new AppError('Candidat introuvable.', 404);

  // ✅ NOUVEAU: Supprimer l'ancienne photo
  if (candidate.profilePhoto && candidate.profilePhoto.startsWith('/uploads/')) {
    const oldPath = path.join(__dirname, '../../', candidate.profilePhoto);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`🗑️  Ancienne photo supprimée: ${candidate.profilePhoto}`);
    }
  }

  const newPhotoUrl = `/uploads/candidates/${req.file.filename}`;
  
  const updated = await prisma.candidate.update({
    where: { id: Number(id) },
    data: { profilePhoto: newPhotoUrl },
    include: { category: true },
  });

  res.json({ success: true, data: { candidate: updated } });
});
```

#### B. Validation avant upload

**Ajouter** dans les controllers:

```typescript
// Vérifier que le fichier n'est pas trop volumineux
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB

if (isVideo && req.file.size > MAX_VIDEO_SIZE) {
  throw new AppError('La vidéo est trop volumineuse (max 100 MB).', 400);
}

if (isImage && req.file.size > MAX_IMAGE_SIZE) {
  throw new AppError('L\'image est trop volumineuse (max 5 MB).', 400);
}
```

#### C. Tâche CRON de nettoyage hebdomadaire

**Créer** `backend/src/tasks/cleanup.task.ts`:

```typescript
import cron from 'node-cron';
import { execSync } from 'child_process';

// Tous les lundis à 3h du matin
cron.schedule('0 3 * * 1', () => {
  console.log('🧹 Nettoyage automatique des uploads...');
  try {
    execSync('npx tsx scripts/cleanup-unused-uploads.ts --confirm');
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
});
```

---

## 📊 Bonnes pratiques

### 1. Optimisation des vidéos avant upload

**Utiliser FFmpeg pour compresser**:
```bash
# Compresser une vidéo à 720p, 30fps, codec H.264
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

**Avantages**:
- Réduit la taille de 50-70%
- Garde une qualité acceptable
- Chargement plus rapide

### 2. Utilisation de services externes

**Pour les grosses vidéos**, considérer:
- **YouTube** (gratuit, illimité)
- **Vimeo** (meilleure qualité)
- **Cloudinary** (CDN + optimisation auto)

**Avantages**:
- ✅ Pas de stockage sur ton serveur
- ✅ Streaming optimisé
- ✅ Bande passante offerte
- ✅ Embed facile

### 3. Structure des uploads

**Garder la structure actuelle**:
```
backend/uploads/
├── candidates/     # Photos de profil
├── media/          # Vidéos/images générales
└── sponsors/       # Logos sponsors
```

**Ajouter** `.gitignore` dans chaque dossier:
```
# Ignorer tous les fichiers sauf .gitkeep
*
!.gitignore
!.gitkeep
```

### 4. Surveillance de l'espace disque

**Script de monitoring** `backend/scripts/check-disk-space.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';

function getDirSize(dirPath: string): number {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}

const uploadsSize = getDirSize(path.join(__dirname, '../uploads'));
const sizeInMB = uploadsSize / 1024 / 1024;

console.log(`📁 Taille totale des uploads: ${sizeInMB.toFixed(2)} MB`);

if (sizeInMB > 1000) {
  console.log('⚠️  ALERTE: Les uploads dépassent 1 GB! Nettoyage recommandé.');
}
```

---

## 🚀 Plan d'action

### Phase 1: Nettoyage immédiat (aujourd'hui)
1. ✅ Analyser les uploads
2. ✅ Exécuter le nettoyage
3. ✅ Libérer 850 MB

### Phase 2: Prévention (cette semaine)
1. ⏳ Implémenter suppression automatique lors des remplacements
2. ⏳ Ajouter validation de taille
3. ⏳ Optimiser les vidéos existantes

### Phase 3: Monitoring (ce mois)
1. ⏳ Mettre en place la tâche CRON hebdomadaire
2. ⏳ Ajouter alertes si uploads > 1 GB
3. ⏳ Documenter le processus

### Phase 4: Migration (optionnelle)
1. ⏳ Évaluer services externes (YouTube, Cloudinary)
2. ⏳ Migrer les grosses vidéos si nécessaire
3. ⏳ Mettre à jour la documentation

---

## 📝 Checklist de maintenance

### Hebdomadaire
- [ ] Vérifier l'espace disque (`npx tsx scripts/check-disk-space.ts`)
- [ ] Exécuter l'analyse (`npx tsx scripts/analyze-uploads.ts`)

### Mensuel
- [ ] Nettoyer les fichiers non utilisés
- [ ] Optimiser les vidéos volumineuses
- [ ] Vérifier les logs du serveur

### Trimestriel
- [ ] Audit complet des uploads
- [ ] Évaluation des coûts de stockage
- [ ] Considérer migration vers service externe

---

## 🔗 Commandes rapides

```bash
# Analyse complète
npx tsx scripts/analyze-uploads.ts

# Simulation de nettoyage
npx tsx scripts/cleanup-unused-uploads.ts

# Nettoyage réel (ATTENTION!)
npx tsx scripts/cleanup-unused-uploads.ts --confirm

# Vérifier l'espace disque
du -sh backend/uploads/*

# Compter les fichiers par type
find backend/uploads -type f -name "*.mp4" | wc -l
find backend/uploads -type f -name "*.jpg" | wc -l
```

---

**Document créé le**: 29 juin 2026  
**Auteur**: Analyse système MBOA NEXT STAR  
**Version**: 1.0
