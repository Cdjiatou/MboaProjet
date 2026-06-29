// =============================================================================
// SERVICE D'ADMINISTRATION — admin.service.ts
// =============================================================================
// Ce service regroupe les fonctions dédiées au back-office administrateur :
//   - Tableau de bord avec statistiques globales (votes, candidats, catégories)
//   - Gestion de la configuration du site (clés/valeurs dynamiques)
//   - Gestion des retraits de fonds avec calcul des frais (3%)
//
// Ces fonctions sont appelées exclusivement par les contrôleurs admin
// et sont protégées par le middleware d'authentification admin.
// =============================================================================

// --- Imports des dépendances ---

// Client Prisma pour les opérations en base de données
import prisma from '../utils/prisma';

// Classe d'erreur personnalisée avec code HTTP pour le middleware d'erreurs
import { AppError } from '../utils/AppError';
import { mergeSponsorsConfig, parseSponsorsConfig, resolvePublicSponsors, type SponsorEntry } from '../utils/sponsorsConfig';

// =============================================================================
// FONCTION : getDashboardStats
// =============================================================================

/**
 * Récupère les statistiques globales pour le tableau de bord administrateur.
 *
 * Les données retournées comprennent :
 * - Le nombre total de votes réussis sur toute la plateforme.
 * - La répartition des votes par catégorie de concours.
 * - La liste de tous les candidats avec leur nombre de votes, triés par popularité.
 *
 * Cette fonction effectue 3 requêtes Prisma distinctes pour collecter
 * les données de manière structurée. Les requêtes ne sont pas regroupées
 * en transaction car il s'agit de lectures seules (pas de risque d'incohérence critique).
 *
 * @returns Un objet contenant les statistiques du tableau de bord :
 *          - `totalVotesGlobal` : nombre total de votes réussis
 *          - `votesByCategory` : tableau des votes agrégés par catégorie
 *          - `candidates` : liste des candidats avec leurs votes, triés par ordre décroissant
 */
export const getDashboardStats = async () => {
  // 1. Total Votes
  const totalVotes = await prisma.vote.count({
    where: { status: 'SUCCESS' }
  });

  // 2. Total Candidates
  const totalCandidates = await prisma.candidate.count();

  // 3. Total Revenue
  const revenueResult = await prisma.vote.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  const totalRevenue = revenueResult._sum.amount || 0;

  // 4. Pending Withdrawals
  const pendingWithdrawals = await prisma.withdrawal.count({
    where: { status: 'PENDING' }
  });

  // 5. Recent Candidates (last 5)
  const recentCandidates = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      totalVotesCache: true,
      status: true,
      category: { select: { name: true } }
    }
  });

  // 6. Recent Votes (last 10, all statuses for monitoring)
  const recentVotes = await prisma.vote.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      voterIdentifier: true,
      amount: true,
      status: true,
      paymentReference: true,
      createdAt: true,
      candidate: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  // 7. Categories stats (for backward compatibility if needed)
  const categoriesStats = await prisma.category.findMany({
    select: {
      name: true,
      candidates: { select: { totalVotesCache: true } }
    }
  });
  const votesByCategory = categoriesStats.map(cat => ({
    category: cat.name,
    totalVotes: cat.candidates.reduce((sum, c) => sum + c.totalVotesCache, 0)
  }));

  return {
    totalCandidates,
    totalVotes,
    totalRevenue,
    pendingWithdrawals,
    recentCandidates,
    recentVotes,
    // Keep for backwards compatibility
    totalVotesGlobal: totalVotes,
    votesByCategory,
    candidates: recentCandidates
  };
};

// =============================================================================
// FONCTION : listCandidates
// =============================================================================

/**
 * Liste les candidats pour le back-office avec recherche et pagination.
 */
export const listCandidates = async (params: { search?: string; page?: number; limit?: number } = {}) => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where = params.search
    ? {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' as const } },
          { lastName: { contains: params.search, mode: 'insensitive' as const } },
          { email: { contains: params.search, mode: 'insensitive' as const } },
          { phone: { contains: params.search } },
        ],
      }
    : {};

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profilePhoto: true,
          biography: true,
          videoUrl: true,
          city: true,
          country: true,
          categoryId: true,
          socialLinks: true,
          totalVotesCache: true,
          status: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
    }),
    prisma.candidate.count({ where }),
  ]);

  return { candidates, total, page, limit };
};

// =============================================================================
// FONCTION : updateSiteConfig
// =============================================================================

/**
 * Met à jour la configuration dynamique du site (paires clé/valeur).
 *
 * Utilise un pattern **upsert** (UPDATE or INSERT) pour chaque configuration :
 * - Si la clé existe déjà → sa valeur est mise à jour.
 * - Si la clé n'existe pas → elle est créée avec la valeur fournie.
 *
 * Toutes les opérations sont regroupées dans une **transaction Prisma**
 * pour garantir que soit toutes les configurations sont mises à jour,
 * soit aucune ne l'est (atomicité).
 *
 * Exemples de clés de configuration : "siteName", "votingStartDate",
 * "votingEndDate", "maintenanceMode", etc.
 *
 * @param configs - Tableau d'objets contenant les paires clé/valeur à mettre à jour.
 * @param configs[].key   - Clé de configuration (identifiant unique).
 * @param configs[].value - Nouvelle valeur de la configuration.
 * @returns Le résultat de la transaction (tableau des configurations mises à jour/créées).
 */
export const updateSiteConfig = async (configs: { key: string; value: string }[]) => {
  // Transformation du tableau de configs en tableau d'opérations Prisma upsert
  // Chaque opération upsert gère automatiquement la création ou la mise à jour
  const operations = configs.map(config =>
    prisma.siteConfiguration.upsert({
      // Critère de recherche : la clé de configuration
      where: { configKey: config.key },
      // Si la clé existe : mise à jour de la valeur uniquement
      update: { configValue: config.value },
      // Si la clé n'existe pas : création complète (clé + valeur)
      create: { configKey: config.key, configValue: config.value }
    })
  );

  // Exécution de toutes les opérations en une seule transaction
  // Cela garantit la cohérence : pas de mise à jour partielle en cas d'erreur
  return await prisma.$transaction(operations);
};

/**
 * Sauvegarde la liste des sponsors dans SiteConfiguration.
 * @param replaceAll - true : remplace entièrement (gestion admin). false : fusionne (append).
 */
export const saveSponsorsConfig = async (sponsors: SponsorEntry[], replaceAll = true) => {
  const existing = await prisma.siteConfiguration.findUnique({ where: { configKey: 'sponsors' } });
  const existingList = parseSponsorsConfig(existing?.configValue);
  const merged = mergeSponsorsConfig(existingList, sponsors, replaceAll);
  await updateSiteConfig([{ key: 'sponsors', value: JSON.stringify(merged) }]);
  return merged;
};

/** Récupère les sponsors depuis la configuration site (liste résolue avec défauts si incomplète) */
export const getSponsorsConfig = async (): Promise<SponsorEntry[]> => {
  const row = await prisma.siteConfiguration.findUnique({ where: { configKey: 'sponsors' } });
  const fromDb = parseSponsorsConfig(row?.configValue);
  return resolvePublicSponsors(fromDb);
};

/** Répare la config sponsors en DB si la liste est incomplète */
export const repairSponsorsConfigIfNeeded = async (): Promise<SponsorEntry[]> => {
  const row = await prisma.siteConfiguration.findUnique({ where: { configKey: 'sponsors' } });
  const fromDb = parseSponsorsConfig(row?.configValue);
  const resolved = resolvePublicSponsors(fromDb);
  const resolvedJson = JSON.stringify(resolved);
  if (!row?.configValue || row.configValue !== resolvedJson) {
    await updateSiteConfig([{ key: 'sponsors', value: resolvedJson }]);
  }
  return resolved;
};

// Commission Marvians (Smobilpay) prélevée sur chaque retrait en fin de concours
export const MARVIANS_WITHDRAWAL_FEE_RATE = 0.03;
/**
 * Calcule les frais de retrait Marvians et le montant net à verser.
 *
 * Les frais appliqués sont de **3%** (commission Marvians / Smobilpay).
 *
 * Cette fonction est **pure** (pas d'effet de bord, pas d'appel en base),
 * ce qui facilite les tests unitaires et la réutilisation.
 *
 * @param requestedAmount - Montant brut demandé par l'administrateur en FCFA.
 * @returns Un objet contenant :
 *          - `feeAmount` : montant des frais prélevés (3% arrondi à l'inférieur)
 *          - `netAmount` : montant net qui sera effectivement versé
 *
 * @example
 * calculateWithdrawalFees(10000);
 * // → { feeAmount: 300, netAmount: 9700 }
 *
 * calculateWithdrawalFees(1500);
 * // → { feeAmount: 45, netAmount: 1455 }
 */
export const calculateWithdrawalFees = (requestedAmount: number) => {
  const feeAmount = Math.floor(requestedAmount * MARVIANS_WITHDRAWAL_FEE_RATE);
  const netAmount = requestedAmount - feeAmount;
  return { feeAmount, netAmount, feeRate: MARVIANS_WITHDRAWAL_FEE_RATE };
};

// =============================================================================
// FONCTION : initiateWithdrawal
// =============================================================================

/**
 * Initie une demande de retrait de fonds.
 *
 * Cette fonction crée un enregistrement de retrait en base de données
 * avec le statut `PENDING`. Le retrait devra être validé/traité
 * ultérieurement (manuellement ou via un processus automatisé).
 *
 * Le calcul des frais est délégué à `calculateWithdrawalFees` pour
 * respecter le principe de responsabilité unique.
 *
 * @param requestedAmount - Montant brut demandé en FCFA (doit être > 0).
 * @returns L'objet retrait créé en base avec tous les détails financiers.
 * @throws {AppError} 400 — Si le montant demandé est inférieur ou égal à 0.
 */
export const initiateWithdrawal = async (requestedAmount: number) => {
  // Validation du montant : doit être strictement positif
  if (requestedAmount <= 0) {
    throw new AppError('Le montant doit être supérieur à 0.', 400);
  }

  // Calcul des frais et du montant net via la fonction utilitaire dédiée
  const { feeAmount, netAmount } = calculateWithdrawalFees(requestedAmount);

  // Création de l'enregistrement de retrait en base de données
  // Le statut initial est PENDING en attendant le traitement effectif
  const withdrawal = await prisma.withdrawal.create({
    data: {
      requestedAmount,
      feeAmount,
      netAmount,
      status: 'PENDING'
    }
  });

  return withdrawal;
};

// =============================================================================
// FONCTION : updateWithdrawalStatus
// =============================================================================

/**
 * Met à jour le statut d'un retrait de PENDING vers COMPLETED.
 *
 * Cette fonction vérifie que :
 * 1. Le retrait existe en base de données
 * 2. Le retrait est actuellement en statut PENDING
 * 
 * Seule la transition PENDING → COMPLETED est autorisée pour des raisons
 * d'audit et de traçabilité financière. Une fois un retrait marqué comme
 * COMPLETED, il ne peut plus être modifié.
 *
 * @param withdrawalId - Identifiant unique du retrait à mettre à jour.
 * @returns L'objet retrait mis à jour avec le nouveau statut COMPLETED.
 * @throws {AppError} 404 — Si le retrait n'existe pas en base.
 * @throws {AppError} 400 — Si le retrait n'est pas en statut PENDING.
 */
export const updateWithdrawalStatus = async (withdrawalId: number) => {
  // Vérification de l'existence du retrait
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId }
  });

  if (!withdrawal) {
    throw new AppError('Retrait introuvable.', 404);
  }

  // Vérification que le retrait est en statut PENDING
  // Seule cette transition est autorisée pour éviter les modifications
  // de retraits déjà complétés (intégrité financière)
  if (withdrawal.status !== 'PENDING') {
    throw new AppError('Seuls les retraits en statut PENDING peuvent être marqués comme COMPLETED.', 400);
  }

  // Mise à jour du statut vers COMPLETED
  const updatedWithdrawal = await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: 'COMPLETED' }
  });

  return updatedWithdrawal;
};

// =============================================================================
// FONCTION : listWithdrawals
// =============================================================================

/**
 * Liste tous les retraits, triés par date de création décroissante.
 *
 * Cette fonction récupère l'historique complet des retraits pour affichage
 * dans le tableau de bord administrateur. Les retraits sont triés du plus
 * récent au plus ancien pour faciliter le suivi.
 *
 * @returns Un tableau de tous les retraits avec leurs détails financiers.
 */
export const listWithdrawals = async () => {
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return withdrawals;
};
