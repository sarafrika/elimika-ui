'use client';
// admin-boundary: foundation

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { applySearchState, type SearchStateSpec, withPageReset } from './search-state';

/**
 * Reads one query parameter and writes it back without a full navigation. Filters,
 * tabs, paging and the open record all go through here.
 */
export function useSearchState<T>(key: string, spec: SearchStateSpec<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const value = useMemo(() => spec.parse(params.get(key)), [params, key, spec]);

  const setValue = useCallback(
    (next: T) => {
      const patch = withPageReset({ [key]: spec.serialise(next) });
      const search = applySearchState(new URLSearchParams(params.toString()), patch).toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [router, pathname, params, key, spec]
  );

  return [value, setValue] as const;
}

/** Writes several parameters at once, for a filter bar that changes more than one. */
export function useSearchStatePatch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return useCallback(
    (patch: Record<string, string | undefined>) => {
      const search = applySearchState(
        new URLSearchParams(params.toString()),
        withPageReset(patch)
      ).toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [router, pathname, params]
  );
}
