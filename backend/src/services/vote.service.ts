// =============================================================================
// SERVICE DE VOTE — vote.service.ts
// =============================================================================

import prisma from '../utils/prisma';
import { initiateMaviansPayment, verifyMaviansTransaction, PaymentMethod } from './mavians.service';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

const MIN_VOTE_AMOUNT = 100;

export const initiateVote = async (
  candidateId: number,
  voterIdentifier: string,
  amount: number,
  paymentMethod: PaymentMethod
) => {
  if (amount < MIN_VOTE_AMOUNT || amount % MIN_VOTE_AMOUNT !== 0) {
    throw new AppError(`Le montant minimum est ${MIN_VOTE_AMOUNT} FCFA (multiples de 100).`, 400);
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate || candidate.status !== 'ACTIVE') {
    throw new AppError('Ce candidat n\'est pas actif ou n\'existe pas.', 404);
  }

  const paymentReference = `VOTE_${candidateId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const paymentResult = await initiateMaviansPayment(
    voterIdentifier,
    amount,
    paymentReference,
    paymentMethod
  );

  if (!paymentResult.success) {
    throw new AppError(paymentResult.message || 'Échec de l\'initiation du paiement via Mavians.', 502);
  }

  const vote = await prisma.vote.create({
    data: {
      candidateId,
      voterIdentifier,
      paymentReference,
      amount,
      paymentMethod,
      maviansQuoteId: paymentResult.quoteId,
      maviansPtn: paymentResult.ptn,
      paymentUrl: paymentResult.paymentUrl,
      status: 'PENDING',
    },
  });

  return {
    vote,
    paymentUrl: paymentResult.paymentUrl,
    message: paymentResult.message,
    votesCount: Math.floor(amount / MIN_VOTE_AMOUNT),
  };
};

export const checkAndUpdateVoteStatus = async (paymentReference: string) => {
  const vote = await prisma.vote.findUnique({ where: { paymentReference } });
  if (!vote) throw new AppError('Vote introuvable.', 404);
  if (vote.status === 'SUCCESS' || vote.status === 'FAILED') return vote;

  if (vote.maviansPtn) {
    // Mode simulation : confirmer automatiquement après quelques vérifications
    if (vote.maviansPtn.startsWith('MOCK_PTN_')) {
      const ageMs = Date.now() - vote.createdAt.getTime();
      if (ageMs > 8000) {
        return handleMaviansWebhook(paymentReference, 'SUCCESS');
      }
      return vote;
    }

    const txStatus = await verifyMaviansTransaction(vote.maviansPtn);
    if (txStatus === 'SUCCESS') {
      return handleMaviansWebhook(paymentReference, 'SUCCESS');
    }
    if (txStatus === 'FAILED') {
      return handleMaviansWebhook(paymentReference, 'FAILED');
    }
  }

  return vote;
};

export const handleMaviansWebhook = async (paymentReference: string, paymentStatus: 'SUCCESS' | 'FAILED') => {
  const vote = await prisma.vote.findUnique({ where: { paymentReference } });
  if (!vote) throw new AppError('Vote non trouvé pour cette référence de paiement.', 404);
  if (vote.status === 'SUCCESS') return vote;

  const votesToAdd = Math.floor(vote.amount / MIN_VOTE_AMOUNT);

  if (paymentStatus === 'SUCCESS') {
    const [updatedVote] = await prisma.$transaction([
      prisma.vote.update({
        where: { id: vote.id },
        data: { status: 'SUCCESS', paidAt: new Date() },
      }),
      prisma.candidate.update({
        where: { id: vote.candidateId },
        data: { totalVotesCache: { increment: votesToAdd } },
      }),
    ]);
    return updatedVote;
  }

  return prisma.vote.update({
    where: { id: vote.id },
    data: { status: 'FAILED' },
  });
};
