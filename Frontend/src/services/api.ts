// =============================================================================
// SERVICE API — Configuration Axios centralisée
// =============================================================================
// Ce fichier crée une instance Axios unique qui :
// 1. Pointe vers le backend (http://localhost:3000/api)
// 2. Injecte automatiquement le token JWT dans chaque requête
// =============================================================================

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

/** Instance Axios préconfigurée pour communiquer avec le backend */
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const CANDIDATE_TOKEN_KEY = 'mboa_candidate_token';

export const getCandidateSessionToken = (): string | null =>
  sessionStorage.getItem(CANDIDATE_TOKEN_KEY);

export const setCandidateSessionToken = (token: string | null) => {
  if (token) sessionStorage.setItem(CANDIDATE_TOKEN_KEY, token);
  else sessionStorage.removeItem(CANDIDATE_TOKEN_KEY);
};

// Intercepteur de requêtes : token admin (localStorage) ou candidat (sessionStorage)
api.interceptors.request.use(
  (config) => {
    if (config.headers.Authorization) return config;

    const url = config.url || '';
    const isCandidateRoute = url.includes('/candidates/complete-profile');
    const candidateToken = getCandidateSessionToken();

    if (isCandidateRoute && candidateToken) {
      config.headers.Authorization = `Bearer ${candidateToken}`;
      return config;
    }

    const adminToken = localStorage.getItem('mboa_token');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponses : gestion centralisée des erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isCandidateRoute = url.includes('/candidates/');

    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      if (isCandidateRoute) {
        setCandidateSessionToken(null);
      } else {
        localStorage.removeItem('mboa_token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
