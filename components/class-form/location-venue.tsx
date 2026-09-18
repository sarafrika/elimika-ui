'use client';

import { MapPin, Video } from 'lucide-react';
import { useId } from 'react';

import LocationInput from '@/components/locationInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { coordinatesFromPlace } from '@/lib/location-types';
import type { DeliveryMode } from '@/lib/rate-card';

export type Delivery = DeliveryMode;

/** Where a class meets, for the delivery already picked: a pinned place, a link, or both. */
export function LocationVenue({
  delivery,
  meetingLink,
  onMeetingLinkChange,
  locationName,
  onLocationNameChange,
  locationLatitude,
  onLocationLatitudeChange,
  locationLongitude,
  onLocationLongitudeChange,
}: {
  delivery: Delivery | null;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  locationName: string;
  onLocationNameChange: (value: string) => void;
  locationLatitude: string;
  onLocationLatitudeChange: (value: string) => void;
  locationLongitude: string;
  onLocationLongitudeChange: (value: string) => void;
}) {
  const fieldId = useId();

  if (!delivery) {
    return (
      <div className='border-border bg-muted/30 text-muted-foreground rounded-md border border-dashed px-4 py-5 text-center text-sm'>
        Pick how the class is delivered to set where it happens.
      </div>
    );
  }

  const physical = delivery !== 'ONLINE';
  const online = delivery !== 'IN_PERSON';

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {physical ? (
        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${fieldId}-place`} className='flex items-center gap-1.5'>
            <MapPin className='text-muted-foreground size-3.5' aria-hidden />
            Location <span className='text-destructive'>*</span>
          </Label>
          <LocationInput
            value={locationName}
            onChange={onLocationNameChange}
            placeholder='Search for the venue — e.g. Nairobi Campus, Lab 2'
            coordinates={{ latitude: locationLatitude, longitude: locationLongitude }}
            onSuggest={response => {
              const { latitude, longitude } = coordinatesFromPlace(response);
              if (latitude !== undefined) onLocationLatitudeChange(String(latitude));
              if (longitude !== undefined) onLocationLongitudeChange(String(longitude));
            }}
          />
          <p className='text-muted-foreground text-xs'>
            {locationLatitude && locationLongitude
              ? `Pinned at ${Number(locationLatitude).toFixed(5)}, ${Number(locationLongitude).toFixed(5)}.`
              : 'Search to pin this class on the map, or just type your own venue name.'}
          </p>
        </div>
      ) : null}

      {online ? (
        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${fieldId}-link`} className='flex items-center gap-1.5'>
            <Video className='text-muted-foreground size-3.5' aria-hidden />
            Meeting link <span className='text-destructive'>*</span>
          </Label>
          <Input
            id={`${fieldId}-link`}
            type='url'
            value={meetingLink}
            onChange={event => onMeetingLinkChange(event.target.value)}
            placeholder='https://meet.…'
          />
        </div>
      ) : null}
    </div>
  );
}
