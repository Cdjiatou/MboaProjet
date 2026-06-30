"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Router Express pour isoler les routes admin sous le préfixe /api/admin.
const express_1 = require("express");
// Import de tous les contrôleurs admin : chaque fonction correspond à un
// endpoint spécifique du back-office.
const admin_controller_1 = require("../controllers/admin.controller");
// Import des routes sponsors
const sponsor_routes_1 = __importDefault(require("./sponsor.routes"));
// Import du middleware upload
const upload_middleware_1 = require("../middlewares/upload.middleware");
// Middleware d'authentification vérifiant la présence et la validité d'un
// JWT admin dans le header Authorization. Rejette avec 401 si absent ou invalide.
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Middleware de validation Zod : même principe que dans auth.routes.ts,
// il valide le body/params/query avant d'atteindre le contrôleur.
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
// Zod pour la définition des schémas de validation typés.
const zod_1 = require("zod");
// Création du routeur dédié à l'administration.
const router = (0, express_1.Router)();
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
router.use(authMiddleware_1.authenticateAdmin);
/**
 * Schéma de validation pour la création d'un candidat.
 *
 * @description
 * Chaque champ a des contraintes minimales pour garantir l'intégrité des données :
 * - `firstName` et `lastName` : au moins 2 caractères pour éviter les saisies vides.
 * - `email` : format email valide pour l'envoi de notifications.
 * - `phone` : au moins 8 caractères pour couvrir les formats internationaux.
 * - `categoryId` : peut être string ou number (multipart envoie en string).
 *
 * Note: Quand multipart/form-data est utilisé, categoryId vient en string
 * et sera converti en number dans le contrôleur.
 */
const createCandidateSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2, 'Le prénom est requis'),
        lastName: zod_1.z.string().min(2, 'Le nom est requis'),
        email: zod_1.z.string().email('Email invalide'),
        phone: zod_1.z.string().min(8, 'Numéro de téléphone invalide'),
        categoryId: zod_1.z.union([zod_1.z.number().positive(), zod_1.z.string().regex(/^\d+$/)]),
        biography: zod_1.z.string().optional(),
        profilePhoto: zod_1.z.string().optional(),
        videoUrl: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        socialLinks: zod_1.z.union([zod_1.z.record(zod_1.z.string()), zod_1.z.string()]).optional()
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
const configSchema = zod_1.z.object({
    body: zod_1.z.object({
        configs: zod_1.z.array(zod_1.z.object({
            key: zod_1.z.string(), // Identifiant unique du paramètre (ex: "vote_price", "end_date")
            value: zod_1.z.string() // Valeur du paramètre, toujours stockée en string et convertie selon le contexte
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
const withdrawalSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive('Le montant doit être positif')
    })
});
const updateCandidateSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2).optional(),
        lastName: zod_1.z.string().min(2).optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().min(8).optional(),
        categoryId: zod_1.z.union([zod_1.z.number().positive(), zod_1.z.string().regex(/^\d+$/)]).optional(),
        biography: zod_1.z.string().optional(),
        videoUrl: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        status: zod_1.z.enum(['PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'SUSPENDED']).optional(),
        socialLinks: zod_1.z.union([zod_1.z.record(zod_1.z.string()), zod_1.z.string()]).optional(),
    }),
});
const updateAdminProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email invalide').optional(),
        password: zod_1.z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères').optional(),
    })
});
// ──────────────────────────────────────────────────────────────────────────────
// Définition des routes du back-office admin
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @route POST /candidates
 * @description Crée un nouveau candidat et lui envoie un OTP via WhatsApp.
 * Supporte l'upload optionnel d'une photo via multipart/form-data.
 * Pipeline : (optionnel) multer middleware → validation Zod → contrôleur createCandidate.
 */
router.post('/candidates', (req, res, next) => {
    // Appliquer multer seulement si Content-Type est multipart/form-data
    if (req.is('multipart/form-data')) {
        (0, upload_middleware_1.uploadCandidatePhoto)(req, res, (err) => {
            if (err) {
                return (0, upload_middleware_1.handleMulterError)(err, req, res, next);
            }
            next();
        });
    }
    else {
        next();
    }
}, (0, validationMiddleware_1.validate)(createCandidateSchema), admin_controller_1.createCandidate);
/**
 * @route POST /candidates/:id/photo
 * @description Upload ou met à jour la photo d'un candidat.
 * Pipeline : multer middleware → contrôleur uploadCandidatePhoto.
 */
router.post('/candidates/:id/photo', upload_middleware_1.uploadCandidatePhoto, upload_middleware_1.handleMulterError, admin_controller_1.uploadCandidatePhoto);
/**
 * @route DELETE /candidates/:id/photo
 * @description Supprime la photo d'un candidat.
 * Pipeline : contrôleur deleteCandidatePhoto.
 */
router.delete('/candidates/:id/photo', admin_controller_1.deleteCandidatePhoto);
/**
 * @route GET /candidates
 * @description Liste tous les candidats pour le back-office.
 */
router.get('/candidates', admin_controller_1.getCandidatesList);
/**
 * @route PATCH /candidates/:id
 * @description Met à jour un candidat existant.
 */
router.patch('/candidates/:id', (0, validationMiddleware_1.validate)(updateCandidateSchema), admin_controller_1.updateCandidateAdmin);
/**
 * @route DELETE /candidates/:id
 * @description Supprime un candidat et ses votes.
 */
router.delete('/candidates/:id', admin_controller_1.deleteCandidateAdmin);
/**
 * @route POST /sponsors/upload-logo
 * @description Upload le logo d'un sponsor depuis le PC.
 */
router.post('/sponsors/upload-logo', upload_middleware_1.uploadSponsorLogo, upload_middleware_1.handleMulterError, admin_controller_1.uploadSponsorLogoController);
/**
 * @route POST /media/upload
 * @description Upload un média générique (image/vidéo) pour le carousel/prestations/bannière.
 */
router.post('/media/upload', upload_middleware_1.uploadMedia, upload_middleware_1.handleMulterError, admin_controller_1.uploadMediaController);
/**
 * @route GET /sponsors/config
 * @description Récupère la liste complète des sponsors enregistrés.
 */
router.get('/sponsors/config', admin_controller_1.getSponsorsConfigController);
/**
 * @route POST /sponsors/config
 * @description Sauvegarde les sponsors (fusion ou remplacement complet).
 */
router.post('/sponsors/config', admin_controller_1.saveSponsorsConfigController);
/**
 * @route GET /dashboard/stats
 * @description Récupère les KPIs du tableau de bord (candidats, votes, revenus...).
 * Pas de validation nécessaire car c'est un GET sans paramètres.
 */
router.get('/dashboard/stats', admin_controller_1.getStats);
/**
 * @route PATCH /profile
 * @description Met à jour le profil de l'administrateur (email, password).
 */
router.patch('/profile', (0, validationMiddleware_1.validate)(updateAdminProfileSchema), admin_controller_1.updateAdminProfile);
/**
 * @route POST /config
 * @description Met à jour la configuration dynamique du site (batch update).
 * Pipeline : validation Zod → contrôleur saveConfig.
 */
router.post('/config', (0, validationMiddleware_1.validate)(configSchema), admin_controller_1.saveConfig);
/**
 * @route POST /withdrawals
 * @description Initie une demande de retrait des fonds accumulés.
 * Pipeline : validation Zod → contrôleur createWithdrawal.
 */
router.post('/withdrawals', (0, validationMiddleware_1.validate)(withdrawalSchema), admin_controller_1.createWithdrawal);
/**
 * @route PATCH /withdrawals/:id
 * @description Met à jour le statut d'un retrait de PENDING vers COMPLETED.
 * Pipeline : contrôleur patchWithdrawalStatus.
 */
router.patch('/withdrawals/:id', admin_controller_1.patchWithdrawalStatus);
/**
 * @route GET /exports/votes
 * @description Télécharge l'export CSV de tous les votes enregistrés.
 * Pas de validation nécessaire : c'est un GET qui génère un fichier complet.
 */
router.get('/exports/votes', admin_controller_1.exportVotes);
/**
 * @route GET /exports/withdrawals
 * @description Télécharge l'export CSV de tous les retraits effectués.
 */
router.get('/exports/withdrawals', admin_controller_1.exportWithdrawals);
/**
 * Routes pour la gestion de WhatsApp
 * Préfixe : /api/admin/whatsapp
 */
router.get('/whatsapp/status', admin_controller_1.getWhatsAppStatus);
router.post('/whatsapp/refresh', admin_controller_1.refreshWhatsAppSession);
router.post('/whatsapp/logout', admin_controller_1.logoutWhatsAppSession);
/**
 * Routes pour la gestion des sponsors
 * Préfixe : /api/admin/sponsors
 */
router.use('/sponsors', sponsor_routes_1.default);
// Export du routeur pour montage dans index.ts via `app.use('/api/admin', adminRoutes)`.
exports.default = router;
