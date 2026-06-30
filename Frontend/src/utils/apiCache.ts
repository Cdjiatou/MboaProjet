// =============================================================================
// CACHE SIMPLE EN MÉMOIRE — Réduit les appels réseau pour les données publiques
// =============================================================================
// Ce cache stocke les réponses API en mémoire avec un TTL (durée de vie).
// Les données publiques (catégories, config) ne changent pas souvent,
// donc on peut les garder en cache quelques secondes pour éviter de refaire
// les mêmes appels réseau à chaque navigation.
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Retourne les données du cache si elles existent et ne sont pas expirées.
 * @param key - Clé du cache (ex: 'categories', 'config')
 * @param ttlMs - Durée de vie en millisecondes (défaut: 10 secondes)
 */
export function getCached<T>(key: string, ttlMs = 10000): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Stocke une valeur dans le cache.
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalide une entrée ou tout le cache.
 */
export function invalidateCache(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}
