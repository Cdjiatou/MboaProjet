/**
 * @file sponsorService.ts
 * @description Service pour récupérer les sponsors depuis l'API
 */

import api from './api';

export interface SponsorMedia {
  id: number;
  sponsorId: number;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sponsor {
  id: number;
  name: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTNER';
  displayOrder: number;
  isActive: boolean;
  media: SponsorMedia[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Récupère tous les sponsors actifs
 */
export const getSponsors = async (): Promise<Sponsor[]> => {
  const response = await api.get<{ success: boolean; data: Sponsor[] }>(
    '/sponsors'
  );
  return response.data.data;
};
