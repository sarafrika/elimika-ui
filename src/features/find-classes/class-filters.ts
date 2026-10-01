import type { ClassDefinition } from '@/services/client/types.gen';

/**
 * The "Find classes" filters, as they live in the URL and as `GET /classes` takes them.
 * Pure, so the page and its tests share them.
 */
export type ClassFilters = {
  course?: string;
  location?: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  format?: 'GROUP' | 'INDIVIDUAL';
  /** Earliest start, `yyyy-mm-dd`. */
  from?: string;
  organisation?: string;
};

export const LOCATION_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'HYBRID', label: 'Hybrid' },
] as const;

export const FORMAT_OPTIONS = [
  { value: 'GROUP', label: 'Group' },
  { value: 'INDIVIDUAL', label: 'One-to-one' },
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** URL values to filters, dropping anything the API would refuse. */
export function parseClassFilters(read: (key: string) => string | null): ClassFilters {
  const location = read('location');
  const format = read('format');
  const from = read('from');
  return {
    course: read('course') || undefined,
    location: LOCATION_OPTIONS.some(option => option.value === location)
      ? (location as ClassFilters['location'])
      : undefined,
    format: FORMAT_OPTIONS.some(option => option.value === format)
      ? (format as ClassFilters['format'])
      : undefined,
    from: from && ISO_DATE.test(from) ? from : undefined,
    organisation: read('organisation') || undefined,
  };
}

/**
 * The filter query parameters for `GET /classes` (`field` / `field_op`). Only active
 * classes are asked for; the server scopes the rest to what the caller may see.
 */
export function toClassSearchParams(filters: ClassFilters): Record<string, string> {
  const params: Record<string, string> = { is_active: 'true' };
  if (filters.course) params.course_uuid = filters.course;
  if (filters.location) params.location_type = filters.location;
  if (filters.format) params.session_format = filters.format;
  if (filters.from) params.starts_at_gte = filters.from;
  if (filters.organisation) params.organisation_uuid = filters.organisation;
  return params;
}

export function hasClassFilters(filters: ClassFilters): boolean {
  return Boolean(
    filters.course || filters.location || filters.format || filters.from || filters.organisation
  );
}

const startOf = (definition: Pick<ClassDefinition, 'default_start_time'>) => {
  const value = definition.default_start_time as Date | string | undefined;
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
};

/**
 * The same filters, applied to a loaded row. `GET /classes` applies its filters only on
 * the search path (with `q` or `near`); the plain listing ignores them, so the page also
 * narrows what it was sent. Where the server did filter, this changes nothing.
 */
export function matchesClassFilters(
  definition: Pick<
    ClassDefinition,
    | 'course_uuid'
    | 'location_type'
    | 'session_format'
    | 'default_start_time'
    | 'organisation_uuid'
    | 'is_active'
  >,
  filters: ClassFilters
): boolean {
  if (definition.is_active === false) return false;
  if (filters.course && definition.course_uuid !== filters.course) return false;
  if (filters.location && definition.location_type?.toUpperCase() !== filters.location) {
    return false;
  }
  if (filters.format && definition.session_format?.toUpperCase() !== filters.format) {
    return false;
  }
  if (filters.organisation && definition.organisation_uuid !== filters.organisation) return false;
  if (filters.from) {
    const start = startOf(definition);
    if (start && start < new Date(`${filters.from}T00:00:00Z`)) return false;
  }
  return true;
}
