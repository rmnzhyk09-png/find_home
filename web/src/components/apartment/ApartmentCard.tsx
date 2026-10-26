import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ExternalLink, MapPin, Layers, Home, Building2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { cn, formatPrice, formatArea, formatPricePerMeter, formatPriceShort, getSourceColor, truncate, cn as _cn } from '@/lib/utils';
import type { Apartment } from '@/types';

interface ApartmentCardProps {
  apartment: Apartment;
  isFavorite?: boolean;
  onToggleFavorite?: (apartment: Apartment) => void;
  onOpen?: (apartment: Apartment) => void;
  index?: number;
  variant?: 'default' | 'compact' | 'featured';
}

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Дом.РФ': Building2,
  'M2.ru': Home,
  'Циан': Home,
  'ДомКлик': Layers,
};

export function ApartmentCard({ 
  apartment, 
  isFavorite = false, 
  onToggleFavorite, 
  onOpen,
  index = 0,
  variant = 'default'
}: ApartmentCardProps) {
  const pricePerMeter = apartment.pricePerMeter || (apartment.area > 0 ? Math.round(apartment.price / apartment.area) : 0);
  const SourceIcon = sourceIcons[apartment.source] || MapPin;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ delay: index * 0.05 }}
        className="group relative bg-card rounded-xl border p-4 hover:shadow-card-hover transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
            <SourceIcon className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm truncate">{truncate(apartment.address, 40)}</h4>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8 p-0', isFavorite && 'text-red-500')}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(apartment); }}
                aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="px-2 py-0.5">{apartment.rooms}-к</Badge>
              <span>{formatArea(apartment.area)}</span>
              <span>•</span>
              <span>{formatPriceShort(apartment.price)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">{truncate(apartment.description, 60)}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={cn('px-2 py-0.5 rounded text-xs', getSourceColor(apartment.source))}>
                {apartment.source}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
      onClick={() => onOpen?.(apartment)}
    >
      <Card className="h-full overflow-hidden cursor-pointer">
        {/* Image placeholder */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <SourceIcon className="text-primary/30 h-12 w-12" />
          </div>
          
          {/* Favorite button */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur', isFavorite && 'text-red-500')}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(apartment); }}
              aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </Button>
          </div>

          {/* Source badge */}
          <div className="absolute bottom-3 left-3">
            <Badge className={cn('px-2.5 py-1 text-xs', getSourceColor(apartment.source))}>
              <span className="flex items-center gap-1">{SourceIcon && React.createElement(SourceIcon, { className: 'h-3.5 w-3.5' })} {apartment.source}</span>
            </Badge>
          </div>

          {/* Price per meter badge */}
          {pricePerMeter > 0 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                {formatPrice(pricePerMeter)}/м²
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 pb-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1 pr-2">{apartment.address}</h3>
            <span className="text-xl font-bold text-primary whitespace-nowrap">{formatPrice(apartment.price)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3 w-3" />
              {apartment.rooms}-комнатная
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Home className="h-3 w-3" />
              {formatArea(apartment.area)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Building2 className="h-3 w-3" />
              {apartment.floor}/{apartment.totalFloors} этаж
            </Badge>
            {apartment.district !== '—' && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {apartment.district}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{apartment.description}</p>

          {apartment.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {apartment.features.slice(0, 4).map((feature, i) => (
                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5">
                  {feature}
                </Badge>
              ))}
              {apartment.features.length > 4 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                  +{apartment.features.length - 4}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={(e) => { e.stopPropagation(); window.open(apartment.url, '_blank'); }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Открыть
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}

export function ApartmentSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="animate-pulse bg-card rounded-xl border p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="animate-pulse">
      <Card className="h-full overflow-hidden">
        <div className="aspect-[4/3] bg-muted" />
        <CardContent className="p-4 pb-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
          <div className="h-9 w-full bg-muted rounded-lg mt-2" />
        </CardContent>
      </Card>
    </article>
  );
}