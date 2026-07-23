// =============================================================================
// COMPOSANT CandidateCard — Carte candidat ergonomique avec Glassmorphism et Médailles
// =============================================================================

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Play, MapPin } from 'lucide-react';
import ShareButtons from '@/components/shared/ShareButtons';
import type { Candidate } from '@/types';
import { getMediaUrl } from '@/utils/mediaUrl';

interface Props {
  candidate: Candidate;
  rank?: number;
  onVoteClick?: (candidate: Candidate, e: React.MouseEvent) => void;
}

export const CandidateCard = ({ candidate, rank, onVoteClick }: Props) => {

  const handleVoteAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onVoteClick) {
      onVoteClick(candidate, e);
    }
  };

  // Helper pour le style de la médaille de classement
  const getRankBadgeStyle = (r: number) => {
    switch (r) {
      case 1:
        return 'bg-gradient-to-br from-[#ffe58f] via-[#d4af37] to-[#996b00] text-black font-black shadow-[0_0_18px_rgba(212,175,55,0.7)] border border-amber-200/60 scale-105';
      case 2:
        return 'bg-gradient-to-br from-[#f0f0f0] via-[#c0c0c0] to-[#787878] text-black font-black shadow-[0_0_15px_rgba(192,192,192,0.5)] border border-white/60';
      case 3:
        return 'bg-gradient-to-br from-[#f3a971] via-[#cd7f32] to-[#7a3e0c] text-white font-black shadow-[0_0_15px_rgba(205,127,50,0.5)] border border-amber-300/40';
      default:
        return 'bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg font-black';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] hover:border-[#d4af37]/50 transition-all duration-300 shadow-2xl flex flex-col h-full"
    >
      {/* Zone Image & Overlays */}
      <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-neutral-900 shrink-0">
        {/* Badge de classement (Top 10) avec style médaille haut contraste */}
        {rank && rank <= 10 && (
          <div className={`absolute top-3 left-3 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm ${getRankBadgeStyle(rank)}`}>
            {rank}
          </div>
        )}

        {/* Badge Catégorie (Top Right en glassmorphism neutre) */}
        {candidate.category?.name && (
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
              {candidate.category.name}
            </span>
          </div>
        )}

        {/* Image du candidat avec lien */}
        <Link to={`/candidats/${candidate.slug}`} className="block w-full h-full">
          {candidate.profilePhoto ? (
            <img
              src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              loading="lazy"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 brightness-95 group-hover:brightness-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1610] to-[#0d0b08]">
              <Star className="w-12 h-12 text-[#d4af37]/30" />
            </div>
          )}

          {/* Dégradé d'assombrissement en bas de l'image pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />

          {/* Bouton Play vidéo au survol (Frosted Glass Blanc) */}
          {candidate.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 bg-black/30 backdrop-blur-[2px]">
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </motion.div>
            </div>
          )}
        </Link>

        {/* Overlay Partage Social au survol sur l'image */}
        <div 
          className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <ShareButtons
            url={`${window.location.origin}/candidats/${candidate.slug}`}
            text={`⭐ Votez pour ${candidate.firstName} ${candidate.lastName} sur MBOA NEXT STAR !`}
            size="sm"
          />
        </div>
      </div>

      {/* Bloc Informations & Action */}
      <div className="p-4 flex flex-col justify-between flex-grow bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
        <div>
          {/* Nom du candidat */}
          <Link to={`/candidats/${candidate.slug}`} className="block group/title">
            <h3 className="text-white font-black text-base sm:text-lg leading-tight truncate group-hover/title:text-[#d4af37] transition-colors">
              {candidate.firstName} {candidate.lastName}
            </h3>
          </Link>

          {/* Localisation */}
          <div className="flex items-center gap-1 text-neutral-400 text-xs mt-1 truncate">
            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
            <span className="truncate">
              {[candidate.city, candidate.country].filter(Boolean).join(', ') || 'Cameroun'}
            </span>
          </div>
        </div>

        {/* Ligne du bas : Compteur de votes & Bouton VOTER */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06] gap-2">
          {/* Votes (Glassmorphism Neutre) */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-white font-black text-xs">
              {candidate.totalVotesCache.toLocaleString('fr-FR')}
            </span>
            <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider">votes</span>
          </div>

          {/* Bouton VOTER lumineux */}
          {onVoteClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoteAction}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#F3B800] hover:bg-[#e0aa00] text-black shadow-[0_4px_20px_rgba(243,184,0,0.35)] hover:shadow-[0_0_25px_rgba(243,184,0,0.6)] transition-all duration-200"
            >
              Voter
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateCard;