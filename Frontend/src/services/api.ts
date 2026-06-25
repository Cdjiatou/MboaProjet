// =============================================================================
// SERVICE API — Configuration Axios centralisée
// =============================================================================
// Ce fichier crée une instance Axios unique qui :
// 1. Pointe vers le backend (http://localhost:3000/api)
// 2. Injecte automatiquement le token JWT dans chaque requête
// =============================================================================

import axios from 'axios';

/** Instance Axios préconfigurée pour communiquer avec le backend */
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requêtes : injecte le token JWT si présent dans localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mboa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponses : gestion centralisée des erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('mboa_token');
      // Redirection vers la page de connexion si le token est expiré
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
