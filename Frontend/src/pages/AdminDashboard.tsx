// =============================================================================
// PAGE ADMIN DASHBOARD — Tableau de bord d'administration protégé
// =============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Users, Trophy, Banknote, Settings, LogOut, ChevronRight, Search, Bell } from 'lucide-react';
import { getDashboardStats } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardStats } from '@/types';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement stats :', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const statCards = [
    { icon: Users, label: 'Candidats Inscrits', value: stats?.totalCandidates ?? 0, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Trophy, label: 'Votes Totaux', value: stats?.totalVotes ?? 0, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10' },
    { icon: Banknote, label: 'Revenus (FCFA)', value: stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()}` : 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { icon: BarChart3, label: 'Retraits en Attente', value: stats?.pendingWithdrawals ?? 0, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex pt-16 sm:pt-20">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0b0b0b]/80 border-r border-white/5 hidden lg:flex flex-col">
        <div className="p-8">
          <p className="text-xs font-bold text-[#d4af37] uppercase tracking-[0.2em] mb-8">Menu Admin</p>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#d4af37]/10 to-transparent border-l-2 border-[#d4af37] text-white rounded-r-lg transition-colors">
              <BarChart3 className="w-5 h-5 text-[#d4af37]" />
              <span className="font-semibold text-sm">Vue d'ensemble</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium text-sm">Candidats</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Trophy className="w-5 h-5" />
              <span className="font-medium text-sm">Votes & Catégories</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Banknote className="w-5 h-5" />
              <span className="font-medium text-sm">Finances</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Paramètres</span>
            </button>
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
          
          {/* TOP BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-white font-heading uppercase tracking-wider">
                Tableau de bord
              </h1>
              <p className="text-neutral-400 text-sm mt-1">
                Gérez le concours, les candidats et suivez les votes en temps réel.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="bg-[#0b0b0b] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50 transition-colors w-64"
                />
              </div>
              <button className="relative p-2 rounded-full bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-[#0b0b0b]/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-[#d4af37]/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-[#d4af37] transition-colors" />
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1">
                  {card.value}
                </p>
                <p className="text-neutral-500 text-sm font-medium">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* RECENT ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Table Candidats */}
            <div className="lg:col-span-2 bg-[#0b0b0b]/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm">Candidats Récents</h3>
                <button className="text-[#d4af37] text-xs font-bold hover:underline">Voir tout</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-500 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-medium">Nom</th>
                      <th className="pb-3 font-medium">Catégorie</th>
                      <th className="pb-3 font-medium">Votes</th>
                      <th className="pb-3 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {stats?.recentCandidates && stats.recentCandidates.length > 0 ? (
                      stats.recentCandidates.map((cand: any, i: number) => (
                        <tr key={cand.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 text-white font-medium">{cand.firstName} {cand.lastName}</td>
                          <td className="py-4 text-neutral-400">{cand.category?.name || 'N/A'}</td>
                          <td className="py-4 text-white font-bold">{cand.totalVotesCache || 0}</td>
                          <td className={`py-4 font-medium ${cand.status === 'ACTIVE' ? 'text-emerald-400' : cand.status === 'PENDING_VERIFICATION' ? 'text-orange-400' : 'text-neutral-400'}`}>{cand.status === 'PENDING_VERIFICATION' ? 'En attente' : cand.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="py-4 text-center text-neutral-500">Aucun candidat récent</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activité Votes */}
            <div className="bg-[#0b0b0b]/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm">Derniers Votes</h3>
              </div>
              <div className="space-y-4">
                {stats?.recentVotes && stats.recentVotes.length > 0 ? (
                  stats.recentVotes.map((vote: any, i: number) => {
                    const candName = vote.candidate ? `${vote.candidate.firstName} ${vote.candidate.lastName.charAt(0)}.` : 'Inconnu';
                    const time = new Date(vote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const userStr = vote.voterIdentifier || '';
                    const maskedUser = userStr.length > 6 ? `${userStr.substring(0, 3)}***${userStr.substring(userStr.length - 3)}` : userStr;
                    return (
                      <div key={vote.id || i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <p className="text-white text-sm font-medium">{maskedUser}</p>
                          <p className="text-[#d4af37] text-xs font-bold">{candName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 text-sm font-bold">+{vote.amount} FCFA</p>
                          <p className="text-neutral-500 text-xs">{time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-neutral-500 text-sm py-4">Aucun vote récent</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
