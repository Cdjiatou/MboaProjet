import { useState, useEffect } from 'react';
import { getAdminCandidates, deleteAdminCandidate } from '@/services/adminService';
import { Users, Search, Loader2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Candidate } from '@/types';
import { getMediaUrl } from '@/utils/mediaUrl';
import { CandidateEditModal } from './CandidateEditModal';
import { useToastStore } from '@/store/useToastStore';
import { getApiErrorMessage } from '@/utils/apiError';
import { notifyCandidatesUpdated } from '@/hooks/usePublicCandidates';
import { AdminCard } from './AdminUI';

const STATUS_LABELS: Record<string, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  PENDING_VERIFICATION: { label: 'En attente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  VERIFIED: { label: 'Vérifié', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  SUSPENDED: { label: 'Suspendu', className: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
};

interface Props {
  refreshKey?: number;
  onChange?: () => void;
}

export const CandidatesList = ({ refreshKey = 0, onChange }: Props) => {
  const toast = useToastStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Candidate | null>(null);

  useEffect(() => {
    fetchCandidates(search);
  }, [refreshKey]);

  const fetchCandidates = async (query?: string) => {
    setLoading(true);
    try {
      const res = await getAdminCandidates({ search: query || undefined });
      if (res.success && res.data) {
        setCandidates(res.data.candidates);
        setTotal(res.data.total);
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de charger les candidats.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates(search);
  };

  const handleQuickDelete = async (cand: Candidate) => {
    if (!window.confirm(`Supprimer définitivement ${cand.firstName} ${cand.lastName} ?`)) return;
    try {
      const res = await deleteAdminCandidate(cand.id);
      if (res.success) {
        notifyCandidatesUpdated();
        onChange?.();
        toast.show({ variant: 'success', title: 'Suppression réussie', message: 'Le candidat a été retiré.' });
      }
    } catch (err) {
      toast.show({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Suppression impossible.') });
    }
  };

  return (
    <>
      <AdminCard>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-inner">
              <Users className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide font-heading">Gestion des candidats</h2>
              <p className="text-xs text-neutral-400 mt-1">{total} candidat(s) répertorié(s)</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, ville..."
              className="w-full sm:w-72 bg-[#111116] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-all"
            />
          </form>
        </div>

        {loading && candidates.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-neutral-400" />
            <span className="text-sm font-medium">Chargement de la liste...</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <p className="text-sm">Aucun candidat trouvé.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Candidat</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Votes</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidates.map((cand) => {
                  const st = STATUS_LABELS[cand.status] || STATUS_LABELS.PENDING_VERIFICATION;
                  const photoUrl = cand.profilePhoto ? getMediaUrl(cand.profilePhoto) : null;
                  return (
                    <tr key={cand.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {photoUrl ? (
                              <img src={photoUrl} alt={cand.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-5 h-5 text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-neutral-300 transition-colors">
                              {cand.firstName} {cand.lastName}
                            </p>
                            <p className="text-xs text-neutral-500">{cand.phone || cand.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300 font-medium">
                        {cand.category?.name || 'Non spécifié'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-300">
                        {cand.totalVotesCache || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/candidats/${cand.id}`}
                            target="_blank"
                            className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Voir profil"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditing(cand)}
                            className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickDelete(cand)}
                            className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Modal d'édition */}
      {editing && (
        <CandidateEditModal
          candidate={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChange?.();
          }}
          onDeleted={() => {
            setEditing(null);
            onChange?.();
          }}
        />
      )}
    </>
  );
};
