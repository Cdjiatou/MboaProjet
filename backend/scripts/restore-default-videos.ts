/**
 * Script de restauration des vidéos par défaut
 * Fusionne les vidéos par défaut avec la vidéo Facebook existante
 */

import prisma from '../src/utils/prisma';

const DEFAULT_VIDEOS = [
  {
    title: "MBOA NEXT STAR 2026 - Bande Annonce Officielle",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // À remplacer par la vraie vidéo
  },
  {
    title: "Coulisses des Auditions - MBOA NEXT STAR",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // À remplacer par la vraie vidéo
  },
  {
    title: "Moments Forts - Saison 2026",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // À remplacer par la vraie vidéo
  }
];

async function restoreDefaultVideos() {
  console.log('='.repeat(80));
  console.log('🎬 RESTAURATION DES VIDÉOS PAR DÉFAUT');
  console.log('='.repeat(80));

  try {
    // Récupérer les vidéos actuelles
    const currentConfig = await prisma.siteConfiguration.findUnique({
      where: { configKey: 'videos' }
    });

    let currentVideos: { title: string; url: string }[] = [];
    
    if (currentConfig && currentConfig.configValue) {
      try {
        currentVideos = JSON.parse(currentConfig.configValue);
        console.log(`\n📊 Vidéos actuelles: ${currentVideos.length}`);
        currentVideos.forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.title} (${v.url.substring(0, 50)}...)`);
        });
      } catch (e) {
        console.error('Erreur parsing vidéos actuelles:', e);
      }
    } else {
      console.log('\n📊 Aucune vidéo actuelle trouvée');
    }

    // Fusionner : garder les vidéos existantes + ajouter les défauts qui n'existent pas
    const mergedVideos = [...currentVideos];
    
    DEFAULT_VIDEOS.forEach(defaultVideo => {
      // Vérifier si cette vidéo existe déjà (par URL)
      const exists = currentVideos.some(v => v.url === defaultVideo.url);
      if (!exists) {
        mergedVideos.push(defaultVideo);
      }
    });

    console.log(`\n✅ Vidéos après fusion: ${mergedVideos.length}`);
    mergedVideos.forEach((v, i) => {
      const isNew = !currentVideos.some(cv => cv.url === v.url);
      console.log(`  ${i + 1}. ${isNew ? '🆕' : '📌'} ${v.title}`);
      console.log(`      ${v.url.substring(0, 70)}...`);
    });

    // Sauvegarder en base
    await prisma.siteConfiguration.upsert({
      where: { configKey: 'videos' },
      update: { configValue: JSON.stringify(mergedVideos) },
      create: { configKey: 'videos', configValue: JSON.stringify(mergedVideos) }
    });

    console.log(`\n💾 Sauvegarde réussie: ${mergedVideos.length} vidéo(s) en base`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDefaultVideos()
  .then(() => {
    console.log('\n' + '='.repeat(80));
    console.log('✅ Restauration terminée avec succès');
    console.log('='.repeat(80));
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
