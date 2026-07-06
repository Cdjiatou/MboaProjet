// =============================================================================
// COMPOSANT Footer — Carousel Vidéos + Pied de page 4 colonnes
// =============================================================================

import { Mail, Phone, MapPin, Send, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'À Propos', href: '/about' },
  { label: 'Règlement', href: '/reglement' },
  { label: 'Catégories', href: '/#categories' },
  { label: 'Contacts', href: '/contact' },
];

// Les vidéos ont été déplacées vers le composant FooterAdBanner.

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const assets = useThemeStore((state) => state.assets);
  const logoUrl = assets.logo_url || assets.site_logo;

  // Debug log pour vérifier la valeur du logo
  console.log('🎨 Logo Debug - Footer:', {
    'assets': assets,
    'logo_url': assets?.logo_url,
    'site_logo': assets?.site_logo,
    'logoUrl utilisé': logoUrl
  });

  return (
    <footer className="w-full bg-[#050505] border-t border-neutral-900 mt-auto">



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
              {assets.footer_desc || "MBOA NEXT STAR est le plus grand concours national de talents urbains du Cameroun. Musique, humour, danse, DJ, Miss & Master : découvrez les étoiles de demain à travers des auditions, compétitions, contenus exclusifs et événements live."}
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
              <div className="w-8 h-px bg-white/10 my-1" />
              <Link
                to="/verify-profile"
                className="text-[#d4af37] font-bold text-xs sm:text-sm hover:text-white transition-colors duration-200 w-fit flex items-center gap-2"
              >
                
                Espace Candidat
              </Link>
            </nav>
          </div>

          {/* Colonne 3 — Contacts */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">
              Contacts
            </h3>
            <div className="flex flex-col gap-3">
              <a href={`mailto:${assets.contact_email || 'contact@mboanextstar.com'}`} className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm hover:text-[#d4af37] transition-colors w-fit">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="truncate">{assets.contact_email || 'contact@mboanextstar.com'}</span>
              </a>
              <a href={`tel:${(assets.contact_phone || '677103475').split('/')[0].trim()}`} className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm hover:text-[#d4af37] transition-colors w-fit">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>{assets.contact_phone || '677 103 475 / 698 900 627'}</span>
              </a>
              <div className="flex items-center gap-3 text-neutral-500 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>{assets.contact_address || "Cinéma L'Éden, Douala"}</span>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={assets.facebook_url || "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href={assets.instagram_url ? (assets.instagram_url.startsWith('http') ? assets.instagram_url : `https://instagram.com/${assets.instagram_url.replace('@', '')}`) : "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a
                href={assets.youtube_channel || "https://youtube.com/@mboanextstar237"}
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