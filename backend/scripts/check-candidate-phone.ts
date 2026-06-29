import prisma from '../src/utils/prisma';

async function checkPhone() {
  const candidates = await prisma.candidate.findMany({
    select: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('📱 Derniers candidats créés:\n');
  candidates.forEach((c) => {
    console.log(`ID: ${c.id} - ${c.firstName} ${c.lastName}`);
    console.log(`Téléphone: "${c.phone}"`);
    console.log(`Longueur: ${c.phone.length} caractères`);
    console.log(`Contient espaces: ${c.phone.includes(' ') ? 'OUI ❌' : 'NON ✅'}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkPhone();
