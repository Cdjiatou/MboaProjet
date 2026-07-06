"use strict";
/**
 * @file cloudinary.ts
 * @description Configuration de Cloudinary pour le stockage des médias
 *
 * Cloudinary est un service cloud qui offre:
 * - Stockage illimité de médias (images/vidéos)
 * - CDN global pour chargement rapide
 * - Optimisation automatique
 * - Transformation à la volée
 * - Pas de gestion d'espace disque
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.getOptimizedImageUrl = getOptimizedImageUrl;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Charger les variables d'environnement si pas déjà chargées
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
}
// Configuration de Cloudinary avec les variables d'environnement
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Toujours utiliser HTTPS
});
/**
 * Upload un fichier vers Cloudinary
 * @param filePath Chemin local du fichier à uploader
 * @param folder Dossier dans Cloudinary (ex: "candidates", "media")
 * @param resourceType Type de ressource ("image" ou "video")
 * @returns URL publique du fichier uploadé
 */
async function uploadToCloudinary(filePath, folder, resourceType = 'image') {
    try {
        const uploadOptions = {
            folder: `mboa-next-star/${folder}`,
            resource_type: resourceType,
            ...(resourceType === 'video' && {
                chunk_size: 6000000 // 6MB chunks to prevent timeouts
            })
        };
        const result = resourceType === 'video'
            ? await cloudinary_1.v2.uploader.upload_large(filePath, uploadOptions)
            : await cloudinary_1.v2.uploader.upload(filePath, uploadOptions);
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    }
    catch (error) {
        console.error('❌ Erreur upload Cloudinary:', error);
        throw new Error(`Échec de l'upload vers Cloudinary: ${error.message}`);
    }
}
/**
 * Supprime un fichier de Cloudinary
 * @param publicId ID public du fichier dans Cloudinary
 * @param resourceType Type de ressource ("image" ou "video")
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`✅ Fichier supprimé de Cloudinary: ${publicId}`);
    }
    catch (error) {
        console.error('❌ Erreur suppression Cloudinary:', error);
        // Ne pas lancer d'erreur car la suppression est souvent non-critique
    }
}
/**
 * Génère une URL optimisée pour une image Cloudinary
 * @param publicId ID public de l'image
 * @param width Largeur souhaitée
 * @param height Hauteur souhaitée
 * @returns URL optimisée
 */
function getOptimizedImageUrl(publicId, width, height) {
    return cloudinary_1.v2.url(publicId, {
        width,
        height,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto'
    });
}
exports.default = cloudinary_1.v2;
