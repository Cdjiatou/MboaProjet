import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, LayoutGrid, Mail, Layers, Plus, Save } from 'lucide-react';
import { SponsorsManager } from './SponsorsManager';
import { VideosManager } from './VideosManager';
import { CarouselManager } from './CarouselManager';
import { ContactManager } from './ContactManager';

type ContentModule = 'sponsors' | 'videos' | 'carousel' | 'contacts';

const MODULES: { key: ContentModule; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'sponsors', label: 'Sponsors', icon: ImageIcon, desc: 'Logos & Partenaires' },
  { key: 'videos', label: 'Vidéos', icon: Video, desc: 'Médias lourds & URLs' },
  { key: 'carousel', label: 'Carrousel', icon: LayoutGrid, desc: 'Bannières d\'accueil' },
  { key: 'contacts', label: 'Contacts', icon: Mail, desc: 'Messages & Fiches' },
];

export const ContentSitePanel = () => {
  const [activeModule, setActiveModule] = useState<ContentModule>('sponsors');

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 min-h-screen text-white selection:bg-[#d4af37]/30">
      
      {/* 1. En-tête haut de gamme décentralisé */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.04] bg-gradient-to-br from-white/[0.02] to-transparent p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#d4af37]/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              <Layers className="w-3.5 h-3.5" />
              <span>Studio de Contenu</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
              Configuration du Site
            </h1>
            <p className="text-xs text-neutral-400 sm:text-sm max-w-xl">
              Pilotez instantanément les composants interactifs, fichiers lourds et galeries de votre vitrine.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Layout Segmenté : Haut (Navigation Visuelle) */}
      <div className="space-y-6">
        
        {/* Barre d'onglets réinventée sous forme de Hub à cartes */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none sm:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none sm:hidden" />

          <nav 
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {MODULES.map((mod) => {
              const isActive = activeModule === mod.key;
              return (
                <button
                  key={mod.key}
                  onClick={() => setActiveModule(mod.key)}
                  className={`
                    relative flex flex-col items-start gap-4 p-4 rounded-2xl min-w-[160px] sm:flex-1 snap-start
                    transition-all duration-300 outline-none text-left border group
                    ${isActive 
                      ? 'bg-neutral-900 border-[#d4af37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.03)]' 
                      : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeModuleCard"
                      className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/[0.06] to-transparent rounded-2xl pointer-events-none"
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    />
                  )}

                  <div className={`p-2.5 rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20' 
                      : 'bg-white/[0.03] text-neutral-400 border-white/[0.02] group-hover:text-neutral-200'
                  }`}>
                    <mod.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <div className="space-y-0.5">
                    <p className={`text-sm font-bold transition-colors ${isActive ? 'text-[#d4af37]' : 'text-neutral-300'}`}>
                      {mod.label}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-medium group-hover:text-neutral-400 transition-colors">
                      {mod.desc}
                    </p>
                  </div>

                  {isActive && (
                    <motion.div 
                      layoutId="activeLine"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#d4af37] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. Zone d'affichage adaptative selon le module sélectionné */}
        <AnimatePresence mode="wait">
          {activeModule === 'sponsors' ? (
            /* --- LAYOUT ASYMÉTRIQUE DÉDIÉ AUX SPONSORS --- */
            <motion.div
              key="sponsors-layout"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
            >
              {/* Colonne Gauche : Formulaire de création / Enregistrement fixe */}
              <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 sm:p-6 space-y-5 lg:sticky lg:top-6">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#d4af37]" />
                    Nouveau Sponsor
                  </h2>
                  <p className="text-xs text-neutral-400">Ajoutez instantanément un partenaire sur la vitrine.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Nom de l'entité</label>
                    <input 
                      type="text" 
                      placeholder="Ex: SABC, Orange..." 
                      className="w-full bg-neutral-950/40 border border-white/[0.06] text-sm rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#d4af37]/40 transition-all placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Adresse web (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://example.cm" 
                      className="w-full bg-neutral-950/40 border border-white/[0.06] text-sm rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#d4af37]/40 transition-all placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Niveau d'importance (Tier)</label>
                    <select className="w-full bg-neutral-950/40 border border-white/[0.06] text-sm rounded-xl px-3 py-2.5 text-neutral-300 outline-none focus:border-[#d4af37]/40 transition-all cursor-pointer">
                      <option value="Platinum" className="bg-[#121214] text-white">🏆 Platinum (Principal)</option>
                      <option value="Gold" className="bg-[#121214] text-white">🥇 Gold (Intermédiaire)</option>
                      <option value="Silver" className="bg-[#121214] text-white">🥈 Silver (Standard)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Fichier Logo</label>
                    <div className="border border-dashed border-white/[0.12] hover:border-[#d4af37]/40 bg-neutral-950/20 hover:bg-neutral-950/40 transition-all rounded-xl p-4 text-center cursor-pointer group">
                      <span className="text-xs text-[#d4af37] font-medium group-hover:underline">Sélectionner un fichier</span>
                      <p className="text-[10px] text-neutral-500 mt-0.5">PNG transparent ou SVG (Max: 2Mo)</p>
                    </div>
                  </div>
                </div>

                {/* Bouton d'enregistrement principal ancré en bas de formulaire */}
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#d4af37] text-neutral-950 text-sm font-bold rounded-xl hover:bg-[#bfa032] transition-colors shadow-[0_4px_20px_rgba(212,175,55,0.1)]">
                  <Save className="w-4 h-4" />
                  <span>Enregistrer le Sponsor</span>
                </button>
              </div>

              {/* Colonne Droite : Liste d'affichage des Sponsors existants */}
              <div className="lg:col-span-2 bg-white/[0.01] border border-white/[0.05] rounded-3xl p-5 sm:p-6 min-h-[500px]">
                <SponsorsManager />
              </div>
            </motion.div>
          ) : (
            /* --- LAYOUT STANDARD SANS FORMULAIRE ANCRÉ POUR LES AUTRES MODULES --- */
            <motion.div
              key="standard-layout"
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 sm:p-8 min-h-[500px]"
            >
              {activeModule === 'videos' && <VideosManager />}
              {activeModule === 'carousel' && <CarouselManager />}
              {activeModule === 'contacts' && <ContactManager />}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};