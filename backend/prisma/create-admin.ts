/**
 * @file create-admin.ts
 * @description Script pour créer un utilisateur admin
 * Exécution : npx ts-node prisma/create-admin.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Création d\'un utilisateur admin...\n');

  // Informations de l'admin à créer
  const adminData = {
    name: 'Super Admin',
    email: 'superadmin@gmail.com',
    password: 'admin@12345678',
    role: Role.SUPER_ADMIN,
  };

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: adminData.email },
  });

  if (existingUser) {
    console.log('⚠️  Un utilisateur avec cet email existe déjà.');
    console.log(`📧 Email: ${existingUser.email}`);
    console.log(`👤 Nom: ${existingUser.name}`);
    console.log(`🔐 Rôle: ${existingUser.role}`);
    return;
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  // Créer l'utilisateur admin
  const admin = await prisma.user.create({
    data: {
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: adminData.role,
    },
  });

  console.log('✅ Utilisateur admin créé avec succès !\n');
  console.log('📋 Informations de connexion:');
  console.log('━'.repeat(50));
  console.log(`📧 Email:     ${adminData.email}`);
  console.log(`🔑 Password:  ${adminData.password}`);
  console.log(`👤 Nom:       ${admin.name}`);
  console.log(`🔐 Rôle:      ${admin.role}`);
  console.log(`🆔 ID:        ${admin.id}`);
  console.log('━'.repeat(50));
  console.log('\n⚠️  Conservez ces informations en lieu sûr !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création de l\'admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
