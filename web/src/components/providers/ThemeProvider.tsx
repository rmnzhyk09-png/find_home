import React from 'react';
import { useUIStore } from '@/lib/stores';

const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const html = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  html.classList.toggle('dark', dark);
};

/**
 * Простой ThemeProvider: берёт theme из zustand UI store (useUIStore),
 * применяет class="dark" на <html> (darkMode: 'class' в tailwind).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  React.useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // синхронизируем выбора «светлая/тёмная» из toggle-кнопки
  React.useEffect(() => {
    if (theme === 'system') {
      // начальная инициализация system-темы
      applyTheme('system');
    }
  }, []);

  // expose переключение через useUIStore.setTheme (обёртка для совместимости)
  (globalThis as unknown as { __setAppTheme?: typeof setTheme }).__setAppTheme = setTheme;

  return <>{children}</>;
}
