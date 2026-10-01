import { httpStatusOf, isSearchUnavailable } from '@/lib/api-errors';
import { asRecord } from '@/lib/error-utils';
import { toSearchTerm } from '@/lib/search/query';
import { enumParam, numberParam, stringParam } from '@/lib/search-state';
import { stripRichText } from '@/src/features/catalogue/format';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';
import { hitDestination } from '@/src/features/search/lib/hit-href';

/**
 * `GET /api/v1/catalogue/search` (operationId `searchCatalogue`, anonymous OK): one search
 * across published courses and programmes, with facets for the catalogue's filters.
 *
 * The generated client does not know this endpoint yet. These hand-written types mirror
 * the backend contract field for field (snake_case, as the API sends them), so swapping to
 * the generated `CatalogueItem` / `SearchCatalogueData` is a type rename. Note that
 * operationId `searchCatalogue` is already taken by the commerce catalogue search, so the
 * generator may suffix the new function's name.
 */
export const CATALOGUE_SEARCH_URL = '/api/v1/catalogue/search';
export const CATALOGUE_PAGE_SIZE = 24;

export type CatalogueItemType = 'course' | 'programme';

export type CatalogueItem = {
  type: CatalogueItemType;
  uuid: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category_names?: string[] | null;
  category_uuids?: string[] | null;
  creator_uuid?: string | null;
  creator_name?: string | null;
  level?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  lesson_count?: number | null;
  /** Programmes only. */
  course_count?: number | null;
  learner_count?: number | null;
  class_count?: number | null;
  age_label?: string | null;
  price?: number | null;
  is_free?: boolean | null;
  /** The title with `<em>` around the matches. Render with `<Highlight>`, never as HTML. */
  highlight?: string | null;
};

export type CatalogueCategoryFacet = { uuid: string; name: string; count: number };

export type CatalogueFacets = {
  show?: Partial<Record<'all' | 'courses' | 'programmes', number>>;
  category?: CatalogueCategoryFacet[];
  level?: Partial<Record<CatalogueLevel, number>>;
  price?: Partial<Record<'free' | 'paid', number>>;
};

export type CataloguePageMetadata = {
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number | bigint;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};

export type CatalogueSearchPage = {
  content: CatalogueItem[];
  metadata?: CataloguePageMetadata;
  facets?: CatalogueFacets;
};

/* URL state ------------------------------------------------------------------------- */

export const SHOW_VALUES = ['all', 'courses', 'programmes'] as const;
export type CatalogueShow = (typeof SHOW_VALUES)[number];

export const LEVEL_VALUES = ['any', 'beginner', 'intermediate', 'advanced'] as const;
export type CatalogueLevel = Exclude<(typeof LEVEL_VALUES)[number], 'any'>;

export const PRICE_VALUES = ['any', 'free', 'paid'] as const;
export type CataloguePrice = Exclude<(typeof PRICE_VALUES)[number], 'any'>;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Most popular' },
] as const;
export type CatalogueSort = (typeof SORT_OPTIONS)[number]['value'];

export const catalogueParams = {
  show: enumParam(SHOW_VALUES, 'all'),
  category: stringParam(),
  level: enumParam(LEVEL_VALUES, 'any'),
  price: enumParam(PRICE_VALUES, 'any'),
  sort: enumParam(
    SORT_OPTIONS.map(option => option.value),
    'relevance'
  ),
  page: numberParam(0),
};

export type CatalogueFilters = {
  q?: string;
  show: CatalogueShow;
  category: string;
  level: (typeof LEVEL_VALUES)[number];
  price: (typeof PRICE_VALUES)[number];
  sort: CatalogueSort;
  page: number;
};

/** The request's query: only what narrows it, `q` only at two or more characters. */
export type CatalogueSearchQuery = {
  q?: string;
  show?: CatalogueShow;
  category_uuid?: string[];
  level?: CatalogueLevel;
  price?: CataloguePrice;
  sort?: CatalogueSort;
  page: number;
  size: number;
};

export function toCatalogueSearchQuery(
  filters: CatalogueFilters,
  size = CATALOGUE_PAGE_SIZE
): CatalogueSearchQuery {
  const query: CatalogueSearchQuery = { page: Math.max(0, filters.page), size };
  const q = toSearchTerm(filters.q);
  if (q) query.q = q;
  if (filters.show !== 'all') query.show = filters.show;
  if (filters.category) query.category_uuid = [filters.category];
  if (filters.level !== 'any') query.level = filters.level;
  if (filters.price !== 'any') query.price = filters.price;
  if (filters.sort !== 'relevance') query.sort = filters.sort;
  return query;
}

/** How many of the sidebar's groups narrow the list; the phone's Filters badge. */
export function activeFilterCount(
  filters: Pick<CatalogueFilters, 'show' | 'category' | 'level' | 'price'>
) {
  return [
    filters.show !== 'all',
    Boolean(filters.category),
    filters.level !== 'any',
    filters.price !== 'any',
  ].filter(Boolean).length;
}

/* Type guards ----------------------------------------------------------------------- */

const isString = (value: unknown): value is string => typeof value === 'string';

export function isCatalogueItem(value: unknown): value is CatalogueItem {
  const record = asRecord(value);
  if (!record) return false;
  return (
    (record.type === 'course' || record.type === 'programme') &&
    isString(record.uuid) &&
    record.uuid.length > 0 &&
    isString(record.title)
  );
}

/**
 * The page out of `ApiResponse<{ content, metadata, facets }>`, or null when the body is
 * not that shape. Items that are not catalogue items are dropped rather than trusted.
 */
export function toCatalogueSearchPage(body: unknown): CatalogueSearchPage | null {
  const envelope = asRecord(body);
  const data = asRecord(envelope?.data);
  if (!data || !Array.isArray(data.content)) return null;
  const metadata = asRecord(data.metadata);
  const facets = asRecord(data.facets);
  return {
    content: data.content.filter(isCatalogueItem),
    metadata: metadata ? (metadata as CataloguePageMetadata) : undefined,
    facets: facets ? (facets as CatalogueFacets) : undefined,
  };
}

/**
 * The catalogue search cannot answer, so the page shows the plain catalogue list instead:
 * the index is down (503), or the endpoint is not deployed yet (an unknown path answers
 * 401 to a visitor and 404 to a signed-in user).
 */
export function isCatalogueSearchUnavailable(error: unknown): boolean {
  if (!error) return false;
  if (isSearchUnavailable(error)) return true;
  const status = httpStatusOf(error);
  return status === 401 || status === 404;
}

/* Presentation ---------------------------------------------------------------------- */

export function resultNoun(show: CatalogueShow, count: number) {
  if (show === 'courses') return count === 1 ? 'course' : 'courses';
  if (show === 'programmes') return count === 1 ? 'programme' : 'programmes';
  return count === 1 ? 'result' : 'results';
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The card's stats row: "N courses · N lessons" for a programme. */
export function itemStats(item: CatalogueItem): string[] {
  const stats: string[] = [];
  if (item.type === 'programme' && typeof item.course_count === 'number') {
    stats.push(plural(item.course_count, 'course', 'courses'));
  }
  if (typeof item.lesson_count === 'number') {
    stats.push(plural(item.lesson_count, 'lesson', 'lessons'));
  }
  if (item.type === 'course') {
    if (typeof item.learner_count === 'number') {
      stats.push(plural(item.learner_count, 'learner', 'learners'));
    }
    if (typeof item.class_count === 'number') {
      stats.push(plural(item.class_count, 'class', 'classes'));
    }
  }
  if (item.age_label) stats.push(item.age_label);
  return stats;
}

export const levelLabel = (level?: string | null) =>
  level ? level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() : undefined;

export type ItemLinks = {
  /** Primary action. `signIn` means: sign in first, then land on `href`. */
  primary: { label: string; href: string; signIn: boolean };
  secondary: { label: string; href: string; signIn: boolean };
};

/**
 * Where a card's buttons go. A course opens its public page, and "See classes" its classes
 * there. There is no public programme page: a programme opens the learner programme page,
 * through sign-in for a visitor (the palette's convention in `hit-href.ts`).
 */
export function itemLinks(item: CatalogueItem, signedIn: boolean): ItemLinks {
  const uuid = encodeURIComponent(item.uuid);
  if (item.type === 'course') {
    return {
      primary: { label: 'View course', href: `/courses/${uuid}`, signIn: false },
      secondary: { label: 'See classes', href: `/courses/${uuid}#classes`, signIn: false },
    };
  }
  const destination = hitDestination('public', { type: 'programs', uuid: item.uuid });
  const href =
    destination?.kind === 'sign-in'
      ? destination.callbackUrl
      : destination?.kind === 'href'
        ? destination.href
        : '/courses';
  const signIn = !signedIn && destination?.kind === 'sign-in';
  return {
    primary: { label: 'View programme', href, signIn },
    secondary: { label: 'See its courses', href, signIn },
  };
}

/** A server-rendered catalogue course, as a catalogue item: the list shown when search is down. */
export function fromPublicCatalogueCourse(entry: PublicCatalogueCourse): CatalogueItem | null {
  const uuid = entry.course.uuid;
  if (!uuid) return null;
  return {
    type: 'course',
    uuid,
    title: entry.course.name ?? 'Untitled course',
    description: stripRichText(entry.course.description) || null,
    thumbnail_url: entry.course.thumbnail_url ?? null,
    category_names: entry.course.category_names ?? null,
    creator_uuid: entry.course.course_creator_uuid ?? null,
    creator_name: entry.creatorName ?? null,
    price: entry.priceAmount,
    is_free: entry.isFree,
  };
}
