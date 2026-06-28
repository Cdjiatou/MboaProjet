import { useEffect, useCallback } from 'react';
import { CANDIDATES_REFRESH_EVENT } from './usePublicCandidates';

export const ADMIN_DASHBOARD_REFRESH_EVENT = 'mboa:admin-dashboard-refresh';

/** Déclenche un rafraîchissement de la vue d'ensemble admin */
export const notifyAdminDashboardUpdated = () => {
  window.dispatchEvent(new Event(ADMIN_DASHBOARD_REFRESH_EVENT));
};

/** Écoute les mises à jour et rafraîchit périodiquement les stats du dashboard */
export const useAdminDashboardSync = (
  refresh: () => void | Promise<void>,
  pollIntervalMs = 30000
) => {
  const stableRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    stableRefresh();
    const onExternalUpdate = () => stableRefresh();
    window.addEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, onExternalUpdate);
    window.addEventListener(CANDIDATES_REFRESH_EVENT, onExternalUpdate);
    const timer = setInterval(stableRefresh, pollIntervalMs);
    return () => {
      window.removeEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, onExternalUpdate);
      window.removeEventListener(CANDIDATES_REFRESH_EVENT, onExternalUpdate);
      clearInterval(timer);
    };
  }, [stableRefresh, pollIntervalMs]);
};
