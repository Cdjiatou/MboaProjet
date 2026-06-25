// =============================================================================
// COMPOSANT Footer — Carousel Vidéos + Pied de page 4 colonnes
// =============================================================================

import { Mail, Phone, MapPin, Send, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'À Propos', href: '/about' },
  { label: 'Règlement', href: '/#rules' },
  { label: 'Catégories', href: '/#categories' },
  { label: 'Contacts', href: '/contact' },
];

// Vidéos à afficher dans le carousel (à remplacer par des données dynamiques)
const footerVideos = [
  {
    id: '1',
    title: 'MBOA NEXT STAR — Vidéo Exclusive',
    videoUrl: 'https://drive.google.com/file/d/1uLjYSEaiWUKPcpeGmoQWeOBhpQCqPlXO/preview',
    thumbnail: '/images/categories/chant.jpg',
  },
  {
    id: '2',
    title: 'Auditions Douala — Les meilleurs moments',
    youtubeId: 'jNQXAC9IVRw',
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
  },
  {
    id: '3',
    title: 'Tony Nobody — Interview Exclusive',
    youtubeId: '9bZkp7q19f0',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
  },
  {
    id: '4',
    title: 'Finale Yaoundé — Best of',
    youtubeId: 'kJQP7kiw5Fk',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
  },
  {
    id: '5',
    title: 'MBOA TRAP — Danse d\'abord (Clip officiel)',
    youtubeId: 'RgKAFK5djSk',
    thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg',
  },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const assets = useThemeStore((state) => state.assets);
  const logoUrl = assets.logo_url || assets.site_logo;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 320;
    const gap = 16;
    const scrollAmount = cardWidth + gap;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="w-full bg-[#050505] border-t border-neutral-900 mt-auto">

      {/* ================================================================
          SECTION CAROUSEL VIDÉOS
          ================================================================ */}
      <div className="border-b border-neutral-900/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Titre + Contrôles */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[#d4af37] text-[10px] font-bold uppercase tracking-[0.25em] block mb-1">
                Vidéothèque
              </span>
              <h3 className="text-white font-black text-lg sm:text-xl uppercase tracking-wider">
                Nos <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Vidéos</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 transition-all duration-300"
                aria-label="Vidéo précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 transition-all duration-300"
                aria-label="Vidéo suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Carousel horizontal */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {footerVideos.map((video) => (
              <div
                key={video.id}
                className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start group"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 hover:border-[#d4af37]/30 transition-all duration-300">
                  {activeVideo === video.id ? (
                    /* Iframe YouTube ou Google Drive */
                    <iframe
                      src={video.videoUrl || `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    /* Thumbnail + Bouton Play */
                    <button
                      onClick={() => setActiveVideo(video.id)}
                      className="w-full h-full relative cursor-pointer"
                      aria-label={`Lire ${video.title}`}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#d4af37]/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300">
                          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
                {/* Titre vidéo */}
                <p className="mt-2.5 text-neutral-400 text-xs font-medium truncate group-hover:text-white transition-colors px-1">
                  {video.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION PRINCIPALE — 4 COLONNES
          ================================================================ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Colonne 1 — Marque & Description */}
          <div className="flex flex-col space-y-4">
            {logoUrl ? (
              <img src={logoUrl} alt="MBOA NEXT STAR" className="h-10 w-auto object-contain self-start" />
            ) : (
              <span className="text-sm font-black tracking-widest uppercase">
                <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">MBOA NEXT STAR</span>
              </span>
            )}
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed max-w-sm">
              MBOA NEXT STAR est le plus grand concours national de talents urbains du Cameroun. Musique, humour, danse, DJ, Miss & Master : découvrez les étoiles de demain à travers des auditions, compétitions, contenus exclusifs et événements live.
            </p>
          </div>

          {/* Colonne 2 — Navigation */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">
              Navigation
            </h3>
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-neutral-500 text-xs sm:text-sm hover:text-[#d4af37] transition-colors duration-200 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Colonne 3 — Contacts */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">
              Contacts
            </h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:contact@mboanextstar.com" className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm hover:text-[#d4af37] transition-colors w-fit">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">contact@mboanextstar.com</span>
              </a>
              <a href="tel:+237677103475" className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm hover:text-[#d4af37] transition-colors w-fit">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>677 103 475 / 698 900 627</span>
              </a>
              <div className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Cinéma L'Éden, Douala</span>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all"
                aria-label="YouTube"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Colonne 4 — Newsletter */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">
              Newsletter
            </h3>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
              Restez informé des dernières nouvelles du concours.
            </p>
            <div className="flex w-full max-w-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 rounded-l-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#d4af37]/40 transition-colors"
              />
              <button
                onClick={() => setEmail('')}
                className="px-4 bg-[#d4af37] text-neutral-950 rounded-r-xl hover:bg-[#b8952e] transition-all flex items-center justify-center shrink-0"
                aria-label="S'inscrire à la newsletter"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre inférieure — Copyright */}
      <div className="border-t border-neutral-900/60 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-600 text-[11px] text-center sm:text-left">
            © {currentYear} MBOA NEXT STAR — Produit par MOOD & COM. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-neutral-600 text-[11px]">
            <span className="hover:text-neutral-400 transition-colors cursor-pointer">
              Politique de confidentialité
            </span>
            <span className="hover:text-neutral-400 transition-colors cursor-pointer">
              Conditions d'utilisation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;