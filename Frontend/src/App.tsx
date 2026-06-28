// =============================================================================
// COMPOSANT App — Point d'entrée avec routing conditionnel des layouts
// =============================================================================

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './components/shared/Header';
import Footer from './components/shared/Footer';
import ToastContainer from './components/shared/ToastContainer';
import AppRoutes from './routes/AppRoutes';
import { getPublicConfig } from '@/services/adminService';
import { useThemeStore } from '@/store/useThemeStore';

const App: React.FC = () => {
  const location = useLocation();
  const setColors = useThemeStore((state) => state.setColors);
  const setAssets = useThemeStore((state) => state.setAssets);

  // Détermine si on est sur une page admin (dashboard)
  const isAdminPage = location.pathname.startsWith('/admin/dashboard');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await getPublicConfig();
        if (response.success && response.data) {
          const configData = response.data;
          const primary = configData.primary_color || '#d4af37';
          const secondary = configData.secondary_color || '#1a1a2e';
          const background = configData.background_color || '#0a0a0a';
          
          setColors({
            primaryColor: primary,
            secondaryColor: secondary,
            backgroundColor: background,
          });
          setAssets(configData);
          document.documentElement.style.setProperty('--primary-color', primary);
          document.documentElement.style.setProperty('--secondary-color', secondary);
          document.documentElement.style.setProperty('--background-color', background);
        }
      } catch (err) {
        console.warn('Config backend non disponible, valeurs par défaut utilisées.');
      }
    };

    loadConfig();
  }, [setColors, setAssets]);

  // Si on est sur une page admin, on ne rend PAS le layout public (Header/Footer)
  if (isAdminPage) {
    return (
      <>
        <ToastContainer />
        <AppRoutes />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-[#ffffff] font-sans selection:bg-primary selection:text-black">
      <ToastContainer />
      <Header />
      <main className="flex-grow flex flex-col">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

export default App;
