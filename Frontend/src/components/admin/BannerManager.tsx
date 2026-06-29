import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Save, Loader2, Eye, EyeOff, Trash2, Plus,
  Link as LinkIcon, AlertCircle, UploadCloud, Play, CheckCircle2
} from 'lucide-react';
import { getPublicConfig, updateConfig, uploadMediaFile } from '@/services/adminService';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';

export interface AdBannerItem {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  videoUrl: string;
  backgroundImageUrl: string;
}

const createEmptyBanner = (): AdBannerItem => ({
  id: `banner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  enabled: true,
  title: '',
  subtitle: '',
  ctaLabel: 'En savoir plus',
  ctaUrl: '#',
  videoUrl: '',
  backgroundImageUrl: '',
});

export const BannerManager: React.FC = () => {
  const toast = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState<AdBannerItem[]>([]);
  const [uploadingState, setUploadingState] = useState<{ id: string; type: 'bg' | 'video' } | null>(null);

  const refreshConfig = useRefreshSiteConfig();

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicConfig();
        if (res.success && res.data) {
          const d = res.data;
          let loadedBanners: AdBannerItem[] = [];

          if (d.ad_banners) {
            try {
              const parsed = JSON.parse(d.ad_banners);
              if (Array.isArray(parsed)) {
                loadedBanners = parsed;
              }
            } catch (e) {
              console.error('Error parsing ad_banners', e);
            }
          }

          // Fallback sur l'ancienne bannière unique si la liste est vide
          if (loadedBanners.length === 0 && (d.ad_banner_title || d.ad_banner_bg_image || d.ad_banner_video_url)) {
            loadedBanners = [{
              id: 'banner-legacy-1',
              enabled: d.ad_banner_enabled === 'true',
              title: d.ad_banner_title || '',
              subtitle: d.ad_banner_subtitle || '',
              ctaLabel: d.ad_banner_cta_label || 'En savoir plus',
              ctaUrl: d.ad_banner_cta_url || '#',
              videoUrl: d.ad_banner_video_url || '',
              backgroundImageUrl: d.ad_banner_bg_image || '',
            }];
          }

          if (loadedBanners.length === 0) {
            loadedBanners = [createEmptyBanner()];
          }

          setBanners(loadedBanners);
        }
      } catch {
        toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de charger la configuration.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const updateBanner = (index: number, field: keyof AdBannerItem, value: any) => {
    setBanners(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFileUpload = async (index: number, type: 'bg' | 'video', file: File) => {
    if (!file) return;
    const item = banners[index];
    if (!item) return;

    setUploadingState({ id: item.id, type });

    try {
      const res = await uploadMediaFile(file);
      if (res.success && res.data?.fileUrl) {
        const fileUrl = res.data.fileUrl;

        // Build the updated banners array from current state
        const updatedBanners = banners.map((b, i) => {
          if (i !== index) return b;
          return type === 'bg'
            ? { ...b, backgroundImageUrl: fileUrl }
            : { ...b, videoUrl: fileUrl };
        });

        // Update state immediately
        setBanners(updatedBanners);

        // Auto-save to backend with the FULL updated array
        try {
          const payload = JSON.stringify(updatedBanners);
          const first = updatedBanners[0] || createEmptyBanner();
          await updateConfig([
            { key: 'ad_banners', value: payload },
            { key: 'ad_banner_enabled', value: String(first.enabled) },
            { key: 'ad_banner_title', value: first.title },
            { key: 'ad_banner_subtitle', value: first.subtitle },
            { key: 'ad_banner_cta_label', value: first.ctaLabel },
            { key: 'ad_banner_cta_url', value: first.ctaUrl },
            { key: 'ad_banner_video_url', value: first.videoUrl },
            { key: 'ad_banner_bg_image', value: first.backgroundImageUrl },
          ]);
          await refreshConfig();
          toast.show({ variant: 'success', title: 'Média importé', message: `Fichier enregistré (${updatedBanners.length} bannière(s) synchronisées).` });
        } catch {
          toast.show({ variant: 'warning', title: 'Attention', message: 'Fichier uploadé mais la sauvegarde automatique a échoué. Cliquez sur "enregistrer".' });
        }
      } else {
        toast.show({ variant: 'error', title: 'Erreur', message: res.message || 'Téléversement échoué.' });
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Erreur lors du téléversement.' });
    } finally {
      setUploadingState(null);
    }
  };

  const handleAddBanner = () => {
    setBanners(prev => [createEmptyBanner(), ...prev]);
  };

  const handleRemoveBanner = (index: number) => {
    setBanners(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = JSON.stringify(banners);
      
      // Sauvegarder dans ad_banners et mettre à jour le premier élément en fallback legacy
      const first = banners[0] || createEmptyBanner();
      const res = await updateConfig([
        { key: 'ad_banners', value: payload },
        { key: 'ad_banner_enabled', value: String(first.enabled) },
        { key: 'ad_banner_title', value: first.title },
        { key: 'ad_banner_subtitle', value: first.subtitle },
        { key: 'ad_banner_cta_label', value: first.ctaLabel },
        { key: 'ad_banner_cta_url', value: first.ctaUrl },
        { key: 'ad_banner_video_url', value: first.videoUrl },
        { key: 'ad_banner_bg_image', value: first.backgroundImageUrl },
      ]);

      if (res.success) {
        toast.show({ variant: 'success', title: 'Enregistré', message: 'Les bannières ont été enregistrées avec succès.' });
        await refreshConfig();
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || 'Impossible de sauvegarder.' });
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" />
        <span className="text-sm font-medium">Chargement des bannières...</span>
      </div>
    );
  }

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-inner">
            <Megaphone className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Gestion des bannières</h2>
            <p className="text-xs text-neutral-400 mt-1">{banners.length} bannière(s) enregistrée(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="secondary" size="sm" icon={Plus} onClick={handleAddBanner}>
            ajouter une bannière
          </AdminButton>
          <AdminButton icon={Save} onClick={handleSave} loading={saving}>
            enregistrer
          </AdminButton>
        </div>
      </div>

      {/* Grid d'édition des bannières */}
      <div className="space-y-6">
        <AnimatePresence>
          {banners.map((item, index) => {
            const isUploadingBg = uploadingState?.id === item.id && uploadingState?.type === 'bg';
            const isUploadingVideo = uploadingState?.id === item.id && uploadingState?.type === 'video';

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                key={item.id}
                className="bg-white/[0.02] rounded-3xl p-6 space-y-6 shadow-xl relative group"
              >
                {/* Entête Carte Bannière */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-neutral-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      bannière #{banners.length - index}
                    </span>
                    <button
                      onClick={() => updateBanner(index, 'enabled', !item.enabled)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                        item.enabled
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-white/[0.04] text-neutral-400'
                      }`}
                    >
                      {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{item.enabled ? 'Active sur le site' : 'Masquée'}</span>
                    </button>
                  </div>

                  {banners.length > 1 && (
                    <button
                      onClick={() => handleRemoveBanner(index)}
                      className="text-neutral-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Supprimer cette bannière"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Champs de texte */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Titre principal</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateBanner(index, 'title', e.target.value)}
                        placeholder="Ex: Événement Spécial Partenaire"
                        className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Sous-titre / Description</label>
                      <textarea
                        rows={3}
                        value={item.subtitle}
                        onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                        placeholder="Description captivante pour les visiteurs..."
                        className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Texte du bouton (CTA)</label>
                        <input
                          type="text"
                          value={item.ctaLabel}
                          onChange={(e) => updateBanner(index, 'ctaLabel', e.target.value)}
                          placeholder="Ex: Découvrir"
                          className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Lien du bouton</label>
                        <input
                          type="text"
                          value={item.ctaUrl}
                          onChange={(e) => updateBanner(index, 'ctaUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Médias (Fond & Vidéo) */}
                  <div className="space-y-4">
                    {/* Image de fond */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Image d'arrière-plan</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.backgroundImageUrl}
                          onChange={(e) => updateBanner(index, 'backgroundImageUrl', e.target.value)}
                          placeholder="URL de l'image ou importez depuis votre PC"
                          className="flex-1 bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(index, 'bg', file);
                              e.target.value = '';
                            }}
                          />
                          <div className="h-full px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-white text-xs font-medium transition-all">
                            {isUploadingBg ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <UploadCloud className="w-4 h-4 text-neutral-400" />}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Vidéo promo */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Vidéo promotionnelle (YouTube / Fichier)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.videoUrl}
                          onChange={(e) => updateBanner(index, 'videoUrl', e.target.value)}
                          placeholder="Lien YouTube ou importez un fichier MP4/WEBM"
                          className="flex-1 bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(index, 'video', file);
                              e.target.value = '';
                            }}
                          />
                          <div className="h-full px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-white text-xs font-medium transition-all">
                            {isUploadingVideo ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <Play className="w-4 h-4 text-neutral-400" />}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AdminCard>
  );
};
