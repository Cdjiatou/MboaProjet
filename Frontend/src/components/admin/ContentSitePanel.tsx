import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, LayoutGrid, Mail, Layers, Megaphone, Users } from 'lucide-react';
import { SponsorsManager } from './SponsorsManager';
import { VideosManager } from './VideosManager';
import { CarouselManager } from './CarouselManager';
import { ContactManager } from './ContactManager';
import { BannerManager } from './BannerManager';
import { JuryManager } from './JuryManager';

type ContentModule = 'sponsors' | 'banner' | 'videos' | 'carousel' | 'contacts' | 'jury';

const MODULES: { key: ContentModule; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'sponsors', label: 'Sponsors', icon: ImageIcon, desc: 'Logos & Partenaires' },
  { key: 'banner', label: 'Bannière', icon: Megaphone, desc: "Bannière d'accueil" },
  { key: 'videos', label: 'Vidéos', icon: Video, desc: 'Médias & URLs' },
  { key: 'carousel', label: 'Carrousel', icon: LayoutGrid, desc: "Bannières d'accueil" },
  { key: 'contacts', label: 'Contacts', icon: Mail, desc: 'Informations de contact' },
  { key: 'jury', label: 'Jury', icon: Users, desc: 'Membres du jury' },
];

const COMPONENTS: Record<ContentModule, React.ReactElement> = {
  sponsors: <SponsorsManager />,
  banner: <BannerManager />,
  videos: <VideosManager />,
  carousel: <CarouselManager />,
  contacts: <ContactManager />,
  jury: <JuryManager />,
};

export const ContentSitePanel = () => {
  const [activeModule, setActiveModule] = useState<ContentModule>('sponsors');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-gradient-to-br from-white/[0.02] to-transparent p-6 sm:p-7">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d4af37]/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Studio de Contenu</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Configuration du Site
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-lg">
            Gérez les sponsors, vidéos, bannières et informations de contact de votre vitrine.
          </p>
        </div>
      </div>

      {/* Navigation horizontale (scroll fluide sur mobile) */}
      <div className="relative">
        {/* Masques de dégradé pour indiquer le scroll */}
        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none sm:hidden" />
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none sm:hidden" />

        <nav
          className="flex gap-2.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.key;
            return (
              <button
                key={mod.key}
                onClick={() => setActiveModule(mod.key)}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl shrink-0 sm:flex-1
                  transition-all duration-250 outline-none border group text-left
                  ${isActive
                    ? 'bg-white/5 border-white/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.05] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] hover:border-white/[0.09]'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeModuleCard"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none"
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}
                <div className={`p-2 rounded-lg transition-all border ${
                  isActive
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.03] border-white/[0.03] group-hover:bg-white/[0.06]'
                }`}>
                  <mod.icon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-tight">{mod.label}</p>
                  <p className={`text-[10px] ${isActive ? 'text-neutral-300' : 'text-neutral-600'}`}>{mod.desc}</p>
                </div>
                <span className="sm:hidden text-xs font-semibold">{mod.label}</span>

                {/* Indicateur de sélection */}
                {isActive && (
                  <motion.div
                    layoutId="activeLine"
                    className="absolute bottom-0 inset-x-3 h-0.5 bg-white rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Zone d'affichage du module actif */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {COMPONENTS[activeModule]}
        </motion.div>
      </AnimatePresence>

    </div>
  );
};