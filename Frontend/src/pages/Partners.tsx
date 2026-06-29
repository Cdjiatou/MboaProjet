// =============================================================================
// PAGE DES PARTENAIRES — MBOA NEXT STAR (Premium & Glassmorphism)
// =============================================================================

import { motion } from 'framer-motion';
import { Shield, ExternalLink } from 'lucide-react';
import SponsorMarquee from '@/components/shared/SponsorMarquee';
import { useThemeStore } from '@/store/useThemeStore';
import { getMediaUrl } from '@/utils/mediaUrl';
import { Link } from 'react-router-dom';
import { resolvePublicSponsors } from '@/utils/sponsors';

const Partners = () => {
  const assets = useThemeStore((state) => state.assets);

  const partners = resolvePublicSponsors(assets.sponsors);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black pb-20">

      {/* HERO */}
      <section className="relative w-full pt-40 pb-20 px-6 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20"
             style={{ backgroundImage: 'linear-gradient(#d4af37 1px, transparent 1px), linear-gradient(90deg, #d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-[1]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-[#d4af37]/10 blur-[100px] rounded-full z-[1]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 mb-6"
          >
            <Shield className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider">
              Le Cercle d'Excellence
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[1.05] font-heading tracking-[-0.026em]"
          >
            Nos <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Partenaires</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Ils croient au potentiel de la jeunesse et s'engagent à nos côtés pour faire briller
            la nouvelle génération de talents africains.
          </motion.p>
        </div>
      </section>

      {/* BANDE DÉFILANTE */}
      <div className="w-full bg-neutral-950 border-y border-neutral-900 py-3.5 mb-20 relative z-20">
        <SponsorMarquee />
      </div>

      {/* GRILLE DES PARTENAIRES */}
      <div className="max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-end gap-6 border-b border-white/10 pb-6 mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#0b0b0b] border border-[#d4af37]/20 flex items-center justify-center shrink-0">
            <Shield className="w-8 h-8 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase tracking-wider">
              Nos Partenaires
            </h2>
            <p className="text-neutral-500 text-sm sm:text-base mt-2">
              Cliquez sur un partenaire pour découvrir son site web.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {partners.map((partner: { name: string; image: string; url?: string }, pIndex: number) => {
            const CardWrapper = partner.url ? 'a' : 'div';
            const cardProps = partner.url
              ? { href: partner.url, target: '_blank' as const, rel: 'noopener noreferrer' }
              : {};

            return (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: (pIndex % 4) * 0.1 }}
                className="h-full"
              >
                <CardWrapper
                  {...cardProps}
                  className={`
                    group relative overflow-hidden bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/5 
                    rounded-3xl p-6 flex flex-col items-center justify-between text-center h-[260px] 
                    transition-all duration-500 hover:bg-[#0f0f15]/80 hover:border-[#d4af37]/30 
                    hover:shadow-[0_20px_40px_rgba(212,175,55,0.05)] block w-full
                  `}
                >
                  {/* Effet lumineux de fond */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#d4af37]/[0.03] blur-[40px] rounded-full group-hover:bg-[#d4af37]/10 transition-all duration-700 pointer-events-none" />

                  {/* Conteneur de l'image (centré, taille fixe) */}
                  <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-[120px] mb-4">
                    <img
                      src={getMediaUrl(partner.image)}
                      alt={partner.name}
                      className="max-w-[85%] max-h-[100px] object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-[0_4px_12px_rgba(255,255,255,0.03)] group-hover:drop-shadow-[0_4px_15px_rgba(212,175,55,0.15)] rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) parent.innerHTML = `<span class="text-neutral-500 text-sm font-bold tracking-widest uppercase">${partner.name}</span>`;
                      }}
                    />
                  </div>

                  {/* Textes en bas */}
                  <div className="relative z-10 mt-auto w-full">
                    <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-1.5 group-hover:text-[#d4af37] transition-colors line-clamp-1 px-2">
                      {partner.name}
                    </h3>

                    {partner.url ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 group-hover:text-[#d4af37]/80 uppercase tracking-wider transition-colors">
                        Visiter <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="inline-block h-4" /> 
                    )}
                  </div>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto mt-32 px-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#d4af37]/20 via-[#111] to-[#050505] border border-[#d4af37]/30 rounded-[2.5rem] p-12 text-center backdrop-blur-xl">
          <h2 className="relative z-10 text-3xl sm:text-4xl font-black font-heading uppercase mb-4">
            Rejoignez <br /><span className="text-[#d4af37]">L'Aventure</span>
          </h2>
          <p className="relative z-10 text-neutral-400 text-sm max-w-lg mx-auto mb-8">
            Associez votre image au plus grand événement culturel urbain de l'année.
          </p>
          <Link
            to="/contact"
            className="relative z-10 inline-block px-6 py-3 bg-[#d4af37] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#b8952e] hover:scale-105 transition-all duration-300"
          >
            Contactez-nous
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Partners;
