'use client';

import { BookOpen, ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { FacetChips } from '@/components/search/facet-chips';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchState, useSearchStatePatch } from '@/hooks/use-search-state';
import { useUrlSearchQuery } from '@/hooks/use-url-search-query';
import { classifySearchError } from '@/lib/search/query';
import { enumParam, numberParam } from '@/lib/search-state';
import type { GlobalSearchHit } from '@/services/client';
import { filterCatalogueCourses } from '@/src/features/catalogue/format';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';
import { useTypeSearch } from '@/src/features/search/hooks/use-type-search';
import { CataloguePageShell } from './CataloguePageShell';
import { CatalogueStatusCard } from './CatalogueStatusCard';
import { PublicCourseCard } from './PublicCourseCard';

const PAGE_SIZE = 24;

const priceParam = enumParam(['all', 'free', 'paid'] as const, 'all');
const SORTS = {
  relevance: { label: 'Best match', value: undefined },
  newest: { label: 'Newest', value: 'created_at,desc' },
  rating: { label: 'Top rated', value: 'rating_bayes,desc' },
  popular: { label: 'Popular', value: 'popularity_30d,desc' },
} as const;
type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];
const sortParam = enumParam(SORT_KEYS, 'relevance');
const pageParam = numberParam(0);

/** A hit the server-rendered catalogue page did not carry: the card from the hit alone. */
const fromHit = (hit: GlobalSearchHit): PublicCatalogueCourse => ({
  course: {
    uuid: hit.uuid,
    name: hit.title,
    description: hit.subtitle,
    thumbnail_url: hit.image_url ?? null,
    is_published: true,
  },
  creator: null,
  catalogueItem: null,
  priceAmount: null,
  currencyCode: null,
  isFree: false,
});

/**
 * The public course catalogue. Text, price and sort are served by the anonymous course
 * search (`GET /search/courses`, which only returns public, published courses to a
 * logged-out visitor) with the price facet counted. A hit renders from the richer
 * catalogue entry the server loaded when there is one. When the index is down, the
 * server-rendered catalogue is narrowed in the browser instead.
 */
export function PublicCoursesPage({
  catalogue,
  hasError = false,
}: {
  catalogue: PublicCatalogueCourse[];
  hasError?: boolean;
}) {
  const search = useUrlSearchQuery();
  const patch = useSearchStatePatch();
  const [price] = useSearchState('price', priceParam);
  const [sortKey] = useSearchState('sort', sortParam);
  const [page, setPage] = useSearchState('page', pageParam);

  const courseSearch = useTypeSearch({
    type: 'courses',
    q: search.q,
    filters: { is_free: price === 'all' ? undefined : price === 'free' },
    facets: 'is_free',
    // Without a term there is no relevance to rank by: newest first.
    sort: SORTS[sortKey].value ?? (search.q ? undefined : SORTS.newest.value),
    page,
    size: PAGE_SIZE,
    enabled: !search.searchUnavailable,
  });

  const searchDown = search.searchUnavailable || courseSearch.searchUnavailable;
  const issue = searchDown ? 'unavailable' : classifySearchError(courseSearch.error, search.q);

  const byUuid = useMemo(
    () => new Map(catalogue.map(item => [item.course.uuid ?? '', item] as const)),
    [catalogue]
  );

  const items = useMemo<PublicCatalogueCourse[]>(() => {
    if (searchDown) {
      const narrowed = filterCatalogueCourses(catalogue, search.input.trim());
      return price === 'all'
        ? narrowed
        : narrowed.filter(item => item.isFree === (price === 'free'));
    }
    return courseSearch.hits.flatMap(hit =>
      hit.uuid ? [byUuid.get(hit.uuid) ?? fromHit(hit)] : []
    );
  }, [searchDown, catalogue, search.input, price, courseSearch.hits, byUuid]);

  const total = searchDown ? items.length : Number(courseSearch.metadata?.totalElements ?? 0);
  const totalPages = searchDown ? 1 : (courseSearch.metadata?.totalPages ?? 1);
  const freeCounts = courseSearch.facets.is_free ?? {};
  const isSearching = search.input.trim().length > 0 || price !== 'all';
  const loading = !searchDown && courseSearch.isLoading;

  return (
    <CataloguePageShell>
      <header className='border-border bg-card space-y-6 rounded-[36px] border p-8 shadow-xl backdrop-blur-sm lg:p-12'>
        <div className='border-primary/40 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.4em] uppercase'>
          Catalogue
        </div>
        <div className='space-y-4'>
          <h1 className='text-foreground text-3xl font-semibold sm:text-4xl'>
            {search.q ? `Courses matching “${search.q}”` : 'Browse our course catalogue'}
          </h1>
          <p className='text-muted-foreground max-w-3xl text-base'>
            Explore courses created by expert instructors and organisations. Find the right
            course to advance your skills and learning goals.
          </p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
          <SearchQueryInput
            search={search}
            placeholder='Search courses by title, skill or creator'
            aria-label='Search courses'
          />
          <Select
            value={sortKey}
            onValueChange={value => patch({ sort: value === 'relevance' ? undefined : value })}
          >
            <SelectTrigger className='w-full sm:w-44' aria-label='Sort courses'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_KEYS.map(key => (
                <SelectItem key={key} value={key}>
                  {SORTS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FacetChips
          label='Price'
          multiple={false}
          selected={price === 'all' ? [] : [price]}
          onChange={next => patch({ price: next[0] })}
          options={[
            { value: 'free', label: 'Free', count: searchDown ? undefined : freeCounts.true },
            { value: 'paid', label: 'Paid', count: searchDown ? undefined : freeCounts.false },
          ]}
        />
      </header>

      <SearchNotice issue={issue} onReset={search.clear} />

      <section className='space-y-6' aria-busy={courseSearch.isFetching}>
        {hasError && searchDown ? (
          <CatalogueStatusCard
            title='Unable to load courses'
            description='Please refresh the page or try again later. If the issue persists, contact support.'
            icon={CircleAlert}
            tone='error'
          />
        ) : loading ? (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className='h-[360px] w-full rounded-[28px]' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <CatalogueStatusCard
            title={isSearching ? 'No courses matched your search' : 'No courses available'}
            description={
              isSearching
                ? 'Try a shorter search, a different spelling, or clear the filters to see the whole catalogue.'
                : 'Our catalogue is being updated. Check back soon for new courses.'
            }
            icon={BookOpen}
          />
        ) : (
          <>
            <p className='text-muted-foreground text-sm' aria-live='polite'>
              <span className='text-foreground font-semibold'>{total}</span>{' '}
              {total === 1 ? 'course' : 'courses'} {isSearching ? 'found' : 'available'}
            </p>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {items.map(item => (
                <PublicCourseCard key={item.course.uuid} item={item} />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav className='flex items-center justify-center gap-3' aria-label='Pages'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page <= 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className='size-4' /> Previous
                </Button>
                <span className='text-muted-foreground text-sm tabular-nums'>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight className='size-4' />
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </CataloguePageShell>
  );
}
