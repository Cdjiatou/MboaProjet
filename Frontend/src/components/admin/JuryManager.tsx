import { useState, useEffect, useRef } from 'react';
import { getPublicConfig, updateConfig, uploadMediaFile } from '@/services/adminService';
import { Image as ImageIcon, Plus, Trash2, Loader2, Save, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';
import { getMediaUrl } from '@/utils/mediaUrl';

export interface JuryMember {
  id: string;
  name: string;
  title: string;
  initials: string;
  image?: string;
}

const DEFAULT_JURY: JuryMember[] = [
  { id: '1', name: 'Phillbill', title: 'Producteur Musical', initials: 'PB' },
  { id: '2', name: 'Maalhox', title: 'Artiste / Rappeur', initials: 'MH' },
  { id: '3', name: 'Tzy Panchak', title: 'Artiste International', initials: 'TP' },
  { id: '4', name: 'Stanley Enow', title: 'Rappeur / Producteur', initials: 'SE' },
  { id: '5', name: 'Tony Nobody', title: 'Fondateur & Légende', initials: 'TN' },
];

export const JuryManager = () => {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [jury, setJury] = useState<JuryMember[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const refreshConfig = useRefreshSiteConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getPublicConfig();
      if (res.success && res.data && res.data.jury_members) {
        try {
          const parsed = JSON.parse(res.data.jury_members) as JuryMember[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJury(parsed);
            return;
          }
        } catch (e) {
          console.error('Erreur parsing jury_members:', e);
        }
      }
      // Fallback
      setJury(DEFAULT_JURY);
    } catch {
      setJury(DEFAULT_JURY);
      toast.show({ variant: 'warning', title: 'Erreur', message: 'Membres du jury par défaut chargés.' });
    } finally {
      setLoading(false);
    }
  };

  const updateJury = (index: number, field: keyof JuryMember, value: string) => {
    setJury((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
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
      const res = await uploadMediaFile(file);
      if (res.success && res.data?.fileUrl) {
        const newImageUrl = res.data.fileUrl;
        setJury((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], image: newImageUrl };
          return next;
        });
        toast.show({ variant: 'success', title: 'Image importée', message: 'Fichier sauvegardé avec succès.' });
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || "Impossible de téléverser l'image" });
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: "Erreur lors du téléversement du fichier." });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAddMember = () => {
    const newMember: JuryMember = {
      id: Date.now().toString(),
      name: '',
      title: '',
      initials: ''
    };
    setJury((prev) => [...prev, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    setJury((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validJury = jury.filter((j) => j.name.trim() !== '');
      const configs = [
        { key: 'jury_members', value: JSON.stringify(validJury) },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        toast.show({ variant: 'success', title: 'Enregistré', message: 'Membres du jury sauvegardés.' });
        await refreshConfig();
      } else {
        toast.show({ variant: 'error', title: 'Erreur', message: res.message || 'Impossible de sauvegarder' });
      }
    } catch (err: any) {
      toast.show({ variant: 'error', title: 'Erreur', message: err.message || 'Erreur inconnue' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" />
        <span className="text-sm font-medium">Chargement du jury...</span>
      </div>
    );
  }

  return (
    <AdminCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 border-b border-white/[0.05]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Membres du Jury
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Gérez les membres du jury visibles sur la page d'accueil.</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="secondary" onClick={handleAddMember} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </AdminButton>
          <AdminButton loading={saving} onClick={handleSave} className="flex-1 sm:flex-none">
            <Save className="w-4 h-4 mr-2" /> Enregistrer
          </AdminButton>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <AnimatePresence>
          {jury.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
            >
              {/* Logo / Image Preview */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-white/20 bg-[#050505] flex items-center justify-center overflow-hidden group/img">
                  {member.image ? (
                    <img src={getMediaUrl(member.image)} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-neutral-500">
                      {member.initials ? (
                        <span className="text-2xl font-black bg-gradient-to-br from-[#d4af37] to-[#b8952e] bg-clip-text text-transparent">{member.initials}</span>
                      ) : (
                        <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(index, e.target.files[0]);
                    }}
                  />

                  {/* Overlay Upload */}
                  <div
                    onClick={() => !uploadingIndex && fileInputRefs.current[index]?.click()}
                    className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity ${
                      uploadingIndex === index ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'
                    }`}
                  >
                    {uploadingIndex === index ? (
                      <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-white mb-1" />
                        <span className="text-[10px] text-white font-medium">Modifier</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Formulaire Membre */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Nom du membre</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateJury(index, 'name', e.target.value)}
                      placeholder="Ex: Phillbill"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Titre / Rôle</label>
                    <input
                      type="text"
                      value={member.title}
                      onChange={(e) => updateJury(index, 'title', e.target.value)}
                      placeholder="Ex: Producteur Musical"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-400">Initiales (Fallback)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={member.initials}
                      onChange={(e) => updateJury(index, 'initials', e.target.value.toUpperCase())}
                      placeholder="Ex: PB"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bouton de suppression */}
              <button
                onClick={() => handleRemoveMember(index)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Supprimer ce membre"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {jury.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <ImageIcon className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
            <p className="text-neutral-400 text-sm">Aucun membre configuré.</p>
            <AdminButton onClick={handleAddMember} variant="secondary" className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un membre
            </AdminButton>
          </div>
        )}
      </div>
    </AdminCard>
  );
};
