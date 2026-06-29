/**
 * Script pour vérifier le statut actuel du logo dans la configuration
 */

import prisma from '../src/utils/prisma';

async function checkLogoStatus() {
  console.log('\n📸 Vérification du statut du logo...\n');

  // Récupérer la configuration du logo
  const logoConfig = await prisma.siteConfiguration.findUnique({
    where: { configKey: 'logo_url' }
  });

  if (!logoConfig) {
    console.log('❌ Aucune configuration "logo_url" trouvée en base de données.');
    console.log('\n💡 Solution: Le logo doit être ajouté à la configuration.');
  } else {
    console.log('✅ Configuration "logo_url" trouvée:');
    console.log(`   Valeur actuelle: ${logoConfig.configValue}`);
    
    // Vérifier si c'est une URL Cloudinary ou locale
    if (logoConfig.configValue.includes('cloudinary.com')) {
      console.log('   Type: ✅ URL Cloudinary (CDN)');
    } else if (logoConfig.configValue.startsWith('/')) {
      console.log('   Type: ⚠️  URL locale (fichier sur le serveur)');
      console.log('\n💡 Recommandation: Migrer vers Cloudinary pour:');
      console.log('   - CDN global (chargement plus rapide)');
      console.log('   - Pas de gestion de fichiers locaux');
      console.log('   - Optimisation automatique');
    } else {
      console.log(`   Type: ℹ️  URL externe`);
    }
  }

  // Vérifier aussi site_logo (ancien champ)
  const siteLogoConfig = await prisma.siteConfiguration.findUnique({
    where: { configKey: 'site_logo' }
  });

  if (siteLogoConfig) {
    console.log('\n📌 Configuration "site_logo" (ancien champ):');
    console.log(`   Valeur: ${siteLogoConfig.configValue}`);
  }

  // Vérifier le fichier logo.jpg local
  const fs = require('fs');
  const path = require('path');
  const logoPath = path.join(process.cwd(), '..', 'Frontend', 'public', 'logo.jpg');
  
  if (fs.existsSync(logoPath)) {
    const stats = fs.statSync(logoPath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`\n📁 Fichier logo.jpg trouvé dans Frontend/public/`);
    console.log(`   Taille: ${sizeInKB} KB`);
    console.log(`   Date de modification: ${stats.mtime.toLocaleString('fr-FR')}`);
  } else {
    console.log(`\n❌ Fichier logo.jpg NON TROUVÉ dans Frontend/public/`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ ET PROCHAINES ÉTAPES');
  console.log('='.repeat(60));
  
  if (!logoConfig || logoConfig.configValue === '/logo.jpg') {
    console.log('\n🎯 ACTION REQUISE:');
    console.log('   1. Placer le nouveau logo MBOA NEXT STAR dans Frontend/public/logo.jpg');
    console.log('   2. OU uploader le logo vers Cloudinary et mettre à jour la config');
    console.log('\n📝 Commandes utiles:');
    console.log('   - Uploader vers Cloudinary: npx tsx scripts/upload-logo-to-cloudinary.ts');
    console.log('   - Tester le frontend: Ouvrir le site et vérifier la console navigateur');
  } else if (logoConfig.configValue.includes('cloudinary.com')) {
    console.log('\n✅ Logo configuré avec Cloudinary!');
    console.log('   - Vérifiez que le logo s\'affiche sur le site');
    console.log('   - Si non, videz le cache navigateur (Ctrl+Shift+R)');
  }
  
  console.log('\n');
  await prisma.$disconnect();
}

checkLogoStatus().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
