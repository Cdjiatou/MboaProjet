import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2 } from 'lucide-react';
import ShareButtons from './ShareButtons';

interface ProfileSharePanelProps {
  url: string;
  candidateName: string;
  className?: string;
}

export const ProfileSharePanel = ({ url, candidateName, className = '' }: ProfileSharePanelProps) => {
  const [copied, setCopied] = useState(false);

  const shareText = `⭐ Votez pour ${candidateName} sur MBOA NEXT STAR ! Faites-moi gagner en votant pour moi 🎤`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: candidateName, text: shareText, url });
      } catch {
        // utilisateur a annulé
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Séparateur */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2))' }} />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <Share2 className="w-3 h-3 text-[#d4af37]" />
          <span className="text-[10px] text-[#d4af37]/80 uppercase tracking-widest font-semibold">
            Votre lien unique
          </span>
        </div>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.2))' }} />
      </div>

      {/* Lien de partage */}
      <div
        className="rounded-2xl p-3 flex items-center gap-3 transition-all duration-200"
        style={{
          background: 'rgba(212,175,55,0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(212,175,55,0.15)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Lien de vote</p>
          <p className="text-[#d4af37]/90 text-xs font-mono truncate">{url}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          style={{
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(212,175,55,0.15)',
            border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(212,175,55,0.3)',
          }}
          title="Copier le lien"
        >
          {copied
            ? <Check className="w-4 h-4 text-emerald-400" />
            : <Copy className="w-4 h-4 text-[#d4af37]" />
          }
        </button>
      </div>

      {/* Feedback copie */}
      {copied && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald-400 text-xs uppercase tracking-widest font-semibold text-center"
        >
          ✓ Lien copié dans le presse-papiers
        </motion.p>
      )}

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3.5 text-white font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5"
        style={{
          background: 'linear-gradient(135deg, #1a9e47, #25D366)',
          boxShadow: '0 8px 24px rgba(37,211,102,0.2)',
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden xs:inline">Partager sur </span>WhatsApp
      </a>

      {/* Autres plateformes */}
      <div className="space-y-2">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest text-center">
          Autres plateformes
        </p>
        <ShareButtons url={url} text={shareText} size="md" className="justify-center" />
      </div>

      {/* Partage natif */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="w-full py-3 rounded-2xl text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          Plus d'options de partage
        </button>
      )}
    </div>
  );
};

export default ProfileSharePanel;
