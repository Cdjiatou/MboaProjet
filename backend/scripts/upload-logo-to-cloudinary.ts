/**
 * Script pour uploader le logo vers Cloudinary et mettre à jour la configuration
 * 
 * Usage:
 * 1. Placer le fichier logo dans: Frontend/public/logo.jpg
 * 2. Exécuter: npx tsx scripts/upload-logo-to-cloudinary.ts
 */

import prisma from '../src/utils/prisma';
import { uploadToCloudinary } from '../src/config/cloudinary';
import * as fs from 'fs';
import * as path from 'path';

async function uploadLogo() {
  console.log('\n🎨 Upload du logo MBOA NEXT STAR vers Cloudinary...\n');

  // Chemin du logo local
  const logoPath = path.join(process.cwd(), '..', 'Frontend', 'public', 'logo.jpg');

  // Vérifier si le fichier existe
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Fichier logo.jpg introuvable dans Frontend/public/');
    console.log('\n💡 Solution:');
    console.log('   1. Placez votre nouveau logo MBOA NEXT STAR dans: Frontend/public/logo.jpg');
    console.log('   2. Format accepté: JPG, PNG (JPG recommandé)');
    console.log('   3. Relancez ce script');
    process.exit(1);
  }

  const stats = fs.statSync(logoPath);
  const sizeInKB = (stats.size / 1024).toFixed(2);
  console.log(`📁 Logo trouvé: ${sizeInKB} KB`);

  try {
    // Upload vers Cloudinary
    console.log('📤 Upload vers Cloudinary en cours...');
    const { url, publicId } = await uploadToCloudinary(
      logoPath,
      'site-media',
      'image'
    );

    console.log('✅ Upload réussi!');
    console.log(`   URL Cloudinary: ${url}`);
    console.log(`   Public ID: ${publicId}`);

    // Mettre à jour la configuration en base de données
    console.log('\n💾 Mise à jour de la configuration en base de données...');
    
    await prisma.siteConfiguration.upsert({
      where: { configKey: 'logo_url' },
      update: { configValue: url },
      create: {
        configKey: 'logo_url',
        configValue: url
      }
    });

    console.log('✅ Configuration mise à jour!');

    // Vérifier la configuration
    const config = await prisma.siteConfiguration.findUnique({
      where: { configKey: 'logo_url' }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION DU LOGO TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log(`\n📸 URL du logo: ${config?.configValue}`);
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('   1. Redémarrer le backend: npm run dev');
    console.log('   2. Redémarrer le frontend: npm run dev');
    console.log('   3. Vider le cache navigateur: Ctrl + Shift + R');
    console.log('   4. Vérifier que le logo s\'affiche dans le Header et Footer');
    console.log('\n💡 Le logo est maintenant servi par Cloudinary CDN (chargement ultra-rapide!)');
    console.log('\n');

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'upload:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

uploadLogo().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
