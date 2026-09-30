import { httpStatusOf, isSearchUnavailable } from '@/lib/api-errors';

/**
 * Free text goes to the API as `q`, which the backend answers from the search index
 * (typo-tolerant, relevance-ranked). The old `_like` / `_startswith` / `_endswith`
 * operators are gone and answer 400.
 */
export const MIN_SEARCH_TERM_LENGTH = 2;

/** The term to send as `q`, or undefined when it is too short to be worth a search. */
export function toSearchTerm(raw: string | null | undefined): string | undefined {
  const term = raw?.trim() ?? '';
  return term.length >= MIN_SEARCH_TERM_LENGTH ? term : undefined;
}

/**
 * What went wrong with a free-text search:
 * - `unavailable`: the search index is down (503). The list still works without `q`.
 * - `invalid`: the request was refused (400). The way out is to reset the search.
 */
export type SearchIssue = 'unavailable' | 'invalid' | null;

/** Classify a failed request that carried `term` as `q`. */
export function classifySearchError(error: unknown, term: string | undefined): SearchIssue {
  if (!error || !term) return null;
  if (isSearchUnavailable(error)) return 'unavailable';
  const status = httpStatusOf(error);
  // An error without a status did not come through the generated client; treat it as
  // a refused search so the user is still offered a way out.
  if (status === undefined || status === 400) return 'invalid';
  return null;
}
