/**
 * Script de vérification des vidéos en configuration
 * Affiche l'état actuel des vidéos et teste les patterns Facebook
 */

import prisma from '../src/utils/prisma';

async function checkVideos() {
  console.log('='.repeat(80));
  console.log('📹 VÉRIFICATION DES VIDÉOS EN BASE DE DONNÉES');
  console.log('='.repeat(80));

  try {
    // Récupérer la configuration des vidéos
    const videoConfig = await prisma.siteConfiguration.findUnique({
      where: { configKey: 'videos' }
    });

    if (!videoConfig || !videoConfig.configValue) {
      console.log('❌ Aucune vidéo trouvée en base de données');
      return;
    }

    console.log('\n📊 Valeur brute en base:');
    console.log(videoConfig.configValue);

    let videos: { title: string; url: string }[];
    try {
      videos = JSON.parse(videoConfig.configValue);
      console.log(`\n✅ ${videos.length} vidéo(s) trouvée(s):\n`);

      videos.forEach((video, index) => {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Vidéo #${index + 1}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📝 Titre: ${video.title}`);
        console.log(`🔗 URL: ${video.url}`);

        // Détection du type de vidéo
        let type = 'Inconnue';
        if (video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
          type = 'YouTube';
        } else if (video.url.includes('facebook.com') || video.url.includes('fb.watch')) {
          type = 'Facebook';
        } else if (video.url.includes('vimeo.com')) {
          type = 'Vimeo';
        } else if (video.url.startsWith('/uploads/')) {
          type = 'Locale';
        }
        console.log(`📺 Type détecté: ${type}`);

        // Tests spécifiques pour Facebook
        if (type === 'Facebook') {
          console.log('\n🔍 Analyse détaillée Facebook:');
          
          const patterns = [
            { name: 'facebook.com/watch?v=', regex: /facebook\.com\/watch\/?\?v=(\d+)/ },
            { name: 'facebook.com/videos/', regex: /facebook\.com\/.*\/videos\/(\d+)/ },
            { name: 'fb.watch/', regex: /fb\.watch\/([^/?]+)/ },
            { name: 'facebook.com/video.php?v=', regex: /facebook\.com\/video\.php\?v=(\d+)/ },
            { name: 'facebook.com/share/v/', regex: /facebook\.com\/share\/v\/([^/?]+)/ },
            { name: 'facebook.com/reel/', regex: /facebook\.com\/reel\/(\d+)/ },
          ];

          let matched = false;
          patterns.forEach(pattern => {
            const match = video.url.match(pattern.regex);
            if (match) {
              console.log(`  ✅ Pattern "${pattern.name}" matche → ID: ${match[1]}`);
              matched = true;
            }
          });

          if (!matched) {
            console.log('  ⚠️ Aucun pattern ne matche - utilisation de l\'URL complète');
          }

          // Générer l'URL d'embed Facebook
          const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false&autoplay=false`;
          console.log(`\n🎬 URL d'intégration générée:`);
          console.log(`   ${embedUrl.substring(0, 100)}${embedUrl.length > 100 ? '...' : ''}`);
        }

        console.log('');
      });

    } catch (parseError) {
      console.error('❌ Erreur lors du parsing JSON:', parseError);
      console.log('Valeur problématique:', videoConfig.configValue);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos()
  .then(() => {
    console.log('━'.repeat(80));
    console.log('✅ Vérification terminée');
    console.log('━'.repeat(80));
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
