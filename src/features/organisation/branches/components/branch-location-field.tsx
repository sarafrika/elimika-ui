'use client';

import {
  ChevronDown,
  Info,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import LocationInput from '@/components/locationInput';
import { formatCoordinates } from '@/components/maps/pinned-place-card';
import { StaticMap } from '@/components/maps/static-map';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { useReverseGeocode } from '@/hooks/use-reverse-geocode';
import { coordinatesFromPlace } from '@/lib/location-types';
import { cn } from '@/lib/utils';
import type { BranchFormValues, LocationSource } from './createedit-branch-form';

const SOURCE_LABELS: Record<LocationSource, string> = {
  search: 'From address search',
  device: 'From your current location',
  manual: 'Entered by hand',
};

const COORDINATE_RANGE_ERROR =
  'Latitude must be between -90 and 90, longitude between -180 and 180.';

function isCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function pinKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

function geolocationMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access is blocked. Allow it for this site in your browser settings, or search for the address.';
    case error.TIMEOUT:
      return 'Finding your location took too long. Try again, or search for the address.';
    default:
      return 'Your location is unavailable right now. Search for the address or enter coordinates.';
  }
}

/**
 * The branch pin is the location of every class and job at the branch. It can come
 * from an address search, the device, or typed coordinates; the last two fill the
 * address by reverse geocoding, which the organiser can still correct by hand.
 */
export function BranchLocationField() {
  const { control, setValue } = useFormContext<BranchFormValues>();
  const [latitude, longitude, source] = useWatch({
    control,
    name: ['latitude', 'longitude', 'location_source'],
  });
  const { errors } = useFormState({ control, name: ['latitude', 'longitude'] });
  const pinError = errors.latitude?.message ?? errors.longitude?.message;

  const hasPin = isCoordinate(latitude) && isCoordinate(longitude);
  const currentKey = hasPin ? pinKey(latitude, longitude) : null;

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const [filledFromPin, setFilledFromPin] = useState(false);
  // The pin whose address we still owe the organiser; cleared once filled or typed over.
  const [lookupKey, setLookupKey] = useState<string | null>(null);

  const lookupActive = lookupKey !== null && lookupKey === currentKey;
  const reverse = useReverseGeocode(latitude, longitude, { enabled: lookupActive });
  const lookupLoading = lookupActive && reverse.isFetching;
  const lookupFailed = lookupActive && reverse.isError && !reverse.isFetching;

  useEffect(() => {
    if (!lookupActive || !reverse.data) return;
    setValue('address', reverse.data, { shouldDirty: true, shouldValidate: true });
    setFilledFromPin(true);
    setLookupKey(null);
  }, [lookupActive, reverse.data, setValue]);

  const setPin = (nextLatitude: number, nextLongitude: number, nextSource: LocationSource) => {
    setValue('latitude', nextLatitude, { shouldDirty: true, shouldValidate: true });
    setValue('longitude', nextLongitude, { shouldDirty: true, shouldValidate: true });
    setValue('location_source', nextSource, { shouldDirty: true });
    setFilledFromPin(false);
    setLocateError(null);
    setLookupKey(nextSource === 'search' ? null : pinKey(nextLatitude, nextLongitude));
  };

  return (
    <div className='flex flex-col gap-2.5'>
      <FormField
        control={control}
        name='address'
        render={({ field }) => (
          <FormItem>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <FormLabel>
                Location <span className='text-destructive'>*</span>
              </FormLabel>
              <span className='text-muted-foreground text-xs'>
                Search, use where you are, or enter coordinates
              </span>
            </div>
            <div className='relative'>
              <FormControl>
                <LocationInput
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={value => {
                    field.onChange(value);
                    setFilledFromPin(false);
                    setLookupKey(null);
                  }}
                  onBlur={field.onBlur}
                  placeholder='Search for the address — e.g. 123 Waiyaki Way'
                  showMapPreview={false}
                  className={cn('pl-9', filledFromPin ? 'pr-32' : null)}
                  onSuggest={response => {
                    const place = coordinatesFromPlace(response);
                    if (isCoordinate(place.latitude) && isCoordinate(place.longitude)) {
                      setPin(place.latitude, place.longitude, 'search');
                    }
                  }}
                />
              </FormControl>
              <span className='text-muted-foreground pointer-events-none absolute top-0 left-3 flex h-9 items-center'>
                <Search className='h-4 w-4' />
              </span>
              {filledFromPin ? (
                <span className='pointer-events-none absolute top-0 right-2 flex h-9 items-center'>
                  <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary'>
                    <MapPin />
                    Filled from pin
                  </Badge>
                </span>
              ) : null}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {lookupLoading ? (
        <div className='text-muted-foreground flex items-center gap-1.5 text-xs' aria-live='polite'>
          <Spinner className='h-3.5 w-3.5' />
          Looking up the address for this pin…
        </div>
      ) : null}

      {lookupFailed ? (
        <Alert className='border-warning/60 bg-warning/10 [&>svg]:text-warning'>
          <TriangleAlert />
          <AlertTitle>No address found for this pin.</AlertTitle>
          <AlertDescription>
            <p>The pin is kept — type the address yourself, or try the lookup again.</p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => void reverse.refetch()}
            >
              <RefreshCw className='h-3.5 w-3.5' />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {filledFromPin ? (
        <p className='text-muted-foreground text-xs'>
          We filled the address from the pin. Edit it if the street name is off — the pin stays
          where it is.
        </p>
      ) : null}

      <Collapsible open={fineTuneOpen} onOpenChange={setFineTuneOpen}>
        <div className='flex flex-wrap items-center gap-2'>
          <UseMyLocationButton
            onStart={() => {
              setLocating(true);
              setLocateError(null);
            }}
            onLocated={(nextLatitude, nextLongitude) => {
              setLocating(false);
              setPin(nextLatitude, nextLongitude, 'device');
            }}
            onFailed={message => {
              setLocating(false);
              setLocateError(message);
            }}
          />
          <CollapsibleTrigger asChild>
            <Button type='button' variant='ghost' size='sm'>
              <SlidersHorizontal className='h-4 w-4' />
              Fine-tune coordinates
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  fineTuneOpen ? 'rotate-180' : null
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        {locateError ? (
          <p role='alert' className='text-destructive mt-2 text-xs'>
            {locateError}
          </p>
        ) : null}
        <CollapsibleContent className='mt-2.5'>
          <FineTuneCoordinates
            latitude={latitude}
            longitude={longitude}
            onCommit={(nextLatitude, nextLongitude) =>
              setPin(nextLatitude, nextLongitude, 'manual')
            }
          />
        </CollapsibleContent>
      </Collapsible>

      <PinPreview latitude={latitude} longitude={longitude} source={source} locating={locating} />

      {pinError && !hasPin ? (
        <p className='text-destructive flex items-center gap-1.5 text-sm'>
          <Info className='h-3.5 w-3.5' />
          {pinError}
        </p>
      ) : null}
    </div>
  );
}

function UseMyLocationButton({
  onStart,
  onLocated,
  onFailed,
}: {
  onStart: () => void;
  onLocated: (latitude: number, longitude: number) => void;
  onFailed: (message: string) => void;
}) {
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onFailed(
        'This browser can’t share your location. Search for the address or enter coordinates.'
      );
      return;
    }
    setLocating(true);
    onStart();
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocating(false);
        onLocated(position.coords.latitude, position.coords.longitude);
      },
      error => {
        setLocating(false);
        onFailed(geolocationMessage(error));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Button type='button' variant='outline' size='sm' onClick={locate} disabled={locating}>
      {locating ? <Spinner className='h-4 w-4' /> : <LocateFixed className='h-4 w-4' />}
      {locating ? 'Locating…' : 'Use my current location'}
    </Button>
  );
}

function toCoordinateText(value?: number) {
  return isCoordinate(value) ? value.toFixed(5) : '';
}

function FineTuneCoordinates({
  latitude,
  longitude,
  onCommit,
}: {
  latitude?: number;
  longitude?: number;
  onCommit: (latitude: number, longitude: number) => void;
}) {
  const latitudeId = useId();
  const longitudeId = useId();
  const [latitudeText, setLatitudeText] = useState(() => toCoordinateText(latitude));
  const [longitudeText, setLongitudeText] = useState(() => toCoordinateText(longitude));
  const [dirty, setDirty] = useState(false);
  const [rangeError, setRangeError] = useState(false);

  // A pin set elsewhere (search, device) replaces the text unless it already says the same.
  useEffect(() => {
    setLatitudeText(text =>
      Number(text) === latitude && text !== '' ? text : toCoordinateText(latitude)
    );
    setLongitudeText(text =>
      Number(text) === longitude && text !== '' ? text : toCoordinateText(longitude)
    );
    setDirty(false);
    setRangeError(false);
  }, [latitude, longitude]);

  const handleChange = (axis: 'latitude' | 'longitude', text: string) => {
    setDirty(true);
    const [pastedLatitude, pastedLongitude, ...rest] = text.split(',').map(part => part.trim());
    const isPastedPair =
      rest.length === 0 &&
      [pastedLatitude, pastedLongitude].every(part => part && Number.isFinite(Number(part)));
    if (isPastedPair && pastedLatitude && pastedLongitude) {
      setLatitudeText(pastedLatitude);
      setLongitudeText(pastedLongitude);
      return;
    }
    if (axis === 'latitude') setLatitudeText(text);
    else setLongitudeText(text);
  };

  const commit = () => {
    if (!dirty || latitudeText.trim() === '' || longitudeText.trim() === '') return;
    const nextLatitude = Number(latitudeText);
    const nextLongitude = Number(longitudeText);
    if (
      !Number.isFinite(nextLatitude) ||
      !Number.isFinite(nextLongitude) ||
      Math.abs(nextLatitude) > 90 ||
      Math.abs(nextLongitude) > 180
    ) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setDirty(false);
    onCommit(nextLatitude, nextLongitude);
  };

  return (
    <div className='border-border/70 bg-muted/30 flex flex-col gap-2.5 rounded-lg border p-3'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='grid gap-1.5'>
          <Label htmlFor={latitudeId} className='text-xs'>
            Latitude
          </Label>
          <Input
            id={latitudeId}
            inputMode='decimal'
            value={latitudeText}
            onChange={event => handleChange('latitude', event.target.value)}
            onBlur={commit}
            placeholder='-1.26412'
            aria-invalid={rangeError}
            className='font-mono tabular-nums'
          />
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor={longitudeId} className='text-xs'>
            Longitude
          </Label>
          <Input
            id={longitudeId}
            inputMode='decimal'
            value={longitudeText}
            onChange={event => handleChange('longitude', event.target.value)}
            onBlur={commit}
            placeholder='36.80474'
            aria-invalid={rangeError}
            className='font-mono tabular-nums'
          />
        </div>
      </div>
      {rangeError ? <p className='text-destructive text-xs'>{COORDINATE_RANGE_ERROR}</p> : null}
      <p className='text-muted-foreground text-xs'>
        Paste from Google Maps or nudge by hand. When you leave a field we look up the address for
        the new pin.
      </p>
    </div>
  );
}

const MAP_CHIP =
  'border-border bg-background/95 text-foreground absolute inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs shadow-sm';
const MAP_FRAME =
  'border-border bg-muted/40 text-muted-foreground flex h-60 flex-col items-center justify-center gap-1.5 rounded-lg border p-4 text-center text-sm';

function PinPreview({
  latitude,
  longitude,
  source,
  locating,
}: {
  latitude?: number;
  longitude?: number;
  source?: LocationSource;
  locating: boolean;
}) {
  if (locating) {
    return (
      <div className={MAP_FRAME} aria-live='polite'>
        <Spinner className='h-6 w-6' />
        <p className='text-foreground font-semibold'>Finding your location…</p>
        <p>Allow location access if your browser asks.</p>
      </div>
    );
  }

  if (!isCoordinate(latitude) || !isCoordinate(longitude)) {
    return (
      <div className={cn(MAP_FRAME, 'border-dashed')}>
        <MapPin className='h-6 w-6' />
        <p className='text-foreground font-semibold'>No pin yet</p>
        <p className='max-w-sm'>
          Search for the address or use your current location. Every class and job at this branch
          trains at this pin.
        </p>
      </div>
    );
  }

  return (
    <StaticMap
      latitude={latitude}
      longitude={longitude}
      size='md'
      alt='Map preview of the branch pin'
      className='border-border border'
    >
      <span className={cn(MAP_CHIP, 'top-2.5 left-2.5')}>
        <MapPin className='text-primary h-3 w-3' />
        {source ? SOURCE_LABELS[source] : 'Saved pin'}
      </span>
      <span className={cn(MAP_CHIP, 'bottom-2.5 left-2.5 font-mono tabular-nums')}>
        {formatCoordinates(latitude, longitude)}
      </span>
    </StaticMap>
  );
}
