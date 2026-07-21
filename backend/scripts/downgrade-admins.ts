import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Mise à jour des rôles administrateurs...');

  // Ajouter 'ADMIN' à l'enum Role dans la base de données PostgreSQL si ce n'est pas déjà fait
  try {
    await prisma.$executeRaw`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN'`;
    console.log('✅ Type enum Role mis à jour dans la base de données.');
  } catch (e) {
    console.log('⚠️ Note: Impossible d\'altérer l\'enum (peut-être déjà présent ou droits insuffisants). On continue...');
  }

  const superAdminIdToKeep = 4; // superadmin@mboanextstar.com

  // Mettre à jour tous les utilisateurs SUPER_ADMIN existants vers ADMIN (sauf l'ID 4)
  const result = await prisma.user.updateMany({
    where: {
      role: Role.SUPER_ADMIN,
      id: { not: superAdminIdToKeep }
    },
    data: {
      role: Role.ADMIN
    }
  });

  console.log(`✅ Succès : ${result.count} utilisateurs ont été rétrogradés au rôle ADMIN.`);

  // Vérifier la liste finale
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('\n📋 Liste finale des administrateurs :');
  console.table(users);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la mise à jour:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
