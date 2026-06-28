/**
 * @file sponsor.service.ts
 * @description Service de gestion des sponsors et leurs médias
 */

import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { MediaType, SponsorTier } from '@prisma/client';

/**
 * Interface pour la création d'un sponsor
 */
interface CreateSponsorData {
  name: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  tier?: SponsorTier;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Interface pour la mise à jour d'un sponsor
 */
interface UpdateSponsorData extends Partial<CreateSponsorData> {}

/**
 * Interface pour l'ajout de média
 */
interface CreateMediaData {
  sponsorId: number;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Récupère tous les sponsors actifs avec leurs médias
 */
export const getAllSponsors = async (includeInactive = false) => {
  const sponsors = await prisma.sponsor.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: {
      media: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return sponsors;
};

/**
 * Récupère un sponsor par son ID
 */
export const getSponsorById = async (id: number) => {
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    include: {
      media: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!sponsor) {
    throw new AppError('Sponsor introuvable', 404);
  }

  return sponsor;
};

/**
 * Crée un nouveau sponsor
 */
export const createSponsor = async (data: CreateSponsorData) => {
  const sponsor = await prisma.sponsor.create({
    data: {
      name: data.name,
      description: data.description,
      websiteUrl: data.websiteUrl,
      logoUrl: data.logoUrl,
      tier: data.tier || 'PARTNER',
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: {
      media: true,
    },
  });

  return sponsor;
};

/**
 * Met à jour un sponsor
 */
export const updateSponsor = async (id: number, data: UpdateSponsorData) => {
  // Vérifier que le sponsor existe
  await getSponsorById(id);

  const sponsor = await prisma.sponsor.update({
    where: { id },
    data,
    include: {
      media: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return sponsor;
};

/**
 * Supprime un sponsor
 */
export const deleteSponsor = async (id: number) => {
  // Vérifier que le sponsor existe
  await getSponsorById(id);

  await prisma.sponsor.delete({
    where: { id },
  });

  return { message: 'Sponsor supprimé avec succès' };
};

/**
 * Ajoute un média à un sponsor
 */
export const addSponsorMedia = async (data: CreateMediaData) => {
  // Vérifier que le sponsor existe
  await getSponsorById(data.sponsorId);

  const media = await prisma.sponsorMedia.create({
    data: {
      sponsorId: data.sponsorId,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      title: data.title,
      description: data.description,
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  return media;
};

/**
 * Met à jour un média
 */
export const updateSponsorMedia = async (
  id: number,
  data: Partial<CreateMediaData>
) => {
  const media = await prisma.sponsorMedia.findUnique({
    where: { id },
  });

  if (!media) {
    throw new AppError('Média introuvable', 404);
  }

  const updatedMedia = await prisma.sponsorMedia.update({
    where: { id },
    data,
  });

  return updatedMedia;
};

/**
 * Supprime un média
 */
export const deleteSponsorMedia = async (id: number) => {
  const media = await prisma.sponsorMedia.findUnique({
    where: { id },
  });

  if (!media) {
    throw new AppError('Média introuvable', 404);
  }

  await prisma.sponsorMedia.delete({
    where: { id },
  });

  return { message: 'Média supprimé avec succès' };
};

/**
 * Récupère tous les médias d'un sponsor
 */
export const getSponsorMedia = async (sponsorId: number) => {
  const media = await prisma.sponsorMedia.findMany({
    where: { sponsorId },
    orderBy: { displayOrder: 'asc' },
  });

  return media;
};
