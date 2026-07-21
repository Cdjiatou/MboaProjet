import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser(name: string, email: string, role: Role) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    console.log(`L'utilisateur ${email} existe déjà.`);
    return;
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  console.log(`✅ Utilisateur créé : ${email} avec le rôle ${role}. Mot de passe : password123`);
}

async function main() {
  await createUser('Super Admin Test', 'superadmin@mboanextstar.com', Role.SUPER_ADMIN);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
