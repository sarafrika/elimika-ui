'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  composePlaceLabel,
  DEFAULT_SEARCH_COUNTRY,
  GEOCODER_URL,
  type PhotonFeature,
  type PlaceSuggestion,
  SEARCH_BIAS,
  toSuggestion,
} from '@/lib/geocoding';
import { buildStaticMapUrl } from '@/lib/static-map';

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
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
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
  const queryRef = useRef(value ?? '');
  // Text that arrived from outside (edit hydration, a reverse-geocode fill, a picked
  // suggestion) is not a search the user asked for, so it must not open the list.
  const suppressSearchRef = useRef<string | null>(value ?? '');

  useEffect(() => {
    const next = value ?? '';
    if (next === queryRef.current) return;
    queryRef.current = next;
    suppressSearchRef.current = next;
    setQuery(next);
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
    if (!query || query.length < 3 || query === suppressSearchRef.current) {
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
          .filter((item): item is PlaceSuggestion => item !== null)
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
    (suggestion: PlaceSuggestion) => {
      const label = composePlaceLabel(suggestion.name, suggestion.place_formatted);
      queryRef.current = label ?? '';
      suppressSearchRef.current = label ?? '';
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
    if (!showMapPreview || !hasCoordinates) {
      return null;
    }

    return buildStaticMapUrl({
      lat: selectedCoordinates.latitude as number,
      lng: selectedCoordinates.longitude as number,
      zoom: mapZoom,
    });
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
          queryRef.current = event.target.value;
          suppressSearchRef.current = null;
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
          No match on the map. Your own venue name is kept exactly as typed — it just won&apos;t
          carry coordinates.
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
