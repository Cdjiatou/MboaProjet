/**
 * Script pour nettoyer les fichiers uploads non utilisés
 * ATTENTION: Ce script supprime définitivement les fichiers !
 */

import prisma from '../src/utils/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function cleanupUnusedUploads(dryRun = true) {
  console.log('🧹 Nettoyage des fichiers uploads non utilisés\n');
  
  if (dryRun) {
    console.log('⚠️  MODE DRY-RUN: Aucun fichier ne sera supprimé (simulation)');
    console.log('   Pour supprimer réellement, lancez: npx tsx scripts/cleanup-unused-uploads.ts --confirm\n');
  } else {
    console.log('⚠️  MODE RÉEL: Les fichiers seront DÉFINITIVEMENT supprimés!');
    console.log('   Appuyez sur Ctrl+C maintenant pour annuler...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const uploadsDir = path.join(__dirname, '../uploads');
  const files: string[] = [];
  let totalSize = 0;

  // Récupérer tous les fichiers
  const folders = ['candidates', 'media', 'sponsors'];
  
  for (const folder of folders) {
    const folderPath = path.join(uploadsDir, folder);
    if (!fs.existsSync(folderPath)) continue;

    const folderFiles = fs.readdirSync(folderPath);
    
    for (const file of folderFiles) {
      if (file === '.gitkeep' || file === '.gitignore') continue;
      
      const filePath = `/uploads/${folder}/${file}`;
      const fullPath = path.join(folderPath, file);
      const stats = fs.statSync(fullPath);
      
      files.push(filePath);
    }
  }

  // Récupérer toutes les références en BD
  const candidates = await prisma.candidate.findMany({
    select: { profilePhoto: true, videoUrl: true }
  });

  const configs = await prisma.siteConfiguration.findMany();

  const usedFiles = new Set<string>();

  // Marquer les fichiers utilisés
  for (const candidate of candidates) {
    if (candidate.profilePhoto) usedFiles.add(candidate.profilePhoto);
    if (candidate.videoUrl && candidate.videoUrl.startsWith('/uploads')) {
      usedFiles.add(candidate.videoUrl);
    }
  }

  for (const config of configs) {
    const value = config.configValue;
    for (const file of files) {
      if (value.includes(file)) {
        usedFiles.add(file);
      }
    }
  }

  // Identifier les fichiers à supprimer
  const toDelete = files.filter(f => !usedFiles.has(f));

  console.log(`\n📊 RÉSULTATS:\n`);
  console.log(`   Total fichiers: ${files.length}`);
  console.log(`   Utilisés: ${usedFiles.size}`);
  console.log(`   À supprimer: ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log('✅ Aucun fichier à supprimer. Tout est propre!');
    await prisma.$disconnect();
    return;
  }

  let deletedCount = 0;
  let freedSpace = 0;

  for (const file of toDelete) {
    const parts = file.split('/');
    const folder = parts[2]; // uploads/folder/file
    const filename = parts[3];
    const fullPath = path.join(uploadsDir, folder, filename);

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      freedSpace += stats.size;

      if (dryRun) {
        console.log(`   [SIMULATION] Supprimerait: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        try {
          fs.unlinkSync(fullPath);
          console.log(`   ✅ Supprimé: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          deletedCount++;
        } catch (error: any) {
          console.log(`   ❌ Erreur lors de la suppression de ${file}: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n💾 Espace ${dryRun ? 'qui serait ' : ''}libéré: ${(freedSpace / 1024 / 1024).toFixed(2)} MB`);
  
  if (dryRun) {
    console.log(`\n💡 Pour effectuer le nettoyage réel, lancez:`);
    console.log(`   npx tsx scripts/cleanup-unused-uploads.ts --confirm`);
  } else {
    console.log(`\n✅ Nettoyage terminé! ${deletedCount} fichiers supprimés.`);
  }

  await prisma.$disconnect();
}

// Vérifier si --confirm est passé en argument
const args = process.argv.slice(2);
const confirm = args.includes('--confirm');

cleanupUnusedUploads(!confirm).catch(console.error);
