import { useState, useEffect } from 'react';
import { getPublicConfig, updateConfig, uploadMediaFile } from '@/services/adminService';
import { LayoutTemplate, Plus, Trash2, Loader2, Save, Link as LinkIcon, UploadCloud, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';
import { getMediaUrl } from '@/utils/mediaUrl';

export const CarouselManager = () => {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [modes, setModes] = useState<Record<number, 'link' | 'upload'>>({});
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});

  const refreshConfig = useRefreshSiteConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getPublicConfig();
      if (res.success && res.data) {
        let configImages: string[] = [];
        if (res.data.hero_images) {
          try { 
            configImages = JSON.parse(res.data.hero_images) as string[];
          } catch(e) { 
            console.error('Erreur parsing hero_images:', e); 
          }
        }

        if (configImages.length === 0) {
          configImages = [
            "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/e4c4da7ff_WhatsAppImage2026-06-24at122312.jpg",
            "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/ef6237930_WhatsAppImage2026-06-24at122313.jpg",
            "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/65bd1e076_WhatsAppImage2026-06-24at122314.jpeg",
            "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/cca43cfe1_WhatsAppImage2026-06-24at122315.jpg",
            "https://media.base44.com/images/public/user_6a3c07aa9ffa3b12fd326efb/9f593dbde_WhatsAppImage2026-06-24at122316.jpg",
          ];
        }
        
        setHeroImages(configImages);
        
        const initialModes: Record<number, 'link' | 'upload'> = {};
        configImages.forEach((img, idx) => {
          initialModes[idx] = (img.includes('/uploads/') || img.includes('cloudinary.com')) ? 'upload' : 'link';
        });
        setModes(initialModes);
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de charger les images du carrousel.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validImages = heroImages.filter(img => img.trim() !== '');
      const configs = [
        { key: 'hero_images', value: JSON.stringify(validImages) },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        toast.show({ variant: 'success', title: 'Enregistré', message: 'Images du carrousel sauvegardées.' });
        await refreshConfig();
      } else {
        toast.show({ variant: 'error', title: 'Erreur', message: res.message || 'Impossible de sauvegarder' });
      }
    } catch (err: any) {
      toast.show({ variant: 'error', title: 'Erreur', message: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [index]: true }));
    setProgress(prev => ({ ...prev, [index]: 0 }));
    try {
      const res = await uploadMediaFile(file, (percent) => {
        setProgress(prev => ({ ...prev, [index]: percent }));
      });
      if (res.success && res.data?.fileUrl) {
        const newImages = [...heroImages];
        newImages[index] = res.data.fileUrl;
        setHeroImages(newImages);
        toast.show({ variant: 'success', title: 'Image importée', message: 'Fichier sauvegardé avec succès.' });
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || "Impossible de téléverser l'image" });
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: "Erreur lors du téléversement du fichier." });
    } finally {
      setUploading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleAddImage = () => {
    setHeroImages(prev => [...prev, '']);
    setModes(prev => ({ ...prev, [heroImages.length]: 'link' }));
  };

  const handleRemoveImage = (index: number) => {
    const newImages = heroImages.filter((_, idx) => idx !== index);
    setHeroImages(newImages);
  };

  const handleModeChange = (index: number, mode: 'link' | 'upload') => {
    setModes(prev => ({ ...prev, [index]: mode }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" />
        <span className="text-sm font-medium">Chargement du carrousel...</span>
      </div>
    );
  }

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-inner">
            <LayoutTemplate className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Carrousel d'accueil (Hero)</h2>
            <p className="text-xs text-neutral-400 mt-1">{heroImages.length} image(s) configurée(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="secondary" size="sm" icon={Plus} onClick={handleAddImage}>
            ajouter une diapositive
          </AdminButton>
          <AdminButton icon={Save} onClick={handleSave} loading={saving}>
            enregistrer
          </AdminButton>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {heroImages.map((imageUrl, index) => {
            const currentMode = modes[index] || ((imageUrl.includes('/uploads/') || imageUrl.includes('cloudinary.com')) ? 'upload' : 'link');
            const isUploading = uploading[index];
            const uploadPercent = progress[index] || 0;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                key={index}
                className="bg-white/[0.02] rounded-3xl p-6 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-neutral-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      diapositive #{index + 1}
                    </span>
                  </div>
                  {heroImages.length > 1 && (
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="text-neutral-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Supprimer cette diapositive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Aperçu */}
                  <div className="w-full md:w-48 h-32 rounded-xl bg-black/40 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
                    {imageUrl ? (
                      <img
                        src={getMediaUrl(imageUrl)}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-center p-4 text-neutral-600">
                        <LayoutTemplate className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px] uppercase font-semibold">Aucune image</span>
                      </div>
                    )}
                  </div>

                  {/* Contrôles d'édition */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <button
                        type="button"
                        onClick={() => handleModeChange(index, 'link')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                          currentMode === 'link'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-neutral-400 border border-transparent hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Lien externe
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange(index, 'upload')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                          currentMode === 'upload'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-neutral-400 border border-transparent hover:text-white'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Téléverser depuis le PC
                      </button>
                    </div>

                    {currentMode === 'link' ? (
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => {
                          const newImages = [...heroImages];
                          newImages[index] = e.target.value;
                          setHeroImages(newImages);
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                      />
                    ) : (
                      <div className="space-y-3">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(index, file);
                            }}
                          />
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2 py-2">
                              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                              <span className="text-xs text-neutral-400">{uploadPercent}% téléversé...</span>
                              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#d4af37] transition-all duration-300" style={{ width: `${uploadPercent}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 py-2 text-neutral-400 hover:text-white">
                              <UploadCloud className="w-6 h-6 text-neutral-400" />
                              <span className="text-xs text-neutral-400 font-medium">Cliquez ou glissez une image (JPG, PNG, WebP)</span>
                            </div>
                          )}
                        </label>
                        {imageUrl && (imageUrl.includes('/uploads/') || imageUrl.includes('cloudinary.com')) && (
                          <p className="text-xs text-emerald-400 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis" title={imageUrl}>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Fichier enregistré : <span className="truncate">{imageUrl}</span>
                          </p>
                        )}
                      </div>
                    )}
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
