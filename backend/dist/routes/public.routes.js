"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
// Router Express pour le regroupement des routes publiques.
const express_1 = require("express");
// Contrôleurs publics : chaque fonction gère un endpoint visible par les visiteurs.
const public_controller_1 = require("../controllers/public.controller");
const sponsor_controller_1 = require("../controllers/sponsor.controller");
// Middleware de validation Zod pour les routes qui acceptent des données en body.
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
// Zod pour la définition des schémas de validation.
const zod_1 = require("zod");
// Création du routeur public.
const router = (0, express_1.Router)();
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
const voteSchema = zod_1.z.object({
    body: zod_1.z.object({
        candidateId: zod_1.z.number().positive(),
        voterIdentifier: zod_1.z.string().min(8, 'Numéro de téléphone requis'),
        amount: zod_1.z.number().int().min(100).refine((v) => v % 100 === 0, 'Montant en multiples de 100 FCFA'),
        paymentMethod: zod_1.z.enum(['MTN_MOMO', 'ORANGE_MOMO', 'CARD']),
    }),
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
router.get('/config', public_controller_1.getConfig);
/**
 * @route GET /sponsors
 * @description Récupère tous les sponsors actifs avec leurs médias.
 * Utilisé pour afficher les logos et contenus des partenaires sur le site public.
 */
router.get('/sponsors', sponsor_controller_1.getPublicSponsors);
/**
 * @route GET /categories
 * @description Liste toutes les catégories avec leurs candidats actifs.
 * Point d'entrée principal de la page d'accueil du site public.
 */
router.get('/categories', public_controller_1.getCategories);
/**
 * @route GET /candidates/:slug
 * @description Récupère le profil complet d'un candidat via son slug URL-friendly.
 * Le slug est utilisé plutôt que l'ID numérique pour le SEO et la sécurité
 * (empêche l'énumération séquentielle des candidats).
 */
router.get('/candidates/:slug', public_controller_1.getCandidateBySlug);
/**
 * @route POST /votes/initiate
 * @description Initie un vote payant pour un candidat.
 * Crée un vote en statut PENDING et déclenche le processus de paiement
 * mobile via l'API Mavians. Le vote ne sera confirmé que lorsque le
 * webhook de paiement sera reçu et traité avec succès.
 *
 * Pipeline : validation Zod → contrôleur initiateCandidateVote.
 */
router.post('/votes/initiate', (0, validationMiddleware_1.validate)(voteSchema), public_controller_1.initiateCandidateVote);
router.get('/votes/status/:paymentReference', public_controller_1.getVoteStatus);
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
router.post('/payments/mavians/webhook', public_controller_1.maviansWebhook);
// Export du routeur pour montage dans index.ts via `app.use('/api', publicRoutes)`.
// Note : le préfixe est simplement '/api' (et non '/api/public') car ces routes
// sont destinées à être consommées directement par le frontend sans notion de
// "public" dans l'URL — ex: GET /api/categories, POST /api/votes/initiate.
exports.default = router;
