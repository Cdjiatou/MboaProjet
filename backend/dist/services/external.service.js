"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppOTP = void 0;
const whatsapp_service_1 = require("./whatsapp.service");
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
const sendWhatsAppOTP = async (phone, otp) => {
    const message = `Bienvenue sur MBOA NEXT STAR ! 🌟\n\nVotre code de vérification est : *${otp}*\n\nNe partagez ce code avec personne.`;
    return await (0, whatsapp_service_1.sendWhatsAppMessage)(phone, message);
};
exports.sendWhatsAppOTP = sendWhatsAppOTP;
// Mavians déplacé vers mavians.service.ts
