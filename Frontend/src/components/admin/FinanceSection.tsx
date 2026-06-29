import { useState, useMemo } from 'react';
import { createWithdrawal, exportVotesCSV, exportWithdrawalsCSV } from '@/services/adminService';
import { Banknote, Download, Loader2, FileText, Info } from 'lucide-react';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';

const MARVIANS_FEE_RATE = 0.03;

interface Props {
  onChange?: () => void;
}

export const FinanceSection = ({ onChange }: Props) => {
  const toast = useToastStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const parsedAmount = Number(amount) || 0;
  const feePreview = useMemo(() => {
    if (parsedAmount <= 0) return null;
    const feeAmount = Math.floor(parsedAmount * MARVIANS_FEE_RATE);
    return { feeAmount, netAmount: parsedAmount - feeAmount };
  }, [parsedAmount]);

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createWithdrawal(parsedAmount);
      if (res.success) {
        const w = (res as { withdrawal?: { feeAmount?: number; netAmount?: number } }).withdrawal;
        const fee = w?.feeAmount ?? Math.floor(parsedAmount * MARVIANS_FEE_RATE);
        const net = w?.netAmount ?? parsedAmount - fee;
        toast.show({
          variant: 'success',
          title: 'Retrait initié',
          message: `${net.toLocaleString('fr-FR')} FCFA net (commission Marvians : ${fee.toLocaleString('fr-FR')} F, 3 %)`,
        });
        setAmount('');
        onChange?.();
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || 'Impossible de créer le retrait' });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.show({ variant: 'error', title: 'Erreur', message: msg || 'Erreur serveur' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportVotes = async () => {
    try {
      const blob = await exportVotesCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export_votes.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.show({ variant: 'success', title: 'Export réussi', message: 'Fichier export_votes.csv téléchargé.' });
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Erreur lors de l\'export des votes' });
    }
  };

  const handleExportWithdrawals = async () => {
    try {
      const blob = await exportWithdrawalsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export_retraits.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.show({ variant: 'success', title: 'Export réussi', message: 'Fichier export_retraits.csv téléchargé.' });
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Erreur lors de l\'export des retraits' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Retrait */}
      <AdminCard>
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shadow-inner">
            <Banknote className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Initier un retrait</h2>
            <p className="text-xs text-neutral-400 mt-1">Soumis à une commission de 3% Marvians (Smobilpay)</p>
          </div>
        </div>

        <form onSubmit={handleCreateWithdrawal} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-400">Montant brut (FCFA)</label>
            <input
              required
              type="number"
              min="100"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 10000"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>

          {feePreview && (
            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Info className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs uppercase tracking-wider">Récapitulatif Marvians (3 %)</span>
              </div>
              <div className="flex justify-between text-neutral-400 text-xs">
                <span>Montant demandé</span>
                <span className="text-white font-medium">{parsedAmount.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between text-neutral-400 text-xs">
                <span>Commission Marvians (3 %)</span>
                <span className="text-amber-400 font-medium">− {feePreview.feeAmount.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-white/10">
                <span className="text-white">Montant net versé</span>
                <span className="text-emerald-400">{feePreview.netAmount.toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          )}

          <AdminButton type="submit" loading={loading} className="w-full sm:w-auto">
            Créer le retrait
          </AdminButton>
        </form>
      </AdminCard>

      {/* Section Exports */}
      <AdminCard>
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shadow-inner">
            <FileText className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Exports de données</h2>
            <p className="text-xs text-neutral-400 mt-1">Téléchargez les rapports complets au format CSV</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminButton variant="secondary" icon={Download} onClick={handleExportVotes} className="w-full py-4 justify-start px-5">
            <div className="text-left">
              <p className="font-semibold text-white">Exporter les votes</p>
              <p className="text-[11px] text-neutral-400 font-normal mt-0.5">Télécharger le fichier CSV complet</p>
            </div>
          </AdminButton>

          <AdminButton variant="secondary" icon={Download} onClick={handleExportWithdrawals} className="w-full py-4 justify-start px-5">
            <div className="text-left">
              <p className="font-semibold text-white">Exporter les retraits</p>
              <p className="text-[11px] text-neutral-400 font-normal mt-0.5">Télécharger l'historique des retraits</p>
            </div>
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
};
