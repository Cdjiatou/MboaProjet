// =============================================================================
// PAGE D'ACCUEIL — MBOA NEXT STAR (Corrigée & Alignée sur la charte Premium)
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Mic, Music, Laugh, Crown, Disc, TrendingUp, Phone, Mail } from 'lucide-react';
import { CandidateCard } from '@/components/candidate/CandidateCard';
import SponsorMarquee from '@/components/shared/SponsorMarquee';
import { getCategories } from '@/services/adminService';
import { useThemeStore } from '@/store/useThemeStore';
import type { Category, Candidate } from '@/types';

// =============================================================================
// DONNÉES STATIQUES & FALLBACKS
// =============================================================================

const DEFAULT_HERO_IMAGES = [
  "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/e4c4da7ff_WhatsAppImage2026-06-24at122312.jpg",
  "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/ef6237930_WhatsAppImage2026-06-24at122313.jpg",
  "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/65bd1e076_WhatsAppImage2026-06-24at122314.jpeg",
  "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/cca43cfe1_WhatsAppImage2026-06-24at122315.jpg",
  "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/9f593dbde_WhatsAppImage2026-06-24at122316.jpg",
];

const STATS = [
  { value: '08', label: 'Semaines de compétition' },
  { value: '07M', label: 'FCFA de dotation' },
  { value: '05', label: 'Catégories' },
  { value: '100', label: 'FCFA / Vote' },
] as const;

const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  chant: Mic,
  chanson: Mic,
  danse: Music,
  humour: Laugh,
  comedie: Laugh,
  'miss&master': Crown,
  miss: Crown,
  dj: Disc,
  magie: Star,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  chant: "Les voix qui font vibrer l'Afrique",
  chanson: "Les voix qui font vibrer l'Afrique",
  danse: 'Le rythme dans le sang',
  humour: 'Le rire est universel',
  comedie: 'Le rire est universel',
  'miss&master': 'Élégance et charisme',
  miss: 'Élégance et charisme',
  dj: 'Les maîtres des platines',
  magie: 'L\'art de l\'impossible',
};

const getCategoryIcon = (slug: string | null): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
  if (!slug) return Star;
  const normalizedSlug = slug.toLowerCase().replace(/[-_\s]/g, '');
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalizedSlug.includes(key)) return icon;
  }
  return Star;
};

const getCategoryDescription = (slug: string | null): string => {
  if (!slug) return 'Découvrir les talents';
  const normalizedSlug = slug.toLowerCase().replace(/[-_\s]/g, '');
  for (const [key, desc] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    if (normalizedSlug.includes(key)) return desc;
  }
  return 'Découvrir les talents';
};

const CATEGORY_IMAGES: Record<string, string> = {
  dj: '/images/categories/deejay.jpg',
  deejay: '/images/categories/deejay.jpg',
  miss: '/images/categories/miss.jpg',
  master: '/images/categories/miss.jpg',
  'miss&master': '/images/categories/miss.jpg',
  chant: '/images/categories/chant.jpg',
  chanson: '/images/categories/chant.jpg',
  danse: '/images/categories/danse.png',
  humour: '/images/categories/comedie.png',
  comedie: '/images/categories/comedie.png',
  magie: '/images/categories/magie.png',
};

const getCategoryBackgroundImage = (cat: Category): string | null => {
  const textToMatch = `${cat.slug || ''} ${cat.name || ''}`.toLowerCase().replace(/[-_\s]/g, '');
  for (const [key, img] of Object.entries(CATEGORY_IMAGES)) {
    if (textToMatch.includes(key)) return img;
  }
  return null;
};

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const assets = useThemeStore((state) => state.assets);

  const heroImages: string[] = (() => {
    const fromAssets = [
      assets.hero_image_1,
      assets.hero_image_2,
      assets.hero_image_3,
      assets.hero_image_4,
      assets.hero_image_5,
    ].filter((img): img is string => typeof img === 'string' && img.length > 0);
    return fromAssets.length > 0 ? fromAssets : DEFAULT_HERO_IMAGES;
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
          const candidates = res.data
            .flatMap((cat) => (cat.candidates || []).map((c) => ({ ...c, category: cat })))
            .filter((c) => c.status === 'ACTIVE')
            .sort((a, b) => b.totalVotesCache - a.totalVotesCache);
          setAllCandidates(candidates);
        }
      } catch (err) {
        console.error('Erreur chargement catégories :', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroImages.length);
  }, [heroImages.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const topFavorites = allCandidates.slice(0, 3);
  const displayedCandidates = allCandidates.slice(0, 6);

  return (
    // FIX CONTENEUR PARENT : block width full pour empêcher l'écrasement latéral
    <div className="block w-full min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black">

      {/* =====================================================================
          1. HERO SECTION
          ===================================================================== */}
      <section className="relative w-full h-dvh min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentHeroSlide}
              src={heroImages[currentHeroSlide]}
              alt={`MBOA NEXT STAR Slide ${currentHeroSlide + 1}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] brightness-[0.4]"
            />
          </AnimatePresence>
        </div>

        {/* Overlays Premium : Gradient + Vignette + Glow central */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-[#050505] z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_100%)] opacity-70 z-[1] mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-[#d4af37]/15 blur-[120px] rounded-full pointer-events-none z-[1]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center mt-16">
          
          {/* Badge Saison */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-[#d4af37]/40 bg-black/50 backdrop-blur-xl mb-8 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d4af37]"></span>
            </span>
            <span className="text-[#d4af37] text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em]">
              Saison 2026 — Du 07 Juillet au 28 Août
            </span>
          </motion.div>

          {/* Titre Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-7xl lg:text-[5.5rem] font-black uppercase leading-[1.05] font-heading tracking-[-0.03em]"
          >
            <span className="text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">La Prochaine</span> <br />
            <span className="relative inline-block mt-1 sm:mt-3">
              <span className="relative z-10 bg-gradient-to-r from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent filter drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                Star C'est Toi
              </span>
              {/* Soulignement stylisé */}
              <svg className="absolute -bottom-3 sm:-bottom-5 left-1/2 -translate-x-1/2 w-3/4 h-3 sm:h-5 text-[#d4af37]/60" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.00021 6.5C45.5002 2 153.501 -2.00004 198 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </motion.h1>

          {/* Paragraphe de description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 sm:mt-14 text-neutral-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-light drop-shadow-lg"
          >
            Découvrez les talents qui façonneront la culture africaine. <br className="hidden sm:block" />
            <strong className="text-white font-medium">Votez, soutenez, et propulsez</strong> vos artistes préférés vers les étoiles.
          </motion.p>

          {/* Boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto"
          >
            <a
              href="#candidates"
              className="group relative px-8 py-4 sm:py-5 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black text-[13px] font-black uppercase tracking-widest rounded-xl overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              <span className="relative z-10">Découvrir les Candidats</span>
              <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              to="/artist"
              className="px-8 py-4 sm:py-5 border border-white/20 bg-white/5 backdrop-blur-md text-white text-[13px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 hover:border-white/40 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1"
            >
              En savoir plus
            </Link>
          </motion.div>
        </div>

        {/* Indicateurs de Slide modifiés */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHeroSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentHeroSlide 
                  ? 'bg-[#d4af37] w-12 shadow-[0_0_10px_rgba(212,175,55,0.8)]' 
                  : 'bg-white/30 w-3 hover:bg-white/50 hover:w-5'
              }`}
              aria-label={`Aller au slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* =====================================================================
          2. BANDE SPONSORS HAUT
          ===================================================================== */}
      <div className="w-full bg-neutral-950 border-y border-neutral-900 py-3.5">
        <SponsorMarquee />
      </div>

      {/* =====================================================================
          3. SECTION STATS (Ajusté pour être centré et fluide sur mobile)
          ===================================================================== */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center border border-[#d4af37]/10 rounded-2xl p-6 bg-[#0b0b0b]/40 backdrop-filter backdrop-blur-md"
            >
              <p className="text-3xl sm:text-5xl font-black text-[#d4af37] tracking-tight">
                {stat.value}
              </p>
              <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          4. À PROPOS
          ===================================================================== */}
      <section id="about" className="py-20 px-6 max-w-4xl mx-auto w-full text-center">
        <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] block mb-3">
          À propos
        </span>
        <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] mb-6 text-white uppercase">
          Découvrez le concept de <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">MBOA NEXT STAR</span>
        </h2>
        <div className="space-y-6 text-neutral-400 text-sm sm:text-base leading-relaxed">
          <p>
            <strong className="text-white font-semibold">MBOA NEXT STAR</strong> est le plus grand concours national de talents urbains du Cameroun. Musique, humour, danse, DJ, Miss & Master : découvrez les étoiles de demain à travers des auditions, compétitions, contenus exclusifs et événements live.
          </p>
          <p>
            Une initiative portée par <span className="text-[#d4af37] font-semibold italic">La Légende Vivante Tony Nobody</span> pour révéler, former et propulser De Nouveaux talents camerounais vers les scènes nationales et internationales.
          </p>
          <p className="text-white font-bold uppercase tracking-wider text-xs pt-2">
            Abonnez-vous et vivez l'aventure MBOA NEXT STAR 2026-2027 ! 🚀🔥
          </p>
        </div>
      </section>

      {/* =====================================================================
          4b. FAVORIS DU MOMENT
          ===================================================================== */}
      {topFavorites.length > 0 && (
        <section className="py-12 px-6 max-w-7xl mx-auto w-full">
          <div className="mb-10 text-left">
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] block mb-1">
              Live Momentum
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-[-0.026em] uppercase">
              Les Favoris du Moment
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {topFavorites.map((candidate, i) => (
              <CandidateCard key={candidate.id} candidate={candidate} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          5. LES CATÉGORIES (Design Premium Bento + Posters)
          ===================================================================== */}
      <section id="categories" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow de fond amélioré */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-[#d4af37]/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/3 blur-[200px] rounded-full pointer-events-none" />

        {/* En-tête de section */}
        <div className="relative z-10 mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-4">
              <span className="w-8 h-px bg-[#d4af37]/60" />
              Explorer les talents
              <span className="w-8 h-px bg-[#d4af37]/60" />
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-[-0.03em] uppercase mt-3">
              Nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f5e6b8] to-[#d4af37]">Catégories</span>
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
              Découvrez les différentes disciplines et votez pour vos talents préférés
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 w-full">
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full auto-rows-[minmax(320px,_auto)]">
              {categories.map((cat, index) => {
                const IconComponent = getCategoryIcon(cat.slug);
                const description = getCategoryDescription(cat.slug);
                const bgImage = getCategoryBackgroundImage(cat);
                const candidateCount = cat.candidates?.length || 0;
                // La première catégorie occupe plus d'espace (featured)
                const isFeatured = index === 0;
                
                return (
                  <motion.div
                    key={cat.id}
                    onClick={() => navigate(`/candidats?category=${cat.slug}`)}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -8, transition: { duration: 0.4, ease: 'easeOut' } }}
                    className={`group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col justify-end
                      ${ isFeatured ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[420px] sm:min-h-[520px]' : 'min-h-[320px] sm:min-h-[380px]' }
                    `}
                    style={{
                      background: 'linear-gradient(145deg, #0d0d0d 0%, #080808 100%)',
                    }}
                  >
                    {/* === Bordure dorée animée au hover === */}
                    <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none transition-opacity duration-700 opacity-0 group-hover:opacity-100"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.5), transparent, rgba(212,175,55,0.3), transparent, rgba(212,175,55,0.5))',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor',
                        padding: '1.5px',
                      }}
                    />
                    {/* Bordure par défaut */}
                    <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none border border-white/[0.06] group-hover:border-transparent transition-colors duration-500" />

                    {/* === Image de fond (Poster) === */}
                    {bgImage && !failedImages.has(cat.id) ? (
                      <div className="absolute inset-0 z-0 overflow-hidden">
                        <img 
                          src={bgImage} 
                          alt={cat.name} 
                          loading="lazy"
                          onError={() => setFailedImages(prev => new Set(prev).add(cat.id))}
                          className="w-full h-full object-cover object-top transform scale-[1.02] group-hover:scale-110 transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)]"
                        />
                        {/* Overlay gradient multi-couches pour lisibilité */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-0 overflow-hidden">
                        {/* Fond dégradé dynamique avec effet radial doré */}
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(212,175,55,0.08)_0%,_transparent_60%)] group-hover:bg-[radial-gradient(ellipse_at_30%_20%,_rgba(212,175,55,0.15)_0%,_transparent_60%)] transition-all duration-700" />
                        {/* Icône décorative de fond, grande et subtile */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700">
                          <IconComponent className={`${ isFeatured ? 'w-64 h-64' : 'w-40 h-40'} text-[#d4af37]`} />
                        </div>
                      </div>
                    )}

                    {/* === Glow effect au hover === */}
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-[#d4af37]/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 pointer-events-none" />

                    {/* === Badge nombre de candidats (coin haut droit) === */}
                    {candidateCount > 0 && (
                      <div className="absolute top-4 right-4 z-30">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 group-hover:border-[#d4af37]/30 transition-all duration-500">
                          <TrendingUp className="w-3 h-3 text-[#d4af37]" />
                          <span className="text-white text-[11px] font-bold">{candidateCount}</span>
                          <span className="text-neutral-400 text-[10px]">candidat{candidateCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    {/* === Contenu principal (bas de la carte) === */}
                    <div className={`relative z-10 p-5 sm:p-7 flex flex-col w-full
                      ${ isFeatured ? 'items-start text-left' : 'items-center text-center' }
                      transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out`}
                    >
                      {/* Icône */}
                      <div className={`rounded-xl bg-black/40 backdrop-blur-sm border border-[#d4af37]/20 flex items-center justify-center mb-4
                        group-hover:bg-[#d4af37]/90 group-hover:border-[#d4af37] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-500
                        ${ isFeatured ? 'w-14 h-14' : 'w-12 h-12' }`}
                      >
                        <IconComponent className={`text-[#d4af37] group-hover:text-black transition-colors duration-500
                          ${ isFeatured ? 'w-6 h-6' : 'w-5 h-5' }`}
                        />
                      </div>
                      
                      {/* Nom de la catégorie */}
                      <h3 className={`text-white font-black uppercase tracking-wider mb-1.5 drop-shadow-lg
                        ${ isFeatured ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-xl' }`}
                      >
                        {cat.name}
                      </h3>
                      
                      {/* Description */}
                      <p className={`text-neutral-300/80 leading-relaxed drop-shadow-md
                        ${ isFeatured ? 'text-sm sm:text-base max-w-sm' : 'text-xs sm:text-sm' }`}
                      >
                        {description}
                      </p>
                      
                      {/* CTA au hover */}
                      <div className={`flex items-center gap-2 text-[#d4af37] font-bold uppercase tracking-wider
                        opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-150 ease-out
                        ${ isFeatured ? 'mt-6 text-sm' : 'mt-4 text-xs' }`}
                      >
                        Découvrir
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#0b0b0b]/40 border border-[#d4af37]/10 rounded-2xl py-16 px-6 flex flex-col items-center justify-center w-full max-w-2xl mx-auto backdrop-blur-md">
              <Star className="w-8 h-8 text-neutral-700 mb-4" />
              <p className="text-neutral-400 text-base font-medium">Catégories en cours de configuration.</p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          6. TOUS LES CANDIDATS
          ===================================================================== */}
      <section id="candidates" className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-10 text-left">
          <div>
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] block mb-1">
              Talents
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-[-0.026em] uppercase">
              Tous les Candidats
            </h2>
          </div>
          {allCandidates.length > 6 && (
            <a
              href="#candidates"
              className="text-[#d4af37] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline underline-offset-4 transition-all shrink-0"
            >
              Voir tout
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="w-full">
          {isLoading ? (
            <div className="flex justify-center py-12 w-full">
              <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedCandidates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
              {displayedCandidates.map((candidate, i) => (
                <CandidateCard key={candidate.id} candidate={candidate} rank={i + 1} />
              ))}
            </div>
          ) : (
            // FIX : ajout de w-full pour contrer le bug de rendu unilatéral
            <div className="bg-[#0b0b0b]/40 border border-[#d4af37]/10 rounded-2xl py-12 px-6 flex flex-col items-center justify-center w-full text-center">
              <Star className="w-6 h-6 text-neutral-700 mb-2" />
              <p className="text-neutral-400 text-sm font-medium">Aucun candidat actif pour le moment.</p>
              <p className="text-neutral-500 text-xs mt-1">Les profils d'artistes sont en cours de validation administrative.</p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          7. CTA FINAL — Chaque Vote Compte (FOND PREMIUM OR ET NOIR)
          ===================================================================== */}
      <section className="relative w-full bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05)_0%,transparent_70%),#0b0b0b] border-y border-[#d4af37]/10 py-20 px-6 my-12 text-center">
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <Star className="w-8 h-8 text-[#d4af37] mb-4 fill-[#d4af37]/10" />
          <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] uppercase">
            Chaque Vote Compte
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
            Pour seulement <span className="text-[#d4af37] font-bold">100 FCFA</span>, propulsez votre artiste préféré vers la
            victoire. Un geste simple, un impact immense.
          </p>
          <div className="mt-8">
            <a
              href="#candidates"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
            >
              Voter Maintenant
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. RÈGLEMENT
          ===================================================================== */}
      <section id="rules" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="mb-12 text-center">
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] block mb-2">
            Conditions
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] uppercase">
            Règlement du Concours
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0b0b0b]/40 border border-[#d4af37]/10 p-8 rounded-2xl hover:border-[#d4af37]/40 transition-colors">
            <h3 className="text-xl font-bold text-white mb-4 font-heading">1. Inscription</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Les candidats doivent créer leur compte et soumettre une vidéo de prestation de 1 à 3 minutes. Le profil sera validé par notre équipe avant d'être public.
            </p>
          </div>
          <div className="bg-[#0b0b0b]/40 border border-[#d4af37]/10 p-8 rounded-2xl hover:border-[#d4af37]/40 transition-colors">
            <h3 className="text-xl font-bold text-white mb-4 font-heading">2. Les Votes</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Les votes sont ouverts au public via Mobile Money (100 FCFA/vote). Un candidat peut recevoir un nombre illimité de votes pour se hisser au sommet.
            </p>
          </div>
          <div className="bg-[#0b0b0b]/40 border border-[#d4af37]/10 p-8 rounded-2xl hover:border-[#d4af37]/40 transition-colors">
            <h3 className="text-xl font-bold text-white mb-4 font-heading">3. Sélections</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Les meilleurs de chaque catégorie participeront aux auditions live diffusées sur nos réseaux et partenaires. Seuls les plus talentueux iront en finale.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. CONTACTS
          ===================================================================== */}
      <section id="contacts" className="py-20 px-6 max-w-4xl mx-auto w-full text-center border-t border-[#d4af37]/5">
        <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] block mb-2">
          Nous Joindre
        </span>
        <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] uppercase mb-12">
          Contacts & Support
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16">
          <div className="flex flex-col items-center group">
            <div className="w-16 h-16 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-[#d4af37]" />
            </div>
            <p className="text-white font-bold text-lg mb-1">677 103 475 / 698 900 627</p>
            <p className="text-neutral-500 text-sm">Support Téléphone & WhatsApp</p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="w-16 h-16 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-[#d4af37]" />
            </div>
            <p className="text-white font-bold text-lg mb-1">contact@mboanextstar.com</p>
            <p className="text-neutral-500 text-sm">Partenariats & Presse</p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. BANDE SPONSORS BAS
          ===================================================================== */}
      <div id="partners" className="w-full bg-neutral-950 border-t border-neutral-900 py-5">
        <SponsorMarquee />
      </div>
    </div>
  );
};

export default Home;