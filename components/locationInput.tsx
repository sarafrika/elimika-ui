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
  properties?: Record<string, any>;
};

export type MapboxRetrieveResponse = {
  features: MapboxRetrieveFeature[];
};

type CoordinatesInput = {
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type LocationInputProps = {
  value?: string;
  onChange?: (value: any) => void;
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
};

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SUGGEST_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

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
          access_token: mapboxToken,
        });
        const response = await fetch(`${SUGGEST_ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data: MapboxSuggestResponse = await response.json();
        setSuggestions(data.suggestions ?? []);
        setIsOpen((data.suggestions ?? []).length > 0);
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
  }, [query]);

  const handleSelect = useCallback(
    async (suggestion: MapboxSuggestFeature) => {
      const label = suggestion.place_formatted ?? suggestion.name ?? null;
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
          access_token: mapboxToken,
        });
        const response = await fetch(`${RETRIEVE_ENDPOINT}?${params.toString()}`);
        if (!response.ok) {
          throw new Error(await response.text());
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
      } catch (_err) {
        setError('Unable to retrieve location details.');
      } finally {
        setIsLoading(false);
      }
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
          No matches found.
        </div>
      ) : null}

      {showMapPreview ? (
        <div className='mt-4 space-y-2'>
          {mapPreviewUrl ? (
            <div className='overflow-hidden rounded-xl border border-primary/20 bg-white/85 shadow-sm shadow-primary/10 dark:border-primary/30 dark:bg-primary/15 dark:shadow-primary/20'>
              <div className='aspect-[3/2] w-full overflow-hidden bg-muted'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mapPreviewUrl}
                  alt={`Map preview${selectedPlaceLabel ? ` of ${selectedPlaceLabel}` : ''}`}
                  className='h-full w-full object-cover'
                  loading='lazy'
                />
              </div>
              <div className='flex flex-col gap-2 border-t border-border bg-white/90 p-3 text-xs text-muted-foreground dark:border-border/60 dark:bg-primary/20 dark:text-foreground sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-foreground text-sm font-medium'>
                    {selectedFeature?.name ?? selectedPlaceLabel ?? 'Selected location'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {selectedFeature?.place_formatted ?? selectedPlaceLabel ?? query}
                  </p>
                </div>
                {hasCoordinates ? (
                  <div className='flex flex-wrap items-center gap-3 sm:justify-end'>
                    <span className='rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-primary dark:bg-primary/20 dark:text-primary/90'>
                      Lat: {formattedLatitude}
                    </span>
                    <span className='rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-primary dark:bg-primary/20 dark:text-primary/90'>
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
