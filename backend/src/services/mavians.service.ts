// =============================================================================
// SERVICE MAVIANS (Smobilpay S3P) — Paiements Mobile Money & Carte
// Documentation : https://apidocs.smobilpay.com/s3papi/
// =============================================================================

import crypto from 'crypto';
import { env } from '../config/env';

export type PaymentMethod = 'MTN_MOMO' | 'ORANGE_MOMO' | 'CARD';

export interface MaviansPaymentResult {
  success: boolean;
  quoteId?: string;
  ptn?: string;
  paymentUrl?: string;
  message?: string;
}

const getCredentials = () => {
  const [apiToken, apiSecret] = (env.MAVIANS_API_KEY || '').split('|');
  return { apiToken, apiSecret };
};

const buildAuthHeader = (method: string, url: string, apiToken: string, apiSecret: string) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signaturePayload = `${method}&${url}&${timestamp}&${nonce}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(signaturePayload).digest('base64');
  return `s3pAuth,s3pAuth_token="${apiToken}",s3pAuth_nonce="${nonce}",s3pAuth_signature_method="HMAC-SHA256",s3pAuth_timestamp="${timestamp}",s3pAuth_signature="${signature}"`;
};

const getPayItemId = (method: PaymentMethod): string | null => {
  switch (method) {
    case 'MTN_MOMO':
      return env.MAVIANS_PAY_ITEM_MTN || null;
    case 'ORANGE_MOMO':
      return env.MAVIANS_PAY_ITEM_ORANGE || null;
    case 'CARD':
      return env.MAVIANS_PAY_ITEM_CARD || null;
    default:
      return null;
  }
};

/**
 * Initie un paiement via l'API Smobilpay (Mavians).
 * Flux : quotestd → collectstd
 */
export const initiateMaviansPayment = async (
  customerNumber: string,
  amount: number,
  reference: string,
  paymentMethod: PaymentMethod
): Promise<MaviansPaymentResult> => {
  const { apiToken, apiSecret } = getCredentials();

  if (!apiToken || !apiSecret) {
    console.error('[Mavians] Clé API invalide. Format attendu: TOKEN|SECRET');
    return { success: false, message: 'Configuration Mavians invalide.' };
  }

  const payItemId = getPayItemId(paymentMethod);
  const baseUrl = env.MAVIANS_API_URL || 'https://s3p.smobilpay.cm';
  const quotePath = '/v2/quotestd';
  const collectPath = '/v2/collectstd';
  const quoteUrl = `${baseUrl}${quotePath}`;

  // Mode développement : pas de payItemId configuré → simulation
  if (!payItemId) {
    console.warn(`[Mavians] payItemId manquant pour ${paymentMethod} — mode simulation`);
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      quoteId: `MOCK_QUOTE_${reference}`,
      ptn: `MOCK_PTN_${reference}`,
      paymentUrl: paymentMethod === 'CARD' ? undefined : undefined,
      message: 'Paiement simulé (configurez MAVIANS_PAY_ITEM_* en production).',
    };
  }

  try {
    const quoteBody = {
      payItemId,
      amount,
      customerNumber: paymentMethod === 'CARD' ? undefined : customerNumber.replace(/\D/g, ''),
      trid: reference,
    };

    const quoteAuth = buildAuthHeader('POST', quoteUrl, apiToken, apiSecret);
    const quoteRes = await fetch(quoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: quoteAuth,
      },
      body: JSON.stringify(quoteBody),
    });

    if (!quoteRes.ok) {
      const errText = await quoteRes.text();
      console.error('[Mavians] quotestd error:', quoteRes.status, errText);
      return { success: false, message: 'Échec de la demande de devis Mavians.' };
    }

    const quoteData = (await quoteRes.json()) as { quoteId?: string; quote?: { quoteId?: string } };
    const quoteId = quoteData.quoteId || quoteData.quote?.quoteId;

    if (!quoteId) {
      return { success: false, message: 'Réponse Mavians invalide (quoteId manquant).' };
    }

    const collectUrl = `${baseUrl}${collectPath}`;
    const collectAuth = buildAuthHeader('POST', collectUrl, apiToken, apiSecret);
    const collectRes = await fetch(collectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: collectAuth,
      },
      body: JSON.stringify({ quoteId }),
    });

    if (!collectRes.ok) {
      const errText = await collectRes.text();
      console.error('[Mavians] collectstd error:', collectRes.status, errText);
      return { success: false, message: 'Échec du prélèvement Mavians.' };
    }

    const collectData = (await collectRes.json()) as {
      ptn?: string;
      paymentUrl?: string;
      redirectUrl?: string;
    };

    return {
      success: true,
      quoteId,
      ptn: collectData.ptn,
      paymentUrl: collectData.paymentUrl || collectData.redirectUrl,
      message: paymentMethod === 'CARD' && collectData.paymentUrl
        ? 'Redirection vers le paiement par carte.'
        : 'Validez le paiement sur votre téléphone.',
    };
  } catch (error) {
    console.error('[Mavians] Erreur réseau:', error);
    return { success: false, message: 'Impossible de contacter Mavians.' };
  }
};

/** Vérifie le statut d'une transaction Mavians */
export const verifyMaviansTransaction = async (ptn: string): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> => {
  const { apiToken, apiSecret } = getCredentials();
  if (!apiToken || !apiSecret || ptn.startsWith('MOCK_')) {
    return 'PENDING';
  }

  const baseUrl = env.MAVIANS_API_URL || 'https://s3p.smobilpay.cm';
  const verifyUrl = `${baseUrl}/v2/verifytx?ptn=${encodeURIComponent(ptn)}`;

  try {
    const auth = buildAuthHeader('GET', verifyUrl, apiToken, apiSecret);
    const res = await fetch(verifyUrl, { headers: { Authorization: auth } });
    if (!res.ok) return 'PENDING';
    const data = (await res.json()) as { status?: string; txStatus?: string };
    const status = (data.status || data.txStatus || '').toUpperCase();
    if (status.includes('SUCCESS') || status === 'COMPLETED') return 'SUCCESS';
    if (status.includes('FAIL') || status === 'REJECTED') return 'FAILED';
    return 'PENDING';
  } catch {
    return 'PENDING';
  }
};
