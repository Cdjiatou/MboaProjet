/**
 * Script pour analyser les fichiers uploads et identifier ceux non utilisés
 */

import prisma from '../src/utils/prisma';
import * as fs from 'fs';
import * as path from 'path';

interface UploadFile {
  path: string;
  name: string;
  size: number;
  type: 'video' | 'image';
  used: boolean;
  usedBy?: string;
}

async function analyzeUploads() {
  console.log('🔍 Analyse des fichiers uploads\n');

  const uploadsDir = path.join(__dirname, '../uploads');
  const files: UploadFile[] = [];

  // Parcourir tous les dossiers
  const folders = ['candidates', 'media', 'sponsors'];
  
  for (const folder of folders) {
    const folderPath = path.join(uploadsDir, folder);
    if (!fs.existsSync(folderPath)) continue;

    const folderFiles = fs.readdirSync(folderPath);
    
    for (const file of folderFiles) {
      if (file === '.gitkeep' || file === '.gitignore') continue;
      
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      
      const ext = path.extname(file).toLowerCase();
      const isVideo = ['.mp4', '.avi', '.mov', '.webm', '.mkv'].includes(ext);
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      
      files.push({
        path: `/uploads/${folder}/${file}`,
        name: file,
        size: stats.size,
        type: isVideo ? 'video' : 'image',
        used: false
      });
    }
  }

  console.log(`📁 Total de fichiers trouvés: ${files.length}\n`);

  // Vérifier l'utilisation dans la BD
  const candidates = await prisma.candidate.findMany({
    select: { profilePhoto: true, videoUrl: true, firstName: true, lastName: true }
  });

  const configs = await prisma.siteConfiguration.findMany();

  // Marquer les fichiers utilisés
  for (const file of files) {
    // Vérifier dans les candidats
    for (const candidate of candidates) {
      if (candidate.profilePhoto === file.path) {
        file.used = true;
        file.usedBy = `Candidat: ${candidate.firstName} ${candidate.lastName} (photo)`;
        break;
      }
      if (candidate.videoUrl === file.path) {
        file.used = true;
        file.usedBy = `Candidat: ${candidate.firstName} ${candidate.lastName} (vidéo)`;
        break;
      }
    }

    // Vérifier dans les configs
    for (const config of configs) {
      if (config.configValue.includes(file.path)) {
        file.used = true;
        file.usedBy = `Configuration: ${config.configKey}`;
        break;
      }
    }
  }

  // Statistiques
  const usedFiles = files.filter(f => f.used);
  const unusedFiles = files.filter(f => !f.used);
  const videos = files.filter(f => f.type === 'video');
  const images = files.filter(f => f.type === 'image');
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const unusedSize = unusedFiles.reduce((sum, f) => sum + f.size, 0);

  console.log('📊 STATISTIQUES\n');
  console.log(`📦 Total:           ${files.length} fichiers (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`✅ Utilisés:        ${usedFiles.length} fichiers`);
  console.log(`❌ Non utilisés:    ${unusedFiles.length} fichiers (${(unusedSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`🎥 Vidéos:          ${videos.length} fichiers`);
  console.log(`🖼️  Images:          ${images.length} fichiers`);

  // Détail des fichiers non utilisés
  if (unusedFiles.length > 0) {
    console.log('\n❌ FICHIERS NON UTILISÉS:\n');
    
    const unusedVideos = unusedFiles.filter(f => f.type === 'video');
    const unusedImages = unusedFiles.filter(f => f.type === 'image');
    
    if (unusedVideos.length > 0) {
      console.log('🎥 Vidéos non utilisées:');
      unusedVideos.forEach(f => {
        console.log(`   - ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
      });
      console.log('');
    }
    
    if (unusedImages.length > 0) {
      console.log('🖼️  Images non utilisées:');
      unusedImages.forEach(f => {
        console.log(`   - ${f.name} (${(f.size / 1024).toFixed(2)} KB)`);
      });
    }

    console.log('\n💡 RECOMMANDATIONS:\n');
    console.log('   1. Ces fichiers peuvent être supprimés pour libérer de l\'espace');
    console.log('   2. Vérifier manuellement avant suppression (peuvent être dans des tests)');
    console.log(`   3. Économie d'espace potentielle: ${(unusedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n   Commande pour supprimer (ATTENTION: IRRÉVERSIBLE):');
    console.log('   npx tsx scripts/cleanup-unused-uploads.ts');
  } else {
    console.log('\n✅ Tous les fichiers sont utilisés! Aucun nettoyage nécessaire.');
  }

  // Détail des fichiers utilisés
  console.log('\n✅ FICHIERS UTILISÉS:\n');
  const usedVideos = usedFiles.filter(f => f.type === 'video');
  const usedImages = usedFiles.filter(f => f.type === 'image');

  if (usedVideos.length > 0) {
    console.log('🎥 Vidéos utilisées:');
    usedVideos.forEach(f => {
      console.log(`   - ${f.name}`);
      console.log(`     Taille: ${(f.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`     ${f.usedBy}\n`);
    });
  }

  if (usedImages.length > 0) {
    console.log('🖼️  Images utilisées:');
    usedImages.forEach(f => {
      console.log(`   - ${f.name} (${(f.size / 1024).toFixed(2)} KB) - ${f.usedBy}`);
    });
  }

  await prisma.$disconnect();
}

analyzeUploads().catch(console.error);
