// =============================================================================
// COMPOSANT VoteModal — Paiement Mavians (MTN / Orange / Carte) dès 100 FCFA
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, CheckCircle, AlertTriangle, Loader2, CreditCard, Minus, Plus } from 'lucide-react';
import { initiateVote, checkVoteStatus, type PaymentMethod } from '@/services/voteService';
import type { Candidate } from '@/types';

const MIN_AMOUNT = 100;

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  logo: string;
}[] = [
  {
    id: 'MTN_MOMO',
    label: 'MTN Mobile Money',
    sublabel: 'Paiement via MoMo',
    logo: '/images/payments/mtn-momo.svg',
  },
  {
    id: 'ORANGE_MOMO',
    label: 'Orange Money',
    sublabel: 'Paiement via Orange',
    logo: '/images/payments/orange-money.svg',
  },
  {
    id: 'CARD',
    label: 'Carte bancaire',
    sublabel: 'Visa / Mastercard',
    logo: '/images/payments/card.svg',
  },
];

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

interface Props {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess: () => void;
}

export const VoteModal: React.FC<Props> = ({ candidate, isOpen, onClose, onVoteSuccess }) => {
  const [amount, setAmount] = useState(MIN_AMOUNT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [voterPhone, setVoterPhone] = useState('');
  const [voteStatus, setVoteStatus] = useState<'idle' | 'loading' | 'polling' | 'success' | 'error'>('idle');
  const [voteMessage, setVoteMessage] = useState('');

  const votesCount = Math.floor(amount / MIN_AMOUNT);
  const needsPhone = paymentMethod !== 'CARD';

  useEffect(() => {
    if (!isOpen) {
      setAmount(MIN_AMOUNT);
      setPaymentMethod(null);
      setVoterPhone('');
      setVoteStatus('idle');
      setVoteMessage('');
    }
  }, [isOpen]);

  const adjustAmount = (delta: number) => {
    setAmount((prev) => Math.max(MIN_AMOUNT, prev + delta));
  };

  const startPolling = (paymentReference: string) => {
    setVoteStatus('polling');
    setVoteMessage('Paiement initié ! Validez la transaction sur votre téléphone ou suivez les instructions...');

    let attempts = 0;
    const maxAttempts = 25;

    const intervalId = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(intervalId);
        setVoteStatus('error');
        setVoteMessage('Délai dépassé. Vérifiez si le paiement a été débité avant de réessayer.');
        return;
      }

      try {
        const statusRes = await checkVoteStatus(paymentReference);
        if (statusRes.success && statusRes.data) {
          const paymentStatus = statusRes.data.status;
          if (paymentStatus === 'SUCCESS') {
            clearInterval(intervalId);
            setVoteStatus('success');
            setVoteMessage(
              votesCount > 1
                ? `Merci ! ${votesCount} votes enregistrés pour ${candidate.firstName}.`
                : 'Félicitations ! Votre vote a été enregistré avec succès.'
            );
            onVoteSuccess();
          } else if (paymentStatus === 'FAILED') {
            clearInterval(intervalId);
            setVoteStatus('error');
            setVoteMessage('Le paiement a échoué ou a été annulé.');
          }
        }
      } catch (pollErr) {
        console.error('Erreur polling vote:', pollErr);
      }
    }, 3000);
  };

  const handleVote = async () => {
    if (!paymentMethod) return;
    if (needsPhone && voterPhone.replace(/\D/g, '').length < 9) return;

    setVoteStatus('loading');
    setVoteMessage('Connexion à Mavians (Smobilpay)...');

    try {
      const res = await initiateVote({
        candidateId: candidate.id,
        voterIdentifier: needsPhone ? voterPhone : `card_${Date.now()}`,
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
        setVoteStatus('error');
        setVoteMessage(res.message || 'Une erreur est survenue.');
      }
    } catch (err: unknown) {
      setVoteStatus('error');
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      setVoteMessage(error.response?.data?.message || error.response?.data?.error || 'Erreur de connexion.');
    }
  };

  const canSubmit =
    paymentMethod &&
    amount >= MIN_AMOUNT &&
    amount % MIN_AMOUNT === 0 &&
    (!needsPhone || voterPhone.replace(/\D/g, '').length >= 9);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#0b0b0b]/95 border border-[#d4af37]/20 p-6 text-white max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold">Voter pour {candidate.firstName}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Paiement sécurisé via Mavians</p>
              </div>
              <button onClick={onClose} className="p-1 hover:text-[#d4af37] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {voteStatus === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                <p className="text-emerald-400 font-semibold">{voteMessage}</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl hover:bg-[#b8952e] transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : voteStatus === 'loading' || voteStatus === 'polling' ? (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-[#d4af37] animate-spin mx-auto" />
                <p className="text-sm text-neutral-400 animate-pulse">{voteMessage}</p>
                {paymentMethod === 'CARD' && voteStatus === 'polling' && (
                  <p className="text-xs text-neutral-500">Finalisez le paiement dans l'onglet ouvert, puis revenez ici.</p>
                )}
              </div>
            ) : voteStatus === 'error' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{voteMessage}</p>
                </div>
                <button
                  onClick={() => setVoteStatus('idle')}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Montant */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 block">
                    Montant du vote (min. 100 FCFA)
                  </label>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <button
                      type="button"
                      onClick={() => adjustAmount(-100)}
                      disabled={amount <= MIN_AMOUNT}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/10"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <span className="text-3xl font-black bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
                        {amount.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-neutral-500 text-sm ml-1">FCFA</span>
                      <p className="text-[10px] text-neutral-600 mt-1">
                        = {votesCount} vote{votesCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustAmount(100)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          amount === preset
                            ? 'bg-[#d4af37] text-black'
                            : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                      >
                        {preset} F
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 block">
                    Mode de paiement
                  </label>
                  <div className="space-y-2">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          paymentMethod === opt.id
                            ? 'border-[#d4af37] bg-[#d4af37]/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <img
                          src={opt.logo}
                          alt={opt.label}
                          className="h-10 w-24 object-contain object-left shrink-0"
                        />
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{opt.label}</p>
                          <p className="text-[10px] text-neutral-500">{opt.sublabel}</p>
                        </div>
                        {opt.id === 'CARD' && (
                          <CreditCard className="w-5 h-5 text-neutral-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Téléphone Mobile Money */}
                {paymentMethod && needsPhone && (
                  <div>
                    <label className="text-sm font-semibold text-neutral-400 mb-2 block">
                      Numéro {paymentMethod === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="tel"
                        placeholder="Ex: 677123456"
                        value={voterPhone}
                        onChange={(e) => setVoterPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-2">
                      Vous recevrez une demande de confirmation sur ce numéro.
                    </p>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <p className="text-xs text-neutral-500 bg-white/[0.03] border border-white/10 rounded-xl p-3">
                    Vous serez redirigé vers la page de paiement sécurisée Mavians pour saisir votre carte bancaire.
                  </p>
                )}

                <button
                  onClick={handleVote}
                  disabled={!canSubmit}
                  className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-wider text-sm rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Payer {amount.toLocaleString('fr-FR')} FCFA
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
