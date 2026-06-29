// =============================================================================
// COMPOSANT CandidateCard — Carte candidat fidèle à la page de référence
// =============================================================================

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';
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
    // Empêche la redirection vers la page de profil lors du clic sur le bouton Voter
    e.preventDefault();
    e.stopPropagation();
    if (onVoteClick) {
      onVoteClick(candidate, e);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 hover:border-[#d4af37]/40 transition-all duration-500 shadow-xl"
    >
      {/* Badge de classement (#1, #2, #3...) */}
      {rank && rank <= 10 && (
        <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center shadow-lg text-xs font-black text-black">
          #{rank}
        </div>
      )}

      {/* Zone de contenu principale cliquable vers le profil */}
      <Link to={`/candidats/${candidate.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-900">
        {candidate.profilePhoto ? (
          <img
            src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9] group-hover:brightness-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1610] to-[#0d0b08]">
            <Star className="w-12 h-12 text-[#d4af37]/30" />
          </div>
        )}

        {/* Overlay dégradé sombre */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Bouton Play au survol si vidéo présente */}
        {candidate.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className="w-12 h-12 rounded-full bg-[#d4af37] flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
          </div>
        )}
      </Link>

      {/* Boutons de partage social au hover - HORS du Link pour éviter l'imbrication de <a> */}
      <div 
        className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <ShareButtons
          url={`${window.location.origin}/candidats/${candidate.slug}`}
          text={`⭐ Votez pour ${candidate.firstName} ${candidate.lastName} sur MBOA NEXT STAR !`}
          size="sm"
        />
      </div>

      {/* Bloc d'informations en bas */}
      <div className="p-4">
        {/* Badge catégorie */}
        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/20 mb-2">
          {candidate.category?.name || 'Artiste'}
        </span>

        <h3 className="text-white font-bold text-sm sm:text-base leading-tight truncate">
          {candidate.firstName} {candidate.lastName}
        </h3>

        {/* Localisation */}
        <p className="text-neutral-500 text-xs mt-0.5 truncate">
          {[candidate.city, candidate.country].filter(Boolean).join(', ') || 'Cameroun'}
        </p>

        {/* Votes + bouton Voter */}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-[#d4af37] font-bold text-xs">
              {candidate.totalVotesCache.toLocaleString('fr-FR')}
            </span>
            <span className="text-neutral-500 text-xs">votes</span>
          </div>

          {/* Bouton Voter — utilise handleVoteAction pour stopper la propagation */}
          {onVoteClick && (
            <button
              onClick={handleVoteAction}
              className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#d4af37] text-black hover:bg-[#e8c547] active:scale-95 transition-all duration-150 shadow-md"
            >
              Voter
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateCard;