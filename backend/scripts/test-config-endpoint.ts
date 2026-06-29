/**
 * Script pour tester l'endpoint /config et voir ce qui est retourné
 */

import prisma from '../src/utils/prisma';

async function testConfigEndpoint() {
  try {
    console.log('🔍 Test de la configuration en base de données\n');
    
    // Récupération directe depuis la base
    const configs = await prisma.siteConfiguration.findMany();
    
    console.log(`📊 Total de ${configs.length} configurations trouvées:\n`);
    
    // Transformation en map comme le fait l'endpoint
    const configMap: Record<string, string> = configs.reduce(
      (acc, curr) => ({ ...acc, [curr.configKey]: curr.configValue }),
      {} as Record<string, string>
    );
    
    // Afficher tous les champs
    Object.keys(configMap).forEach(key => {
      const value = configMap[key];
      const displayValue = value && value.length > 100 
        ? value.substring(0, 100) + '...' 
        : value;
      console.log(`  ${key}: ${displayValue}`);
    });
    
    // Vérification spécifique du logo
    console.log('\n🎨 Vérification du logo:');
    if (configMap.logo_url) {
      console.log(`  ✅ logo_url trouvé: ${configMap.logo_url}`);
    } else {
      console.log('  ❌ logo_url NON trouvé en base');
      console.log('  ℹ️  Le frontend utilisera la valeur par défaut: /logo.jpg');
    }
    
    if (configMap.site_logo) {
      console.log(`  ✅ site_logo trouvé: ${configMap.site_logo}`);
    } else {
      console.log('  ❌ site_logo NON trouvé en base');
    }
    
    console.log('\n💡 Solution:');
    console.log('  1. Le fichier Frontend/public/logo.jpg existe déjà');
    console.log('  2. Remplace-le avec ton nouveau logo MBOA NEXT STAR');
    console.log('  3. Vide le cache du navigateur (Ctrl+Shift+R)');
    console.log('  4. Le logo devrait s\'afficher automatiquement');
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConfigEndpoint();
