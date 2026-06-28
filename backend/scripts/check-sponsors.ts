import prisma from '../src/utils/prisma';

async function main() {
  const row = await prisma.siteConfiguration.findUnique({ where: { configKey: 'sponsors' } });
  console.log('=== SiteConfiguration.sponsors ===');
  if (row?.configValue) {
    try {
      const parsed = JSON.parse(row.configValue);
      console.log('Count:', Array.isArray(parsed) ? parsed.length : 'not array');
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Invalid JSON:', row.configValue.slice(0, 200));
    }
  } else {
    console.log('(empty / missing)');
  }

  const prismaSponsors = await prisma.sponsor.findMany({ include: { media: true } });
  console.log('\n=== Prisma Sponsor table ===');
  console.log('Count:', prismaSponsors.length);
  for (const s of prismaSponsors) {
    console.log(`- ${s.name} (active=${s.isActive}) media=${s.media?.length ?? 0}`);
  }
}

main().finally(() => prisma.$disconnect());
