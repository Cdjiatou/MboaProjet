// =============================================================================
// COMPOSANT App — Chargement de configuration dynamique et structure globale
// =============================================================================

import React, { useEffect } from 'react';
import Header from './components/shared/Header';
import Footer from './components/shared/Footer';
import AppRoutes from './routes/AppRoutes';
import { getPublicConfig } from '@/services/adminService';
import { useThemeStore } from '@/store/useThemeStore';

const App: React.FC = () => {
  const setColors = useThemeStore((state) => state.setColors);
  const setAssets = useThemeStore((state) => state.setAssets);

  useEffect(() => {
    // Chargement de la config en arrière-plan (non bloquant)
    const loadConfig = async () => {
      try {
        const response = await getPublicConfig();
        if (response.success && response.data) {
          const configData = response.data;
          
          // Extraction des couleurs avec valeurs par défaut
          const primary = configData.primary_color || '#d4af37';
          const secondary = configData.secondary_color || '#1a1a2e';
          const background = configData.background_color || '#0a0a0a';
          
          // Mise à jour de Zustand
          setColors({
            primaryColor: primary,
            secondaryColor: secondary,
            backgroundColor: background,
          });

          // Enregistrement des assets dans le store
          setAssets(configData);

          // Injection dynamique des variables CSS dans le DOM root
          document.documentElement.style.setProperty('--primary-color', primary);
          document.documentElement.style.setProperty('--secondary-color', secondary);
          document.documentElement.style.setProperty('--background-color', background);
        }
      } catch (err) {
        // Silencieux en production — on continue avec les valeurs par défaut
        console.warn('Config backend non disponible, valeurs par défaut utilisées.');
      }
    };

    loadConfig();
  }, [setColors, setAssets]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-[#ffffff] font-sans selection:bg-primary selection:text-black">
      <Header />
      <main className="flex-grow flex flex-col">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

export default App;
