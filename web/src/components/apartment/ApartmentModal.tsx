import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MapPin, Layers, Home, Building2, Heart, Share2, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { formatPrice, formatArea, formatPricePerMeter, getSourceColor, cn } from '@/lib/utils';
import type { Apartment } from '@/types';
import { useFavoritesStore } from '@/lib/stores';

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Дом.РФ': Building2,
  'M2.ru': Home,
  'Циан': Home,
  'ДомКлик': Layers,
};

interface ApartmentModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApartmentModal({ apartment, isOpen, onClose }: ApartmentModalProps) {
  const { toggle: toggleFavorite, isFavorite } = useFavoritesStore();
  const favorite = apartment ? isFavorite(apartment.url) : false;
  const pricePerMeter = apartment?.pricePerMeter || (apartment && apartment.area > 0 ? Math.round(apartment.price / apartment.area) : 0);
  const SourceIcon: React.ComponentType<{ className?: string }> = apartment ? (sourceIcons[apartment.source] || MapPin) : MapPin;

  if (!apartment || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with image */}
          <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <SourceIcon className="text-primary/30 h-20 w-20" />

            </div>

            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              <Badge className={cn('px-3 py-1.5', getSourceColor(apartment.source))}>
                <span className="flex items-center gap-1.5">{SourceIcon && React.createElement(SourceIcon, { className: 'h-4 w-4' })} {apartment.source}</span>
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur"
                onClick={onClose}
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <Badge variant="secondary" className="px-3 py-1.5 text-base gap-2">
                  <Layers className="h-4 w-4" />
                  {apartment.rooms}-комнатная квартира
                </Badge>
                {apartment.district !== '—' && (
                  <Badge variant="outline" className="ml-2 mt-2 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                    <MapPin className="h-4 w-4" />
                    {apartment.district}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur', favorite && 'text-red-500')}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(apartment); }}
                  aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  <Heart className={cn('h-5 w-5', favorite && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur"
                  onClick={(e) => { e.stopPropagation(); navigator.share?.({ title: apartment.address, url: apartment.url }); }}
                  aria-label="Поделиться"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[calc(90vh-300px)] pr-2">
            <CardContent className="p-6 pb-8 space-y-6">
              {/* Price and address */}
              <div className="space-y-2">
                <h2 id="modal-title" className="text-2xl font-bold">{apartment.address}</h2>
                <div className="flex items-baseline gap-4 flex-wrap">
                  <span className="text-3xl font-bold text-primary">{formatPrice(apartment.price)}</span>
                  {pricePerMeter > 0 && (
                    <span className="text-lg text-muted-foreground">{formatPrice(pricePerMeter)}/м²</span>
                  )}
                </div>
              </div>

              {/* Key specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SpecItem icon={<Home className="h-5 w-5" />} label="Площадь" value={formatArea(apartment.area)} />
                <SpecItem icon={<Layers className="h-5 w-5" />} label="Этаж" value={`${apartment.floor} / ${apartment.totalFloors}`} />
                <SpecItem icon={<Building2 className="h-5 w-5" />} label="Комнат" value={`${apartment.rooms}`} />
                <SpecItem icon={<Calendar className="h-5 w-5" />} label="Источник" value={apartment.source} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Описание</h3>
                <p className="text-muted-foreground whitespace-pre-line">{apartment.description}</p>
              </div>

              {/* Features */}
              {apartment.features.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Особенности</h3>
                  <div className="flex flex-wrap gap-2">
                    {apartment.features.map((feature, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1.5">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => { window.open(apartment.url, '_blank'); onClose(); }}
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Открыть на сайте источника
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => { navigator.clipboard.writeText(apartment.url); }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </span>
                    Скопировать ссылку
                  </span>
                </Button>
              </div>
            </CardContent>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="font-semibold ml-7">{value}</div>
    </div>
  );
}