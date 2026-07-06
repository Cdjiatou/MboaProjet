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

import { sendWhatsAppMessage, sendWhatsAppImage } from './whatsapp.service';

// URL du logo MBOA NEXT STAR hébergé sur Cloudinary
const LOGO_URL = 'https://res.cloudinary.com/dlcrb5pat/image/upload/v1783339162/mboa-next-star/site-media/spjvod1fxxmkdy9n0rpb.png';

// =============================================================================
// FONCTION : sendWhatsAppOTP
// =============================================================================

/**
 * Envoie un code OTP (One-Time Password) par WhatsApp à un numéro de téléphone.
 * Le message est accompagné du logo MBOA NEXT STAR.
 *
 * @param phone - Numéro de téléphone du destinataire (format international recommandé, ex: +237XXXXXXXXX).
 * @param otp   - Code OTP à 6 chiffres à envoyer au destinataire.
 * @returns `true` si l'envoi est réussi.
 */
export const sendWhatsAppOTP = async (phone: string, otp: string): Promise<boolean> => {
  const caption = ` *MBOA NEXT STAR* \n\nBienvenue sur MBOA NEXT STAR !\n\nVotre code de vérification est :\n\n🔐 *${otp}*\n\n⚠️ Ne partagez ce code avec personne.\nIl expire dans 10 minutes.`;

  // Tenter d'envoyer avec l'image du logo
  try {
    const sent = await sendWhatsAppImage(phone, LOGO_URL, caption);
    if (sent) return true;
  } catch (err) {
    console.warn('[OTP] Échec envoi image, fallback vers texte simple:', err);
  }

  // Fallback: envoi en texte simple si l'image échoue
  return await sendWhatsAppMessage(phone, caption);
};

// Mavians déplacé vers mavians.service.ts

