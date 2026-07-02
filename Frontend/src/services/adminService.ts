// =============================================================================
// SERVICE ADMIN — Appels API pour le back-office
// =============================================================================

import api from './api';
import type { ApiResponse, LoginResponse, DashboardStats, Category, Candidate, SiteConfig } from '@/types';
import { getCached, setCache } from '@/utils/apiCache';

/** Connexion admin (Coach / Super Admin) */
export const loginAdmin = async (
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post('/auth/login', { email, password });
  // Le backend renvoie { success: true, user, token }
  const { success, user, token } = response.data;
  return { 
    success, 
    data: user && token ? { user, token } : undefined
  };
};

/** Mise à jour du profil administrateur (email, password) */
export const updateAdminProfile = async (
  email?: string,
  password?: string
): Promise<ApiResponse> => {
  const response = await api.patch('/admin/profile', { email, password });
  return response.data;
};

/** Récupération des statistiques globales */
export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data;
};

/** Récupération de toutes les catégories avec leurs candidats (avec cache) */
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  const cached = getCached<ApiResponse<Category[]>>('categories', 8000);
  if (cached) return cached;
  const response = await api.get('/categories');
  setCache('categories', response.data);
  return response.data;
};

/** Récupération d'un candidat par son slug */
export const getCandidateBySlug = async (slug: string): Promise<ApiResponse<Candidate>> => {
  const response = await api.get(`/candidates/${slug}`);
  return response.data;
};

/** Création d'un candidat par un coach */
export const createCandidate = async (
  data: FormData | {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    categoryId: number;
    biography?: string;
    videoUrl?: string;
    city?: string;
    country?: string;
    socialLinks?: Record<string, string>;
  }, 
  photoFile?: File | null
): Promise<ApiResponse<Candidate>> => {
  // Si data est déjà un FormData (envoyé depuis CandidateForm avec photo)
  if (data instanceof FormData) {
    const response = await api.post('/admin/candidates', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Sinon, envoyer du JSON classique
  const response = await api.post('/admin/candidates', data);
  return response.data;
};

/** Mise à jour de la configuration visuelle */
export const updateConfig = async (
  configs: SiteConfig[]
): Promise<ApiResponse> => {
  const response = await api.post('/admin/config', { configs });
  return response.data;
};

/** Récupération de la configuration publique */
export const getPublicConfig = async (): Promise<ApiResponse<Record<string, string>>> => {
  const cached = getCached<ApiResponse<Record<string, string>>>('publicConfig', 15000);
  if (cached) return cached;
  const response = await api.get('/config');
  setCache('publicConfig', response.data);
  return response.data;
};

/** Création d'un retrait financier */
export const createWithdrawal = async (amount: number): Promise<ApiResponse> => {
  const response = await api.post('/admin/withdrawals', { amount });
  return response.data;
};

/** Export des votes en CSV */
export const exportVotesCSV = async (): Promise<Blob> => {
  const response = await api.get('/admin/exports/votes', { responseType: 'blob' });
  return response.data;
};

/** Export des retraits en CSV */
export const exportWithdrawalsCSV = async (): Promise<Blob> => {
  const response = await api.get('/admin/exports/withdrawals', { responseType: 'blob' });
  return response.data;
};

/** Récupération du statut WhatsApp */
export const getWhatsAppStatus = async (): Promise<ApiResponse<{
  connected: boolean;
  qrCode: string | null;
  state?: string;
  lastError?: string | null;
  reconnecting?: boolean;
}>> => {
  const response = await api.get('/admin/whatsapp/status');
  return response.data;
};

/** Déconnexion de WhatsApp */
export const logoutWhatsApp = async (): Promise<ApiResponse> => {
  const response = await api.post('/admin/whatsapp/logout');
  return response.data;
};

/** Redémarre la session WhatsApp pour générer un nouveau QR */
export const refreshWhatsApp = async (): Promise<ApiResponse<{ connected: boolean; qrCode: string | null }>> => {
  const response = await api.post('/admin/whatsapp/refresh');
  return response.data;
};

/** Liste des candidats pour le back-office */
export const getAdminCandidates = async (params?: { search?: string; page?: number }): Promise<ApiResponse<{
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
}>> => {
  const response = await api.get('/admin/candidates', { params });
  return response.data;
};

/** Upload du logo d'un sponsor */
export const uploadSponsorLogo = async (file: File): Promise<ApiResponse<{ logoUrl: string }>> => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await api.post('/admin/sponsors/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/** Récupère tous les sponsors depuis la configuration site */
export const getSponsorsConfig = async (): Promise<ApiResponse<{ id: string; name: string; url: string; image: string }[]>> => {
  const response = await api.get('/admin/sponsors/config');
  return response.data;
};

/** Sauvegarde la liste complète des sponsors (replaceAll=true par défaut) */
export const saveSponsorsConfig = async (
  sponsors: { id: string; name: string; url: string; image: string }[],
  replaceAll = true
): Promise<ApiResponse<{ id: string; name: string; url: string; image: string }[]>> => {
  const response = await api.post('/admin/sponsors/config', { sponsors, replaceAll });
  return response.data;
};

/** Met à jour un candidat */
export const updateAdminCandidate = async (
  id: number,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    categoryId: number;
    biography: string;
    videoUrl: string;
    city: string;
    country: string;
    status: Candidate['status'];
    socialLinks: Record<string, string>;
  }>
): Promise<ApiResponse<Candidate>> => {
  const response = await api.patch(`/admin/candidates/${id}`, data);
  return response.data;
};

/** Supprime un candidat */
export const deleteAdminCandidate = async (id: number): Promise<ApiResponse> => {
  const response = await api.delete(`/admin/candidates/${id}`);
  return response.data;
};

/** Upload / remplace la photo d'un candidat */
export const uploadAdminCandidatePhoto = async (id: number, file: File): Promise<ApiResponse<{ candidate: Candidate }>> => {
  const formData = new FormData();
  formData.append('profilePhoto', file);
  const response = await api.post(`/admin/candidates/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/** Upload un média générique (image ou vidéo) avec suivi de progression */
export const uploadMediaFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<ApiResponse<{ fileUrl: string }>> => {
  const formData = new FormData();
  formData.append('file', file);

  // Phase 1: Browser -> Backend upload (0% to 50%)
  let serverProcessing = false;
  let processingInterval: ReturnType<typeof setInterval> | null = null;

  const response = await api.post('/admin/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes - les videos prennent du temps sur Cloudinary
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const rawPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // Phase 1: map 0-100 upload -> 0-50 displayed
        const displayPercent = Math.round(rawPercent * 0.5);
        onProgress(displayPercent);

        // When browser upload reaches 100%, start phase 2 animation
        if (rawPercent >= 100 && !serverProcessing) {
          serverProcessing = true;
          let fakeProgress = 50;
          processingInterval = setInterval(() => {
            fakeProgress += 1;
            if (fakeProgress >= 95) {
              fakeProgress = 95; // cap at 95% until server responds
              if (processingInterval) clearInterval(processingInterval);
            }
            onProgress(fakeProgress);
          }, 800); // increment every 800ms
        }
      }
    },
  });

  // Cleanup interval and jump to 100%
  if (processingInterval) clearInterval(processingInterval);
  if (onProgress) onProgress(100);

  return response.data;
};
