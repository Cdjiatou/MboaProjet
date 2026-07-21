// =============================================================================
// HOOK useAuth — Liaison de session utilisateur avec le store Zustand
// =============================================================================

import { useCallback } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const token = useThemeStore((state) => state.token);
  const user = useThemeStore((state) => state.user);
  const isAuthenticated = useThemeStore((state) => state.isAuthenticated);
  const setAuth = useThemeStore((state) => state.setAuth);
  const clearAuth = useThemeStore((state) => state.clearAuth);

  const login = useCallback((userData: User, jwtToken: string) => {
    const role: 'admin' | 'artist' = ['SUPER_ADMIN', 'ADMIN', 'COACH', 'admin'].includes(userData.role) ? 'admin' : 'artist';
    localStorage.setItem('mboa_token', jwtToken);
    setAuth(jwtToken, role, {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
  }, [setAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem('mboa_token');
    clearAuth();
  }, [clearAuth]);

  // Convertir le type UserSession du store en type User public
  const typedUser = user ? {
    id: user.id || 0,
    name: user.name,
    email: user.email,
    role: user.role,
  } : null;

  return {
    user: typedUser,
    token,
    isAuthenticated,
    login,
    logout,
  };
};
