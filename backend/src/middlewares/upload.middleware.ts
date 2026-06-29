import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import path from 'path';
import { uploadToCloudinary } from '../config/cloudinary';
import fs from 'fs';

// File filter pour valider les types de fichiers
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Types MIME autorisés pour les images
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier non autorisé. Seuls les formats JPEG, PNG et WebP sont acceptés.', 400));
  }
};

// Configuration du stockage local TEMPORAIRE pour multer
// Les fichiers seront uploadés vers Cloudinary puis supprimés localement
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix);
  },
});

// Configuration complète de multer (stockage temporaire)
export const uploadSingle = multer({
  storage: tempStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

// Middleware pour gérer une seule photo de candidat
export const uploadCandidatePhoto = uploadSingle.single('profilePhoto');

// Configuration pour les sponsors (utilise aussi tempStorage)
export const uploadSponsorSingle = multer({
  storage: tempStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadSponsorLogo = uploadSponsorSingle.single('logo');

// Configuration pour les médias génériques (images/vidéos) - utilise aussi tempStorage
const mediaFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Format de fichier non supporté. Types acceptés: JPEG, PNG, WebP, GIF, MP4, MOV, WEBM.', 400));
  }
};

export const uploadMedia = multer({
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
export async function uploadToCloudinaryAndCleanup(
  filePath: string,
  folder: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  try {
    // Upload vers Cloudinary
    const { url } = await uploadToCloudinary(filePath, folder, resourceType);
    
    // Supprimer le fichier temporaire
    try {
      await fs.promises.unlink(filePath);
      console.log(`✅ Fichier temporaire supprimé: ${filePath}`);
    } catch (cleanupError) {
      console.warn(`⚠️  Impossible de supprimer le fichier temporaire: ${filePath}`, cleanupError);
    }
    
    return url;
  } catch (error: any) {
    // En cas d'erreur, essayer quand même de nettoyer le fichier temporaire
    try {
      await fs.promises.unlink(filePath);
    } catch (cleanupError) {
      // Ignorer l'erreur de nettoyage
    }
    throw error;
  }
}

// Middleware pour gérer les erreurs multer
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
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
