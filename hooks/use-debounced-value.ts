'use client';

import { useEffect, useState } from 'react';

/** Listings debounce server searches by 250 ms; the palette uses 200 ms. */
export const SEARCH_DEBOUNCE_MS = 250;

/** `value`, updated only after it has stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
