import { useState, useEffect, useRef, useCallback } from 'react';
import { getSponsorsConfig, saveSponsorsConfig, uploadSponsorLogo } from '@/services/adminService';
import { Image as ImageIcon, Plus, Trash2, Loader2, Save, Link as LinkIcon, ExternalLink, RotateCcw, UploadCloud, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { getMediaUrl } from '@/utils/mediaUrl';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';
import {
  DEFAULT_SPONSORS,
  generateSponsorId,
  mergeSponsors,
  resolvePublicSponsors,
  type SponsorItem,
} from '@/utils/sponsors';

export const SponsorsManager = () => {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const refreshConfig = useRefreshSiteConfig();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSponsorsConfig();
      const fromDb: SponsorItem[] = res.success && Array.isArray(res.data) ? res.data : [];
      const display = resolvePublicSponsors(JSON.stringify(fromDb));
      setSponsors(display);
      setLoadedIds(new Set(display.map((s) => s.id)));
    } catch {
      const fallback = mergeSponsors([], DEFAULT_SPONSORS);
      setSponsors(fallback);
      setLoadedIds(new Set(fallback.map((s) => s.id)));
      toast.show({
        variant: 'warning',
        title: 'Backend indisponible',
        message: 'Partenaires par défaut affichés.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateSponsor = (index: number, field: keyof SponsorItem, value: string) => {
    setSponsors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFileUpload = async (index: number, file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.show({ variant: 'error', title: 'Format invalide', message: 'Utilisez JPEG, PNG ou WebP.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.show({ variant: 'error', title: 'Fichier trop volumineux', message: 'La limite est de 5 Mo.' });
      return;
    }

    setUploadingIndex(index);
    try {
      const res = await uploadSponsorLogo(file);
      if (res.success && res.data?.logoUrl) {
        const newLogoUrl = res.data.logoUrl;
        
        // Mettre à jour immédiatement l'état local
        setSponsors((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], image: newLogoUrl };
          return next;
        });

        toast.show({ variant: 'success', title: 'Logo mis à jour', message: 'Le nouveau logo a été téléversé.' });
        
        // Répercuter dynamiquement en temps réel si le partenaire est valide
        const target = sponsors[index];
        if (target && target.name.trim()) {
          const updatedList = sponsors.map((s, i) => i === index ? { ...s, image: newLogoUrl } : s);
          await saveSponsorsConfig(updatedList, true);
          await refreshConfig();
        }
      } else {
        toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de téléverser le logo.' });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.show({ variant: 'error', title: 'Erreur', message: msg || 'Erreur lors de l\'import.' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSave = async () => {
    const hasIncomplete = sponsors.some(s => !s.name.trim() || !s.image.trim());
    if (hasIncomplete) {
      toast.show({
        variant: 'error',
        title: 'Action requise',
        message: 'Veuillez renseigner le nom et ajouter un logo pour tous les partenaires, ou supprimez ceux qui sont vides.'
      });
      return;
    }

    setSaving(true);
    try {
      const serverRes = await getSponsorsConfig();
      const serverList: SponsorItem[] = serverRes.success && Array.isArray(serverRes.data) ? serverRes.data : [];

      const validUi = sponsors.map((s) => ({ ...s, id: s.id || generateSponsorId() }));

      const uiIdSet = new Set(sponsors.map((s) => s.id).filter(Boolean));
      const deletedIds = new Set([...loadedIds].filter((id) => !uiIdSet.has(id)));

      const orphaned = serverList.filter((s) => !uiIdSet.has(s.id) && !deletedIds.has(s.id));
      const finalList = mergeSponsors(orphaned, validUi);

      const res = await saveSponsorsConfig(finalList, true);
      if (res.success) {
        const saved = res.data || finalList;
        setSponsors(saved);
        setLoadedIds(new Set(saved.map((s) => s.id)));
        toast.show({
          variant: 'success',
          title: 'Sauvegarde réussie',
          message: 'Les partenaires ont été mis à jour sur le site.',
        });
        await refreshConfig();
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || 'Impossible de sauvegarder.' });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.show({ variant: 'error', title: 'Erreur', message: msg || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    const merged = mergeSponsors(sponsors, DEFAULT_SPONSORS);
    setSponsors(merged);
    toast.show({ variant: 'info', title: 'Importation', message: 'Partenaires par défaut réintégrés.' });
  };

  const handleAdd = () => {
    setSponsors((prev) => [{ id: generateSponsorId(), name: '', url: '', image: '' }, ...prev]);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" />
        <span className="text-sm font-medium">Chargement des partenaires...</span>
      </div>
    );
  }

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-inner">
            <ImageIcon className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Gestion des sponsors</h2>
            <p className="text-xs text-neutral-400 mt-1">{sponsors.length} partenaire(s) référencé(s)</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminButton variant="secondary" size="sm" icon={RotateCcw} onClick={handleRestoreDefaults}>
            réinitialiser
          </AdminButton>
          <AdminButton icon={Save} onClick={handleSave} loading={saving}>
            enregistrer
          </AdminButton>
        </div>
      </div>

      <div className="space-y-6">
        <button
          onClick={handleAdd}
          className="w-full group relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 rounded-3xl py-6 flex flex-col items-center justify-center gap-2.5"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Plus className="w-5 h-5 text-neutral-400" />
          </div>
          <span className="text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
            ajouter un partenaire
          </span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {sponsors.map((s, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={s.id}
                className="bg-white/[0.02] rounded-3xl overflow-hidden shadow-xl group hover:bg-white/[0.04] transition-all duration-300"
              >
                {/* Image Upload Area */}
                <div 
                  className="relative w-full h-40 bg-black/40 cursor-pointer overflow-hidden flex items-center justify-center"
                  onClick={() => fileInputRefs.current[index]?.click()}
                >
                  {s.image ? (
                    <img 
                      src={getMediaUrl(s.image)} 
                      alt={s.name} 
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 text-neutral-500 group-hover:text-neutral-300 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">ajouter un logo</span>
                    </div>
                  )}

                  {uploadingIndex === index && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-[#d4af37] mb-2" />
                      <span className="text-xs text-white font-medium">Téléversement...</span>
                    </div>
                  )}

                  {s.image && uploadingIndex !== index && (
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-xs text-white font-medium flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                        <UploadCloud className="w-4 h-4 text-[#d4af37]" /> Changer le logo
                      </span>
                    </div>
                  )}
                  
                  <input
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(index, file);
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Form Fields */}
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nom du partenaire</label>
                    <input
                          type="text"
                          value={s.name}
                          onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                          placeholder="Nom du partenaire"
                          className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                        />
                    {!s.name.trim() && (
                      <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Champ obligatoire
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Lien site web (optionnel)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                          type="url"
                          value={s.url}
                          onChange={(e) => updateSponsor(index, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-white/[0.03] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                        />
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer / Actions */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-end bg-white/[0.01]">
                  <button
                    onClick={() => setSponsors(sponsors.filter((_, i) => i !== index))}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AdminCard>
  );
};
