// =============================================================================
// PAGE CLASSEMENT — Premium Leaderboard (Stats & Classement)
// Inspiré de vote-for.me — Adapté Dark Mode #d4af37 MBOA NEXT STAR
// =============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { usePublicCandidates } from '@/hooks/usePublicCandidates';
import { VoteModal } from '@/components/candidate/VoteModal';
import type { Candidate } from '@/types';
import { getMediaUrl } from '@/utils/mediaUrl';

const CHART_COLORS = [
  '#d4af37', '#b8952e', '#e5c158', '#C0C0C0', '#CD7F32',
  '#848c87', '#1ba166', '#883530', '#bacae9', '#9faebb'
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface RankRowProps {
  candidate: Candidate;
  rank: number;
  onVote: (c: Candidate) => void;
}

const RankRow: React.FC<RankRowProps> = ({ candidate, rank, onVote }) => {
  let RankEmoji = null;
  if (rank === 1) RankEmoji = '🥇';
  else if (rank === 2) RankEmoji = '🥈';
  else if (rank === 3) RankEmoji = '🥉';
  else if (rank <= 10) RankEmoji = '🏎️';

  return (
    <div
      onClick={() => onVote(candidate)}
      className="flex flex-row items-center gap-4 p-3 relative bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] hover:scale-[1.02] hover:-translate-y-0.5 transition-all cursor-pointer mb-2"
    >
      {/* Rang et Avatar */}
      <div className="flex items-center gap-3 w-[60px] md:w-[80px]">
        <div className="text-white font-bold text-sm md:text-base w-6 text-center">
          {RankEmoji || rank}
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 border border-white/20">
          {candidate.profilePhoto ? (
            <img
              src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
              alt={candidate.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#141414] flex items-center justify-center">
              <span className="text-[#d4af37] font-bold text-xs">{candidate.firstName.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Nom */}
      <div className="flex flex-col flex-1 truncate">
        <span className="text-white text-sm md:text-base font-bold truncate">
          {candidate.firstName} {candidate.lastName}
        </span>
        {candidate.category && (
          <span className="text-neutral-500 text-[10px] uppercase">{candidate.category.name}</span>
        )}
      </div>

      {/* Votes */}
      <div className="flex flex-col items-end shrink-0">
        <span className="text-white font-black tabular-nums text-sm md:text-base">
          {candidate.totalVotesCache.toLocaleString('fr-FR')}
        </span>
        <span className="text-neutral-500 text-[10px] uppercase">votes</span>
      </div>
    </div>
  );
};

// =============================================================================
// PAGE PRINCIPALE
// =============================================================================

const Classement: React.FC = () => {
  const { categories, candidates: allCandidates, loading } = usePublicCandidates(15000);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [voteCandidate, setVoteCandidate] = useState<Candidate | null>(null);

  const filteredCandidates = useMemo(() => {
    let list = selectedCategory === 'all' ? allCandidates : allCandidates.filter(c => c.category?.slug === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.category?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCandidates, selectedCategory, search]);

  const totalVotesAll = useMemo(() => {
    return filteredCandidates.reduce((sum, c) => sum + (c.totalVotesCache || 0), 0);
  }, [filteredCandidates]);

  const maxVotes = useMemo(() => {
    return Math.max(...filteredCandidates.map(c => c.totalVotesCache || 0), 1); // evite division par 0
  }, [filteredCandidates]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black relative">
      
      {/* Background Image Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" />
        {/* On pourrait mettre l'image de fond ici, ex: */}
        {/* <img src="/bg-pattern.jpg" className="w-full h-full object-cover opacity-20" /> */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#d4af37]/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* En-tête / Filtres */}
        <div className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[-0.02em] mb-2">
              Le <span className="text-[#d4af37]">Classement</span>
            </h1>
            <p className="text-neutral-400 text-sm">Les artistes les plus soutenus par le public</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4af37]/50 transition-all"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4af37]/50 appearance-none"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug || ''}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
            <p className="text-sm text-neutral-500 uppercase tracking-widest">Chargement...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-24 border border-white/[0.05] rounded-2xl bg-white/[0.02]">
            <p className="text-neutral-500">Aucun candidat trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            
            {/* ── COLONNE GAUCHE : LES STATS ── */}
            <div className="flex flex-col">
              <h2 className="text-2xl text-white mb-6 text-center lg:text-left font-bold">Les Stats</h2>
              
              <div className="flex flex-col gap-5">
                {filteredCandidates.map((candidate, index) => {
                  const percentage = totalVotesAll > 0 ? ((candidate.totalVotesCache || 0) / totalVotesAll) * 100 : 0;
                  const widthPercent = maxVotes > 0 ? ((candidate.totalVotesCache || 0) / maxVotes) * 100 : 0;
                  const color = CHART_COLORS[index % CHART_COLORS.length];

                  return (
                    <div key={`stat-${candidate.id}`} className="flex flex-col gap-1.5 group">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-neutral-300 font-medium truncate pr-4">
                          {candidate.firstName} {candidate.lastName}
                        </span>
                        <span className="text-xs font-bold tabular-nums" style={{ color }}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.05] h-3 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: index * 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Légende */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8 px-2">
                {filteredCandidates.map((candidate, index) => (
                  <div key={`leg-${candidate.id}`} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {candidate.firstName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── COLONNE DROITE : LE CLASSEMENT ── */}
            <div className="flex flex-col">
              <h2 className="text-2xl text-white mb-6 text-center lg:text-left font-bold">Le Classement</h2>
              
              {/* Conteneur scrollable (scrollbar-thin) */}
              <div className="flex flex-col gap-2 max-h-[600px] lg:max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredCandidates.map((candidate, i) => (
                    <motion.div
                      key={candidate.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <RankRow
                        candidate={candidate}
                        rank={i + 1}
                        onVote={setVoteCandidate}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── VoteModal ── */}
      {voteCandidate && (
        <VoteModal
          candidate={voteCandidate}
          isOpen={!!voteCandidate}
          onClose={() => setVoteCandidate(null)}
          onVoteSuccess={() => setVoteCandidate(null)}
        />
      )}
    </div>
  );
};

export default Classement;
