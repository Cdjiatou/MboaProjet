import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Play } from 'lucide-react';

const FOOTER_ADS = [
  {
    id: 'ad-1',
    company: 'MBOA Vidéo',
    title: 'Vidéo Exclusive Partenaire',
    description: 'Découvrez en exclusivité les images inédites de nos partenaires et soutenez la culture urbaine.',
    videoUrl: 'https://drive.google.com/file/d/1uLjYSEaiWUKPcpeGmoQWeOBhpQCqPlXO/preview',
    thumbnail: '/images/categories/chant.jpg',
    ctaText: 'Soutenir',
    link: '#',
    bgColor: 'from-[#d4af37]/30 to-black',
    accentColor: '#d4af37'
  },
  {
    id: 'ad-2',
    company: 'MBOA Auditions',
    title: 'Auditions Douala — Les meilleurs moments',
    description: 'Revivez les temps forts des auditions de Douala. Laissez-vous surprendre par les talents bruts.',
    youtubeId: 'jNQXAC9IVRw',
    thumbnail: 'https://drive.google.com/file/d/1yZv-cLavdwz9tYjo5XY00BtdBPESCH8e/view?usp=sharing',
    ctaText: 'Découvrir',
    link: '#',
    bgColor: 'from-[#ff3333]/20 to-black',
    accentColor: '#ff3333'
  },
  {
    id: 'ad-3',
    company: 'MBOA TRAP',
    title: 'Danse d\'abord (Clip officiel)',
    description: 'Le hit incontournable propulsé par nos partenaires officiels. Écoutez, vibrez, partagez.',
    youtubeId: 'RgKAFK5djSk',
    thumbnail: 'https://drive.google.com/file/d/1uXHE8vnLXwInwVnArPtikUX75BfX38NY/view?usp=sharing',
    ctaText: 'Partager',
    link: '#',
    bgColor: 'from-[#3388ff]/20 to-black',
    accentColor: '#3388ff'
  }
];

export const FooterAdBanner = () => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Rotation automatique toutes les 8 secondes (stoppée si une vidéo est en lecture)
  useEffect(() => {
    if (!isVisible || isVideoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % FOOTER_ADS.length);
    }, 8000);
    
    return () => clearInterval(timer);
  }, [isVisible, isVideoPlaying]);

  // Si l'utilisateur change manuellement ou ferme, on arrête la vidéo
  const handleClose = () => {
    setIsVisible(false);
    setIsVideoPlaying(false);
  };

  if (!isVisible) return null;

  const currentAd = FOOTER_ADS[currentAdIndex];

  return (
    <div className="w-full bg-neutral-950 border-t border-b border-neutral-900 py-4 sm:py-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Label Publicité / Contrôles */}
        <div className="flex justify-between items-center mb-3 sm:mb-0 sm:absolute sm:top-0 sm:right-8 sm:h-full z-30 pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold bg-neutral-900/50 px-2 py-0.5 rounded border border-neutral-800 backdrop-blur-sm">
            Espace Vidéo / Publicité
          </span>
          <button 
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors pointer-events-auto sm:absolute sm:-top-3 sm:-right-4"
            aria-label="Fermer la publicité"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Indicateurs de progression rapides */}
        <div className="absolute -top-3 sm:-top-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {FOOTER_ADS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentAdIndex(idx);
                setIsVideoPlaying(false);
              }}
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentAdIndex ? 'w-6 bg-[#d4af37]' : 'w-2 bg-neutral-800 hover:bg-neutral-600'}`}
            />
          ))}
        </div>

        {/* Contenu de la publicité */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/50 group flex flex-col md:flex-row min-h-[160px] md:h-[220px]"
          >
            {/* Background dynamique */}
            <div className={`absolute inset-0 bg-gradient-to-r ${currentAd.bgColor} opacity-20 pointer-events-none`} />
            
            {/* Colonne Gauche : Vidéo */}
            <div className="w-full md:w-[40%] shrink-0 h-[200px] md:h-full relative bg-black border-b md:border-b-0 md:border-r border-white/10 overflow-hidden z-20">
              {isVideoPlaying ? (
                <iframe
                  src={currentAd.videoUrl || `https://www.youtube.com/embed/${currentAd.youtubeId}?autoplay=1&rel=0`}
                  title={currentAd.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              ) : (
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="w-full h-full relative cursor-pointer block"
                >
                  <img
                    src={currentAd.thumbnail}
                    alt={currentAd.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#d4af37]/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Colonne Droite : Texte & CTA */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center relative z-10">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider mb-2 block drop-shadow-md"
                style={{ color: currentAd.accentColor }}
              >
                {currentAd.company}
              </span>
              <h4 className="text-white font-bold text-xl sm:text-2xl mb-2.5 leading-tight pr-4">
                {currentAd.title}
              </h4>
              <p className="text-neutral-400 text-sm max-w-xl mb-6">
                {currentAd.description}
              </p>

              <div className="mt-auto">
                <a 
                  href={currentAd.link}
                  className="inline-flex px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide text-black items-center gap-2 transition-transform hover:scale-105 shadow-lg"
                  style={{ backgroundColor: currentAd.accentColor }}
                >
                  {currentAd.ctaText}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

export default FooterAdBanner;
