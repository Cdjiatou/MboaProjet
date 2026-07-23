import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@mboanextstar.com';
  const newPassword = 'Admin@1234!';
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`✅ Mot de passe réinitialisé avec succès pour ${email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
