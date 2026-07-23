// =============================================================================
// COMPOSANT VoteModal — Formulaire de vote minimaliste, élégant & ergonomique
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Loader2, CreditCard, Smartphone, Zap } from 'lucide-react';
import { initiateVote, checkVoteStatus, type PaymentMethod } from '@/services/voteService';
import { getMediaUrl } from '@/utils/mediaUrl';
import type { Candidate } from '@/types';

const RATE_PER_VOTE = 100;

// Presets de vote rapides et épurés (FCFA)
const PRESETS = [
  { label: '5 votes', amount: 500 },
  { label: '10 votes', amount: 1000 },
  { label: '20 votes', amount: 2000 },
  { label: '50 votes', amount: 5000 },
];

// Logique de détection d'opérateur mobile au Cameroun
const detectOperator = (phone: string): 'MTN_MOMO' | 'ORANGE_MOMO' | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 2) {
    const prefix2 = cleanPhone.substring(0, 2);
    const prefix3 = cleanPhone.substring(0, 3);
    
    if (['67', '68'].includes(prefix2) || ['650', '651', '652', '653', '654'].includes(prefix3)) {
      return 'MTN_MOMO';
    }
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
  const [amountStr, setAmountStr] = useState('500');
  const [statusMessage, setStatusMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amount = parseInt(amountStr) || 0;
  const votesCount = Math.floor(amount / RATE_PER_VOTE);
  const operator = detectOperator(voterPhone);

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
        setStatusMessage("Opérateur non reconnu. Vérifiez le numéro.");
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
            className="absolute inset-0 bg-black/85 backdrop-blur-lg"
            onClick={onClose}
          />

          {/* Modal Épuré & Élégan */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full sm:max-w-[390px] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f14]/90 backdrop-blur-2xl"
          >
            {/* Header minimaliste */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-[#d4af37]/40 shadow-md">
                  {candidatePhoto ? (
                    <img src={candidatePhoto} alt={candidateName} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-black">
                      {candidate.firstName?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm truncate">{candidateName}</h3>
                  <p className="text-neutral-400 text-xs truncate">Formulaire de vote</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps du Formulaire */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Tabs Minimalistes */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setTab('mobile')}
                        className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                          tab === 'mobile'
                            ? 'bg-[#d4af37] text-black shadow-md'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Mobile Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('card')}
                        className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                          tab === 'card'
                            ? 'bg-[#d4af37] text-black shadow-md'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Carte
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Numéro de téléphone */}
                      {tab === 'mobile' && (
                        <div>
                          <div className="relative">
                            <input
                              type="tel"
                              value={voterPhone}
                              onChange={(e) => setVoterPhone(e.target.value)}
                              placeholder="Numéro (ex: 671234567)"
                              maxLength={9}
                              required
                              className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white text-sm font-semibold outline-none focus:border-[#d4af37] transition-all placeholder:text-neutral-500"
                            />
                            {operator && voterPhone.length === 9 && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#d4af37] uppercase bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/30">
                                {operator === 'MTN_MOMO' ? 'MTN' : 'ORANGE'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Choix des Votes / Montant */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {PRESETS.map((preset) => (
                            <button
                              key={preset.amount}
                              type="button"
                              onClick={() => setAmountStr(preset.amount.toString())}
                              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                amount === preset.amount
                                  ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                              }`}
                            >
                              <div>{preset.label}</div>
                              <div className="text-[9px] font-normal text-neutral-400">{preset.amount} F</div>
                            </button>
                          ))}
                        </div>

                        {/* Champ de saisie personnalisée du montant */}
                        <div className="relative">
                          <input
                            type="text"
                            value={amountStr}
                            onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ''))}
                            placeholder="Autre montant (FCFA)"
                            required
                            className="w-full rounded-xl px-4 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-bold outline-none focus:border-[#d4af37] transition-all placeholder:text-neutral-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">
                            FCFA
                          </span>
                        </div>
                      </div>

                      {/* Bouton de confirmation épuré */}
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                          canSubmit
                            ? 'bg-[#d4af37] text-black hover:bg-[#e5c158] shadow-[#d4af37]/20 active:scale-[0.99]'
                            : 'bg-white/10 text-neutral-500 border border-white/5 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        Voter • {votesCount} Vote{votesCount > 1 ? 's' : ''} ({amount ? amount.toLocaleString('fr-FR') : 0} F)
                      </button>

                      <p className="text-center text-[10px] text-neutral-500 font-medium">
                        100 FCFA = 1 vote • Paiement sécurisé
                      </p>
                    </form>
                  </motion.div>
                )}

                {/* Processing */}
                {step === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 flex flex-col items-center text-center space-y-3"
                  >
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                    <div>
                      <p className="text-white font-bold text-sm">Traitement du vote</p>
                      <p className="text-neutral-400 text-xs mt-1">{statusMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Success */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white font-black text-base">Vote Validé !</p>
                      <p className="text-emerald-400 text-xs mt-1 font-medium">{statusMessage}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full mt-2 py-3 rounded-xl text-black font-bold text-xs uppercase bg-[#d4af37] hover:bg-[#e5c158]"
                    >
                      Fermer
                    </button>
                  </motion.div>
                )}

                {/* Error */}
                {step === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-4 space-y-3"
                  >
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                      <p className="text-xs text-red-400 font-medium">{statusMessage}</p>
                    </div>
                    <button
                      onClick={() => setStep('form')}
                      className="w-full py-3 rounded-xl text-white text-xs font-bold bg-white/10 border border-white/10 hover:bg-white/20"
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


