// =============================================================================
// PAGE ADMIN DASHBOARD — Layout complet autonome (hors du site public)
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Trophy, Banknote, Settings, LogOut,
  ChevronRight, Search, Bell, Smartphone, Menu, X,
  TrendingUp, Eye, Calendar
} from 'lucide-react';
import { getDashboardStats } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardStats } from '@/types';
import { CandidateForm } from '@/components/admin/CandidateForm';
import { CandidatesList } from '@/components/admin/CandidatesList';
import { ContentSitePanel } from '@/components/admin/ContentSitePanel';
import { WhatsAppManager } from '@/components/admin/WhatsAppManager';
import { FinanceSection } from '@/components/admin/FinanceSection';
import { useAdminDashboardSync, notifyAdminDashboardUpdated } from '@/hooks/useAdminDashboardSync';

// =============================================================================
// TYPES
// =============================================================================
type TabKey = 'dashboard' | 'candidates' | 'content' | 'whatsapp' | 'finances';

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

// =============================================================================
// CONSTANTES DE NAVIGATION
// =============================================================================
const TAB_TITLES: Record<TabKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Vue d\'ensemble', subtitle: 'Statistiques et activité récente du concours' },
  candidates: { title: 'Candidats', subtitle: 'Liste des participants et inscription de nouveaux candidats' },
  content: { title: 'Contenu & Site', subtitle: 'Gestion des sponsors, vidéos, carousel et contacts' },
  whatsapp: { title: 'WhatsApp', subtitle: 'Connexion et envoi automatisé de messages' },
  finances: { title: 'Finances', subtitle: 'Retraits, paiements et exports de données' },
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [candidatesRefreshKey, setCandidatesRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      if (res.success && res.data) setStats(res.data);
    } catch (err) {
      console.error('Erreur chargement stats :', err);
    }
  }, []);

  useAdminDashboardSync(fetchStats, 30000);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleCandidateSuccess = () => {
    setCandidatesRefreshKey((k) => k + 1);
  };

  const handleCandidatesChange = () => {
    notifyAdminDashboardUpdated();
    setCandidatesRefreshKey((k) => k + 1);
  };

  const handleFinancesChange = () => {
    notifyAdminDashboardUpdated();
  };

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Vue d\'ensemble', icon: BarChart3 },
    { key: 'candidates', label: 'Candidats', icon: Users, badge: stats?.totalCandidates },
    { key: 'content', label: 'Contenu & Site', icon: Settings },
    { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
    { key: 'finances', label: 'Finances', icon: Banknote },
  ];

  const statCards = [
    { icon: Users, label: 'Candidats', value: stats?.totalCandidates ?? 0, color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { icon: Trophy, label: 'Votes Totaux', value: stats?.totalVotes ?? 0, color: 'from-amber-500 to-yellow-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    { icon: Banknote, label: 'Revenus', value: stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} F` : '0 F', color: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { icon: TrendingUp, label: 'Retraits', value: stats?.pendingWithdrawals ?? 0, color: 'from-purple-500 to-violet-500', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400' },
  ];

  const greeting = (() => {
    const h = currentTime.getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans flex">

      {/* ================================================================
          MOBILE OVERLAY
          ================================================================ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ================================================================
          SIDEBAR
          ================================================================ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0f] border-r border-white/[0.06]
        flex flex-col transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo / Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8952e] flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
              <span className="text-black font-black text-sm">M</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">MBOA NEXT STAR</h1>
              <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">Administration</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] px-3 mb-4">Menu Principal</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-[#d4af37]/10 text-[#d4af37]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#d4af37]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#d4af37]' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-3">
          <div className="px-3 py-2">
            <p className="text-xs text-neutral-500">Connecté en tant que</p>
            <p className="text-sm font-semibold text-white truncate">Administrateur</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ================================================================
          MAIN CONTENT AREA
          ================================================================ */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* ── TOP BAR ────────────────────────────────────────────── */}
        <header className="h-16 sm:h-20 bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          {/* Left: Hamburger + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-white">{TAB_TITLES[activeTab].title}</h2>
              <p className="text-xs text-neutral-500">{TAB_TITLES[activeTab].subtitle}</p>
            </div>
          </div>

          {/* Right: Search + Notifications + Date */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-56 bg-white/[0.04] border border-white/[0.06] rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <button className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs text-neutral-400">
                {currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ─────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 lg:space-y-8">

            {/* =========================================================
                TAB: DASHBOARD
                ========================================================= */}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 lg:space-y-8"
              >
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f0f18] via-[#0d0d15] to-[#0f0f18] border border-white/[0.06] p-6 sm:p-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#d4af37]/[0.04] to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="relative">
                    <p className="text-sm text-[#d4af37] font-semibold mb-1">{greeting} 👋</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bienvenue dans votre espace admin</h2>
                    <p className="text-neutral-500 text-sm max-w-lg">
                      Suivez les performances du concours, gérez les candidats et pilotez l'ensemble de la plateforme.
                    </p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {statCards.map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.08 }}
                      className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-4 sm:p-5 hover:border-white/[0.12] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                          <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight mb-0.5">
                        {card.value}
                      </p>
                      <p className="text-neutral-500 text-xs sm:text-sm">{card.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                  {/* Candidats Récents - 3 cols */}
                  <div className="lg:col-span-3 bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-neutral-500" />
                        <h3 className="text-white font-semibold text-sm">Candidats Récents</h3>
                      </div>
                      <button className="text-[#d4af37] text-xs font-semibold hover:underline" onClick={() => handleTabChange('candidates')}>
                        Voir tout →
                      </button>
                    </div>
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-neutral-600 text-[11px] uppercase tracking-wider">
                            <th className="pb-3 px-2 font-medium">Nom</th>
                            <th className="pb-3 px-2 font-medium hidden sm:table-cell">Catégorie</th>
                            <th className="pb-3 px-2 font-medium">Votes</th>
                            <th className="pb-3 px-2 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {stats?.recentCandidates && stats.recentCandidates.length > 0 ? (
                            stats.recentCandidates.map((cand: any, i: number) => (
                              <tr key={cand.id || i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                <td className="py-3.5 px-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                      {cand.firstName?.charAt(0)}{cand.lastName?.charAt(0)}
                                    </div>
                                    <span className="text-white font-medium truncate">{cand.firstName} {cand.lastName}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-2 text-neutral-500 hidden sm:table-cell">{cand.category?.name || '—'}</td>
                                <td className="py-3.5 px-2 text-white font-semibold">{cand.totalVotesCache || 0}</td>
                                <td className="py-3.5 px-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    cand.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                    cand.status === 'PENDING_VERIFICATION' ? 'bg-orange-500/10 text-orange-400' :
                                    'bg-neutral-500/10 text-neutral-400'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      cand.status === 'ACTIVE' ? 'bg-emerald-400' :
                                      cand.status === 'PENDING_VERIFICATION' ? 'bg-orange-400' : 'bg-neutral-400'
                                    }`} />
                                    {cand.status === 'PENDING_VERIFICATION' ? 'Attente' : cand.status === 'ACTIVE' ? 'Actif' : cand.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={4} className="py-8 text-center text-neutral-600 text-sm">Aucun candidat récent</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Derniers Votes - 2 cols */}
                  <div className="lg:col-span-2 bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Trophy className="w-4 h-4 text-[#d4af37]" />
                      <h3 className="text-white font-semibold text-sm">Derniers Votes</h3>
                    </div>
                    <div className="space-y-2.5">
                      {stats?.recentVotes && stats.recentVotes.length > 0 ? (
                        stats.recentVotes.map((vote: any, i: number) => {
                          const candName = vote.candidate ? `${vote.candidate.firstName} ${vote.candidate.lastName.charAt(0)}.` : 'Inconnu';
                          const time = new Date(vote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const userStr = vote.voterIdentifier || '';
                          const maskedUser = userStr.length > 6 ? `${userStr.substring(0, 3)}***${userStr.substring(userStr.length - 3)}` : userStr;
                          return (
                            <div key={vote.id || i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                              <div className="min-w-0">
                                <p className="text-white text-sm font-medium truncate">{maskedUser}</p>
                                <p className="text-neutral-500 text-xs">{candName}</p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <p className="text-emerald-400 text-sm font-bold">+{vote.amount}</p>
                                <p className="text-neutral-600 text-[10px]">{time}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-neutral-600 text-sm py-8">Aucun vote récent</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* =========================================================
                TAB: CANDIDATS
                ========================================================= */}
            {activeTab === 'candidates' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <CandidatesList refreshKey={candidatesRefreshKey} onChange={handleCandidatesChange} />
                <CandidateForm onSuccess={handleCandidateSuccess} />
              </motion.div>
            )}

            {/* =========================================================
                TAB: CONTENU & SITE
                ========================================================= */}
            {activeTab === 'content' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ContentSitePanel />
              </motion.div>
            )}

            {/* =========================================================
                TAB: WHATSAPP
                ========================================================= */}
            {activeTab === 'whatsapp' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <WhatsAppManager />
              </motion.div>
            )}

            {/* =========================================================
                TAB: FINANCES
                ========================================================= */}
            {activeTab === 'finances' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <FinanceSection onChange={handleFinancesChange} />
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
