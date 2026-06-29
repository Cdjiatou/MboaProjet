/**
 * Script pour ajouter la configuration logo_url en base de données
 */

import prisma from '../src/utils/prisma';

async function addLogoConfig() {
  try {
    console.log('🎨 Ajout de la configuration du logo en base de données\n');
    
    // Vérifier si logo_url existe déjà
    const existing = await prisma.siteConfiguration.findFirst({
      where: { configKey: 'logo_url' }
    });
    
    if (existing) {
      console.log('ℹ️  Configuration logo_url existe déjà:');
      console.log(`   Valeur actuelle: ${existing.configValue}`);
      console.log('\n💡 Pour la mettre à jour, utilise l\'interface admin.');
    } else {
      // Créer la configuration avec la valeur par défaut
      const created = await prisma.siteConfiguration.create({
        data: {
          configKey: 'logo_url',
          configValue: '/logo.jpg'
        }
      });
      
      console.log('✅ Configuration logo_url créée avec succès!');
      console.log(`   Clé: ${created.configKey}`);
      console.log(`   Valeur: ${created.configValue}`);
      console.log(`   Créé le: ${created.createdAt}`);
      
      console.log('\n💡 Prochaines étapes:');
      console.log('   1. Remplace le fichier Frontend/public/logo.jpg avec ton nouveau logo');
      console.log('   2. Vide le cache du navigateur (Ctrl+Shift+R)');
      console.log('   3. Le logo devrait s\'afficher dans la navbar et le footer');
      console.log('\n   OU');
      console.log('   1. Va dans l\'interface admin');
      console.log('   2. Upload ton logo via "Gestion du contenu"');
      console.log('   3. Il sera automatiquement affiché partout');
    }
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addLogoConfig();
