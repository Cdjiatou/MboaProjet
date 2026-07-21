import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Shield, User, Mail, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AdminCard, AdminButton } from './AdminUI';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/services/adminService';
import toast from 'react-hot-toast';

interface AdminUserData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminUsersManager = () => {
  const [admins, setAdmins] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserData | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const res = await getAdminUsers();
      if (res.success && res.data) {
        setAdmins(res.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des administrateurs');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenModal = (admin?: AdminUserData) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        password: '',
        role: admin.role,
        isActive: admin.isActive,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (!editingAdmin && !formData.password) {
        toast.error('Un mot de passe est requis pour un nouvel administrateur');
        return;
      }

      const submitData = { ...formData };
      if (!submitData.password) {
        delete (submitData as any).password;
      }

      if (editingAdmin) {
        await updateAdminUser(editingAdmin.id, submitData);
        toast.success('Administrateur mis à jour avec succès');
      } else {
        await createAdminUser(submitData);
        toast.success('Administrateur créé avec succès');
      }
      
      setIsModalOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est irréversible.')) {
      try {
        await deleteAdminUser(id);
        toast.success('Administrateur supprimé avec succès');
        fetchAdmins();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleToggleStatus = async (admin: AdminUserData) => {
    try {
      await updateAdminUser(admin.id, { isActive: !admin.isActive });
      toast.success(admin.isActive ? 'Compte suspendu' : 'Compte réactivé');
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du statut');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#d4af37]" />
            Équipe Administrateur
          </h3>
          <p className="text-sm text-neutral-400 mt-1">Gérez les accès et les rôles de l'équipe</p>
        </div>
        <AdminButton onClick={() => handleOpenModal()} icon={Plus}>
          Nouvel Administrateur
        </AdminButton>
      </div>

      <AdminCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Utilisateur</th>
                <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Rôle</th>
                <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Statut</th>
                <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">Chargement...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">Aucun administrateur trouvé.</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-white">{admin.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{admin.name}</p>
                          <p className="text-xs text-neutral-500">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        admin.role === 'SUPER_ADMIN' 
                          ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {admin.role === 'SUPER_ADMIN' ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleStatus(admin)}
                        title={admin.isActive ? "Suspendre" : "Réactiver"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          admin.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {admin.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {admin.isActive ? 'Actif' : 'Suspendu'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(admin)}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">
                  {editingAdmin ? 'Modifier l\'administrateur' : 'Nouvel administrateur'}
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  {editingAdmin ? 'Mettez à jour les informations du compte.' : 'Créez un nouveau compte avec accès au tableau de bord.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Nom complet</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/5 transition-all"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/5 transition-all"
                      placeholder="jean.dupont@exemple.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex justify-between">
                    Mot de passe
                    {editingAdmin && <span className="text-xs text-neutral-500">(Optionnel)</span>}
                  </label>
                  <input
                    type="text"
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/5 transition-all"
                    placeholder={editingAdmin ? "Laissez vide pour ne pas changer" : "Saisissez un mot de passe temporaire"}
                  />
                  {!editingAdmin && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      Assurez-vous de communiquer ce mot de passe à l'utilisateur.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[#d4af37]/50 focus:bg-white/5 transition-all appearance-none"
                  >
                    <option value="ADMIN">Admin (Accès restreint)</option>
                    <option value="SUPER_ADMIN">Super Admin (Accès total)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <AdminButton 
                    type="button" 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Annuler
                  </AdminButton>
                  <AdminButton 
                    type="submit" 
                    variant="primary" 
                    className="flex-1"
                    loading={isSubmitting}
                  >
                    {editingAdmin ? 'Mettre à jour' : 'Créer le compte'}
                  </AdminButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
