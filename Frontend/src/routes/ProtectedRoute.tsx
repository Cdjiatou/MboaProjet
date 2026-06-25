// =============================================================================
// COMPOSANT ProtectedRoute — Gardien de route pour l'administration
// =============================================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useThemeStore } from '@/store/useThemeStore';

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const isAuthenticated = useThemeStore((state) => state.isAuthenticated);
  const role = useThemeStore((state) => state.role);

  if (!isAuthenticated || role !== 'admin') {
    // Redirection vers la page d'accueil si non authentifié ou pas admin
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
