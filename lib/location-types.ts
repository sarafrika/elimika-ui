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
