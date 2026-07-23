// =============================================================================
// PAGE PROFIL CANDIDAT — Page publique d'un artiste avec lecteur et vote
// =============================================================================

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Trophy } from 'lucide-react';
import ShareButtons from '@/components/shared/ShareButtons';
import { BiographyDisplay } from '@/components/shared/BiographyDisplay';
import { getMediaUrl } from '@/utils/mediaUrl';
import { getCandidateBySlug } from '@/services/adminService';
import { VoteModal } from '@/components/candidate/VoteModal';
import { CANDIDATES_REFRESH_EVENT } from '@/hooks/usePublicCandidates';
import type { Candidate } from '@/types';

// Détecte si l'URL est une vidéo YouTube
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

const CandidateProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  useEffect(() => {
    const fetchCandidate = async (silent = false) => {
      if (!slug) return;
      if (!silent) setLoading(true);
      try {
        const res = await getCandidateBySlug(slug);
        if (res.success && res.data) {
          setCandidate(res.data);
        }
      } catch (err) {
        console.error('Erreur chargement candidat :', err);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    fetchCandidate();
    const onRefresh = () => fetchCandidate(true);
    window.addEventListener(CANDIDATES_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(CANDIDATES_REFRESH_EVENT, onRefresh);
  }, [slug]);

  const shareUrl = window.location.href;
  const shareText = ` Votez pour ${candidate?.firstName} ${candidate?.lastName} dans la catégorie ${candidate?.category?.name || 'Artiste'} sur MBOA NEXT STAR !`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <p className="text-text-muted text-lg">Candidat introuvable.</p>
        <Link to="/" className="text-primary hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

  // Résolution de la vidéo
  const rawVideoUrl = candidate.videoUrl || '';
  const isYt = /youtube\.com|youtu\.be/.test(rawVideoUrl);
  const ytId = isYt ? getYouTubeId(rawVideoUrl) : null;
  const resolvedVideoUrl = rawVideoUrl ? getMediaUrl(rawVideoUrl, candidate.updatedAt) : '';

  return (
    <div className="min-h-screen pt-24 pb-32 sm:pb-16 bg-black text-white relative overflow-hidden">
      {/* Background Hero avec la photo de l'artiste centrée (Lumineuse & Sublime) */}
      {candidate.profilePhoto && (
        <div className="absolute top-0 left-0 right-0 h-[650px] sm:h-[800px] z-0 overflow-hidden pointer-events-none">
          <img
            src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
            alt=""
            className="w-full h-full object-cover object-center scale-105 blur-xl opacity-75 sm:opacity-85 filter brightness-105 saturate-125 transition-all duration-700"
          />
          {/* Dégradés d'intégration légers & fluides */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/25 to-black" />
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ===== Section Vidéo & Bio (3/5 de l'espace) ===== */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Lecteur Vidéo */}
            <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-2xl p-1.5 sm:p-2">
              <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-black relative group">
                {rawVideoUrl ? (
                  isYt && ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={`Prestation de ${candidate.firstName}`}
                    />
                  ) : (
                    <video
                      src={resolvedVideoUrl}
                      className="w-full h-full object-contain"
                      controls
                      preload="auto"
                      playsInline
                      crossOrigin="anonymous"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Star className="w-12 h-12 sm:w-16 sm:h-16 text-[#d4af37]/20 mb-4 animate-pulse" />
                    <p className="text-neutral-500 text-sm">Vidéo de prestation bientôt disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Biographie */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl">
              <h2 className="text-lg sm:text-xl font-black text-white mb-4 sm:mb-6 font-heading uppercase tracking-widest border-b border-white/10 pb-4 inline-block">
                Biographie
              </h2>
              {candidate.biography ? (
                <BiographyDisplay text={candidate.biography} />
              ) : (
                <p className="text-neutral-500 text-sm italic">La biographie de cet artiste sera bientôt disponible.</p>
              )}
            </div>
          </motion.div>

          {/* ===== Section Vote (2/5 de l'espace) ===== */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Carte de profil */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-center space-y-6 sm:space-y-8 relative overflow-hidden">

              {/* Avatar */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden border border-white/10 bg-[#141414] relative z-10">
                {candidate.profilePhoto ? (
                  <img
                    src={getMediaUrl(candidate.profilePhoto, candidate.updatedAt)}
                    alt={`${candidate.firstName} ${candidate.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                      {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-wider uppercase">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p className="inline-block px-4 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold tracking-widest uppercase">
                  {candidate.category?.name || 'Artiste'}
                </p>
              </div>

              {/* Compteur de votes */}
              <div className="flex items-center justify-center gap-3 bg-white/[0.03] py-3 sm:py-4 px-6 rounded-2xl border border-white/5">
                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                  {candidate.totalVotesCache}
                </span>
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">votes</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-2 flex flex-col items-center">
                <button
                  onClick={() => setIsVoteModalOpen(true)}
                  className="hidden lg:flex px-12 py-3.5 sm:py-4 bg-[#F3B800] hover:bg-[#e0aa00] text-black font-black rounded-full active:scale-95 transition-all duration-300 text-sm uppercase tracking-widest items-center justify-center"
                >
                  VOTER
                </button>

                <div className="space-y-4 pt-8">
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center">Partager le profil</p>
                  <div className="flex justify-center">
                    <ShareButtons url={shareUrl} text={shareText} size="md" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Bouton de vote flottant (mobile) ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-gradient-to-t from-black via-black/95 to-transparent lg:hidden pb-6 flex justify-center">
        <button
          onClick={() => setIsVoteModalOpen(true)}
          className="w-[90%] py-3.5 bg-[#F3B800] hover:bg-[#e0aa00] text-black font-black rounded-full text-xs uppercase tracking-widest flex items-center justify-center active:scale-95 transition-all"
        >
          VOTER
        </button>
      </div>

      {/* Modale de vote/paiement */}
      <VoteModal
        candidate={candidate}
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        onVoteSuccess={() => {
          setCandidate((prev) => (prev ? { ...prev, totalVotesCache: prev.totalVotesCache + 1 } : null));
        }}
      />
    </div>
  );
};

export default CandidateProfile;
