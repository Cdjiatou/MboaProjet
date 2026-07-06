import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs/promises';
import QRCode from 'qrcode';

// ============================================================================
// SERVICE WHATSAPP (Baileys)
// ============================================================================

export type WhatsAppConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'qr'
  | 'connected'
  | 'offline';

let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCodeBase64: string | null = null;
let isConnected = false;
let isConnecting = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let lastError: string | null = null;
let connectionState: WhatsAppConnectionState = 'disconnected';

const AUTH_DIR = path.join(__dirname, '../../whatsapp-auth');
const MAX_RECONNECT_DELAY_MS = 60000;

const setState = (state: WhatsAppConnectionState) => {
  connectionState = state;
};

const destroySocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.end(undefined);
    } catch {
      // Ignorer les erreurs de fermeture
    }
    sock = null;
  }
  isConnected = false;
  isConnecting = false;
};

const scheduleReconnect = (clearAuth = false) => {
  if (reconnectTimer) return;

  const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY_MS);
  reconnectAttempts += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWhatsApp(clearAuth);
  }, delay);
};

/**
 * Initialise la connexion WhatsApp avec Baileys.
 */
export const initWhatsApp = async (clearAuth = false) => {
  if (isConnected || isConnecting) return;
  isConnecting = true;
  setState('connecting');
  lastError = null;

  if (clearAuth) {
    try {
      await fs.rm(AUTH_DIR, { recursive: true, force: true });
    } catch {
      // Ignorer
    }
  }

  try {
    await fs.mkdir(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 30000,
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCodeBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 2, errorCorrectionLevel: 'M' });
        setState('qr');
        lastError = null;
        reconnectAttempts = 0;
        console.log('[WhatsApp] Nouveau QR Code généré. Prêt à scanner.');
      }

      if (connection === 'close') {
        isConnected = false;
        isConnecting = false;

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isUnauthorized = statusCode === 401; // Session invalide ou expirée
        const isNetworkError = !statusCode || statusCode === DisconnectReason.connectionClosed;

        if (isLoggedOut || isUnauthorized) {
          qrCodeBase64 = null;
          setState('disconnected');
          lastError = 'Session déconnectée ou expirée. Cliquez sur Rafraîchir pour générer un nouveau QR code.';
          console.log('[WhatsApp] Connexion fermée.', { statusCode, shouldReconnect: false });
          destroySocket();
          // Ne pas tenter de reconnexion automatique - nécessite un nouveau QR
        } else if (isNetworkError) {
          // Garder le dernier QR affiché pendant les coupures réseau temporaires
          setState(qrCodeBase64 ? 'qr' : 'offline');
          lastError = 'Connexion internet ou accès à WhatsApp indisponible. Vérifiez votre réseau.';
          console.log('[WhatsApp] Connexion fermée.', { statusCode, shouldReconnect: true });
          destroySocket();
          scheduleReconnect(false);
        } else {
          setState(qrCodeBase64 ? 'qr' : 'disconnected');
          lastError = `Connexion fermée (code ${statusCode ?? 'inconnu'}).`;
          console.log('[WhatsApp] Connexion fermée.', { statusCode, shouldReconnect: true });
          destroySocket();
          scheduleReconnect(false);
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp] Connexion ouverte ! WhatsApp est prêt.');
        isConnected = true;
        qrCodeBase64 = null;
        isConnecting = false;
        reconnectAttempts = 0;
        lastError = null;
        setState('connected');
      } else if (connection === 'connecting') {
        setState(qrCodeBase64 ? 'qr' : 'connecting');
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error('[WhatsApp] Erreur d\'initialisation:', err);
    isConnecting = false;
    setState('offline');
    lastError = 'Impossible d\'initialiser WhatsApp. Vérifiez votre connexion internet.';
    destroySocket();
    scheduleReconnect(false);
  }
};

/**
 * Redémarre la connexion WhatsApp (génère un nouveau QR si nécessaire).
 */
export const restartWhatsApp = async (clearAuth = false) => {
  reconnectAttempts = 0;
  lastError = null;
  if (clearAuth) qrCodeBase64 = null;
  destroySocket();
  await initWhatsApp(clearAuth);
};

/**
 * Retourne le statut de la connexion et le QR code si nécessaire.
 */
export const getWhatsAppStatus = () => {
  if (!isConnected && !isConnecting && connectionState === 'disconnected' && !reconnectTimer) {
    // Relancer si le service est totalement arrêté
    void initWhatsApp(false);
  }

  return {
    connected: isConnected,
    qrCode: isConnected ? null : qrCodeBase64,
    state: connectionState,
    lastError,
    reconnecting: Boolean(reconnectTimer) || isConnecting,
  };
};

const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return `${cleaned}@s.whatsapp.net`;
};

export const sendWhatsAppMessage = async (phone: string, text: string): Promise<boolean> => {
  if (!isConnected || !sock) {
    console.warn('[WhatsApp] Impossible d\'envoyer le message : non connecté.');
    return false;
  }

  try {
    const jid = formatPhoneNumber(phone);
    
    // Vérifier si le numéro existe sur WhatsApp avant d'envoyer
    try {
      const result = await sock.onWhatsApp(jid);
      if (!result || result.length === 0 || !result[0]?.exists) {
        console.warn(`[WhatsApp] Le numéro ${phone} n'est pas enregistré sur WhatsApp.`);
        return false;
      }
      console.log(`[WhatsApp] Numéro ${phone} vérifié sur WhatsApp ✓`);
    } catch (verifyError) {
      console.warn(`[WhatsApp] Impossible de vérifier le numéro ${phone}:`, verifyError);
      // On continue quand même l'envoi
    }
    
    // Envoi du message
    await sock.sendMessage(jid, { text });
    console.log(`[WhatsApp] Message envoyé avec succès à ${phone} (${jid})`);
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Erreur lors de l'envoi au ${phone}:`, error);
    return false;
  }
};

/**
 * Envoie une image avec une légende via WhatsApp.
 * @param phone  - Numéro du destinataire
 * @param imageUrl - URL publique de l'image à envoyer
 * @param caption - Texte accompagnant l'image
 */
export const sendWhatsAppImage = async (phone: string, imageUrl: string, caption: string): Promise<boolean> => {
  if (!isConnected || !sock) {
    console.warn('[WhatsApp] Impossible d\'envoyer l\'image : non connecté.');
    return false;
  }

  try {
    const jid = formatPhoneNumber(phone);

    // Vérifier si le numéro existe sur WhatsApp
    try {
      const result = await sock.onWhatsApp(jid);
      if (!result || result.length === 0 || !result[0]?.exists) {
        console.warn(`[WhatsApp] Le numéro ${phone} n'est pas enregistré sur WhatsApp.`);
        return false;
      }
    } catch (verifyError) {
      console.warn(`[WhatsApp] Impossible de vérifier le numéro ${phone}:`, verifyError);
    }

    // Envoi de l'image avec la légende
    await sock.sendMessage(jid, {
      image: { url: imageUrl },
      caption,
    });
    console.log(`[WhatsApp] Image envoyée avec succès à ${phone} (${jid})`);
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Erreur lors de l'envoi de l'image au ${phone}:`, error);
    return false;
  }
};

export const logoutWhatsApp = async () => {
  reconnectAttempts = 0;
  if (sock) {
    try {
      await sock.logout();
    } catch {
      // Session peut déjà être fermée
    }
  }
  qrCodeBase64 = null;
  destroySocket();
  await initWhatsApp(true);
};
