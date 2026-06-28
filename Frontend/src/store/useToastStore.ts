import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'loading' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  update: (id: string, toast: Partial<Omit<Toast, 'id'>>) => void;
  dismiss: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    if (toast.variant !== 'loading' && toast.duration !== 0) {
      const duration = toast.duration ?? (toast.variant === 'error' ? 8000 : 5000);
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },
  update: (id, toast) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...toast } : t)),
    }));
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
