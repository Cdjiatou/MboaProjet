// =============================================================================
// SERVICE VOTE — Appels API pour le système de vote
// =============================================================================

import api from './api';
import type { ApiResponse, Vote } from '@/types';

export type PaymentMethod = 'MTN_MOMO' | 'ORANGE_MOMO' | 'CARD';

export interface InitiateVotePayload {
  candidateId: number;
  voterIdentifier: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface InitiateVoteResponse {
  vote: Vote;
  paymentUrl?: string;
  votesCount: number;
}

/** Initie un vote payant pour un candidat donné */
export const initiateVote = async (
  payload: InitiateVotePayload
): Promise<ApiResponse<InitiateVoteResponse>> => {
  const response = await api.post('/votes/initiate', payload);
  return response.data;
};

/** Récupère le statut d'un vote par sa référence de paiement */
export const checkVoteStatus = async (
  paymentReference: string
): Promise<ApiResponse<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; vote: Vote }>> => {
  const response = await api.get(`/votes/status/${paymentReference}`);
  return response.data;
};
