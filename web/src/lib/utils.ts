import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price >= 1e9) return `${(price / 1e9).toFixed(1)} млрд ₽`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(1)} млн ₽`;
  if (price >= 1e3) return `${(price / 1e3).toFixed(0)} тыс ₽`;
  return `${price} ₽`;
}

export function formatPriceShort(price: number): string {
  if (price >= 1e6) return `${(price / 1e6).toFixed(1)}М ₽`;
  if (price >= 1e3) return `${(price / 1e3).toFixed(0)}К ₽`;
  return `${price} ₽`;
}

export function formatArea(area: number): string {
  return `${area} м²`;
}

export function formatPricePerMeter(price: number, area: number): string {
  if (area <= 0) return '—';
  return formatPrice(Math.round(price / area)) + '/м²';
}

export function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    'Дом.РФ': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'M2.ru': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Циан': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'ДомКлик': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[source] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    'Дом.РФ': '🏛️',
    'M2.ru': '🏗️',
    'Циан': '🏠',
    'ДомКлик': '🔑',
  };
  return icons[source] || '📍';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export const RU_CITIES = [
  { value: 'novosibirsk', label: 'Новосибирск' },
  { value: 'moscow', label: 'Москва' },
  { value: 'spb', label: 'Санкт-Петербург' },
  { value: 'ekaterinburg', label: 'Екатеринбург' },
  { value: 'kazan', label: 'Казань' },
  { value: 'nizhny-novgorod', label: 'Нижний Новгород' },
  { value: 'chelyabinsk', label: 'Челябинск' },
  { value: 'samara', label: 'Самара' },
  { value: 'omsk', label: 'Омск' },
  { value: 'rostov-na-donu', label: 'Ростов-на-Дону' },
];

export const NSK_DISTRICTS = [
  'Заельцовский',
  'Октябрьский',
  'Ленинский',
  'Кировский',
  'Советский',
  'Первомайский',
  'Калининский',
  'Дзержинский',
  'Центр',
  'Академгородок',
];