import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Star, ChevronDown } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { LanguageSwitcher } from './LanguageSwitcher';

// =============================================================================
// CONFIGURATION & LIENS
// =============================================================================
// Liens principaux directement visibles sur Desktop
const MAIN_NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Candidats', href: '/candidats' },
  { label: 'Classement', href: '/classement' },
  { label: 'Catégories', href: '/categories' },
  { label: 'Contacts', href: '/contact' },
];

// Liens secondaires regroupés sous le menu déroulant "Plus"
const DROPDOWN_LINKS = [
  { label: 'À Propos', href: '/about' },
  { label: 'Règlement', href: '/reglement' },
  { label: 'Partenaires', href: '/partners' },
];

// Liste complète utilisée uniquement pour le menu Mobile
const ALL_MOBILE_LINKS = [...MAIN_NAV_LINKS.slice(0, 4), ...DROPDOWN_LINKS, MAIN_NAV_LINKS[4]];

// =============================================================================
// SOUS-COMPOSANTS ISOLÉS
// =============================================================================

const Logo = ({ url }: { url: string | null }) => (
  <Link to="/" className="flex items-center gap-2 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-lg">
    {url ? (
      <img src={url} alt="MBOA NEXT STAR" className="h-16 sm:h-20 w-auto object-contain scale-[1.1] origin-left" />
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
);

const CtaButton = ({ isMobile = false, onClick }: { isMobile?: boolean; onClick?: () => void }) => {
  const containerStyles = isMobile
    ? "group relative px-4 py-3.5 bg-[#050505] border border-[#d4af37]/40 rounded-xl flex items-center justify-center gap-3 overflow-hidden transition-all duration-300 hover:border-[#d4af37]"
    : "group relative px-5 py-2.5 bg-[#050505] border border-[#d4af37]/40 rounded-full flex items-center gap-2.5 overflow-hidden transition-all duration-500 hover:border-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]";

  const textStyles = isMobile
    ? "text-xs font-black text-[#d4af37] uppercase tracking-wider relative z-10"
    : "relative text-[10px] font-black text-[#d4af37] uppercase tracking-widest group-hover:text-white transition-colors duration-500";

  return (
    <Link to="/verify-profile" onClick={onClick} className={containerStyles}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/10 to-[#d4af37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
      <span className={textStyles}>Espace Candidat</span>
    </Link>
  );
};

// Menu Mobile extrait pour éviter les re-rendus du Header lors de son ouverture
const MobileMenu = ({ isOpen, onClose, checkActive }: { isOpen: boolean; onClose: () => void; checkActive: (href: string) => boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="lg:hidden bg-[#0b0b0b]/95 backdrop-blur-md border-t border-white/5 absolute top-full left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <nav className="px-6 py-6 flex flex-col gap-3">
          <div className="flex justify-end mb-2">
            <LanguageSwitcher />
          </div>
          {ALL_MOBILE_LINKS.map((link) => {
            const isActive = checkActive(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
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
          <div className="w-full h-px bg-white/10 my-1" />
          <CtaButton isMobile onClick={onClose} />
        </nav>
      </motion.div>
    )}
  </AnimatePresence>
);

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  
  const assets = useThemeStore((state) => state.assets);
  const logoUrl = assets?.logo_url || assets?.site_logo || null;
  const currentPath = location.pathname + location.hash;

  // Debug log pour vérifier la valeur du logo
  useEffect(() => {
    console.log('🎨 Logo Debug - Header:', {
      'assets': assets,
      'logo_url': assets?.logo_url,
      'site_logo': assets?.site_logo,
      'logoUrl utilisé': logoUrl
    });
  }, [assets, logoUrl]);

  const checkActive = (href: string) => currentPath === href || (href === '/' && currentPath === '');
  const isDropdownActive = DROPDOWN_LINKS.some(link => checkActive(link.href));

  // Fermeture des menus au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermeture des menus si la taille de l'écran change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0b]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          <Logo url={logoUrl} />

          {/* NAVIGATION DESKTOP */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 justify-end flex-1">
            <nav className="flex items-center gap-5 xl:gap-6">
              {MAIN_NAV_LINKS.map((link) => {
                const isActive = checkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative py-2 text-sm font-medium tracking-wide transition-colors duration-300 ${
                      isActive ? 'text-[#d4af37]' : 'text-neutral-300 hover:text-white'
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

              {/* MENU DÉROULANT DESKTOP (PLUS) */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 py-2 text-sm font-medium tracking-wide transition-colors duration-300 focus:outline-none ${
                    isDropdownActive ? 'text-[#d4af37]' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Plus
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-[#0b0b0b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl"
                    >
                      {DROPDOWN_LINKS.map((link) => {
                        const isActive = checkActive(link.href);
                        return (
                          <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setIsDropdownOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`block px-4 py-2.5 text-sm transition-colors ${
                              isActive ? 'text-[#d4af37] bg-white/5' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
            
            <div className="h-6 w-px bg-white/10 mx-2" />
            <LanguageSwitcher />
            <div className="h-6 w-px bg-white/10 mx-2" />
            <CtaButton />
          </div>

          {/* BOUTON MENU MOBILE */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-lg"
            aria-label="Menu de navigation"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MENU DÉROULANT MOBILE */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} checkActive={checkActive} />
    </header>
  );
};

export default Header;