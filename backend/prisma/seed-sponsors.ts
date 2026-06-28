/**
 * @file seed-sponsors.ts
 * @description Script pour peupler la base de données avec des sponsors d'exemple
 * Exécution : npx ts-node prisma/seed-sponsors.ts
 */

import { PrismaClient, SponsorTier, MediaType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding des sponsors...');

  // Nettoyer les données existantes
  await prisma.sponsorMedia.deleteMany();
  await prisma.sponsor.deleteMany();

  // Créer des sponsors avec leurs médias
  const heritage = await prisma.sponsor.create({
    data: {
      name: 'Heritage',
      description: 'Nous voyons demain',
      tier: SponsorTier.PLATINUM,
      displayOrder: 1,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/heritage-logo.png',
            title: 'Heritage Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const moodCom = await prisma.sponsor.create({
    data: {
      name: 'Mood & Com',
      description: 'Agence de communication',
      tier: SponsorTier.GOLD,
      displayOrder: 2,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/mood-com-logo.png',
            title: 'Mood & Com Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const mboa = await prisma.sponsor.create({
    data: {
      name: 'MBOA',
      description: 'Hip Hop du Bled et d\'Afrique',
      tier: SponsorTier.GOLD,
      displayOrder: 3,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/mboa-logo.png',
            title: 'MBOA Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const mboaVibes = await prisma.sponsor.create({
    data: {
      name: 'MBOA Vibes',
      description: 'The MBOA Vibes',
      tier: SponsorTier.SILVER,
      displayOrder: 4,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/mboa-vibes-logo.png',
            title: 'MBOA Vibes Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const madeInMboa = await prisma.sponsor.create({
    data: {
      name: 'Made in MBOA',
      description: 'Made in MBOA',
      tier: SponsorTier.SILVER,
      displayOrder: 5,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/made-in-mboa-logo.png',
            title: 'Made in MBOA Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const lazone = await prisma.sponsor.create({
    data: {
      name: 'Lazone',
      description: 'Lazone',
      tier: SponsorTier.BRONZE,
      displayOrder: 6,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/lazone-logo.png',
            title: 'Lazone Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const icone = await prisma.sponsor.create({
    data: {
      name: 'Icone',
      description: 'Icone',
      tier: SponsorTier.PARTNER,
      displayOrder: 7,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/icone-logo.png',
            title: 'Icone Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  const bledcity = await prisma.sponsor.create({
    data: {
      name: 'Bled City',
      description: 'Bled City',
      tier: SponsorTier.PARTNER,
      displayOrder: 8,
      isActive: true,
      media: {
        create: [
          {
            mediaType: MediaType.IMAGE,
            mediaUrl: '/images/sponsors/bledcity-logo.png',
            title: 'Bled City Logo',
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
  });

  console.log('✅ Sponsors créés avec succès !');
  console.log(`- ${heritage.name} (${heritage.tier})`);
  console.log(`- ${moodCom.name} (${moodCom.tier})`);
  console.log(`- ${mboa.name} (${mboa.tier})`);
  console.log(`- ${mboaVibes.name} (${mboaVibes.tier})`);
  console.log(`- ${madeInMboa.name} (${madeInMboa.tier})`);
  console.log(`- ${lazone.name} (${lazone.tier})`);
  console.log(`- ${icone.name} (${icone.tier})`);
  console.log(`- ${bledcity.name} (${bledcity.tier})`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
