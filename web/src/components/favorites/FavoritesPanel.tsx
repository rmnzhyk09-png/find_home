import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ExternalLink, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { ApartmentCard } from '@/components/apartment/ApartmentCard';
import { formatPrice, formatArea, cn } from '@/lib/utils';
import { useFavoritesStore } from '@/lib/stores';
import type { Apartment } from '@/types';

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (apartment: Apartment) => void;
}

export function FavoritesPanel({ isOpen, onClose, onOpenModal }: FavoritesPanelProps) {
  const { items, remove, toggle } = useFavoritesStore();

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
              <Heart className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold">Избранное</h2>
              {items.length > 0 && (
                <Badge variant="secondary">{items.length}</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
              <X className="h-5 w-5" />
            </Button>
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
                    <FavoriteItem 
                      item={item} 
                      onOpen={onOpenModal}
                      onRemove={() => remove(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>

          {items.length > 0 && (
            <div className="p-4 border-t bg-background/95 backdrop-blur sticky bottom-0">
              <Button variant="outline" className="w-full" onClick={() => useFavoritesStore.getState().clear()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить всё
              </Button>
            </div>
          )}
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

function FavoriteItem({ item, onOpen, onRemove }: { item: { id: string; apartment: Apartment; addedAt: Date }; onOpen: (apt: Apartment) => void; onRemove: () => void }) {
  const { apartment, addedAt } = item;
  const pricePerMeter = apartment.area > 0 ? Math.round(apartment.price / apartment.area) : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg bg-primary/10 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-primary/50">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{apartment.address}</h4>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={onRemove} aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="px-2 py-0.5">{apartment.rooms}-к</Badge>
              <span>{formatArea(apartment.area)}</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{formatPrice(apartment.price)}</span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs">
              <Badge variant="outline" className="px-2 py-0.5 text-muted-foreground">
                {apartment.source}
              </Badge>
              {pricePerMeter > 0 && (
                <span className="text-muted-foreground">{formatPrice(pricePerMeter)}/м²</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpen(apartment)}>
            Подробнее
            <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(apartment.url, '_blank')}>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="mb-4 p-3 rounded-full bg-muted">
        <Heart className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Избранное пусто</h3>
      <p className="text-muted-foreground text-sm mb-4">
        Добавляй понравившиеся квартиры в избранное,<br />чтобы не потерять их
      </p>
      <p className="text-xs text-muted-foreground/70">
        Нажми на сердечко на любой карточке квартиры
      </p>
    </div>
  );
}