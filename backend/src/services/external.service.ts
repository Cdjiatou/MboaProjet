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

// =============================================================================
// FONCTION : sendWhatsAppOTP
// =============================================================================

/**
 * Envoie un code OTP (One-Time Password) par WhatsApp à un numéro de téléphone.
 *
 * **⚠️ MOCK** : Cette fonction simule l'envoi d'un SMS/WhatsApp.
 * En production, elle devra être remplacée par un appel à l'API WhatsApp Business
 * (ou un provider tiers comme Twilio, MessageBird, etc.).
 *
 * @param phone - Numéro de téléphone du destinataire (format international recommandé, ex: +237XXXXXXXXX).
 * @param otp   - Code OTP à 6 chiffres à envoyer au destinataire.
 * @returns `true` si l'envoi est réussi (toujours vrai dans le mock).
 */
export const sendWhatsAppOTP = async (phone: string, otp: string): Promise<boolean> => {
  // Log en console pour simuler l'envoi et faciliter le débogage en développement
  console.log(`[WhatsApp Mock] Envoi du code OTP ${otp} au numéro ${phone}`);

  // Simulation d'une latence réseau de 500ms pour reproduire un comportement réaliste
  // Cela permet de tester le comportement asynchrone du code appelant
  await new Promise(resolve => setTimeout(resolve, 500));

  // Le mock retourne toujours `true` (succès)
  // En production, on devrait gérer les cas d'échec (numéro invalide, quota dépassé, etc.)
  return true;
};

import crypto from 'crypto';
import { env } from '../config/env';

// =============================================================================
// FONCTION : initiateMaviansPayment
// =============================================================================

/**
 * Initie un paiement mobile via l'API Mavians (Mobile Money).
 * 
 * @param phone     - Numéro de téléphone du payeur (numéro Mobile Money).
 * @param amount    - Montant à débiter en FCFA.
 * @param reference - Référence unique du paiement, utilisée pour le suivi
 *                    et la réconciliation avec le webhook de retour.
 * @returns `true` si l'initiation du paiement est réussie.
 */
export const initiateMaviansPayment = async (phone: string, amount: number, reference: string): Promise<boolean> => {
  console.log(`[Mavians API] Initiation paiement de ${amount} FCFA pour le numéro ${phone} (Ref: ${reference})`);
  
  try {
    // Séparation de la clé en Token et Secret (Format attendu : TOKEN|SECRET)
    const [apiToken, apiSecret] = env.MAVIANS_API_KEY.split('|');

    if (!apiToken || !apiSecret) {
      console.error(`[Mavians API] Format de clé invalide. Attendu: TOKEN|SECRET`);
      return false;
    }

    // ⚠️ IMPORTANT: Vous avez indiqué utiliser une clé de PRODUCTION.
    // L'URL 'dev.smobilpay.com' est réservée aux tests.
    // L'URL de production définitive (ex: https://s3p.smobilpay.cm/v2/quotestd)
    // vous est normalement communiquée par l'équipe Mavians.
    const apiUrl = 'https://s3p.smobilpay.cm/v2/quotestd'; // À confirmer avec Mavians
    
    // ⚠️ LOGIQUE DE SIGNATURE S3P (HMAC)
    // Selon la documentation Mavians, vous devez générer une signature avec le `apiSecret`.
    // Ceci est un pseudo-code d'exemple de la structure d'authentification :
    /*
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signaturePayload = `POST&${apiUrl}&${timestamp}&${nonce}`;
    const signature = crypto.createHmac('sha256', apiSecret).update(signaturePayload).digest('base64');
    const authHeader = `s3pAuth,s3pAuth_token="${apiToken}",s3pAuth_nonce="${nonce}",s3pAuth_signature_method="HMAC-SHA256",s3pAuth_timestamp="${timestamp}",s3pAuth_signature="${signature}"`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // ou 'application/x-www-form-urlencoded' selon l'API
        'Authorization': authHeader
      },
      body: JSON.stringify({
        payItemId: 'VOTRE_SERVICE_ID', // ID du service fourni par Mavians
        amount: amount,
        customerNumber: phone,
        trid: reference
      })
    });

    if (!response.ok) {
      console.error(`[Mavians API] Erreur HTTP: ${response.status}`);
      return false;
    }
    */

    // Simulation de la latence pour le développement
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[Mavians API] Requête simulée vers ${apiUrl} réussie.`);
    
    return true;
  } catch (error) {
    console.error(`[Mavians API] Erreur de communication réseau`, error);
    return false;
  }
};
