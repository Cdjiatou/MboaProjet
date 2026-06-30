import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'info';

interface AdminAlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}

const alertStyles: Record<AlertVariant, { bg: string; icon: React.ElementType }> = {
  success: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  error: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
  info: { bg: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20', icon: Info },
};

export const AdminAlert = ({ variant, title, children, onDismiss }: AdminAlertProps) => {
  const { bg, icon: Icon } = alertStyles[variant];
  return (
    <div role="alert" className={`p-4 rounded-2xl mb-6 text-sm border backdrop-blur-md ${bg}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="leading-relaxed opacity-90">{children}</div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100 shrink-0 transition-opacity">
            Fermer
          </button>
        )}
      </div>
    </div>
  );
};

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AdminButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ElementType;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-b from-[#e5c558] to-[#d4af37] text-[#111] font-bold shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:-translate-y-0.5 border-t border-white/40',
  secondary: 'bg-white/[0.04] text-neutral-300 backdrop-blur-md hover:bg-white/[0.08] hover:text-white shadow-lg hover:-translate-y-0.5',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:-translate-y-0.5',
  ghost: 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5',
};

const buttonSizes = {
  sm: 'px-4 py-2 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-sm rounded-2xl',
};

export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon: Icon,
  size = 'md',
  children,
  className = '',
  disabled,
  onClick,
  type,
  title,
}) => (
  <motion.button
    whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
    whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    onClick={onClick}
    type={type}
    title={title}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2.5 font-medium tracking-normal normal-case
      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none
      ${buttonVariants[variant]} ${buttonSizes[size]} ${className}
    `}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
    {children && <span>{children}</span>}
  </motion.button>
);

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({ children, className = '' }) => (
  <div className={`bg-[#060608] rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);
