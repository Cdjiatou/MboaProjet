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

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement si pas déjà chargées
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

// Configuration de Cloudinary avec les variables d'environnement
cloudinary.config({
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
export async function uploadToCloudinary(
  filePath: string,
  folder: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `mboa-next-star/${folder}`,
      resource_type: resourceType,
      // Pour les vidéos, optimiser automatiquement
      ...(resourceType === 'video' && {
        eager: [
          { 
            width: 1280, 
            height: 720, 
            crop: 'limit',
            quality: 'auto',
            fetch_format: 'auto'
          }
        ],
        eager_async: true
      })
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error: any) {
    console.error('❌ Erreur upload Cloudinary:', error);
    throw new Error(`Échec de l'upload vers Cloudinary: ${error.message}`);
  }
}

/**
 * Supprime un fichier de Cloudinary
 * @param publicId ID public du fichier dans Cloudinary
 * @param resourceType Type de ressource ("image" ou "video")
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`✅ Fichier supprimé de Cloudinary: ${publicId}`);
  } catch (error: any) {
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
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
}

export default cloudinary;
