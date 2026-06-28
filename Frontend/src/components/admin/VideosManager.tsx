import { useState, useEffect } from 'react';
import { getPublicConfig, updateConfig } from '@/services/adminService';
import { Video as VideoIcon, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton } from './AdminUI';

export const VideosManager = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [videos, setVideos] = useState<{title: string, url: string}[]>([]);
  const refreshConfig = useRefreshSiteConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getPublicConfig();
      if (res.success && res.data) {
        if (res.data.videos) {
          try { setVideos(JSON.parse(res.data.videos)); } catch(e) { console.error(e); }
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
        { key: 'videos', value: JSON.stringify(videos.filter(v => v.url.trim() !== '')) },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        setMessage('✅ Vidéos sauvegardées avec succès !');
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
          <VideoIcon className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold text-white">Gestion des Vidéos</h2>
        </div>
        <AdminButton icon={Save} onClick={handleSave} loading={saving}>
          Enregistrer
        </AdminButton>
      </div>

      <p className="text-neutral-400 text-sm mb-6">
        Ajoutez les URLs YouTube (ou MP4) des vidéos qui s'afficheront dans la bannière du footer.
      </p>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {videos.map((v, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={index} 
            className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white/[0.03] p-4 rounded-xl border border-white/[0.06]"
          >
            <div className="flex-1 w-full flex flex-col gap-3">
              <input 
                type="text" 
                value={v.title} 
                onChange={(e) => {
                  const nv = [...videos];
                  nv[index].title = e.target.value;
                  setVideos(nv);
                }} 
                placeholder="Titre de la vidéo" 
                className="w-full bg-[#0b0b0b] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" 
              />
              <input 
                type="text" 
                value={v.url} 
                onChange={(e) => {
                  const nv = [...videos];
                  nv[index].url = e.target.value;
                  setVideos(nv);
                }} 
                placeholder="URL YouTube (https://...)" 
                className="w-full bg-[#0b0b0b] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" 
              />
            </div>
            <button onClick={() => setVideos(videos.filter((_, i) => i !== index))} className="p-3 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors h-full flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </button>
          </motion.div>
        ))}

        <button 
          onClick={() => setVideos([...videos, { title: '', url: '' }])}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/[0.06] text-neutral-400 hover:text-white hover:border-[#d4af37] hover:bg-[#d4af37]/5 transition-all rounded-xl font-bold"
        >
          <Plus className="w-5 h-5" /> Ajouter une Vidéo
        </button>
      </div>
    </div>
  );
};
