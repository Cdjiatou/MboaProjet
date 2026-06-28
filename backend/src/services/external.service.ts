// =============================================================================
// SERVICE D'INTÉGRATIONS EXTERNES — external.service.ts
// =============================================================================
// Ce service centralise les appels vers les API tierces (WhatsApp, Mavians).
// Actuellement, toutes les fonctions sont des MOCKS (simulations) destinées
// au développement et aux tests. En production, elles devront être remplacées
// par de véritables appels HTTP vers les API concernées.
//
// L'avantage de centraliser ces appels ici est de faciliter le remplacement
// futur : un seul fichier à modifier pour brancher les vraies API.
// =============================================================================

import { sendWhatsAppMessage } from './whatsapp.service';

// =============================================================================
// FONCTION : sendWhatsAppOTP
// =============================================================================

/**
 * Envoie un code OTP (One-Time Password) par WhatsApp à un numéro de téléphone.
 *
 * @param phone - Numéro de téléphone du destinataire (format international recommandé, ex: +237XXXXXXXXX).
 * @param otp   - Code OTP à 6 chiffres à envoyer au destinataire.
 * @returns `true` si l'envoi est réussi.
 */
export const sendWhatsAppOTP = async (phone: string, otp: string): Promise<boolean> => {
  const message = `Bienvenue sur MBOA NEXT STAR ! 🌟\n\nVotre code de vérification est : *${otp}*\n\nNe partagez ce code avec personne.`;
  return await sendWhatsAppMessage(phone, message);
};

// Mavians déplacé vers mavians.service.ts
