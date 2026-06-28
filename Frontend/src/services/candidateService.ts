// =============================================================================
// SERVICE CANDIDAT — Appels API pour le parcours candidat (OTP + Profil)
// =============================================================================

import api, { setCandidateSessionToken } from './api';
import type { ApiResponse, Candidate } from '@/types';

/** Vérifie le code OTP envoyé au candidat via WhatsApp */
export const verifyCandidateOtp = async (
  phone: string,
  otp: string
): Promise<ApiResponse<{ candidate: Candidate; token: string; autoActivated?: boolean }>> => {
  const response = await api.post('/candidates/verify-otp', { phone, otp });
  return response.data;
};

/** Renvoie le code OTP par WhatsApp */
export const resendCandidateOtp = async (phone: string): Promise<ApiResponse> => {
  const response = await api.post('/candidates/resend-otp', { phone });
  return response.data;
};

/** Complète le profil d'un candidat vérifié */
export const completeCandidateProfile = async (
  data: {
    biography: string;
    profilePhoto?: string;
    videoUrl?: string;
    socialLinks?: Record<string, string>;
  },
  candidateToken?: string
): Promise<ApiResponse<{ candidate: Candidate }>> => {
  if (candidateToken) setCandidateSessionToken(candidateToken);

  const payload = { ...data };
  if (!payload.profilePhoto) delete payload.profilePhoto;
  if (!payload.videoUrl) delete payload.videoUrl;

  const response = await api.put('/candidates/complete-profile', payload);
  return response.data;
};
