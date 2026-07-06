// =============================================================================
// PAGE LOGIN — Connexion Admin Cachée & Sécurisée
// =============================================================================

import React, { useEffect, useState } from 'react'; // [CORRIGÉ] AnimatePresence est maintenant correctement importé ici
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { LogIn, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginAdmin } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirection automatique si session active
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/nexstar/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate('/nexstar/dashboard', { replace: true });
      } else {
        setLoginError(res.error || 'Erreur d\'authentification.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setLoginError(error.response?.data?.error || 'Identifiants invalides ou serveur injoignable.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050507] relative overflow-hidden selection:bg-[#d4af37]/30">
      
      {/* Gradients d'Ambiance Ultra-Discrets */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#d4af37]/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#d4af37]/[0.02] rounded-full blur-[140px] pointer-events-none" />

      {/* Carte Centrale */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-neutral-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 sm:p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
      >
        {/* En-tête de la carte */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-[#d4af37] mb-5 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            Espace Confidentiel
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium">
            Portail d'administration MBOA NEXT STAR
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-400">
                Identifiant professionnel
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@mboanextstar.com"
                required
                disabled={loginLoading}
                className="w-full px-4 py-3 bg-neutral-950/60 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/40 focus:ring-1 focus:ring-[#d4af37]/40 disabled:opacity-50 transition-all"
              />
            </div>

            {/* Champ Mot de Passe */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-neutral-400">
                Clé de sécurité
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loginLoading}
                  className="w-full px-4 py-3 bg-neutral-950/60 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/40 focus:ring-1 focus:ring-[#d4af37]/40 disabled:opacity-50 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Gestion des erreurs fluide */}
          <AnimatePresence mode="wait">
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-red-400 text-xs font-medium text-center bg-red-500/[0.06] border border-red-500/20 py-3 px-4 rounded-xl"
              >
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton Soumettre */}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#d4af37] text-neutral-950 font-bold text-sm rounded-xl hover:bg-[#bfa032] disabled:opacity-40 transition-colors shadow-[0_4px_24px_rgba(212,175,55,0.12)] cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {loginLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
export { Login };