'use client';

import Link from 'next/link';
import { useId } from 'react';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OrganisationResource } from '@/services/client';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

const NO_VENUE = '__none__';

export function venueTooSmall(venue?: OrganisationResource | null, maxParticipants?: number) {
  return (
    typeof venue?.seat_capacity === 'number' &&
    typeof maxParticipants === 'number' &&
    maxParticipants > 0 &&
    venue.seat_capacity < maxParticipants
  );
}

export function VenueRadioList({
  venues,
  branchName,
  value,
  onChange,
  maxParticipants,
  loading,
  disabled,
}: {
  venues: OrganisationResource[];
  branchName: string;
  value: string;
  onChange: (venueUuid: string) => void;
  maxParticipants?: number;
  loading?: boolean;
  disabled?: boolean;
}) {
  const fieldId = useId();
  const selected = venues.find(venue => venue.uuid === value);

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label id={`${fieldId}-label`}>Venue</Label>
        {loading ? null : (
          <span className='text-muted-foreground text-xs'>
            {venues.length} at {branchName}
          </span>
        )}
      </div>

      {loading ? (
        <div className='space-y-1 rounded-md border p-1'>
          {[0, 1, 2].map(row => (
            <Skeleton key={row} className='h-11 w-full' />
          ))}
        </div>
      ) : (
        <RadioGroup
          aria-labelledby={`${fieldId}-label`}
          value={value || NO_VENUE}
          onValueChange={next => onChange(next === NO_VENUE ? '' : next)}
          disabled={disabled}
          className='gap-0.5 rounded-md border p-1'
        >
          <VenueOption id={`${fieldId}-none`} value={NO_VENUE} name='No venue' />
          {venues.map(venue => (
            <VenueOption
              key={venue.uuid}
              id={`${fieldId}-${venue.uuid}`}
              value={venue.uuid ?? ''}
              name={venue.name}
              detail={venue.location_name}
              seats={venue.seat_capacity}
              tooSmall={venueTooSmall(venue, maxParticipants)}
            />
          ))}
          {venues.length === 0 ? (
            <p className='text-muted-foreground px-2.5 py-2 text-xs'>
              No venues at {branchName} yet.{' '}
              <Link
                href={dashboardUrl('organisation', 'venues')}
                className='text-primary font-medium hover:underline'
              >
                Add one
              </Link>
            </p>
          ) : null}
        </RadioGroup>
      )}

      {venueTooSmall(selected, maxParticipants) ? (
        <p className='text-warning text-xs'>
          This venue seats fewer than your {maxParticipants} max participants. Lower the cap or pick
          a bigger room.
        </p>
      ) : null}
    </div>
  );
}

function VenueOption({
  id,
  value,
  name,
  detail,
  seats,
  tooSmall,
}: {
  id: string;
  value: string;
  name: string;
  detail?: string | null;
  seats?: number | null;
  tooSmall?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className='hover:bg-muted/60 flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2'
    >
      <RadioGroupItem id={id} value={value} />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium'>{name}</span>
        {detail ? (
          <span className='text-muted-foreground block truncate text-xs'>{detail}</span>
        ) : null}
      </span>
      {typeof seats === 'number' ? (
        <Badge
          variant='outline'
          className={cn(
            tooSmall
              ? 'border-warning/30 bg-warning/10 text-warning'
              : 'bg-muted/60 border-transparent'
          )}
        >
          {seats} seats
        </Badge>
      ) : null}
    </label>
  );
}
