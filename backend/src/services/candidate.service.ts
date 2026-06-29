// =============================================================================
// SERVICE DES CANDIDATS — candidate.service.ts
// =============================================================================
// Ce service gère le cycle de vie complet d'un candidat dans la plateforme :
//   1. Inscription par un coach (createCandidateByCoach)
//   2. Vérification du numéro de téléphone via OTP (verifyCandidateOtp)
//   3. Complétion du profil avec biographie, photo, etc. (completeProfile)
//
// Le flux métier est le suivant :
//   PENDING_VERIFICATION → (vérification OTP) → ACTIVE
//
// Fonctions utilitaires privées :
//   - generateOTP : génération d'un code à 6 chiffres
//   - countWords : comptage de mots pour la validation de biographie
//   - generateUniqueSlug : création de slugs URL uniques pour les candidats
// =============================================================================

// --- Imports des dépendances ---

// Client Prisma pour les opérations en base de données
import prisma from '../utils/prisma';

// Service externe pour l'envoi de codes OTP via WhatsApp
import { sendWhatsAppOTP } from './external.service';
import { getWhatsAppStatus } from './whatsapp.service';

// Utilitaire de génération de tokens JWT pour l'authentification des candidats
import { generateToken } from '../utils/jwt';

// Classe d'erreur personnalisée avec code HTTP pour le middleware d'erreurs
import { AppError } from '../utils/AppError';

// Utilitaire de formatage de numéros de téléphone (ajout automatique de +237)
import { formatPhoneNumber, extractDigits } from '../utils/phoneFormatter';

// =============================================================================
// FONCTION : createCandidateByCoach
// =============================================================================

/**
 * Crée un nouveau candidat dans le système, initié par un coach.
 *
 * Cette fonction effectue les étapes suivantes :
 * 1. Vérifie qu'aucun candidat n'existe déjà avec le même email ou téléphone
 *    (pour éviter les doublons).
 * 2. Génère un code OTP à 6 chiffres pour la vérification du numéro.
 * 3. Crée le candidat en base avec le statut `PENDING_VERIFICATION`.
 * 4. Envoie le code OTP par WhatsApp au candidat.
 *
 * @param data - Données du candidat à créer.
 * @param data.firstName  - Prénom du candidat.
 * @param data.lastName   - Nom de famille du candidat.
 * @param data.email      - Adresse email du candidat (doit être unique).
 * @param data.phone      - Numéro de téléphone du candidat (doit être unique).
 * @param data.categoryId - Identifiant de la catégorie de concours du candidat.
 * @returns L'objet candidat créé (avec statut PENDING_VERIFICATION).
 * @throws {AppError} 409 — Si un candidat avec le même email ou téléphone existe déjà.
 */
export const createCandidateByCoach = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  categoryId: number;
  biography?: string;
  profilePhoto?: string;
  videoUrl?: string;
  city?: string;
  country?: string;
  socialLinks?: Record<string, string>;
}) => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const formattedPhone = formatPhoneNumber(data.phone);
  const phoneDigits = extractDigits(formattedPhone);

  const existingByEmail = await prisma.candidate.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  if (existingByEmail) {
    throw new AppError(
      `L'email « ${data.email} » est déjà utilisé par ${existingByEmail.firstName} ${existingByEmail.lastName}.`,
      409
    );
  }

  const candidates = await prisma.candidate.findMany({
    select: { phone: true, firstName: true, lastName: true },
  });

  const existingByPhone = candidates.find(
    (c) => extractDigits(c.phone) === phoneDigits
  );

  if (existingByPhone) {
    throw new AppError(
      `Le numéro « ${formattedPhone} » est déjà utilisé par ${existingByPhone.firstName} ${existingByPhone.lastName}.`,
      409
    );
  }

  const otp = generateOTP();

  const candidate = await prisma.candidate.create({
    data: {
      ...data,
      email: normalizedEmail,
      phone: formattedPhone,
      verificationCode: otp,
      status: 'PENDING_VERIFICATION',
    },
  });

  const whatsappConnected = getWhatsAppStatus().connected;
  let otpSent = false;

  // Tenter d'envoyer l'OTP par WhatsApp
  if (whatsappConnected) {
    otpSent = await sendWhatsAppOTP(candidate.phone, otp);
  }

  return { candidate, otpSent, whatsappConnected };
};

/**
 * Renvoie le code OTP à un candidat en attente de vérification.
 */
export const resendCandidateOtp = async (phone: string) => {
  const formattedPhone = formatPhoneNumber(phone);
  const phoneDigits = extractDigits(formattedPhone);

  const candidates = await prisma.candidate.findMany({
    where: { status: { in: ['PENDING_VERIFICATION', 'VERIFIED'] } },
  });

  const candidate = candidates.find(
    (c) => extractDigits(c.phone) === phoneDigits
  );

  if (!candidate) {
    throw new AppError('Aucun candidat en attente de vérification pour ce numéro.', 404);
  }

  if (candidate.status === 'VERIFIED' && candidate.slug) {
    throw new AppError('Ce profil est déjà activé.', 400);
  }

  const otp = generateOTP();
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { verificationCode: otp },
  });

  const whatsappConnected = getWhatsAppStatus().connected;
  let otpSent = false;

  if (whatsappConnected) {
    try {
      otpSent = await sendWhatsAppOTP(candidate.phone, otp);
    } catch (e) {
      console.warn('[WhatsApp] Échec lors de la réexpédition de l\'OTP:', e);
    }
  }

  if (!otpSent) {
    throw new AppError('Impossible d\'envoyer le code via WhatsApp. Assurez-vous que le service WhatsApp est connecté.', 503);
  }

  return { otpSent: true, phone: candidate.phone };
};

// =============================================================================
// FONCTION : verifyCandidateOtp
// =============================================================================

/**
 * Vérifie le code OTP soumis par un candidat pour valider son numéro de téléphone.
 *
 * Si le code est correct :
 * - Le statut du candidat passe de `PENDING_VERIFICATION` à `VERIFIED`.
 * - Le code de vérification est effacé de la base (sécurité : usage unique).
 * - Un token JWT est généré pour permettre au candidat de compléter son profil.
 *
 * @param phone - Numéro de téléphone du candidat (utilisé comme identifiant unique).
 * @param otp   - Code OTP à 6 chiffres soumis par le candidat.
 * @returns Un objet contenant le candidat mis à jour et son token JWT d'authentification.
 * @throws {AppError} 404 — Si aucun candidat n'est trouvé avec ce numéro de téléphone.
 * @throws {AppError} 400 — Si le code OTP fourni ne correspond pas à celui stocké en base.
 */
export const verifyCandidateOtp = async (phone: string, otp: string) => {
  const formattedPhone = formatPhoneNumber(phone);
  const phoneDigits = extractDigits(formattedPhone);

  const candidates = await prisma.candidate.findMany({
    where: { status: { in: ['PENDING_VERIFICATION', 'VERIFIED'] } },
  });

  const candidate = candidates.find(
    (c) => extractDigits(c.phone) === phoneDigits
  );

  // Vérification de l'existence du candidat
  if (!candidate) {
    throw new AppError('Candidat non trouvé.', 404);
  }

  // Comparaison du code OTP fourni avec celui stocké en base
  // Note : comparaison stricte en string (pas de hachage ici car le code est temporaire)
  if (candidate.verificationCode !== otp) {
    throw new AppError('Code OTP invalide.', 400);
  }

  // OTP valide → activation immédiate du profil (visible sur le site)
  const slugName = `${candidate.firstName}-${candidate.lastName}`;
  const slug = candidate.slug || (await generateUniqueSlug(slugName));

  const finalCandidate = await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      status: 'ACTIVE',
      verificationCode: null,
      slug,
    },
    include: { category: true },
  });

  const token = generateToken({ id: finalCandidate.id, type: 'candidate' });

  return { candidate: finalCandidate, token, autoActivated: true };
};

// =============================================================================
// FONCTION : completeProfile
// =============================================================================

/**
 * Permet à un candidat vérifié de compléter son profil public.
 *
 * Cette étape est nécessaire pour passer du statut `VERIFIED` à `ACTIVE`,
 * ce qui rend le candidat visible et éligible aux votes.
 *
 * Validations effectuées :
 * - La biographie doit contenir au moins 300 mots (exigence métier).
 * - Un slug URL unique est généré à partir du nom complet du candidat.
 *
 * @param candidateId - Identifiant unique du candidat en base.
 * @param data - Données de profil à compléter.
 * @param data.biography    - Texte biographique du candidat (min. 300 mots).
 * @param data.profilePhoto - URL de la photo de profil (optionnel).
 * @param data.videoUrl     - URL de la vidéo de présentation (optionnel).
 * @param data.socialLinks  - Liens vers les réseaux sociaux du candidat (optionnel).
 * @returns Le candidat mis à jour avec le statut `ACTIVE` et son slug.
 * @throws {AppError} 404 — Si le candidat n'existe pas.
 * @throws {AppError} 400 — Si la biographie ne contient pas assez de mots.
 */
export const completeProfile = async (candidateId: number, data: {
  biography: string;
  profilePhoto?: string;
  videoUrl?: string;
  socialLinks?: any;
}) => {
  // Vérification de l'existence du candidat avant toute modification
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });

  if (!candidate) {
    throw new AppError('Candidat non trouvé.', 404);
  }

  // Validation de la longueur de la biographie (minimum 300 mots)
  // Cette contrainte métier garantit un contenu suffisamment riche
  // pour le profil public du candidat
  const wordCount = countWords(data.biography);
  if (wordCount > 300) {
    throw new AppError(`La biographie ne doit pas dépasser 300 mots. Vous en avez ${wordCount}.`, 400);
  }
  if (wordCount < 10) {
    throw new AppError(`La biographie doit contenir au moins 10 mots. Vous en avez ${wordCount}.`, 400);
  }

  // Génération d'un slug URL unique à partir du prénom et du nom
  // Ex: "Jean Dupont" → "jean-dupont" (ou "jean-dupont-1" si déjà pris)
  // Le slug sera utilisé dans l'URL publique du profil candidat
  const slugName = `${candidate.firstName}-${candidate.lastName}`;
  const slug = candidate.slug || (await generateUniqueSlug(slugName));

  const updateData: Record<string, unknown> = {
    ...data,
    slug,
    status: 'ACTIVE',
  };

  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: updateData,
  });

  return updatedCandidate;
};

// =============================================================================
// ADMIN — Mise à jour & suppression candidat
// =============================================================================

export const updateCandidateByAdmin = async (
  candidateId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    categoryId?: number;
    biography?: string;
    videoUrl?: string;
    city?: string;
    country?: string;
    status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED';
    socialLinks?: Record<string, string>;
  }
) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new AppError('Candidat introuvable.', 404);

  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const dup = await prisma.candidate.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' }, id: { not: candidateId } },
    });
    if (dup) throw new AppError(`L'email « ${data.email} » est déjà utilisé.`, 409);
    data.email = normalizedEmail;
  }

  if (data.phone) {
    const formattedPhone = formatPhoneNumber(data.phone);
    const phoneDigits = extractDigits(formattedPhone);
    const all = await prisma.candidate.findMany({ where: { id: { not: candidateId } }, select: { phone: true } });
    if (all.some((c) => extractDigits(c.phone) === phoneDigits)) {
      throw new AppError(`Le numéro « ${formattedPhone} » est déjà utilisé.`, 409);
    }
    data.phone = formattedPhone;
  }

  if (data.biography !== undefined) {
    const wc = countWords(data.biography);
    if (wc > 300) throw new AppError(`La biographie ne doit pas dépasser 300 mots (${wc}).`, 400);
  }

  const updateData: Record<string, unknown> = { ...data };

  if (data.status === 'ACTIVE' && !candidate.slug) {
    const slugName = `${data.firstName || candidate.firstName}-${data.lastName || candidate.lastName}`;
    updateData.slug = await generateUniqueSlug(slugName);
  }

  if (data.status && data.status !== 'ACTIVE' && candidate.status === 'ACTIVE') {
    // Conserver le slug même si suspendu
  }

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: updateData,
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  return updated;
};

export const deleteCandidateByAdmin = async (candidateId: number) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new AppError('Candidat introuvable.', 404);

  if (candidate.profilePhoto) {
    const fs = await import('fs/promises');
    const pathMod = await import('path');
    try {
      await fs.unlink(pathMod.join(__dirname, '../../', candidate.profilePhoto));
    } catch {
      // fichier absent
    }
  }

  await prisma.vote.deleteMany({ where: { candidateId } });
  await prisma.candidate.delete({ where: { id: candidateId } });

  return { deleted: true };
};

// =============================================================================
// FONCTIONS UTILITAIRES PRIVÉES
// =============================================================================
// Ces fonctions ne sont pas exportées car elles sont uniquement utilisées
// en interne par les fonctions publiques de ce service.
// =============================================================================

/**
 * Génère un code OTP (One-Time Password) numérique à 6 chiffres.
 *
 * Le code est toujours compris entre 100000 et 999999 inclus,
 * garantissant ainsi qu'il fait toujours exactement 6 chiffres.
 *
 * **⚠️ Note de sécurité** : `Math.random()` n'est pas cryptographiquement sûr.
 * Pour une sécurité renforcée en production, envisager l'utilisation de
 * `crypto.randomInt(100000, 1000000)` du module `crypto` natif de Node.js.
 *
 * @returns Une chaîne de 6 chiffres représentant le code OTP.
 */
const generateOTP = (): string => {
  // Math.random() génère un nombre entre 0 (inclus) et 1 (exclus)
  // Multiplié par 900000 puis additionné à 100000, on obtient un entier entre 100000 et 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Compte le nombre de mots dans un texte donné.
 *
 * Le comptage suit ces étapes :
 * 1. Suppression de tous les caractères de ponctuation (remplacés par des espaces).
 * 2. Réduction des espaces multiples en un seul espace.
 * 3. Découpage par espace et filtrage des chaînes vides.
 *
 * Cette approche permet un comptage fiable même avec des textes
 * contenant beaucoup de ponctuation ou de formatage irrégulier.
 *
 * @param text - Le texte dont on souhaite compter les mots.
 * @returns Le nombre de mots dans le texte (0 si le texte est vide ou null).
 */
const countWords = (text: string): number => {
  // Gestion du cas où le texte est vide, null ou undefined
  if (!text) return 0;

  const cleanText = text
    // Suppression de tous les caractères de ponctuation courants
    // Chaque caractère spécial est remplacé par un espace pour ne pas fusionner des mots
    .replace(/[.,/#!$%^&*;:{}=\-_`~()@"'?\\[\]<>|+]/g, ' ')
    // Réduction des séquences d'espaces multiples en un seul espace
    .replace(/\s{2,}/g, ' ')
    // Suppression des espaces en début et fin de chaîne
    .trim();

  // Découpage par espace et filtrage des éléments vides
  // (au cas où il resterait des espaces parasites après le nettoyage)
  return cleanText.split(' ').filter(word => word.length > 0).length;
};

/**
 * Génère un slug URL unique à partir d'un nom de base.
 *
 * Le slug est une version normalisée du nom, adaptée pour les URLs :
 * - Conversion en minuscules
 * - Remplacement des caractères non alphanumériques par des tirets
 * - Suppression des tirets en début et fin de chaîne
 *
 * Si le slug généré existe déjà en base (un autre candidat a le même nom),
 * un suffixe numérique incrémental est ajouté (ex: "jean-dupont-1", "jean-dupont-2").
 *
 * @param baseName - Le nom de base à transformer en slug (ex: "Jean-Dupont").
 * @returns Le slug unique garanti de ne pas exister en base.
 *
 * @example
 * // Si aucun "jean-dupont" n'existe :
 * await generateUniqueSlug("Jean Dupont"); // → "jean-dupont"
 *
 * // Si "jean-dupont" existe déjà :
 * await generateUniqueSlug("Jean Dupont"); // → "jean-dupont-1"
 */
const generateUniqueSlug = async (baseName: string): Promise<string> => {
  // Étape 1 : Normalisation du nom en slug de base
  let slug = baseName
    // Conversion en minuscules pour uniformiser
    .toLowerCase()
    // Remplacement de tout caractère non alphanumérique par un tiret
    .replace(/[^a-z0-9]+/g, '-')
    // Suppression des tirets parasites en début et fin de chaîne
    .replace(/(^-|-$)+/g, '');

  // Étape 2 : Vérification d'unicité avec incrémentation si nécessaire
  let finalSlug = slug;
  let counter = 1;

  // On vérifie si le slug existe déjà dans la table des candidats
  let exists = await prisma.candidate.findUnique({ where: { slug: finalSlug } });

  // Boucle d'incrémentation : tant que le slug est pris, on ajoute un suffixe numérique
  // Ex: "jean-dupont" → "jean-dupont-1" → "jean-dupont-2" → ...
  while (exists) {
    finalSlug = `${slug}-${counter}`;
    exists = await prisma.candidate.findUnique({ where: { slug: finalSlug } });
    counter++;
  }

  return finalSlug;
};
