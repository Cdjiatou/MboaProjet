import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronLeft, ChevronRight, Volume2, VolumeX, X, Sparkles } from 'lucide-react';
import { getPublicConfig } from '@/services/adminService';
import { type AdBannerItem } from '@/components/admin/BannerManager';



export const FooterAdBanner = () => {
  const [banners, setBanners] = useState<AdBannerItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await getPublicConfig();
        if (res.success && res.data) {
          const d = res.data;
          let loaded: AdBannerItem[] = [];

          if (d.ad_banners) {
            try {
              const parsed = JSON.parse(d.ad_banners);
              if (Array.isArray(parsed)) {
                loaded = parsed.filter((b: AdBannerItem) => b.enabled);
              }
            } catch (e) {
              console.error('Error parsing ad_banners in AdBanner', e);
            }
          }

          if (loaded.length === 0 && d.ad_banner_enabled === 'true') {
            loaded = [{
              id: 'banner-legacy',
              enabled: true,
              title: d.ad_banner_title || 'Événement Partenaire',
              subtitle: d.ad_banner_subtitle || '',
              ctaLabel: d.ad_banner_cta_label || 'En savoir plus',
              ctaUrl: d.ad_banner_cta_url || '#',
              videoUrl: d.ad_banner_video_url || '',
              backgroundImageUrl: d.ad_banner_bg_image || '',
            }];
          }

          setBanners(loaded);
        }
      } catch (err) {
        console.error('Error fetching public config for AdBanner:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;
    goToSlide((currentSlide + 1) % banners.length);
  }, [banners.length, currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;
    goToSlide((currentSlide - 1 + banners.length) % banners.length);
  }, [banners.length, currentSlide, goToSlide]);

  // Auto-rotation — pause when a local/uploaded video is playing to let it finish
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isVideoPlaying) return;
    const timer = setInterval(nextSlide, 12000);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide, isVideoPlaying]);

  // Auto-advance for Facebook slides (no playback events)
  useEffect(() => {
    const currentBannerObj = banners[currentSlide];
    if (!currentBannerObj) return;
    const url = currentBannerObj.videoUrl || '';
    const isFbSlide = /facebook\.com|fb\.watch/.test(url);
    if (isFbSlide && banners.length > 1) {
      const fbTimer = setTimeout(nextSlide, 8000);
      return () => clearTimeout(fbTimer);
    }
  }, [currentSlide, banners, nextSlide]);

  // Sync mute & replay video on slide change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isMuted, currentSlide]);

  // Tell Facebook SDK to parse and render the embedded video plugin if it exists
  useEffect(() => {
    if ((window as any).FB) {
      try {
        (window as any).FB.XFBML.parse();
      } catch (err) {
        console.error('FB Parse Error', err);
      }
    }
  }, [currentSlide, banners]);

  if (loading || banners.length === 0 || dismissed) return null;

  const currentBanner = banners[currentSlide] || banners[0];
  const videoUrl = currentBanner.videoUrl || '';
  const bgImage = currentBanner.backgroundImageUrl || '';

  const isYt = /youtube\.com|youtu\.be/.test(videoUrl);
  const isFb = /facebook\.com|fb\.watch/.test(videoUrl);
  
  // Extract YouTube video ID
  const ytId = (() => {
    if (!isYt) return null;
    const patterns = [
      /youtu\.be\/([^?&\s]+)/,
      /youtube\.com\/watch\?v=([^&\s]+)/,
      /youtube\.com\/embed\/([^?&\s]+)/,
      /youtube\.com\/shorts\/([^?&\s]+)/,
    ];
    for (const p of patterns) {
      const m = videoUrl.match(p);
      if (m) return m[1];
    }
    return null;
  })();
  
  const isDirectVideo = videoUrl.startsWith('/uploads/') || videoUrl.includes('cloudinary.com') || videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm');
  const hasVideo = !!videoUrl;

  const fullVideoUrl = (videoUrl && videoUrl.startsWith('/uploads/'))
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${videoUrl}`
    : videoUrl;

  const fullBgImage = bgImage && bgImage.startsWith('/uploads/')
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${bgImage}`
    : bgImage;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.9 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-5 right-5 z-[9990] group"
        style={{ width: isExpanded ? 'min(480px, calc(100vw - 40px))' : 'min(340px, calc(100vw - 40px))' }}
      >
        <div
          className={`
            relative rounded-2xl overflow-hidden
            shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(212,175,55,0.08)]
            bg-[#0a0a0f]
            transition-all duration-500 ease-out
          `}
        >

          {/* ── Close button ── */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-black transition-all"
            aria-label="Fermer la bannière"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* ── Video / Image area — no forced aspect ratio, let video dictate size ── */}
          <div
            className="relative w-full cursor-pointer bg-black flex items-center justify-center"
            style={{ minHeight: '180px', maxHeight: isExpanded ? '320px' : '220px' }}
            onClick={() => setIsExpanded(prev => !prev)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`media-${currentBanner.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full flex items-center justify-center"
                style={{ minHeight: '180px', maxHeight: isExpanded ? '320px' : '220px' }}
              >
                {hasVideo && isYt && ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                    className="w-full border-0"
                    style={{ minHeight: '180px', height: isExpanded ? '320px' : '220px' }}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title="YouTube Banner Video"
                  />
                ) : hasVideo && isFb ? (
                  <div
                    className="fb-video w-full"
                    data-href={videoUrl}
                    data-width="auto"
                    data-show-text="false"
                    data-autoplay="true"
                    data-allowfullscreen="true"
                    style={{ minHeight: '180px', height: isExpanded ? '320px' : '220px' }}
                  />
                ) : hasVideo && (isDirectVideo || videoUrl.startsWith('http')) ? (
                  <video
                    ref={videoRef}
                    key={`video-${currentBanner.id}`}
                    src={fullVideoUrl}
                    autoPlay
                    loop={banners.length <= 1}
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-contain"
                    style={{ maxHeight: isExpanded ? '320px' : '220px' }}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => {
                      setIsVideoPlaying(false);
                      if (banners.length > 1) nextSlide();
                    }}
                    onCanPlay={(e) => {
                      const vid = e.target as HTMLVideoElement;
                      vid.play().catch(() => {});
                    }}
                  />
                ) : fullBgImage ? (
                  <img
                    src={fullBgImage}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ maxHeight: isExpanded ? '320px' : '220px' }}
                  />
                ) : (
                  <div className="w-full bg-gradient-to-br from-[#1a1610] to-[#0a0a0f]" style={{ minHeight: '180px' }} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Sound toggle */}
            {hasVideo && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(prev => !prev); }}
                className="absolute bottom-2 left-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-all"
                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            )}

            {/* Gradient overlay bottom for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
          </div>

          {/* ── Text content ── */}
          <div className="px-4 pb-4 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentBanner.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Badge + Title row */}
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="shrink-0 mt-0.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20">
                      <Sparkles className="w-2.5 h-2.5 text-[#d4af37]" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#d4af37]">Ad</span>
                    </div>
                  </div>
                  {currentBanner.title && (
                    <h4 className="text-white font-bold text-sm leading-snug line-clamp-2">
                      {currentBanner.title}
                    </h4>
                  )}
                </div>

                {/* Subtitle (only when expanded) */}
                {isExpanded && currentBanner.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-neutral-500 text-xs leading-relaxed mb-2 line-clamp-2"
                  >
                    {currentBanner.subtitle}
                  </motion.p>
                )}

                {/* CTA + Navigation row */}
                <div className="flex items-center justify-between mt-2">
                  {currentBanner.ctaUrl && currentBanner.ctaLabel ? (
                    <a
                      href={currentBanner.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d4af37] hover:bg-[#b8952e] text-black text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all hover:scale-105 shadow-[0_2px_10px_rgba(212,175,55,0.2)]"
                    >
                      {currentBanner.ctaLabel}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <div />}

                  {/* Mini navigation */}
                  {banners.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={prevSlide}
                        className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-1">
                        {banners.map((b, idx) => (
                          <button
                            key={b.id}
                            onClick={() => goToSlide(idx)}
                            className={`rounded-full transition-all duration-300 ${
                              idx === currentSlide
                                ? 'w-4 h-1 bg-[#d4af37]'
                                : 'w-1 h-1 bg-white/20 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={nextSlide}
                        className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Gold accent line top */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FooterAdBanner;
