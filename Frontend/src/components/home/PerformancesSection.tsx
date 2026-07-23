// =============================================================================
// SECTION PRESTATIONS — Grille vidéos immersive avec lightbox & bouton voter
// =============================================================================

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Star, Volume2, VolumeX, Maximize2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicCandidates } from '@/hooks/usePublicCandidates';
import { VoteModal } from '@/components/candidate/VoteModal';
import { getMediaUrl } from '@/utils/mediaUrl';
import type { Candidate } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getThumbnail(videoUrl: string | null, profilePhoto: string | null, updatedAt?: string): string {
  if (videoUrl) {
    const ytId = getYouTubeId(videoUrl);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  if (profilePhoto) return getMediaUrl(profilePhoto, updatedAt);
  return '';
}

function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

// ─── Sous-composant : Carte Vidéo ───────────────────────────────────────────

interface VideoCardProps {
  candidate: Candidate;
  index: number;
  onPlay: (candidate: Candidate) => void;
  onVote: (candidate: Candidate) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ candidate, index, onPlay, onVote }) => {
  const [imgError, setImgError] = useState(false);
  const thumb = getThumbnail(candidate.videoUrl, candidate.profilePhoto, candidate.updatedAt);
  const hasVideo = !!candidate.videoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
      className="group relative overflow-hidden rounded-2xl bg-[#0d0d12] border border-white/10 hover:border-[#d4af37]/40 transition-all duration-300 shadow-2xl flex flex-col h-full cursor-pointer"
      onClick={() => (hasVideo ? onPlay(candidate) : onVote(candidate))}
    >
      {/* Zone Media (Thumbnail + Overlays) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900 shrink-0">
        {thumb && !imgError ? (
          <img
            src={thumb}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-95 group-hover:brightness-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1610] to-[#0d0b08] flex items-center justify-center">
            <span className="text-3xl font-black bg-gradient-to-br from-[#d4af37] to-[#b8952e] bg-clip-text text-transparent">
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </span>
          </div>
        )}

        {/* Dégradé léger en bas de l'image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Badge Catégorie (Top Left) */}
        {candidate.category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/15 text-neutral-200 shadow-md">
              {candidate.category.name}
            </span>
          </div>
        )}

        {/* Bouton Play central au survol */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[1px] opacity-90 group-hover:opacity-100 transition-opacity">
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:bg-white/30 group-hover:border-white/50"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Zone Infos & Action (Structure propre sous l'image) */}
      <div className="p-4 flex flex-col justify-between flex-grow bg-gradient-to-b from-[#121216] to-[#0a0a0d]">
        <div>
          <h3 className="text-white font-black text-base sm:text-lg leading-tight truncate group-hover:text-[#d4af37] transition-colors">
            {candidate.firstName} {candidate.lastName}
          </h3>
          <p className="text-neutral-400 text-xs font-medium mt-1 truncate">
            {hasVideo ? 'Regarder la vidéo' : 'Profil candidat'}
          </p>
        </div>

        {/* Pied de carte : Compteur de votes + Bouton Voter */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.08] gap-2">
          {/* Badge Nombre de votes */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-white font-black text-xs">
              {candidate.totalVotesCache.toLocaleString('fr-FR')}
            </span>
          </div>

          {/* Bouton VOTER */}
          <button
            onClick={(e) => { e.stopPropagation(); onVote(candidate); }}
            className="shrink-0 px-4 py-2 bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#b8952e] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95 transition-all shadow-md"
          >
            Voter
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Sous-composant : Lightbox Vidéo ────────────────────────────────────────

interface VideoLightboxProps {
  candidate: Candidate;
  onClose: () => void;
  onVote: (candidate: Candidate) => void;
}

const VideoLightbox: React.FC<VideoLightboxProps> = ({ candidate, onClose, onVote }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const ytId = candidate.videoUrl ? getYouTubeId(candidate.videoUrl) : null;
  const isYt = candidate.videoUrl ? isYouTube(candidate.videoUrl) : false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vidéo */}
        <div className="relative aspect-video bg-black">
          {isYt && ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={`Prestation de ${candidate.firstName}`}
            />
          ) : candidate.videoUrl ? (
            <video
              ref={videoRef}
              src={candidate.videoUrl}
              className="w-full h-full object-contain"
              autoPlay
              controls
              muted={muted}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0d0d0d]">
              <img
                src={getMediaUrl(candidate.profilePhoto || '', candidate.updatedAt)}
                alt={candidate.firstName}
                className="w-32 h-32 rounded-full object-cover border-2 border-[#d4af37]/30"
              />
              <p className="text-neutral-400 text-sm">Aucune vidéo disponible pour ce candidat</p>
            </div>
          )}

          {/* Controls overlay (non-YouTube) */}
          {!isYt && candidate.videoUrl && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => setMuted(!muted)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Infos candidat */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#141414]">
              {candidate.profilePhoto ? (
                <img
                  src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
                  alt={candidate.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-black text-[#d4af37]">
                    {candidate.firstName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-base truncate">
                {candidate.firstName} {candidate.lastName}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                {candidate.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {candidate.category.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] font-black text-[#d4af37]">
                  <Star className="w-3 h-3 fill-[#d4af37]" />
                  {candidate.totalVotesCache.toLocaleString('fr-FR')} votes
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {candidate.slug && (
              <Link
                to={`/candidats/${candidate.slug}`}
                className="p-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-all"
                title="Voir le profil"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => { onClose(); setTimeout(() => onVote(candidate), 100); }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              Voter maintenant
            </button>
          </div>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};

// ─── Composant Principal ─────────────────────────────────────────────────────

import React from 'react';

const PerformancesSection: React.FC = () => {
  const { candidates, loading } = usePublicCandidates(30000);
  const [lightboxCandidate, setLightboxCandidate] = useState<Candidate | null>(null);
  const [voteCandidate, setVoteCandidate] = useState<Candidate | null>(null);

  // Filtrer les candidats qui ont une vidéo ou une photo, priorité aux vidéos
  const featured = [...candidates]
    .sort((a, b) => {
      const aHasVideo = a.videoUrl ? 1 : 0;
      const bHasVideo = b.videoUrl ? 1 : 0;
      if (bHasVideo !== aHasVideo) return bHasVideo - aHasVideo;
      return b.totalVotesCache - a.totalVotesCache;
    })
    .slice(0, 8);

  const handlePlay = useCallback((c: Candidate) => setLightboxCandidate(c), []);
  const handleVote = useCallback((c: Candidate) => setVoteCandidate(c), []);

  if (loading || featured.length === 0) return null;

  return (
    <section className="py-20 px-6 w-full max-w-7xl mx-auto">
      {/* En-tête de section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] mb-3">
          Découvrez les talents
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight">
          Talents{' '}
          <span className="bg-gradient-to-r from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
            en Scène
          </span>
        </h2>
        <p className="text-neutral-400 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
          Regardez les prestations, soutenez vos artistes favoris et votez directement.
        </p>
      </motion.div>

      {/* Grille uniforme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {featured.map((candidate, index) => (
          <VideoCard
            key={candidate.id}
            candidate={candidate}
            index={index}
            onPlay={handlePlay}
            onVote={handleVote}
          />
        ))}
      </div>

      {/* CTA — Voir tous les candidats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-10"
      >
        <Link
          to="/candidats"
          className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 bg-white/5 backdrop-blur-sm text-white text-sm font-bold rounded-full hover:bg-white/10 hover:border-[#d4af37]/50 hover:text-[#d4af37] transition-all duration-300 shadow-lg"
        >
          Voir tous les candidats
          <Maximize2 className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxCandidate && (
          <VideoLightbox
            candidate={lightboxCandidate}
            onClose={() => setLightboxCandidate(null)}
            onVote={handleVote}
          />
        )}
      </AnimatePresence>

      {/* Modal de vote */}
      {voteCandidate && (
        <VoteModal
          candidate={voteCandidate}
          isOpen={!!voteCandidate}
          onClose={() => setVoteCandidate(null)}
          onVoteSuccess={() => setVoteCandidate(null)}
        />
      )}
    </section>
  );
};

export default PerformancesSection;
