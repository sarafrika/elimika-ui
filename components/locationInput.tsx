'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type MapboxSuggestFeature = {
  name: string;
  mapbox_id: string;
  place_formatted?: string;
};

type MapboxSuggestResponse = {
  suggestions: MapboxSuggestFeature[];
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
const SUGGEST_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/retrieve';
const DEFAULT_SEARCH_COUNTRY = 'KE';
const GEOCODE_ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

/**
 * `/retrieve` only resolves POI ids; a locality suggestion (`urn:mbxplc:`)
 * 404s there. Kenyan results are mostly localities, so the label is forward
 * geocoded instead to still land a pin.
 */
async function geocodePlaceLabel(label: string, country: string | undefined, token: string) {
  const params = new URLSearchParams({ q: label, limit: '1', access_token: token });
  if (country) {
    params.set('country', country);
  }
  const response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const feature = data.features?.[0];
  const [longitude, latitude] = feature?.geometry?.coordinates ?? [undefined, undefined];
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }
  return { latitude, longitude };
}

/**
 * The Search Box API bills a suggest→retrieve pair as one session and rejects
 * either call without a token, so the same UUID has to span the pair and be
 * retired once the user picks a result.
 */
function createSessionToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * The searched place is what gets stored, so the label has to name it. Mapbox
 * returns the place in `name` and only its surrounding context in
 * `place_formatted`, so a POI like "Sarit Centre" formats as "Nairobi, Kenya" —
 * keeping just that would save the city and lose the venue.
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
  const sessionToken = useRef<string | null>(null);
  const ensureSessionToken = useCallback(() => {
    if (!sessionToken.current) {
      sessionToken.current = createSessionToken();
    }
    return sessionToken.current;
  }, []);

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
    if (!mapboxToken) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

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
          limit: '6',
          language: 'en',
          session_token: ensureSessionToken(),
          access_token: mapboxToken,
          ...(country ? { country } : {}),
        });
        const response = await fetch(`${SUGGEST_ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data: MapboxSuggestResponse = await response.json();
        setSuggestions(data.suggestions ?? []);
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
  }, [query, country, ensureSessionToken]);

  const handleSelect = useCallback(
    async (suggestion: MapboxSuggestFeature) => {
      const label = composePlaceLabel(suggestion.name, suggestion.place_formatted);
      setQuery(label ?? '');
      onChange?.(label ?? '');
      setIsOpen(false);
      setSuggestions([]);
      setSelectedPlaceLabel(label);

      if (!mapboxToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          mapbox_id: suggestion.mapbox_id,
          session_token: ensureSessionToken(),
          access_token: mapboxToken,
        });
        const response = await fetch(`${RETRIEVE_ENDPOINT}?${params.toString()}`);
        if (!response.ok) {
          const geocoded = label ? await geocodePlaceLabel(label, country, mapboxToken) : null;
          if (!geocoded) {
            throw new Error(await response.text());
          }
          setSelectedCoordinates(geocoded);
          const geocodedFeature: MapboxRetrieveFeature = {
            mapbox_id: suggestion.mapbox_id,
            name: suggestion.name,
            place_formatted: suggestion.place_formatted,
            geometry: { coordinates: [geocoded.longitude, geocoded.latitude] },
            properties: { coordinates: geocoded },
          };
          setSelectedFeature(geocodedFeature);
          onSuggest?.({ features: [geocodedFeature] });
          sessionToken.current = null;
          return;
        }
        const data: MapboxRetrieveResponse = await response.json();
        const features = (data.features ?? []).map(feature => {
          const [longitude, latitude] = feature.geometry?.coordinates ?? [undefined, undefined];
          return {
            ...feature,
            properties: {
              ...feature.properties,
              coordinates: {
                latitude,
                longitude,
                ...(feature.properties?.coordinates ?? {}),
              },
            },
          };
        });

        const primary = features[0] ?? null;
        setSelectedFeature(primary);
        if (primary?.properties?.coordinates) {
          const { latitude, longitude } = primary.properties.coordinates;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            setSelectedCoordinates({ latitude, longitude });
          }
        }

        onSuggest?.({ ...data, features });
        sessionToken.current = null;
      } catch (_err) {
        setError('Unable to retrieve location details.');
      } finally {
        setIsLoading(false);
      }
    },
    [country, ensureSessionToken, onChange, onSuggest]
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
    if (!mapboxToken) {
      return 'Add NEXT_PUBLIC_MAPBOX_TOKEN to enable location search.';
    }
    if (error) return error;
    return null;
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
        disabled={disabled || !mapboxToken}
        className={cn(className, !mapboxToken ? 'bg-muted text-muted-foreground' : undefined)}
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
          ) : mapboxToken ? (
            <p className='text-muted-foreground text-xs'>
              Select a suggestion to preview it on the map and capture coordinates.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
