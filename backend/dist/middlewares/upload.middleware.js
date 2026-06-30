"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.uploadMedia = exports.uploadSponsorLogo = exports.uploadSponsorSingle = exports.uploadCandidatePhoto = exports.uploadSingle = void 0;
exports.uploadToCloudinaryAndCleanup = uploadToCloudinaryAndCleanup;
const multer_1 = __importDefault(require("multer"));
const AppError_1 = require("../utils/AppError");
const cloudinary_1 = require("../config/cloudinary");
const fs_1 = __importDefault(require("fs"));
// File filter pour valider les types de fichiers
const fileFilter = (req, file, cb) => {
    // Types MIME autorisés pour les images
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.AppError('Type de fichier non autorisé. Seuls les formats JPEG, PNG et WebP sont acceptés.', 400));
    }
};
// Configuration du stockage local TEMPORAIRE pour multer
// Les fichiers seront uploadés vers Cloudinary puis supprimés localement
const tempStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueSuffix);
    },
});
// Configuration complète de multer (stockage temporaire)
exports.uploadSingle = (0, multer_1.default)({
    storage: tempStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite de 5MB
    },
});
// Middleware pour gérer une seule photo de candidat
exports.uploadCandidatePhoto = exports.uploadSingle.single('profilePhoto');
// Configuration pour les sponsors (utilise aussi tempStorage)
exports.uploadSponsorSingle = (0, multer_1.default)({
    storage: tempStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.uploadSponsorLogo = exports.uploadSponsorSingle.single('logo');
// Configuration pour les médias génériques (images/vidéos) - utilise aussi tempStorage
const mediaFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.AppError('Format de fichier non supporté. Types acceptés: JPEG, PNG, WebP, GIF, MP4, MOV, WEBM.', 400));
    }
};
exports.uploadMedia = (0, multer_1.default)({
    storage: tempStorage,
    fileFilter: mediaFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
    },
}).single('file');
/**
 * Helper pour uploader un fichier vers Cloudinary et supprimer le fichier temporaire
 * @param filePath Chemin du fichier temporaire
 * @param folder Dossier dans Cloudinary (ex: 'candidates', 'sponsors', 'site-media')
 * @param resourceType Type de ressource ('image' ou 'video')
 * @returns URL Cloudinary du fichier uploadé
 */
async function uploadToCloudinaryAndCleanup(filePath, folder, resourceType = 'image') {
    try {
        // Upload vers Cloudinary
        const { url } = await (0, cloudinary_1.uploadToCloudinary)(filePath, folder, resourceType);
        // Supprimer le fichier temporaire
        try {
            await fs_1.default.promises.unlink(filePath);
            console.log(`✅ Fichier temporaire supprimé: ${filePath}`);
        }
        catch (cleanupError) {
            console.warn(`⚠️  Impossible de supprimer le fichier temporaire: ${filePath}`, cleanupError);
        }
        return url;
    }
    catch (error) {
        // En cas d'erreur, essayer quand même de nettoyer le fichier temporaire
        try {
            await fs_1.default.promises.unlink(filePath);
        }
        catch (cleanupError) {
            // Ignorer l'erreur de nettoyage
        }
        throw error;
    }
}
// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'La taille du fichier dépasse la limite autorisée.',
            });
        }
        return res.status(400).json({
            success: false,
            message: `Erreur de téléchargement: ${err.message}`,
        });
    }
    next(err);
};
exports.handleMulterError = handleMulterError;
