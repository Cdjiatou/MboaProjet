import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newValue = JSON.stringify([
    "MBOA NEXT STAR est le plus grand concours national de talents urbains du Cameroun. Musique, humour, danse, DJ, Miss & Master : découvrez les étoiles de demain à travers des auditions, compétitions, contenus exclusifs et événements live.",
    "Une initiative portée par La Légende Vivante Tony Nobody pour révéler, former et propulser de nouveaux talents camerounais vers les scènes nationales et internationales.",
    "Abonnez-vous et vivez l'aventure MBOA NEXT STAR 2026-2027 ! 🚀🔥"
  ]);

  await prisma.siteConfiguration.update({
    where: { configKey: 'home_about_text' },
    data: { configValue: newValue }
  });
  console.log("Texte mis à jour avec succès dans la DB !");
}

main().catch(console.error).finally(() => prisma.$disconnect());
