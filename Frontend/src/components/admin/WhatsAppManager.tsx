import { useState, useEffect, useRef, useCallback } from 'react';
import { getWhatsAppStatus, logoutWhatsApp, refreshWhatsApp } from '@/services/adminService';
import { Smartphone, RefreshCcw, LogOut, CheckCircle2, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdminAlert, AdminButton, AdminCard } from './AdminUI';
import { getApiErrorMessage } from '@/utils/apiError';
import { useToastStore } from '@/store/useToastStore';

interface WhatsAppStatus {
  connected: boolean;
  qrCode: string | null;
  state?: string;
  lastError?: string | null;
  reconnecting?: boolean;
}

export const WhatsAppManager = () => {
  const toast = useToastStore();
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
    } catch {
      backendOnlineRef.current = false;
      setBackendOnline(false);
      connectedRef.current = false;
      setAlert({
        variant: 'error',
        title: 'Backend inaccessible',
        message: 'Le serveur backend n\'est pas accessible sur le port 3000.',
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
        toast.show({
          variant: 'info',
          title: 'Session redémarrée',
          message: 'Génération d\'un nouveau QR Code WhatsApp.',
        });
      }
    } catch (err: unknown) {
      toast.show({
        variant: 'error',
        title: 'Échec',
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
      toast.show({ variant: 'success', title: 'Déconnecté', message: 'La session WhatsApp a été fermée.' });
      setTimeout(() => fetchStatus(false), 2500);
    } catch (err: unknown) {
      toast.show({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Impossible de déconnecter.') });
    } finally {
      setRefreshing(false);
    }
  };

  const isOffline = status.state === 'offline' || Boolean(status.lastError);

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shadow-inner">
            <Smartphone className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Connexion WhatsApp</h2>
            <p className="text-xs text-neutral-400 mt-1">Envoi automatisé des codes OTP aux candidats</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
          !backendOnline ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          status.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          isOffline ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          {!backendOnline ? 'Backend hors ligne' :
           status.connected ? 'Session connectée' :
           status.reconnecting ? 'Reconnexion...' :
           status.qrCode ? 'QR Code prêt' : 'En attente'}
        </span>
      </div>

      {alert && (
        <AdminAlert variant={alert.variant} title={alert.title} onDismiss={() => setAlert(null)}>
          {alert.message}
        </AdminAlert>
      )}

      <div className="flex flex-col items-center justify-center p-8 bg-[#0b0b10] rounded-2xl border border-white/10 shadow-inner">
        {loading && !status.qrCode && !status.connected ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
            <p className="text-neutral-400 text-sm font-medium">Vérification du statut WhatsApp...</p>
          </div>
        ) : status.connected ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">WhatsApp opérationnel</h3>
              <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto">Le système envoie automatiquement les SMS / OTP aux candidats lors de leur inscription.</p>
            </div>
            <AdminButton variant="danger" icon={LogOut} onClick={handleLogout} loading={refreshing}>
              Déconnecter la session
            </AdminButton>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="text-center mb-1">
              <h3 className="text-lg font-bold text-white mb-1">Scannez le QR Code</h3>
              <p className="text-neutral-400 text-xs">
                Ouvrez WhatsApp → Appareils connectés → Connecter un appareil
              </p>
            </div>

            {isOffline && status.lastError && (
              <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl w-full">
                <WifiOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">{status.lastError}</p>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl w-64 h-64 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)] border-2 border-[#d4af37]/40">
              {status.qrCode ? (
                <img key={status.qrCode.slice(-40)} src={status.qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  {status.reconnecting ? (
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-neutral-400" />
                  )}
                  <p className="text-neutral-500 text-xs">
                    {status.reconnecting ? 'Connexion en cours...' : 'Génération du QR Code...'}
                  </p>
                </div>
              )}
            </div>

            <AdminButton variant="secondary" icon={RefreshCcw} onClick={handleRefresh} loading={refreshing} disabled={!backendOnline}>
              Rafraîchir le QR Code
            </AdminButton>
          </motion.div>
        )}
      </div>
    </AdminCard>
  );
};
