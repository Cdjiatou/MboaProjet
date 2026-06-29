// =============================================================================
// COMPOSANT VoteModal — Formulaire simplifié avec détection d'opérateur
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { initiateVote, checkVoteStatus, type PaymentMethod } from '@/services/voteService';
import { getMediaUrl } from '@/utils/mediaUrl';
import type { Candidate } from '@/types';

const RATE_PER_VOTE = 100;

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
  const [amountStr, setAmountStr] = useState('');
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
      setAmountStr('');
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            className="relative z-10 w-full max-w-[400px] bg-[#0c0c0c] rounded-t-3xl sm:rounded-3xl border border-white/[0.06] shadow-2xl overflow-hidden"
          >
            {/* Header Candidat */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center gap-4 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                {candidatePhoto ? (
                  <img src={candidatePhoto} alt={candidateName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#d4af37] font-black">
                    {candidate.firstName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base truncate">{candidateName}</h3>
                <p className="text-neutral-400 text-xs">Voter pour soutenir ce candidat</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Choix Mode Paiement */}
                    <div className="flex p-1 bg-[#050505] border border-white/[0.06] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTab('mobile')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                          tab === 'mobile' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Mobile Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('card')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                          tab === 'card' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        Carte Bancaire
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      
                      {/* Section Téléphone (Si Mobile Money) */}
                      {tab === 'mobile' && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-neutral-400">Numéro de téléphone</label>
                          <div className="relative group">
                            <input
                              type="tel"
                              value={voterPhone}
                              onChange={(e) => setVoterPhone(e.target.value)}
                              placeholder="Ex: 6XXXXXXXX"
                              maxLength={9}
                              required
                              className="w-full bg-[#050505] border border-white/[0.08] focus:border-[#d4af37]/50 rounded-xl pl-5 pr-20 py-4 text-white text-lg font-medium outline-none transition-all focus:ring-4 focus:ring-[#d4af37]/10"
                            />
                            
                            {/* Affichage du logo Opérateur détecté à l'intérieur du champ */}
                            <AnimatePresence>
                              {operator && voterPhone.length === 9 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                  animate={{ opacity: 1, scale: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md"
                                >
                                  {operator === 'MTN_MOMO' ? (
                                    <img src="/images/operateurs/mtn.png" alt="MTN Mobile Money" className="h-8 w-12 object-contain rounded-sm drop-shadow-md" />
                                  ) : (
                                    <img src="/images/operateurs/orange.png" alt="Orange Money" className="h-8 w-12 object-contain rounded-sm drop-shadow-md" />
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Section Montant */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-400">Montant à payer (FCFA)</label>
                        <input
                          type="text"
                          value={amountStr}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setAmountStr(val);
                          }}
                          placeholder="Ex: 500"
                          required
                          className="w-full bg-[#050505] border border-white/[0.08] focus:border-[#d4af37]/50 rounded-xl px-5 py-4 text-white text-lg font-bold outline-none transition-all focus:ring-4 focus:ring-[#d4af37]/10"
                        />
                      </div>

                      {/* Récapitulatif du nombre de votes */}
                      <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-neutral-400 text-sm">Votes équivalents :</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-[#d4af37]">{votesCount}</span>
                          <span className="text-xs text-neutral-500 uppercase font-bold mt-1">Vote{votesCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={votesCount < 1 || (tab === 'mobile' && (!operator || voterPhone.length < 9))}
                        className="w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#e5c048] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Voter maintenant
                      </button>

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
                    className="py-12 flex flex-col items-center text-center space-y-4"
                  >
                    <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
                    <p className="text-sm text-neutral-300">{statusMessage}</p>
                  </motion.div>
                )}

                {/* Success */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 flex flex-col items-center text-center space-y-4"
                  >
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <p className="text-lg text-white font-bold">Paiement Réussi !</p>
                    <p className="text-sm text-emerald-400">{statusMessage}</p>
                    <button
                      onClick={onClose}
                      className="w-full mt-4 py-3 rounded-xl bg-white/10 text-white font-bold text-sm transition-all hover:bg-white/20"
                    >
                      Terminer
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
                    className="py-8 space-y-5"
                  >
                    <div className="flex flex-col items-center text-center gap-3 bg-red-500/10 p-5 rounded-xl border border-red-500/20">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                      <p className="text-sm text-red-400 font-medium">{statusMessage}</p>
                    </div>
                    <button
                      onClick={() => setStep('form')}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all"
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
