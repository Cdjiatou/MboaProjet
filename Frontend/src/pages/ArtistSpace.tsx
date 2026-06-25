// =============================================================================
// PAGE ESPACE ARTISTE — Complétion du profil avec compteur de mots
// =============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Camera, Video, Send, CheckCircle, Star } from 'lucide-react';
import { useWordCount } from '@/hooks/useWordCount';

const ArtistSpace = () => {
  const [biography, setBiography] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const wordCount = useWordCount(biography);

  const minWords = 300;
  const progress = Math.min((wordCount / minWords) * 100, 100);
  const isValid = wordCount >= minWords;

  const handleSubmit = () => {
    if (!isValid) return;
    // TODO: Appel API pour compléter le profil
    console.log('Soumission du profil :', { biography, profilePhoto, videoUrl });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b0b0b]/40 border border-[#d4af37]/10 shadow-[0_0_30px_rgba(212,175,55,0.12)] rounded-2xl p-8 text-center max-w-md w-full"
        >
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Profil soumis !</h2>
          <p className="text-text-muted">
            Votre profil est en cours de validation. Vous recevrez une notification par WhatsApp
            dès qu'il sera activé.
          </p>
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
              Biographie ({minWords} mots minimum)
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
                  {wordCount} / {minWords} mots
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

          {/* Photo de profil */}
          <div>
            <label className="flex items-center gap-3 text-white font-bold mb-3 uppercase tracking-wider text-xs">
              <div className="p-2 rounded-lg bg-[#d4af37]/10">
                <Camera className="w-4 h-4 text-[#d4af37]" />
              </div>
              Photo de profil (URL)
            </label>
            <input
              type="url"
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              placeholder="https://exemple.com/ma-photo.jpg"
              className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
            />
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
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Soumettre mon profil
            </button>

            {!isValid && (
              <p className="text-red-400 text-xs text-center mt-4">
                Vous devez rédiger au minimum {minWords} mots dans votre biographie pour soumettre.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArtistSpace;
