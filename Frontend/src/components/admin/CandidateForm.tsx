import { useState, useEffect, useRef } from "react";
import { getCategories, createCandidate } from "@/services/adminService";
import type { Category } from "@/types";
import {
  UserPlus,
  Upload,
  X,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { AdminButton, AdminCard } from "./AdminUI";
import { getApiErrorMessage } from "@/utils/apiError";
import { useToastStore } from "@/store/useToastStore";
import { useWordCount } from "@/hooks/useWordCount";
import { notifyCandidatesUpdated } from "@/hooks/usePublicCandidates";
import { notifyAdminDashboardUpdated } from "@/hooks/useAdminDashboardSync";
import { PhoneInput } from "../shared/PhoneInput";

export const CandidateForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const toast = useToastStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    categoryId: "",
    biography: "",
    videoUrl: "",
    city: "",
    country: "",
    facebook: "",
    instagram: "",
    tiktok: "",
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
      toast.show({
        variant: "error",
        title: "Erreur",
        message: "Impossible de charger les catégories.",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (fullNumber: string) => {
    setFormData((prev) => ({ ...prev, phone: fullNumber }));
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.show({
        variant: "error",
        title: "Format invalide",
        message: "JPEG, PNG ou WebP uniquement.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.show({
        variant: "error",
        title: "Fichier trop volumineux",
        message: "Maximum 5 Mo.",
      });
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      categoryId: "",
      biography: "",
      videoUrl: "",
      city: "",
      country: "",
      facebook: "",
      instagram: "",
      tiktok: "",
    });
    removePhoto();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bioWordCount > 300) {
      toast.show({
        variant: "error",
        title: "Biographie trop longue",
        message: `Maximum 300 mots (actuellement ${bioWordCount}).`,
      });
      return;
    }

    setLoading(true);
    const savedName = `${formData.firstName} ${formData.lastName}`;
    const savedPhone = formData.phone;
    const categoryName =
      categories.find((c) => c.id === Number(formData.categoryId))?.name || "";

    const loadingId = toast.show({
      variant: "loading",
      title: "Inscription en cours",
      message: "Enregistrement du candidat et envoi OTP...",
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
        data.append("firstName", formData.firstName);
        data.append("lastName", formData.lastName);
        data.append("email", formData.email);
        data.append("phone", formData.phone);
        data.append("categoryId", formData.categoryId);
        data.append("biography", formData.biography);
        if (formData.videoUrl) data.append("videoUrl", formData.videoUrl);
        if (formData.city) data.append("city", formData.city);
        if (formData.country) data.append("country", formData.country);
        if (Object.keys(socialLinks).length > 0)
          data.append("socialLinks", JSON.stringify(socialLinks));
        data.append("profilePhoto", photoFile);
        res = await createCandidate(data, photoFile);
      } else {
        res = await createCandidate(
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            categoryId: Number(formData.categoryId),
            biography: formData.biography,
            videoUrl: formData.videoUrl || undefined,
            city: formData.city || undefined,
            country: formData.country || undefined,
            socialLinks:
              Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
          },
          photoFile,
        );
      }

      toast.dismiss(loadingId);

      if (res.success) {
        const meta = (
          res as { data?: { otpSent?: boolean; whatsappConnected?: boolean } }
        ).data;

        if (meta?.otpSent) {
          toast.show({
            variant: "success",
            title: "Candidat inscrit",
            message: `${savedName} inscrit en « ${categoryName} ». OTP envoyé à ${savedPhone}.`,
          });
        } else if (meta?.whatsappConnected === false) {
          toast.show({
            variant: "warning",
            title: "Candidat inscrit — WhatsApp non connecté",
            message: `${savedName} est enregistré, mais WhatsApp n'est pas connecté.`,
          });
        } else {
          toast.show({
            variant: "warning",
            title: "Candidat inscrit",
            message: `${savedName} est enregistré, mais l'envoi WhatsApp a échoué.`,
          });
        }

        resetForm();
        // Échelonner les notifications pour éviter un crash de rendu React (écran noir)
        setTimeout(() => {
          notifyCandidatesUpdated();
          notifyAdminDashboardUpdated();
          if (onSuccess) onSuccess();
        }, 100);
      } else {
        toast.show({
          variant: "error",
          title: "Échec de l'inscription",
          message:
            (res as { error?: string }).error ||
            res.message ||
            "Une erreur est survenue.",
        });
      }
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      const msg = getApiErrorMessage(
        err,
        "Impossible de contacter le serveur.",
      );
      const isDuplicate =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 409;

      toast.show({
        variant: "error",
        title: isDuplicate ? "Candidat déjà inscrit" : "Erreur serveur",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#060608]/80 backdrop-blur-md border border-[#d4af37]/20">
          <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-3" />
          <p className="text-sm font-semibold text-white">
            Inscription en cours...
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Enregistrement et vérification WhatsApp
          </p>
        </div>
      )}

      <AdminCard>
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shadow-inner">
            <UserPlus className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide font-heading">
              Ajouter un candidat
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Inscrivez un nouveau participant au concours
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Prénom *
              </label>
              <input
                required
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Nom *
              </label>
              <input
                required
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Adresse email *
              </label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Téléphone (WhatsApp) *
              </label>
              <PhoneInput
                value={formData.phone}
                onChange={handlePhoneChange}
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                Numéro camerounais (ex: 691234567). L'indicatif +237 sera ajouté
                automatiquement.
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-medium text-neutral-400">
                Catégorie *
              </label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all cursor-pointer"
              >
                <option value="" className="bg-[#0a0a0f] text-neutral-400">
                  Sélectionner une catégorie...
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className="bg-[#0a0a0f] text-white"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Ville
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Pays
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-medium text-neutral-400">
                Biographie
              </label>
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleChange}
                rows={4}
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all resize-none"
              />
              <p
                className={`text-xs ${bioWordCount > 300 ? "text-red-400 font-medium" : "text-neutral-500"}`}
              >
                {bioWordCount} / 300 mots
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-medium text-neutral-400">
                Photo de profil
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer ${
                  isDragging
                    ? "border-[#d4af37] bg-[#d4af37]/10"
                    : "border-white/10 hover:border-[#d4af37]/40 bg-[#0b0b10]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {photoPreview ? (
                  <div className="relative text-center">
                    <img
                      src={photoPreview}
                      alt="Prévisualisation"
                      className="w-32 h-32 object-cover rounded-2xl mx-auto shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto();
                      }}
                      className="absolute top-0 right-1/2 translate-x-[4.5rem] w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <p className="mt-3 text-xs text-neutral-400">
                      {photoFile?.name} ({(photoFile!.size / 1024).toFixed(0)}{" "}
                      Ko)
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      {isDragging ? (
                        <Upload className="w-6 h-6 text-[#d4af37]" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-white mb-1">
                      {isDragging
                        ? "Déposer l'image ici"
                        : "Cliquez ou glissez-déposez une photo"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      JPEG, PNG ou WebP — max 5 Mo
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                URL vidéo de prestation
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Lien Facebook
              </label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Lien Instagram
              </label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                Lien TikTok
              </label>
              <input
                type="url"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                placeholder="https://tiktok.com/@..."
                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <AdminButton
              type="submit"
              icon={Save}
              loading={loading}
              disabled={bioWordCount > 300 || loading}
            >
              Enregistrer le candidat
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              icon={RotateCcw}
              onClick={resetForm}
            >
              Réinitialiser
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </div>
  );
};
