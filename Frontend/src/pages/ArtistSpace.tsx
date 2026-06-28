// =============================================================================
// PAGE ESPACE ARTISTE — Complétion du profil avec compteur de mots
// =============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Video, Send, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { useWordCount } from '@/hooks/useWordCount';
import { completeCandidateProfile } from '@/services/candidateService';
import { useThemeStore } from '@/store/useThemeStore';
import { getCandidateSessionToken } from '@/services/api';
import { notifyCandidatesUpdated } from '@/hooks/usePublicCandidates';
import ProfileSharePanel from '@/components/shared/ProfileSharePanel';

const ArtistSpace = () => {
  const [biography, setBiography] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [uniqueLink, setUniqueLink] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const wordCount = useWordCount(biography);

  const maxWords = 300;
  const minWords = 10;
  const progress = Math.min((wordCount / maxWords) * 100, 100);
  const isValid = wordCount >= minWords && wordCount <= maxWords;
  const authToken = useThemeStore((state) => state.token);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const token = authToken || getCandidateSessionToken();
    if (!isValid || !token) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload: { biography: string; videoUrl?: string } = { biography };
      if (videoUrl.trim()) payload.videoUrl = videoUrl.trim();

      const res = await completeCandidateProfile(payload, token);

      if (res.success && res.data) {
        const c = res.data.candidate;
        setCandidateName(`${c.firstName} ${c.lastName}`);
        if (c.slug) {
          setUniqueLink(`${window.location.origin}/candidats/${c.slug}`);
        }
        notifyCandidatesUpdated();
        setSubmitted(true);
      } else {
        setError(res.message || 'Erreur lors de la soumission du profil.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || 'Erreur serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b0b0b]/60 border border-[#d4af37]/20 shadow-[0_0_40px_rgba(212,175,55,0.1)] rounded-3xl p-8 sm:p-10 text-center max-w-md w-full space-y-6"
        >
          <CheckCircle className="w-16 h-16 text-[#d4af37] mx-auto" />
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Profil complété !</h2>
            <p className="text-neutral-400 text-sm">
              Partagez votre lien unique pour recevoir des votes de vos proches.
            </p>
          </div>

          {uniqueLink && candidateName && (
            <ProfileSharePanel url={uniqueLink} candidateName={candidateName} />
          )}

          {uniqueLink && (
            <Link
              to={uniqueLink.replace(window.location.origin, '')}
              className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Voir mon profil
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#050505] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 mb-4">
            <Star className="w-6 h-6 text-[#d4af37] fill-[#d4af37]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading uppercase tracking-widest">
            Mon <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Espace Artiste</span>
          </h1>
          <p className="text-neutral-400 mt-4 max-w-lg mx-auto text-sm">
            Complétez votre profil avec passion pour séduire le public et propulser votre carrière.
          </p>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(212,175,55,0.03)] rounded-3xl p-6 sm:p-10 space-y-8"
        >
          {/* Biographie */}
          <div>
            <label className="flex items-center gap-3 text-white font-bold mb-3 uppercase tracking-wider text-xs">
              <div className="p-2 rounded-lg bg-[#d4af37]/10">
                <FileText className="w-4 h-4 text-[#d4af37]" />
              </div>
              Biographie (10 à 300 mots)
            </label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Racontez votre parcours artistique, vos inspirations, vos réalisations et ce qui vous rend unique..."
              rows={8}
              className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all resize-none"
            />

            {/* Barre de progression du compteur de mots */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isValid ? 'text-success' : 'text-text-muted'}`}>
                  {wordCount} / {maxWords} mots
                </span>
                {isValid && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-success flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Validé
                  </motion.span>
                )}
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors ${isValid ? 'bg-success' : 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* URL Vidéo */}
          <div>
            <label className="flex items-center gap-3 text-white font-bold mb-3 uppercase tracking-wider text-xs">
              <div className="p-2 rounded-lg bg-[#d4af37]/10">
                <Video className="w-4 h-4 text-[#d4af37]" />
              </div>
              Vidéo de prestation (YouTube / TikTok)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
            />
          </div>

          {/* Bouton de soumission */}
          <div className="pt-4">
            {error && (
              <p className="text-red-400 text-sm text-center mb-4">
                {error}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSubmitting ? 'Soumission...' : 'Soumettre mon profil'}
            </button>

            {!isValid && (
              <p className="text-red-400 text-xs text-center mt-4">
                La biographie doit contenir entre {minWords} et {maxWords} mots.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArtistSpace;
