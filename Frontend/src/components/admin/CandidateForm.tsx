import { useState, useEffect, useRef } from 'react';
import { getCategories, createCandidate } from '@/services/adminService';
import type { Category } from '@/types';
import { UserPlus, Upload, X, Image as ImageIcon, Save, RotateCcw, Loader2 } from 'lucide-react';
import { AdminButton } from './AdminUI';
import { getApiErrorMessage } from '@/utils/apiError';
import { useToastStore } from '@/store/useToastStore';
import { useWordCount } from '@/hooks/useWordCount';
import { notifyCandidatesUpdated } from '@/hooks/usePublicCandidates';
import { notifyAdminDashboardUpdated } from '@/hooks/useAdminDashboardSync';

export const CandidateForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const toast = useToastStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    categoryId: '',
    biography: '',
    videoUrl: '',
    city: '',
    country: '',
    facebook: '',
    instagram: '',
    tiktok: '',
  });

  const bioWordCount = useWordCount(formData.biography);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de charger les catégories.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.show({ variant: 'error', title: 'Format invalide', message: 'JPEG, PNG ou WebP uniquement.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.show({ variant: 'error', title: 'Fichier trop volumineux', message: 'Maximum 5 Mo.' });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', categoryId: '',
      biography: '', videoUrl: '', city: '', country: '',
      facebook: '', instagram: '', tiktok: '',
    });
    removePhoto();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bioWordCount > 300) {
      toast.show({ variant: 'error', title: 'Biographie trop longue', message: `Maximum 300 mots (actuellement ${bioWordCount}).` });
      return;
    }

    setLoading(true);
    const savedName = `${formData.firstName} ${formData.lastName}`;
    const savedPhone = formData.phone;
    const categoryName = categories.find((c) => c.id === Number(formData.categoryId))?.name || '';

    const loadingId = toast.show({
      variant: 'loading',
      title: 'Inscription en cours',
      message: 'Enregistrement du candidat et envoi du code OTP via WhatsApp...',
      duration: 0,
    });

    try {
      const socialLinks: Record<string, string> = {};
      if (formData.facebook) socialLinks.facebook = formData.facebook;
      if (formData.instagram) socialLinks.instagram = formData.instagram;
      if (formData.tiktok) socialLinks.tiktok = formData.tiktok;

      let res;

      if (photoFile) {
        const data = new FormData();
        data.append('firstName', formData.firstName);
        data.append('lastName', formData.lastName);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('categoryId', formData.categoryId);
        data.append('biography', formData.biography);
        if (formData.videoUrl) data.append('videoUrl', formData.videoUrl);
        if (formData.city) data.append('city', formData.city);
        if (formData.country) data.append('country', formData.country);
        if (Object.keys(socialLinks).length > 0) data.append('socialLinks', JSON.stringify(socialLinks));
        data.append('profilePhoto', photoFile);
        res = await createCandidate(data, photoFile);
      } else {
        res = await createCandidate({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          categoryId: Number(formData.categoryId),
          biography: formData.biography,
          videoUrl: formData.videoUrl || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        }, photoFile);
      }

      toast.dismiss(loadingId);

      if (res.success) {
        const meta = (res as { data?: { otpSent?: boolean; whatsappConnected?: boolean } }).data;

        if (meta?.otpSent) {
          toast.show({
            variant: 'success',
            title: 'Candidat inscrit — OTP envoyé',
            message: `${savedName} est inscrit(e) en « ${categoryName} ». Le code de vérification a été envoyé par WhatsApp au ${savedPhone}.`,
            duration: 8000,
          });
        } else if (meta?.whatsappConnected === false) {
          toast.show({
            variant: 'warning',
            title: 'Candidat inscrit — OTP non envoyé',
            message: `${savedName} est enregistré(e), mais WhatsApp n'est pas connecté. Allez dans l'onglet WhatsApp du panel admin pour scanner le QR code, puis renvoyez l'OTP.`,
            duration: 10000,
          });
        } else {
          toast.show({
            variant: 'warning',
            title: 'Candidat inscrit — échec WhatsApp',
            message: `${savedName} est enregistré(e), mais le message WhatsApp n'a pas pu être délivré. Vérifiez que le numéro ${savedPhone} est actif sur WhatsApp.`,
            duration: 10000,
          });
        }

        resetForm();
        notifyCandidatesUpdated();
        notifyAdminDashboardUpdated();
        if (onSuccess) onSuccess();
      } else {
        toast.show({
          variant: 'error',
          title: 'Échec de l\'inscription',
          message: (res as { error?: string }).error || res.message || 'Une erreur est survenue.',
        });
      }
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      const msg = getApiErrorMessage(err, 'Impossible de contacter le serveur.');
      const isDuplicate = err && typeof err === 'object' && 'response' in err
        && (err as { response?: { status?: number } }).response?.status === 409;

      toast.show({
        variant: 'error',
        title: isDuplicate ? 'Candidat déjà inscrit' : 'Erreur serveur',
        message: msg,
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#060608]/80 backdrop-blur-sm border border-[#d4af37]/20">
          <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-3" />
          <p className="text-sm font-semibold text-white">Inscription en cours...</p>
          <p className="text-xs text-neutral-400 mt-1">Enregistrement et envoi OTP via WhatsApp</p>
        </div>
      )}

      <div className="bg-[#0a0a0f]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[#d4af37]/10">
          <UserPlus className="w-5 h-5 text-[#d4af37]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Ajouter un candidat</h2>
          <p className="text-xs text-neutral-500">Inscrivez un nouveau participant au concours</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Prénom *</label>
            <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Nom *</label>
            <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Téléphone (WhatsApp) *</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+237 6XX XXX XXX" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Catégorie *</label>
            <select required name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full bg-[#0a0a0f] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 transition-all cursor-pointer">
              <option value="" className="bg-[#0a0a0f] text-neutral-400">Sélectionner une catégorie...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#0a0a0f] text-white">{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ville</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pays</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Biographie</label>
            <textarea name="biography" value={formData.biography} onChange={handleChange} rows={4} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all resize-none" />
            <p className={`text-xs ${bioWordCount > 300 ? 'text-red-400' : 'text-neutral-600'}`}>
              {bioWordCount} / 300 mots
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Photo de profil</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer ${
                isDragging ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/[0.06] hover:border-white/20 bg-white/[0.03]'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Prévisualisation" className="w-32 h-32 object-cover rounded-xl mx-auto" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(); }} className="absolute top-0 right-1/2 translate-x-[4.5rem] w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <p className="text-center mt-3 text-xs text-neutral-400">{photoFile?.name} ({(photoFile!.size / 1024).toFixed(0)} Ko)</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    {isDragging ? <Upload className="w-7 h-7 text-[#d4af37]" /> : <ImageIcon className="w-7 h-7 text-neutral-400" />}
                  </div>
                  <p className="text-sm text-neutral-300 mb-1">{isDragging ? 'Déposer l\'image ici' : 'Cliquer ou glisser-déposer'}</p>
                  <p className="text-xs text-neutral-500">JPEG, PNG ou WebP — max 5 Mo</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">URL vidéo</label>
            <input type="url" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="https://youtube.com/..." className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Facebook</label>
            <input type="url" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Instagram</label>
            <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">TikTok</label>
            <input type="url" name="tiktok" value={formData.tiktok} onChange={handleChange} placeholder="https://tiktok.com/@..." className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <AdminButton type="submit" icon={Save} loading={loading}>
            Enregistrer
          </AdminButton>
          <AdminButton type="button" variant="secondary" icon={RotateCcw} onClick={resetForm} className="normal-case tracking-normal">
            Réinitialiser
          </AdminButton>
        </div>
      </form>
      </div>
    </div>
  );
};
