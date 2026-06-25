// =============================================================================
// COMPOSANT VoteModal — Modale de paiement mobile pour voter (100 FCFA)
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { initiateVote, checkVoteStatus } from '@/services/voteService';
import type { Candidate } from '@/types';

interface Props {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess: () => void;
}

export const VoteModal: React.FC<Props> = ({ candidate, isOpen, onClose, onVoteSuccess }) => {
  const [voterPhone, setVoterPhone] = useState('');
  const [voteStatus, setVoteStatus] = useState<'idle' | 'loading' | 'polling' | 'success' | 'error'>('idle');
  const [voteMessage, setVoteMessage] = useState('');

  // Réinitialiser les états lors de l'ouverture ou fermeture
  useEffect(() => {
    if (!isOpen) {
      setVoterPhone('');
      setVoteStatus('idle');
      setVoteMessage('');
    }
  }, [isOpen]);

  const handleVote = async () => {
    if (!candidate || !voterPhone) return;
    setVoteStatus('loading');
    setVoteMessage('Initialisation de la transaction...');
    try {
      const res = await initiateVote(candidate.id, voterPhone);
      if (res.success && res.data?.vote) {
        const paymentReference = res.data.vote.paymentReference;
        setVoteStatus('polling');
        setVoteMessage('Paiement initié ! Veuillez valider le message USSD sur votre téléphone...');
        
        let attempts = 0;
        const maxAttempts = 20; // 60 secondes max (20 * 3000ms)
        
        const intervalId = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(intervalId);
            setVoteStatus('error');
            setVoteMessage("Délai d'attente dépassé pour la validation du code PIN.");
            return;
          }
          
          try {
            const statusRes = await checkVoteStatus(paymentReference);
            if (statusRes.success && statusRes.data) {
              const paymentStatus = statusRes.data.status;
              if (paymentStatus === 'SUCCESS') {
                clearInterval(intervalId);
                setVoteStatus('success');
                setVoteMessage('Félicitations ! Votre vote a été enregistré avec succès.');
                onVoteSuccess();
              } else if (paymentStatus === 'FAILED') {
                clearInterval(intervalId);
                setVoteStatus('error');
                setVoteMessage('Le paiement a échoué ou a été rejeté.');
              }
            }
          } catch (pollErr) {
            console.error('Erreur de vérification du statut du vote :', pollErr);
          }
        }, 3000);
      } else {
        setVoteStatus('error');
        setVoteMessage(res.message || 'Une erreur est survenue.');
      }
    } catch (err: unknown) {
      setVoteStatus('error');
      const error = err as { response?: { data?: { error?: string } } };
      setVoteMessage(error.response?.data?.error || 'Erreur de connexion.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          {/* Arrière-plan cliquable pour fermer */}
          <div className="absolute inset-0" onClick={onClose} />
          
          {/* Conteneur de la modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#0b0b0b]/40 border border-[#d4af37]/10 p-6 text-white"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-lg font-bold">
                ⭐ Voter pour {candidate.firstName}
              </h3>
              <button onClick={onClose} className="p-1 hover:text-primary transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu selon le statut */}
            {voteStatus === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <p className="text-success font-semibold">{voteMessage}</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center">
                  <span className="text-2xl font-extrabold bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">100 FCFA</span>
                  <span className="text-text-muted text-xs block mt-1">par vote — Paiement Mobile Money (Mtn / Orange)</span>
                </div>

                {voteStatus === 'idle' && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-text-muted">
                      Numéro de téléphone Mobile Money
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="tel"
                        placeholder="Ex: 237699123456"
                        value={voterPhone}
                        onChange={(e) => setVoterPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <button
                      onClick={handleVote}
                      disabled={voterPhone.length < 9}
                      className="w-full mt-4 py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
                    >
                      Initier le prélèvement — 100 FCFA
                    </button>
                  </div>
                )}

                {(voteStatus === 'loading' || voteStatus === 'polling') && (
                  <div className="text-center py-6 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-sm text-text-muted animate-pulse">{voteMessage}</p>
                  </div>
                )}

                {voteStatus === 'error' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-error/10 p-4 rounded-xl border border-error/20 text-error">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{voteMessage}</p>
                    </div>
                    <button
                      onClick={() => setVoteStatus('idle')}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Réessayer
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
