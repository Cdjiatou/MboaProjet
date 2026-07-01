import { motion } from 'framer-motion';
import { useLanguageStore } from '@/i18n/useLanguageStore';

export const LanguageSwitcher = () => {
  const { lang, toggleLang } = useLanguageStore();

  return (
    <button
      onClick={toggleLang}
      className="group relative flex items-center gap-2 px-3 py-1.5 bg-[#050505] border border-white/10 hover:border-[#d4af37]/50 rounded-full transition-all duration-300 overflow-hidden"
      aria-label="Changer de langue / Change language"
    >
      {/* Fond interactif */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/10 to-[#d4af37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Indicateur de langue actif */}
      <motion.div
        layout
        className="flex items-center gap-2 relative z-10"
        initial={false}
      >
        <span className="text-[10px] font-black tracking-widest text-[#d4af37] uppercase">
          {lang}
        </span>
        <div className="w-[18px] h-[18px] rounded-full overflow-hidden border border-white/10 shrink-0">
          <img
            src={lang === 'fr' 
              ? "https://flagcdn.com/w40/fr.png" 
              : "https://flagcdn.com/w40/gb.png"}
            alt={lang === 'fr' ? 'Français' : 'English'}
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
    </button>
  );
};
