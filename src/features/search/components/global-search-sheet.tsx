'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Clock, Search, SearchX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Highlight } from '@/components/search/highlight';
import { SEARCH_UNAVAILABLE_TITLE } from '@/components/search/search-unavailable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useSearchQuery } from '@/hooks/use-search-query';
import { isSearchType } from '@/lib/search/type-search';
import type { UserDomain } from '@/lib/types';
import type { GlobalSearchHit } from '@/services/client';
import { getInstructorByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useGlobalSearch } from '../hooks/use-global-search';
import {
  hitDestination,
  PALETTE_TYPES,
  type PaletteDomain,
  quickLinks,
  seeAllHref,
  TYPE_LABELS,
  toPaletteDomain,
} from '../lib/hit-href';

/** The palette debounces by 200 ms (listings use 250). */
const PALETTE_DEBOUNCE_MS = 200;
const RECENT_KEY = 'elimika.palette.recent';
const RECENT_LIMIT = 5;

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function writeRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter(item => item !== term)].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage may be blocked; recent searches are a convenience only.
  }
}

const initialsOf = (value?: string) =>
  (value ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';

/**
 * ⌘K / Ctrl K from anywhere, and `/` when the cursor is not in a text field, opens the
 * palette. Esc closes it (the Sheet handles that).
 */
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpen();
        return;
      }
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      onOpen();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);
}

/**
 * The global search palette: `<Command shouldFilter={false}>` in a right-side Sheet (never
 * a Dialog). One grouped request to `/api/v1/search` per settled term, limited to the
 * types this dashboard can open. There is no database fallback: when search is down the
 * palette says so and offers the role's quick links.
 */
export function GlobalSearchSheet({
  open,
  onOpenChange,
  domain,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: UserDomain | null;
}) {
  const paletteDomain = toPaletteDomain(domain);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'>
        <SheetHeader className='sr-only'>
          <SheetTitle>Search</SheetTitle>
          <SheetDescription>Search courses, programs, classes, jobs and people.</SheetDescription>
        </SheetHeader>
        {open && paletteDomain ? (
          <Palette domain={paletteDomain} onClose={() => onOpenChange(false)} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Palette({ domain, onClose }: { domain: PaletteDomain; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = useSearchQuery({ delay: PALETTE_DEBOUNCE_MS });
  const [recent, setRecent] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);
  const types = PALETTE_TYPES[domain];
  const results = useGlobalSearch({ q: search.q, types, limit: 5 });

  useEffect(() => setRecent(readRecent()), []);

  const go = useCallback(
    (href: string) => {
      if (search.q) writeRecent(search.q);
      onClose();
      router.push(href);
    },
    [onClose, router, search.q]
  );

  const openHit = async (hit: GlobalSearchHit) => {
    if (!isSearchType(hit.type) || !hit.uuid) return;
    const destination = hitDestination(domain, { type: hit.type, uuid: hit.uuid, title: hit.title });
    if (!destination) return;
    if (destination.kind === 'href') {
      go(destination.href);
      return;
    }
    // The one lookup the palette makes on select: an instructor's user, for person pages.
    setResolving(true);
    try {
      const response = await queryClient.fetchQuery(
        getInstructorByUuidOptions({ path: { uuid: hit.uuid } })
      );
      const userUuid = response?.user_uuid;
      if (userUuid) go(destination.build(userUuid));
      else toast.error('This instructor has no public profile yet.');
    } catch {
      toast.error('Could not open this instructor.');
    } finally {
      setResolving(false);
    }
  };

  const unavailable = search.searchUnavailable || results.searchUnavailable;
  const hasTerm = Boolean(results.term);
  const totalHits = results.groups.reduce((sum, group) => sum + group.hits.length, 0);
  const links = quickLinks(domain);

  return (
    <Command
      shouldFilter={false}
      className='[&_[cmdk-group-heading]]:text-muted-foreground h-full rounded-none [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium'
    >
      <div className='border-b pr-12'>
        <CommandInput
          value={search.input}
          onValueChange={search.setInput}
          placeholder='Search courses, programs, jobs and people…'
          aria-label='Search'
          className='h-12'
          autoFocus
        />
      </div>
      <p className='sr-only' aria-live='polite'>
        {hasTerm && !results.isFetching ? `${totalHits} results` : ''}
      </p>
      <CommandList className='max-h-none flex-1 overflow-y-auto p-2'>
        {unavailable ? (
          <div className='space-y-4 p-4'>
            <div className='flex items-start gap-3'>
              <SearchX aria-hidden className='text-warning mt-0.5 size-5 shrink-0' />
              <div className='space-y-1'>
                <p className='text-foreground text-sm font-medium'>{SEARCH_UNAVAILABLE_TITLE}</p>
                <p className='text-muted-foreground text-sm'>
                  Try again in a moment, or go straight to one of these pages.
                </p>
                <Button variant='outline' size='sm' className='mt-1' onClick={search.retrySearch}>
                  Try again
                </Button>
              </div>
            </div>
            <QuickLinks links={links} onSelect={go} />
          </div>
        ) : !hasTerm ? (
          <>
            {search.tooShort ? (
              <p className='text-muted-foreground px-3 py-2 text-xs'>Type at least 2 characters</p>
            ) : null}
            {recent.length > 0 ? (
              <CommandGroup heading='Recent searches'>
                {recent.map(term => (
                  <CommandItem key={term} value={`recent:${term}`} onSelect={() => search.setInput(term)}>
                    <Clock aria-hidden className='text-muted-foreground size-4' />
                    <span className='truncate'>{term}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <QuickLinks links={links} onSelect={go} />
          </>
        ) : results.isLoading ? (
          <div className='space-y-2 p-2' aria-busy>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className='flex items-center gap-3'>
                <Skeleton className='size-8 rounded-full' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-3.5 w-2/3' />
                  <Skeleton className='h-3 w-1/3' />
                </div>
              </div>
            ))}
          </div>
        ) : results.invalid || (results.isError && !unavailable) ? (
          <p className='text-muted-foreground p-4 text-sm'>This search could not be run. Try other words.</p>
        ) : results.groups.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm'>
            <Search aria-hidden className='size-5' />
            Nothing matches “{results.term}”.
          </div>
        ) : (
          results.groups.map(group => {
            const seeAll = seeAllHref(domain, group.type, results.term ?? '');
            return (
              <CommandGroup
                key={group.type}
                heading={`${TYPE_LABELS[group.type]} · ${group.total}`}
              >
                {group.hits.map(hit => (
                  <CommandItem
                    key={`${hit.type}:${hit.uuid}`}
                    value={`${hit.type}:${hit.uuid}`}
                    disabled={resolving}
                    onSelect={() => void openHit(hit)}
                    className='gap-3'
                  >
                    <Avatar className='size-8'>
                      {hit.image_url ? (
                        <AvatarImage src={toAuthenticatedMediaUrl(hit.image_url) ?? undefined} alt='' />
                      ) : null}
                      <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                        {initialsOf(hit.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <Highlight
                        value={hit.highlight}
                        fallback={hit.title}
                        className='text-foreground block truncate text-sm'
                      />
                      {hit.subtitle ? (
                        <p className='text-muted-foreground truncate text-xs'>{hit.subtitle}</p>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
                {seeAll && group.total > group.hits.length ? (
                  <CommandItem
                    value={`see-all:${group.type}`}
                    onSelect={() => go(seeAll)}
                    className='text-primary text-xs font-medium'
                  >
                    See all {group.total}
                    <ArrowRight aria-hidden className='size-3.5' />
                  </CommandItem>
                ) : null}
              </CommandGroup>
            );
          })
        )}
      </CommandList>
      {resolving || (results.isFetching && !results.isLoading) ? (
        <div className='text-muted-foreground flex items-center gap-2 border-t px-4 py-2 text-xs'>
          <Spinner /> {resolving ? 'Opening…' : 'Searching…'}
        </div>
      ) : null}
    </Command>
  );
}

function QuickLinks({
  links,
  onSelect,
}: {
  links: { label: string; href: string }[];
  onSelect: (href: string) => void;
}) {
  return (
    <CommandGroup heading='Go to'>
      {links.map(link => (
        <CommandItem key={link.href} value={`link:${link.href}`} onSelect={() => onSelect(link.href)}>
          <ArrowRight aria-hidden className='text-muted-foreground size-4' />
          {link.label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
