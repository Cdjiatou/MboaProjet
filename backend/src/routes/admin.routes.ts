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
import { 
  createCandidate, 
  getStats, 
  saveConfig, 
  createWithdrawal, 
  exportVotes, 
  exportWithdrawals,
  uploadCandidatePhoto,
  deleteCandidatePhoto,
  patchWithdrawalStatus,
  getWithdrawals,
  uploadSponsorLogoController,
  getCandidatesList,
  updateCandidateAdmin,
  deleteCandidateAdmin,
  getWhatsAppStatus,
  logoutWhatsAppSession,
  refreshWhatsAppSession,
  getSponsorsConfigController,
  saveSponsorsConfigController,
  uploadMediaController,
  updateAdminProfile,
} from '../controllers/admin.controller';

import {
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from '../controllers/adminUsers.controller';

// Import des routes sponsors
import sponsorRoutes from './sponsor.routes';

// Import du middleware upload
import { uploadCandidatePhoto as uploadMiddleware, uploadSponsorLogo, uploadMedia, handleMulterError } from '../middlewares/upload.middleware';

// Middleware d'authentification vérifiant la présence et la validité d'un
// JWT admin dans le header Authorization. Rejette avec 401 si absent ou invalide.
import { authenticateAdmin, requireSuperAdmin } from '../middlewares/authMiddleware';

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
 * - `categoryId` : peut être string ou number (multipart envoie en string).
 * 
 * Note: Quand multipart/form-data est utilisé, categoryId vient en string
 * et sera converti en number dans le contrôleur.
 */
const createCandidateSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'Le prénom est requis'),
    lastName: z.string().min(2, 'Le nom est requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(8, 'Numéro de téléphone invalide'),
    categoryId: z.union([z.number().positive(), z.string().regex(/^\d+$/)]),
    biography: z.string().optional(),
    profilePhoto: z.string().optional(),
    videoUrl: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    socialLinks: z.union([z.record(z.string()), z.string()]).optional()
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

const updateCandidateSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    categoryId: z.union([z.number().positive(), z.string().regex(/^\d+$/)]).optional(),
    biography: z.string().optional(),
    videoUrl: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    status: z.enum(['PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'SUSPENDED']).optional(),
    socialLinks: z.union([z.record(z.string()), z.string()]).optional(),
  }),
});

const updateAdminProfileSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8, 'Le mot de passe actuel doit faire au moins 8 caractères').optional(),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères').optional(),
  }).refine(data => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, {
    message: 'Le mot de passe actuel est requis pour définir un nouveau mot de passe',
    path: ['currentPassword'],
  }),
});

const adminUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères').optional(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.boolean().optional()
  })
});

const adminUserUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Le nom doit faire au moins 2 caractères').optional(),
    email: z.string().email('Email invalide').optional(),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères').optional(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.boolean().optional()
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
router.post('/candidates', 
  (req, res, next) => {
    // Appliquer multer seulement si Content-Type est multipart/form-data
    if (req.is('multipart/form-data')) {
      uploadMiddleware(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    } else {
      next();
    }
  },
  validate(createCandidateSchema), 
  createCandidate
);

/**
 * @route POST /candidates/:id/photo
 * @description Upload ou met à jour la photo d'un candidat.
 * Pipeline : multer middleware → contrôleur uploadCandidatePhoto.
 */
router.post('/candidates/:id/photo', uploadMiddleware, handleMulterError, uploadCandidatePhoto);

/**
 * @route DELETE /candidates/:id/photo
 * @description Supprime la photo d'un candidat.
 * Pipeline : contrôleur deleteCandidatePhoto.
 */
router.delete('/candidates/:id/photo', deleteCandidatePhoto);

/**
 * @route GET /candidates
 * @description Liste tous les candidats pour le back-office.
 */
router.get('/candidates', getCandidatesList);

/**
 * @route PATCH /candidates/:id
 * @description Met à jour un candidat existant.
 */
router.patch('/candidates/:id', validate(updateCandidateSchema), updateCandidateAdmin);

/**
 * @route DELETE /candidates/:id
 * @description Supprime un candidat et ses votes.
 */
router.delete('/candidates/:id', deleteCandidateAdmin);

/**
 * @route POST /sponsors/upload-logo
 * @description Upload le logo d'un sponsor depuis le PC.
 */
router.post('/sponsors/upload-logo', uploadSponsorLogo, handleMulterError, uploadSponsorLogoController);

/**
 * @route POST /media/upload
 * @description Upload un média générique (image/vidéo) pour le carousel/prestations/bannière.
 */
router.post('/media/upload', uploadMedia, handleMulterError, uploadMediaController);

/**
 * @route GET /sponsors/config
 * @description Récupère la liste complète des sponsors enregistrés.
 */
router.get('/sponsors/config', getSponsorsConfigController);

/**
 * @route POST /sponsors/config
 * @description Sauvegarde les sponsors (fusion ou remplacement complet).
 */
router.post('/sponsors/config', saveSponsorsConfigController);

/**
 * @route GET /dashboard/stats
 * @description Récupère les KPIs du tableau de bord (candidats, votes, revenus...).
 * Pas de validation nécessaire car c'est un GET sans paramètres.
 */
router.get('/dashboard/stats', getStats);

/**
 * @route PATCH /profile
 * @description Met à jour le profil de l'administrateur (email, password).
 */
router.patch('/profile', validate(updateAdminProfileSchema), updateAdminProfile);

/**
 * @route POST /config
 * @description Met à jour la configuration dynamique du site (batch update).
 * Pipeline : validation Zod → contrôleur saveConfig.
 */
router.post('/config', validate(configSchema), saveConfig);

/**
 * @route POST /withdrawals
 * @description Initie une demande de retrait des fonds accumulés.
 * Pipeline : requireSuperAdmin → validation Zod → contrôleur createWithdrawal.
 */
router.post('/withdrawals', requireSuperAdmin, validate(withdrawalSchema), createWithdrawal);

/**
 * @route PATCH /withdrawals/:id
 * @description Met à jour le statut d'un retrait de PENDING vers COMPLETED.
 * Pipeline : requireSuperAdmin → contrôleur patchWithdrawalStatus.
 */
router.patch('/withdrawals/:id', requireSuperAdmin, patchWithdrawalStatus);

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
router.get('/exports/withdrawals', requireSuperAdmin, exportWithdrawals);

/**
 * Routes pour la gestion de WhatsApp
 * Préfixe : /api/admin/whatsapp
 */
router.get('/whatsapp/status', requireSuperAdmin, getWhatsAppStatus);
router.post('/whatsapp/refresh', requireSuperAdmin, refreshWhatsAppSession);
router.post('/whatsapp/logout', requireSuperAdmin, logoutWhatsAppSession);

/**
 * Routes pour la gestion des utilisateurs administrateurs
 * Préfixe : /api/admin/users
 */
router.get('/users', requireSuperAdmin, listAdmins);
router.post('/users', requireSuperAdmin, validate(adminUserSchema), createAdmin);
router.patch('/users/:id', requireSuperAdmin, validate(adminUserUpdateSchema), updateAdmin);
router.delete('/users/:id', requireSuperAdmin, deleteAdmin);

/**
 * Routes pour la gestion des sponsors
 * Préfixe : /api/admin/sponsors
 */
router.use('/sponsors', sponsorRoutes);

// Export du routeur pour montage dans index.ts via `app.use('/api/admin', adminRoutes)`.
export default router;
