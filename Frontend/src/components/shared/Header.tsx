// =============================================================================
// COMPOSANT Header — Navigation Premium Espacée (Correction du gap)
// =============================================================================

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Star } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Concept', href: '/about' },
  { label: 'Classement', href: '/candidats' },
  { label: 'Catégories', href: '/#categories' },
  { label: 'Partenaires', href: '/partners' },
  { label: 'Contacts', href: '/contact' },
  { label: 'Vérif. Profil', href: '/verify-profile' },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const assets = useThemeStore((state) => state.assets);
  const logoUrl = assets.logo_url || assets.site_logo;

  const currentPath = location.pathname + location.hash;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0b]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* LOGO AREA */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="MBOA NEXT STAR"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            ) : (
              <>
                <Star className="w-5 h-5 text-[#d4af37] fill-[#d4af37] group-hover:-rotate-12 transition-transform duration-300" />
                <span className="text-sm font-black tracking-widest uppercase font-heading tracking-[-0.026em]">
                  <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Mboa</span>
                  <span className="text-white"> Next </span>
                  <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Star</span>
                </span>
              </>
            )}
          </Link>

          {/* NAV LINKS — Remplacement de gap-1 par gap-6 minimum pour aérer le menu */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => {
              const isActive = currentPath === link.href || (link.href === '/' && currentPath === '');
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative py-2 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    isActive ? 'text-[#d4af37]' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavLine"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Menu de navigation"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROP DOWN */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#0b0b0b]/80 backdrop-blur-md border-t border-white/5"
          >
            <nav className="px-6 py-6 flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = currentPath === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'text-[#d4af37] bg-[#d4af37]/5 border border-[#d4af37]/20'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;