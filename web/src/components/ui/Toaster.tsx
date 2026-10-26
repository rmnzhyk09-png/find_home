import { create } from 'zustand';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastState>()((set) => ({
  items: [],
  push: (message, variant = 'default') => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, message, variant }].slice(-5) }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Императивный вызов: toast('Сохранено'), toast('Ошибка', 'error') */
export function toast(message: string, variant: ToastVariant = 'default') {
  useToastStore.getState().push(message, variant);
}

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg border transition-all animate-fade-in text-left',
            'bg-surface-light dark:bg-surface-dark text-foreground',
            t.variant === 'error' && 'border-red-300 dark:border-red-500/40',
            t.variant === 'success' && 'border-green-300 dark:border-green-500/40',
            t.variant === 'default' && 'border-border'
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
