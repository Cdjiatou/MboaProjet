import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { updateAdminProfile } from '@/services/adminService';
import { useThemeStore } from '@/store/useThemeStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
}

export const AdminProfileModal: React.FC<Props> = ({ isOpen, onClose, currentEmail }) => {
  const [email, setEmail] = useState(currentEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (password && password !== confirmPassword) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password && password.length < 6) {
      setStatus('error');
      setMessage('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setStatus('loading');
    try {
      // Si email n'a pas changé et mdp vide = rien à faire
      if (email === currentEmail && !password) {
        setStatus('idle');
        onClose();
        return;
      }

      const res = await updateAdminProfile(
        email !== currentEmail ? email : undefined,
        password || undefined
      );

      if (res.success) {
        setStatus('success');
        setMessage('Profil mis à jour avec succès.');
        
        // Mettre à jour le store instantanément sans rechargement
        if (email !== currentEmail) {
          const { user, token, setAuth } = useThemeStore.getState();
          if (user && token) {
            setAuth(token, user.role as any, { ...user, email });
          }
        }

        setTimeout(() => {
          onClose();
          setStatus('idle');
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(res.message || 'Une erreur est survenue.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.message || 'Erreur réseau.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Mon Profil</h3>
                <p className="text-xs text-neutral-400 mt-1">Gérer vos identifiants de connexion</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 hover:text-white text-neutral-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Message de statut */}
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p>{message}</p>
                    </div>
                  </motion.div>
                )}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm mb-4">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <p>{message}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1 block">
                  Adresse Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-neutral-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 my-2">
                <p className="text-xs text-neutral-500 mb-4">Laissez vide si vous ne souhaitez pas modifier le mot de passe.</p>
                
                {/* Mot de passe */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1 block">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-neutral-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111] border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer mot de passe */}
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1 block">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-neutral-500" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required={password.length > 0}
                            className="w-full bg-[#111] border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading' || (email === currentEmail && !password)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#d4af37] text-black hover:bg-[#e5c048] focus:ring-4 focus:ring-[#d4af37]/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
