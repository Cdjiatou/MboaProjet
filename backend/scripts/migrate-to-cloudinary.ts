/**
 * Script pour migrer tous les uploads locaux vers Cloudinary
 * 
 * Ce script :
 * 1. Upload tous les fichiers de backend/uploads vers Cloudinary
 * 2. Met à jour les URLs dans la base de données
 * 3. Génère un rapport de migration
 * 4. Optionnellement supprime les fichiers locaux après migration
 */

import prisma from '../src/utils/prisma';
import { uploadToCloudinary } from '../src/config/cloudinary';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  success: boolean;
  localPath: string;
  cloudinaryUrl: string;
  publicId: string;
  error?: string;
}

async function migrateToCloudinary(dryRun = true) {
  console.log('☁️  Migration vers Cloudinary\n');
  
  if (dryRun) {
    console.log('⚠️  MODE DRY-RUN: Aucun fichier ne sera uploadé ni modifié');
    console.log('   Pour effectuer la migration, lancez: npx tsx scripts/migrate-to-cloudinary.ts --confirm\n');
  } else {
    console.log('⚠️  MODE RÉEL: Les fichiers seront uploadés sur Cloudinary');
    console.log('   et les URLs en base seront mises à jour!');
    console.log('   Appuyez sur Ctrl+C pour annuler...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const results: MigrationResult[] = [];
  const uploadsDir = path.join(__dirname, '../uploads');

  // ==========================================
  // 1. MIGRER LES PHOTOS DE CANDIDATS
  // ==========================================
  console.log('📸 Migration des photos de candidats...\n');
  
  const candidates = await prisma.candidate.findMany({
    where: {
      profilePhoto: { startsWith: '/uploads/candidates/' }
    }
  });

  for (const candidate of candidates) {
    const localPath = candidate.profilePhoto!;
    const fullPath = path.join(__dirname, '..', localPath);

    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  Fichier introuvable: ${localPath}`);
      continue;
    }

    try {
      if (!dryRun) {
        // Upload vers Cloudinary
        const { url, publicId } = await uploadToCloudinary(fullPath, 'candidates', 'image');
        
        // Mettre à jour en BD
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { profilePhoto: url }
        });

        results.push({
          success: true,
          localPath,
          cloudinaryUrl: url,
          publicId
        });

        console.log(`   ✅ ${candidate.firstName} ${candidate.lastName}: ${url}`);
      } else {
        console.log(`   [SIMULATION] ${candidate.firstName} ${candidate.lastName}: ${localPath}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erreur pour ${candidate.firstName}: ${error.message}`);
      results.push({
        success: false,
        localPath,
        cloudinaryUrl: '',
        publicId: '',
        error: error.message
      });
    }
  }

  // ==========================================
  // 2. MIGRER LES VIDÉOS DES CANDIDATS
  // ==========================================
  console.log('\n🎥 Migration des vidéos de candidats...\n');
  
  const candidatesWithVideo = await prisma.candidate.findMany({
    where: {
      videoUrl: { startsWith: '/uploads/' }
    }
  });

  for (const candidate of candidatesWithVideo) {
    const localPath = candidate.videoUrl!;
    const fullPath = path.join(__dirname, '..', localPath);

    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  Fichier introuvable: ${localPath}`);
      continue;
    }

    try {
      if (!dryRun) {
        const { url, publicId } = await uploadToCloudinary(fullPath, 'candidates/videos', 'video');
        
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { videoUrl: url }
        });

        results.push({
          success: true,
          localPath,
          cloudinaryUrl: url,
          publicId
        });

        console.log(`   ✅ ${candidate.firstName} ${candidate.lastName}: ${url}`);
      } else {
        console.log(`   [SIMULATION] ${candidate.firstName} ${candidate.lastName}: ${localPath}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erreur pour ${candidate.firstName}: ${error.message}`);
    }
  }

  // ==========================================
  // 3. MIGRER LES MÉDIAS DE LA CONFIGURATION
  // ==========================================
  console.log('\n🖼️  Migration des médias de configuration...\n');
  
  const configs = await prisma.siteConfiguration.findMany();

  for (const config of configs) {
    const value = config.configValue;
    
    // Chercher toutes les URLs /uploads/ dans la valeur
    const uploadMatches = value.match(/\/uploads\/[^\s",\]]+/g);
    
    if (!uploadMatches || uploadMatches.length === 0) continue;

    let newValue = value;
    let changed = false;

    for (const localPath of uploadMatches) {
      const fullPath = path.join(__dirname, '..', localPath);

      if (!fs.existsSync(fullPath)) continue;

      try {
        if (!dryRun) {
          // Déterminer le type de fichier
          const ext = path.extname(localPath).toLowerCase();
          const isVideo = ['.mp4', '.avi', '.mov', '.webm'].includes(ext);
          const resourceType = isVideo ? 'video' : 'image';

          const { url, publicId } = await uploadToCloudinary(
            fullPath, 
            'site-media', 
            resourceType
          );

          // Remplacer l'ancienne URL par la nouvelle
          newValue = newValue.replace(localPath, url);
          changed = true;

          results.push({
            success: true,
            localPath,
            cloudinaryUrl: url,
            publicId
          });

          console.log(`   ✅ ${config.configKey}: ${localPath} → ${url}`);
        } else {
          console.log(`   [SIMULATION] ${config.configKey}: ${localPath}`);
        }
      } catch (error: any) {
        console.log(`   ❌ Erreur pour ${config.configKey}/${localPath}: ${error.message}`);
      }
    }

    // Mettre à jour la config si changée
    if (!dryRun && changed) {
      await prisma.siteConfiguration.update({
        where: { id: config.id },
        data: { configValue: newValue }
      });
    }
  }

  // ==========================================
  // 4. MIGRER LES LOGOS DES SPONSORS
  // ==========================================
  console.log('\n🏢 Migration des logos sponsors...\n');
  
  const sponsorsConfig = await prisma.siteConfiguration.findFirst({
    where: { configKey: 'sponsors' }
  });

  if (sponsorsConfig) {
    try {
      const sponsors = JSON.parse(sponsorsConfig.configValue);
      let changed = false;

      for (const sponsor of sponsors) {
        if (sponsor.image && sponsor.image.startsWith('/uploads/')) {
          const fullPath = path.join(__dirname, '..', sponsor.image);

          if (fs.existsSync(fullPath)) {
            if (!dryRun) {
              const { url } = await uploadToCloudinary(fullPath, 'sponsors', 'image');
              sponsor.image = url;
              changed = true;
              console.log(`   ✅ ${sponsor.name}: ${url}`);
            } else {
              console.log(`   [SIMULATION] ${sponsor.name}: ${sponsor.image}`);
            }
          }
        }
      }

      if (!dryRun && changed) {
        await prisma.siteConfiguration.update({
          where: { id: sponsorsConfig.id },
          data: { configValue: JSON.stringify(sponsors) }
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Erreur parsing sponsors: ${error.message}`);
    }
  }

  // ==========================================
  // RAPPORT FINAL
  // ==========================================
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT DE MIGRATION\n');
  console.log(`✅ Réussis: ${successCount}`);
  console.log(`❌ Échecs: ${failCount}`);
  console.log(`📦 Total traité: ${results.length}`);

  if (dryRun) {
    console.log('\n💡 Pour effectuer la migration réelle:');
    console.log('   npx tsx scripts/migrate-to-cloudinary.ts --confirm');
  } else {
    console.log('\n✅ Migration terminée!');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Vérifier que tout fonctionne correctement');
    console.log('   2. Nettoyer les fichiers locaux:');
    console.log('      npx tsx scripts/cleanup-local-uploads.ts');
  }

  await prisma.$disconnect();
}

// Vérifier si --confirm est passé
const args = process.argv.slice(2);
const confirm = args.includes('--confirm');

migrateToCloudinary(!confirm).catch(console.error);
