import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, Info, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/useToastStore';

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: React.ElementType; iconColor: string; glow: string }> = {
  success: { 
    bg: 'bg-[#0a0f0d]/90', 
    border: 'border-emerald-500/30', 
    icon: CheckCircle2, 
    iconColor: 'text-emerald-400', 
    glow: 'shadow-[0_8px_30px_rgba(16,185,129,0.12)]' 
  },
  error: { 
    bg: 'bg-[#120a0a]/90', 
    border: 'border-red-500/30', 
    icon: AlertCircle, 
    iconColor: 'text-red-400', 
    glow: 'shadow-[0_8px_30px_rgba(239,68,68,0.12)]' 
  },
  warning: { 
    bg: 'bg-[#120f0a]/90', 
    border: 'border-amber-500/30', 
    icon: AlertTriangle, 
    iconColor: 'text-amber-400', 
    glow: 'shadow-[0_8px_30px_rgba(245,158,11,0.12)]' 
  },
  loading: { 
    bg: 'bg-[#0b0b10]/95', 
    border: 'border-[#d4af37]/40', 
    icon: Loader2, 
    iconColor: 'text-[#d4af37]', 
    glow: 'shadow-[0_8px_30px_rgba(212,175,55,0.15)]' 
  },
  info: { 
    bg: 'bg-[#0b0b10]/90', 
    border: 'border-[#d4af37]/30', 
    icon: Info, 
    iconColor: 'text-[#d4af37]', 
    glow: 'shadow-[0_8px_30px_rgba(212,175,55,0.1)]' 
  },
};

const ToastContainer = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 12, scale: 0.95, x: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`
                pointer-events-auto w-full backdrop-blur-xl border rounded-2xl p-3.5 shadow-xl
                ${style.bg} ${style.border} ${style.glow}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 rounded-lg bg-white/[0.03] shrink-0">
                  <Icon className={`w-4 h-4 ${style.iconColor} ${toast.variant === 'loading' ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-white font-semibold text-xs sm:text-sm tracking-tight">{toast.title}</p>
                  {toast.message && (
                    <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed font-normal">{toast.message}</p>
                  )}
                </div>
                {toast.variant !== 'loading' && (
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="text-neutral-500 hover:text-white transition-colors shrink-0 p-1 hover:bg-white/5 rounded-lg"
                    aria-label="Fermer"
                  >
                    <X className="w-3.5 h-3.5" />
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
