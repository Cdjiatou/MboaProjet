// =============================================================================
// COMPOSANT VoteModal — Formulaire glassmorphism premium redesigné
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Loader2, CreditCard, Smartphone, Zap } from 'lucide-react';
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
  const canSubmit = votesCount >= 1 && (tab === 'card' || (operator && voterPhone.length >= 9));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 18, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
            }}
          >
            {/* Ligne de drag mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-5 pt-4 pb-4 flex items-center gap-3.5 border-b border-white/[0.05]">
              {/* Photo candidat */}
              <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-[#d4af37]/30 shadow-lg shadow-[#d4af37]/10">
                {candidatePhoto ? (
                  <img src={candidatePhoto} alt={candidateName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 flex items-center justify-center text-[#d4af37] font-black text-lg">
                    {candidate.firstName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm sm:text-base truncate leading-tight">{candidateName}</h3>
                <p className="text-[#d4af37]/70 text-[11px] mt-0.5">Voter pour soutenir ce candidat</p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 pt-4">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-4"
                  >
                    {/* Tabs paiement */}
                    <div
                      className="flex p-1 rounded-2xl gap-1"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {(['mobile', 'card'] as PaymentTab[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTab(t)}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                            tab === t
                              ? 'text-black shadow-lg'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          style={tab === t ? { background: 'linear-gradient(135deg, #d4af37, #b8952e)' } : {}}
                        >
                          {t === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                          {t === 'mobile' ? 'Mobile Money' : 'Carte Bancaire'}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      {/* Téléphone (Mobile Money uniquement) */}
                      {tab === 'mobile' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">
                            Numéro de téléphone
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={voterPhone}
                              onChange={(e) => setVoterPhone(e.target.value)}
                              placeholder="Ex: 6XXXXXXXX"
                              maxLength={9}
                              required
                              className="w-full rounded-2xl pl-4 pr-20 py-3.5 text-white text-base font-medium outline-none transition-all placeholder:text-neutral-600"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.border = '1px solid rgba(212,175,55,0.5)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                            {/* Badge opérateur */}
                            <AnimatePresence>
                              {operator && voterPhone.length === 9 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, x: 8 }}
                                  animate={{ opacity: 1, scale: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl overflow-hidden"
                                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 6px' }}
                                >
                                  {operator === 'MTN_MOMO' ? (
                                    <img src="/images/operateurs/mtn.png" alt="MTN" className="h-7 w-10 object-contain" />
                                  ) : (
                                    <img src="/images/operateurs/orange.png" alt="Orange" className="h-7 w-10 object-contain" />
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Montant */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">
                          Montant (FCFA)
                        </label>
                        <input
                          type="text"
                          value={amountStr}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setAmountStr(val);
                          }}
                          placeholder="Ex: 500"
                          required
                          className="w-full rounded-2xl px-4 py-3.5 text-white text-base font-bold outline-none transition-all placeholder:text-neutral-600"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(212,175,55,0.5)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>

                      {/* Récap votes */}
                      <div
                        className="rounded-2xl px-4 py-3 flex items-center justify-between"
                        style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span className="text-neutral-400 text-sm">Votes équivalents</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-2xl font-black transition-all ${votesCount > 0 ? 'text-[#d4af37]' : 'text-neutral-600'}`}>
                            {votesCount}
                          </span>
                          <span className="text-[10px] text-neutral-500 uppercase font-bold mt-1">
                            Vote{votesCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Bouton soumettre */}
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-200 relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
                        style={canSubmit ? {
                          background: 'linear-gradient(135deg, #d4af37 0%, #f0cc55 50%, #b8952e 100%)',
                          color: '#000',
                          boxShadow: '0 8px 32px rgba(212,175,55,0.4)',
                        } : {
                          background: 'rgba(212,175,55,0.15)',
                          color: 'rgba(212,175,55,0.4)',
                          border: '1px solid rgba(212,175,55,0.2)',
                        }}
                      >
                        Voter Maintenant
                      </button>

                      <p className="text-center text-[10px] text-neutral-600">
                        100 FCFA = 1 vote · Paiement sécurisé
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
                    className="py-14 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm mb-1">Paiement en cours</p>
                      <p className="text-neutral-400 text-xs max-w-[260px]">{statusMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Success */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-lg text-white font-bold mb-1">Paiement Réussi !</p>
                      <p className="text-sm text-emerald-400">{statusMessage}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full mt-2 py-3.5 rounded-2xl text-white font-bold text-sm transition-all"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                    className="py-6 space-y-4"
                  >
                    <div className="flex flex-col items-center text-center gap-3 rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                      <p className="text-sm text-red-400 font-medium">{statusMessage}</p>
                    </div>
                    <button
                      onClick={() => setStep('form')}
                      className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
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
