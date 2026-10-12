'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/use-debounced-value';
import { isSearchUnavailable } from '@/lib/api-errors';
import {
  clearSearchUnavailable,
  isSearchMarkedUnavailable,
  markSearchUnavailable,
  subscribeSearchAvailability,
} from '@/lib/search/availability';
import {
  classifySearchError,
  MIN_SEARCH_TERM_LENGTH,
  type SearchIssue,
  toSearchTerm,
} from '@/lib/search/query';

export type SearchQueryState = {
  /** What is in the box, updated on every keystroke. */
  input: string;
  setInput: (value: string) => void;
  clear: () => void;
  /**
   * The term to send as `q`: debounced, trimmed, at least two characters, and undefined
   * while search is unavailable so the list loads without it.
   */
  q: string | undefined;
  /** The box holds a term that has not been sent yet. Show a spinner in the input. */
  isPending: boolean;
  /** One character typed: show a hint and send nothing. */
  tooShort: boolean;
  /** The index answered 503 within the last minute. Show the banner above the list. */
  searchUnavailable: boolean;
  /** "Try again": send `q` on the next request. */
  retrySearch: () => void;
};

function useSearchMarkedUnavailable() {
  return useSyncExternalStore(
    subscribeSearchAvailability,
    () => isSearchMarkedUnavailable(),
    () => false
  );
}

/**
 * Local state for a server-searched list: debounces the text, enforces the two-character
 * minimum and drops `q` for a minute after the index answers 503. Feed the list query's
 * error back through `useSearchErrors` so a 503 is noticed.
 */
export function useSearchQuery({
  initial = '',
  delay = SEARCH_DEBOUNCE_MS,
}: { initial?: string; delay?: number } = {}): SearchQueryState {
  const [input, setInput] = useState(initial);
  const debounced = useDebouncedValue(input, delay);
  const searchUnavailable = useSearchMarkedUnavailable();

  const typedTerm = toSearchTerm(input);
  const sentTerm = toSearchTerm(debounced);
  const trimmedLength = input.trim().length;

  const clear = useCallback(() => setInput(''), []);
  const retrySearch = useCallback(() => clearSearchUnavailable(), []);

  return useMemo(
    () => ({
      input,
      setInput,
      clear,
      q: searchUnavailable ? undefined : sentTerm,
      isPending: typedTerm !== sentTerm,
      tooShort: trimmedLength > 0 && trimmedLength < MIN_SEARCH_TERM_LENGTH,
      searchUnavailable,
      retrySearch,
    }),
    [input, clear, searchUnavailable, sentTerm, typedTerm, trimmedLength, retrySearch]
  );
}

/**
 * Report the errors of the queries that carried `q`. A 503 (or "Search is unavailable")
 * marks search unavailable for 60 seconds; the default query `retry`
 * (`retryUnlessClientOrSearchError`) never retries the 503 itself.
 */
export function useSearchErrors(q: string | undefined, ...errors: unknown[]) {
  const unavailable = Boolean(q) && errors.some(error => isSearchUnavailable(error));
  useEffect(() => {
    if (unavailable) markSearchUnavailable();
  }, [unavailable]);
}

/**
 * `useSearchErrors` plus the issue to show above the list: `unavailable` while the index
 * is marked down (the list has already reloaded without `q`), `invalid` when a request
 * carrying `q` was refused with a 400.
 */
export function useSearchIssue(
  search: Pick<SearchQueryState, 'q' | 'searchUnavailable'>,
  ...errors: unknown[]
): SearchIssue {
  useSearchErrors(search.q, ...errors);
  if (search.searchUnavailable) return 'unavailable';
  for (const error of errors) {
    const issue = classifySearchError(error, search.q);
    if (issue) return issue;
  }
  return null;
}
