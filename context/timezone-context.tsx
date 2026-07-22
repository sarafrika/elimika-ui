'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { resolveDisplayZone, UTC_ZONE } from '@/lib/date';

const STORAGE_KEY = 'elimika:preferred-timezone';

type ZoneSource = 'preference' | 'detected' | 'default';

interface TimeZoneContextValue {
  /** IANA zone all timestamps should be displayed in. */
  zone: string;
  /** Where the active zone came from. */
  source: ZoneSource;
  /**
   * Set (or clear) the user's saved zone preference. Passing a zone makes it win
   * over browser detection; passing null falls back to the detected zone.
   */
  setPreferredZone: (zone: string | null) => void;
}

const TimeZoneContext = createContext<TimeZoneContextValue>({
  zone: UTC_ZONE,
  source: 'default',
  setPreferredZone: () => undefined,
});

/** Read the viewer's active display zone. */
export const useTimeZone = () => useContext(TimeZoneContext);

interface TimeZoneProviderProps {
  children: ReactNode;
  /** Server-known preference (e.g. from the profile) to avoid a UTC flash. */
  initialPreferredZone?: string | null;
}

/**
 * Provides the zone every timestamp is rendered in, resolved as:
 * saved preference → detected browser zone → UTC.
 *
 * Browser detection runs only after mount (in an effect) so the server and the
 * first client render agree — components using {@link useTimeZone} should render
 * inside a `<time suppressHydrationWarning>` to absorb the post-mount refinement.
 */
export function TimeZoneProvider({
  children,
  initialPreferredZone = null,
}: TimeZoneProviderProps) {
  const [preferredZone, setPreferredZoneState] = useState<string | null>(initialPreferredZone);
  const [detectedZone, setDetectedZone] = useState<string | null>(null);

  useEffect(() => {
    setDetectedZone(resolveDisplayZone());
    // Restore a previously saved preference unless the server already supplied one.
    if (!initialPreferredZone) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPreferredZoneState(stored);
        }
      } catch {
        // Ignore storage access errors (private mode, SSR).
      }
    }
  }, [initialPreferredZone]);

  const setPreferredZone = useCallback((zone: string | null) => {
    setPreferredZoneState(zone);
    try {
      if (zone) {
        window.localStorage.setItem(STORAGE_KEY, zone);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  const value = useMemo<TimeZoneContextValue>(() => {
    if (preferredZone) {
      return { zone: preferredZone, source: 'preference', setPreferredZone };
    }
    if (detectedZone) {
      return { zone: detectedZone, source: 'detected', setPreferredZone };
    }
    return { zone: UTC_ZONE, source: 'default', setPreferredZone };
  }, [preferredZone, detectedZone]);

  return <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>;
}
