"use strict";
/**
 * @file candidate.routes.ts
 * @description Définition des routes dédiées au parcours candidat.
 *
 * Ce module gère deux étapes du cycle de vie d'un candidat :
 * 1. Vérification OTP (route publique) — Le candidat prouve son identité.
 * 2. Complétion de profil (route protégée) — Le candidat authentifié
 *    renseigne ses informations personnelles.
 *
 * L'authentification candidat est distincte de celle des admins : elle repose
 * sur un code OTP envoyé par WhatsApp plutôt que sur un email/mot de passe,
 * car le public cible est principalement mobile et dans un contexte où
 * WhatsApp est le canal de communication dominant.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Router Express pour le regroupement des routes candidat.
const express_1 = require("express");
// Contrôleurs candidat : chaque fonction gère un endpoint spécifique.
const candidate_controller_1 = require("../controllers/candidate.controller");
// Middleware d'authentification spécifique aux candidats : vérifie un JWT
// dont le payload contient un rôle "candidate" (différent du rôle "admin").
// Appliqué uniquement sur la route de complétion de profil.
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Middleware de validation Zod pour la vérification des données entrantes.
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
// Zod pour la définition déclarative des schémas de validation.
const zod_1 = require("zod");
// Création du routeur candidat.
const router = (0, express_1.Router)();
/**
 * Schéma de validation pour la vérification OTP.
 *
 * @description
 * - `phone` : numéro de téléphone du candidat, minimum 8 caractères pour
 *   couvrir les formats nationaux et internationaux (ex: "699123456" ou "+237699123456").
 * - `otp` : code à usage unique de exactement 6 caractères. La contrainte
 *   `length(6)` garantit un format strict (ni plus, ni moins) pour correspondre
 *   au format généré par le service.
 */
const verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().min(8, 'Numéro de téléphone requis'),
        otp: zod_1.z.string().length(6, 'Le code OTP doit faire 6 caractères')
    })
});
/**
 * Schéma de validation pour la mise à jour du profil candidat.
 *
 * @description
 * Seule la biographie est obligatoire — c'est le minimum requis pour qu'un
 * profil soit considéré comme "complet" et visible publiquement.
 *
 * Les champs optionnels permettent une complétion progressive du profil :
 * - `profilePhoto` : URL vers la photo de profil hébergée (optionnel car
 *   peut être uploadée ultérieurement).
 * - `videoUrl` : URL de présentation vidéo du candidat (optionnel).
 * - `socialLinks` : objet libre clé/valeur pour les réseaux sociaux
 *   (ex: { "instagram": "https://...", "tiktok": "https://..." }).
 *   Le type `record(string, string.url)` impose que chaque valeur soit une URL valide.
 */
const updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        biography: zod_1.z.string().min(1, 'La biographie est requise'),
        profilePhoto: zod_1.z.string().url().optional(),
        videoUrl: zod_1.z.string().url().optional(),
        socialLinks: zod_1.z.record(zod_1.z.string(), zod_1.z.string().url()).optional()
    })
});
// ──────────────────────────────────────────────────────────────────────────────
// Définition des routes candidat
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @route POST /verify-otp
 * @description Vérifie le code OTP envoyé au candidat via WhatsApp.
 *
 * Cette route est PUBLIQUE (pas de middleware d'authentification) car elle
 * constitue le mécanisme d'authentification lui-même. Le candidat fournit
 * son numéro de téléphone et le code OTP reçu, et reçoit un JWT en retour.
 *
 * Pipeline : validation Zod → contrôleur verifyOtp.
 */
const resendOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().min(8, 'Numéro de téléphone requis'),
    }),
});
router.post('/verify-otp', (0, validationMiddleware_1.validate)(verifyOtpSchema), candidate_controller_1.verifyOtp);
router.post('/resend-otp', (0, validationMiddleware_1.validate)(resendOtpSchema), candidate_controller_1.resendOtp);
/**
 * @route PUT /complete-profile
 * @description Permet au candidat de compléter son profil après authentification.
 *
 * Cette route est PROTÉGÉE par `authenticateCandidate` car seul le candidat
 * lui-même doit pouvoir modifier son profil. Le middleware vérifie le JWT
 * et injecte l'ID du candidat dans `req.user`.
 *
 * La méthode PUT est choisie car cette opération remplace/complète les
 * informations du profil (idempotente par nature).
 *
 * Pipeline : authenticateCandidate → validation Zod → contrôleur updateProfile.
 * Note : l'authentification est vérifiée AVANT la validation pour éviter de
 * valider des données provenant d'un utilisateur non autorisé.
 */
router.put('/complete-profile', authMiddleware_1.authenticateCandidate, (0, validationMiddleware_1.validate)(updateProfileSchema), candidate_controller_1.updateProfile);
// Export du routeur pour montage dans index.ts via `app.use('/api/candidates', candidateRoutes)`.
exports.default = router;
