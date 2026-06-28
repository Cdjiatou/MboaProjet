/** Extrait le message d'erreur renvoyé par l'API backend */
export const getApiErrorMessage = (err: unknown, fallback = 'Une erreur est survenue.'): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: string; message?: string } } }).response?.data;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};
