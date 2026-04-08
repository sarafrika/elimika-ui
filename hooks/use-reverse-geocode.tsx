import { useEffect, useState } from 'react';

interface AddressComponents {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  [key: string]: unknown;
}

interface ReverseGeocodeApiResponse {
  address?: AddressComponents;
  display_name?: string;
}

function isReverseGeocodeApiResponse(value: unknown): value is ReverseGeocodeApiResponse {
  return typeof value === 'object' && value !== null;
}

interface ReverseGeocodeResult {
  addressComponents: AddressComponents | null;
  displayName: string | null;
  loading: boolean;
  error: string | null;
}

export function useReverseGeocode(lat: number, lon: number): ReverseGeocodeResult {
  const [addressComponents, setAddressComponents] = useState<AddressComponents | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lon == null) return;

    const fetchAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'YourAppName/1.0 (contact@example.com)',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch address');

        const rawData: unknown = await response.json();

        if (!isReverseGeocodeApiResponse(rawData)) {
          throw new Error('Unexpected reverse geocode response');
        }

        setAddressComponents(rawData.address || null);
        setDisplayName(rawData.display_name || null);
      } catch (_err) {
        setError('Error retrieving address');
        setAddressComponents(null);
        setDisplayName(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [lat, lon]);

  return { addressComponents, displayName, loading, error };
}
