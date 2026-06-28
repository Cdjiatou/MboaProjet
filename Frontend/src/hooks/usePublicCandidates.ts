import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '@/services/adminService';
import type { Category, Candidate } from '@/types';

export const CANDIDATES_REFRESH_EVENT = 'mboa:candidates-updated';

export const notifyCandidatesUpdated = () => {
  window.dispatchEvent(new Event(CANDIDATES_REFRESH_EVENT));
};

const flattenCandidates = (categories: Category[]): Candidate[] =>
  categories
    .flatMap((cat) => (cat.candidates || []).map((c) => ({ ...c, category: cat })))
    .sort((a, b) => b.totalVotesCache - a.totalVotesCache);

/** Charge les candidats publics avec rafraîchissement automatique (sans recharger la page) */
export const usePublicCandidates = (pollIntervalMs = 15000) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
        setCandidates(flattenCandidates(res.data));
      }
    } catch {
      // backend offline — conserver la liste actuelle
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => refresh(true), pollIntervalMs);
    const onExternalUpdate = () => refresh(true);
    window.addEventListener(CANDIDATES_REFRESH_EVENT, onExternalUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener(CANDIDATES_REFRESH_EVENT, onExternalUpdate);
    };
  }, [refresh, pollIntervalMs]);

  return { categories, candidates, loading, refresh };
};
