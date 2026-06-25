// =============================================================================
// PAGE PROFIL CANDIDAT — Page publique d'un artiste avec lecteur et vote
// =============================================================================

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as unknown as React.ComponentType<{
  url?: string | null;
  width?: string;
  height?: string;
  controls?: boolean;
  playing?: boolean;
  light?: boolean;
}>;
import { ArrowLeft, Star, Trophy, Share2 } from 'lucide-react';
import { getCandidateBySlug } from '@/services/adminService';
import { VoteModal } from '@/components/candidate/VoteModal';
import type { Candidate } from '@/types';

const CandidateProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!slug) return;
      try {
        const res = await getCandidateBySlug(slug);
        if (res.success && res.data) {
          setCandidate(res.data);
        }
      } catch (err) {
        console.error('Erreur chargement candidat :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [slug]);

  const handleShare = () => {
    const url = window.location.href;
    const text = `⭐ Votez pour ${candidate?.firstName} ${candidate?.lastName} sur MBOA NEXT STAR ! ${url}`;
    if (navigator.share) {
      navigator.share({ title: 'MBOA NEXT STAR', text, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

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

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#050505] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="absolute top-1/4 right-0 w-[50%] h-[50%] bg-[#d4af37]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ===== Section Vidéo & Bio (3/5 de l'espace) ===== */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Lecteur Vidéo */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(212,175,55,0.05)] p-2">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative group">
                {candidate.videoUrl ? (
                  <Player
                    url={candidate.videoUrl}
                    width="100%"
                    height="100%"
                    controls
                    playing={false}
                    light
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Star className="w-16 h-16 text-primary/20 mb-4 animate-pulse" />
                    <p className="text-neutral-500 text-sm">Vidéo de prestation bientôt disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Biographie */}
            <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(212,175,55,0.02)]">
              <h2 className="text-xl font-black text-white mb-6 font-heading uppercase tracking-widest border-b border-white/10 pb-4 inline-block">
                Biographie
              </h2>
              <p className="text-neutral-400 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {candidate.biography || 'La biographie de cet artiste sera bientôt disponible.'}
              </p>
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
            <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-[#d4af37]/20 shadow-[0_0_50px_rgba(212,175,55,0.08)] rounded-3xl p-6 sm:p-10 text-center space-y-8 relative overflow-hidden">
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4af37] via-[#fff3c4] to-[#b8952e]"></div>

              {/* Avatar */}
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#0b0b0b] shadow-[0_0_0_2px_rgba(212,175,55,0.5)] bg-[#141414] relative z-10">
                {candidate.profilePhoto ? (
                  <img
                    src={candidate.profilePhoto}
                    alt={`${candidate.firstName} ${candidate.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-extrabold bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                      {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white font-heading tracking-wider uppercase">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p className="inline-block px-4 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold tracking-widest uppercase">
                  {candidate.category?.name || 'Artiste'}
                </p>
              </div>

              {/* Compteur de votes */}
              <div className="flex items-center justify-center gap-3 bg-[#050505] py-4 px-6 rounded-2xl border border-white/5">
                <Trophy className="w-6 h-6 text-[#d4af37]" />
                <span className="text-3xl font-black bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                  {candidate.totalVotesCache}
                </span>
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">votes</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-2">
                <button
                  onClick={() => setIsVoteModalOpen(true)}
                  className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5 fill-black" /> Voter pour {candidate.firstName}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-3 border border-white/10 rounded-xl text-neutral-400 text-sm hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Partager le profil
                </button>
              </div>
            </div>
          </motion.div>
        </div>
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
