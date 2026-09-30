'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/use-debounced-value';
import type { SearchQueryState } from '@/hooks/use-search-query';
import { useSearchState, useSearchStatePatch } from '@/hooks/use-search-state';
import {
  clearSearchUnavailable,
  isSearchMarkedUnavailable,
  subscribeSearchAvailability,
} from '@/lib/search/availability';
import { MIN_SEARCH_TERM_LENGTH, toSearchTerm } from '@/lib/search/query';
import { stringParam } from '@/lib/search-state';

const termParam = stringParam();

/**
 * `useSearchQuery` for a list whose term lives in the URL (`?q=`), so a reload or a
 * "See all" link from the palette lands on the same search. Typing is debounced before it
 * is written back with `router.replace`, which also resets paging. `q` is the term to send
 * (2+ characters), dropped while the search index is marked unavailable.
 */
export function useUrlSearchQuery({
  key = 'q',
  delay = SEARCH_DEBOUNCE_MS,
}: { key?: string; delay?: number } = {}): SearchQueryState {
  const [urlValue] = useSearchState(key, termParam);
  const patch = useSearchStatePatch();
  const [input, setInput] = useState(urlValue);
  const debounced = useDebouncedValue(input, delay);
  const searchUnavailable = useSyncExternalStore(
    subscribeSearchAvailability,
    () => isSearchMarkedUnavailable(),
    () => false
  );

  // The URL changed from elsewhere (back button, a link with ?q=): show it in the box.
  const lastUrlValue = useRef(urlValue);
  useEffect(() => {
    if (urlValue === lastUrlValue.current) return;
    lastUrlValue.current = urlValue;
    setInput(current => (current.trim() === urlValue.trim() ? current : urlValue));
  }, [urlValue]);

  // Write the settled text back, only when the text itself changed.
  const lastDebounced = useRef(debounced);
  useEffect(() => {
    if (debounced === lastDebounced.current) return;
    lastDebounced.current = debounced;
    const next = debounced.trim();
    if (next === urlValue.trim()) return;
    lastUrlValue.current = next;
    patch({ [key]: next || undefined });
  }, [debounced, urlValue, key, patch]);

  const clear = useCallback(() => {
    setInput('');
    lastUrlValue.current = '';
    patch({ [key]: undefined });
  }, [patch, key]);
  const retrySearch = useCallback(() => clearSearchUnavailable(), []);

  const sentTerm = toSearchTerm(urlValue);
  const typedTerm = toSearchTerm(input);
  const trimmedLength = input.trim().length;

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
