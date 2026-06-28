import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Stockage des photos de candidats dans uploads/candidates/
    cb(null, path.join(__dirname, '../../uploads/candidates'));
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Sanitize filename to prevent path traversal attacks
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Generate unique filename: {timestamp}_{sanitized-name}
    const uniqueSuffix = Date.now();
    const ext = path.extname(sanitizedOriginalName);
    const nameWithoutExt = path.basename(sanitizedOriginalName, ext);
    
    cb(null, `${uniqueSuffix}_${nameWithoutExt}${ext}`);
  },
});

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

// Configuration complète de multer
export const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

// Middleware pour gérer une seule photo
export const uploadCandidatePhoto = uploadSingle.single('profilePhoto');

const sponsorStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, path.join(__dirname, '../../uploads/sponsors'));
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now();
    const ext = path.extname(sanitizedOriginalName);
    const nameWithoutExt = path.basename(sanitizedOriginalName, ext);
    cb(null, `${uniqueSuffix}_${nameWithoutExt}${ext}`);
  },
});

export const uploadSponsorSingle = multer({
  storage: sponsorStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadSponsorLogo = uploadSponsorSingle.single('logo');

// Middleware pour gérer les erreurs multer
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'La taille du fichier dépasse la limite de 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur de téléchargement: ${err.message}`,
    });
  }
  next(err);
};
