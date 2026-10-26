import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Search, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn, formatPrice, getRelativeTime } from '@/lib/utils';
import { useHistoryStore } from '@/lib/stores';
import type { SearchFilters } from '@/types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

export function HistoryPanel({ isOpen, onClose, onSearch }: HistoryPanelProps) {
  const { items, remove, clear } = useHistoryStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex lg:hidden"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-md bg-background h-full flex flex-col shadow-2xl"
        >
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">История поиска</h2>
              {items.length > 0 && (
                <Badge variant="secondary">{items.length}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={clear} aria-label="Очистить историю">
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HistoryItem 
                      item={item} 
                      onSearch={onSearch}
                      onRemove={() => remove(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

function HistoryItem({ item, onSearch, onRemove }: { item: { id: string; query: string; filters: SearchFilters; count: number; timestamp: Date }; onSearch: (filters: SearchFilters) => void; onRemove: () => void }) {
  const { query, filters, count, timestamp } = item;

  const activeFilters = Object.entries(filters)
    .filter(([k, v]) => k !== 'city' && k !== 'keywords' && v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
    .slice(0, 3);

  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-shadow cursor-pointer">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm truncate">{query}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground ml-6">
              {activeFilters.map(([key, value]) => (
                <Badge key={key} variant="outline" className="px-2 py-0.5">
                  {formatFilter(key, value)}
                </Badge>
              ))}
              {Object.keys(filters).length > activeFilters.length + 2 && (
                <Badge variant="outline" className="px-2 py-0.5 text-muted-foreground">
                  +{Object.keys(filters).length - activeFilters.length - 2} ещё
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground ml-6">
              <span className="font-medium text-foreground">{count} вариантов</span>
              <span>•</span>
              <span>{getRelativeTime(timestamp)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => { e.stopPropagation(); onSearch(filters); }}
              aria-label="Повторить поиск"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-red-500" 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              aria-label="Удалить из истории"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatFilter(key: string, value: any): string {
  switch (key) {
    case 'rooms': return `${value}-к`;
    case 'maxPrice': return `до ${(value / 1e6).toFixed(1)}М`;
    case 'minPrice': return `от ${(value / 1e6).toFixed(1)}М`;
    case 'minArea': return `от ${value}м²`;
    case 'maxArea': return `до ${value}м²`;
    case 'district': return value;
    default: return String(value);
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="mb-4 p-3 rounded-full bg-muted">
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">История пуста</h3>
      <p className="text-muted-foreground text-sm">
        Твои поисковые запросы будут появляться здесь
      </p>
    </div>
  );
}