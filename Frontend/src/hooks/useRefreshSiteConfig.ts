// =============================================================================
// HOOK — useRefreshSiteConfig
// =============================================================================
// Après chaque modification de contenu dans le panel admin, ce hook recharge
// la config publique et met à jour le store global pour que le site public
// reflète les changements en temps réel sans rechargement de page.

import { useCallback } from 'react';
import { getPublicConfig } from '@/services/adminService';
import { useThemeStore } from '@/store/useThemeStore';

export const useRefreshSiteConfig = () => {
  const setAssets = useThemeStore((state) => state.setAssets);
  const setColors = useThemeStore((state) => state.setColors);

  const refreshConfig = useCallback(async () => {
    try {
      const response = await getPublicConfig();
      if (response.success && response.data) {
        const configData = response.data;
        setAssets(configData);

        const primary = configData.primary_color || '#d4af37';
        const secondary = configData.secondary_color || '#1a1a2e';
        const background = configData.background_color || '#0a0a0a';

        setColors({ primaryColor: primary, secondaryColor: secondary, backgroundColor: background });
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--secondary-color', secondary);
        document.documentElement.style.setProperty('--background-color', background);
      }
    } catch (err) {
      console.warn('[RefreshConfig] Impossible de recharger la configuration.', err);
    }
  }, [setAssets, setColors]);

  return refreshConfig;
};
