'use client';

import { useQuery } from '@tanstack/react-query';

import { reverseGeocode } from '@/lib/geocoding';
import { STALE_TIMES } from '@/lib/query-client';

function isCoordinate(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Address label for a pin. Keyed to 5 dp (~1 m) so nudging within a metre reuses the answer. */
export function useReverseGeocode(
  latitude?: number | null,
  longitude?: number | null,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const hasPin = isCoordinate(latitude) && isCoordinate(longitude);
  const lat = hasPin ? latitude : 0;
  const lng = hasPin ? longitude : 0;

  return useQuery({
    queryKey: ['reverse-geocode', lat.toFixed(5), lng.toFixed(5)],
    queryFn: ({ signal }) => reverseGeocode(lat, lng, signal),
    enabled: enabled && hasPin,
    retry: 1,
    staleTime: STALE_TIMES.reference,
  });
}
