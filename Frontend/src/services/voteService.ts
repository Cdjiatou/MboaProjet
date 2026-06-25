// =============================================================================
// SERVICE VOTE — Appels API pour le système de vote
// =============================================================================

import api from './api';
import type { ApiResponse, Vote } from '@/types';

/** Initie un vote payant pour un candidat donné */
export const initiateVote = async (
  candidateId: number,
  voterIdentifier: string
): Promise<ApiResponse<{ vote: Vote }>> => {
  const response = await api.post('/votes/initiate', {
    candidateId,
    voterIdentifier,
  });
  return response.data;
};

/** Récupère le statut d'un vote par sa référence de paiement */
export const checkVoteStatus = async (
  paymentReference: string
): Promise<ApiResponse<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; vote: Vote }>> => {
  const response = await api.get(`/votes/status/${paymentReference}`);
  return response.data;
};
