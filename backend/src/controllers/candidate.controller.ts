/**
 * @file candidate.controller.ts
 * @description Contrôleur gérant les actions propres aux candidats du concours.
 *
 * Ce fichier couvre deux étapes clés du parcours candidat :
 * 1. La vérification OTP — qui valide l'identité du candidat via son numéro
 *    de téléphone et le code reçu par WhatsApp.
 * 2. La complétion du profil — qui permet au candidat authentifié de renseigner
 *    sa biographie, photo, vidéo et liens sociaux.
 *
 * L'authentification candidat repose sur un OTP (One-Time Password) plutôt que
 * sur un couple email/mot de passe, car le public cible est principalement mobile
 * et le SMS/WhatsApp offre une expérience plus fluide dans le contexte africain.
 */

// Types Express pour garantir le typage des handlers HTTP.
import { Request, Response } from 'express';

// Services métier du domaine candidat : la vérification OTP et la mise à jour
// du profil sont des opérations distinctes encapsulées dans le service candidat.
import { verifyCandidateOtp, completeProfile, resendCandidateOtp } from '../services/candidate.service';

// Wrapper asynchrone : capture automatiquement les rejets de promesse et les
// redirige vers le middleware de gestion d'erreurs centralisé.
import { catchAsync } from '../utils/catchAsync';

// Classe d'erreur personnalisée qui permet de lancer des erreurs HTTP
// structurées avec un code de statut, interceptées par le errorHandler.
import { AppError } from '../utils/AppError';

/**
 * Vérifie le code OTP envoyé au candidat lors de son inscription.
 *
 * @route POST /api/candidates/verify-otp
 * @param {Request} req - Requête contenant `phone` (numéro de téléphone) et `otp` (code à 6 chiffres).
 * @param {Response} res - Réponse contenant le résultat de la vérification (token JWT, données candidat).
 * @returns {void} Renvoie un JSON avec les données d'authentification du candidat.
 *
 * @description
 * Cette route est publique (pas de middleware d'authentification) car elle
 * constitue justement le point d'entrée d'authentification pour les candidats.
 * Le service vérifie la validité et l'expiration de l'OTP, puis génère un
 * token JWT si la vérification réussit. Le spread `...result` permet de
 * transmettre dynamiquement le token et les informations du candidat.
 */
export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  // Extraction du numéro de téléphone et du code OTP depuis le body.
  // Le format a déjà été validé par Zod (phone ≥ 8 chars, otp = 6 chars).
  const { phone, otp } = req.body;

  // Le service vérifie que l'OTP correspond, qu'il n'a pas expiré,
  // et retourne un token JWT + les infos du candidat en cas de succès.
  const result = await verifyCandidateOtp(phone, otp);

  res.json({ success: true, message: 'OTP vérifié avec succès.', data: result });
});

export const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const result = await resendCandidateOtp(phone);
  res.json({ success: true, message: 'Code OTP renvoyé par WhatsApp.', data: result });
});

/**
 * Permet au candidat authentifié de compléter ou modifier son profil.
 *
 * @route PUT /api/candidates/complete-profile
 * @param {Request} req - Requête contenant les données du profil dans le body
 *   (biography, profilePhoto, videoUrl, socialLinks). L'identifiant du candidat
 *   est extrait du token JWT via `req.user`.
 * @param {Response} res - Réponse contenant le profil mis à jour.
 * @returns {void} Renvoie le candidat avec ses nouvelles informations.
 *
 * @description
 * Cette route est protégée par le middleware `authenticateCandidate` qui
 * vérifie le JWT et injecte les données utilisateur dans `req.user`.
 * La vérification supplémentaire de `req.user?.id` constitue une garde
 * défensive : même si le middleware a validé le token, on s'assure que
 * l'identifiant est bien présent avant de poursuivre (protection contre
 * un éventuel bug dans le middleware ou un token malformé).
 */
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  // Récupération de l'ID du candidat depuis le token JWT décodé.
  // L'opérateur `?.` (optional chaining) protège contre un `req.user` undefined.
  const candidateId = req.user?.id;

  // Garde défensive : si l'ID est absent malgré le middleware d'authentification,
  // on lève une erreur 401 (Unauthorized) plutôt que de risquer une opération
  // sur un candidat non identifié.
  if (!candidateId) {
    throw new AppError('Non autorisé.', 401);
  }

  // Le service gère la mise à jour en base et peut appliquer des règles
  // métier supplémentaires (validation de l'URL de la photo, etc.).
  const updatedCandidate = await completeProfile(candidateId, req.body);

  res.json({ success: true, message: 'Profil complété avec succès.', data: { candidate: updatedCandidate } });
});
