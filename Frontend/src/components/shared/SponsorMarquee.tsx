// =============================================================================
// COMPOSANT SponsorMarquee — Bande défilante infinie (Support Images en Couleurs)
// =============================================================================

import { useThemeStore } from '@/store/useThemeStore';
import { getMediaUrl } from '@/utils/mediaUrl';
import { resolvePublicSponsors } from '@/utils/sponsors';

const SponsorLogo = ({ sponsor }: { sponsor: { name: string; logo: string | null; url?: string | null } }) => {
  const imgEl = sponsor.logo ? (
    <img
      src={getMediaUrl(sponsor.logo)}
      alt={sponsor.name}
      className="max-h-full w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] rounded-md"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        const parent = (e.target as HTMLImageElement).parentElement;
        if (parent) parent.innerHTML = `<span class="text-neutral-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase whitespace-nowrap hover:text-[#d4af37]">${sponsor.name}</span>`;
      }}
    />
  ) : (
    <>
      <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45 shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
      <span className="text-neutral-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase whitespace-nowrap group-hover:text-[#d4af37] transition-colors duration-300">
        {sponsor.name}
      </span>
    </>
  );

  const content = (
    <div className="h-12 sm:h-14 flex items-center justify-center transition-all duration-300 hover:scale-105">
      {imgEl}
    </div>
  );

  if (sponsor.url) {
    return (
      <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
};

const SponsorMarquee = () => {
  const assets = useThemeStore((state) => state.assets);

  const sponsors = resolvePublicSponsors(assets.sponsors).map((s) => ({
    name: s.name,
    logo: s.image || null,
    url: s.url || null,
  }));
  const tripledSponsors = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div className="relative w-full overflow-hidden py-4 bg-neutral-950 border-y border-neutral-900">
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max items-center animate-marquee hover:![animation-play-state:paused]">
        {tripledSponsors.map((sponsor, i) => (
          <div
            key={`${sponsor.name}-${i}`}
            className="flex items-center gap-4 mx-6 sm:mx-10 shrink-0 group"
          >
            <SponsorLogo sponsor={sponsor} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SponsorMarquee;
