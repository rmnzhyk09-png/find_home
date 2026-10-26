import type { SearchFilters, SearchResponse, ChatResponse } from '@/types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.rooms) params.set('rooms', String(filters.rooms));
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters.minArea) params.set('minArea', String(filters.minArea));
    if (filters.maxArea) params.set('maxArea', String(filters.maxArea));
    if (filters.district) params.set('district', filters.district);
    if (filters.keywords?.length) params.set('keywords', filters.keywords.join(','));
    
    return fetchJson<SearchResponse>(`${API_BASE}/search?${params.toString()}`);
  },

  async chat(message: string, city = 'novosibirsk'): Promise<ChatResponse> {
    return fetchJson<ChatResponse>(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, city }),
    });
  },

  async getSources() {
    return fetchJson<{ sources: string[]; description: string }>(`${API_BASE}/sources`);
  },

  async health() {
    return fetchJson<{ status: string; timestamp: string }>(`${API_BASE}/health`);
  },
};

// NLP парсер для чата (клиентская сторона для мгновенного превью)
export function parseNaturalLanguage(text: string): SearchFilters {
  const lower = text.toLowerCase();
  const filters: SearchFilters = {};

  // Комнаты
  const roomsMatch = lower.match(/(\d)\s*[- ]?\s*(?:комнат|комн|к\b)/);
  if (roomsMatch) filters.rooms = parseInt(roomsMatch[1]);

  // Цена
  const priceMatch = lower.match(/(?:до|макс|максимум|не\s+более)\s*(\d+(?:[.,]\d+)?)\s*(?:млн|млн\.|миллион|тыс|тыс\.|к|k)/);
  if (priceMatch) {
    const val = parseFloat(priceMatch[1].replace(',', '.'));
    const unit = priceMatch[0].includes('тыс') || priceMatch[0].includes('к') || priceMatch[0].includes('k') ? 1000 : 1000000;
    filters.maxPrice = val * unit;
  }
  const minPriceMatch = lower.match(/(?:от|мин|минимум|не\s+менее)\s*(\d+(?:[.,]\d+)?)\s*(?:млн|млн\.|миллион|тыс|тыс\.|к|k)/);
  if (minPriceMatch) {
    const val = parseFloat(minPriceMatch[1].replace(',', '.'));
    const unit = minPriceMatch[0].includes('тыс') || minPriceMatch[0].includes('к') || minPriceMatch[0].includes('k') ? 1000 : 1000000;
    filters.minPrice = val * unit;
  }

  // Площадь
  const areaMatch = lower.match(/(?:площад|м²|м2|кв\.?\s*м)\s*(?:от|до)?\s*(\d+(?:[.,]\d+)?)\s*[-–]?\s*(\d+(?:[.,]\d+)?)/);
  if (areaMatch) {
    if (areaMatch[1]) filters.minArea = parseFloat(areaMatch[1].replace(',', '.'));
    if (areaMatch[2]) filters.maxArea = parseFloat(areaMatch[2].replace(',', '.'));
  }

  // Районы
  const districts = [
    'заельцовский', 'октябрьский', 'ленинский', 'кировский',
    'советский', 'первомайский', 'калининский', 'дзержинский', 'центр', 'академгородок', 'лаврентьев'
  ];
  for (const d of districts) {
    if (lower.includes(d)) {
      filters.district = d.charAt(0).toUpperCase() + d.slice(1);
      break;
    }
  }

  // Ключевые слова
  const keywords = [];
  if (lower.includes('новострой') || lower.includes('жк') || lower.includes('застройщ')) keywords.push('новостройка');
  if (lower.includes('вторичн')) keywords.push('вторичная');
  if (lower.includes('без комисс')) keywords.push('без комиссии');
  if (lower.includes('ипотек')) keywords.push('ипотека');
  if (keywords.length > 0) filters.keywords = keywords;

  return filters;
}

export function filtersToQueryString(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.rooms) parts.push(`${filters.rooms}-комнатную`);
  if (filters.maxPrice) parts.push(`до ${(filters.maxPrice / 1e6).toFixed(1)} млн`);
  if (filters.minPrice) parts.push(`от ${(filters.minPrice / 1e6).toFixed(1)} млн`);
  if (filters.district) parts.push(`в ${filters.district.toLowerCase()} районе`);
  if (filters.minArea || filters.maxArea) {
    const a = [];
    if (filters.minArea) a.push(`от ${filters.minArea} м²`);
    if (filters.maxArea) a.push(`до ${filters.maxArea} м²`);
    parts.push(a.join(' '));
  }
  if (filters.keywords?.length) parts.push(filters.keywords.join(', '));
  return parts.length ? parts.join(', ') : 'квартиру';
}

export function getSuggestions(input: string): string[] {
  const lower = input.toLowerCase();
  const suggestions = [
    '2-комнатную до 5 млн в Новосибирске',
    '3-комнатную в Заельцовском районе',
    'Студию до 3 млн без комиссии',
    'Новостройку с ипотекой',
    'Квартиру от 50 м² в центре',
    'Вторичку в Ленинском районе',
  ];
  
  return suggestions.filter(s => 
    s.toLowerCase().includes(lower) || lower.split(' ').some(w => s.toLowerCase().includes(w))
  ).slice(0, 4);
}