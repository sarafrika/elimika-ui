/**
 * Parsing and serialising the admin console's URL state. Filters, tabs, paging and the
 * open record all live in the query string, so a reload or a shared link lands on the
 * same view. Pure functions here; the React hook wraps them.
 */
export type ParamValue = string | number | boolean | undefined;

export interface SearchStateSpec<T> {
  /** Reads one value out of the URL. */
  parse: (raw: string | null) => T;
  /** Writes it back, or returns undefined to drop the parameter. */
  serialise: (value: T) => string | undefined;
}

export const stringParam = (fallback = ''): SearchStateSpec<string> => ({
  parse: raw => raw ?? fallback,
  serialise: value => (value && value !== fallback ? value : undefined),
});

export const enumParam = <T extends string>(allowed: readonly T[], fallback: T): SearchStateSpec<T> => ({
  parse: raw => (allowed.includes(raw as T) ? (raw as T) : fallback),
  serialise: value => (value === fallback ? undefined : value),
});

export const numberParam = (fallback = 0): SearchStateSpec<number> => ({
  parse: raw => {
    const parsed = Number(raw);
    return raw !== null && Number.isFinite(parsed) ? parsed : fallback;
  },
  serialise: value => (value === fallback ? undefined : String(value)),
});

export const booleanParam = (fallback = false): SearchStateSpec<boolean> => ({
  parse: raw => (raw === null ? fallback : raw === 'true'),
  serialise: value => (value === fallback ? undefined : String(value)),
});

/** Apply a patch to existing params, dropping anything a spec serialises away. */
export function applySearchState(
  current: URLSearchParams,
  patch: Record<string, string | undefined>
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) next.delete(key);
    else next.set(key, value);
  }
  return next;
}

/** Changing a filter sends you back to the first page; paging itself does not. */
export const PAGE_RESETTING_KEYS = ['q', 'role', 'status', 'verified', 'active', 'scope', 'type'];

export function withPageReset(
  patch: Record<string, string | undefined>,
  pageKey = 'page'
): Record<string, string | undefined> {
  const touchesFilter = Object.keys(patch).some(key => PAGE_RESETTING_KEYS.includes(key));
  return touchesFilter ? { ...patch, [pageKey]: undefined } : patch;
}
