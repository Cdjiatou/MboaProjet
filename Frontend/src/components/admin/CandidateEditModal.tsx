import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Upload } from 'lucide-react';
import type { Candidate, Category } from '@/types';
import { getCategories, updateAdminCandidate, deleteAdminCandidate, uploadAdminCandidatePhoto } from '@/services/adminService';
import { getMediaUrl } from '@/utils/mediaUrl';
import { getApiErrorMessage } from '@/utils/apiError';
import { useToastStore } from '@/store/useToastStore';
import { useWordCount } from '@/hooks/useWordCount';
import { notifyCandidatesUpdated } from '@/hooks/usePublicCandidates';
import { AdminButton } from './AdminUI';

interface Props {
  candidate: Candidate;
  onClose: () => void;
  onSaved?: () => void;
  onSave?: () => void;
  onDeleted?: () => void;
}

const STATUSES: { value: Candidate['status']; label: string }[] = [
  { value: 'PENDING_VERIFICATION', label: 'En attente OTP' },
  { value: 'VERIFIED', label: 'Vérifié' },
  { value: 'ACTIVE', label: 'Actif (visible site)' },
  { value: 'SUSPENDED', label: 'Suspendu' },
];

export const CandidateEditModal = ({ candidate, onClose, onSaved, onSave, onDeleted }: Props) => {
  const toast = useToastStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(getMediaUrl(candidate.profilePhoto, candidate.updatedAt));

  const links = (candidate.socialLinks || {}) as Record<string, string>;

  const [form, setForm] = useState({
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    categoryId: String(candidate.categoryId || candidate.category?.id || ''),
    biography: candidate.biography || '',
    videoUrl: candidate.videoUrl || '',
    city: candidate.city || '',
    country: candidate.country || '',
    status: candidate.status,
    facebook: links.facebook || '',
    instagram: links.instagram || '',
    tiktok: links.tiktok || '',
  });

  const bioWordCount = useWordCount(form.biography);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadAdminCandidatePhoto(candidate.id, file);
      const updatedCand = res.data?.candidate;
      if (res.success && updatedCand) {
        setPhotoPreview(getMediaUrl(updatedCand.profilePhoto, updatedCand.updatedAt || Date.now()));
        notifyCandidatesUpdated();
        toast.show({ variant: 'success', title: 'Photo mise à jour', message: 'La photo a été modifiée avec succès.' });
      }
    } catch (err) {
      toast.show({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Upload impossible.') });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (bioWordCount > 300) {
      toast.show({ variant: 'error', title: 'Biographie', message: 'Maximum 300 mots.' });
      return;
    }
    setSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (form.facebook) socialLinks.facebook = form.facebook;
      if (form.instagram) socialLinks.instagram = form.instagram;
      if (form.tiktok) socialLinks.tiktok = form.tiktok;

      const res = await updateAdminCandidate(candidate.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        categoryId: Number(form.categoryId),
        biography: form.biography || undefined,
        videoUrl: form.videoUrl || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        status: form.status,
        socialLinks,
      });

      if (res.success) {
        notifyCandidatesUpdated();
        toast.show({ variant: 'success', title: 'Candidat mis à jour', message: `${form.firstName} ${form.lastName} a été enregistré(e).` });
        onSaved?.();
        onSave?.();
        onClose();
      }
    } catch (err) {
      toast.show({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Mise à jour impossible.') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer définitivement ${candidate.firstName} ${candidate.lastName} ?`)) return;
    setDeleting(true);
    try {
      const res = await deleteAdminCandidate(candidate.id);
      if (res.success) {
        notifyCandidatesUpdated();
        toast.show({ variant: 'success', title: 'Candidat supprimé', message: 'Le candidat a été retiré.' });
        onDeleted?.();
        onClose();
      }
    } catch (err) {
      toast.show({ variant: 'error', title: 'Erreur', message: getApiErrorMessage(err, 'Suppression impossible.') });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur">
          <h3 className="text-lg font-bold text-white font-heading">Modifier le candidat</h3>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-neutral-500 text-xs">Aucune photo</span>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ''; }} />
              <AdminButton variant="secondary" size="sm" icon={Upload} loading={uploading} onClick={() => fileRef.current?.click()}>
                changer la photo
              </AdminButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom" name="firstName" value={form.firstName} onChange={handleChange} />
            <Field label="Nom" name="lastName" value={form.lastName} onChange={handleChange} />
            <Field label="Adresse e-mail" name="email" type="email" value={form.email} onChange={handleChange} />
            <Field label="Numéro de téléphone" name="phone" value={form.phone} onChange={handleChange} />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Catégorie</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06]">
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0a0a0f]">{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Statut</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06]">
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0a0a0f]">{s.label}</option>
                ))}
              </select>
            </div>
            <Field label="Ville" name="city" value={form.city} onChange={handleChange} />
            <Field label="Pays" name="country" value={form.country} onChange={handleChange} />
            <Field label="URL vidéo de prestation" name="videoUrl" value={form.videoUrl} onChange={handleChange} className="sm:col-span-2" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Biographie</label>
            <textarea name="biography" value={form.biography} onChange={handleChange} rows={4} className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:bg-white/[0.06]" />
            <p className={`text-xs ${bioWordCount > 300 ? 'text-red-400' : 'text-neutral-500'}`}>{bioWordCount} / 300 mots</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <AdminButton icon={Save} onClick={handleSave} loading={saving}>enregistrer</AdminButton>
            <AdminButton variant="secondary" onClick={onClose}>annuler</AdminButton>
            <AdminButton variant="danger" icon={Trash2} onClick={handleDelete} loading={deleting} className="ml-auto">
              supprimer
            </AdminButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, type = 'text', className = '' }: {
  label: string; name: string; value: string; type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string;
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-medium text-neutral-400">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06]" />
  </div>
);
