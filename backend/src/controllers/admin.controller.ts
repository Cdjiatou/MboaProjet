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

// Types Express pour le typage fort des handlers HTTP.
import { Request, Response } from 'express';

// Services métier du domaine administratif : chaque service encapsule une
// responsabilité unique (Single Responsibility Principle) pour faciliter
// les tests unitaires et la maintenance.
import { getDashboardStats, updateSiteConfig, initiateWithdrawal, updateWithdrawalStatus, listCandidates, getSponsorsConfig, saveSponsorsConfig, repairSponsorsConfigIfNeeded } from '../services/admin.service';

// La création de candidat est dans le service candidate plutôt que admin
// car la logique de création (génération OTP, envoi WhatsApp) appartient
// au domaine "candidat". Le contrôleur admin ne fait que l'invoquer.
import { createCandidateByCoach, updateCandidateByAdmin, deleteCandidateByAdmin } from '../services/candidate.service';

// Services d'export CSV dédiés : séparés du service admin pour isoler
// la logique de sérialisation/formatage des données tabulaires.
import { generateVotesCSV, generateWithdrawalsCSV } from '../services/export.service';

// Wrapper asynchrone pour éviter les try/catch répétitifs dans chaque handler.
import { catchAsync } from '../utils/catchAsync';

// Classe d'erreur personnalisée pour les erreurs HTTP structurées
import { AppError } from '../utils/AppError';

// Prisma client pour les opérations de base de données
import prisma from '../utils/prisma';

// File system pour la suppression de fichiers
import fs from 'fs/promises';
import path from 'path';

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
export const createCandidate = catchAsync(async (req: Request, res: Response) => {
  const candidateData: Record<string, unknown> = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    categoryId: parseInt(req.body.categoryId, 10),
  };

  const bio = typeof req.body.biography === 'string' ? req.body.biography.trim() : '';
  if (bio) candidateData.biography = bio;
  if (req.body.videoUrl?.trim()) candidateData.videoUrl = req.body.videoUrl.trim();
  if (req.body.city?.trim()) candidateData.city = req.body.city.trim();
  if (req.body.country?.trim()) candidateData.country = req.body.country.trim();

  if (req.file) {
    candidateData.profilePhoto = `uploads/candidates/${req.file.filename}`;
  }

  if (typeof req.body.socialLinks === 'string') {
    try {
      candidateData.socialLinks = JSON.parse(req.body.socialLinks);
    } catch {
      // ignore invalid JSON
    }
  } else if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
    candidateData.socialLinks = req.body.socialLinks;
  }

  const result = await createCandidateByCoach(candidateData as Parameters<typeof createCandidateByCoach>[0]);

  const { candidate, otpSent, whatsappConnected } = result;

  let message = 'Candidat créé avec succès.';
  if (otpSent) {
    message = `Candidat créé. Le code OTP a été envoyé par WhatsApp au ${candidate.phone}.`;
  } else if (!whatsappConnected) {
    message = 'Candidat créé, mais WhatsApp n\'est pas connecté. Connectez WhatsApp dans le panel admin pour envoyer l\'OTP.';
  } else {
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
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await getDashboardStats();

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
export const saveConfig = catchAsync(async (req: Request, res: Response) => {
  // Extraction du tableau de configurations depuis le body.
  // Chaque élément contient une clé (identifiant du paramètre) et
  // une valeur (nouvelle valeur à appliquer).
  const configs = req.body.configs;

  // Le service gère l'upsert (insertion ou mise à jour) de chaque paire clé/valeur.
  await updateSiteConfig(configs);

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
export const createWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { amount } = req.body;

  // Le service vérifie que le solde disponible est suffisant et crée
  // l'enregistrement de retrait en base de données.
  const withdrawal = await initiateWithdrawal(amount);

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
export const patchWithdrawalStatus = catchAsync(async (req: Request, res: Response) => {
  const withdrawalId = parseInt(req.params.id, 10);

  // Validation du paramètre ID
  if (isNaN(withdrawalId)) {
    throw new AppError('ID de retrait invalide.', 400);
  }

  // Le service vérifie l'existence du retrait et la validité de la transition
  const withdrawal = await updateWithdrawalStatus(withdrawalId);

  res.json({ success: true, message: 'Statut du retrait mis à jour avec succès.', withdrawal });
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
export const exportVotes = catchAsync(async (req: Request, res: Response) => {
  // Génération du contenu CSV par le service d'export dédié.
  const csvContent = await generateVotesCSV();

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
export const exportWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const csvContent = await generateWithdrawalsCSV();

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
 * Ce endpoint gère l'upload de photo via multer. Le middleware multer
 * a déjà traité le fichier et l'a sauvegardé dans backend/uploads/candidates/.
 * Le chemin relatif du fichier est stocké dans profilePhoto.
 */
export const uploadCandidatePhoto = catchAsync(async (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.id, 10);

  // Vérifier que le candidat existe
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    throw new AppError('Candidat introuvable.', 404);
  }

  // Vérifier qu'un fichier a été uploadé
  if (!req.file) {
    throw new AppError('Aucun fichier fourni.', 400);
  }

  // Supprimer l'ancienne photo si elle existe
  if (candidate.profilePhoto) {
    const oldPhotoPath = path.join(__dirname, '../../', candidate.profilePhoto);
    try {
      await fs.unlink(oldPhotoPath);
    } catch (error) {
      // Ignorer l'erreur si le fichier n'existe pas
      console.warn(`Impossible de supprimer l'ancienne photo: ${oldPhotoPath}`);
    }
  }

  // Construire le chemin relatif pour le stockage en base
  const photoPath = `uploads/candidates/${req.file.filename}`;

  // Mettre à jour le candidat avec le nouveau chemin de photo
  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: { profilePhoto: photoPath },
    include: { category: true },
  });

  res.json({
    success: true,
    message: 'Photo mise à jour avec succès.',
    candidate: updatedCandidate,
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
 * Supprime à la fois le fichier physique du système de fichiers
 * et le champ profilePhoto de la base de données.
 */
export const deleteCandidatePhoto = catchAsync(async (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.id, 10);

  // Vérifier que le candidat existe
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    throw new AppError('Candidat introuvable.', 404);
  }

  if (!candidate.profilePhoto) {
    throw new AppError('Aucune photo à supprimer.', 400);
  }

  // Supprimer le fichier physique
  const photoPath = path.join(__dirname, '../../', candidate.profilePhoto);
  try {
    await fs.unlink(photoPath);
  } catch (error) {
    console.warn(`Impossible de supprimer le fichier photo: ${photoPath}`);
    // Continuer quand même pour nettoyer la base de données
  }

  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: { profilePhoto: null },
    include: { category: true },
  });

  res.json({
    success: true,
    message: 'Photo supprimée avec succès.',
    candidate: updatedCandidate,
  });
});

import { getWhatsAppStatus as getWAStatus, logoutWhatsApp as logoutWA, restartWhatsApp } from '../services/whatsapp.service';

/**
 * Liste tous les candidats pour le back-office
 */
export const getCandidatesList = catchAsync(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  const result = await listCandidates({ search, page, limit });
  res.json({ success: true, data: result });
});

/** Met à jour un candidat (admin) */
export const updateCandidateAdmin = catchAsync(async (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.id, 10);
  const body = { ...req.body };

  if (body.categoryId !== undefined) {
    body.categoryId = parseInt(String(body.categoryId), 10);
  }
  if (typeof body.socialLinks === 'string') {
    try { body.socialLinks = JSON.parse(body.socialLinks); } catch { delete body.socialLinks; }
  }

  const candidate = await updateCandidateByAdmin(candidateId, body);
  res.json({ success: true, data: candidate, message: 'Candidat mis à jour.' });
});

/** Supprime un candidat (admin) */
export const deleteCandidateAdmin = catchAsync(async (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.id, 10);
  await deleteCandidateByAdmin(candidateId);
  res.json({ success: true, message: 'Candidat supprimé.' });
});

/**
 * Récupère le statut de connexion WhatsApp (et le QR code si nécessaire)
 */
export const getWhatsAppStatus = catchAsync(async (req: Request, res: Response) => {
  const status = getWAStatus();
  res.json({ success: true, data: status });
});

/**
 * Redémarre la session WhatsApp pour générer un nouveau QR code
 */
export const refreshWhatsAppSession = catchAsync(async (req: Request, res: Response) => {
  await restartWhatsApp(false);
  // Laisser Baileys générer le QR
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const status = getWAStatus();
  res.json({ success: true, data: status, message: 'Session WhatsApp redémarrée.' });
});

/**
 * Déconnecte la session WhatsApp
 */
export const logoutWhatsAppSession = catchAsync(async (req: Request, res: Response) => {
  await logoutWA();
  res.json({ success: true, message: 'Déconnecté de WhatsApp. Un nouveau QR code va être généré.' });
});

/**
 * Upload le logo d'un sponsor et retourne l'URL publique
 */
export const uploadSponsorLogoController = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Aucun fichier fourni.', 400);
  }
  const logoUrl = `/uploads/sponsors/${req.file.filename}`;
  res.status(201).json({
    success: true,
    message: 'Logo téléversé avec succès.',
    logoUrl,
  });
});

/** Liste les sponsors enregistrés en configuration site (avec réparation auto si liste incomplète) */
export const getSponsorsConfigController = catchAsync(async (_req: Request, res: Response) => {
  const sponsors = await repairSponsorsConfigIfNeeded();
  res.json({ success: true, data: sponsors });
});

/** Sauvegarde les sponsors (replaceAll=true remplace la liste, false fusionne) */
export const saveSponsorsConfigController = catchAsync(async (req: Request, res: Response) => {
  const { sponsors, replaceAll = true } = req.body as {
    sponsors: { id?: string; name: string; url?: string; image: string }[];
    replaceAll?: boolean;
  };

  if (!Array.isArray(sponsors)) {
    throw new AppError('Le champ sponsors doit être un tableau.', 400);
  }

  const normalized = sponsors
    .filter((s) => s.name?.trim() && s.image?.trim())
    .map((s, i) => ({
      id: s.id || `sp-${Date.now()}-${i}`,
      name: s.name.trim(),
      url: s.url?.trim() || '',
      image: s.image.trim(),
    }));

  const saved = await saveSponsorsConfig(normalized, replaceAll !== false);
  res.json({ success: true, data: saved, message: `${saved.length} sponsor(s) enregistré(s).` });
});
