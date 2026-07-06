import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Mettre à jour le logo_url dans la table SiteConfiguration
  const existing = await prisma.siteConfiguration.findFirst({
    where: { configKey: 'logo_url' }
  });

  if (existing) {
    await prisma.siteConfiguration.update({
      where: { id: existing.id },
      data: { configValue: '/logo.png' }
    });
    console.log('✅ logo_url mis à jour vers /logo.png');
  } else {
    await prisma.siteConfiguration.create({
      data: { configKey: 'logo_url', configValue: '/logo.png' }
    });
    console.log('✅ logo_url créé avec /logo.png');
  }

  // Vérifier aussi site_logo
  const siteLogo = await prisma.siteConfiguration.findFirst({
    where: { configKey: 'site_logo' }
  });

  if (siteLogo) {
    await prisma.siteConfiguration.update({
      where: { id: siteLogo.id },
      data: { configValue: '/logo.png' }
    });
    console.log('✅ site_logo mis à jour vers /logo.png');
  }

  // Lister les configs logo pour vérification
  const logos = await prisma.siteConfiguration.findMany({
    where: { configKey: { in: ['logo_url', 'site_logo'] } }
  });
  console.log('📋 Configs logo actuelles:', logos);
}

main().catch(console.error).finally(() => prisma.$disconnect());
