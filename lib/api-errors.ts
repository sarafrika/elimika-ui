import { asRecord } from '@/lib/error-utils';

/**
 * Reading HTTP outcomes off errors thrown or returned by the generated client.
 *
 * The client hands back the parsed response body, which on its own carries no HTTP
 * status. `services/api/error-interceptor.ts` stamps `status` onto every error, so these
 * helpers read that first and fall back to a `response.status` for errors raised
 * elsewhere (fetch wrappers, server actions).
 */

const SEARCH_UNAVAILABLE_MESSAGE = /search is (?:disabled or temporarily |disabled or )?unavailable/i;

export function httpStatusOf(error: unknown): number | undefined {
  const record = asRecord(error);
  if (!record) return undefined;
  const status = record.status ?? asRecord(record.response)?.status;
  return typeof status === 'number' ? status : undefined;
}

function messagesOf(error: unknown): string[] {
  if (typeof error === 'string') return [error];
  const record = asRecord(error);
  if (!record) return [];
  return [record.message, record.error, asRecord(record.error)?.message].filter(
    (value): value is string => typeof value === 'string'
  );
}

export function isBadRequest(error: unknown): boolean {
  return httpStatusOf(error) === 400;
}

export function isForbidden(error: unknown): boolean {
  return httpStatusOf(error) === 403;
}

export function isConflict(error: unknown): boolean {
  return httpStatusOf(error) === 409;
}

/**
 * The search index could not answer a request carrying `q`: a 503, or the API's
 * "Search is unavailable" message. Applies to every listing called with `q`, not only
 * `/api/v1/search`. There is no database fallback, so the caller drops `q` and shows the
 * list without it.
 */
export function isSearchUnavailable(error: unknown): boolean {
  if (!error) return false;
  if (httpStatusOf(error) === 503) return true;
  return messagesOf(error).some(message => SEARCH_UNAVAILABLE_MESSAGE.test(message));
}

/**
 * React Query `retry` for anything the user cannot fix by waiting a moment: client
 * errors (400, 403, 404) and an unavailable search index are never retried.
 */
export function retryUnlessClientOrSearchError(failureCount: number, error: unknown): boolean {
  if (isSearchUnavailable(error)) return false;
  const status = httpStatusOf(error);
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < 2;
}
