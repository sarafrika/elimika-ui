'use client';

import { type FetchQueryOptions, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ComponentProps, type FocusEvent, type MouseEvent, type TouchEvent, useRef } from 'react';

// biome-ignore lint/suspicious/noExplicitAny: generated *Options carry their own data/key generics
export type PrefetchQuery = FetchQueryOptions<any, any, any, any>;

/**
 * Returns hover/focus/touch handlers that prefetch a route and its main query once.
 * Use instead of next/link auto-prefetch on lists of dynamic, server-rendered routes.
 */
export function useIntentPrefetch(href: string | undefined, query?: PrefetchQuery) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const done = useRef(false);

  return () => {
    if (done.current || !href) return;
    done.current = true;
    router.prefetch(href);
    if (query) void queryClient.prefetchQuery(query);
  };
}

type IntentLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: string;
  /** Main query of the destination, warmed alongside the route on intent. */
  prefetchQuery?: PrefetchQuery;
};

/** next/link with viewport prefetch off; prefetches route + query on hover, focus or touch. */
export function IntentLink({
  href,
  prefetchQuery,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: IntentLinkProps) {
  const prefetch = useIntentPrefetch(href, prefetchQuery);
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        prefetch();
        onFocus?.(event);
      }}
      onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => {
        prefetch();
        onTouchStart?.(event);
      }}
    />
  );
}
