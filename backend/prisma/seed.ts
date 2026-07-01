import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@mboanextstar.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@1234!', 10);
    
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      }
    });
    console.log('Super Admin initialisé avec succès.');
  } else {
    console.log('Le Super Admin existe déjà.');
  }

  // Initialisation de quelques catégories de test
  const categories = ['Chanson', 'Danse', 'Comédie', 'Magie'];
  for (const catName of categories) {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: catName, slug }
    });
  }
  console.log('Catégories de base initialisées.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
