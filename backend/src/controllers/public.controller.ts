/**
 * @file public.controller.ts
 * @description Contrôleur exposant les endpoints accessibles sans authentification.
 *
 * Ces routes constituent l'API publique de la plateforme MBOA NEXT STAR,
 * consommée par le frontend pour afficher la page d'accueil, les catégories,
 * les profils des candidats, et pour permettre aux visiteurs de voter.
 *
 * Aucun middleware d'authentification n'est appliqué sur ces routes car elles
 * doivent être accessibles à tout visiteur anonyme du site.
 *
 * Note architecturale : ce contrôleur accède directement à Prisma (sans passer
 * par un service dédié) pour les requêtes de lecture simples (getConfig,
 * getCategories, getCandidateBySlug). Ce choix de pragmatisme évite de créer
 * des services qui ne feraient que relayer l'appel Prisma sans logique métier.
 * Les opérations complexes (vote, webhook) sont en revanche déléguées à des services.
 */

// Types Express pour le typage des handlers HTTP.
import { Request, Response } from 'express';

// Client Prisma singleton : importé depuis un module utilitaire centralisé
// pour garantir qu'une seule instance du client est utilisée dans toute
// l'application (évite les problèmes de connexion multiple en dev).
import prisma from '../utils/prisma';

// Services de vote : la logique de paiement et de traitement des webhooks
// est suffisamment complexe pour justifier une couche service dédiée.
import { initiateVote, handleMaviansWebhook, checkAndUpdateVoteStatus } from '../services/vote.service';

// Wrapper asynchrone pour la gestion centralisée des erreurs.
import { catchAsync } from '../utils/catchAsync';

// Classe d'erreur personnalisée pour les erreurs HTTP structurées.
import { AppError } from '../utils/AppError';
import { parseSponsorsConfig, resolvePublicSponsors } from '../utils/sponsorsConfig';

/**
 * Récupère la configuration publique du site sous forme de map clé/valeur.
 *
 * @route GET /api/config
 * @param {Request} req - Requête HTTP (aucun paramètre requis).
 * @param {Response} res - Réponse contenant la map de configuration.
 * @returns {void} Renvoie un objet JSON où chaque clé de configuration
 *   est associée à sa valeur courante.
 *
 * @description
 * La configuration est stockée en base sous forme de lignes individuelles
 * (clé/valeur) pour permettre des mises à jour granulaires. Le `reduce`
 * transforme ce tableau en un objet plat { clé: valeur } plus pratique
 * à consommer côté frontend (accès direct par nom de propriété plutôt
 * que recherche dans un tableau).
 */
export const getConfig = catchAsync(async (req: Request, res: Response) => {
  // Récupération de toutes les entrées de configuration depuis la table SiteConfiguration.
  const configs = await prisma.siteConfiguration.findMany();

  // Transformation du tableau [{configKey, configValue}, ...] en objet plat
  // { configKey1: configValue1, configKey2: configValue2, ... }.
  // Le pattern reduce + spread est utilisé pour construire la map de manière immutable.
  const configMap: Record<string, string> = configs.reduce(
    (acc, curr) => ({ ...acc, [curr.configKey]: curr.configValue }),
    {} as Record<string, string>
  );

  const resolvedSponsors = resolvePublicSponsors(parseSponsorsConfig(configMap.sponsors as string | undefined));
  configMap.sponsors = JSON.stringify(resolvedSponsors);

  res.json({ success: true, data: configMap });
});

/**
 * Récupère toutes les catégories du concours avec leurs candidats actifs.
 *
 * @route GET /api/categories
 * @param {Request} req - Requête HTTP (aucun paramètre requis).
 * @param {Response} res - Réponse contenant le tableau des catégories.
 * @returns {void} Renvoie les catégories incluant pour chacune la liste
 *   de ses candidats actifs avec un sous-ensemble de champs.
 *
 * @description
 * La clause `include` avec `where` et `select` imbriqués permet de :
 * - Filtrer uniquement les candidats actifs (exclure les brouillons/suspendus)
 *   via `where: { status: 'ACTIVE' }`.
 * - Limiter les champs retournés via `select` pour réduire la taille de la
 *   réponse et éviter d'exposer des données sensibles (email, phone, etc.)
 *   sur une route publique.
 * - Le champ `totalVotesCache` est un compteur dénormalisé mis à jour à chaque
 *   vote pour éviter un COUNT coûteux à chaque affichage de la page.
 */
export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      candidates: {
        // Filtre : seuls les candidats dont le profil est validé et actif sont affichés.
        where: { status: 'ACTIVE' },
        // Sélection restrictive : on ne renvoie que les champs nécessaires
        // à l'affichage public (carte candidat) pour des raisons de sécurité
        // et de performance réseau.
        select: {
          id: true,
          firstName: true,
          lastName: true,
          slug: true,
          profilePhoto: true,
          totalVotesCache: true,
          city: true,
          country: true,
          status: true,
          videoUrl: true,
          updatedAt: true,
        }
      }
    }
  });

  res.json({ success: true, data: categories });
});

/**
 * Récupère le profil complet d'un candidat à partir de son slug.
 *
 * @route GET /api/candidates/:slug
 * @param {Request} req - Requête contenant le `slug` dans les paramètres d'URL.
 * @param {Response} res - Réponse contenant les données complètes du candidat.
 * @returns {void} Renvoie le candidat avec sa catégorie associée.
 * @throws {AppError} 404 si le candidat n'existe pas ou n'est pas actif.
 *
 * @description
 * Le slug est utilisé comme identifiant public plutôt que l'ID numérique
 * pour deux raisons :
 * 1. SEO — un slug lisible ("jean-dupont") est meilleur qu'un ID ("/candidates/42").
 * 2. Sécurité — ne pas exposer les IDs auto-incrémentés limite l'énumération.
 *
 * La vérification du statut ACTIVE après la requête (et non dans le WHERE)
 * permet de distinguer "candidat inexistant" de "candidat inactif", même si
 * les deux cas renvoient la même erreur 404 au client (pour ne pas divulguer
 * l'existence de candidats non publiés).
 */
export const getCandidateBySlug = catchAsync(async (req: Request, res: Response) => {
  // Extraction du slug depuis les paramètres d'URL (ex: /candidates/jean-dupont).
  const { slug } = req.params;

  // Requête Prisma avec inclusion de la catégorie parente pour afficher
  // le contexte du candidat (nom de la catégorie, description, etc.).
  const candidate = await prisma.candidate.findUnique({
    where: { slug },
    include: { category: true }
  });

  // Double vérification : existence du candidat ET statut actif.
  // Un candidat suspendu ou en brouillon ne doit pas être visible publiquement.
  if (!candidate || candidate.status !== 'ACTIVE') {
    throw new AppError('Candidat introuvable ou inactif.', 404);
  }

  res.json({ success: true, data: candidate });
});

/**
 * Initie le processus de vote pour un candidat (avec paiement).
 *
 * @route POST /api/votes/initiate
 * @param {Request} req - Requête contenant `candidateId` et `voterIdentifier` dans le body.
 * @param {Response} res - Réponse contenant les détails du vote et du paiement initié.
 * @returns {void} Renvoie le vote créé avec les instructions de paiement (code 201).
 *
 * @description
 * Le vote sur MBOA NEXT STAR est payant — chaque vote est associé à une
 * transaction de paiement mobile (via le prestataire Mavians). Le service
 * `initiateVote` crée l'enregistrement de vote en statut PENDING et initie
 * la demande de paiement auprès de l'API Mavians.
 *
 * La conversion `Number(candidateId)` est une sécurité supplémentaire car
 * même après validation Zod, certains clients peuvent envoyer l'ID en string.
 */
export const initiateCandidateVote = catchAsync(async (req: Request, res: Response) => {
  const { candidateId, voterIdentifier, amount, paymentMethod } = req.body;

  const result = await initiateVote(
    Number(candidateId),
    voterIdentifier,
    Number(amount),
    paymentMethod
  );

  res.status(201).json({
    success: true,
    message: result.message || 'Paiement initié.',
    data: {
      vote: result.vote,
      paymentUrl: result.paymentUrl,
      votesCount: result.votesCount,
    },
  });
});

/**
 * Reçoit et traite les notifications de paiement (webhooks) de Mavians.
 *
 * @route POST /api/payments/mavians/webhook
 * @param {Request} req - Requête envoyée par le serveur Mavians contenant
 *   `paymentReference` et `status` du paiement.
 * @param {Response} res - Réponse d'acquittement pour le serveur Mavians.
 * @returns {void} Confirme le traitement du webhook.
 * @throws {AppError} 400 si les champs requis sont manquants dans le payload.
 *
 * @description
 * Ce endpoint est appelé par le prestataire de paiement Mavians (server-to-server)
 * pour notifier l'application du résultat d'un paiement. Il est crucial car c'est
 * le seul moyen fiable de confirmer qu'un vote a été payé.
 *
 * Sécurité : idéalement, ce webhook devrait vérifier une signature HMAC ou
 * l'adresse IP source pour s'assurer que l'appel provient bien de Mavians.
 * La validation basique du payload (présence des champs) est un minimum.
 *
 * Le service `handleMaviansWebhook` met à jour le statut du vote en base
 * (PENDING → CONFIRMED ou FAILED) et incrémente le compteur de votes du
 * candidat si le paiement est confirmé.
 */
export const maviansWebhook = catchAsync(async (req: Request, res: Response) => {
  const { paymentReference, status } = req.body;

  // Validation minimale du payload : les deux champs sont indispensables
  // pour identifier et traiter la transaction correspondante.
  if (!paymentReference || !status) {
    throw new AppError('Payload invalide.', 400);
  }

  // Traitement du webhook : mise à jour du vote et éventuellement du compteur
  // de votes du candidat selon le statut de paiement reçu.
  const updatedVote = await handleMaviansWebhook(paymentReference, status);

  // Réponse d'acquittement : Mavians attend un 200 pour ne pas retenter l'envoi.
  res.json({ success: true, message: 'Webhook traité avec succès.', vote: updatedVote });
});

/**
 * Récupère le statut d'un vote spécifique par sa référence de paiement.
 * Utilisé par le frontend pour suivre la transaction (polling).
 */
export const getVoteStatus = catchAsync(async (req: Request, res: Response) => {
  const { paymentReference } = req.params;

  const vote = await checkAndUpdateVoteStatus(paymentReference);

  res.json({ success: true, data: { status: vote.status, vote } });
});
