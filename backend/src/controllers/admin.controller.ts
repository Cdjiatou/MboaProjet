/**
 * @file admin.controller.ts
 * @description Contrôleur regroupant toutes les actions réservées aux administrateurs.
 *
 * Ce contrôleur centralise les opérations du back-office : création de candidats,
 * consultation des statistiques du tableau de bord, mise à jour de la configuration
 * du site, gestion des retraits financiers et export des données en CSV.
 *
 * Toutes ces routes sont protégées par le middleware `authenticateAdmin` appliqué
 * au niveau du routeur (voir admin.routes.ts), garantissant qu'un JWT valide
 * d'administrateur est requis pour chaque appel.
 */

// Types Express pour le typage fort des handlers HTTP.
import { Request, Response } from 'express';

// Services métier du domaine administratif : chaque service encapsule une
// responsabilité unique (Single Responsibility Principle) pour faciliter
// les tests unitaires et la maintenance.
import { getDashboardStats, updateSiteConfig, initiateWithdrawal } from '../services/admin.service';

// La création de candidat est dans le service candidate plutôt que admin
// car la logique de création (génération OTP, envoi WhatsApp) appartient
// au domaine "candidat". Le contrôleur admin ne fait que l'invoquer.
import { createCandidateByCoach } from '../services/candidate.service';

// Services d'export CSV dédiés : séparés du service admin pour isoler
// la logique de sérialisation/formatage des données tabulaires.
import { generateVotesCSV, generateWithdrawalsCSV } from '../services/export.service';

// Wrapper asynchrone pour éviter les try/catch répétitifs dans chaque handler.
import { catchAsync } from '../utils/catchAsync';

/**
 * Crée un nouveau candidat dans le système via l'interface coach/admin.
 *
 * @route POST /api/admin/candidates
 * @param {Request} req - Requête contenant les données du candidat dans le body
 *   (firstName, lastName, email, phone, categoryId).
 * @param {Response} res - Réponse HTTP.
 * @returns {void} Renvoie le candidat créé avec un code 201 (Created).
 *
 * @description
 * Le statut 201 est utilisé plutôt que 200 car il s'agit de la création
 * d'une nouvelle ressource (convention REST). Le service sous-jacent
 * génère automatiquement un code OTP et l'envoie au candidat via WhatsApp
 * pour qu'il puisse compléter son inscription.
 */
export const createCandidate = catchAsync(async (req: Request, res: Response) => {
  // Délégation complète au service candidat : le body entier est transmis
  // car il a déjà été validé par le schéma Zod en amont dans le routeur.
  const candidate = await createCandidateByCoach(req.body);

  // Code 201 pour signaler la création réussie d'une ressource.
  res.status(201).json({ success: true, message: 'Candidat créé et OTP envoyé via WhatsApp.', candidate });
});

/**
 * Récupère les statistiques agrégées du tableau de bord administrateur.
 *
 * @route GET /api/admin/dashboard/stats
 * @param {Request} req - Requête HTTP (aucun paramètre requis).
 * @param {Response} res - Réponse contenant les statistiques globales.
 * @returns {void} Renvoie les KPIs du dashboard (nombre de candidats, votes, revenus, etc.).
 *
 * @description
 * Ce endpoint fournit une vue synthétique de l'activité de la plateforme.
 * Les données sont calculées à la volée par le service plutôt que mises en
 * cache, ce qui garantit leur fraîcheur au prix d'un léger coût en performance.
 * Si les performances deviennent un enjeu, envisager un cache Redis avec TTL.
 */
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await getDashboardStats();

  // Encapsulation dans `data` pour séparer les métadonnées (success)
  // des données métier, convention cohérente à travers toute l'API.
  res.json({ success: true, data: stats });
});

/**
 * Met à jour la configuration dynamique du site.
 *
 * @route POST /api/admin/config
 * @param {Request} req - Requête contenant un tableau `configs` d'objets {key, value}.
 * @param {Response} res - Réponse de confirmation.
 * @returns {void} Confirme la mise à jour réussie de la configuration.
 *
 * @description
 * La configuration est stockée sous forme de paires clé/valeur en base de données
 * plutôt que dans un fichier de configuration statique. Cela permet aux admins
 * de modifier des paramètres (prix du vote, dates limites, etc.) sans nécessiter
 * un redéploiement de l'application.
 */
export const saveConfig = catchAsync(async (req: Request, res: Response) => {
  // Extraction du tableau de configurations depuis le body.
  // Chaque élément contient une clé (identifiant du paramètre) et
  // une valeur (nouvelle valeur à appliquer).
  const configs = req.body.configs;

  // Le service gère l'upsert (insertion ou mise à jour) de chaque paire clé/valeur.
  await updateSiteConfig(configs);

  res.json({ success: true, message: 'Configuration mise à jour avec succès.' });
});

/**
 * Initie une demande de retrait financier.
 *
 * @route POST /api/admin/withdrawals
 * @param {Request} req - Requête contenant le montant (`amount`) à retirer.
 * @param {Response} res - Réponse contenant les détails du retrait initié.
 * @returns {void} Renvoie l'objet retrait avec un statut 201.
 *
 * @description
 * Les retraits correspondent à la récupération des fonds accumulés via les
 * paiements de votes. Le retrait est d'abord créé en statut "PENDING" avant
 * d'être traité par un processus externe (virement bancaire, mobile money, etc.).
 * Le code 201 signale la création de la ressource "retrait".
 */
export const createWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { amount } = req.body;

  // Le service vérifie que le solde disponible est suffisant et crée
  // l'enregistrement de retrait en base de données.
  const withdrawal = await initiateWithdrawal(amount);

  res.status(201).json({ success: true, message: 'Retrait initié avec succès.', withdrawal });
});

/**
 * Exporte l'historique complet des votes au format CSV.
 *
 * @route GET /api/admin/exports/votes
 * @param {Request} req - Requête HTTP (aucun paramètre requis).
 * @param {Response} res - Réponse contenant le fichier CSV en téléchargement.
 * @returns {void} Envoie directement le contenu CSV dans le corps de la réponse.
 *
 * @description
 * Le format CSV est choisi pour sa compatibilité universelle avec les outils
 * bureautiques (Excel, Google Sheets). Les headers HTTP sont configurés pour
 * déclencher un téléchargement automatique côté navigateur via Content-Disposition.
 * L'encodage UTF-8 est explicitement spécifié pour préserver les caractères
 * accentués français dans les noms des candidats et votants.
 */
export const exportVotes = catchAsync(async (req: Request, res: Response) => {
  // Génération du contenu CSV par le service d'export dédié.
  const csvContent = await generateVotesCSV();

  // Configuration des headers pour forcer le téléchargement du fichier
  // plutôt que son affichage dans le navigateur.
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="export_votes.csv"');

  // Envoi du contenu brut (pas de JSON ici) avec un statut 200 explicite.
  res.status(200).send(csvContent);
});

/**
 * Exporte l'historique complet des retraits au format CSV.
 *
 * @route GET /api/admin/exports/withdrawals
 * @param {Request} req - Requête HTTP (aucun paramètre requis).
 * @param {Response} res - Réponse contenant le fichier CSV en téléchargement.
 * @returns {void} Envoie directement le contenu CSV dans le corps de la réponse.
 *
 * @description
 * Même logique d'export que pour les votes. Le fichier est nommé
 * "export_retraits.csv" (en français) pour rester cohérent avec l'interface
 * utilisateur francophone de la plateforme MBOA NEXT STAR.
 */
export const exportWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const csvContent = await generateWithdrawalsCSV();

  // Headers identiques à exportVotes, seul le nom du fichier change.
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="export_retraits.csv"');

  res.status(200).send(csvContent);
});
