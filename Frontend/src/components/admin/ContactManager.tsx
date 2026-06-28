import { useState, useEffect } from 'react';
import { getPublicConfig, updateConfig } from '@/services/adminService';
import { PhoneCall, Loader2, Save } from 'lucide-react';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton } from './AdminUI';

export const ContactManager = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
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
        if (d.facebook_url) setFacebookUrl(d.facebook_url);
        if (d.instagram_url) setInstagramUrl(d.instagram_url);
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
        { key: 'contact_address', value: contactAddress },
        { key: 'contact_phone', value: contactPhone },
        { key: 'contact_email', value: contactEmail },
        { key: 'whatsapp_url', value: whatsappUrl },
        { key: 'facebook_url', value: facebookUrl },
        { key: 'instagram_url', value: instagramUrl },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        setMessage('✅ Contacts sauvegardés avec succès !');
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
          <PhoneCall className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-xl font-bold text-white">Gestion des Contacts</h2>
        </div>
        <AdminButton icon={Save} onClick={handleSave} loading={saving}>
          Enregistrer
        </AdminButton>
      </div>

      <p className="text-neutral-400 text-sm mb-6">
        Modifiez les informations de contact affichées dans le pied de page du site.
      </p>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Téléphone</label>
          <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email</label>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Adresse Physique (\n pour saut de ligne)</label>
          <textarea value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} rows={3} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] resize-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">URL Lien WhatsApp</label>
          <input type="url" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lien Facebook</label>
          <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lien Instagram</label>
          <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full md:w-1/2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
        </div>
      </div>
    </div>
  );
};
