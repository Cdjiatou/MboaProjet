"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminProfile = exports.uploadMediaController = exports.saveSponsorsConfigController = exports.getSponsorsConfigController = exports.uploadSponsorLogoController = exports.logoutWhatsAppSession = exports.refreshWhatsAppSession = exports.getWhatsAppStatus = exports.deleteCandidateAdmin = exports.updateCandidateAdmin = exports.getCandidatesList = exports.deleteCandidatePhoto = exports.uploadCandidatePhoto = exports.exportWithdrawals = exports.exportVotes = exports.getWithdrawals = exports.patchWithdrawalStatus = exports.createWithdrawal = exports.saveConfig = exports.getStats = exports.createCandidate = void 0;
// Services métier du domaine administratif : chaque service encapsule une
// responsabilité unique (Single Responsibility Principle) pour faciliter
// les tests unitaires et la maintenance.
const admin_service_1 = require("../services/admin.service");
// La création de candidat est dans le service candidate plutôt que admin
// car la logique de création (génération OTP, envoi WhatsApp) appartient
// au domaine "candidat". Le contrôleur admin ne fait que l'invoquer.
const candidate_service_1 = require("../services/candidate.service");
// Services d'export CSV dédiés : séparés du service admin pour isoler
// la logique de sérialisation/formatage des données tabulaires.
const export_service_1 = require("../services/export.service");
// Wrapper asynchrone pour éviter les try/catch répétitifs dans chaque handler.
const catchAsync_1 = require("../utils/catchAsync");
// Classe d'erreur personnalisée pour les erreurs HTTP structurées
const AppError_1 = require("../utils/AppError");
// Prisma client pour les opérations de base de données
const prisma_1 = __importDefault(require("../utils/prisma"));
// Import de la fonction helper pour uploader vers Cloudinary
const upload_middleware_1 = require("../middlewares/upload.middleware");
const cloudinary_1 = require("../config/cloudinary");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Crée un nouveau candidat dans le système via l'interface coach/admin.
 *
 * @route POST /api/admin/candidates
 * @param {Request} req - Requête contenant les données du candidat dans le body
 *   (firstName, lastName, email, phone, categoryId). Peut aussi contenir un fichier photo
 *   via multipart/form-data si le middleware multer est appliqué.
 * @param {Response} res - Réponse HTTP.
 * @returns {void} Renvoie le candidat créé avec un code 201 (Created).
 *
 * @description
 * Le statut 201 est utilisé plutôt que 200 car il s'agit de la création
 * d'une nouvelle ressource (convention REST). Le service sous-jacent
 * génère automatiquement un code OTP et l'envoie au candidat via WhatsApp
 * pour qu'il puisse compléter son inscription.
 *
 * Si un fichier photo est uploadé (req.file), son chemin est automatiquement
 * ajouté au champ profilePhoto avant la création du candidat.
 */
exports.createCandidate = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const candidateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        categoryId: parseInt(req.body.categoryId, 10),
    };
    const bio = typeof req.body.biography === 'string' ? req.body.biography.trim() : '';
    if (bio)
        candidateData.biography = bio;
    if (req.body.videoUrl?.trim())
        candidateData.videoUrl = req.body.videoUrl.trim();
    if (req.body.city?.trim())
        candidateData.city = req.body.city.trim();
    if (req.body.country?.trim())
        candidateData.country = req.body.country.trim();
    // Upload vers Cloudinary au lieu du stockage local
    if (req.file) {
        const cloudinaryUrl = await (0, upload_middleware_1.uploadToCloudinaryAndCleanup)(req.file.path, 'candidates', 'image');
        candidateData.profilePhoto = cloudinaryUrl;
    }
    if (typeof req.body.socialLinks === 'string') {
        try {
            candidateData.socialLinks = JSON.parse(req.body.socialLinks);
        }
        catch {
            // ignore invalid JSON
        }
    }
    else if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
        candidateData.socialLinks = req.body.socialLinks;
    }
    const result = await (0, candidate_service_1.createCandidateByCoach)(candidateData);
    const { candidate, otpSent, whatsappConnected } = result;
    let message = 'Candidat créé avec succès.';
    if (otpSent) {
        message = `Candidat créé. Le code OTP a été envoyé par WhatsApp au ${candidate.phone}.`;
    }
    else if (!whatsappConnected) {
        message = 'Candidat créé, mais WhatsApp n\'est pas connecté. Connectez WhatsApp dans le panel admin pour envoyer l\'OTP.';
    }
    else {
        message = 'Candidat créé, mais l\'envoi WhatsApp a échoué. Vérifiez que le numéro est actif sur WhatsApp.';
    }
    res.status(201).json({
        success: true,
        message,
        data: { candidate, otpSent, whatsappConnected },
        candidate,
    });
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
exports.getStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const stats = await (0, admin_service_1.getDashboardStats)();
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
exports.saveConfig = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // Extraction du tableau de configurations depuis le body.
    // Chaque élément contient une clé (identifiant du paramètre) et
    // une valeur (nouvelle valeur à appliquer).
    const configs = req.body.configs;
    // Le service gère l'upsert (insertion ou mise à jour) de chaque paire clé/valeur.
    await (0, admin_service_1.updateSiteConfig)(configs);
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
exports.createWithdrawal = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { amount } = req.body;
    // Le service vérifie que le solde disponible est suffisant et crée
    // l'enregistrement de retrait en base de données.
    const withdrawal = await (0, admin_service_1.initiateWithdrawal)(amount);
    res.status(201).json({ success: true, message: 'Retrait initié avec succès.', withdrawal });
});
/**
 * Met à jour le statut d'un retrait de PENDING vers COMPLETED.
 *
 * @route PATCH /api/admin/withdrawals/:id
 * @param {Request} req - Requête contenant l'ID du retrait dans les paramètres.
 * @param {Response} res - Réponse contenant le retrait mis à jour.
 * @returns {void} Renvoie l'objet retrait avec le statut COMPLETED.
 *
 * @description
 * Ce endpoint permet de marquer un retrait comme complété après que le
 * virement bancaire ou le transfert mobile money a été effectué. Seule la
 * transition PENDING → COMPLETED est autorisée pour maintenir l'intégrité
 * de l'historique financier.
 */
exports.patchWithdrawalStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const withdrawalId = parseInt(req.params.id, 10);
    // Validation du paramètre ID
    if (isNaN(withdrawalId)) {
        throw new AppError_1.AppError('ID de retrait invalide.', 400);
    }
    // Le service vérifie l'existence du retrait et la validité de la transition
    const withdrawal = await (0, admin_service_1.updateWithdrawalStatus)(withdrawalId);
    res.json({ success: true, message: 'Statut du retrait mis à jour avec succès.', withdrawal });
});
/**
 * Récupère la liste de tous les retraits.
 *
 * @route GET /api/admin/withdrawals
 * @param {Request} req - Requête HTTP (aucun paramètre requis).
 * @param {Response} res - Réponse contenant la liste des retraits.
 * @returns {void} Renvoie tous les retraits triés par date décroissante.
 *
 * @description
 * Ce endpoint fournit l'historique complet des retraits pour affichage
 * dans le tableau de bord financier. Les retraits sont triés du plus
 * récent au plus ancien pour faciliter le suivi.
 */
exports.getWithdrawals = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const withdrawals = await (0, admin_service_1.listWithdrawals)();
    res.json({ success: true, data: withdrawals });
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
exports.exportVotes = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // Génération du contenu CSV par le service d'export dédié.
    const csvContent = await (0, export_service_1.generateVotesCSV)();
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
exports.exportWithdrawals = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const csvContent = await (0, export_service_1.generateWithdrawalsCSV)();
    // Headers identiques à exportVotes, seul le nom du fichier change.
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="export_retraits.csv"');
    res.status(200).send(csvContent);
});
/**
 * Upload ou met à jour la photo d'un candidat.
 *
 * @route POST /api/admin/candidates/:id/photo
 * @param {Request} req - Requête contenant le fichier photo et l'ID du candidat.
 * @param {Response} res - Réponse contenant le candidat mis à jour.
 * @returns {void} Renvoie le candidat avec la nouvelle URL de photo.
 *
 * @description
 * Ce endpoint gère l'upload de photo via multer. Le fichier est d'abord
 * sauvegardé temporairement, puis uploadé vers Cloudinary CDN pour un
 * chargement rapide et optimisé. Le fichier temporaire est automatiquement supprimé.
 */
exports.uploadCandidatePhoto = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const candidateId = parseInt(req.params.id, 10);
    // Vérifier que le candidat existe
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { id: candidateId },
    });
    if (!candidate) {
        throw new AppError_1.AppError('Candidat introuvable.', 404);
    }
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
        throw new AppError_1.AppError('Aucun fichier fourni.', 400);
    }
    // Supprimer l'ancienne photo de Cloudinary si elle existe
    if (candidate.profilePhoto && candidate.profilePhoto.includes('cloudinary.com')) {
        try {
            // Extraire le public_id de l'URL Cloudinary
            const urlParts = candidate.profilePhoto.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex !== -1) {
                const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
                const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
                await (0, cloudinary_1.deleteFromCloudinary)(publicId, 'image');
            }
        }
        catch (error) {
            console.warn('Impossible de supprimer l\'ancienne photo de Cloudinary:', error);
        }
    }
    // Upload vers Cloudinary
    const cloudinaryUrl = await (0, upload_middleware_1.uploadToCloudinaryAndCleanup)(req.file.path, 'candidates', 'image');
    // Mettre à jour le candidat avec la nouvelle URL Cloudinary
    const updatedCandidate = await prisma_1.default.candidate.update({
        where: { id: candidateId },
        data: { profilePhoto: cloudinaryUrl },
        include: { category: true },
    });
    res.json({
        success: true,
        message: 'Photo mise à jour avec succès sur Cloudinary.',
        data: { candidate: updatedCandidate },
    });
});
/**
 * Supprime la photo d'un candidat.
 *
 * @route DELETE /api/admin/candidates/:id/photo
 * @param {Request} req - Requête contenant l'ID du candidat.
 * @param {Response} res - Réponse de confirmation.
 * @returns {void} Confirme la suppression de la photo.
 *
 * @description
 * Supprime la photo de Cloudinary et met à jour la base de données.
 */
exports.deleteCandidatePhoto = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const candidateId = parseInt(req.params.id, 10);
    // Vérifier que le candidat existe
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { id: candidateId },
    });
    if (!candidate) {
        throw new AppError_1.AppError('Candidat introuvable.', 404);
    }
    if (!candidate.profilePhoto) {
        throw new AppError_1.AppError('Aucune photo à supprimer.', 400);
    }
    // Supprimer de Cloudinary si c'est une URL Cloudinary
    if (candidate.profilePhoto.includes('cloudinary.com')) {
        try {
            // Extraire le public_id de l'URL Cloudinary
            const urlParts = candidate.profilePhoto.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex !== -1) {
                const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
                const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
                await (0, cloudinary_1.deleteFromCloudinary)(publicId, 'image');
            }
        }
        catch (error) {
            console.warn('Impossible de supprimer la photo de Cloudinary:', error);
        }
    }
    const updatedCandidate = await prisma_1.default.candidate.update({
        where: { id: candidateId },
        data: { profilePhoto: null },
        include: { category: true },
    });
    res.json({
        success: true,
        message: 'Photo supprimée avec succès de Cloudinary.',
        candidate: updatedCandidate,
    });
});
const whatsapp_service_1 = require("../services/whatsapp.service");
/**
 * Liste tous les candidats pour le back-office
 */
exports.getCandidatesList = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const result = await (0, admin_service_1.listCandidates)({ search, page, limit });
    res.json({ success: true, data: result });
});
/** Met à jour un candidat (admin) */
exports.updateCandidateAdmin = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const candidateId = parseInt(req.params.id, 10);
    const body = { ...req.body };
    if (body.categoryId !== undefined) {
        body.categoryId = parseInt(String(body.categoryId), 10);
    }
    if (typeof body.socialLinks === 'string') {
        try {
            body.socialLinks = JSON.parse(body.socialLinks);
        }
        catch {
            delete body.socialLinks;
        }
    }
    const candidate = await (0, candidate_service_1.updateCandidateByAdmin)(candidateId, body);
    res.json({ success: true, data: candidate, message: 'Candidat mis à jour.' });
});
/** Supprime un candidat (admin) */
exports.deleteCandidateAdmin = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const candidateId = parseInt(req.params.id, 10);
    await (0, candidate_service_1.deleteCandidateByAdmin)(candidateId);
    res.json({ success: true, message: 'Candidat supprimé.' });
});
/**
 * Récupère le statut de connexion WhatsApp (et le QR code si nécessaire)
 */
exports.getWhatsAppStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const status = (0, whatsapp_service_1.getWhatsAppStatus)();
    res.json({ success: true, data: status });
});
/**
 * Redémarre la session WhatsApp pour générer un nouveau QR code
 */
exports.refreshWhatsAppSession = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, whatsapp_service_1.restartWhatsApp)(false);
    // Laisser Baileys générer le QR
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const status = (0, whatsapp_service_1.getWhatsAppStatus)();
    res.json({ success: true, data: status, message: 'Session WhatsApp redémarrée.' });
});
/**
 * Déconnecte la session WhatsApp
 */
exports.logoutWhatsAppSession = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, whatsapp_service_1.logoutWhatsApp)();
    res.json({ success: true, message: 'Déconnecté de WhatsApp. Un nouveau QR code va être généré.' });
});
/**
 * Upload le logo d'un sponsor vers Cloudinary et retourne l'URL publique
 */
exports.uploadSponsorLogoController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file) {
        throw new AppError_1.AppError('Aucun fichier fourni.', 400);
    }
    // Upload vers Cloudinary
    const logoUrl = await (0, upload_middleware_1.uploadToCloudinaryAndCleanup)(req.file.path, 'sponsors', 'image');
    res.status(201).json({
        success: true,
        message: 'Logo téléversé avec succès sur Cloudinary.',
        data: { logoUrl },
    });
});
/** Liste les sponsors enregistrés en configuration site (avec réparation auto si liste incomplète) */
exports.getSponsorsConfigController = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const sponsors = await (0, admin_service_1.repairSponsorsConfigIfNeeded)();
    res.json({ success: true, data: sponsors });
});
/** Sauvegarde les sponsors (replaceAll=true remplace la liste, false fusionne) */
exports.saveSponsorsConfigController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sponsors, replaceAll = true } = req.body;
    if (!Array.isArray(sponsors)) {
        throw new AppError_1.AppError('Le champ sponsors doit être un tableau.', 400);
    }
    const normalized = sponsors
        .filter((s) => s.name?.trim() && s.image?.trim())
        .map((s, i) => ({
        id: s.id || `sp-${Date.now()}-${i}`,
        name: s.name.trim(),
        url: s.url?.trim() || '',
        image: s.image.trim(),
    }));
    const saved = await (0, admin_service_1.saveSponsorsConfig)(normalized, replaceAll !== false);
    res.json({ success: true, data: saved, message: `${saved.length} sponsor(s) enregistré(s).` });
});
/**
 * Upload un média générique (image ou vidéo) vers Cloudinary et retourne l'URL publique
 */
exports.uploadMediaController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file) {
        throw new AppError_1.AppError('Aucun fichier fourni.', 400);
    }
    // Déterminer si c'est une image ou une vidéo
    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    // Upload vers Cloudinary
    const fileUrl = await (0, upload_middleware_1.uploadToCloudinaryAndCleanup)(req.file.path, 'site-media', resourceType);
    res.status(201).json({
        success: true,
        message: `${isVideo ? 'Vidéo' : 'Image'} téléversée avec succès sur Cloudinary CDN.`,
        data: { fileUrl },
    });
});
/**
 * Met à jour le profil de l'administrateur (email, mot de passe)
 */
exports.updateAdminProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
        throw new AppError_1.AppError('Non autorisé.', 401);
    }
    const updateData = {};
    if (email) {
        updateData.email = email;
    }
    if (password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        updateData.password = await bcryptjs_1.default.hash(password, salt);
    }
    if (Object.keys(updateData).length === 0) {
        throw new AppError_1.AppError('Aucune donnée à mettre à jour.', 400);
    }
    const updatedAdmin = await prisma_1.default.user.update({
        where: { id: adminId },
        data: updateData,
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
        }
    });
    res.json({
        success: true,
        message: 'Profil administrateur mis à jour avec succès.',
        data: { admin: updatedAdmin }
    });
});
