import { ExternalLink, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

import { StaticMap, type StaticMapSize } from '@/components/maps/static-map';
import { Badge } from '@/components/ui/badge';
import { googleMapsUrl } from '@/lib/geocoding';
import { cn } from '@/lib/utils';

export type PinnedPlaceCardProps = {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  size?: StaticMapSize;
  /** Short label chipped onto the map, e.g. "Branch pin". */
  sourceChip?: ReactNode;
  /** Rendered beside the location details on wide screens. */
  aside?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function PinnedPlaceCard({
  name,
  address,
  latitude,
  longitude,
  size = 'md',
  sourceChip,
  aside,
  actions,
  footer,
  className,
}: PinnedPlaceCardProps) {
  return (
    <section
      className={cn(
        'border-border/70 bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm',
        className
      )}
    >
      <StaticMap
        latitude={latitude}
        longitude={longitude}
        size={size}
        alt={`Map of ${name}`}
        className='border-border/70 rounded-none border-b'
      >
        {sourceChip ? (
          <span className='border-border bg-background/95 text-foreground absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs shadow-sm'>
            <MapPin className='text-primary h-3 w-3' />
            {sourceChip}
          </span>
        ) : null}
      </StaticMap>

      <div
        className={cn(
          'grid gap-5 p-4 sm:p-5',
          aside ? 'md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]' : null
        )}
      >
        <div className='flex min-w-0 flex-col gap-2.5'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            Location
          </p>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-base font-semibold'>{name}</p>
            {address && address !== name ? (
              <p className='text-muted-foreground text-sm'>{address}</p>
            ) : null}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline' className='font-mono tabular-nums'>
              {formatCoordinates(latitude, longitude)}
            </Badge>
            <a
              href={googleMapsUrl(latitude, longitude)}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
            >
              <ExternalLink className='h-3.5 w-3.5' />
              Open in Maps
            </a>
          </div>
          {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
        </div>
        {aside ? <div className='min-w-0'>{aside}</div> : null}
      </div>

      {footer ? <div className='border-border/70 border-t px-4 py-3 sm:px-5'>{footer}</div> : null}
    </section>
  );
}
