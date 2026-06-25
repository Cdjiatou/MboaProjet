// =============================================================================
// PAGE LOGIN — Connexion Admin cachée
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Shield } from 'lucide-react';
import { loginAdmin } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Redirection si l'utilisateur est déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setLoginError(res.error || 'Erreur lors de la connexion.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setLoginError(error.response?.data?.error || 'Identifiants invalides.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050505] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(212,175,55,0.05)] rounded-3xl p-8 sm:p-12 max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 mb-6">
            <Shield className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="text-3xl font-black text-white font-heading uppercase tracking-widest mb-2">
            Espace <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Privé</span>
          </h1>
          <p className="text-neutral-400 text-sm">
            Portail d'administration MBOA NEXT STAR
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mboanextstar.com"
                required
                className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
              />
            </div>
          </div>

          {loginError && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 py-3 px-4 rounded-xl"
            >
              {loginError}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-8"
          >
            {loginLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Accéder au portail
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
