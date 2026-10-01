import type { SearchByTypeData } from '@/services/client';
import { searchByTypeOptions } from '@/services/client/@tanstack/react-query.gen';

/**
 * `GET /api/v1/search/{type}`: one type's "see all" page, with filters and facets.
 *
 * The generated types only know `q`, `facets`, `sort`, `page` and `size`. Filters use the
 * `field` / `field_op` vocabulary (`eq, noteq, in, notin, gt, gte, lt, lte, between`) over
 * each type's filterable allow-list (the filter map at the end of the `searchByType`
 * OpenAPI description). They travel in `searchParams`, which the query serializer in
 * `hey-api.ts` flattens into plain query parameters. An unknown filter, facet or sort is a
 * 400; a disabled index is a 503.
 */

export const SEARCH_TYPES = [
  'courses',
  'programs',
  'classes',
  'marketplace_jobs',
  'instructors',
  'organisations',
  'people',
  'rubrics',
] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];

export function isSearchType(value: unknown): value is SearchType {
  return typeof value === 'string' && (SEARCH_TYPES as readonly string[]).includes(value);
}

/** A filter value. Arrays are sent comma-separated, as `_in` and `_between` expect. */
type SearchFilterValue = string | number | boolean | ReadonlyArray<string | number>;

export type SearchFilters = Record<string, SearchFilterValue | null | undefined>;

export type TypeSearchArgs = {
  type: SearchType;
  q?: string;
  filters?: SearchFilters;
  /** Comma-separated filterable attributes, e.g. `category_uuids,is_free`. */
  facets?: string;
  /** `field[,asc|desc]` over the type's sortable attributes. Omit for relevance. */
  sort?: string;
  page?: number;
  size?: number;
};

type TypeSearchQuery = NonNullable<SearchByTypeData['query']> & {
  searchParams?: Record<string, string | number | boolean>;
};

/** Drop empty values and join arrays, so no `field=` or repeated keys reach the API. */
function toSearchParams(
  filters: SearchFilters | undefined
): Record<string, string | number | boolean> | undefined {
  if (!filters) return undefined;
  const params: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params[key] = value;
      continue;
    }
    if (value.length === 0) continue;
    params[key] = value.join(',');
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

/** Generated `searchByTypeOptions`, with typed filters spread into `searchParams`. */
export function typeSearchOptions({ type, q, filters, facets, sort, page, size }: TypeSearchArgs) {
  const query: TypeSearchQuery = {};
  const term = q?.trim();
  if (term) query.q = term;
  if (facets) query.facets = facets;
  if (sort) query.sort = sort;
  if (page !== undefined) query.page = page;
  if (size !== undefined) query.size = size;
  const searchParams = toSearchParams(filters);
  if (searchParams) query.searchParams = searchParams;

  return searchByTypeOptions({ path: { type }, query });
}
