'use client';

import { useMemo } from 'react';
import { useTimeZone } from '@/context/timezone-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Common fallback zones for browsers without `Intl.supportedValuesOf`. */
const FALLBACK_ZONES = [
  'UTC',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function listTimeZones(active: string): string[] {
  let zones: string[] = [];
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf?.('timeZone');
    if (supported?.length) {
      zones = supported;
    }
  } catch {
    // Fall back to the curated list below.
  }
  if (!zones.length) {
    zones = FALLBACK_ZONES;
  }
  if (active && !zones.includes(active)) {
    zones = [active, ...zones];
  }
  return zones;
}

/**
 * Interactive replacement for the previously static "Default timezone" field.
 * Reflects the viewer's active display zone (auto-detected by default) and lets
 * them override it; the choice is persisted and drives every timestamp the app
 * renders via {@link useTimeZone}.
 */
export function TimezoneSetting({ className }: { className?: string }) {
  const { zone, source, setPreferredZone } = useTimeZone();
  const zones = useMemo(() => listTimeZones(zone), [zone]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label className='text-foreground/90 text-[0.82rem] font-medium'>Default timezone</Label>
      <select
        value={zone}
        onChange={event => setPreferredZone(event.target.value)}
        className='border-border/70 bg-background/70 h-11 w-full rounded-md border px-3 text-sm shadow-none'
        aria-label='Default timezone'
      >
        {zones.map(z => (
          <option key={z} value={z}>
            {z.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      <div className='text-muted-foreground flex items-center justify-between gap-2 text-xs'>
        <span>
          {source === 'preference'
            ? 'Saved preference — all dates and times across the app use this zone.'
            : 'Auto-detected from your browser — all dates and times use this zone.'}
        </span>
        {source === 'preference' ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-auto px-2 py-1 text-xs'
            onClick={() => setPreferredZone(null)}
          >
            Use detected
          </Button>
        ) : null}
      </div>
    </div>
  );
}
