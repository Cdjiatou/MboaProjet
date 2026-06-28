export interface SponsorEntry {
  id: string;
  name: string;
  url: string;
  image: string;
}

/** Partenaires historiques du site (fallback + récupération après écrasement partiel) */
export const DEFAULT_SPONSORS: SponsorEntry[] = [
  { id: 'mtn', name: 'MTN CAMEROON', image: '/images/partners/mtn.png', url: '' },
  { id: 'reaktor', name: 'REAKTOR', image: '/images/partners/reaktor.jpg', url: '' },
  { id: 'mtn-yamo', name: 'MTN YAMO', image: '/images/partners/mtn-yamo.jpg', url: '' },
  { id: 'crtv', name: 'CRTV', image: '/images/partners/crtv.png', url: '' },
  { id: 'mboa-hiphop', name: 'MBOA HIP HOP', image: '/images/partners/mboa-hiphop.png', url: '' },
  { id: 'nash', name: 'NASH CONCEPT SARL', image: '/images/partners/nash-concept.png', url: '' },
  { id: 'mboa-vibes', name: 'THE MBOA VIBES', image: '/images/partners/mboa-vibes.png', url: '' },
  { id: 'bled-city', name: 'BLED CITY', image: '/images/partners/bled-city.png', url: '' },
];

export const parseSponsorsConfig = (raw?: string | null): SponsorEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s: Partial<SponsorEntry>, i: number) => ({
      id: s.id || `sponsor-${i}-${(s.name || 'x').toLowerCase().replace(/\s+/g, '-')}`,
      name: s.name || '',
      url: s.url || '',
      image: s.image || '',
    }));
  } catch {
    return [];
  }
};

/** Fusionne par nom (insensible à la casse) — les entrées DB écrasent les défauts */
export const mergeSponsorsByName = (
  fromDb: SponsorEntry[],
  defaults: SponsorEntry[] = DEFAULT_SPONSORS
): SponsorEntry[] => {
  const map = new Map<string, SponsorEntry>();
  for (const s of defaults) {
    if (s.name.trim()) map.set(s.name.trim().toLowerCase(), s);
  }
  for (const s of fromDb) {
    if (s.name.trim()) map.set(s.name.trim().toLowerCase(), s);
  }
  return Array.from(map.values());
};

/** Détecte une liste partiellement écrasée (bug de sauvegarde antérieur) */
export const isSponsorsListIncomplete = (sponsors: SponsorEntry[]): boolean => {
  const valid = sponsors.filter((s) => s.name.trim() && s.image.trim());
  if (valid.length === 0) return true;
  if (valid.length < DEFAULT_SPONSORS.length) return true;
  const defaultNames = new Set(DEFAULT_SPONSORS.map((s) => s.name.trim().toLowerCase()));
  const matchedDefaults = valid.filter((s) => defaultNames.has(s.name.trim().toLowerCase())).length;
  return matchedDefaults < Math.min(3, DEFAULT_SPONSORS.length);
};

/** Résout la liste à afficher : DB + défauts si liste incomplète */
export const resolvePublicSponsors = (fromConfig: SponsorEntry[]): SponsorEntry[] => {
  const valid = fromConfig.filter((s) => s.name.trim() && s.image.trim());
  if (valid.length === 0) return [...DEFAULT_SPONSORS];
  if (isSponsorsListIncomplete(valid)) return mergeSponsorsByName(valid, DEFAULT_SPONSORS);
  return valid;
};

/** Fusionne deux listes : `incoming` écrase par id ou nom, préserve l'existant non mentionné si replaceAll=false */
export const mergeSponsorsConfig = (
  existing: SponsorEntry[],
  incoming: SponsorEntry[],
  replaceAll = false
): SponsorEntry[] => {
  if (replaceAll) return incoming;

  const incomingIds = new Set(incoming.map((s) => s.id));
  const incomingNames = new Set(incoming.map((s) => s.name.trim().toLowerCase()).filter(Boolean));

  const preserved = existing.filter(
    (s) => !incomingIds.has(s.id) && !incomingNames.has(s.name.trim().toLowerCase())
  );

  return [...preserved, ...incoming];
};
