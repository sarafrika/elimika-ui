import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

import { buildStaticMapUrl } from '@/lib/static-map';
import { cn } from '@/lib/utils';

export type StaticMapSize = 'sm' | 'md' | 'lg';

const SIZES: Record<StaticMapSize, { width: number; height: number; className: string }> = {
  sm: { width: 400, height: 200, className: 'h-32' },
  md: { width: 640, height: 320, className: 'h-60' },
  lg: { width: 1200, height: 400, className: 'h-56 sm:h-64' },
};

export type StaticMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number;
  size?: StaticMapSize;
  alt: string;
  className?: string;
  /** Overlays (chips, badges) positioned absolutely over the map. */
  children?: ReactNode;
};

function isCoordinate(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function StaticMap({
  latitude,
  longitude,
  zoom = 15,
  size = 'md',
  alt,
  className,
  children,
}: StaticMapProps) {
  const dimensions = SIZES[size];
  const url =
    isCoordinate(latitude) && isCoordinate(longitude)
      ? buildStaticMapUrl({
          lat: latitude,
          lng: longitude,
          zoom,
          width: dimensions.width,
          height: dimensions.height,
        })
      : null;

  return (
    <div
      className={cn(
        'bg-muted relative w-full overflow-hidden rounded-lg',
        dimensions.className,
        className
      )}
    >
      {url ? (
        <img src={url} alt={alt} className='h-full w-full object-cover' loading='lazy' />
      ) : (
        <div
          role='img'
          aria-label={alt}
          className='text-muted-foreground flex h-full w-full items-center justify-center'
        >
          <MapPin className='h-6 w-6' />
        </div>
      )}
      {children}
    </div>
  );
}
