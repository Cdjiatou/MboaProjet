import { useState, useMemo } from 'react';
import { createWithdrawal, exportVotesCSV, exportWithdrawalsCSV } from '@/services/adminService';
import { Banknote, Download, Loader2, FileText, Info } from 'lucide-react';

const MARVIANS_FEE_RATE = 0.03;

interface Props {
  onChange?: () => void;
}

export const FinanceSection = ({ onChange }: Props) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const parsedAmount = Number(amount) || 0;
  const feePreview = useMemo(() => {
    if (parsedAmount <= 0) return null;
    const feeAmount = Math.floor(parsedAmount * MARVIANS_FEE_RATE);
    return { feeAmount, netAmount: parsedAmount - feeAmount };
  }, [parsedAmount]);

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await createWithdrawal(parsedAmount);
      if (res.success) {
        const w = (res as { withdrawal?: { feeAmount?: number; netAmount?: number } }).withdrawal;
        const fee = w?.feeAmount ?? Math.floor(parsedAmount * MARVIANS_FEE_RATE);
        const net = w?.netAmount ?? parsedAmount - fee;
        setMessage(`✅ Retrait initié — ${net.toLocaleString('fr-FR')} FCFA net (commission Marvians : ${fee.toLocaleString('fr-FR')} F, 3 %)`);
        setAmount('');
        onChange?.();
      } else {
        setMessage('❌ Erreur : ' + (res.message || 'Impossible de créer le retrait'));
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setMessage('❌ Erreur : ' + (msg || 'Erreur serveur'));
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
    } catch (err: any) {
      setMessage('❌ Erreur lors de l\'export des votes');
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
    } catch (err: any) {
      setMessage('❌ Erreur lors de l\'export des retraits');
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {/* Section Retrait */}
      <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Banknote className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold text-white">Initier un Retrait</h2>
        </div>

        <p className="text-xs text-neutral-500 mb-6">
          À la fin du concours, les retraits sont soumis à une commission de <strong className="text-[#d4af37]">3 % Marvians</strong> (Smobilpay).
        </p>

        <form onSubmit={handleCreateWithdrawal} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Montant brut (FCFA)</label>
            <input
              required
              type="number"
              min="100"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {feePreview && (
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Info className="w-4 h-4 shrink-0" />
                <span className="font-semibold">Récapitulatif Marvians (3 %)</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Montant demandé</span>
                <span className="text-white">{parsedAmount.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Commission Marvians (3 %)</span>
                <span className="text-orange-400">− {feePreview.feeAmount.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-white/10">
                <span className="text-white">Montant net versé</span>
                <span className="text-emerald-400">{feePreview.netAmount.toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-wider rounded-xl hover:bg-[#b8952e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer le Retrait'}
          </button>
        </form>
      </div>

      {/* Section Exports */}
      <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold text-white">Exports CSV</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportVotes}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/[0.06] rounded-xl text-white hover:bg-white/10 hover:border-[#d4af37]/50 transition-colors"
          >
            <Download className="w-5 h-5 text-[#d4af37]" />
            <span className="font-semibold">Exporter les Votes</span>
          </button>

          <button
            onClick={handleExportWithdrawals}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/[0.06] rounded-xl text-white hover:bg-white/10 hover:border-[#d4af37]/50 transition-colors"
          >
            <Download className="w-5 h-5 text-[#d4af37]" />
            <span className="font-semibold">Exporter les Retraits</span>
          </button>
        </div>
      </div>
    </div>
  );
};
