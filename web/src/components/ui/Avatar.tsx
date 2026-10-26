import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  
  if (src && !error) {
    return (
      <div
        className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full', sizes[size], className)}
        {...props}
      >
        <img
          src={src}
          alt={alt || fallback || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }
  
  const initials = fallback
    ? fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';
  
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium',
        sizes[size],
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({ children, className, max = 5, ...props }: React.HTMLAttributes<HTMLDivElement> & { max?: number; children: React.ReactNode }) {
  const kids = React.Children.toArray(children).slice(0, max);
  
  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {kids.map((child, index) => {
        const kid = child as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
        return React.cloneElement(kid, {
          className: cn('ring-2 ring-background', kid.props.className),
          style: { zIndex: max - index, ...kid.props.style },
        });
      })}
    </div>
  );
}