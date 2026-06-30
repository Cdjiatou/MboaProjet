"use strict";
/**
 * Utilitaire de formatage de numéros de téléphone pour le Cameroun.
 *
 * Ce module garantit que tous les numéros de téléphone sont correctement
 * formatés avec l'indicatif international +237 du Cameroun pour l'envoi
 * d'OTP via WhatsApp.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.arePhoneNumbersEqual = exports.extractDigits = exports.formatPhoneNumber = void 0;
/**
 * Formate intelligemment un numéro de téléphone pour le Cameroun.
 *
 * Règles appliquées :
 * 1. Si le numéro contient déjà +237 ou 237 au début → on le garde tel quel (nettoyé)
 * 2. Si le numéro est un numéro local camerounais (9 chiffres commençant par 6) → ajout de +237
 * 3. Sinon → on ajoute un + devant les chiffres (cas générique)
 *
 * Exemples :
 * - "691234567" → "+237691234567" (numéro local camerounais)
 * - "6 91 23 45 67" → "+237691234567" (avec espaces)
 * - "+237691234567" → "+237691234567" (déjà formaté)
 * - "237691234567" → "+237691234567" (sans le +)
 * - "+33612345678" → "+33612345678" (numéro français, conservé tel quel)
 *
 * @param phone - Le numéro de téléphone brut à formater
 * @returns Le numéro formaté avec l'indicatif international approprié
 */
const formatPhoneNumber = (phone) => {
    // Nettoyage : suppression de tous les caractères non numériques sauf le + initial
    const trimmed = phone.trim();
    const hasInitialPlus = trimmed.startsWith('+');
    const digitsOnly = phone.replace(/\D/g, '');
    // Cas 1 : Le numéro est vide
    if (!digitsOnly) {
        return phone.trim(); // Retourne tel quel, la validation en amont devrait le rejeter
    }
    // Cas 2 : Le numéro commence déjà par 237
    if (digitsOnly.startsWith('237')) {
        return `+${digitsOnly}`;
    }
    // Cas 3 : Le numéro est un numéro local camerounais
    // Un numéro mobile camerounais fait 9 chiffres et commence par 6
    // Exemples valides : 691234567, 677123456, 650123456, etc.
    if (digitsOnly.length === 9 && digitsOnly.startsWith('6')) {
        return `+237${digitsOnly}`;
    }
    // Cas 4 : Le numéro avait un + initial mais pas d'indicatif 237
    // On suppose que c'est un numéro international d'un autre pays
    if (hasInitialPlus) {
        return `+${digitsOnly}`;
    }
    // Cas 5 : Numéro de format inconnu - on ajoute simplement un +
    // C'est le comportement par défaut pour les cas non prévus
    return `+${digitsOnly}`;
};
exports.formatPhoneNumber = formatPhoneNumber;
/**
 * Extrait uniquement les chiffres d'un numéro de téléphone.
 * Utile pour les comparaisons de numéros.
 *
 * @param phone - Le numéro de téléphone
 * @returns Les chiffres uniquement (sans le +)
 */
const extractDigits = (phone) => {
    return phone.replace(/\D/g, '');
};
exports.extractDigits = extractDigits;
/**
 * Compare deux numéros de téléphone en ignorant le formatage.
 *
 * @param phone1 - Premier numéro
 * @param phone2 - Deuxième numéro
 * @returns true si les numéros sont identiques (chiffres uniquement)
 */
const arePhoneNumbersEqual = (phone1, phone2) => {
    return (0, exports.extractDigits)(phone1) === (0, exports.extractDigits)(phone2);
};
exports.arePhoneNumbersEqual = arePhoneNumbersEqual;
