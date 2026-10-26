import React, { useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { FilterPanel } from '@/components/search/FilterPanel';
import { ResultsGrid } from '@/components/search/ResultsGrid';
import { FavoritesPanel } from '@/components/favorites/FavoritesPanel';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { ApartmentModal } from '@/components/apartment/ApartmentModal';
import { Toaster } from '@/components/ui/Toaster';
import { useUIStore, useFavoritesStore } from '@/lib/stores';
import { useApartments } from '@/hooks/useApartments';
import type { Apartment, SearchFilters } from '@/types';

const VALID_MODES = ['chat', 'catalog', 'favorites', 'history'] as const;
type AppViewMode = (typeof VALID_MODES)[number];

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();

  const viewModeRaw = location.pathname.replace(/^\//, '');
  const activeMode = (VALID_MODES as readonly string[]).includes(viewModeRaw)
    ? (viewModeRaw as AppViewMode)
    : 'chat';

  const viewMode = useUIStore((s) => s.viewMode);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // URL -> store (один раз при смене пути)
  React.useEffect(() => {
    if (activeMode !== viewMode) setViewMode(activeMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  const favoritesCount = useFavoritesStore((s) => s.items.length);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [trackResults, setTrackResults] = useState(false); // включаем поиск после первого запроса
  const [results, setResults] = useState<Apartment[]>([]);
  const [selected, setSelected] = useState<Apartment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading, isError, error } = useApartments(filters, trackResults);

  const apartments: Apartment[] = results.length > 0 ? results : data?.items || [];

  const hasActiveFilters = useMemo(
    () =>
      !!(filters.rooms || filters.minPrice || filters.maxPrice ||
        filters.minArea || filters.maxArea || filters.district ||
        (filters.keywords && filters.keywords.length > 0)),
    [filters]
  );

  const handleViewModeChange = (mode: 'chat' | 'catalog' | 'favorites' | 'history') => {
    setViewMode(mode);
    navigate('/' + mode);
  };

  const handleSearch = (next: SearchFilters) => {
    setFilters(next);
    setResults([]);
    setTrackResults(true);
  };

  const resetFilters = () => {
    setFilters({});
    setResults([]);
  };

  const emptyResults = apartments.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onMenuClick={toggleSidebar}
        viewMode={(viewMode as AppViewMode) ?? activeMode}
        onViewModeChange={handleViewModeChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        favoritesCount={favoritesCount}
      />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {viewMode === 'chat' && (
          <ChatInterface
            onSearchResults={(resp) => {
              setResults([]);
              setFilters(resp.filters || {});
              handleSearch(resp.filters || {});
            }}
            onViewModeChange={(mode) => handleViewModeChange(mode)}
          />
        )}

        {viewMode === 'catalog' && (
          <>
            <FilterPanel
              filters={filters}
              onChange={handleSearch}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
              isOpen={showFilters}
              onToggle={() => setShowFilters((v) => !v)}
              sources={data?.sources || {}}
              totalCount={data?.count ?? apartments.length}
            />
            <ResultsGrid
              apartments={apartments}
              isLoading={isLoading}
              filters={filters}
              onOpenModal={setSelected}
              onToggleFavorite={(a) => toggleFavorite(a)}
              isFavorite={(url) => isFavorite(url)}
              viewMode={sidebarOpen ? 'list' : 'grid'}
              onViewModeChange={() => {}}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          </>
        )}

        {viewMode === 'favorites' && (
          <FavoritesPanel
            isOpen
            onClose={() => handleViewModeChange('chat')}
            onOpenModal={(a) => setSelected(a)}
          />
        )}

        {viewMode === 'history' && (
          <HistoryPanel
            isOpen
            onClose={() => handleViewModeChange('chat')}
            onSearch={(f) => {
              handleViewModeChange('catalog');
              handleSearch(f);
            }}
          />
        )}

        {isError && emptyResults && (
          <div className="text-center text-muted-foreground py-10">
            Не удалось загрузить данные: {error instanceof Error ? error.message : 'ошибка'}
          </div>
        )}
      </main>

      <ApartmentModal
        apartment={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  );
}
