// =============================================================================
// PAGE VÉRIFICATION PROFIL — Interface OTP Premium pour Candidats
// Flux: Saisie du numéro + OTP → Légende (optionnelle) → Succès + Lien unique
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { verifyCandidateOtp, completeCandidateProfile, resendCandidateOtp } from '@/services/candidateService';
import { useThemeStore } from '@/store/useThemeStore';
import { useWordCount } from '@/hooks/useWordCount';
import { getApiErrorMessage } from '@/utils/apiError';
import { notifyCandidatesUpdated } from '@/hooks/usePublicCandidates';
import { getCandidateSessionToken, setCandidateSessionToken } from '@/services/api';
import ProfileSharePanel from '@/components/shared/ProfileSharePanel';
import { PhoneInput } from '@/components/shared/PhoneInput';

type Step = 'otp' | 'legend' | 'success' | 'invalid';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

// ─── Animation de secousse pour l'OTP invalide ──────────────────────────────
const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -6, 6, -2, 2, 0],
  transition: { duration: 0.5 },
};

// ─── Variation pour chaque case OTP ─────────────────────────────────────────
const otpInputVariants = {
  idle: { scale: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filled: { scale: 1, borderColor: 'rgba(212,175,55,0.6)' },
  error: { scale: 1, borderColor: 'rgba(239,68,68,0.7)' },
  focus: { scale: 1.05, borderColor: 'rgba(212,175,55,0.5)' },
};

// =============================================================================
const VerifyProfile = () => {
  const [step, setStep] = useState<Step>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [legend, setLegend] = useState('');
  const legendWordCount = useWordCount(legend);
  const [submitting, setSubmitting] = useState(false);
  const [uniqueLink, setUniqueLink] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [copied, setCopied] = useState(false);

  const setAuth = useThemeStore((state) => state.setAuth);
  const authToken = useThemeStore((state) => state.token);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Restaurer la session si déjà vérifiée
  useEffect(() => {
    if (getCandidateSessionToken()) {
      setStep('legend');
    }
  }, []);

  // Auto-focus premier input
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 250);
    }
  }, [step]);

  // Compte à rebours de renvoi
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── Gestion des inputs OTP ──────────────────────────────────────────────
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
    pasteData.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const focusIndex = Math.min(pasteData.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  // ─── Normalisation du numéro de téléphone ────────────────────────────────
  // Ajoute l'indicatif +237 si l'utilisateur ne l'a pas saisi,
  // pour correspondre au format stocké en base de données.
  const normalizePhone = (rawPhone: string): string => {
    const digits = rawPhone.replace(/\D/g, '');
    // Si l'utilisateur a déjà tapé 237XXXXXXXXX ou +237XXXXXXXXX
    if (digits.startsWith('237')) return `+${digits}`;
    // Sinon on ajoute l'indicatif camerounais
    return `+237${digits}`;
  };

  // ─── Vérification du code OTP ─────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Veuillez entrer le code complet à 6 chiffres.');
      triggerShake();
      return;
    }
    if (!phone.trim()) {
      setError('Veuillez saisir votre numéro de téléphone WhatsApp.');
      return;
    }

    setError('');
    setVerifying(true);

    try {
      const normalizedPhone = normalizePhone(phone);
      const res = await verifyCandidateOtp(normalizedPhone, code);
      if (res.success && res.data) {
        setCandidateSessionToken(res.data.token);
        const name = `${res.data.candidate.firstName} ${res.data.candidate.lastName}`;
        setCandidateName(name);
        setAuth(res.data.token, 'artist', {
          id: res.data.candidate.id,
          name,
          email: res.data.candidate.email,
          role: 'artist',
        });

        const slug = res.data.candidate.slug;
        if (slug) {
          setUniqueLink(`${window.location.origin}/candidats/${slug}`);
        }
        notifyCandidatesUpdated();

        if (res.data.candidate.biography?.trim()) {
          setCandidateSessionToken(null);
          setStep('success');
        } else {
          setStep('legend');
        }
      } else {
        setError(res.message || 'Code OTP ou numéro incorrect.');
        triggerShake();
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erreur lors de la vérification.'));
      triggerShake();
    } finally {
      setVerifying(false);
    }
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  // ─── Renvoi du code ────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || !phone.trim()) return;
    setOtp(new Array(OTP_LENGTH).fill(''));
    setError('');
    setResending(true);

    try {
      const normalizedPhone = normalizePhone(phone);
      await resendCandidateOtp(normalizedPhone);
      setResendCooldown(RESEND_COOLDOWN);
      setOtpSent(true);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Impossible de renvoyer le code. WhatsApp non connecté.'));
    } finally {
      setResending(false);
    }
  };

  // ─── Soumission de la légende ──────────────────────────────────────────────
  const handleSubmitLegend = async () => {
    if (legendWordCount > 300) {
      setError(`Maximum 300 mots (actuellement ${legendWordCount}).`);
      return;
    }

    const token = authToken || getCandidateSessionToken();
    if (!token) {
      setError('Session expirée. Veuillez vérifier à nouveau votre code OTP.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await completeCandidateProfile({ biography: legend }, token);
      if (res.success && res.data) {
        const c = res.data.candidate;
        if (c.slug) setUniqueLink(`${window.location.origin}/candidats/${c.slug}`);
        setCandidateName(`${c.firstName} ${c.lastName}`);
        setCandidateSessionToken(null);
        notifyCandidatesUpdated();
        setStep('success');
      } else {
        setError(res.message || 'Erreur lors de la complétion du profil.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erreur serveur.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Copie du lien ────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(uniqueLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // ─── Partage WhatsApp ─────────────────────────────────────────────────────
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `⭐ Votez pour ${candidateName} sur MBOA NEXT STAR ! Faites-moi gagner ! 🎤\n${uniqueLink}`
  )}`;

  // =============================================================================
  //  RENDU
  // =============================================================================
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#050505] text-white relative overflow-hidden flex items-center justify-center">
      {/* Décors de fond */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#d4af37]/[0.025] blur-[100px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#d4af37 1px, transparent 1px), linear-gradient(90deg, #d4af37 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-[420px] mx-auto px-4 sm:px-0 relative z-10">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════
              ÉTAPE : LIEN INVALIDE
          ══════════════════════════════════════════════ */}
          {step === 'invalid' && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="bg-[#0b0b0b]/70 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">Lien invalide</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Ce lien de vérification est invalide ou a expiré. Veuillez contacter l'administration de{' '}
                    <span className="text-[#d4af37] font-semibold">MBOA NEXT STAR</span> pour recevoir un nouveau lien.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link to="/contact" className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                    Contacter l'administration
                  </Link>
                  <Link to="/" className="w-full py-3 rounded-xl border border-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-all text-center">
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              ÉTAPE : SAISIE DU CODE OTP
          ══════════════════════════════════════════════ */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
            >
              {/* En-tête */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 mb-5"
                >
                  <ShieldCheck className="w-7 h-7 text-[#d4af37]" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-heading uppercase tracking-wide">
                  Vérifier mon{' '}
                  <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                    Profil
                  </span>
                </h1>
                <p className="text-neutral-400 mt-3 text-sm leading-relaxed max-w-sm mx-auto">
                  Saisissez votre numéro WhatsApp et le code à {OTP_LENGTH} chiffres envoyé sur votre téléphone.
                </p>
              </div>

              {/* Carte principale */}
              <div className="bg-[#0b0b0b]/70 backdrop-blur-xl border border-white/[0.07] shadow-[0_0_60px_rgba(212,175,55,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">

                {/* Numéro de téléphone */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                    Numéro WhatsApp
                  </label>
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>

                <div className="w-full h-px bg-white/[0.05]" />

                {/* Cases OTP */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-widest text-center">
                    Code de vérification (6 chiffres)
                  </label>

                  {/* Indicateur "code envoyé via WhatsApp" */}
                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-[#25D366] text-xs font-semibold"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Code renvoyé via WhatsApp
                    </motion.div>
                  )}

                  {/* Grille des cases OTP */}
                  <motion.div
                    animate={shaking ? shakeAnimation : {}}
                    className="flex justify-center gap-2 sm:gap-3"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                        className={`
                          w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 bg-[#050505] text-white outline-none transition-all duration-200 cursor-text
                          ${error
                            ? 'border-red-500/60 bg-red-900/10 text-red-400'
                            : digit
                              ? 'border-[#d4af37]/60 shadow-[0_0_12px_rgba(212,175,55,0.12)] text-[#d4af37]'
                              : 'border-white/[0.08] focus:border-[#d4af37]/50 focus:shadow-[0_0_10px_rgba(212,175,55,0.08)]'
                          }
                        `}
                      />
                    ))}
                  </motion.div>
                </div>

                {/* Message d'erreur */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-500/[0.07] border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bouton de vérification */}
                <button
                  onClick={handleVerify}
                  disabled={verifying || otp.join('').length !== OTP_LENGTH || !phone.trim()}
                  className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Vérifier mon profil
                    </>
                  )}
                </button>

                {/* Séparateur */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-neutral-600 text-[10px] uppercase tracking-widest">Code non reçu ?</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>

                {/* Renvoi du code avec compte à rebours */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resending || !phone.trim()}
                    className={`flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${
                      resendCooldown > 0 || !phone.trim()
                        ? 'text-neutral-600 cursor-not-allowed'
                        : 'text-[#d4af37] hover:text-white'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Renvoi en cours...' : 'Renvoyer le code via WhatsApp'}
                  </button>

                  {resendCooldown > 0 && (
                    <motion.div
                      key={resendCooldown}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-neutral-500 text-xs font-mono tabular-nums bg-white/[0.04] px-2.5 py-1 rounded-lg"
                    >
                      {resendCooldown}s
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              ÉTAPE : SAISIE DE LA LÉGENDE
          ══════════════════════════════════════════════ */}
          {step === 'legend' && (
            <motion.div
              key="legend"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 mb-5"
                >
                  <Star className="w-7 h-7 text-[#d4af37]" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-heading uppercase tracking-wide">
                  Ma <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Légende</span>
                </h1>
                <p className="text-neutral-400 mt-3 text-sm leading-relaxed max-w-sm mx-auto">
                  Votre profil est actif ! Ajoutez votre légende pour le compléter — cette étape est optionnelle.
                </p>
              </div>

              <div className="bg-[#0b0b0b]/70 backdrop-blur-xl border border-white/[0.07] rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                      Votre légende
                    </label>
                    <span className={`text-xs font-mono tabular-nums ${legendWordCount > 300 ? 'text-red-400 font-bold' : legendWordCount > 250 ? 'text-amber-400' : 'text-neutral-600'}`}>
                      {legendWordCount} / 300 mots
                    </span>
                  </div>
                  <textarea
                    value={legend}
                    onChange={(e) => { setLegend(e.target.value); setError(''); }}
                    placeholder="Présentez-vous en quelques mots... (maximum 300 mots)"
                    rows={6}
                    className={`
                      w-full px-5 py-4 bg-[#050505] border rounded-2xl text-white text-sm placeholder:text-neutral-600
                      focus:outline-none transition-all resize-none
                      ${legendWordCount > 300
                        ? 'border-red-500/40 focus:border-red-500/60'
                        : 'border-white/[0.07] focus:border-[#d4af37]/40'
                      }
                    `}
                  />
                  {/* Barre de progression */}
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-all ${legendWordCount > 300 ? 'bg-red-500' : legendWordCount > 200 ? 'bg-amber-500' : 'bg-[#d4af37]'}`}
                      animate={{ width: `${Math.min((legendWordCount / 300) * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-400 text-xs bg-red-500/[0.07] border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleSubmitLegend}
                  disabled={submitting || legendWordCount > 300}
                  className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Enregistrement...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Enregistrer ma légende</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setCandidateSessionToken(null); setStep('success'); }}
                  className="w-full py-3 rounded-xl border border-white/[0.07] text-neutral-500 text-xs font-semibold uppercase tracking-widest hover:text-neutral-300 hover:border-white/[0.15] transition-all"
                >
                  Passer cette étape
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              ÉTAPE : SUCCÈS CINÉMATIQUE
          ══════════════════════════════════════════════ */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Confetti / particules dorées */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 400, opacity: 0, scale: 0 }}
                    animate={{ y: 600, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], rotate: Math.random() * 360 }}
                    transition={{ duration: 2 + Math.random(), delay: Math.random() * 1.2, ease: 'easeOut' }}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{ backgroundColor: i % 3 === 0 ? '#d4af37' : i % 3 === 1 ? '#fff3c4' : '#b8952e', left: `${(i / 12) * 100}%` }}
                  />
                ))}
              </div>

              <div className="bg-[#0b0b0b]/70 backdrop-blur-xl border border-[#d4af37]/20 shadow-[0_0_80px_rgba(212,175,55,0.12)] rounded-3xl p-8 sm:p-10 space-y-6 text-center">

                {/* Icône animée */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.2 }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#d4af37] via-[#f0d060] to-[#b8952e] flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                >
                  <CheckCircle className="w-12 h-12 text-black" />
                </motion.div>

                {/* Texte de félicitation */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Profil activé !</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                    Félicitations{candidateName ? `, ${candidateName.split(' ')[0]}` : ''} !
                  </h2>
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto mt-3">
                    Votre profil est maintenant visible sur le site. Partagez votre lien unique pour recevoir le maximum de votes !
                  </p>
                </motion.div>

                {/* Stars décoratives */}
                <motion.div
                  className="flex items-center justify-center gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8 + i * 0.08, type: 'spring' }}
                    >
                      <Star className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Lien unique */}
                {uniqueLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Votre lien unique</p>

                    {/* Zone de lien cliquable */}
                    <div className="relative group bg-[#050505] border border-[#d4af37]/25 hover:border-[#d4af37]/50 rounded-2xl p-4 flex items-center gap-3 transition-all cursor-pointer" onClick={handleCopyLink}>
                      <p className="flex-1 text-[#d4af37] text-xs font-mono break-all text-left">{uniqueLink}</p>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-[#d4af37] text-black hover:bg-[#b8952e]'}`}
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Check className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Copy className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>

                    {/* Feedback "Copié !" */}
                    <AnimatePresence>
                      {copied && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-emerald-400 text-xs font-semibold"
                        >
                          ✓ Lien copié dans le presse-papiers !
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Boutons de partage rapide */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {/* WhatsApp */}
                      <a
                        href={whatsappShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] text-xs font-bold rounded-xl hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>

                      {/* Partage natif ou copie */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (typeof navigator !== 'undefined' && 'share' in navigator) {
                            try {
                              await navigator.share({
                                title: `Votez pour ${candidateName}`,
                                text: `⭐ Votez pour ${candidateName} sur MBOA NEXT STAR !`,
                                url: uniqueLink,
                              });
                            } catch { /* annulé */ }
                          } else {
                            handleCopyLink();
                          }
                        }}
                        className="flex items-center justify-center gap-2 py-3 bg-white/[0.04] border border-white/[0.08] text-neutral-300 text-xs font-bold rounded-xl hover:bg-white/[0.07] hover:border-white/[0.14] transition-all"
                      >
                        <Share2 className="w-4 h-4" />
                        Partager
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div
                  className="flex flex-col gap-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Link
                    to={uniqueLink ? uniqueLink.replace(window.location.origin, '') : '/candidats'}
                    className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    Voir mon profil <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/"
                    className="w-full py-3 rounded-xl border border-white/[0.07] text-neutral-500 text-xs font-semibold uppercase tracking-widest hover:text-neutral-300 hover:border-white/[0.15] transition-all text-center"
                  >
                    Retour à l'accueil
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerifyProfile;
