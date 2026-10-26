import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn, RU_CITIES, NSK_DISTRICTS } from '@/lib/utils';
import type { SearchFilters } from '@/types';

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  isOpen: boolean;
  onToggle: () => void;
  sources: Record<string, { ok: boolean; count: number; error?: string }>;
  totalCount: number;
}

export function FilterPanel({ 
  filters, 
  onChange, 
  onReset, 
  hasActiveFilters, 
  isOpen, 
  onToggle,
  sources,
  totalCount
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    advanced: false,
    sources: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => 
    k !== 'city' && k !== 'keywords' && v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className={cn('fixed inset-0 z-40 flex', isOpen ? 'block' : 'hidden')}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden" 
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'relative z-50 w-full max-w-sm lg:max-w-md bg-background border-r shadow-xl h-full flex flex-col',
          'lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Фильтры</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden" aria-label="Закрыть фильтры">
              <X className="h-5 w-5" />
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {/* Results summary */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Найдено: <span className="text-primary">{totalCount}</span> вариантов</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(sources).map(([source, data]) => (
              <Badge 
                key={source} 
                variant={data.ok ? 'outline' : 'destructive'} 
                className="px-2 py-1 text-xs flex-1 min-w-0 justify-center"
              >
                {source}: {data.ok ? data.count : '⚠️'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4 space-y-6">
          {/* Basic filters */}
          <FilterSection 
            title="Основное" 
            expanded={expandedSections.basic} 
            onToggle={() => toggleSection('basic')}
            icon={expandedSections.basic ? ChevronUp : ChevronDown}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Город</label>
                <select
                  value={filters.city || 'novosibirsk'}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {RU_CITIES.map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Комнат</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(rooms => (
                    <button
                      key={rooms}
                      onClick={() => updateFilter('rooms', filters.rooms === rooms ? null : rooms)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        filters.rooms === rooms
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-muted hover:bg-muted-foreground/10'
                      )}
                    >
                      {rooms}-к
                    </button>
                  ))}
                  <button
                    onClick={() => updateFilter('rooms', null)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      filters.rooms === null || filters.rooms === undefined
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-muted hover:bg-muted-foreground/10'
                    )}
                  >
                    Любое
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Цена от (₽)"
                  type="number"
                  placeholder="1 000 000"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : null)}
                  inputMode="numeric"
                />
                <Input
                  label="Цена до (₽)"
                  type="number"
                  placeholder="5 000 000"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
                  inputMode="numeric"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Площадь от (м²)"
                  type="number"
                  step="0.1"
                  placeholder="30"
                  value={filters.minArea || ''}
                  onChange={(e) => updateFilter('minArea', e.target.value ? parseFloat(e.target.value) : null)}
                  inputMode="decimal"
                />
                <Input
                  label="Площадь до (м²)"
                  type="number"
                  step="0.1"
                  placeholder="100"
                  value={filters.maxArea || ''}
                  onChange={(e) => updateFilter('maxArea', e.target.value ? parseFloat(e.target.value) : null)}
                  inputMode="decimal"
                />
              </div>
            </div>
          </FilterSection>

          {/* Advanced filters */}
          <FilterSection 
            title="Дополнительно" 
            expanded={expandedSections.advanced} 
            onToggle={() => toggleSection('advanced')}
            icon={expandedSections.advanced ? ChevronUp : ChevronDown}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Район</label>
                <select
                  value={filters.district || ''}
                  onChange={(e) => updateFilter('district', e.target.value || null)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Любой район</option>
                  {NSK_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ключевые слова</label>
                <Input
                  placeholder="новостройка, без комиссии, ипотека..."
                  value={filters.keywords?.join(', ') || ''}
                  onChange={(e) => updateFilter('keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
                <p className="text-xs text-muted-foreground mt-1">Через запятую</p>
              </div>
            </div>
          </FilterSection>

          {/* Sources status */}
          <FilterSection 
            title="Источники данных" 
            expanded={expandedSections.sources} 
            onToggle={() => toggleSection('sources')}
            icon={expandedSections.sources ? ChevronUp : ChevronDown}
          >
            <div className="space-y-2">
              {Object.entries(sources).map(([source, data]) => (
                <div key={source} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{source}</span>
                  <Badge variant={data.ok ? 'success' : 'destructive'} className="px-2 py-0.5">
                    {data.ok ? `${data.count} об.` : `Ошибка: ${data.error?.slice(0, 20)}`}
                  </Badge>
                </div>
              ))}
            </div>
          </FilterSection>
        </ScrollArea>

        {/* Mobile apply button */}
        <div className="lg:hidden p-4 border-t bg-background/95 backdrop-blur sticky bottom-0">
          <Button className="w-full" onClick={onToggle}>
            Применить фильтры
          </Button>
        </div>
      </motion.aside>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function FilterSection({ title, expanded, onToggle, icon, children }: FilterSectionProps) {
  return (
    <Card>
      <CardHeader className="p-3 pb-0" onClick={onToggle}>
        <div className="flex items-center justify-between cursor-pointer">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <span className="text-muted-foreground">{typeof icon === 'function' ? React.createElement(icon, { className: 'h-5 w-5' }) : icon}</span>
        </div>
      </CardHeader>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardContent className="pt-0 pb-3">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}