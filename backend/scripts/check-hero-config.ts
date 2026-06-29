import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHeroConfig() {
  try {
    const config = await prisma.siteConfiguration.findMany({
      where: {
        configKey: {
          in: ['hero_images', 'hero_image_1', 'hero_image_2', 'hero_image_3', 'hero_image_4', 'hero_image_5']
        }
      }
    });

    console.log('=== Configuration Hero Images ===');
    console.log(JSON.stringify(config, null, 2));
    
    if (config.length === 0) {
      console.log('\n⚠️  Aucune configuration hero_images trouvée en base!');
      console.log('Les images par défaut hardcodées seront utilisées.');
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHeroConfig();
