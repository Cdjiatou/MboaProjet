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
  info: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Info },
};

export const AdminAlert = ({ variant, title, children, onDismiss }: AdminAlertProps) => {
  const { bg, icon: Icon } = alertStyles[variant];
  return (
    <div role="alert" className={`p-4 rounded-xl mb-6 text-sm border ${bg}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="leading-relaxed opacity-90">{children}</div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100 shrink-0">
            Fermer
          </button>
        )}
      </div>
    </div>
  );
};

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ElementType;
  size?: 'sm' | 'md';
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[#d4af37] text-black hover:bg-[#b8952e] font-bold',
  secondary: 'bg-white/5 text-neutral-300 border border-white/[0.08] hover:bg-white/10 hover:border-[#d4af37]/30',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold',
  ghost: 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.04]',
};

const buttonSizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
};

export const AdminButton = ({
  variant = 'primary',
  loading = false,
  icon: Icon,
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: AdminButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2 rounded-xl uppercase tracking-wider
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      ${buttonVariants[variant]} ${buttonSizes[size]} ${className}
    `}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);
