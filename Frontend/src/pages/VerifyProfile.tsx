// =============================================================================
// PAGE VÉRIFICATION PROFIL — Interface OTP Premium pour Candidats
// Le candidat reçoit un lien de l'admin (ex: /verify-profile?token=abc123)
// et arrive directement sur la saisie du code OTP pour vérifier son profil.
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

type Step = 'otp' | 'success' | 'invalid';

const OTP_LENGTH = 6;

const VerifyProfile = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>(token ? 'otp' : 'invalid');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── AUTO-FOCUS LE PREMIER INPUT AU CHARGEMENT ─────────────────────
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [step]);

  // ─── COUNTDOWN POUR LE RENVOI DU CODE ──────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── GESTION DES INPUTS OTP ────────────────────────────────────────
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError('');

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasteData) return;

    const newOtp = new Array(OTP_LENGTH).fill('');
    pasteData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pasteData.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  // ─── VÉRIFICATION DU CODE OTP ──────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Veuillez entrer le code complet à 6 chiffres.');
      return;
    }

    setError('');
    setVerifying(true);

    // TODO: Appel API → POST /api/verify/confirm { token, code }
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simuler une vérification réussie
    setVerifying(false);
    setStep('success');
  };

  // ─── RENVOI DU CODE ────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp(new Array(OTP_LENGTH).fill(''));
    setError('');
    setResending(true);

    // TODO: Appel API → POST /api/verify/resend { token }
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setResending(false);
    setResendCooldown(60);
    inputRefs.current[0]?.focus();
  };

  // =================================================================
  //  RENDU
  // =================================================================
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#050505] text-white relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.02] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto px-4 sm:px-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════
              LIEN INVALIDE — Pas de token dans l'URL
              ═══════════════════════════════════════════════════════ */}
          {step === 'invalid' && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)] rounded-3xl p-8 sm:p-10 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  Lien invalide
                </h2>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto">
                  Ce lien de vérification est invalide ou a expiré. Veuillez contacter
                  l'administration de <span className="text-[#d4af37] font-semibold">MBOA NEXT STAR</span> pour
                  recevoir un nouveau lien de vérification.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <Link
                    to="/contact"
                    className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Contacter l'administration
                  </Link>
                  <Link
                    to="/"
                    className="w-full py-3 rounded-xl border border-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/20 transition-all text-center"
                  >
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SAISIE DU CODE OTP
              ═══════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* En-tête */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 mb-5">
                  <ShieldCheck className="w-7 h-7 text-[#d4af37]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-heading uppercase tracking-wider">
                  Vérifier mon{' '}
                  <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                    Profil
                  </span>
                </h1>
                <p className="text-neutral-400 mt-3 text-sm leading-relaxed max-w-sm mx-auto">
                  Saisissez le code à {OTP_LENGTH} chiffres qui vous a été communiqué
                  pour confirmer votre identité.
                </p>
              </div>

              {/* Carte OTP */}
              <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(212,175,55,0.03)] rounded-3xl p-6 sm:p-8 space-y-6">
                {/* Inputs OTP */}
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 bg-[#050505] text-white outline-none transition-all duration-300 ${
                        digit
                          ? 'border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                          : 'border-white/10 focus:border-[#d4af37]/50'
                      } ${error ? 'border-red-500/50' : ''}`}
                    />
                  ))}
                </div>

                {/* Message d'erreur */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs justify-center"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {/* Bouton de vérification */}
                <button
                  onClick={handleVerify}
                  disabled={verifying || otp.join('').length !== OTP_LENGTH}
                  className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Vérifier mon profil
                    </>
                  )}
                </button>

                {/* Séparateur */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-neutral-600 text-[10px] uppercase tracking-widest">
                    Code non reçu ?
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Renvoi du code */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resending}
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                      resendCooldown > 0
                        ? 'text-neutral-600 cursor-not-allowed'
                        : 'text-[#d4af37] hover:text-white'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    Renvoyer le code
                  </button>
                  {resendCooldown > 0 && (
                    <span className="text-neutral-600 text-xs font-mono tabular-nums">
                      {resendCooldown}s
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SUCCÈS
              ═══════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-[#d4af37]/20 shadow-[0_0_60px_rgba(212,175,55,0.1)] rounded-3xl p-8 sm:p-10 space-y-6">
                {/* Icône de succès animée */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8952e] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                >
                  <CheckCircle className="w-10 h-10 text-black" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                    Profil Vérifié !
                  </h2>
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto">
                    Votre identité a été confirmée avec succès. Vous pouvez
                    maintenant accéder à votre espace artiste et compléter votre
                    profil de candidature.
                  </p>
                </motion.div>

                {/* Stars décoratives */}
                <div className="flex items-center justify-center gap-1 pt-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, rotate: -180, scale: 0 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    >
                      <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4">
                  <Link
                    to="/artist"
                    className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Accéder à mon Espace Artiste
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/"
                    className="w-full py-3 rounded-xl border border-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/20 transition-all text-center"
                  >
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerifyProfile;
