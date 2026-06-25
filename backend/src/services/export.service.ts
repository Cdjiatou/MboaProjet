// =============================================================================
// SERVICE D'EXPORT CSV — export.service.ts
// =============================================================================
// Ce service génère des fichiers CSV (Comma-Separated Values) pour l'export
// de données depuis le back-office administrateur.
//
// Deux types d'export sont disponibles :
//   1. Export des votes réussis (generateVotesCSV)
//   2. Export des retraits de fonds (generateWithdrawalsCSV)
//
// Particularités techniques :
//   - Les CSV utilisent le point-virgule (;) comme séparateur, conformément
//     à la convention française (Excel en mode français utilise ; par défaut).
//   - Un BOM UTF-8 est ajouté en début de fichier pour garantir le bon
//     affichage des caractères accentués dans Excel et LibreOffice.
//   - Les identifiants des votants sont partiellement masqués (anonymisation).
// =============================================================================

// --- Imports des dépendances ---

// Client Prisma pour les requêtes en base de données
import prisma from '../utils/prisma';

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * BOM (Byte Order Mark) UTF-8.
 *
 * Ce caractère invisible placé en tout début du fichier CSV indique aux
 * logiciels tableurs (Excel, LibreOffice Calc) que le fichier est encodé
 * en UTF-8. Sans ce BOM, les caractères accentués (é, è, ê, etc.)
 * risquent d'être mal affichés, surtout dans Excel sous Windows
 * qui suppose par défaut un encodage ANSI/Windows-1252.
 */
const UTF8_BOM = '\uFEFF';

// =============================================================================
// FONCTION : generateVotesCSV
// =============================================================================

/**
 * Génère un fichier CSV contenant la liste de tous les votes réussis.
 *
 * Les données sont récupérées depuis la base et formatées avec :
 * - Les informations de chaque vote (ID, artiste, montant, date)
 * - L'identifiant du votant partiellement masqué pour la protection
 *   des données personnelles (ex: "237***890")
 * - La référence de paiement Mavians pour la traçabilité financière
 *
 * Colonnes du CSV :
 * `ID Vote | Artiste | Identifiant Votant | Référence Mavians | Montant (FCFA) | Date`
 *
 * @returns Le contenu CSV complet sous forme de chaîne de caractères (avec BOM UTF-8).
 */
export const generateVotesCSV = async (): Promise<string> => {
  // Récupération de tous les votes réussis (SUCCESS uniquement)
  // avec les informations du candidat associé (prénom + nom)
  // Triés par date de paiement décroissante (les plus récents en premier)
  const votes = await prisma.vote.findMany({
    where: { status: 'SUCCESS' },
    include: {
      // Jointure avec la table candidat pour récupérer le nom de l'artiste
      candidate: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { paidAt: 'desc' }
  });

  // En-têtes du CSV — définissent les colonnes du fichier
  const headers = ['ID Vote', 'Artiste', 'Identifiant Votant', 'Référence Mavians', 'Montant (FCFA)', 'Date'];

  // Transformation de chaque vote en une ligne CSV
  const rows = votes.map(vote => {
    // --- Anonymisation partielle de l'identifiant du votant ---
    // On masque la partie centrale avec des astérisques pour protéger
    // les données personnelles tout en gardant assez d'info pour identifier
    // un doublon ou répondre à une réclamation
    // Ex: "237612345890" → "237***890"
    let maskedIdentifier = vote.voterIdentifier;
    if (maskedIdentifier.length > 5) {
      // On garde les 3 premiers et les 3 derniers caractères
      maskedIdentifier = maskedIdentifier.substring(0, 3) + '***' + maskedIdentifier.substring(maskedIdentifier.length - 3);
    }

    // Construction du nom complet de l'artiste
    const artistName = `${vote.candidate.firstName} ${vote.candidate.lastName}`;

    // Formatage de la date en ISO 8601 (ex: "2026-06-24T15:30:00.000Z")
    // On utilise une chaîne vide si la date de paiement n'est pas définie
    // (ce qui ne devrait pas arriver pour un vote SUCCESS, mais par sécurité)
    const dateStr = vote.paidAt ? vote.paidAt.toISOString() : '';

    // Assemblage de la ligne CSV avec point-virgule comme séparateur
    // Le nom de l'artiste est entouré de guillemets pour gérer les éventuels
    // espaces ou caractères spéciaux dans les noms composés
    return [
      vote.id,
      `"${artistName}"`,
      maskedIdentifier,
      vote.paymentReference,
      vote.amount,
      dateStr
    ].join(';');
  });

  // Assemblage final : BOM + en-têtes + lignes de données
  // Chaque ligne est séparée par un saut de ligne (\n)
  return UTF8_BOM + headers.join(';') + '\n' + rows.join('\n');
};

// =============================================================================
// FONCTION : generateWithdrawalsCSV
// =============================================================================

/**
 * Génère un fichier CSV contenant la liste de tous les retraits de fonds.
 *
 * Ce CSV est destiné au suivi financier et à la comptabilité.
 * Il inclut pour chaque retrait :
 * - Le montant brut demandé
 * - Les frais prélevés (3%)
 * - Le montant net versé
 * - Le statut du retrait (PENDING, COMPLETED, etc.)
 * - La date de création
 *
 * Colonnes du CSV :
 * `ID Retrait | Montant Brut (FCFA) | Frais 3% (FCFA) | Montant Net (FCFA) | Statut | Date`
 *
 * @returns Le contenu CSV complet sous forme de chaîne de caractères (avec BOM UTF-8).
 */
export const generateWithdrawalsCSV = async (): Promise<string> => {
  // Récupération de tous les retraits, triés du plus récent au plus ancien
  // Pas de filtre sur le statut : on exporte tout pour une vue comptable complète
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // En-têtes du CSV — colonnes financières détaillées
  const headers = ['ID Retrait', 'Montant Brut (FCFA)', 'Frais 3% (FCFA)', 'Montant Net (FCFA)', 'Statut', 'Date'];

  // Transformation de chaque retrait en une ligne CSV
  const rows = withdrawals.map(w => {
    return [
      w.id,
      w.requestedAmount,   // Montant brut demandé par l'administrateur
      w.feeAmount,          // Frais de 3% calculés et déduits
      w.netAmount,          // Montant effectivement versé (brut - frais)
      w.status,             // Statut actuel du retrait (PENDING, COMPLETED, etc.)
      w.createdAt.toISOString() // Date de création formatée en ISO 8601
    ].join(';');
  });

  // Assemblage final : BOM UTF-8 + en-têtes + lignes de données
  return UTF8_BOM + headers.join(';') + '\n' + rows.join('\n');
};
