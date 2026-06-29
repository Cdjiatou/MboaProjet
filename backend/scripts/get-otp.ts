import prisma from '../src/utils/prisma';

async function getOTP() {
  const phoneArg = process.argv[2];
  
  if (!phoneArg) {
    console.log('Usage: npx ts-node scripts/get-otp.ts <phone>');
    console.log('Exemple: npx ts-node scripts/get-otp.ts 650240560');
    process.exit(1);
  }

  const phoneDigits = phoneArg.replace(/\D/g, '');

  const candidates = await prisma.candidate.findMany({
    where: { status: { in: ['PENDING_VERIFICATION', 'VERIFIED'] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      verificationCode: true,
      status: true,
    },
  });

  const candidate = candidates.find(
    (c) => c.phone.replace(/\D/g, '').includes(phoneDigits)
  );

  if (!candidate) {
    console.log(`❌ Aucun candidat trouvé avec le numéro contenant: ${phoneDigits}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('\n📱 Candidat trouvé:\n');
  console.log(`Nom: ${candidate.firstName} ${candidate.lastName}`);
  console.log(`Téléphone: ${candidate.phone}`);
  console.log(`Statut: ${candidate.status}`);
  console.log(`\n🔐 Code OTP: ${candidate.verificationCode || 'Non généré'}\n`);

  await prisma.$disconnect();
}

getOTP();
