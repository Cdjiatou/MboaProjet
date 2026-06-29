/**
 * Script pour mettre à jour l'URL du logo dans la configuration
 * 
 * Usage:
 * npx tsx scripts/update-logo-url.ts "https://res.cloudinary.com/dlcrb5pat/image/upload/v1234/logo.jpg"
 * npx tsx scripts/update-logo-url.ts "/logo.jpg"
 */

import prisma from '../src/utils/prisma';

async function updateLogoUrl() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n📝 Usage: npx tsx scripts/update-logo-url.ts <url>\n');
    console.log('Exemples:');
    console.log('  npx tsx scripts/update-logo-url.ts "https://res.cloudinary.com/dlcrb5pat/image/upload/v1234/logo.jpg"');
    console.log('  npx tsx scripts/update-logo-url.ts "/logo.jpg"');
    console.log('  npx tsx scripts/update-logo-url.ts "https://example.com/images/logo.png"');
    console.log('\n');
    process.exit(1);
  }

  const newUrl = args[0];
  
  console.log('\n🎨 Mise à jour de l\'URL du logo...\n');
  console.log(`📸 Nouvelle URL: ${newUrl}`);

  // Déterminer le type d'URL
  let urlType = '';
  if (newUrl.includes('cloudinary.com')) {
    urlType = '☁️  Cloudinary CDN';
  } else if (newUrl.startsWith('/')) {
    urlType = '📁 Fichier local';
  } else if (newUrl.startsWith('http')) {
    urlType = '🌐 URL externe';
  } else {
    console.error('❌ Format d\'URL invalide!');
    console.log('   L\'URL doit commencer par: http://, https://, ou /');
    process.exit(1);
  }

  console.log(`   Type: ${urlType}\n`);

  try {
    // Vérifier la configuration actuelle
    const current = await prisma.siteConfiguration.findUnique({
      where: { configKey: 'logo_url' }
    });

    if (current) {
      console.log('📋 Configuration actuelle:');
      console.log(`   Ancienne URL: ${current.configValue}`);
    } else {
      console.log('ℹ️  Aucune configuration existante (création d\'une nouvelle entrée)');
    }

    // Mettre à jour ou créer la configuration
    const updated = await prisma.siteConfiguration.upsert({
      where: { configKey: 'logo_url' },
      update: { 
        configValue: newUrl,
        updatedAt: new Date()
      },
      create: {
        configKey: 'logo_url',
        configValue: newUrl
      }
    });

    console.log('\n✅ Configuration mise à jour avec succès!');
    console.log(`   Nouvelle URL: ${updated.configValue}`);
    console.log(`   Dernière modification: ${updated.updatedAt.toLocaleString('fr-FR')}`);

    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('   1. Redémarrer le frontend pour recharger la config');
    console.log('   2. Vider le cache navigateur: Ctrl + Shift + R');
    console.log('   3. Vérifier que le logo s\'affiche dans le Header et Footer');
    
    if (newUrl.startsWith('/')) {
      console.log('\n⚠️  ATTENTION: Vous utilisez un fichier local!');
      console.log(`   Assurez-vous que le fichier existe dans: Frontend/public${newUrl}`);
    }

    console.log('\n');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateLogoUrl().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
