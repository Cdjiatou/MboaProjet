import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';
import { Role } from '@prisma/client';

export const getAdminUsers = async () => {
  return await prisma.user.findMany({
    where: {
      role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createAdminUser = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('Cet email est déjà utilisé par un autre administrateur.', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || Role.ADMIN,
      isActive: data.isActive ?? true
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
  });

  return user;
};

export const updateAdminUser = async (id: number, data: any) => {
  const userToUpdate = await prisma.user.findUnique({ where: { id } });
  if (!userToUpdate) {
    throw new AppError('Administrateur non trouvé.', 404);
  }

  if (data.email && data.email !== userToUpdate.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Cet email est déjà utilisé.', 400);
    }
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    isActive: data.isActive
  };

  if (data.password && data.password.trim() !== '') {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
  });

  return user;
};

export const deleteAdminUser = async (id: number) => {
  const userToUpdate = await prisma.user.findUnique({ where: { id } });
  if (!userToUpdate) {
    throw new AppError('Administrateur non trouvé.', 404);
  }

  if (userToUpdate.role === Role.SUPER_ADMIN) {
    // Basic protection to avoid deleting the last super admin or any super admin
    const superAdminsCount = await prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
    if (superAdminsCount <= 1) {
      throw new AppError('Impossible de supprimer le dernier Super Administrateur.', 403);
    }
  }

  await prisma.user.delete({ where: { id } });
  return { success: true };
};
