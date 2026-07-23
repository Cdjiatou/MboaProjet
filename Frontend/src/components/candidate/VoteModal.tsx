// =============================================================================
// COMPOSANT VoteModal — Formulaire de vote minimaliste, élégant & ergonomique
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Loader2, CreditCard, Smartphone, ArrowLeft, ArrowRight, ShieldCheck, Mail, Zap, Star } from 'lucide-react';
import { initiateVote, checkVoteStatus, type PaymentMethod } from '@/services/voteService';
import { getMediaUrl } from '@/utils/mediaUrl';
import type { Candidate } from '@/types';

const RATE_PER_VOTE = 100;

// Presets de vote simples et clairs
const PRESETS = [
  { label: '5 votes', amount: 500 },
  { label: '10 votes', amount: 1000 },
  { label: '20 votes', amount: 2000 },
  { label: '50 votes', amount: 5000 },
  { label: '100 votes', amount: 10000 },
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

type PaymentOption = 'MTN_MOMO' | 'ORANGE_MOMO' | 'CARD';
type FormStep = 'select_votes' | 'payment_details' | 'processing' | 'success' | 'error';

interface Props {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess: () => void;
}

export const VoteModal: React.FC<Props> = ({ candidate, isOpen, onClose, onVoteSuccess }) => {
  const [formStep, setFormStep] = useState<FormStep>('select_votes');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('MTN_MOMO');
  
  const [voterPhone, setVoterPhone] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [amountStr, setAmountStr] = useState('1000');
  const [statusMessage, setStatusMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amount = parseInt(amountStr) || 0;
  const votesCount = Math.floor(amount / RATE_PER_VOTE);
  const detectedOp = detectOperator(voterPhone);

  useEffect(() => {
    if (!isOpen) {
      setFormStep('select_votes');
      setPaymentOption('MTN_MOMO');
      setVoterPhone('');
      setVoterEmail('');
      setAmountStr('1000');
      setStatusMessage('');
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [isOpen]);

  const startPolling = (paymentReference: string) => {
    setFormStep('processing');
    setStatusMessage(
      paymentOption === 'CARD'
        ? 'Finalisez le paiement dans la fenêtre sécurisée...'
        : 'Validez la transaction sur votre téléphone...'
    );

    let attempts = 0;
    const maxAttempts = 30;

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setFormStep('error');
        setStatusMessage('Délai dépassé. Vérifiez votre téléphone ou réessayez.');
        return;
      }

      try {
        const statusRes = await checkVoteStatus(paymentReference);
        if (statusRes.success && statusRes.data) {
          const paymentStatus = statusRes.data.status;
          if (paymentStatus === 'SUCCESS') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setFormStep('success');
            setStatusMessage(`Vos ${votesCount} votes ont été enregistrés avec succès !`);
            onVoteSuccess();
          } else if (paymentStatus === 'FAILED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setFormStep('error');
            setStatusMessage('Le paiement a échoué ou a été annulé.');
          }
        }
      } catch {
        // silently retry
      }
    }, 3000);
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (votesCount >= 1) {
      setFormStep('payment_details');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (votesCount < 1) return;
    
    let paymentMethod: PaymentMethod = paymentOption;
    if (paymentOption !== 'CARD') {
      if (voterPhone.replace(/\D/g, '').length < 9) return;
    }

    setFormStep('processing');
    setStatusMessage('Connexion sécurisée en cours...');

    try {
      const res = await initiateVote({
        candidateId: candidate.id,
        voterIdentifier: paymentOption !== 'CARD' ? voterPhone : (voterEmail || `card_${Date.now()}`),
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
        setFormStep('error');
        setStatusMessage(res.message || 'Une erreur est survenue.');
      }
    } catch (err: unknown) {
      setFormStep('error');
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      setStatusMessage(error.response?.data?.message || error.response?.data?.error || 'Erreur de connexion.');
    }
  };

  const candidateName = `${candidate.firstName} ${candidate.lastName || ''}`.trim();
  const candidatePhoto = getMediaUrl(candidate.profilePhoto, candidate.updatedAt);
  const isMobile = paymentOption !== 'CARD';
  const canSubmitPayment = votesCount >= 1 && (!isMobile || voterPhone.replace(/\D/g, '').length >= 9);

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

          {/* Modal Épuré & Chronologique (Wizard 2 Étapes) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full sm:max-w-[400px] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f14]/95 backdrop-blur-2xl"
          >
            {/* Header minimaliste avec navigation retour */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                {formStep === 'payment_details' ? (
                  <button
                    onClick={() => setFormStep('select_votes')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    title="Retour au choix des votes"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-[#d4af37]/40 shadow-md">
                    {candidatePhoto ? (
                      <img src={candidatePhoto} alt={candidateName} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-black">
                        {candidate.firstName?.[0]}
                      </div>
                    )}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm truncate">{candidateName}</h3>
                  <p className="text-neutral-400 text-[11px] truncate">
                    {formStep === 'select_votes' && 'Étape 1/2 • Choisissez vos votes'}
                    {formStep === 'payment_details' && 'Étape 2/2 • Mode de paiement'}
                    {formStep === 'processing' && 'Traitement du paiement'}
                    {formStep === 'success' && 'Vote enregistré !'}
                    {formStep === 'error' && 'Erreur de paiement'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barre de progression fluide */}
            {(formStep === 'select_votes' || formStep === 'payment_details') && (
              <div className="w-full bg-white/5 h-1">
                <div
                  className="bg-[#d4af37] h-full transition-all duration-300"
                  style={{ width: formStep === 'select_votes' ? '50%' : '100%' }}
                />
              </div>
            )}

            {/* Corps du Formulaire */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {/* ─── ÉTAPE 1 : Sélection du nombre de votes ────────────────── */}
                {formStep === 'select_votes' && (
                  <motion.form
                    key="step_votes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleNextToPayment}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Combien de votes voulez-vous attribuer ?
                      </label>

                      {/* Forfaits de votes */}
                      <div className="grid grid-cols-3 gap-2">
                        {PRESETS.map((preset) => (
                          <button
                            key={preset.amount}
                            type="button"
                            onClick={() => setAmountStr(preset.amount.toString())}
                            className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-0.5 ${
                              amount === preset.amount
                                ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/25 scale-[1.02]'
                                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                            }`}
                          >
                            <span className="font-black text-sm">{preset.label}</span>
                            <span className={`text-[10px] ${amount === preset.amount ? 'text-black/80 font-bold' : 'text-neutral-400'}`}>
                              {preset.amount.toLocaleString('fr-FR')} FCFA
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Montant personnalisé */}
                      <div className="pt-2">
                        <label className="text-[10px] font-semibold text-neutral-400 block mb-1">
                          Ou saisissez un montant libre :
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={amountStr}
                            onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ''))}
                            placeholder="Montant (ex: 1500)"
                            required
                            className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white text-sm font-bold outline-none focus:border-[#d4af37] transition-all placeholder:text-neutral-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d4af37]">
                            = {votesCount} Vote{votesCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Résumé clair & Bouton Continuer */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={votesCount < 1}
                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                          votesCount >= 1
                            ? 'bg-[#d4af37] text-black hover:bg-[#e5c158] shadow-[#d4af37]/20 active:scale-[0.99]'
                            : 'bg-white/10 text-neutral-500 border border-white/5 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span>Continuer ({amount ? amount.toLocaleString('fr-FR') : 0} FCFA)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <p className="text-center text-[10px] text-neutral-500 font-medium">
                        Tarif officiel : 100 FCFA = 1 vote
                      </p>
                    </div>
                  </motion.form>
                )}

                {/* ─── ÉTAPE 2 : Mode de paiement & Coordonnées ────────────────── */}
                {formStep === 'payment_details' && (
                  <motion.form
                    key="step_payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleSubmitPayment}
                    className="space-y-4"
                  >
                    {/* Badge résumé du choix */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                        <span className="text-xs text-white font-bold">
                          {votesCount} Vote{votesCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#d4af37]">
                        {amount.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {/* Sélection du mode de paiement */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Choisissez votre moyen de paiement :
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* MTN MoMo */}
                        <button
                          type="button"
                          onClick={() => setPaymentOption('MTN_MOMO')}
                          className={`p-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                            paymentOption === 'MTN_MOMO'
                              ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400 shadow-md scale-[1.02]'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-5 h-5 text-yellow-400" />
                          <span className="text-[10px] font-black uppercase tracking-wider">MTN MoMo</span>
                        </button>

                        {/* Orange Money */}
                        <button
                          type="button"
                          onClick={() => setPaymentOption('ORANGE_MOMO')}
                          className={`p-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                            paymentOption === 'ORANGE_MOMO'
                              ? 'bg-orange-500/20 border-orange-400 text-orange-400 shadow-md scale-[1.02]'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-5 h-5 text-orange-400" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Orange</span>
                        </button>

                        {/* Carte Bancaire */}
                        <button
                          type="button"
                          onClick={() => setPaymentOption('CARD')}
                          className={`p-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                            paymentOption === 'CARD'
                              ? 'bg-blue-500/20 border-blue-400 text-blue-400 shadow-md scale-[1.02]'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-5 h-5 text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Carte Visa</span>
                        </button>
                      </div>
                    </div>

                    {/* Saisie Téléphone si Mobile Money */}
                    {isMobile ? (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-400 block">
                          Numéro de paiement {paymentOption === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'} :
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-400 text-xs font-bold pointer-events-none">
                            <span>🇨🇲 +237</span>
                          </div>
                          <input
                            type="tel"
                            value={voterPhone}
                            onChange={(e) => setVoterPhone(e.target.value)}
                            placeholder="6xx xx xx xx"
                            maxLength={9}
                            required
                            autoFocus
                            className="w-full rounded-xl pl-16 pr-20 py-3 bg-white/5 border border-white/10 text-white text-sm font-semibold outline-none focus:border-[#d4af37] transition-all placeholder:text-neutral-500"
                          />
                          {detectedOp && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-black/60 text-white border-white/20">
                              {detectedOp === 'MTN_MOMO' ? 'MTN' : 'ORANGE'}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Saisie Email si Carte Bancaire */
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-400 block">
                          Adresse email pour la facture :
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            value={voterEmail}
                            onChange={(e) => setVoterEmail(e.target.value)}
                            placeholder="votre.email@exemple.com"
                            className="w-full rounded-xl pl-9 pr-4 py-3 bg-white/5 border border-white/10 text-white text-xs font-medium outline-none focus:border-[#d4af37] transition-all placeholder:text-neutral-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bouton de confirmation & Sécurité */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={!canSubmitPayment}
                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                          canSubmitPayment
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black hover:opacity-95 shadow-[#d4af37]/20 active:scale-[0.99]'
                            : 'bg-white/10 text-neutral-500 border border-white/5 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        Payer {amount.toLocaleString('fr-FR')} FCFA
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Paiement 100% sécurisé et instantané</span>
                      </div>
                    </div>
                  </motion.form>
                )}

                {/* ─── ÉTAPE 3 : Processing ─────────────────────────────────── */}
                {formStep === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 flex flex-col items-center text-center space-y-3"
                  >
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                    <div>
                      <p className="text-white font-bold text-sm">Traitement en cours</p>
                      <p className="text-neutral-400 text-xs mt-1">{statusMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* ─── ÉTAPE 4 : Succès ────────────────────────────────────── */}
                {formStep === 'success' && (
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

                {/* ─── ÉTAPE 5 : Erreur ────────────────────────────────────── */}
                {formStep === 'error' && (
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
                      onClick={() => setFormStep('select_votes')}
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


