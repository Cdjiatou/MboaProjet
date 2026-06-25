/**
 * @file public.routes.ts
 * @description Définition des routes publiques accessibles sans authentification.
 *
 * Ces routes constituent l'API consommée par le frontend pour :
 * - Afficher la configuration du site (thème, dates, prix du vote...).
 * - Lister les catégories et les candidats actifs.
 * - Consulter le profil détaillé d'un candidat.
 * - Permettre aux visiteurs de voter (avec paiement mobile).
 * - Recevoir les notifications de paiement de Mavians (webhook server-to-server).
 *
 * Aucun middleware d'authentification n'est appliqué car ces routes doivent
 * être accessibles à tout visiteur anonyme. La seule protection est la
 * validation Zod sur les routes nécessitant un body (ex: vote).
 */

// Router Express pour le regroupement des routes publiques.
import { Router } from 'express';

// Contrôleurs publics : chaque fonction gère un endpoint visible par les visiteurs.
import { getConfig, getCategories, getCandidateBySlug, initiateCandidateVote, maviansWebhook, getVoteStatus } from '../controllers/public.controller';

// Middleware de validation Zod pour les routes qui acceptent des données en body.
import { validate } from '../middlewares/validationMiddleware';

// Zod pour la définition des schémas de validation.
import { z } from 'zod';

// Création du routeur public.
const router = Router();

/**
 * Schéma de validation pour l'initiation d'un vote.
 *
 * @description
 * - `candidateId` : identifiant numérique positif du candidat ciblé.
 * - `voterIdentifier` : identifiant du votant (numéro de téléphone ou email)
 *   utilisé pour le suivi des paiements et la prévention de la fraude.
 *   Le minimum de 1 caractère garantit qu'il n'est pas vide.
 *
 * Note : l'échappement `\'` dans le message d'erreur est nécessaire car
 * la chaîne est délimitée par des apostrophes simples.
 */
const voteSchema = z.object({
  body: z.object({
    candidateId: z.number().positive(),
    voterIdentifier: z.string().min(1, 'L\'identifiant du votant est requis')
  })
});

// ──────────────────────────────────────────────────────────────────────────────
// Définition des routes publiques
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @route GET /config
 * @description Récupère la configuration publique du site sous forme de map clé/valeur.
 * Utilisé par le frontend pour charger les paramètres dynamiques (prix du vote,
 * dates du concours, couleurs du thème, etc.) au démarrage de l'application.
 */
router.get('/config', getConfig);

/**
 * @route GET /categories
 * @description Liste toutes les catégories avec leurs candidats actifs.
 * Point d'entrée principal de la page d'accueil du site public.
 */
router.get('/categories', getCategories);

/**
 * @route GET /candidates/:slug
 * @description Récupère le profil complet d'un candidat via son slug URL-friendly.
 * Le slug est utilisé plutôt que l'ID numérique pour le SEO et la sécurité
 * (empêche l'énumération séquentielle des candidats).
 */
router.get('/candidates/:slug', getCandidateBySlug);

/**
 * @route POST /votes/initiate
 * @description Initie un vote payant pour un candidat.
 * Crée un vote en statut PENDING et déclenche le processus de paiement
 * mobile via l'API Mavians. Le vote ne sera confirmé que lorsque le
 * webhook de paiement sera reçu et traité avec succès.
 *
 * Pipeline : validation Zod → contrôleur initiateCandidateVote.
 */
router.post('/votes/initiate', validate(voteSchema), initiateCandidateVote);
router.get('/votes/status/:paymentReference', getVoteStatus);

/**
 * @route POST /payments/mavians/webhook
 * @description Reçoit les notifications de statut de paiement de Mavians.
 *
 * Cette route est appelée directement par les serveurs de Mavians (server-to-server),
 * pas par le frontend. Elle ne nécessite pas de validation Zod car le format
 * du payload est dicté par Mavians et vérifié manuellement dans le contrôleur.
 *
 * Important : en production, il faudrait ajouter une vérification de signature
 * HMAC ou un filtrage par IP pour s'assurer que les appels proviennent bien
 * de Mavians et non d'un attaquant simulant des confirmations de paiement.
 */
router.post('/payments/mavians/webhook', maviansWebhook);

// Export du routeur pour montage dans index.ts via `app.use('/api', publicRoutes)`.
// Note : le préfixe est simplement '/api' (et non '/api/public') car ces routes
// sont destinées à être consommées directement par le frontend sans notion de
// "public" dans l'URL — ex: GET /api/categories, POST /api/votes/initiate.
export default router;
