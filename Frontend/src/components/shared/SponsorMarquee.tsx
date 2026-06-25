// =============================================================================
// COMPOSANT SponsorMarquee — Bande défilante infinie (Support Images en Couleurs)
// =============================================================================

import { useThemeStore } from '@/store/useThemeStore';

/** Sponsors par défaut avec logos originaux en couleur */
const DEFAULT_PARTNERS = [
  { name: 'MTN CAMEROON', logo: '/images/partners/mtn.png' },
  { name: 'REAKTOR', logo: '/images/partners/reaktor.jpg' },
  { name: 'MTN YAMO', logo: '/images/partners/mtn-yamo.jpg' },
  { name: 'CRTV', logo: '/images/partners/crtv.png' },
  { name: 'MBOA HIP HOP', logo: '/images/partners/mboa-hiphop.png' },
  { name: 'NASH CONCEPT', logo: '/images/partners/nash-concept.png' },
  { name: 'THE MBOA VIBES', logo: '/images/partners/mboa-vibes.png' },
  { name: 'BLED CITY', logo: '/images/partners/bled-city.png' },
  { name: 'PARTENAIRE', logo: '/images/partners/partner5.png' },
];

const SponsorMarquee = () => {
  const assets = useThemeStore((state) => state.assets);

  // Découper les sponsors depuis la config admin (clé "sponsors", séparés par virgule)
  // S'il y a une configuration dynamique, on les affiche en texte. Sinon on utilise les logos.
  const sponsorsFromConfig = assets.sponsors
    ? assets.sponsors.split(',').map((s) => ({ name: s.trim(), logo: null })).filter((s) => s.name)
    : [];

  const sponsors = sponsorsFromConfig.length > 0 ? sponsorsFromConfig : DEFAULT_PARTNERS;

  // Tripler la liste sécurise le défilement continu sur les écrans ultra-larges
  const tripledSponsors = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div className="relative w-full overflow-hidden py-4 bg-neutral-950 border-y border-neutral-900">
      
      {/* Fondu aux extrémités pour l'effet premium de masque liquide */}
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

      {/* Piste de défilement */}
      <div className="flex w-max items-center animate-marquee hover:![animation-play-state:paused]">
        {tripledSponsors.map((sponsor, i) => (
          <div
            key={`${sponsor.name}-${i}`}
            className="flex items-center gap-4 mx-6 sm:mx-10 shrink-0 group"
          >
            {sponsor.logo ? (
              /* Affichage du logo image en couleurs réelles */
              <div className="h-12 sm:h-14 flex items-center justify-center transition-all duration-300 hover:scale-105">
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="max-h-full w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] rounded-md"
                  onError={(e) => {
                    // Fallback texte si l'image n'est pas trouvée
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) parent.innerHTML = `<span class="text-neutral-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase whitespace-nowrap hover:text-[#d4af37]">${sponsor.name}</span>`;
                  }}
                />
              </div>
            ) : (
              /* Affichage texte standard (fallback ou config admin) */
              <>
                <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45 shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                <span className="text-neutral-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase whitespace-nowrap group-hover:text-[#d4af37] transition-colors duration-300">
                  {sponsor.name}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SponsorMarquee;