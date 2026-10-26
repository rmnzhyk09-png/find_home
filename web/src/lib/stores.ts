import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Apartment, SearchFilters, FavoriteItem, HistoryItem, ViewMode, AppState } from '@/types';
import { generateId, getRelativeTime } from '@/lib/utils';

interface FavoritesState {
  items: FavoriteItem[];
  add: (apartment: Apartment) => void;
  remove: (id: string) => void;
  toggle: (apartment: Apartment) => boolean;
  isFavorite: (id: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (apartment) => set((state) => {
        if (state.items.some(i => i.apartment.url === apartment.url)) return state;
        return {
          items: [{
            id: generateId(),
            apartment,
            addedAt: new Date(),
          }, ...state.items],
        };
      }),
      remove: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
      })),
      toggle: (apartment) => {
        const { items, add, remove } = get();
        const existing = items.find(i => i.apartment.url === apartment.url);
        if (existing) {
          remove(existing.id);
          return false;
        } else {
          add(apartment);
          return true;
        }
      },
      isFavorite: (url) => get().items.some(i => i.apartment.url === url),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'kvartira-favorites',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

interface HistoryState {
  items: HistoryItem[];
  add: (query: string, filters: SearchFilters, count: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: (query, filters, count) => set((state) => {
        const newItem: HistoryItem = {
          id: generateId(),
          query,
          filters,
          count,
          timestamp: new Date(),
        };
        // Удаляем дубликаты по query
        const filtered = state.items.filter(i => i.query !== query);
        return { items: [newItem, ...filtered].slice(0, 50) };
      }),
      remove: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
      })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'kvartira-history',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

interface UIState extends AppState {
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'chat',
      sidebarOpen: false,
      theme: 'system',
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'kvartira-ui',
      partialize: (state) => ({ 
        viewMode: state.viewMode, 
        theme: state.theme 
      }),
    }
  )
);

// Хук для применения темы
export function useTheme() {
  const { theme, setTheme } = useUIStore();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return { theme, setTheme, toggleTheme };
}