import { useState, useEffect } from 'react';
import { getAdminCandidates } from '@/services/adminService';
import { Users, Search, Loader2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Candidate } from '@/types';
import { getMediaUrl } from '@/utils/mediaUrl';
import { CandidateEditModal } from './CandidateEditModal';
import { deleteAdminCandidate } from '@/services/adminService';
import { useToastStore } from '@/store/useToastStore';
import { getApiErrorMessage } from '@/utils/apiError';
import { notifyCandidatesUpdated } from '@/hooks/usePublicCandidates';

const STATUS_LABELS: Record<string, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  PENDING_VERIFICATION: { label: 'En attente', className: 'bg-orange-500/10 text-orange-400', dot: 'bg-orange-400' },
  VERIFIED: { label: 'Vérifié', className: 'bg-blue-500/10 text-blue-400', dot: 'bg-blue-400' },
  SUSPENDED: { label: 'Suspendu', className: 'bg-red-500/10 text-red-400', dot: 'bg-red-400' },
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
    fetchCandidates();
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
    if (!window.confirm(`Supprimer ${cand.firstName} ${cand.lastName} ?`)) return;
    try {
      const res = await deleteAdminCandidate(cand.id);
      if (res.success) {
        notifyCandidatesUpdated();
        onChange?.();
        toast.show({ variant: 'success', title: 'Supprimé', message: 'Candidat retiré.' });
        fetchCandidates(search);
      }
    } catch (err) {
      toast.show({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Suppression impossible.') });
    }
  };

  return (
    <>
      <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h2 className="text-lg font-bold text-white">Gestion des candidats</h2>
              <p className="text-xs text-neutral-500">{total} candidat(s) · Modifier, supprimer, changer le statut</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full sm:w-64 bg-white/[0.03] border border-white/[0.06] rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/40 transition-all"
            />
          </form>
        </div>

        {loading ? (
          <div className="py-12 text-center text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            Chargement des candidats...
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-12 text-center text-neutral-600 text-sm">Aucun candidat trouvé.</div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-neutral-600 text-[11px] uppercase tracking-wider">
                  <th className="pb-3 px-2 font-medium">Candidat</th>
                  <th className="pb-3 px-2 font-medium hidden md:table-cell">Contact</th>
                  <th className="pb-3 px-2 font-medium hidden sm:table-cell">Catégorie</th>
                  <th className="pb-3 px-2 font-medium">Votes</th>
                  <th className="pb-3 px-2 font-medium">Statut</th>
                  <th className="pb-3 px-2 font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {candidates.map((cand) => {
                  const statusInfo = STATUS_LABELS[cand.status] || STATUS_LABELS.PENDING_VERIFICATION;
                  return (
                    <tr key={cand.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {cand.profilePhoto ? (
                            <img src={getMediaUrl(cand.profilePhoto, cand.updatedAt)} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {cand.firstName?.charAt(0)}{cand.lastName?.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{cand.firstName} {cand.lastName}</p>
                            <p className="text-neutral-600 text-xs hidden sm:block">{new Date(cand.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <p className="text-neutral-400 text-xs truncate max-w-[180px]">{cand.email}</p>
                        <p className="text-neutral-600 text-xs">{cand.phone}</p>
                      </td>
                      <td className="py-3 px-2 text-neutral-500 hidden sm:table-cell">{cand.category?.name || '—'}</td>
                      <td className="py-3 px-2 text-white font-semibold">{cand.totalVotesCache || 0}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditing(cand)} className="p-1.5 text-neutral-500 hover:text-[#d4af37] transition-colors" title="Modifier">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleQuickDelete(cand)} className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {cand.slug && (
                            <Link to={`/candidats/${cand.slug}`} target="_blank" className="p-1.5 text-neutral-500 hover:text-[#d4af37] transition-colors" title="Voir le profil">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <CandidateEditModal
          candidate={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { fetchCandidates(search); onChange?.(); }}
          onDeleted={() => { fetchCandidates(search); onChange?.(); }}
        />
      )}
    </>
  );
};
