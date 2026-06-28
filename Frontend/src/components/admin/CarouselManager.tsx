import { useState, useEffect } from 'react';
import { getPublicConfig, updateConfig } from '@/services/adminService';
import { LayoutTemplate, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton } from './AdminUI';

export const CarouselManager = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const refreshConfig = useRefreshSiteConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getPublicConfig();
      if (res.success && res.data) {
        if (res.data.hero_images) {
          try { setHeroImages(JSON.parse(res.data.hero_images)); } catch(e) { console.error(e); }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const configs = [
        { key: 'hero_images', value: JSON.stringify(heroImages.filter(img => img.trim() !== '')) },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        setMessage('✅ Images du Carousel sauvegardées avec succès !');
        await refreshConfig();
      } else {
        setMessage('❌ Erreur : ' + (res.message || 'Impossible de sauvegarder'));
      }
    } catch (err: any) {
      setMessage('❌ Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-neutral-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" /> Chargement...</div>;
  }

  return (
    <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold text-white">Gestion du Carousel</h2>
        </div>
        <AdminButton icon={Save} onClick={handleSave} loading={saving}>
          Enregistrer
        </AdminButton>
      </div>

      <p className="text-neutral-400 text-sm mb-6">
        Ajoutez les URLs des images qui s'afficheront en arrière-plan (Carousel) sur la page d'accueil.
      </p>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {heroImages.map((url, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={index} 
            className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white/[0.03] p-4 rounded-xl border border-white/[0.06]"
          >
            <div className="w-full sm:w-24 h-16 rounded-lg bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
              {url ? <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x60/1a1a1a/666666?text=Image+Invalide')} /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Aperçu</div>}
            </div>
            
            <div className="flex-1 w-full flex items-center gap-4">
              <span className="text-[#d4af37] font-bold text-sm w-6">{index + 1}</span>
              <input 
                type="text" 
                value={url} 
                onChange={(e) => {
                  const newImages = [...heroImages];
                  newImages[index] = e.target.value;
                  setHeroImages(newImages);
                }} 
                placeholder="URL Image (https://...)" 
                className="flex-1 bg-[#0b0b0b] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" 
              />
              <button onClick={() => setHeroImages(heroImages.filter((_, i) => i !== index))} className="p-3 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        <button 
          onClick={() => setHeroImages([...heroImages, ''])}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/[0.06] text-neutral-400 hover:text-white hover:border-[#d4af37] hover:bg-[#d4af37]/5 transition-all rounded-xl font-bold"
        >
          <Plus className="w-5 h-5" /> Ajouter une Image
        </button>
      </div>
    </div>
  );
};
