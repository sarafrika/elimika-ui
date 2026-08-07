// @ts-nocheck -- generated-client type drift on resource rows
'use client';

import { MapPin, Presentation } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganisationResource } from '@/services/client';

export type Delivery = 'ONLINE' | 'IN_PERSON' | 'HYBRID';

export function LocationVenue({
  delivery,
  onDeliveryChange,
  meetingLink,
  onMeetingLinkChange,
  locationName,
  onLocationNameChange,
  venueUuid,
  onVenueChange,
  venueResources,
  onlyAvailable,
  onOnlyAvailableChange,
  locationLatitude,
  onLocationLatitudeChange,
  locationLongitude,
  onLocationLongitudeChange,
  showVenue = true,
}: {
  delivery: Delivery;
  onDeliveryChange: (v: Delivery) => void;
  meetingLink: string;
  onMeetingLinkChange: (v: string) => void;
  locationName: string;
  onLocationNameChange: (v: string) => void;
  venueUuid: string;
  onVenueChange: (v: string) => void;
  venueResources: OrganisationResource[];
  onlyAvailable: boolean;
  onOnlyAvailableChange: (v: boolean) => void;
  locationLatitude?: string;
  onLocationLatitudeChange?: (v: string) => void;
  locationLongitude?: string;
  onLocationLongitudeChange?: (v: string) => void;
  showVenue?: boolean;
}) {
  const requiresPhysical = delivery === 'IN_PERSON' || delivery === 'HYBRID';
  const requiresLink = delivery === 'ONLINE' || delivery === 'HYBRID';
  return (
    <div className={showVenue ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
      <div className='space-y-2'>
        <Label>
          Location <span className='text-destructive'>*</span>
        </Label>
        <Select value={delivery} onValueChange={v => onDeliveryChange(v as Delivery)}>
          <SelectTrigger>
            <div className='flex items-center gap-2'>
              <MapPin className='text-muted-foreground h-4 w-4' />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ONLINE'>Online</SelectItem>
            <SelectItem value='IN_PERSON'>In person</SelectItem>
            <SelectItem value='HYBRID'>Hybrid</SelectItem>
          </SelectContent>
        </Select>
        {requiresLink ? (
          <Input
            value={meetingLink}
            onChange={e => onMeetingLinkChange(e.target.value)}
            placeholder='https://meet.…'
          />
        ) : null}
        {requiresPhysical ? (
          <Input
            value={locationName}
            onChange={e => onLocationNameChange(e.target.value)}
            placeholder='Location name — e.g. Nairobi Campus, Lab 2'
          />
        ) : null}
        {requiresPhysical && onLocationLatitudeChange && onLocationLongitudeChange ? (
          <div className='grid grid-cols-2 gap-2'>
            <Input
              value={locationLatitude ?? ''}
              onChange={e => onLocationLatitudeChange(e.target.value)}
              placeholder='Latitude — e.g. -1.292066'
              inputMode='decimal'
            />
            <Input
              value={locationLongitude ?? ''}
              onChange={e => onLocationLongitudeChange(e.target.value)}
              placeholder='Longitude — e.g. 36.821945'
              inputMode='decimal'
            />
          </div>
        ) : null}
      </div>
      {showVenue ? (
      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <Label>Classroom / Venue</Label>
          <label className='text-muted-foreground flex cursor-pointer items-center gap-1.5 text-[11px]'>
            <Checkbox
              checked={onlyAvailable}
              onCheckedChange={v => onOnlyAvailableChange(v === true)}
              className='h-3.5 w-3.5'
            />
            Only available
          </label>
        </div>
        <Select
          value={venueUuid || 'none'}
          onValueChange={v => onVenueChange(v === 'none' ? '' : v)}
        >
          <SelectTrigger>
            <div className='flex items-center gap-2'>
              <Presentation className='text-muted-foreground h-4 w-4' />
              <SelectValue placeholder='No venue' />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No venue</SelectItem>
            {venueResources.map(v => (
              <SelectItem key={v.uuid} value={v.uuid ?? ''}>
                {v.name}
                {v.seat_capacity != null ? ` · ${v.seat_capacity} seats` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      ) : null}
    </div>
  );
}
