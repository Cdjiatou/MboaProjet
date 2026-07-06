// =============================================================================
// ROUTES — Table de routage de l'application MBOA NEXT STAR
// =============================================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Lazy-loaded pages pour un chargement plus rapide
const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const Contact = lazy(() => import('../pages/Contact'));
const VerifyProfile = lazy(() => import('../pages/VerifyProfile'));
const Partners = lazy(() => import('../pages/Partners'));
const Candidats = lazy(() => import('../pages/Candidats'));
const Categories = lazy(() => import('../pages/Categories'));
const CandidateProfile = lazy(() => import('../pages/CandidateProfile'));
const Classement = lazy(() => import('../pages/Classement'));
const Reglement = lazy(() => import('../pages/Reglement'));
const ArtistSpace = lazy(() => import('../pages/ArtistSpace'));
const Login = lazy(() => import('../pages/Login'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));

// Composant de fallback minimaliste et rapide (pas de spinner lourd)
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/candidats" element={<Candidats />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/reglement" element={<Reglement />} />
          <Route path="/verify-profile" element={<VerifyProfile />} />
          <Route path="/candidats/:slug" element={<CandidateProfile />} />
          <Route path="/artist" element={<ArtistSpace />} />
          <Route path="/nexstar" element={<Login />} />
          <Route
            path="/nexstar/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
