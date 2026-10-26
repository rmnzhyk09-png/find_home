export interface Apartment {
  id?: string;
  source: string;
  rooms: number;
  district: string;
  address: string;
  price: number;
  area: number;
  floor: number;
  totalFloors: number;
  description: string;
  features: string[];
  url: string;
  pricePerMeter?: number;
  images?: string[];
}

export interface SearchFilters {
  city?: string;
  rooms?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  district?: string | null;
  keywords?: string[];
}

export interface SearchResponse {
  items: Apartment[];
  sources: Record<string, { ok: boolean; count: number; error?: string }>;
  count: number;
  city: string;
  filters: SearchFilters;
  fetchedAt: string;
  cached?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: Date;
  apartments?: Apartment[];
  filters?: SearchFilters;
  isLoading?: boolean;
}

export interface ChatResponse {
  response: string;
  filters: SearchFilters;
  items: Apartment[];
  totalCount: number;
  sources: Record<string, { ok: boolean; count: number; error?: string }>;
  fetchedAt: string;
  cached?: boolean;
}

export interface FavoriteItem {
  id: string;
  apartment: Apartment;
  addedAt: Date;
}

export interface HistoryItem {
  id: string;
  query: string;
  filters: SearchFilters;
  count: number;
  timestamp: Date;
}

export type ViewMode = 'chat' | 'catalog' | 'favorites' | 'history';

export interface AppState {
  viewMode: ViewMode;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}