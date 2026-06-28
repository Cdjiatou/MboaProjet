// =============================================================================
// STORE GLOBAL — Gestion du thème, des assets et de la session admin (Zustand)
// =============================================================================

import { create } from 'zustand';

export interface UserSession {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface AppState {
  // Thème & Couleurs
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  
  // Assets dynamiques chargés depuis le backend
  assets: Record<string, string>;
  
  // Authentification Admin/Candidat (Volatile en mémoire)
  token: string | null;
  role: 'admin' | 'artist' | null;
  isAuthenticated: boolean;
  user: UserSession | null;
  
  // Actions
  setColors: (colors: { primaryColor?: string; secondaryColor?: string; backgroundColor?: string }) => void;
  setAssets: (assets: Record<string, string>) => void;
  setAuth: (token: string, role: 'admin' | 'artist', user: UserSession) => void;
  clearAuth: () => void;
}

export const useThemeStore = create<AppState>((set) => ({
  primaryColor: '#d4af37',
  secondaryColor: '#ffffff',
  backgroundColor: '#0a0a0a',
  assets: {
    logo_url: '/logo.jpg'
  },
  token: null,
  role: null,
  isAuthenticated: false,
  user: null,

  setColors: (colors) => set((state) => ({
    primaryColor: colors.primaryColor ?? state.primaryColor,
    secondaryColor: colors.secondaryColor ?? state.secondaryColor,
    backgroundColor: colors.backgroundColor ?? state.backgroundColor,
  })),

  setAssets: (assets) => set({ assets }),

  setAuth: (token, role, user) => set({
    token,
    role,
    user,
    isAuthenticated: true,
  }),

  clearAuth: () => set({
    token: null,
    role: null,
    user: null,
    isAuthenticated: false,
  }),
}));
