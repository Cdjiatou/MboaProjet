// =============================================================================
// HOOK useWordCount — Compteur de mots en temps réel
// =============================================================================

import { useMemo } from 'react';

/**
 * Hook personnalisé pour compter les mots d'un texte.
 * Utilisé pour la validation de la biographie (minimum 300 mots).
 * La logique est identique à celle du backend pour garantir la cohérence.
 */
export const useWordCount = (text: string): number => {
  return useMemo(() => {
    if (!text) return 0;
    const cleanText = text
      .replace(/[.,/#!$%^&*;:{}=\-_`~()@"'?\\[\]<>|+]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleanText.split(' ').filter((word) => word.length > 0).length;
  }, [text]);
};
