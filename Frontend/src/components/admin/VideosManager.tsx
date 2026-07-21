import { useState, useEffect } from 'react';
import { getPublicConfig, updateConfig, uploadMediaFile } from '@/services/adminService';
import { Video as VideoIcon, Plus, Trash2, Loader2, Save, Link as LinkIcon, UploadCloud, CheckCircle2, ExternalLink, Play, AlertCircle, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRefreshSiteConfig } from '@/hooks/useRefreshSiteConfig';
import { AdminButton, AdminCard } from './AdminUI';
import { useToastStore } from '@/store/useToastStore';
import ReactPlayer from 'react-player';
import { TikTokEmbed, InstagramEmbed, FacebookEmbed } from 'react-social-media-embed';

/* ─── Helpers de détection de plateforme ─── */
const isTikTokUrl = (url: string) => /tiktok\.com/.test(url);
const isInstagramUrl = (url: string) => /instagram\.com/.test(url);
const isFacebookUrl = (url: string) => url.includes('facebook.com') || url.includes('fb.watch');

const getUploadedFileUrl = (url: string) =>
  url.startsWith('/uploads/')
    ? `${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')}${url}`
    : url;

/**
 * Composant unique qui choisit le bon lecteur/embed selon l'URL fournie.
 * - TikTok / Instagram / Facebook -> react-social-media-embed
 * - YouTube / Vimeo / MP4 uploadé -> ReactPlayer
 */
const VideoPreview = ({ url }: { url: string }) => {
  if (isTikTokUrl(url)) {
    const hasVideoId = /\/video\/\d+/.test(url);
    if (!hasVideoId) {
      return (
        <div className="flex items-center justify-center h-full p-4 text-center">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Lien TikTok non supporté : utilisez le lien complet (format .../@compte/video/1234567890), pas un lien court.
          </p>
        </div>
      );
    }
    return (
      <div className="w-full h-full overflow-y-auto flex justify-center bg-black">
        <TikTokEmbed url={url} width="100%" />
      </div>
    );
  }

  if (isInstagramUrl(url)) {
    return (
      <div className="w-full h-full overflow-y-auto flex justify-center bg-black">
        <InstagramEmbed url={url} width="100%" />
      </div>
    );
  }

  if (isFacebookUrl(url)) {
    return (
      <div className="w-full h-full flex justify-center bg-black">
        <FacebookEmbed url={url} width="100%" />
      </div>
    );
  }

  // YouTube, Vimeo, fichiers MP4 uploadés, etc.
  return (
    <ReactPlayer
      {...({
        src: getUploadedFileUrl(url),
        width: '100%',
        height: '100%',
        controls: true,
        config: {
          youtube: {
            playerVars: { rel: 0, modestbranding: 1 },
          },
        },
      } as any)}
    />
  );
};

export const VideosManager = () => {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [videos, setVideos] = useState<{id: string, title: string, url: string}[]>([]);
  const [initialVideos, setInitialVideos] = useState<{id: string, title: string, url: string}[]>([]);
  const [modes, setModes] = useState<Record<string, 'link' | 'upload'>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

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
          try {
            const list = JSON.parse(res.data.videos) as {title: string, url: string}[];
            const listWithIds = list.map(v => ({ ...v, id: Math.random().toString(36).substr(2, 9) }));
            setVideos(listWithIds);
            setInitialVideos(JSON.parse(JSON.stringify(listWithIds)));
            const initialModes: Record<string, 'link' | 'upload'> = {};
            listWithIds.forEach((v) => {
              initialModes[v.id] = (v.url.includes('/uploads/') || v.url.includes('cloudinary.com')) ? 'upload' : 'link';
            });
            setModes(initialModes);
          } catch(e) {
            console.error('[VideosManager] Erreur parsing videos:', e);
          }
        } else {
          setVideos([]);
          setInitialVideos([]);
        }
      }
    } catch {
      toast.show({ variant: 'error', title: 'Erreur', message: 'Impossible de charger la liste des vidéos.' });
    } finally {
      setLoading(false);
    }
  };

  const isDirty = (() => {
    if (videos.length !== initialVideos.length) return true;
    for (let i = 0; i < videos.length; i++) {
      if (videos[i].title !== initialVideos[i].title || videos[i].url !== initialVideos[i].url) {
        return true;
      }
    }
    return false;
  })();

  const handleSave = async (videosToSave?: {id: string, title: string, url: string}[]) => {
    const list = videosToSave || videos;
    const missingFields = list.some(v => !v.title || v.title.trim() === '' || !v.url || v.url.trim() === '');

    if (missingFields && !videosToSave) {
      toast.show({ variant: 'error', title: 'Action requise', message: 'Veuillez saisir un titre et un lien pour CHAQUE vidéo de la liste avant de sauvegarder.' });
      return;
    }

    const validVideos = list.filter(v => v.title && v.title.trim() !== '' && v.url && v.url.trim() !== '');

    if (validVideos.length === 0 && list.length > 0) {
      if (!videosToSave) {
        toast.show({ variant: 'error', title: 'Action requise', message: 'Veuillez saisir un titre et un lien pour chaque vidéo avant de sauvegarder.' });
      }
      return;
    }

    setSaving(true);
    try {
      // Retirer l'ID interne avant d'enregistrer en BDD
      const dbPayload = validVideos.map(({ title, url }) => ({ title, url }));
      const configs = [
        { key: 'videos', value: JSON.stringify(dbPayload) },
      ];
      const res = await updateConfig(configs);
      if (res.success) {
        if (!videosToSave) {
          toast.show({ variant: 'success', title: 'Enregistré', message: `${validVideos.length} vidéo(s) enregistrée(s) avec succès.` });
        }
        setInitialVideos(JSON.parse(JSON.stringify(list)));
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

  const handleFileUpload = async (id: string, file: File) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [id]: true }));
    setProgress(prev => ({ ...prev, [id]: 0 }));
    try {
      const res = await uploadMediaFile(file, (percent) => {
        setProgress(prev => ({ ...prev, [id]: percent }));
      });

      console.log('[VideosManager] Upload response:', JSON.stringify(res));

      // Extraire l'URL du fichier — le backend peut renvoyer la donnée dans différentes structures
      const fileUrl = res.data?.fileUrl || (res as any).fileUrl || (res as any).url || '';

      if (res.success && fileUrl) {
        setVideos(prev => {
          const updatedVideos = prev.map(v => v.id === id ? { ...v, url: fileUrl } : v);

          // Auto-save uniquement si toutes les vidéos ont un titre ET un URL
          const allComplete = updatedVideos.every(v => v.title.trim() !== '' && v.url.trim() !== '');
          if (allComplete) {
            setTimeout(() => handleSave(updatedVideos), 200);
          }

          return updatedVideos;
        });

        toast.show({ variant: 'success', title: 'Vidéo importée', message: 'Fichier vidéo téléversé avec succès.' });
      } else if (res.success && !fileUrl) {
        // Le backend a confirmé le succès mais n'a pas retourné l'URL — cas rare
        console.warn('[VideosManager] Upload réussi côté serveur mais URL manquante dans la réponse:', res);
        toast.show({ variant: 'warning', title: 'Upload partiel', message: 'La vidéo a été téléversée mais l\'URL n\'a pas été retournée. Veuillez réessayer.' });
      } else {
        toast.show({ variant: 'error', title: 'Échec', message: res.message || 'Téléversement échoué' });
      }
    } catch (err: any) {
      console.error('[VideosManager] Upload error:', err);
      toast.show({ variant: 'error', title: 'Erreur', message: err?.response?.data?.message || err?.message || 'Erreur lors du téléversement de la vidéo.' });
    } finally {
      setUploading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleAddVideo = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setVideos(prev => [{ id: newId, title: '', url: '' }, ...prev]);
    setModes(prev => ({ ...prev, [newId]: 'link' }));
  };

  const handleRemoveVideo = (id: string) => {
    const video = videos.find(v => v.id === id);
    const title = video?.title || 'cette vidéo';
    if (!window.confirm(`Voulez-vous vraiment supprimer "${title}" ?`)) return;
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleModeChange = (id: string, mode: 'link' | 'upload') => {
    setModes(prev => ({ ...prev, [id]: mode }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setVideos(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === videos.length - 1) return;
    setVideos(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#d4af37]" />
        <span className="text-sm font-medium">Chargement des vidéos...</span>
      </div>
    );
  }

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-inner">
            <VideoIcon className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide font-heading">Vidéos promotionnelles (MBOA TV)</h2>
              {isDirty && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider animate-pulse select-none shrink-0">
                  <AlertTriangle className="w-3 h-3" /> Modifications non enregistrées
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1">{videos.length} vidéo(s) configurée(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="secondary" size="sm" icon={Plus} onClick={handleAddVideo}>
            ajouter une vidéo
          </AdminButton>
          <AdminButton
            icon={Save}
            onClick={() => handleSave()}
            loading={saving}
            className={isDirty ? 'ring-2 ring-amber-500/80 ring-offset-2 ring-offset-black' : ''}
          >
            enregistrer
          </AdminButton>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {videos.map((video, index) => {
            const currentMode = modes[video.id] || ((video.url.includes('/uploads/') || video.url.includes('cloudinary.com')) ? 'upload' : 'link');
            const isUploading = uploading[video.id];
            const uploadPercent = progress[video.id] || 0;
            const initialVideo = initialVideos.find(v => v.id === video.id);
            const isVideoModified = !initialVideo || initialVideo.title !== video.title || initialVideo.url !== video.url;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                key={video.id}
                className={`bg-white/[0.02] rounded-3xl p-6 space-y-4 shadow-xl border transition-all duration-300 ${
                  isVideoModified
                    ? 'border-[#d4af37]/20 bg-[#d4af37]/[0.01]'
                    : 'border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-neutral-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      vidéo #{videos.length - index}
                    </span>
                    {isVideoModified && (
                      <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md animate-pulse">
                        {initialVideo ? 'Modifiée' : 'Nouvelle'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="text-neutral-500 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      title="Monter"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === videos.length - 1}
                      className="text-neutral-500 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      title="Descendre"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(video.id)}
                      className="text-neutral-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors ml-1"
                      title="Supprimer cette vidéo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Titre de la prestation / promo</label>
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => {
                        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, title: e.target.value } : v));
                      }}
                      placeholder="Ex: Prestation Époustouflante de Dorine Sike"
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <button
                        type="button"
                        onClick={() => handleModeChange(video.id, 'link')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                          currentMode === 'link'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-neutral-400 border border-transparent hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Lien YouTube / TikTok / Instagram / Facebook
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange(video.id, 'upload')}
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
                      <LinkInput
                        url={video.url}
                        onUrlChange={(newUrl) => {
                          setVideos(prev => prev.map(v => v.id === video.id ? { ...v, url: newUrl } : v));
                        }}
                      />
                    ) : (
                      <div className="space-y-3">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(video.id, file);
                            }}
                          />
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2 py-2">
                              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                              <span className="text-xs text-neutral-400">
                                {uploadPercent < 50
                                  ? `${uploadPercent * 2}% envoi en cours...`
                                  : uploadPercent < 100
                                    ? `Traitement sur le serveur... ${uploadPercent}%`
                                    : 'Terminé !'}
                              </span>
                              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#d4af37] transition-all duration-500" style={{ width: `${uploadPercent}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 py-2 text-neutral-400 hover:text-white">
                              <UploadCloud className="w-6 h-6 text-neutral-400" />
                              <span className="text-xs text-neutral-400 font-medium">Cliquez ou glissez une vidéo MP4</span>
                            </div>
                          )}
                        </label>
                        {video.url && (video.url.includes('/uploads/') || video.url.includes('cloudinary.com')) && (
                          <div className="space-y-3">
                            <p className="text-xs text-emerald-400 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis" title={video.url}>
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Vidéo enregistrée : <span className="truncate">{video.url}</span>
                            </p>
                            <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/5" style={{ aspectRatio: '16/9', maxHeight: '180px' }}>
                              <VideoPreview url={video.url} />
                            </div>
                          </div>
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

/* ─── LinkInput: input + validate button + preview ─── */
const LinkInput = ({ url, onUrlChange }: { url: string; onUrlChange: (u: string) => void }) => {
  const [validated, setValidated] = useState(!!url && url.length > 5);

  useEffect(() => {
    if (!url) setValidated(false);
  }, [url]);

  const isValidUrl = url.trim().length > 5 && (url.startsWith('http://') || url.startsWith('https://'));

  const handleValidate = () => {
    if (!isValidUrl) return;
    setValidated(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidate();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input + button row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => { onUrlChange(e.target.value); setValidated(false); }}
          onKeyDown={handleKeyDown}
          onBlur={handleValidate}
          placeholder="Ex: https://www.tiktok.com/@compte/video/... ou Instagram / YouTube / Facebook"
          className="flex-1 bg-white/[0.03] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:bg-white/[0.06] transition-colors placeholder:text-neutral-600"
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={!isValidUrl || validated}
          className={`
            px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0
            ${validated
              ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
              : isValidUrl
                ? 'bg-gradient-to-b from-[#e5c558] to-[#d4af37] text-[#111] shadow-[0_0_12px_rgba(212,175,55,0.2)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5'
                : 'bg-white/[0.03] text-neutral-600 cursor-not-allowed'
            }
          `}
        >
          {validated ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> validé</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> valider</>
          )}
        </button>
      </div>

      {/* Preview area — shown only after validation */}
      {validated && url && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden space-y-2.5"
        >
          <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/5" style={{ aspectRatio: '16/9', maxHeight: '180px' }}>
            <VideoPreview url={url} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] truncate max-w-[200px]" title={url}>Lien validé : {url}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-neutral-500 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      )}

      {/* Error hint */}
      {!validated && url.length > 0 && !isValidUrl && (
        <p className="text-[10px] text-amber-400/70 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Saisissez un lien commençant par https://
        </p>
      )}
    </div>
  );
};