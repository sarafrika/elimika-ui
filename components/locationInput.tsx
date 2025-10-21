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
}: LocationInputProps) {
  const [query, setQuery] = useState(value ?? '');
  const [suggestions, setSuggestions] = useState<MapboxSuggestFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

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
      setQuery(suggestion.place_formatted ?? suggestion.name);
      onChange?.(suggestion.place_formatted ?? suggestion.name);
      setIsOpen(false);

      if (!mapboxToken || !onSuggest) {
        return;
      }

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
        onSuggest({ ...data, features });
      } catch (err) {
        setError('Unable to retrieve location details.');
      }
    },
    [onChange, onSuggest]
  );

  const handleClose = useCallback(() => {
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

      {helperMessage ? (
        <p className='text-muted-foreground mt-2 text-xs'>{helperMessage}</p>
      ) : null}

      {isOpen && suggestions.length > 0 ? (
        <div
          className='absolute z-30 mt-1 w-full rounded-md border border-border bg-popover shadow-lg'
          onMouseDown={cancelCloseTimer}
          onMouseUp={startCloseTimer}
        >
          <ScrollArea className='max-h-60'>
            <ul className='py-1 text-sm'>
              {suggestions.map(suggestion => (
                <li key={suggestion.mapbox_id}>
                  <button
                    type='button'
                    className='w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none'
                    onClick={() => handleSelect(suggestion)}
                  >
                    <span className='block font-medium text-foreground'>{suggestion.name}</span>
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
        <div className='absolute z-30 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg'>
          No matches found.
        </div>
      ) : null}
    </div>
  );
}
