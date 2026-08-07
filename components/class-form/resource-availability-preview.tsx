// @ts-nocheck -- @hey-api generated-client type drift on calendar entries
'use client';

import { useQueries } from '@tanstack/react-query';
import { CalendarCheck2, CalendarX2, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { localDate } from '@/lib/date';
import type { OrganisationResource, ResourceCalendarEntry } from '@/services/client';
import { getCalendarOptions } from '@/services/client/@tanstack/react-query.gen';

export type PreviewWindow = { start: Date; end: Date };

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

const ENTRY_STYLES: Record<string, string> = {
  OPEN_HOURS: 'border-success/40 bg-success/10 text-success',
  BLACKOUT: 'border-destructive/40 bg-destructive/10 text-destructive',
  HOLD: 'border-warning/40 bg-warning/10 text-warning-foreground',
  CONFIRMED: 'border-primary/40 bg-primary/10 text-primary',
};

const ENTRY_LABELS: Record<string, string> = {
  OPEN_HOURS: 'Open',
  BLACKOUT: 'Blackout',
  HOLD: 'Job hold',
  CONFIRMED: 'Booked',
};

function overlaps(a: PreviewWindow, b: { start: Date; end: Date }) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Warns before submitting that a resource is already spoken for.
 *
 * There is no server-side dry-run: ResourceBookingService.validateBookings has no
 * controller, so the only authoritative signal is the 409 on POST. This overlays the
 * projected occurrences on each resource's own calendar to catch the common cases
 * first. Equipment quantity arithmetic is server-only and is not reproduced here.
 */
export function ResourceAvailabilityPreview({
  organisationUuid,
  resources,
  windows,
}: {
  organisationUuid: string;
  resources: OrganisationResource[];
  windows: PreviewWindow[];
}) {
  const range = useMemo(() => {
    if (windows.length === 0) return null;
    const starts = windows.map(w => w.start.getTime());
    const ends = windows.map(w => w.end.getTime());
    return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) };
  }, [windows]);

  const enabled = Boolean(organisationUuid) && resources.length > 0 && range !== null;

  const calendars = useQueries({
    queries: resources.map(resource => ({
      ...getCalendarOptions({
        path: { organisationUuid, resourceUuid: resource.uuid ?? '' },
        // The endpoint binds LocalDate via ISO.DATE — a full timestamp is a 400.
        query: {
          start_date: localDate(range?.start ?? new Date()),
          end_date: localDate(range?.end ?? new Date()),
        },
      }),
      enabled: enabled && Boolean(resource.uuid),
    })),
  });

  const isLoading = calendars.some(q => q.isLoading);
  const failed = calendars.some(q => q.isError);

  const clashes = useMemo(() => {
    const rows: Array<{
      resourceName: string;
      window: PreviewWindow;
      entryType: string;
      note?: string | null;
    }> = [];

    resources.forEach((resource, index) => {
      const entries = (calendars[index]?.data?.data ?? []) as ResourceCalendarEntry[];
      if (entries.length === 0) return;

      const busy = entries.filter(
        e => e.entry_type === 'HOLD' || e.entry_type === 'CONFIRMED' || e.entry_type === 'BLACKOUT'
      );
      const open = entries.filter(e => e.entry_type === 'OPEN_HOURS');

      for (const window of windows) {
        for (const entry of busy) {
          if (!entry.start_time || !entry.end_time) continue;
          if (
            overlaps(window, { start: new Date(entry.start_time), end: new Date(entry.end_time) })
          ) {
            rows.push({
              resourceName: resource.name ?? 'Resource',
              window,
              entryType: entry.entry_type ?? 'HOLD',
              note: entry.notes,
            });
          }
        }

        // A resource with no open-hours rules at all is treated as always open,
        // matching ResourceBookingServiceImpl.checkOpenHours.
        if (open.length > 0) {
          const inside = open.some(entry => {
            if (!entry.start_time || !entry.end_time) return false;
            const s = new Date(entry.start_time);
            const e = new Date(entry.end_time);
            return window.start >= s && window.end <= e;
          });
          if (!inside) {
            rows.push({
              resourceName: resource.name ?? 'Resource',
              window,
              entryType: 'OUTSIDE_OPEN_HOURS',
            });
          }
        }
      }
    });

    return rows;
  }, [calendars, resources, windows]);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className='text-muted-foreground flex items-center gap-2 rounded-lg border p-4 text-xs'>
        <Loader2 className='size-4 animate-spin' />
        Checking resource availability…
      </div>
    );
  }

  // Never imply the resources are free when the check itself did not run.
  if (failed) {
    return (
      <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-xs'>
        Could not check resource availability. Posting will still be validated server-side, and a
        clash will be reported then.
      </div>
    );
  }

  if (clashes.length === 0) {
    return (
      <div className='border-success/40 bg-success/5 flex items-start gap-3 rounded-lg border p-4'>
        <CalendarCheck2 className='text-success mt-0.5 size-4 shrink-0' />
        <div className='space-y-0.5'>
          <div className='text-sm font-semibold'>Resources look free for these sessions</div>
          <p className='text-muted-foreground text-xs'>
            Posting this job places a hold on {resources.length}{' '}
            {resources.length === 1 ? 'resource' : 'resources'} for every session above. Final
            confirmation still happens server-side on submit.
          </p>
        </div>
      </div>
    );
  }

  const shown = clashes.slice(0, 8);

  return (
    <div className='border-warning/40 bg-warning/5 space-y-3 rounded-lg border p-4'>
      <div className='flex items-start gap-3'>
        <CalendarX2 className='text-warning-foreground mt-0.5 size-4 shrink-0' />
        <div className='space-y-0.5'>
          <div className='text-sm font-semibold'>
            {clashes.length} session{clashes.length === 1 ? '' : 's'} may not be reservable
          </div>
          <p className='text-muted-foreground text-xs'>
            These windows overlap something already on the resource calendar. Submitting will be
            rejected unless the clash is resolved.
          </p>
        </div>
      </div>

      <div className='space-y-1.5'>
        {shown.map((clash, index) => (
          <div
            key={`${clash.resourceName}-${clash.window.start.getTime()}-${index}`}
            className='bg-card flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs'
          >
            <span className='font-medium'>{clash.resourceName}</span>
            <span className='text-muted-foreground'>
              {dayFormat.format(clash.window.start)} · {timeFormat.format(clash.window.start)} –{' '}
              {timeFormat.format(clash.window.end)}
            </span>
            <Badge
              variant='outline'
              className={`ml-auto shrink-0 text-[10px] ${
                ENTRY_STYLES[clash.entryType] ?? 'border-warning/40 bg-warning/10'
              }`}
            >
              {ENTRY_LABELS[clash.entryType] ?? 'Outside open hours'}
            </Badge>
          </div>
        ))}
        {clashes.length > shown.length ? (
          <div className='text-muted-foreground text-xs'>
            …and {clashes.length - shown.length} more
          </div>
        ) : null}
      </div>
    </div>
  );
}
