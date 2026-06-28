// =============================================================================
// PAGE CLASSEMENT — Leaderboard interactif avec médailles et vote rapide
// =============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Filter, Loader2, Medal, Crown, Award } from 'lucide-react';
import { usePublicCandidates } from '@/hooks/usePublicCandidates';
import { VoteModal } from '@/components/candidate/VoteModal';
import ShareButtons from '@/components/shared/ShareButtons';
import type { Candidate } from '@/types';
import { getMediaUrl } from '@/utils/mediaUrl';

const Classement = () => {
  const { categories, candidates: allCandidates, loading: isLoading } = usePublicCandidates(15000);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [voteCandidate, setVoteCandidate] = useState<Candidate | null>(null);

  const filteredCandidates = useMemo(() => {
    if (selectedCategory === 'all') return allCandidates;
    return allCandidates.filter((c) => c.category?.slug === selectedCategory);
  }, [allCandidates, selectedCategory]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: Crown, bg: 'bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20', border: 'border-[#FFD700]/40', text: 'text-[#FFD700]', shadow: 'shadow-[0_0_20px_rgba(255,215,0,0.15)]' };
    if (rank === 2) return { icon: Medal, bg: 'bg-gradient-to-r from-[#C0C0C0]/15 to-[#A8A8A8]/15', border: 'border-[#C0C0C0]/30', text: 'text-[#C0C0C0]', shadow: 'shadow-[0_0_15px_rgba(192,192,192,0.1)]' };
    if (rank === 3) return { icon: Award, bg: 'bg-gradient-to-r from-[#CD7F32]/15 to-[#B87333]/15', border: 'border-[#CD7F32]/30', text: 'text-[#CD7F32]', shadow: 'shadow-[0_0_15px_rgba(205,127,50,0.1)]' };
    return { icon: null, bg: 'bg-[#0b0b0b]/40', border: 'border-white/5', text: 'text-neutral-500', shadow: '' };
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black pt-24 pb-20">
      {/* Header */}
      <section className="relative w-full max-w-6xl mx-auto px-6 mb-12">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#d4af37]/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}

          >
         
        
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase font-heading tracking-[-0.02em]"
          >
            Le <span className="bg-gradient-to-r from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Classement</span>
          </motion.h1>
          <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-lg mx-auto">
            Découvrez en temps réel les artistes les plus soutenus par le public
          </p>
        </div>

        {/* Filtres catégories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide justify-center flex-wrap"
        >
          <div className="flex items-center gap-2 text-neutral-500 mr-2 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Filtrer</span>
          </div>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30'
            }`}
          >
            Toutes
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug || '')}
              className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === cat.slug
                  ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Tableau du classement */}
      <section className="relative w-full max-w-6xl mx-auto px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-4" />
            <p className="text-sm font-medium tracking-widest uppercase text-[#d4af37]">Chargement du classement...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredCandidates.length > 0 ? (
              <div className="space-y-3">
                {filteredCandidates.map((candidate, index) => {
                  const rank = index + 1;
                  const style = getRankStyle(rank);
                  const RankIcon = style.icon;
                  const shareUrl = `${window.location.origin}/candidats/${candidate.slug}`;
                  const shareText = `⭐ Votez pour ${candidate.firstName} ${candidate.lastName} dans la catégorie ${candidate.category?.name || 'Artiste'} sur MBOA NEXT STAR !`;

                  return (
                    <motion.div
                      key={candidate.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`group flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border ${style.border} ${style.bg} ${style.shadow} hover:border-[#d4af37]/30 transition-all duration-300`}
                    >
                      {/* Rang */}
                      <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                        rank <= 3 ? `${style.bg} border ${style.border}` : 'bg-white/5 border border-white/10'
                      }`}>
                        {RankIcon ? (
                          <RankIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${style.text}`} />
                        ) : (
                          <span className={`text-sm ${style.text}`}>#{rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/10 bg-[#141414]">
                        {candidate.profilePhoto ? (
                          <img
                            src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
                            alt={`${candidate.firstName} ${candidate.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg font-bold bg-gradient-to-br from-[#d4af37] to-[#b8952e] bg-clip-text text-transparent">
                              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm sm:text-base truncate">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                            {candidate.category?.name || 'Artiste'}
                          </span>
                        </div>
                      </div>

                      {/* Votes */}
                      <div className="shrink-0 text-right hidden sm:block">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                          <span className="text-xl sm:text-2xl font-black bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                            {candidate.totalVotesCache.toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <span className="text-neutral-500 text-[10px] uppercase tracking-widest">votes</span>
                      </div>

                      {/* Votes mobile */}
                      <div className="shrink-0 sm:hidden text-right">
                        <span className="text-lg font-black text-[#d4af37]">
                          {candidate.totalVotesCache}
                        </span>
                      </div>

                      {/* Partage */}
                      <div className="shrink-0 hidden lg:block">
                        <ShareButtons url={shareUrl} text={shareText} size="sm" />
                      </div>

                      {/* Bouton Voter */}
                      <button
                        onClick={() => setVoteCandidate(candidate)}
                        className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black text-[11px] font-black uppercase tracking-wider rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] active:scale-95 transition-all duration-300"
                      >
                        Voter
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-[#0b0b0b]/40 rounded-3xl border border-white/5"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Trophy className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucun candidat dans cette catégorie</h3>
                <p className="text-neutral-500 text-sm max-w-md">
                  Aucun artiste actif n'a été trouvé pour la catégorie sélectionnée.
                </p>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="mt-6 px-6 py-2.5 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#d4af37]/10 transition-colors"
                  >
                    Voir toutes les catégories
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>

      {/* Modale de vote */}
      {voteCandidate && (
        <VoteModal
          candidate={voteCandidate}
          isOpen={!!voteCandidate}
          onClose={() => setVoteCandidate(null)}
          onVoteSuccess={() => {
            setAllCandidates((prev) =>
              prev
                .map((c) =>
                  c.id === voteCandidate.id
                    ? { ...c, totalVotesCache: c.totalVotesCache + 1 }
                    : c
                )
                .sort((a, b) => b.totalVotesCache - a.totalVotesCache)
            );
          }}
        />
      )}
    </div>
  );
};

export default Classement;
