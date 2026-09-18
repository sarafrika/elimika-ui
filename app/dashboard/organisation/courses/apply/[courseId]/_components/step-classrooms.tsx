'use client';

import { Building2, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import type { Dispatch } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

import type { ApplyAction, ApplyState } from './apply-model';
import { useOfferableVenues } from './use-offerable-venues';

/** Organisation applicants pick the venues at their branches they would teach in. */
export function StepClassrooms({
  state,
  dispatch,
  organisationUuid,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  organisationUuid: string;
}) {
  const { venues, groups, query } = useOfferableVenues(organisationUuid, true);
  const selected = new Set(state.venueUuids);

  return (
    <div className='space-y-4'>
      <div className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3'>
        <p className='text-muted-foreground text-sm'>
          Pick the venues where you would teach in-person and hybrid classes. Skip this if you only
          teach online.
        </p>
        <Badge variant='secondary'>{selected.size} selected</Badge>
      </div>

      <AsyncSection
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => void query.refetch()}
        errorTitle='Couldn’t load your venues'
        empty={venues.length === 0}
        skeleton={<VenuePickerSkeleton />}
        emptyState={
          <EmptyState
            variant='compact'
            icon={Building2}
            title='No venues yet'
            description='Add the rooms and labs at your branches, then come back to offer them.'
            action={
              <Button asChild variant='outline' size='sm'>
                <Link href={dashboardUrl('organisation', 'venues')}>Add venues</Link>
              </Button>
            }
          />
        }
      >
        <div className='space-y-5'>
          {groups.map(group => (
            <section key={group.branchUuid} className='space-y-2'>
              <h3 className='text-foreground text-sm font-semibold'>{group.branchName}</h3>
              <div className='grid gap-3 sm:grid-cols-2'>
                {group.venues.map(venue => {
                  const uuid = venue.uuid as string;
                  const checked = selected.has(uuid);
                  return (
                    <label
                      key={uuid}
                      htmlFor={`venue-${uuid}`}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                        checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                      )}
                    >
                      <Checkbox
                        id={`venue-${uuid}`}
                        checked={checked}
                        onCheckedChange={() => dispatch({ type: 'toggleVenue', uuid })}
                        className='mt-0.5'
                      />
                      <span className='min-w-0 flex-1 space-y-1'>
                        <span className='text-foreground block font-medium'>{venue.name}</span>
                        <span className='text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs'>
                          {venue.seat_capacity ? (
                            <span className='inline-flex items-center gap-1'>
                              <Users aria-hidden className='size-3' />
                              {venue.seat_capacity} seats
                            </span>
                          ) : null}
                          {venue.location_name ? (
                            <span className='inline-flex items-center gap-1'>
                              <MapPin aria-hidden className='size-3' />
                              {venue.location_name}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </AsyncSection>
    </div>
  );
}

function VenuePickerSkeleton() {
  return (
    <div className='space-y-2'>
      <Skeleton className='h-4 w-40' />
      <div className='grid gap-3 sm:grid-cols-2'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-[74px] w-full rounded-lg' />
        ))}
      </div>
    </div>
  );
}
