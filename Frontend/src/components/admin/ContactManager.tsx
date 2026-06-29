import { useState, useEffect } from 'react';
import { getPublicConfig, updateConfig } from '@/services/adminService';
import { PhoneCall, Loader2, Save } from 'lucide-react';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';

export const ContactManager = () => {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [whatsappName, setWhatsappName] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [facebookName, setFacebookName] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramName, setInstagramName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeName, setYoutubeName] = useState('');
  const refreshConfig = useRefreshSiteConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getPublicConfig();
      if (res.success && res.data) {
        const d = res.data;
        if (d.contact_address) setContactAddress(d.contact_address);
        if (d.contact_phone) setContactPhone(d.contact_phone);
        if (d.contact_email) setContactEmail(d.contact_email);
        
        if (d.whatsapp_url) setWhatsappUrl(d.whatsapp_url);
        if (d.whatsapp_name) setWhatsappName(d.whatsapp_name);
        
        if (d.facebook_url) setFacebookUrl(d.facebook_url);
        if (d.facebook_name) setFacebookName(d.facebook_name);
        
        if (d.instagram_url) setInstagramUrl(d.instagram_url);
        if (d.instagram_name) setInstagramName(d.instagram_name);
        
        if (d.youtube_channel) setYoutubeUrl(d.youtube_channel);
        if (d.youtube_name) setYoutubeName(d.youtube_name);
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de charger les contacts.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configs = [
        { key: 'contact_address', value: contactAddress },
        { key: 'contact_phone', value: contactPhone },
        { key: 'contact_email', value: contactEmail },
        
        { key: 'whatsapp_url', value: whatsappUrl },
        { key: 'whatsapp_name', value: whatsappName },
        
        { key: 'facebook_url', value: facebookUrl },
        { key: 'facebook_name', value: facebookName },
        
        { key: 'instagram_url', value: instagramUrl },
        { key: 'instagram_name', value: instagramName },
        
        { key: 'youtube_channel', value: youtubeUrl },
        { key: 'youtube_name', value: youtubeName },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        toast.show({ variant: 'success', title: 'Enregistré', message: 'Coordonnées de contact mises à jour.' });
        await refreshConfig();
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || 'Impossible de sauvegarder' });
      }
    } catch (err: any) {
      toast.show({ variant: 'error', title: 'Erreur', message: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" />
        <span className="text-sm font-medium">Chargement des coordonnées...</span>
      </div>
    );
  }

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shadow-inner">
            <PhoneCall className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">Coordonnées de contact</h2>
            <p className="text-xs text-neutral-400 mt-1">Informations publiques affichées dans le pied de page</p>
          </div>
        </div>
        <AdminButton icon={Save} onClick={handleSave} loading={saving}>
          Enregistrer
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-400">Numéro de téléphone</label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Ex: +237 6XX XX XX XX"
            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-400">Adresse e-mail</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@mboanextstar.com"
            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-neutral-400">Adresse physique</label>
          <textarea
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            rows={3}
            placeholder="Douala, Cameroun..."
            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all resize-none"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-neutral-400">WhatsApp officiel</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={whatsappName}
              onChange={(e) => setWhatsappName(e.target.value)}
              placeholder="Nom d'affichage (ex: +237 6XX...)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
            <input
              type="url"
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              placeholder="URL (ex: https://wa.me/...)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-neutral-400">Facebook</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={facebookName}
              onChange={(e) => setFacebookName(e.target.value)}
              placeholder="Nom d'affichage (ex: Mood & Com)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="URL (ex: https://facebook.com/...)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-neutral-400">Instagram</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={instagramName}
              onChange={(e) => setInstagramName(e.target.value)}
              placeholder="Nom d'affichage (ex: @mboanextstar)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="URL (ex: https://instagram.com/...)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-neutral-400">YouTube (Chaîne officielle)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={youtubeName}
              onChange={(e) => setYoutubeName(e.target.value)}
              placeholder="Nom d'affichage (ex: Mboa Next Star)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="URL (ex: https://youtube.com/@mboanextstar237)"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
        </div>
      </div>
    </AdminCard>
  );
};
