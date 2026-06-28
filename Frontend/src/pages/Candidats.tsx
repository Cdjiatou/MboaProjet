// =============================================================================
// PAGE CANDIDATS — MBOA NEXT STAR
// Navigation, Recherche, et Filtrage par Catégorie
// =============================================================================

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Filter, Loader2, X } from 'lucide-react';
import { usePublicCandidates } from '@/hooks/usePublicCandidates';
import { CandidateCard } from '@/components/candidate/CandidateCard';

const Candidats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryQuery = searchParams.get('category') || 'all';

  const { categories, candidates: allCandidates, loading: isLoading } = usePublicCandidates(15000);
  const [searchQuery, setSearchQuery] = useState('');

  // Déterminer la catégorie sélectionnée
  const selectedCategorySlug = categoryQuery;

  // Filtrer les candidats
  const filteredCandidates = useMemo(() => {
    return allCandidates.filter((c) => {
      // Filtre par catégorie
      if (selectedCategorySlug !== 'all' && c.category?.slug !== selectedCategorySlug) {
        return false;
      }
      
      // Filtre par recherche textuelle (nom, pseudo, code)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (!fullName.includes(query) && !c.firstName.toLowerCase().includes(query) && !c.lastName.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [allCandidates, selectedCategorySlug, searchQuery]);

  const handleCategorySelect = (slug: string) => {
    setSearchParams(slug === 'all' ? {} : { category: slug });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black pt-24 pb-20">
      
      {/* =====================================================================
          1. HEADER SECTION (Recherche & Filtres)
          ===================================================================== */}
      <section className="relative w-full max-w-7xl mx-auto px-6 mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 mb-4"
            >
              <Star className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider">
                Classement & Talents
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-black uppercase font-heading tracking-[-0.02em]"
            >
              Tous les <span className="text-[#d4af37]">Candidats</span>
            </motion.h1>
          </div>

          {/* Barre de Recherche */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-full md:max-w-md"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-neutral-500 group-focus-within:text-[#d4af37] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, pseudo ou code..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-10 py-4 bg-[#0b0b0b] border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all placeholder:text-neutral-600"
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tabs de Filtres Catégories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-8 overflow-x-auto pb-4 scrollbar-hide"
        >
          <div className="flex items-center gap-2 text-neutral-500 mr-2 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Filtres</span>
          </div>
          
          <button
            onClick={() => handleCategorySelect('all')}
            className={`shrink-0 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              selectedCategorySlug === 'all' 
                ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                : 'bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30'
            }`}
          >
            Tous les talents
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug || '')}
              className={`shrink-0 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedCategorySlug === cat.slug 
                  ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                  : 'bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </motion.div>
      </section>

      {/* =====================================================================
          2. RÉSULTATS (Candidats)
          ===================================================================== */}
      <section className="relative w-full max-w-7xl mx-auto px-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-4" />
            <p className="text-sm font-medium tracking-widest uppercase text-[#d4af37]">Chargement des talents...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredCandidates.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredCandidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* On passe le rank basé sur le tableau total trié, ou on peut juste mettre l'index du filtre si on veut un classement par catégorie */}
                    <CandidateCard 
                      candidate={candidate} 
                      rank={allCandidates.findIndex(c => c.id === candidate.id) + 1} 
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-[#0b0b0b]/40 rounded-3xl border border-white/5"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucun talent trouvé</h3>
                <p className="text-neutral-500 text-sm max-w-md">
                  Nous n'avons trouvé aucun candidat correspondant à votre recherche. 
                  Essayez de modifier vos filtres ou vos termes de recherche.
                </p>
                
                {(selectedCategorySlug !== 'all' || searchQuery !== '') && (
                  <button 
                    onClick={() => {
                      handleCategorySelect('all');
                      clearSearch();
                    }}
                    className="mt-6 px-6 py-2.5 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#d4af37]/10 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>

    </div>
  );
};

export default Candidats;
