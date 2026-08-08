import {
  LocationTypeEnum,
  type LocationTypeEnum as LocationTypeValue,
} from '@/services/client/types.gen';

export const LOCATION_TYPE_OPTIONS: Array<{ label: string; value: LocationTypeValue }> = [
  { label: 'Online', value: LocationTypeEnum.ONLINE },
  { label: 'In-person', value: LocationTypeEnum.IN_PERSON },
  { label: 'Hybrid', value: LocationTypeEnum.HYBRID },
];

const LOCATION_TYPE_VALUES = new Set<string>(Object.values(LocationTypeEnum));

export function normalizeLocationType(value: unknown): LocationTypeValue | '' {
  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = value.trim().toUpperCase();
  return LOCATION_TYPE_VALUES.has(normalizedValue) ? (normalizedValue as LocationTypeValue) : '';
}

export function requiresPhysicalLocation(locationType: LocationTypeValue | '') {
  return locationType === LocationTypeEnum.IN_PERSON || locationType === LocationTypeEnum.HYBRID;
}

export function trimToUndefined(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export function toCoordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type MapboxPlaceResponse = {
  features?: Array<{
    geometry?: { coordinates?: [number, number] };
    properties?: { coordinates?: { latitude?: number; longitude?: number } };
  }>;
};

/**
 * Mapbox reports the pin in `properties.coordinates` on retrieve and as a
 * `[longitude, latitude]` GeoJSON pair on the raw geometry. Reading both here
 * keeps every location field storing the same thing.
 */
export function coordinatesFromPlace(response: MapboxPlaceResponse) {
  const place = response.features?.[0];
  if (!place) {
    return {};
  }
  return {
    latitude: place.properties?.coordinates?.latitude ?? place.geometry?.coordinates?.[1],
    longitude: place.properties?.coordinates?.longitude ?? place.geometry?.coordinates?.[0],
  };
}
