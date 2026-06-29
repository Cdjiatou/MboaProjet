import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixHeroImages() {
  try {
    // Images par défaut
    const DEFAULT_IMAGES = [
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/e4c4da7ff_WhatsAppImage2026-06-24at122312.jpg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/ef6237930_WhatsAppImage2026-06-24at122313.jpg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/65bd1e076_WhatsAppImage2026-06-24at122314.jpeg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/cca43cfe1_WhatsAppImage2026-06-24at122315.jpg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/9f593dbde_WhatsAppImage2026-06-24at122316.jpg",
    ];

    // Récupérer la configuration actuelle
    const currentConfig = await prisma.siteConfiguration.findUnique({
      where: { configKey: 'hero_images' }
    });

    let uploadedImages: string[] = [];
    if (currentConfig) {
      try {
        const parsed = JSON.parse(currentConfig.configValue);
        // Garder uniquement les images uploadées (contiennent '/uploads/')
        uploadedImages = parsed.filter((img: string) => img.includes('/uploads/'));
      } catch (e) {
        console.error('Erreur parsing:', e);
      }
    }

    // Fusionner : images par défaut + images uploadées
    const mergedImages = [...DEFAULT_IMAGES, ...uploadedImages];

    // Mettre à jour la configuration
    await prisma.siteConfiguration.upsert({
      where: { configKey: 'hero_images' },
      update: { configValue: JSON.stringify(mergedImages) },
      create: { configKey: 'hero_images', configValue: JSON.stringify(mergedImages) }
    });

    console.log('✅ Configuration hero_images mise à jour avec succès !');
    console.log(`   - ${DEFAULT_IMAGES.length} images par défaut`);
    console.log(`   - ${uploadedImages.length} images uploadées`);
    console.log(`   - ${mergedImages.length} images au total`);
    console.log('\nImages fusionnées:');
    mergedImages.forEach((img, idx) => {
      const type = img.includes('/uploads/') ? '📤 Uploadée' : '🌐 Défaut';
      console.log(`   ${idx + 1}. ${type}: ${img.substring(0, 60)}...`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHeroImages();
