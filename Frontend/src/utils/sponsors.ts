/** Sponsors par défaut du site (fallback public) */
export const DEFAULT_SPONSORS = [
  { id: 'mtn', name: 'MTN CAMEROON', image: '/images/partners/mtn.png', url: '' },
  { id: 'reaktor', name: 'REAKTOR', image: '/images/partners/reaktor.jpg', url: '' },
  { id: 'mtn-yamo', name: 'MTN YAMO', image: '/images/partners/mtn-yamo.jpg', url: '' },
  { id: 'crtv', name: 'CRTV', image: '/images/partners/crtv.png', url: '' },
  { id: 'mboa-hiphop', name: 'MBOA HIP HOP', image: '/images/partners/mboa-hiphop.png', url: '' },
  { id: 'nash', name: 'NASH CONCEPT SARL', image: '/images/partners/nash-concept.png', url: '' },
  { id: 'mboa-vibes', name: 'THE MBOA VIBES', image: '/images/partners/mboa-vibes.png', url: '' },
  { id: 'bled-city', name: 'BLED CITY', image: '/images/partners/bled-city.png', url: '' },
];

export interface SponsorItem {
  id: string;
  name: string;
  url: string;
  image: string;
}

export const parseSponsorsJson = (raw?: string | null): SponsorItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s: Partial<SponsorItem>, i: number) => ({
      id: s.id || `sponsor-${i}-${(s.name || 'x').toLowerCase().replace(/\s+/g, '-')}`,
      name: s.name || '',
      url: s.url || '',
      image: s.image || '',
    }));
  } catch {
    return [];
  }
};

/** Fusionne sponsors DB + défauts sans doublons (par nom insensible à la casse) */
export const mergeSponsors = (fromDb: SponsorItem[], defaults: SponsorItem[] = DEFAULT_SPONSORS): SponsorItem[] => {
  const map = new Map<string, SponsorItem>();
  for (const s of defaults) {
    if (s.name.trim()) map.set(s.name.trim().toLowerCase(), s);
  }
  for (const s of fromDb) {
    if (s.name.trim()) map.set(s.name.trim().toLowerCase(), s);
  }
  return Array.from(map.values());
};

/** Détecte une liste partiellement écrasée en base */
export const isSponsorsListIncomplete = (sponsors: SponsorItem[]): boolean => {
  const valid = sponsors.filter((s) => s.name.trim() && s.image.trim());
  if (valid.length === 0) return true;
  if (valid.length < DEFAULT_SPONSORS.length) return true;
  const defaultNames = new Set(DEFAULT_SPONSORS.map((s) => s.name.trim().toLowerCase()));
  const matchedDefaults = valid.filter((s) => defaultNames.has(s.name.trim().toLowerCase())).length;
  return matchedDefaults < Math.min(3, DEFAULT_SPONSORS.length);
};

/** Résout la liste à afficher sur le site public */
export const resolvePublicSponsors = (raw?: string | null): SponsorItem[] => {
  const fromConfig = parseSponsorsJson(raw);
  const valid = fromConfig.filter((s) => s.name.trim() && s.image.trim());
  if (valid.length === 0) return [...DEFAULT_SPONSORS];
  if (isSponsorsListIncomplete(valid)) return mergeSponsors(valid, DEFAULT_SPONSORS);
  return valid;
};

export const generateSponsorId = () => `sp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
