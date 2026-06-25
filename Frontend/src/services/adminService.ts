// =============================================================================
// SERVICE ADMIN — Appels API pour le back-office
// =============================================================================

import api from './api';
import type { ApiResponse, LoginResponse, DashboardStats, Category, Candidate, SiteConfig } from '@/types';

/** Connexion admin (Coach / Super Admin) */
export const loginAdmin = async (
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post('/auth/login', { email, password });
  // Le backend renvoie { success, user, token } — on le transforme en { success, data: { user, token } }
  const { success, user, token, error, message } = response.data;
  return { success, data: user && token ? { user, token } : undefined, error, message };
};

/** Récupération des statistiques globales */
export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data;
};

/** Récupération de toutes les catégories avec leurs candidats */
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response = await api.get('/categories');
  return response.data;
};

/** Récupération d'un candidat par son slug */
export const getCandidateBySlug = async (slug: string): Promise<ApiResponse<Candidate>> => {
  const response = await api.get(`/candidates/${slug}`);
  return response.data;
};

/** Création d'un candidat par un coach */
export const createCandidate = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  categoryId: number;
}): Promise<ApiResponse<Candidate>> => {
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
  const response = await api.get('/config');
  return response.data;
};
