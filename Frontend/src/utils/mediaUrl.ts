const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

/** Chemins servis par le frontend (dossier public/) — ne pas préfixer avec l'API */
const isFrontendStaticPath = (path: string) =>
  path.startsWith('/images/') ||
  path.startsWith('/logo') ||
  path.startsWith('/assets/') ||
  path.startsWith('/favicon');

/** Chemins servis par le backend (uploads) */
const isBackendUploadPath = (path: string) =>
  path.startsWith('/uploads/') || path.startsWith('uploads/');

/** Résout un chemin relatif vers une URL affichable */
export const getMediaUrl = (path?: string | null, cacheKey?: string | number | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return appendCacheKey(path, cacheKey);
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;

  let url: string;
  if (isFrontendStaticPath(normalized)) {
    url = normalized;
  } else if (isBackendUploadPath(path) || isBackendUploadPath(normalized)) {
    const uploadPath = normalized.startsWith('/') ? normalized : `/${path}`;
    url = `${API_ORIGIN}${uploadPath}`;
  } else if (normalized.startsWith('/')) {
    url = normalized;
  } else {
    url = `${API_ORIGIN}/${path}`;
  }

  return appendCacheKey(url, cacheKey);
};

const appendCacheKey = (url: string, cacheKey?: string | number | null) => {
  if (cacheKey === undefined || cacheKey === null || cacheKey === '') return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(String(cacheKey))}`;
};
