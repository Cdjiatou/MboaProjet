import { useState, useEffect, useRef, useCallback } from 'react';
import { getSponsorsConfig, saveSponsorsConfig, uploadSponsorLogo } from '@/services/adminService';
import { Image as ImageIcon, Plus, Trash2, Loader2, Save, Upload, Link as LinkIcon, ExternalLink, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { getMediaUrl } from '@/utils/mediaUrl';
import { AdminButton } from './AdminUI';
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
        message: 'Partenaires par défaut affichés. Vérifiez que le serveur backend tourne sur le port 3000.',
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
      toast.show({ variant: 'error', title: 'Format non supporté', message: 'Utilisez JPEG, PNG ou WebP.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.show({ variant: 'error', title: 'Fichier trop volumineux', message: 'Limite : 5 Mo.' });
      return;
    }

    setUploadingIndex(index);
    try {
      const res = await uploadSponsorLogo(file);
      if (res.success && (res as { logoUrl?: string }).logoUrl) {
        updateSponsor(index, 'image', (res as { logoUrl: string }).logoUrl);
        toast.show({ variant: 'success', title: 'Logo importé', message: 'Le logo a été téléversé avec succès.' });
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: 'Impossible de téléverser le logo.' });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.show({ variant: 'error', title: 'Erreur upload', message: msg || 'Erreur lors de l\'import.' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const serverRes = await getSponsorsConfig();
      const serverList: SponsorItem[] = serverRes.success && Array.isArray(serverRes.data) ? serverRes.data : [];

      const validUi = sponsors
        .filter((s) => s.name.trim() && s.image.trim())
        .map((s) => ({ ...s, id: s.id || generateSponsorId() }));

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
          title: 'Sponsors enregistrés',
          message: `${saved.length} partenaire(s) publié(s) sur le site.`,
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
    toast.show({ variant: 'info', title: 'Partenaires par défaut', message: 'Les sponsors par défaut ont été ajoutés à la liste. Cliquez sur Enregistrer pour publier.' });
  };

  const handleAdd = () => {
    setSponsors((prev) => [...prev, { id: generateSponsorId(), name: '', url: '', image: '' }]);
  };

  const activeSponsors = sponsors.filter((s) => s.name.trim() && s.image.trim());

  if (loading) {
    return (
      <div className="p-10 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" /> Chargement des sponsors...
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-[#d4af37]" />
          <div>
            <h2 className="text-xl font-bold text-white">Gestion des Sponsors</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{activeSponsors.length} partenaire(s) actif(s) · {sponsors.length} entrée(s) au total</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton variant="secondary" size="sm" icon={RotateCcw} onClick={handleRestoreDefaults} className="normal-case tracking-normal">
            Importer défauts
          </AdminButton>
          <AdminButton icon={Save} onClick={handleSave} loading={saving}>
            Enregistrer tout
          </AdminButton>
        </div>
      </div>

      {activeSponsors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Aperçu sur le site</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeSponsors.map((s) => (
              <div
                key={s.id}
                className="group relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col items-center gap-3 hover:border-[#d4af37]/30 transition-colors"
              >
                <div className="w-full h-16 flex items-center justify-center">
                  <img src={getMediaUrl(s.image)} alt={s.name} className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <p className="text-xs text-white font-medium text-center truncate w-full">{s.name}</p>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-[#d4af37] hover:underline">
                    <ExternalLink className="w-3 h-3" /> Site web
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Tous les partenaires</h3>

        {sponsors.map((s, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={s.id}
            className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.06] space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-24 h-24 rounded-xl bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                {s.image ? (
                  <img src={getMediaUrl(s.image)} alt={s.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-neutral-600" />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                  placeholder="Nom du partenaire"
                  className="w-full bg-[#0b0b0b] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 transition-all"
                />
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                  <input
                    type="url"
                    value={s.url}
                    onChange={(e) => updateSponsor(index, 'url', e.target.value)}
                    placeholder="https://site-du-partenaire.com"
                    className="flex-1 bg-[#0b0b0b] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 transition-all"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={s.image}
                    onChange={(e) => updateSponsor(index, 'image', e.target.value)}
                    placeholder="URL du logo ou importer depuis le PC"
                    className="flex-1 bg-[#0b0b0b] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 transition-all"
                  />
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
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    loading={uploadingIndex === index}
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="shrink-0 normal-case tracking-normal"
                  >
                    Importer
                  </AdminButton>
                </div>
              </div>

              <button
                onClick={() => setSponsors(sponsors.filter((_, i) => i !== index))}
                className="self-start p-2.5 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors"
                title="Supprimer ce partenaire"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-white/[0.06] text-neutral-400 hover:text-white hover:border-[#d4af37] hover:bg-[#d4af37]/5 transition-all rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Ajouter un partenaire
        </button>
      </div>
    </div>
  );
};
