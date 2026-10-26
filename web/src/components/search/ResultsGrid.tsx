import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Grid, List, Loader2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { ApartmentCard, ApartmentSkeleton } from '@/components/apartment/ApartmentCard';
import { cn, formatPrice, formatArea } from '@/lib/utils';
import type { Apartment, SearchFilters } from '@/types';

type ViewMode = 'grid' | 'list';

interface ResultsGridProps {
  apartments: Apartment[];
  isLoading: boolean;
  filters: SearchFilters;
  onOpenModal: (apartment: Apartment) => void;
  onToggleFavorite: (apartment: Apartment) => void;
  isFavorite: (url: string) => boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function ResultsGrid({
  apartments,
  isLoading,
  filters,
  onOpenModal,
  onToggleFavorite,
  isFavorite,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onResetFilters,
}: ResultsGridProps) {
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'newest'>('relevance');

  const sortedApartments = [...apartments].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'area_asc': return a.area - b.area;
      case 'area_desc': return b.area - a.area;
      case 'newest': return (b.id?.localeCompare(a.id || '') || 0);
      default: return 0;
    }
  });

  if (isLoading) {
    return (
      <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
        {[...Array(8)].map((_, i) => (
          <ApartmentSkeleton key={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
        ))}
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <EmptyState 
        hasFilters={hasActiveFilters} 
        onReset={onResetFilters}
        filters={filters}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Найдено <span className="font-semibold text-foreground">{apartments.length}</span> вариантов
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onResetFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Сбросить фильтры
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Сортировка"
          >
            <option value="relevance">По релевантности</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="area_asc">Площадь ↑</option>
            <option value="area_desc">Площадь ↓</option>
            <option value="newest">Новые сначала</option>
          </select>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('grid')}
              aria-label="Сетка"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('list')}
              aria-label="Список"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {sortedApartments.map((apartment, index) => (
              <ApartmentCard
                key={apartment.url + index}
                apartment={apartment}
                index={index}
                isFavorite={isFavorite(apartment.url)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpenModal}
                variant="default"
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {sortedApartments.map((apartment, index) => (
              <ApartmentCard
                key={apartment.url + index}
                apartment={apartment}
                index={index}
                isFavorite={isFavorite(apartment.url)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpenModal}
                variant="compact"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination placeholder */}
      {apartments.length > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled>Назад</Button>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <Button
                key={n}
                variant={n === 1 ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
              >
                {n}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">Вперёд</Button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, onReset, filters }: { hasFilters: boolean; onReset: () => void; filters: SearchFilters }) {
  const suggestions = [
    'Попробуй увеличить бюджет',
    'Убери фильтр по районам',
    'Расширь диапазон площадей',
    'Выбери "Любое" кол-во комнат',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="mb-6 p-4 rounded-full bg-muted">
        <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">Ничего не найдено</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {hasFilters 
          ? 'Попробуй изменить параметры поиска:' 
          : 'К сожалению, по твоему запросу нет объявлений прямо сейчас.'
        }
      </p>
      
      {hasFilters && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {suggestions.map((s, i) => (
            <Button key={i} variant="outline" size="sm" onClick={onReset}>
              {s}
            </Button>
          ))}
        </div>
      )}

      <Button onClick={onReset} className="w-full sm:w-auto">
        <X className="h-4 w-4 mr-2" />
        {hasFilters ? 'Сбросить все фильтры' : 'Попробовать другой запрос'}
      </Button>
    </motion.div>
  );
}