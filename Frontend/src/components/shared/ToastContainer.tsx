import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, Info, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/useToastStore';

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: React.ElementType; iconColor: string; glow: string }> = {
  success: { bg: 'bg-emerald-950/95', border: 'border-emerald-500/40', icon: CheckCircle2, iconColor: 'text-emerald-400', glow: 'shadow-[0_8px_32px_rgba(16,185,129,0.15)]' },
  error: { bg: 'bg-red-950/95', border: 'border-red-500/40', icon: AlertCircle, iconColor: 'text-red-400', glow: 'shadow-[0_8px_32px_rgba(239,68,68,0.15)]' },
  warning: { bg: 'bg-amber-950/95', border: 'border-amber-500/40', icon: AlertTriangle, iconColor: 'text-amber-400', glow: 'shadow-[0_8px_32px_rgba(245,158,11,0.15)]' },
  loading: { bg: 'bg-[#0f0f14]/98', border: 'border-[#d4af37]/50', icon: Loader2, iconColor: 'text-[#d4af37]', glow: 'shadow-[0_8px_32px_rgba(212,175,55,0.2)]' },
  info: { bg: 'bg-[#0f0f18]/95', border: 'border-[#d4af37]/30', icon: Info, iconColor: 'text-[#d4af37]', glow: 'shadow-[0_8px_32px_rgba(212,175,55,0.1)]' },
};

const ToastContainer = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 p-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -48, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`
                pointer-events-auto w-full max-w-md backdrop-blur-xl border rounded-2xl
                ${style.bg} ${style.border} ${style.glow}
              `}
            >
              <div className="flex items-start gap-3 p-4">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor} ${toast.variant === 'loading' ? 'animate-spin' : ''}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{toast.title}</p>
                  {toast.message && (
                    <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
                  )}
                </div>
                {toast.variant !== 'loading' && (
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="text-neutral-500 hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
