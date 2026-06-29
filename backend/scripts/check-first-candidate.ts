import prisma from '../src/utils/prisma';

async function checkFirstCandidate() {
  const candidate = await prisma.candidate.findFirst({
    orderBy: { id: 'asc' },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      phone: true, 
      email: true,
      status: true,
      verificationCode: true,
      createdAt: true
    },
  });

  if (!candidate) {
    console.log('❌ Aucun candidat en base de données');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 Premier candidat (celui qui a reçu l\'OTP):\n');
  console.log(`ID: ${candidate.id}`);
  console.log(`Nom: ${candidate.firstName} ${candidate.lastName}`);
  console.log(`Email: ${candidate.email}`);
  console.log(`Téléphone: "${candidate.phone}"`);
  console.log(`Statut: ${candidate.status}`);
  console.log(`Code OTP: ${candidate.verificationCode || 'N/A'}`);
  console.log(`Créé le: ${candidate.createdAt}`);
  console.log('\n📱 Analyse du numéro:');
  console.log(`Longueur: ${candidate.phone.length} caractères`);
  console.log(`Contient espaces: ${candidate.phone.includes(' ') ? 'OUI ❌' : 'NON ✅'}`);
  console.log(`Commence par +237: ${candidate.phone.startsWith('+237') ? 'OUI ✅' : 'NON ❌'}`);
  
  // Afficher chaque caractère pour détecter des caractères invisibles
  console.log('\n🔍 Détail caractère par caractère:');
  for (let i = 0; i < candidate.phone.length; i++) {
    const char = candidate.phone[i];
    const code = char.charCodeAt(0);
    console.log(`  Position ${i}: "${char}" (code ASCII: ${code})`);
  }

  await prisma.$disconnect();
}

checkFirstCandidate();
