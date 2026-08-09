'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type MapboxSuggestFeature = {
  name: string;
  mapbox_id: string;
  place_formatted?: string;
  latitude: number;
  longitude: number;
};

type MapboxRetrieveFeature = {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: MapboxRetrieveProperties;
};

export type MapboxRetrieveResponse = {
  features: MapboxRetrieveFeature[];
};

type MapboxRetrieveProperties = {
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
} & Record<string, unknown>;

type CoordinatesInput = {
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type LocationInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSuggest?: (response: MapboxRetrieveResponse) => void;
  coordinates?: CoordinatesInput;
  showMapPreview?: boolean;
  mapZoom?: number;
  /**
   * ISO 3166-1 alpha-2 country the search is restricted to. Defaults to Kenya so
   * a search never offers a same-named place on another continent, which would
   * otherwise be one click away from being saved as the venue.
   */
  country?: string;
};

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const GEOCODER_URL = process.env.NEXT_PUBLIC_GEOCODER_URL ?? 'https://photon.komoot.io/api/';
const DEFAULT_SEARCH_COUNTRY = 'KE';
const SEARCH_BIAS = { latitude: -1.286389, longitude: 36.817223 };

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_id?: number;
    osm_key?: string;
  };
};

/**
 * OpenStreetMap indexes Kenyan venues that Mapbox Search does not — Sarit Centre,
 * Westgate, Yaya, Strathmore all resolve here and none of them resolve there.
 * Mapbox is still used for the static map preview.
 */
function toSuggestion(feature: PhotonFeature): MapboxSuggestFeature | null {
  const p = feature.properties ?? {};
  const coords = feature.geometry?.coordinates;
  if (!p.name || !coords) {
    return null;
  }
  const context = [
    [p.housenumber, p.street].filter(Boolean).join(' '),
    p.district,
    p.city ?? p.county,
    p.country,
  ]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(', ');

  return {
    name: p.name,
    place_formatted: context || undefined,
    mapbox_id: `${p.osm_key ?? 'place'}:${p.osm_id ?? p.name}`,
    latitude: coords[1],
    longitude: coords[0],
  };
}


/**
 * The searched place is what gets stored, so the label has to name it. The
 * geocoder returns the place in `name` and its surrounding address separately,
 * so keeping only the context would save the city and lose the venue.
 */
function composePlaceLabel(name?: string | null, placeFormatted?: string | null) {
  const place = name?.trim();
  const context = placeFormatted?.trim();
  if (!place) return context ?? null;
  if (!context || context === place || context.startsWith(`${place},`)) return place;
  return `${place}, ${context}`;
}

export default function LocationInput({
  value,
  onChange,
  onBlur,
  name,
  id,
  placeholder = 'Search for a location',
  disabled,
  className,
  onSuggest,
  coordinates,
  showMapPreview = true,
  mapZoom = 13,
  country = DEFAULT_SEARCH_COUNTRY,
}: LocationInputProps) {
  const [query, setQuery] = useState(value ?? '');
  const [suggestions, setSuggestions] = useState<MapboxSuggestFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<MapboxRetrieveFeature | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
  }>({});
  const [selectedPlaceLabel, setSelectedPlaceLabel] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  useEffect(() => {
    const normalizeCoordinate = (coord?: number | string | null) => {
      if (coord === '' || coord === null || coord === undefined) {
        return undefined;
      }
      if (typeof coord === 'number') {
        return Number.isFinite(coord) ? coord : undefined;
      }
      const parsed = Number(coord);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const lat = normalizeCoordinate(coordinates?.latitude);
    const lon = normalizeCoordinate(coordinates?.longitude);

    if (lat !== undefined && lon !== undefined) {
      setSelectedCoordinates(prev => {
        if (prev.latitude === lat && prev.longitude === lon) {
          return prev;
        }
        return { latitude: lat, longitude: lon };
      });
    }
  }, [coordinates?.latitude, coordinates?.longitude]);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          limit: '8',
          lang: 'en',
          lat: String(SEARCH_BIAS.latitude),
          lon: String(SEARCH_BIAS.longitude),
        });
        const response = await fetch(`${GEOCODER_URL}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data: { features?: PhotonFeature[] } = await response.json();
        const matches = (data.features ?? [])
          .filter(feature => !country || feature.properties?.countrycode === country)
          .map(toSuggestion)
          .filter((item): item is MapboxSuggestFeature => item !== null)
          .slice(0, 6);
        setSuggestions(matches);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Unable to fetch suggestions.');
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      void fetchSuggestions();
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounce);
    };
  }, [query, country]);

  const handleSelect = useCallback(
    (suggestion: MapboxSuggestFeature) => {
      const label = composePlaceLabel(suggestion.name, suggestion.place_formatted);
      setQuery(label ?? '');
      onChange?.(label ?? '');
      setIsOpen(false);
      setSuggestions([]);
      setSelectedPlaceLabel(label);
      setError(null);

      const coordinates = { latitude: suggestion.latitude, longitude: suggestion.longitude };
      setSelectedCoordinates(coordinates);

      const feature: MapboxRetrieveFeature = {
        mapbox_id: suggestion.mapbox_id,
        name: suggestion.name,
        place_formatted: suggestion.place_formatted,
        geometry: { coordinates: [suggestion.longitude, suggestion.latitude] },
        properties: { coordinates },
      };
      setSelectedFeature(feature);
      onSuggest?.({ features: [feature] });
    },
    [onChange, onSuggest]
  );

  const _handleClose = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
  }, []);

  const startCloseTimer = () => {
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const cancelCloseTimer = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
      }
    };
  }, []);

  const helperMessage = useMemo(() => {
    if (disabled) return null;
    return error;
  }, [disabled, error]);

  const hasCoordinates =
    typeof selectedCoordinates.latitude === 'number' &&
    Number.isFinite(selectedCoordinates.latitude) &&
    typeof selectedCoordinates.longitude === 'number' &&
    Number.isFinite(selectedCoordinates.longitude);

  const mapPreviewUrl = useMemo(() => {
    if (!showMapPreview || !mapboxToken || !hasCoordinates) {
      return null;
    }

    const { latitude, longitude } = selectedCoordinates;
    const lat = latitude as number;
    const lon = longitude as number;
    const zoom = Math.min(Math.max(mapZoom, 3), 18);
    const pinColor = '0061ed';
    const size = '600x320';
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';

    return `${baseUrl}/pin-s+${pinColor}(${lon},${lat})/${lon},${lat},${zoom}/${size}@2x?access_token=${mapboxToken}`;
  }, [hasCoordinates, mapZoom, selectedCoordinates, showMapPreview]);

  const formattedLatitude =
    hasCoordinates && selectedCoordinates.latitude !== undefined
      ? selectedCoordinates.latitude.toFixed(5)
      : null;
  const formattedLongitude =
    hasCoordinates && selectedCoordinates.longitude !== undefined
      ? selectedCoordinates.longitude.toFixed(5)
      : null;

  return (
    <div className='relative'>
      <Input
        id={id}
        name={name}
        value={query}
        onChange={event => {
          setQuery(event.target.value);
          onChange?.(event.target.value);
        }}
        onFocus={() => {
          cancelCloseTimer();
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onBlur={() => {
          startCloseTimer();
          onBlur?.();
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete='off'
      />

      {helperMessage ? <p className='text-muted-foreground mt-2 text-xs'>{helperMessage}</p> : null}

      {isOpen && suggestions.length > 0 ? (
        <div
          className='border-border bg-popover absolute z-30 mt-1 w-full rounded-md border shadow-lg'
          onMouseDown={cancelCloseTimer}
          onMouseUp={startCloseTimer}
        >
          <ScrollArea className='max-h-60'>
            <ul className='py-1 text-sm'>
              {suggestions.map(suggestion => (
                <li key={suggestion.mapbox_id}>
                  <button
                    type='button'
                    className='hover:bg-muted focus:bg-muted w-full px-3 py-2 text-left focus:outline-none'
                    onClick={() => handleSelect(suggestion)}
                  >
                    <span className='text-foreground block font-medium'>{suggestion.name}</span>
                    {suggestion.place_formatted ? (
                      <span className='text-muted-foreground text-xs'>
                        {suggestion.place_formatted}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      ) : null}

      {isOpen && !isLoading && suggestions.length === 0 && query.length >= 3 ? (
        <div className='border-border bg-popover text-muted-foreground absolute z-30 mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-lg'>
          No match on the map. Your own venue name is kept exactly as typed — it just
          won&apos;t carry coordinates.
        </div>
      ) : null}

      {showMapPreview ? (
        <div className='mt-4 space-y-2'>
          {mapPreviewUrl ? (
            <div className='border-primary/20 shadow-primary/10 dark:border-primary/30 dark:bg-primary/15 dark:shadow-primary/20 overflow-hidden rounded-xl border bg-white/85 shadow-sm'>
              <div className='bg-muted aspect-[3/2] w-full overflow-hidden'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mapPreviewUrl}
                  alt={`Map preview${selectedPlaceLabel ? ` of ${selectedPlaceLabel}` : ''}`}
                  className='h-full w-full object-cover'
                  loading='lazy'
                />
              </div>
              <div className='border-border text-muted-foreground dark:border-border/60 dark:bg-primary/20 dark:text-foreground flex flex-col gap-2 border-t bg-white/90 p-3 text-xs sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-foreground text-sm font-medium'>
                    {selectedFeature?.name ?? selectedPlaceLabel ?? 'Selected location'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {composePlaceLabel(selectedFeature?.name, selectedFeature?.place_formatted) ??
                      selectedPlaceLabel ??
                      query}
                  </p>
                </div>
                {hasCoordinates ? (
                  <div className='flex flex-wrap items-center gap-3 sm:justify-end'>
                    <span className='bg-secondary text-primary dark:bg-primary/20 dark:text-primary/90 rounded-full px-3 py-1 text-[11px] font-medium'>
                      Lat: {formattedLatitude}
                    </span>
                    <span className='bg-secondary text-primary dark:bg-primary/20 dark:text-primary/90 rounded-full px-3 py-1 text-[11px] font-medium'>
                      Lng: {formattedLongitude}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground text-xs'>
              Select a suggestion to preview it on the map and capture coordinates.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
