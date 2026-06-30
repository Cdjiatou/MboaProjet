"use strict";
// =============================================================================
// SERVICE DE VOTE — vote.service.ts
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMaviansWebhook = exports.checkAndUpdateVoteStatus = exports.initiateVote = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const mavians_service_1 = require("./mavians.service");
const AppError_1 = require("../utils/AppError");
const crypto_1 = __importDefault(require("crypto"));
const MIN_VOTE_AMOUNT = 100;
const initiateVote = async (candidateId, voterIdentifier, amount, paymentMethod) => {
    if (amount < MIN_VOTE_AMOUNT || amount % MIN_VOTE_AMOUNT !== 0) {
        throw new AppError_1.AppError(`Le montant minimum est ${MIN_VOTE_AMOUNT} FCFA (multiples de 100).`, 400);
    }
    const candidate = await prisma_1.default.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate || candidate.status !== 'ACTIVE') {
        throw new AppError_1.AppError('Ce candidat n\'est pas actif ou n\'existe pas.', 404);
    }
    const paymentReference = `VOTE_${candidateId}_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
    const paymentResult = await (0, mavians_service_1.initiateMaviansPayment)(voterIdentifier, amount, paymentReference, paymentMethod);
    if (!paymentResult.success) {
        throw new AppError_1.AppError(paymentResult.message || 'Échec de l\'initiation du paiement via Mavians.', 502);
    }
    const vote = await prisma_1.default.vote.create({
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
exports.initiateVote = initiateVote;
const checkAndUpdateVoteStatus = async (paymentReference) => {
    const vote = await prisma_1.default.vote.findUnique({ where: { paymentReference } });
    if (!vote)
        throw new AppError_1.AppError('Vote introuvable.', 404);
    if (vote.status === 'SUCCESS' || vote.status === 'FAILED')
        return vote;
    if (vote.maviansPtn) {
        // Mode simulation : confirmer automatiquement après quelques vérifications
        if (vote.maviansPtn.startsWith('MOCK_PTN_')) {
            const ageMs = Date.now() - vote.createdAt.getTime();
            if (ageMs > 8000) {
                return (0, exports.handleMaviansWebhook)(paymentReference, 'SUCCESS');
            }
            return vote;
        }
        const txStatus = await (0, mavians_service_1.verifyMaviansTransaction)(vote.maviansPtn);
        if (txStatus === 'SUCCESS') {
            return (0, exports.handleMaviansWebhook)(paymentReference, 'SUCCESS');
        }
        if (txStatus === 'FAILED') {
            return (0, exports.handleMaviansWebhook)(paymentReference, 'FAILED');
        }
    }
    return vote;
};
exports.checkAndUpdateVoteStatus = checkAndUpdateVoteStatus;
const handleMaviansWebhook = async (paymentReference, paymentStatus) => {
    const vote = await prisma_1.default.vote.findUnique({ where: { paymentReference } });
    if (!vote)
        throw new AppError_1.AppError('Vote non trouvé pour cette référence de paiement.', 404);
    if (vote.status === 'SUCCESS')
        return vote;
    const votesToAdd = Math.floor(vote.amount / MIN_VOTE_AMOUNT);
    if (paymentStatus === 'SUCCESS') {
        const [updatedVote] = await prisma_1.default.$transaction([
            prisma_1.default.vote.update({
                where: { id: vote.id },
                data: { status: 'SUCCESS', paidAt: new Date() },
            }),
            prisma_1.default.candidate.update({
                where: { id: vote.candidateId },
                data: { totalVotesCache: { increment: votesToAdd } },
            }),
        ]);
        return updatedVote;
    }
    return prisma_1.default.vote.update({
        where: { id: vote.id },
        data: { status: 'FAILED' },
    });
};
exports.handleMaviansWebhook = handleMaviansWebhook;
