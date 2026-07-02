// =============================================================================
// PAGE D'ACCUEIL — MBOA NEXT STAR (Corrigée & Alignée sur la charte Premium)
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Phone, Mail, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { CandidateCard } from '@/components/candidate/CandidateCard';
import SponsorMarquee from '@/components/shared/SponsorMarquee';
import ReactPlayer from 'react-player';

import PerformancesSection from '@/components/home/PerformancesSection';
import { usePublicCandidates } from '@/hooks/usePublicCandidates';
import { useThemeStore } from '@/store/useThemeStore';
import { resolvePublicSponsors } from '@/utils/sponsors';
import { getMediaUrl } from '@/utils/mediaUrl';
import { VoteModal } from '@/components/candidate/VoteModal';
import type { Candidate } from '@/types';

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

// const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
//   chant: Mic,
//   chanson: Mic,
//   danse: Music,
//   humour: Laugh,
//   comedie: Laugh,
//   'miss&master': Crown,
//   miss: Crown,
//   dj: Disc,
//   magie: Star,
// };

// const CATEGORY_DESCRIPTIONS: Record<string, string> = {
//   chant: "Les voix qui font vibrer l'Afrique",
//   chanson: "Les voix qui font vibrer l'Afrique",
//   danse: 'Le rythme dans le sang',
//   humour: 'Le rire est universel',
//   comedie: 'Le rire est universel',
//   'miss&master': 'Élégance et charisme',
//   miss: 'Élégance et charisme',
//   dj: 'Les maîtres des platines',
//   magie: 'L\'art de l\'impossible',
// };

// const getCategoryIcon = (slug: string | null): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
//   if (!slug) return Star;
//   const normalizedSlug = slug.toLowerCase().replace(/[-_\s]/g, '');
//   for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
//     if (normalizedSlug.includes(key)) return icon;
//   }
//   return Star;
// };

// const getCategoryDescription = (slug: string | null): string => {
//   if (!slug) return 'Découvrir les talents';
//   const normalizedSlug = slug.toLowerCase().replace(/[-_\s]/g, '');
//   for (const [key, desc] of Object.entries(CATEGORY_DESCRIPTIONS)) {
//     if (normalizedSlug.includes(key)) return desc;
//   }
//   return 'Découvrir les talents';
// };

// const CATEGORY_IMAGES: Record<string, string> = {
//   dj: '/images/categories/deejay.jpg',
//   deejay: '/images/categories/deejay.jpg',
//   miss: '/images/categories/miss.jpg',
//   master: '/images/categories/miss.jpg',
//   'miss&master': '/images/categories/miss.jpg',
//   chant: '/images/categories/chant.jpg',
//   chanson: '/images/categories/chant.jpg',
//   danse: '/images/categories/danse.png',
//   humour: '/images/categories/comedie.png',
//   comedie: '/images/categories/comedie.png',
//   magie: '/images/categories/magie.png',
// };

// const getCategoryBackgroundImage = (cat: Category): string | null => {
//   const textToMatch = `${cat.slug || ''} ${cat.name || ''}`.toLowerCase().replace(/[-_\s]/g, '');
//   for (const [key, img] of Object.entries(CATEGORY_IMAGES)) {
//     if (textToMatch.includes(key)) return img;
//   }
//   return null;
// };

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getFacebookVideoId(url: string): string | null {
  if (!url) return null;
  
  // Nettoyer l'URL (supprimer les espaces et les paramètres inutiles)
  const cleanUrl = url.trim();
  
  // Patterns Facebook : fb.watch, facebook.com/watch, facebook.com/videos, facebook.com/share
  const patterns = [
    /facebook\.com\/watch\/?\?v=(\d+)/,           // facebook.com/watch?v=123456
    /facebook\.com\/.*\/videos\/(\d+)/,           // facebook.com/username/videos/123456
    /fb\.watch\/([^/?]+)/,                        // fb.watch/abc123
    /facebook\.com\/video\.php\?v=(\d+)/,         // facebook.com/video.php?v=123456
    /facebook\.com\/share\/v\/([^/?]+)/,          // facebook.com/share/v/abc123 (nouveau format)
    /facebook\.com\/reel\/(\d+)/,                 // facebook.com/reel/123456
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      console.log('[Home] Facebook video ID détecté:', match[1], 'depuis URL:', cleanUrl);
      return match[1];
    }
  }
  
  // Si aucun pattern ne matche, retourner l'URL complète pour utilisation directe
  console.log('[Home] Aucun ID Facebook extrait, utilisation de l\'URL complète:', cleanUrl);
  return cleanUrl;
}

const Home = () => {
  const { candidates: allCandidates } = usePublicCandidates(15000);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  const [voteCandidate, setVoteCandidate] = useState<Candidate | null>(null);

  const assets = useThemeStore((state) => state.assets);
  const sponsors = resolvePublicSponsors(assets?.sponsors);

  const heroImages: string[] = (() => {
    const DEFAULT_IMAGES = [
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/e4c4da7ff_WhatsAppImage2026-06-24at122312.jpg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/ef6237930_WhatsAppImage2026-06-24at122313.jpg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/65bd1e076_WhatsAppImage2026-06-24at122314.jpeg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/cca43cfe1_WhatsAppImage2026-06-24at122315.jpg",
      "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/9f593dbde_WhatsAppImage2026-06-24at122316.jpg",
    ];

    try {
      if (assets.hero_images) {
        const parsed = JSON.parse(assets.hero_images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filtrer les images vides et retourner toutes les images valides
          const validImages = parsed.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
          if (validImages.length > 0) {
            return validImages;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing hero_images', e);
    }

    // Fallback complet : anciens champs individuels ou images par défaut
    const fromAssets = [
      assets.hero_image_1,
      assets.hero_image_2,
      assets.hero_image_3,
      assets.hero_image_4,
      assets.hero_image_5,
    ].filter((img): img is string => typeof img === 'string' && img.length > 0);
    
    return fromAssets.length > 0 ? fromAssets : DEFAULT_IMAGES;
  })();

  // Précharger les images du carousel pour éviter le flou
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = heroImages.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = () => {
            console.warn('Échec préchargement:', src);
            resolve(null); // Continue même si une image échoue
          };
          // Convertir les chemins relatifs en chemins absolus
          img.src = src.startsWith('/uploads/') 
            ? `${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')}${src}`
            : src;
        });
      });

      await Promise.all(imagePromises);
      setImagesLoaded(true);
    };

    preloadImages();
  }, [heroImages]);

  const videos: {title: string, url: string}[] = (() => {
    try {
      if (assets.videos) {
        const parsed = JSON.parse(assets.videos);
        console.log('[Home] Vidéos chargées depuis assets:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('[Home] Error parsing videos', e);
    }
    return [];
  })();

  const youtubeChannel = assets.youtube_channel || 'https://youtube.com/@mboanextstar237';

  const heroLiveBadge = assets.hero_live_badge || "Saison 2026 — Du 07 Juillet au 28 Août";
  const rawTitle = assets.hero_title || "La Prochaine\nStar C'est Toi";
  const heroTitle = rawTitle.replace(/PROCHAINESTAR/ig, 'PROCHAINE STAR');
  const heroDesc = assets.hero_desc || "Découvrez les talents qui façonneront la culture africaine. Votez, soutenez, et propulsez vos artistes préférés vers les étoiles.";

  const statsList = (() => {
    try {
      if (assets.home_stats) {
        const parsed = JSON.parse(assets.home_stats);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error parsing home_stats', e);
    }
    return STATS;
  })();

  const homeAboutTitle = assets.home_about_title || "Découvrez le concept de MBOA NEXT STAR";
  const homeAboutParagraphs = (() => {
    try {
      if (assets.home_about_text) {
        const parsed = JSON.parse(assets.home_about_text);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error parsing home_about_text', e);
    }
    return [
      "MBOA NEXT STAR est le plus grand concours national de talents urbains du Cameroun. Musique, humour, danse, DJ, Miss & Master : découvrez les étoiles de demain à travers des auditions, compétitions, contenus exclusifs et événements live.",
      "Une initiative portée par La Légende Vivante Tony Nobody pour révéler, former et propulser de nouveaux talents camerounais vers les scènes nationales et internationales.",
      "Abonnez-vous et vivez l'aventure MBOA NEXT STAR 2026-2027 ! 🚀🔥"
    ];
  })();

  const nextSlide = useCallback(() => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroImages.length);
  }, [heroImages.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const topFavorites = allCandidates.slice(0, 3);
  // const displayedCandidates = allCandidates.slice(0, 6);

  return (
    // FIX CONTENEUR PARENT : block width full pour empêcher l'écrasement latéral
    <div className="block w-full min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black">

      {/* =====================================================================
          1. HERO SECTION
          ===================================================================== */}
      <section className="relative w-full h-dvh min-h-[750px] flex items-center justify-center overflow-hidden">
        {/* Container d'image avec effet de zoom et de flou minimal */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHeroSlide}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {(() => {
                const currentSrc = heroImages[currentHeroSlide];
                const isVideo = currentSrc && (currentSrc.toLowerCase().endsWith('.mp4') || currentSrc.toLowerCase().endsWith('.webm') || currentSrc.toLowerCase().endsWith('.mov'));
                const resolvedSrc = currentSrc?.startsWith('/uploads/')
                  ? `${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')}${currentSrc}`
                  : currentSrc;

                if (isVideo) {
                  return (
                    <video
                      src={resolvedSrc}
                      autoPlay
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      style={{ filter: 'brightness(0.7) contrast(1.05)' }}
                      // Note: 'muted' n'est pas défini ici à la demande de l'utilisateur,
                      // mais les navigateurs bloqueront probablement l'autoplay.
                    />
                  );
                }

                return (
                  <img
                    src={resolvedSrc}
                    alt={`MBOA NEXT STAR Slide ${currentHeroSlide + 1}`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    style={{
                      imageRendering: 'crisp-edges',
                      filter: 'brightness(0.7) contrast(1.05)',
                    }}
                    loading="eager"
                    onError={(e) => {
                      console.error('Erreur de chargement image carousel:', currentSrc);
                      (e.target as HTMLImageElement).src = 'https://placehold.co/1920x1080/0a0a0a/666666?text=MBOA+NEXT+STAR';
                    }}
                  />
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Overlays : Gradient pour lisibilité sans trop de lumière */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/50 to-[#050505] z-[1]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center mt-2 sm:mt-0 -translate-y-6 sm:-translate-y-12">
          
          {/* Badge Saison */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
            </span>
            <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">{heroLiveBadge}</span>
          </motion.div>

          {/* Titre Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-7xl lg:text-[6rem] font-black uppercase leading-[1.05] font-heading tracking-[-0.03em] drop-shadow-2xl whitespace-pre-wrap"
          >
            {(() => {
              const parts = heroTitle.split('\n');
              // Colorize specific words: La, Star in gold
              const colorizeWords = (text: string) => {
                return text.split(/\b/).map((word, i) => {
                  const lower = word.toLowerCase().trim();
                  if (lower === 'la' || lower === 'star') {
                    return <span key={i} className="text-[#d4af37]">{word}</span>;
                  }
                  return <span key={i} className="text-white">{word}</span>;
                });
              };
              return (
                <>
                  <span>{colorizeWords(parts[0])}</span>
                  {parts[1] && (
                    <>
                      <br />
                      <span>{colorizeWords(parts[1])}</span>
                    </>
                  )}
                </>
              );
            })()}
          </motion.h1>

          {/* Paragraphe de description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 sm:mt-10 text-neutral-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg"
          >
            {heroDesc}
          </motion.p>

          {/* Boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
          >
            <a
              href="#candidates"
              className="px-8 py-4 bg-[#d4af37] text-black text-[13px] font-black uppercase tracking-widest rounded-xl hover:bg-[#b8952e] transition-colors flex items-center justify-center gap-3"
            >
              Découvrir les Candidats
              <ChevronRight className="w-4 h-4" />
            </a>
            <Link
              to="/about"
              className="px-8 py-4 border border-white/20 bg-white/5 backdrop-blur-sm text-white text-[13px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              En savoir plus
            </Link>
          </motion.div>
        </div>

        {/* Sponsor overlay on Carousel */}
        {sponsors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 left-0 right-0 z-10 px-6 block"
          >
            <div className="max-w-4xl mx-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl py-5 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#d4af37]/50"></div>
                <p className="text-center text-[10px] sm:text-xs text-[#d4af37] font-black uppercase tracking-[0.3em]">
                  Avec le soutien de
                </p>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#d4af37]/50"></div>
              </div>
              
              {/* Marquee horizontal défilant */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white/5 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/5 to-transparent z-10 pointer-events-none" />
                <div className="flex items-center gap-12 animate-[sponsorScroll_20s_linear_infinite] hover:[animation-play-state:paused] w-max">
                  {[...sponsors, ...sponsors, ...sponsors].map((sponsor, idx) => (
                    <div key={idx} className="h-12 sm:h-16 flex items-center justify-center shrink-0">
                      {sponsor.image ? (
                        <img 
                          src={getMediaUrl(sponsor.image)} 
                          alt={sponsor.name} 
                          className="h-full w-auto max-w-[140px] sm:max-w-[180px] object-contain drop-shadow-lg" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.innerHTML = `
                              <span class="text-white text-sm font-bold tracking-[0.15em] uppercase whitespace-nowrap">${sponsor.name}</span>
                            `;
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45 shrink-0" />
                          <span className="text-white text-sm font-bold tracking-[0.15em] uppercase whitespace-nowrap">
                            {sponsor.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Indicateurs de Slide modifiés */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
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
          4. SECTION STATS (Ajusté pour être centré et fluide sur mobile)
          ===================================================================== */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsList.map((stat: any) => (
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
          5. SECTION TALENTS EN SCÈNE (Vidéos prestations)
          ===================================================================== */}
      <div id="candidates" className="w-full bg-[#050505] border-y border-white/[0.04]">
        <PerformancesSection />
      </div>

      {/* =====================================================================
          6. À PROPOS
          ===================================================================== */}
      <section id="about" className="py-20 px-6 max-w-4xl mx-auto w-full text-center">
        <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] block mb-3">
          À propos
        </span>
        <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] mb-6 text-white uppercase whitespace-pre-line">
          {homeAboutTitle}
        </h2>
        <div className="space-y-6 text-neutral-400 text-sm sm:text-base leading-relaxed">
          {homeAboutParagraphs.map((para: string, idx: number) => (
            <p key={idx} className={idx === homeAboutParagraphs.length - 1 ? "text-white font-bold uppercase tracking-wider text-xs pt-2" : ""}>
              {para}
            </p>
          ))}
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
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                rank={i + 1} 
                onVoteClick={(c) => setVoteCandidate(c)}
              />
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          5b. LE JURY — Membres du jury officiel
          ===================================================================== */}
      <section className="py-28 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-4">
              <span className="w-8 h-px bg-[#d4af37]/60" />
              Les décideurs
              <span className="w-8 h-px bg-[#d4af37]/60" />
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-[-0.03em] uppercase mt-3">
              Le <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f5e6b8] to-[#d4af37]">Jury</span>
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
              Des personnalités influentes de la scène musicale camerounaise pour évaluer les talents
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {[
            { name: 'Phillbill', title: 'Producteur Musical', initials: 'PB' },
            { name: 'Maalhox', title: 'Artiste / Rappeur', initials: 'MH' },
            { name: 'Tzy Panchak', title: 'Artiste International', initials: 'TP' },
            { name: 'Stanley Enow', title: 'Rappeur / Producteur', initials: 'SE' },
            { name: 'Tony Nobody', title: 'Fondateur & Légende', initials: 'TN' },
          ].map((juror, index) => (
            <motion.div
              key={juror.name}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex flex-col items-center text-center"
            >
              {/* Avatar circulaire avec glow doré */}
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 blur-xl scale-0 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#1a1610] to-[#0d0b08] border-2 border-[#d4af37]/20 group-hover:border-[#d4af37]/60 transition-all duration-500 flex items-center justify-center shadow-[0_0_0_4px_rgba(5,5,5,1)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                  <span className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                    {juror.initials}
                  </span>
                </div>
                {/* Badge étoile */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#d4af37] flex items-center justify-center shadow-lg border-2 border-[#050505]">
                  <Star className="w-3.5 h-3.5 text-black fill-black" />
                </div>
              </div>

              <h3 className="text-white font-bold text-sm sm:text-base uppercase tracking-wider group-hover:text-[#d4af37] transition-colors duration-300">
                {juror.name}
              </h3>
              <p className="text-neutral-500 text-[11px] sm:text-xs mt-1 uppercase tracking-widest">
                {juror.title}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          5c. MBOA NEXT STAR TV — Vidéos promotionnelles (Dynamique)
          ===================================================================== */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-[#d4af37]/10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-4">
              <span className="w-8 h-px bg-[#d4af37]/60" />
              Contenus exclusifs
              <span className="w-8 h-px bg-[#d4af37]/60" />
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-[-0.03em] uppercase mt-3">
              Mboa Next Star <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f5e6b8] to-[#d4af37]">TV</span>
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
              Suivez les coulisses, les prestations et les moments forts du concours
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(() => {
            const list = [...videos];
            const defaultPlaceholders = [
              { title: 'Bande-annonce MBOA NEXT STAR 2026', url: '' },
              { title: 'Les coulisses des auditions', url: '' },
              { title: 'Moments forts — Saison 2026', url: '' },
            ];
            while (list.length < 3) {
              list.push(defaultPlaceholders[list.length]);
            }
            return list.slice(0, 6);
          })().map((video, index) => {
            const hasVideo = !!video.url;
            const ytId = hasVideo ? getYouTubeId(video.url) : null;
            const fbId = hasVideo ? getFacebookVideoId(video.url) : null;
            const isDirectVideo = hasVideo && (video.url.startsWith('/uploads/') || video.url.includes('cloudinary.com'));
            const isYouTubeVideo = hasVideo && ytId;
            const isFacebookVideo = hasVideo && !isYouTubeVideo && !isDirectVideo && (
              video.url.includes('facebook.com') || 
              video.url.includes('fb.watch') ||
              fbId !== null
            );

            const videoUrl = hasVideo && video.url.startsWith('/uploads/')
              ? `${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')}${video.url}`
              : video.url;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative rounded-2xl overflow-hidden bg-[#0b0b0b] border border-white/5 transition-all duration-500 shadow-lg" style={{ aspectRatio: '16/9', minHeight: '200px' }}
              >


                <div className="absolute inset-0">
                  {isYouTubeVideo ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    />
                  ) : isFacebookVideo ? (
                    <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
                      <ReactPlayer
                        {...({
                          url: video.url,
                          width: "100%",
                          height: "100%",
                          controls: true,
                          light: false
                        } as any)}
                      />
                    </div>
                  ) : hasVideo && isDirectVideo ? (
                    <div className="w-full h-full relative">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover bg-black"
                        controlsList="nodownload"
                        preload="metadata"
                      />
                      <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <h4 className="text-white font-medium text-sm line-clamp-2 pr-12 text-shadow">
                          {video.title}
                        </h4>
                      </div>
                    </div>
                  ) : (
                    // Placeholder pour vidéos non disponibles
                    <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-black border border-white/5">
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/5 border-2 border-white/10">
                          <svg className="w-6 h-6 text-neutral-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        
                        <h3 className="text-white text-sm sm:text-base font-bold uppercase tracking-wider line-clamp-2 px-4 mb-2 opacity-70">
                          {video.title}
                        </h3>
                        
                        <div className="px-3 py-1 bg-neutral-800 rounded-full border border-white/10">
                          <p className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold">
                            Bientôt disponible
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bouton CTA Chaîne YouTube */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 flex flex-col items-center justify-center"
        >
          <a
            href="https://youtube.com/@mboanextstar237?si=815Ala4cymOaZgPh"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#0a0a0a] border border-red-500/30 hover:border-red-500 transition-all duration-500 shadow-lg hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icône Play YouTube */}
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-600 text-white shadow-md group-hover:scale-110 transition-transform duration-500">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            
            <div className="relative flex flex-col text-left">
              <span className="text-neutral-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5">Plus de contenus exclusifs</span>
              <span className="text-white font-black tracking-wide uppercase text-xs sm:text-sm group-hover:text-red-400 transition-colors duration-300">
                Visitez notre chaîne YouTube
              </span>
            </div>
          </a>
        </motion.div>

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

      {/* Modal de vote pour les candidats sur la page d'accueil */}
      {voteCandidate && (
        <VoteModal
          candidate={voteCandidate}
          isOpen={!!voteCandidate}
          onClose={() => setVoteCandidate(null)}
          onVoteSuccess={() => setVoteCandidate(null)}
        />
      )}
    </div>
  );
};

export default Home;