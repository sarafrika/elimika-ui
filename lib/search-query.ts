import { asRecord } from '@/lib/error-utils';

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

const UNAVAILABLE_MESSAGE = /search is (?:disabled or temporarily )?unavailable/i;

function statusOf(error: unknown): number | undefined {
  const record = asRecord(error);
  const status = record?.status ?? asRecord(record?.response)?.status;
  return typeof status === 'number' ? status : undefined;
}

function messagesOf(error: unknown): string[] {
  const record = asRecord(error);
  if (!record) return typeof error === 'string' ? [error] : [];
  return [record.message, record.error, asRecord(record.error)?.message].filter(
    (value): value is string => typeof value === 'string'
  );
}

/**
 * The generated client throws the API's error body, which carries no HTTP status, so a
 * 503 from the search index is recognised by its message ("Search is unavailable").
 */
export function isSearchUnavailableError(error: unknown): boolean {
  if (!error) return false;
  if (statusOf(error) === 503) return true;
  return messagesOf(error).some(message => UNAVAILABLE_MESSAGE.test(message));
}

/**
 * Classify a failed search. Without a status on the error body, any other failure while
 * a term is being searched is treated as a refused search, so the user is offered a reset.
 */
export function classifySearchError(error: unknown, term: string | undefined): SearchIssue {
  if (!error || !term) return null;
  if (isSearchUnavailableError(error)) return 'unavailable';
  const status = statusOf(error);
  if (status !== undefined && status !== 400) return null;
  return 'invalid';
}
