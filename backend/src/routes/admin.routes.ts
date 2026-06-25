/**
 * @file admin.routes.ts
 * @description Définition des routes protégées du back-office administrateur.
 *
 * Ce module regroupe toutes les routes nécessitant les privilèges admin :
 * gestion des candidats, consultation des statistiques, configuration du site,
 * gestion des retraits financiers et export des données.
 *
 * Toutes les routes de ce fichier sont protégées par le middleware
 * `authenticateAdmin` appliqué globalement via `router.use()`, ce qui évite
 * de le répéter sur chaque route individuellement.
 */

// Router Express pour isoler les routes admin sous le préfixe /api/admin.
import { Router } from 'express';

// Import de tous les contrôleurs admin : chaque fonction correspond à un
// endpoint spécifique du back-office.
import { createCandidate, getStats, saveConfig, createWithdrawal, exportVotes, exportWithdrawals } from '../controllers/admin.controller';

// Middleware d'authentification vérifiant la présence et la validité d'un
// JWT admin dans le header Authorization. Rejette avec 401 si absent ou invalide.
import { authenticateAdmin } from '../middlewares/authMiddleware';

// Middleware de validation Zod : même principe que dans auth.routes.ts,
// il valide le body/params/query avant d'atteindre le contrôleur.
import { validate } from '../middlewares/validationMiddleware';

// Zod pour la définition des schémas de validation typés.
import { z } from 'zod';

// Création du routeur dédié à l'administration.
const router = Router();

/**
 * Application globale du middleware d'authentification admin.
 *
 * @description
 * `router.use(authenticateAdmin)` protège TOUTES les routes définies après
 * cette ligne dans ce fichier. C'est un pattern Express qui évite la
 * répétition du middleware sur chaque route individuelle.
 *
 * Ce middleware :
 * 1. Extrait le token Bearer du header Authorization.
 * 2. Vérifie et décode le JWT avec la clé secrète.
 * 3. Vérifie que l'utilisateur a le rôle administrateur.
 * 4. Injecte les données de l'admin dans `req.user` pour les handlers suivants.
 */
router.use(authenticateAdmin);

/**
 * Schéma de validation pour la création d'un candidat.
 *
 * @description
 * Chaque champ a des contraintes minimales pour garantir l'intégrité des données :
 * - `firstName` et `lastName` : au moins 2 caractères pour éviter les saisies vides.
 * - `email` : format email valide pour l'envoi de notifications.
 * - `phone` : au moins 8 caractères pour couvrir les formats internationaux.
 * - `categoryId` : nombre positif car c'est une clé étrangère vers la table Category.
 */
const createCandidateSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'Le prénom est requis'),
    lastName: z.string().min(2, 'Le nom est requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(8, 'Numéro de téléphone invalide'),
    categoryId: z.number().positive()
  })
});

/**
 * Schéma de validation pour la mise à jour de la configuration du site.
 *
 * @description
 * Le body contient un tableau `configs` d'objets {key, value} plutôt qu'un
 * objet plat pour permettre la mise à jour de plusieurs paramètres en une
 * seule requête (batch update). Cela réduit le nombre d'appels API et
 * permet une mise à jour atomique de la configuration.
 */
const configSchema = z.object({
  body: z.object({
    configs: z.array(z.object({
      key: z.string(),   // Identifiant unique du paramètre (ex: "vote_price", "end_date")
      value: z.string()  // Valeur du paramètre, toujours stockée en string et convertie selon le contexte
    }))
  })
});

/**
 * Schéma de validation pour l'initiation d'un retrait financier.
 *
 * @description
 * Seul le montant est requis côté client. Les informations de destination
 * du retrait (compte bancaire, numéro mobile money) sont gérées côté serveur
 * à partir de la configuration de l'admin.
 */
const withdrawalSchema = z.object({
  body: z.object({
    amount: z.number().positive('Le montant doit être positif')
  })
});

// ──────────────────────────────────────────────────────────────────────────────
// Définition des routes du back-office admin
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @route POST /candidates
 * @description Crée un nouveau candidat et lui envoie un OTP via WhatsApp.
 * Pipeline : validation Zod → contrôleur createCandidate.
 */
router.post('/candidates', validate(createCandidateSchema), createCandidate);

/**
 * @route GET /dashboard/stats
 * @description Récupère les KPIs du tableau de bord (candidats, votes, revenus...).
 * Pas de validation nécessaire car c'est un GET sans paramètres.
 */
router.get('/dashboard/stats', getStats);

/**
 * @route POST /config
 * @description Met à jour la configuration dynamique du site (batch update).
 * Pipeline : validation Zod → contrôleur saveConfig.
 */
router.post('/config', validate(configSchema), saveConfig);

/**
 * @route POST /withdrawals
 * @description Initie une demande de retrait des fonds accumulés.
 * Pipeline : validation Zod → contrôleur createWithdrawal.
 */
router.post('/withdrawals', validate(withdrawalSchema), createWithdrawal);

/**
 * @route GET /exports/votes
 * @description Télécharge l'export CSV de tous les votes enregistrés.
 * Pas de validation nécessaire : c'est un GET qui génère un fichier complet.
 */
router.get('/exports/votes', exportVotes);

/**
 * @route GET /exports/withdrawals
 * @description Télécharge l'export CSV de tous les retraits effectués.
 */
router.get('/exports/withdrawals', exportWithdrawals);

// Export du routeur pour montage dans index.ts via `app.use('/api/admin', adminRoutes)`.
export default router;
