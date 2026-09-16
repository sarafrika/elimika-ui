export const GEOCODER_URL = process.env.NEXT_PUBLIC_GEOCODER_URL ?? 'https://photon.komoot.io/api/';
export const DEFAULT_SEARCH_COUNTRY = 'KE';
export const SEARCH_BIAS = { latitude: -1.286389, longitude: 36.817223 };

export type PhotonFeature = {
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

export type PlaceSuggestion = {
  name: string;
  mapbox_id: string;
  place_formatted?: string;
  latitude: number;
  longitude: number;
};

/**
 * OpenStreetMap indexes Kenyan venues that Mapbox Search does not — Sarit Centre,
 * Westgate, Yaya, Strathmore all resolve here and none of them resolve there.
 */
export function toSuggestion(feature: PhotonFeature): PlaceSuggestion | null {
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
 * geocoder returns the place in `name` and its surrounding address separately.
 */
export function composePlaceLabel(name?: string | null, placeFormatted?: string | null) {
  const place = name?.trim();
  const context = placeFormatted?.trim();
  if (!place) return context ?? null;
  if (!context || context === place || context.startsWith(`${place},`)) return place;
  return `${place}, ${context}`;
}

/** Photon serves reverse lookups beside its search endpoint: `/api/` becomes `/reverse`. */
export function photonReverseUrl(baseUrl: string = GEOCODER_URL) {
  return baseUrl.replace(/\/api\/?$/, '/reverse');
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
  country: string = DEFAULT_SEARCH_COUNTRY
): Promise<string> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    lang: 'en',
    limit: '1',
  });
  const response = await fetch(`${photonReverseUrl()}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data: { features?: PhotonFeature[] } = await response.json();
  const feature = (data.features ?? []).find(
    item => !country || item.properties?.countrycode === country
  );
  const p = feature?.properties;
  if (!p) {
    throw new Error('No address found for this pin');
  }

  const parts = [
    p.name,
    [p.housenumber, p.street].filter(Boolean).join(' '),
    p.district,
    p.city ?? p.county,
  ]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part, index, all) => all.indexOf(part) === index);
  if (parts.length === 0) {
    throw new Error('No address found for this pin');
  }
  return parts.join(', ');
}

export function googleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/** Best-effort town for a comma separated address: "Waiyaki Way, Westlands, Nairobi" → "Westlands". */
export function townFromAddress(address?: string | null) {
  const parts = (address ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(part => part && part.toLowerCase() !== 'kenya');
  if (parts.length === 0) return null;
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}
