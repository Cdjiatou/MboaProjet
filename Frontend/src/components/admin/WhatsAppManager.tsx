import { useState, useEffect, useRef, useCallback } from 'react';
import { getWhatsAppStatus, logoutWhatsApp, refreshWhatsApp } from '@/services/adminService';
import { Smartphone, RefreshCcw, LogOut, CheckCircle2, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdminAlert, AdminButton } from './AdminUI';
import { getApiErrorMessage } from '@/utils/apiError';

interface WhatsAppStatus {
  connected: boolean;
  qrCode: string | null;
  state?: string;
  lastError?: string | null;
  reconnecting?: boolean;
}

export const WhatsAppManager = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false, qrCode: null });
  const [alert, setAlert] = useState<{ variant: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);
  const connectedRef = useRef(false);
  const backendOnlineRef = useRef(true);

  const fetchStatus = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await getWhatsAppStatus();
      backendOnlineRef.current = true;
      setBackendOnline(true);
      if (res.success && res.data) {
        setStatus(res.data);
        connectedRef.current = res.data.connected;
      }
    } catch (err: unknown) {
      backendOnlineRef.current = false;
      setBackendOnline(false);
      connectedRef.current = false;
      setAlert({
        variant: 'error',
        title: 'Backend inaccessible',
        message: 'Le serveur backend n\'est pas démarré. Lancez « npm run dev » dans le dossier backend (port 3000).',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(true);
    const interval = setInterval(() => {
      if (!backendOnlineRef.current) return;
      if (!connectedRef.current) fetchStatus(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setAlert(null);
    try {
      const res = await refreshWhatsApp();
      setBackendOnline(true);
      if (res.success && res.data) {
        setStatus(res.data);
        connectedRef.current = res.data.connected;
        setAlert({
          variant: 'info',
          title: 'Session redémarrée',
          message: 'Un nouveau QR code est en cours de génération. Attendez quelques secondes puis scannez-le.',
        });
      }
    } catch (err: unknown) {
      setAlert({
        variant: 'error',
        title: 'Échec du rafraîchissement',
        message: getApiErrorMessage(err, 'Impossible de redémarrer la session WhatsApp.'),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setRefreshing(true);
    setAlert(null);
    try {
      await logoutWhatsApp();
      setAlert({ variant: 'success', title: 'Déconnecté', message: 'La session WhatsApp a été fermée. Un nouveau QR code va apparaître.' });
      setTimeout(() => fetchStatus(false), 2500);
    } catch (err: unknown) {
      setAlert({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Impossible de déconnecter.') });
    } finally {
      setRefreshing(false);
    }
  };

  const isOffline = status.state === 'offline' || Boolean(status.lastError);

  return (
    <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold text-white">Connexion WhatsApp</h2>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          !backendOnline ? 'bg-red-500/10 text-red-400' :
          status.connected ? 'bg-emerald-500/10 text-emerald-400' :
          isOffline ? 'bg-orange-500/10 text-orange-400' :
          'bg-blue-500/10 text-blue-400'
        }`}>
          {!backendOnline ? 'Backend hors ligne' :
           status.connected ? 'Connecté' :
           status.reconnecting ? 'Reconnexion...' :
           status.qrCode ? 'QR prêt' : 'En attente'}
        </span>
      </div>

      <p className="text-neutral-400 text-sm mb-6">
        Connectez un compte WhatsApp pour envoyer les codes OTP aux candidats. Le backend doit tourner sur le port 3000.
      </p>

      {alert && (
        <AdminAlert variant={alert.variant} title={alert.title} onDismiss={() => setAlert(null)}>
          {alert.message}
        </AdminAlert>
      )}

      {!backendOnline && (
        <AdminAlert variant="error" title="Action requise">
          Démarrez le backend : terminal dans <strong>backend/</strong> → <strong>npm run dev</strong>
        </AdminAlert>
      )}

      <div className="flex flex-col items-center justify-center p-8 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
        {loading && !status.qrCode && !status.connected ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
            <p className="text-neutral-400 text-sm">Vérification du statut...</p>
          </div>
        ) : status.connected ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">WhatsApp Connecté</h3>
              <p className="text-neutral-400 text-sm max-w-md mx-auto">Le système peut envoyer des OTP aux candidats.</p>
            </div>
            <AdminButton variant="danger" icon={LogOut} onClick={handleLogout} loading={refreshing}>
              Déconnecter
            </AdminButton>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-white mb-2">Scannez le QR Code</h3>
              <p className="text-neutral-400 text-sm">
                WhatsApp → Paramètres → Appareils connectés → Connecter un appareil
              </p>
            </div>

            {isOffline && status.lastError && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl w-full">
                <WifiOff className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">{status.lastError}</p>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl w-72 h-72 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)] border-2 border-[#d4af37]/30">
              {status.qrCode ? (
                <img key={status.qrCode.slice(-40)} src={status.qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 px-4 text-center">
                  {status.reconnecting ? (
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-neutral-500" />
                  )}
                  <p className="text-neutral-500 text-xs">
                    {status.reconnecting ? 'Connexion à WhatsApp...' : 'QR en attente — cliquez Rafraîchir'}
                  </p>
                </div>
              )}
            </div>

            <AdminButton variant="secondary" icon={RefreshCcw} onClick={handleRefresh} loading={refreshing} disabled={!backendOnline}>
              Rafraîchir le QR Code
            </AdminButton>

            <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl w-full">
              <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300 leading-relaxed">
                Le QR expire toutes les ~20 secondes. Vérifiez votre connexion internet et que WhatsApp n'est pas bloqué.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
