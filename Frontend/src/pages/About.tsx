import { motion } from 'framer-motion';
import { Star, Award, Mic, Music, Building2, Users } from 'lucide-react';
import SponsorMarquee from '@/components/shared/SponsorMarquee';

const About = () => {
  return (
    <div className="min-h-screen bg-background text-white font-sans pt-20">
      
      {/* =====================================================================
          1. HERO SECTION (TONY NOBODY)
          ===================================================================== */}
      <section className="relative w-full py-24 px-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_70%)]">
        {/* Abstract African Pattern Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">
                Press Book & Concept
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black uppercase font-heading leading-none tracking-[-0.026em]">
              Tony Nobody <br/>
              <span className="bg-gradient-to-br from-primary via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent text-4xl sm:text-6xl">
                The Legend
              </span>
            </h1>
            
            <p className="text-neutral-400 text-lg leading-relaxed border-l-4 border-primary pl-4">
              Présenté par ses pairs et le public comme une <strong className="text-white">véritable légende</strong> de la culture urbaine Camerounaise.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative w-full aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden border border-primary/20 bg-surface/50 p-2"
          >
            <div className="w-full h-full bg-neutral-900 rounded-2xl overflow-hidden relative group">
              {/* IMAGE PRINCIPALE HERO */}
              <img 
                src="/images/pressbook/hero-legend.jpeg" 
                alt="Tony Nobody The Legend" 
                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516280440503-6c9fa5c62de2?q=80&w=800&auto=format&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-primary font-black uppercase tracking-[0.3em] text-sm">Tony NOBODY</p>
                <p className="text-white text-xs opacity-70 tracking-widest uppercase">to become SOMEBODY</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          2. BIOGRAPHIE & ŒUVRE
          ===================================================================== */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <span className="text-primary text-xs font-bold uppercase tracking-[0.25em] block mb-2">Biographie</span>
              <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase text-white">
                Un pionnier au service de la culture
              </h2>
            </div>
            
            <div className="space-y-5 text-neutral-400 leading-relaxed text-sm sm:text-base">
              <p>
                Il a fait et continue de faire avancer des milliers d'années lumières, la musique et la culture urbaine de son pays le Cameroun.
              </p>
              <p>
                En tant qu'acteur aux multiples tentacules, il trouve du temps à faire de la musique quand il ne donne pas la main à ceux qui en ont besoin dans ce vaste chantier en construction.
              </p>
              <div className="bg-surface border border-primary/10 p-6 rounded-2xl mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Mic className="text-primary w-6 h-6" />
                  <h3 className="text-white font-bold uppercase tracking-wider">Artiste et Producteur</h3>
                </div>
                <p className="text-sm">
                  1 Album et de multiples singles. Il a aussi produit une kyrielle d'artistes majeurs de la scène locale. Créateur et compositeur du groupe mythique <strong className="text-white">BANTOU POSSE</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="bg-surface/50 border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors">
              <Music className="text-primary w-8 h-8 mb-4" />
              <h4 className="text-white font-bold mb-2 uppercase text-sm">Innovateur Musical</h4>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Il crée le concept <strong className="text-white">MBOA TRAP</strong> avec les titres "DANSE D'ABORD" et "DEBOUT".
              </p>
            </div>
            
            <div className="bg-surface/50 border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors mt-0 sm:mt-8">
              <Award className="text-primary w-8 h-8 mb-4" />
              <h4 className="text-white font-bold mb-2 uppercase text-sm">Love Peace Respect</h4>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Après la sortie de son 1er album éponyme, il enregistre et garde autant de titres magiques différents les uns des autres.
              </p>
            </div>
            
            <div className="bg-surface/50 border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors">
              <Building2 className="text-primary w-8 h-8 mb-4" />
              <h4 className="text-white font-bold mb-2 uppercase text-sm">Mood & Com</h4>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Promoteur de MOOD & COM, l'agence, la boite, le label situé au-delà de la communication et de la production.
              </p>
            </div>
            
            <div className="bg-surface/50 border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors mt-0 sm:mt-8">
              <Users className="text-primary w-8 h-8 mb-4" />
              <h4 className="text-white font-bold mb-2 uppercase text-sm">SYNAMURCA</h4>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Aujourd'hui Président du Syndicat des Acteurs des Musiques Urbaines.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* =====================================================================
          3. LE CONCEPT MBOA NEXT STAR
          ===================================================================== */}
      <section className="py-24 px-6 border-y border-white/5 bg-[#080808] text-center">
        <div className="max-w-4xl mx-auto">
          <Star className="w-10 h-10 text-primary mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] uppercase mb-8">
            L'Aventure <span className="bg-gradient-to-br from-primary via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">MBOA NEXT STAR</span>
          </h2>
          
          <div className="text-neutral-300 text-base sm:text-lg leading-loose space-y-6">
            <p>
              <strong className="text-white">MBOA NEXT STAR</strong> est le plus grand concours national de talents urbains du Cameroun. Musique, humour, danse, DJ, Miss & Master : découvrez les étoiles de demain à travers des auditions, compétitions, contenus exclusifs et événements live.
            </p>
            <p>
              Une initiative portée par <strong className="text-primary">La Légende Vivante Tony Nobody</strong> pour révéler, former et propulser De Nouveaux talents camerounais vers les scènes nationales et internationales.
            </p>
          </div>
          
          {/* GRILLE D'IMAGES PRESS BOOK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 mb-8">
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-surface/50">
              <img 
                src="/images/pressbook/biographie.jpeg" 
                alt="Biographie" 
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-surface/50">
              <img 
                src="/images/pressbook/mboa-trap.jpeg" 
                alt="Mboa Trap & Albums" 
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-surface/50">
              <img 
                src="/images/pressbook/events.jpeg" 
                alt="Mboa Come Test Events" 
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 inline-block bg-primary/10 border border-primary/20 px-8 py-4 rounded-full"
          >
            <p className="text-primary font-black uppercase tracking-widest text-sm">
              Abonnez-vous et vivez l'aventure 2026-2027 ! 🚀🔥
            </p>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          4. SPONSORS BOTTOM
          ===================================================================== */}
      <div className="w-full bg-neutral-950 py-5">
        <SponsorMarquee />
      </div>

    </div>
  );
};

export default About;
