"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeSponsorsConfig = exports.resolvePublicSponsors = exports.isSponsorsListIncomplete = exports.mergeSponsorsByName = exports.parseSponsorsConfig = exports.DEFAULT_SPONSORS = void 0;
/** Partenaires historiques du site (fallback + récupération après écrasement partiel) */
exports.DEFAULT_SPONSORS = [
    { id: 'mtn', name: 'MTN CAMEROON', image: '/images/partners/mtn.png', url: '' },
    { id: 'reaktor', name: 'REAKTOR', image: '/images/partners/reaktor.jpg', url: '' },
    { id: 'mtn-yamo', name: 'MTN YAMO', image: '/images/partners/mtn-yamo.jpg', url: '' },
    { id: 'crtv', name: 'CRTV', image: '/images/partners/crtv.png', url: '' },
    { id: 'mboa-hiphop', name: 'MBOA HIP HOP', image: '/images/partners/mboa-hiphop.png', url: '' },
    { id: 'nash', name: 'NASH CONCEPT SARL', image: '/images/partners/nash-concept.png', url: '' },
    { id: 'mboa-vibes', name: 'THE MBOA VIBES', image: '/images/partners/mboa-vibes.png', url: '' },
    { id: 'bled-city', name: 'BLED CITY', image: '/images/partners/bled-city.png', url: '' },
];
const parseSponsorsConfig = (raw) => {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.map((s, i) => ({
            id: s.id || `sponsor-${i}-${(s.name || 'x').toLowerCase().replace(/\s+/g, '-')}`,
            name: s.name || '',
            url: s.url || '',
            image: s.image || '',
        }));
    }
    catch {
        return [];
    }
};
exports.parseSponsorsConfig = parseSponsorsConfig;
/** Fusionne par nom (insensible à la casse) — les entrées DB écrasent les défauts */
const mergeSponsorsByName = (fromDb, defaults = exports.DEFAULT_SPONSORS) => {
    const map = new Map();
    for (const s of defaults) {
        if (s.name.trim())
            map.set(s.name.trim().toLowerCase(), s);
    }
    for (const s of fromDb) {
        if (s.name.trim())
            map.set(s.name.trim().toLowerCase(), s);
    }
    return Array.from(map.values());
};
exports.mergeSponsorsByName = mergeSponsorsByName;
/** Détecte une liste partiellement écrasée (bug de sauvegarde antérieur) */
const isSponsorsListIncomplete = (sponsors) => {
    const valid = sponsors.filter((s) => s.name.trim() && s.image.trim());
    if (valid.length === 0)
        return true;
    if (valid.length < exports.DEFAULT_SPONSORS.length)
        return true;
    const defaultNames = new Set(exports.DEFAULT_SPONSORS.map((s) => s.name.trim().toLowerCase()));
    const matchedDefaults = valid.filter((s) => defaultNames.has(s.name.trim().toLowerCase())).length;
    return matchedDefaults < Math.min(3, exports.DEFAULT_SPONSORS.length);
};
exports.isSponsorsListIncomplete = isSponsorsListIncomplete;
/** Résout la liste à afficher : DB + défauts si liste incomplète */
const resolvePublicSponsors = (fromConfig) => {
    const valid = fromConfig.filter((s) => s.name.trim() && s.image.trim());
    if (valid.length === 0)
        return [...exports.DEFAULT_SPONSORS];
    if ((0, exports.isSponsorsListIncomplete)(valid))
        return (0, exports.mergeSponsorsByName)(valid, exports.DEFAULT_SPONSORS);
    return valid;
};
exports.resolvePublicSponsors = resolvePublicSponsors;
/** Fusionne deux listes : `incoming` écrase par id ou nom, préserve l'existant non mentionné si replaceAll=false */
const mergeSponsorsConfig = (existing, incoming, replaceAll = false) => {
    if (replaceAll)
        return incoming;
    const incomingIds = new Set(incoming.map((s) => s.id));
    const incomingNames = new Set(incoming.map((s) => s.name.trim().toLowerCase()).filter(Boolean));
    const preserved = existing.filter((s) => !incomingIds.has(s.id) && !incomingNames.has(s.name.trim().toLowerCase()));
    return [...preserved, ...incoming];
};
exports.mergeSponsorsConfig = mergeSponsorsConfig;
