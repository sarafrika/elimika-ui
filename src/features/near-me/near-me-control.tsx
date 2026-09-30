'use client';

import { LocateFixed, MapPin, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  DEFAULT_SEARCH_COUNTRY,
  GEOCODER_URL,
  type PhotonFeature,
  type PlaceSuggestion,
  SEARCH_BIAS,
  toSuggestion,
} from '@/lib/geocoding';
import { cn } from '@/lib/utils';
import type { DistanceBandEnum } from '@/services/client/types.gen';
import { distanceBandLabel, NEAR_ME_RADII, type NearMeState } from './near-me';

function usePlaceSuggestions(term: string) {
  const debounced = useDebouncedValue(term.trim(), 300);
  const [state, setState] = useState<{
    loading: boolean;
    error: boolean;
    places: PlaceSuggestion[];
  }>({ loading: false, error: false, places: [] });

  useEffect(() => {
    if (debounced.length < 3) {
      setState({ loading: false, error: false, places: [] });
      return;
    }
    const controller = new AbortController();
    setState(prev => ({ ...prev, loading: true, error: false }));
    const params = new URLSearchParams({
      q: debounced,
      limit: '8',
      lang: 'en',
      lat: String(SEARCH_BIAS.latitude),
      lon: String(SEARCH_BIAS.longitude),
    });
    fetch(`${GEOCODER_URL}?${params.toString()}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Place search failed: ${response.status}`);
        return response.json() as Promise<{ features?: PhotonFeature[] }>;
      })
      .then(data => {
        const places = (data.features ?? [])
          .filter(feature => feature.properties?.countrycode === DEFAULT_SEARCH_COUNTRY)
          .map(toSuggestion)
          .filter((place): place is PlaceSuggestion => place !== null)
          .slice(0, 6);
        setState({ loading: false, error: false, places });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ loading: false, error: true, places: [] });
      });
    return () => controller.abort();
  }, [debounced]);

  return state;
}

/**
 * "Near me" for a signed-in listing. The browser's location is asked for only when the
 * user clicks "Use my location"; a town can be searched instead (OpenStreetMap/Photon).
 * Coordinates are never shown, are rounded to 2 decimals before they are sent, and stay
 * in component state (never the URL).
 */
export function NearMeControl({
  nearMe,
  className,
  disabled,
}: {
  nearMe: NearMeState;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [town, setTown] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const places = usePlaceSuggestions(open ? town : '');
  const townId = useId();
  const radiusId = useId();

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Your browser cannot share its location. Search for a town instead.');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocating(false);
        nearMe.setPoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'your location',
        });
        setOpen(false);
      },
      error => {
        setLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was declined. Search for a town instead.'
            : 'We could not get your location. Search for a town instead.'
        );
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 }
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant={nearMe.active ? 'secondary' : 'outline'}
            size='sm'
            disabled={disabled}
            aria-label={
              nearMe.active
                ? `Near ${nearMe.point?.label}, within ${nearMe.radiusKm} km. Change`
                : 'Search near me'
            }
          >
            <MapPin className='size-4' />
            <span className='max-w-[14rem] truncate'>
              {nearMe.active
                ? `Near ${nearMe.point?.label} · ${nearMe.radiusKm} km`
                : 'Near me'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-80 space-y-3'>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>Search near a place</p>
            <p className='text-muted-foreground text-xs'>
              Results are matched to within about 1 km. Your location is only used for this
              search and is never saved.
            </p>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='w-full'
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating ? <Spinner /> : <LocateFixed className='size-4' />}
            Use my location
          </Button>
          {geoError ? (
            <p className='text-destructive text-xs' role='alert'>
              {geoError}
            </p>
          ) : null}
          <div className='space-y-1'>
            <Label htmlFor={townId}>Or a town</Label>
            <Input
              id={townId}
              value={town}
              onChange={event => setTown(event.target.value)}
              placeholder='e.g. Westlands, Nakuru'
              autoComplete='off'
            />
            {places.loading ? (
              <p className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Spinner /> Searching places…
              </p>
            ) : places.error ? (
              <p className='text-destructive text-xs' role='alert'>
                Place search is unavailable right now.
              </p>
            ) : town.trim().length >= 3 && places.places.length === 0 ? (
              <p className='text-muted-foreground text-xs'>No places match.</p>
            ) : null}
            {places.places.length > 0 ? (
              <ul className='max-h-48 overflow-y-auto rounded-md border' aria-label='Places'>
                {places.places.map(place => (
                  <li key={place.mapbox_id}>
                    <button
                      type='button'
                      className='hover:bg-muted w-full px-3 py-2 text-left text-sm'
                      onClick={() => {
                        nearMe.setPoint({
                          latitude: place.latitude,
                          longitude: place.longitude,
                          label: place.name,
                        });
                        setTown('');
                        setOpen(false);
                      }}
                    >
                      <span className='block truncate'>{place.name}</span>
                      {place.place_formatted ? (
                        <span className='text-muted-foreground block truncate text-xs'>
                          {place.place_formatted}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className='space-y-1'>
            <Label htmlFor={radiusId}>Within</Label>
            <Select
              value={String(nearMe.radiusKm)}
              onValueChange={value => nearMe.setRadiusKm(Number(value))}
            >
              <SelectTrigger id={radiusId} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NEAR_ME_RADII.map(radius => (
                  <SelectItem key={radius} value={String(radius)}>
                    {radius} km
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
      {nearMe.active ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-8'
          onClick={nearMe.clear}
          aria-label='Clear near-me search'
        >
          <X className='size-4' />
        </Button>
      ) : null}
    </div>
  );
}

/** A result's coarse distance, e.g. "2–5 km away". Renders nothing without a band. */
export function DistanceBandBadge({
  band,
  className,
}: {
  band: DistanceBandEnum | string | null | undefined;
  className?: string;
}) {
  const label = distanceBandLabel(band);
  if (!label) return null;
  return (
    <Badge variant='outline' className={cn('gap-1 font-normal', className)}>
      <MapPin className='size-3' aria-hidden />
      {label}
    </Badge>
  );
}
