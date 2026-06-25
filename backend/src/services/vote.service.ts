// =============================================================================
// SERVICE DE VOTE — vote.service.ts
// =============================================================================
// Ce service gère l'ensemble du processus de vote pour les candidats.
// Le vote est payant et repose sur le paiement mobile via Mavians.
//
// Flux métier du vote :
//   1. L'utilisateur initie un vote → un paiement Mavians est déclenché (PENDING)
//   2. Mavians traite le paiement et envoie un webhook de confirmation
//   3. Le webhook met à jour le statut du vote (SUCCESS ou FAILED)
//   4. En cas de succès, le compteur de votes du candidat est incrémenté
//
// Contraintes métier :
//   - Un même votant ne peut voter qu'une seule fois (avec succès) par candidat
//   - Le montant du vote est fixé à 100 FCFA
//   - Seuls les candidats avec le statut ACTIVE peuvent recevoir des votes
// =============================================================================

// --- Imports des dépendances ---

// Client Prisma pour les opérations en base de données
import prisma from '../utils/prisma';

// Service de paiement mobile Mavians (actuellement en mode mock)
import { initiateMaviansPayment } from './external.service';

// Classe d'erreur personnalisée avec code HTTP
import { AppError } from '../utils/AppError';

// Module crypto natif de Node.js pour générer des identifiants uniques sécurisés
// Utilisé ici pour créer des références de paiement non prédictibles
import crypto from 'crypto';

// =============================================================================
// FONCTION : initiateVote
// =============================================================================

/**
 * Initie le processus de vote pour un candidat donné.
 *
 * Cette fonction orchestre les étapes suivantes :
 * 1. Vérifie que le votant n'a pas déjà voté avec succès pour ce candidat.
 * 2. Vérifie que le candidat existe et est actif.
 * 3. Génère une référence de paiement unique et sécurisée.
 * 4. Initie le paiement mobile via l'API Mavians.
 * 5. Crée un enregistrement de vote en base avec le statut `PENDING`.
 *
 * Le vote ne sera confirmé que lorsque le webhook Mavians aura renvoyé
 * un statut `SUCCESS` (voir `handleMaviansWebhook`).
 *
 * @param candidateId     - Identifiant du candidat pour lequel le vote est émis.
 * @param voterIdentifier - Identifiant unique du votant (typiquement son numéro de téléphone).
 * @returns L'objet vote créé avec le statut `PENDING`.
 * @throws {AppError} 409 — Si le votant a déjà voté avec succès pour ce candidat.
 * @throws {AppError} 404 — Si le candidat n'existe pas ou n'est pas actif.
 * @throws {AppError} 502 — Si l'initiation du paiement Mavians échoue (erreur externe).
 */
export const initiateVote = async (candidateId: number, voterIdentifier: string) => {
  // Vérification anti-doublon : on cherche un vote déjà réussi (SUCCESS)
  // pour la même combinaison candidat/votant
  // Note : les votes PENDING ou FAILED ne bloquent pas un nouveau vote
  const existingSuccessVote = await prisma.vote.findFirst({
    where: {
      candidateId,
      voterIdentifier,
      status: 'SUCCESS'
    }
  });

  // Si un vote réussi existe déjà, on refuse le nouveau vote (code 409 : Conflit)
  if (existingSuccessVote) {
    throw new AppError('Vous avez déjà voté pour ce candidat.', 409);
  }

  // Vérification de l'existence et du statut du candidat
  // Seuls les candidats ACTIVE (profil complété et validé) peuvent recevoir des votes
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId }
  });

  if (!candidate || candidate.status !== 'ACTIVE') {
    throw new AppError('Ce candidat n\'est pas actif ou n\'existe pas.', 404);
  }

  // Construction d'une référence de paiement unique et traçable
  // Format : VOTE_{candidateId}_{timestamp}_{random_hex}
  // - Le préfixe VOTE_ permet d'identifier la nature de la transaction
  // - Le candidateId facilite le débogage et le suivi
  // - Le timestamp assure un tri chronologique naturel
  // - Les 4 octets aléatoires (8 caractères hex) empêchent les collisions
  const paymentReference = `VOTE_${candidateId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Montant fixe du vote en FCFA (règle métier)
  const amount = 100;

  // Initiation du paiement mobile via Mavians
  // Le votant recevra une notification sur son téléphone pour confirmer le débit
  const paymentInitiated = await initiateMaviansPayment(voterIdentifier, amount, paymentReference);

  // Si Mavians n'a pas pu initier le paiement, on signale une erreur côté serveur externe
  // Le code 502 (Bad Gateway) indique qu'un service tiers a échoué
  if (!paymentInitiated) {
    throw new AppError('Échec de l\'initiation du paiement via Mavians.', 502);
  }

  // Création de l'enregistrement du vote en base avec le statut PENDING
  // Le vote restera en PENDING jusqu'à réception du webhook de confirmation Mavians
  const vote = await prisma.vote.create({
    data: {
      candidateId,
      voterIdentifier,
      paymentReference,
      amount,
      status: 'PENDING'
    }
  });

  return vote;
};

// =============================================================================
// FONCTION : handleMaviansWebhook
// =============================================================================

/**
 * Traite le webhook de confirmation envoyé par Mavians après un paiement.
 *
 * Cette fonction est appelée lorsque Mavians notifie notre serveur du résultat
 * d'un paiement. Elle met à jour le vote en conséquence :
 *
 * - **Si le paiement est `SUCCESS`** :
 *   - Le vote passe au statut `SUCCESS` avec la date de paiement.
 *   - Le compteur de votes du candidat (`totalVotesCache`) est incrémenté.
 *   - Ces deux opérations sont effectuées dans une **transaction Prisma**
 *     pour garantir la cohérence des données (atomicité).
 *
 * - **Si le paiement est `FAILED`** :
 *   - Le vote passe simplement au statut `FAILED`.
 *   - Le votant pourra retenter un vote ultérieurement.
 *
 * @param paymentReference - Référence unique du paiement (générée lors de l'initiation).
 * @param paymentStatus    - Statut du paiement renvoyé par Mavians (`SUCCESS` ou `FAILED`).
 * @returns L'objet vote mis à jour avec son nouveau statut.
 * @throws {AppError} 404 — Si aucun vote n'est trouvé pour cette référence de paiement.
 */
export const handleMaviansWebhook = async (paymentReference: string, paymentStatus: 'SUCCESS' | 'FAILED') => {
  // Recherche du vote associé à la référence de paiement Mavians
  const vote = await prisma.vote.findUnique({
    where: { paymentReference }
  });

  // Si la référence ne correspond à aucun vote, c'est une erreur
  // (webhook frauduleux ou référence corrompue)
  if (!vote) {
    throw new AppError('Vote non trouvé pour cette référence de paiement.', 404);
  }

  // Protection d'idempotence : si le vote est déjà en SUCCESS,
  // on retourne simplement le vote existant sans le modifier
  // Cela gère le cas où Mavians enverrait le webhook en double
  if (vote.status === 'SUCCESS') {
    return vote;
  }

  // --- Traitement selon le statut du paiement ---

  if (paymentStatus === 'SUCCESS') {
    // Transaction Prisma pour garantir l'atomicité des deux opérations :
    // 1. Mise à jour du vote (statut + date de paiement)
    // 2. Incrémentation du compteur de votes du candidat
    //
    // Si l'une des deux opérations échoue, les deux sont annulées (rollback)
    // Cela empêche les incohérences entre le nombre de votes SUCCESS
    // et la valeur du cache totalVotesCache
    const [updatedVote] = await prisma.$transaction([
      // Opération 1 : passage du vote en SUCCESS avec horodatage
      prisma.vote.update({
        where: { id: vote.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date()
        }
      }),
      // Opération 2 : incrémentation atomique du compteur de votes du candidat
      // L'utilisation de `increment` évite les problèmes de concurrence
      // (pas de read-then-write, c'est directement un UPDATE ... SET x = x + 1)
      prisma.candidate.update({
        where: { id: vote.candidateId },
        data: {
          totalVotesCache: { increment: 1 }
        }
      })
    ]);

    return updatedVote;
  } else {
    // Cas FAILED : le paiement a été refusé ou a échoué
    // On met simplement le vote en échec, sans toucher au compteur du candidat
    const updatedVote = await prisma.vote.update({
      where: { id: vote.id },
      data: {
        status: 'FAILED'
      }
    });
    return updatedVote;
  }
};
