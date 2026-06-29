import prisma from '../src/utils/prisma';

async function compareCandidates() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'asc' },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      phone: true,
      status: true,
      verificationCode: true
    },
  });

  console.log(`📊 Total: ${candidates.length} candidats\n`);
  
  candidates.forEach((c, index) => {
    const phoneLength = c.phone.length;
    const hasSpaces = c.phone.includes(' ');
    const startsCorrectly = c.phone.startsWith('+237');
    const digitCount = c.phone.replace(/\D/g, '').length;
    
    console.log(`${index + 1}. ID ${c.id} - ${c.firstName} ${c.lastName}`);
    console.log(`   Téléphone: "${c.phone}"`);
    console.log(`   Longueur totale: ${phoneLength} caractères`);
    console.log(`   Nombre de chiffres: ${digitCount}`);
    console.log(`   Format correct: ${startsCorrectly && !hasSpaces && digitCount === 12 ? '✅' : '❌'}`);
    console.log(`   Statut: ${c.status}`);
    console.log(`   A un OTP: ${c.verificationCode ? 'OUI' : 'NON'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

compareCandidates();
