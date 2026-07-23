// =============================================================================
// COMPOSANT VoteModal — Formulaire glassmorphism premium & ergonomique
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Loader2, CreditCard, Smartphone, Zap, Sparkles } from 'lucide-react';
import { initiateVote, checkVoteStatus, type PaymentMethod } from '@/services/voteService';
import { getMediaUrl } from '@/utils/mediaUrl';
import type { Candidate } from '@/types';

const RATE_PER_VOTE = 100;

// Montants prédéfinis pour une ergonomie maximale
const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

// Logique de détection d'opérateur mobile au Cameroun
const detectOperator = (phone: string): 'MTN_MOMO' | 'ORANGE_MOMO' | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 2) {
    const prefix2 = cleanPhone.substring(0, 2);
    const prefix3 = cleanPhone.substring(0, 3);
    
    // MTN: 67, 68, 650-654
    if (['67', '68'].includes(prefix2) || ['650', '651', '652', '653', '654'].includes(prefix3)) {
      return 'MTN_MOMO';
    }
    
    // Orange: 69, 655-659
    if (['69'].includes(prefix2) || ['655', '656', '657', '658', '659'].includes(prefix3)) {
      return 'ORANGE_MOMO';
    }
  }
  return null;
};

type PaymentTab = 'mobile' | 'card';
type Step = 'form' | 'processing' | 'success' | 'error';

interface Props {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess: () => void;
}

export const VoteModal: React.FC<Props> = ({ candidate, isOpen, onClose, onVoteSuccess }) => {
  const [step, setStep] = useState<Step>('form');
  const [tab, setTab] = useState<PaymentTab>('mobile');
  
  const [voterPhone, setVoterPhone] = useState('');
  const [amountStr, setAmountStr] = useState('500'); // Montant par défaut 500 FCFA
  const [statusMessage, setStatusMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amount = parseInt(amountStr) || 0;
  const votesCount = Math.floor(amount / RATE_PER_VOTE);
  const operator = detectOperator(voterPhone);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setTab('mobile');
      setVoterPhone('');
      setAmountStr('500');
      setStatusMessage('');
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [isOpen]);

  const startPolling = (paymentReference: string) => {
    setStep('processing');
    setStatusMessage(
      tab === 'card'
        ? 'Finalisez le paiement dans la fenêtre sécurisée...'
        : 'Validez la transaction sur votre téléphone...'
    );

    let attempts = 0;
    const maxAttempts = 30;

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setStep('error');
        setStatusMessage('Délai dépassé. Vérifiez votre téléphone ou réessayez.');
        return;
      }

      try {
        const statusRes = await checkVoteStatus(paymentReference);
        if (statusRes.success && statusRes.data) {
          const paymentStatus = statusRes.data.status;
          if (paymentStatus === 'SUCCESS') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setStep('success');
            setStatusMessage(`Vos ${votesCount} votes ont été enregistrés avec succès !`);
            onVoteSuccess();
          } else if (paymentStatus === 'FAILED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setStep('error');
            setStatusMessage('Le paiement a échoué ou a été annulé.');
          }
        }
      } catch {
        // silently retry
      }
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (votesCount < 1) return;
    
    let paymentMethod: PaymentMethod = 'CARD';
    if (tab === 'mobile') {
      if (!operator) {
        setStep('error');
        setStatusMessage("Opérateur non reconnu. Vérifiez le numéro de téléphone.");
        return;
      }
      paymentMethod = operator;
      if (voterPhone.replace(/\D/g, '').length < 9) return;
    }

    setStep('processing');
    setStatusMessage('Connexion sécurisée en cours...');

    try {
      const res = await initiateVote({
        candidateId: candidate.id,
        voterIdentifier: tab === 'mobile' ? voterPhone : `card_${Date.now()}`,
        amount,
        paymentMethod,
      });

      if (res.success && res.data?.vote) {
        const { vote, paymentUrl } = res.data;
        if (paymentMethod === 'CARD' && paymentUrl) {
          window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        }
        startPolling(vote.paymentReference);
      } else {
        setStep('error');
        setStatusMessage(res.message || 'Une erreur est survenue.');
      }
    } catch (err: unknown) {
      setStep('error');
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      setStatusMessage(error.response?.data?.message || error.response?.data?.error || 'Erreur de connexion.');
    }
  };

  const candidateName = `${candidate.firstName} ${candidate.lastName || ''}`.trim();
  const candidatePhoto = getMediaUrl(candidate.profilePhoto, candidate.updatedAt);
  const canSubmit = votesCount >= 1 && (tab === 'card' || (operator && voterPhone.replace(/\D/g, '').length >= 9));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 w-full sm:max-w-[440px] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-[#d4af37]/30 shadow-[0_32px_80px_rgba(0,0,0,0.8)] bg-[#0d0d12]/95 backdrop-blur-2xl"
          >
            {/* Barre visuelle dorée supérieure */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

            {/* Drag Handle Mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            {/* En-tête Candidat */}
            <div className="px-5 pt-4 pb-4 flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-[#d4af37]/40 shadow-lg shadow-[#d4af37]/15">
                  {candidatePhoto ? (
                    <img src={candidatePhoto} alt={candidateName} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-black text-lg">
                      {candidate.firstName?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-black text-base truncate leading-tight">{candidateName}</h3>
                  <p className="text-[#d4af37] text-xs font-semibold mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 inline" /> Voter pour soutenir ce candidat
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="px-5 pb-6 pt-5">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Tabs de Paiement */}
                    <div className="flex p-1.5 rounded-2xl gap-1.5 bg-black/40 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setTab('mobile')}
                        className={`relative flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                          tab === 'mobile'
                            ? 'text-black shadow-lg shadow-[#d4af37]/20 bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#b8952e]'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Mobile Money
                      </button>

                      <button
                        type="button"
                        onClick={() => setTab('card')}
                        className={`relative flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                          tab === 'card'
                            ? 'text-black shadow-lg shadow-[#d4af37]/20 bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#b8952e]'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        Carte Bancaire
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Champ Numéro (Mobile Money) */}
                      {tab === 'mobile' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider pl-1 flex items-center justify-between">
                            <span>Numéro de téléphone</span>
                            <span className="text-[10px] text-neutral-500 font-normal">MTN / Orange</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={voterPhone}
                              onChange={(e) => setVoterPhone(e.target.value)}
                              placeholder="Ex: 671234567"
                              maxLength={9}
                              required
                              className="w-full rounded-2xl pl-4 pr-20 py-3.5 bg-white/[0.06] border border-white/10 text-white text-base font-bold outline-none transition-all placeholder:text-neutral-500 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                            />
                            {/* Logo opérateur détecté */}
                            <AnimatePresence>
                              {operator && voterPhone.length === 9 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/60 rounded-xl px-2 py-1 border border-white/10"
                                >
                                  {operator === 'MTN_MOMO' ? (
                                    <span className="text-[10px] font-black text-amber-400 tracking-wider">MTN MOMO</span>
                                  ) : (
                                    <span className="text-[10px] font-black text-orange-400 tracking-wider">ORANGE</span>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Champ Montant */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider pl-1">
                          Montant du don / vote (FCFA)
                        </label>
                        <input
                          type="text"
                          value={amountStr}
                          onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ''))}
                          placeholder="Saisissez ou choisissez ci-dessous"
                          required
                          className="w-full rounded-2xl px-4 py-3.5 bg-white/[0.06] border border-white/10 text-white text-lg font-black outline-none transition-all placeholder:text-neutral-500 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                        />

                        {/* Puces de sélection rapide du montant (Chips Ergonomiques) */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {PRESET_AMOUNTS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAmountStr(preset.toString())}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                amount === preset
                                  ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-md shadow-[#d4af37]/20 scale-105'
                                  : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              {preset.toLocaleString('fr-FR')} FCFA
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Récapitulatif des Votes Equivalent */}
                      <div className="rounded-2xl px-4 py-3.5 bg-gradient-to-r from-[#d4af37]/15 via-[#d4af37]/10 to-transparent border border-[#d4af37]/30 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                            <Zap className="w-4 h-4 fill-[#d4af37]" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs">Votes attribués</p>
                            <p className="text-neutral-400 text-[10px]">100 FCFA = 1 Vote</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#ffe58f] via-[#d4af37] to-[#b8952e] bg-clip-text text-transparent">
                            {votesCount}
                          </span>
                          <span className="text-xs text-[#d4af37] font-black uppercase">
                            Vote{votesCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Bouton de Soumission Principal */}
                      <motion.button
                        whileHover={canSubmit ? { scale: 1.02 } : {}}
                        whileTap={canSubmit ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-xl ${
                          canSubmit
                            ? 'bg-gradient-to-r from-[#d4af37] via-[#f0cc55] to-[#b8952e] text-black shadow-[#d4af37]/30 cursor-pointer'
                            : 'bg-white/10 text-neutral-400 border border-white/10 cursor-not-allowed opacity-60'
                        }`}
                      >
                        Voter Maintenant ({amount ? `${amount.toLocaleString('fr-FR')} FCFA` : '0 FCFA'})
                      </motion.button>

                      <p className="text-center text-[10px] text-neutral-400 font-medium">
                        🔒 Paiement 100% sécurisé par Mobile Money ou Carte
                      </p>
                    </form>
                  </motion.div>
                )}

                {/* Étape : Processing */}
                {step === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-black text-base mb-1">Traitement en cours...</p>
                      <p className="text-neutral-300 text-xs max-w-[280px] leading-relaxed">{statusMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Étape : Succès */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle className="w-9 h-9 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xl text-white font-black mb-1">Vote Confirmé ! 🎉</p>
                      <p className="text-sm text-emerald-400 font-medium">{statusMessage}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full mt-2 py-3.5 rounded-2xl text-black font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#d4af37] to-[#b8952e] shadow-lg shadow-[#d4af37]/20 transition-all"
                    >
                      Terminer
                    </button>
                  </motion.div>
                )}

                {/* Étape : Erreur */}
                {step === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 space-y-4"
                  >
                    <div className="flex flex-col items-center text-center gap-3 rounded-2xl p-5 bg-red-500/10 border border-red-500/30">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                      <p className="text-sm text-red-400 font-medium">{statusMessage}</p>
                    </div>
                    <button
                      onClick={() => setStep('form')}
                      className="w-full py-3.5 rounded-2xl text-white text-sm font-bold bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
                    >
                      Réessayer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoteModal;

