// =============================================================================
// PAGE DES PARTENAIRES — MBOA NEXT STAR (Premium & Glassmorphism)
// =============================================================================

import { motion } from 'framer-motion';
import { Shield, Radio, Wrench, ExternalLink } from 'lucide-react';
import SponsorMarquee from '@/components/shared/SponsorMarquee';

const PARTNER_CATEGORIES = [
  {
    id: 'sponsors',
    title: 'Sponsors Officiels',
    icon: Shield,
    color: 'from-[#d4af37] to-[#fff3c4]',
    description: "Les piliers de l'aventure MBOA NEXT STAR, soutenant le talent africain.",
    partners: [
      { name: 'MTN CAMEROON', logo: '/images/partners/mtn.png', link: '#' },
      { name: 'REAKTOR', logo: '/images/partners/reaktor.jpg', link: '#' },
      { name: 'MTN YAMO', logo: '/images/partners/mtn-yamo.jpg', link: '#' },
    ]
  },
  {
    id: 'media',
    title: 'Partenaires Médias',
    icon: Radio,
    color: 'from-[#00d2ff] to-[#3a7bd5]',
    description: "La voix de notre concours, amplifiant le talent à travers l'Afrique.",
    partners: [
      { name: 'CRTV', logo: '/images/partners/crtv.png', link: '#' },
      { name: 'MBOA HIP HOP', logo: '/images/partners/mboa-hiphop.png', link: '#' },
      { name: 'THE MBOA VIBES', logo: '/images/partners/mboa-vibes.png', link: '#' },
    ]
  },
  {
    id: 'technical',
    title: 'Soutiens Logistiques',
    icon: Wrench,
    color: 'from-[#ff9966] to-[#ff5e62]',
    description: "L'expertise technique et événementielle au service de la perfection.",
    partners: [
      { name: 'NASH CONCEPT SARL', logo: '/images/partners/nash-concept.png', link: '#' },
      { name: 'BLED CITY', logo: '/images/partners/bled-city.png', link: '#' },
      { name: 'PARTENAIRE', logo: '/images/partners/partner5.png', link: '#' },
    ]
  }
];

const Partners = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black pb-20">
      
      {/* =====================================================================
          1. HERO SECTION (Immersive)
          ===================================================================== */}
      <section className="relative w-full pt-40 pb-20 px-6 flex items-center justify-center overflow-hidden">
        {/* Grille de fond animée */}
        <div className="absolute inset-0 z-0 opacity-20"
             style={{ backgroundImage: 'linear-gradient(#d4af37 1px, transparent 1px), linear-gradient(90deg, #d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-[1]" />
        
        {/* Glow Central */}
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

      {/* =====================================================================
          2. BANDE DE DÉFILEMENT (SPONSORS)
          ===================================================================== */}
      <div className="w-full bg-neutral-950 border-y border-neutral-900 py-3.5 mb-20 relative z-20">
        <SponsorMarquee />
      </div>

      {/* =====================================================================
          3. GRILLES PAR CATÉGORIES (Glassmorphism)
          ===================================================================== */}
      <div className="max-w-7xl mx-auto px-6 w-full space-y-32">
        {PARTNER_CATEGORIES.map((category, catIndex) => (
          <section key={category.id} className="relative w-full">
            
            {/* Entête de la catégorie */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex items-end gap-6 border-b border-white/10 pb-6 mb-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#0b0b0b] border border-[#d4af37]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <category.icon className="w-8 h-8 text-[#d4af37]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase tracking-wider">
                  {category.title}
                </h2>
                <p className="text-neutral-500 text-sm sm:text-base mt-2">
                  {category.description}
                </p>
              </div>
            </motion.div>

            {/* Grille des cartes partenaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.partners.map((partner, pIndex) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: pIndex * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group relative overflow-hidden bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-[320px] transition-all duration-500 hover:border-[#d4af37]/30 hover:bg-neutral-900/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                >
                  {/* Effet lumineux interne au survol */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#d4af37]/5 blur-[60px] rounded-full group-hover:bg-[#d4af37]/15 transition-all duration-700 pointer-events-none" />

                  {/* Logo Container */}
                  <div className="relative z-10 w-full h-32 flex items-center justify-center mb-8">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="max-w-[80%] max-h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:drop-shadow-[0_10px_20px_rgba(212,175,55,0.4)] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) parent.innerHTML = `<span class="text-[#d4af37] text-xl font-black tracking-[0.2em] uppercase">${partner.name}</span>`;
                      }}
                    />
                  </div>

                  {/* Nom du partenaire */}
                  <h3 className="relative z-10 text-white font-bold uppercase tracking-widest text-sm mb-1 group-hover:text-[#d4af37] transition-colors duration-300">
                    {partner.name}
                  </h3>

                  {/* Bouton fictif Découvrir */}
                  <div className="absolute bottom-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer uppercase tracking-wider">
                    Voir plus <ExternalLink className="w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>

          </section>
        ))}
      </div>

      {/* =====================================================================
          4. CALL TO ACTION (Devenir Partenaire)
          ===================================================================== */}
      <section className="relative max-w-4xl mx-auto mt-32 px-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#d4af37]/20 via-[#111] to-[#050505] border border-[#d4af37]/30 rounded-[2.5rem] p-12 text-center backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 blur-[80px] rounded-full pointer-events-none" />
          
          <h2 className="relative z-10 text-3xl sm:text-4xl font-black font-heading uppercase mb-4">
            Rejoignez <br/><span className="text-[#d4af37]">L'Aventure</span>
          </h2>
          <p className="relative z-10 text-neutral-400 text-sm max-w-lg mx-auto mb-8">
            Associez votre image au plus grand événement culturel urbain de l'année. 
            Découvrez nos offres de sponsoring sur-mesure.
          </p>
          
          <button className="relative z-10 px-8 py-4 bg-[#d4af37] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#b8952e] hover:scale-105 transition-all duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.2)]">
            Contactez-nous
          </button>
        </div>
      </section>

    </div>
  );
};

export default Partners;
