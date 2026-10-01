'use client';

import {
  ArrowDownUp,
  BarChart3,
  BookOpen,
  GraduationCap,
  Layers,
  LogIn,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  Wallet,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/dashboard';
import { SectionError } from '@/components/data/async-section';
import { surfaceTheme } from '@/components/data-display';
import { MarketplaceSidebar } from '@/components/profile-job-marketplace/_components/MarketplaceSidebar';
import type { FilterGroup } from '@/components/profile-job-marketplace/data';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchState, useSearchStatePatch } from '@/hooks/use-search-state';
import { useUrlSearchQuery } from '@/hooks/use-url-search-query';
import { classifySearchError } from '@/lib/search/query';
import { cn } from '@/lib/utils';
import {
  activeFilterCount,
  CATALOGUE_PAGE_SIZE,
  type CatalogueFacets,
  type CatalogueFilters,
  type CatalogueItem,
  type CatalogueShow,
  catalogueParams,
  fromPublicCatalogueCourse,
  resultNoun,
  SORT_OPTIONS,
  toCatalogueSearchQuery,
} from '@/src/features/catalogue/catalogue-search';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';
import { useCatalogueSearch } from '@/src/features/catalogue/use-catalogue-search';
import { CatalogueItemCard, CatalogueItemCardSkeleton } from './CatalogueItemCard';

const SHOW_OPTIONS: { value: CatalogueShow; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'courses', label: 'Courses' },
  { value: 'programmes', label: 'Programmes' },
];
const LEVEL_OPTIONS = [
  { value: 'any', label: 'Any level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;
const PRICE_OPTIONS = [
  { value: 'any', label: 'Any price' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
] as const;

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3';

type Totals = { courses?: number; programmes?: number };

/** The Start a Course page's stat pill. */
function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: number;
  label: string;
}) {
  return (
    <span className='border-border bg-background inline-flex items-center gap-1.5 rounded-lg border px-3 py-2'>
      <Icon className='text-primary size-4' aria-hidden />
      <span className='text-foreground text-sm font-semibold tabular-nums'>{value}</span>
      <span className='text-muted-foreground text-sm'>{label}</span>
    </span>
  );
}

/**
 * The public catalogue: one search across published courses and programmes
 * (`GET /api/v1/catalogue/search`), filtered from the facets it answers with. When the
 * search cannot answer, the catalogue the server rendered is listed instead, without the
 * term and without the filters.
 */
export function PublicCoursesPage({
  catalogue,
  hasError = false,
}: {
  catalogue: PublicCatalogueCourse[];
  hasError?: boolean;
}) {
  const { status: sessionStatus } = useSession();
  const signedIn = sessionStatus === 'authenticated';
  const search = useUrlSearchQuery();
  const patch = useSearchStatePatch();
  const [show] = useSearchState('show', catalogueParams.show);
  const [category] = useSearchState('category', catalogueParams.category);
  const [level] = useSearchState('level', catalogueParams.level);
  const [price] = useSearchState('price', catalogueParams.price);
  const [sort] = useSearchState('sort', catalogueParams.sort);
  const [page, setPage] = useSearchState('page', catalogueParams.page);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  const filters: CatalogueFilters = { q: search.q, show, category, level, price, sort, page };
  const query = toCatalogueSearchQuery(filters);
  const result = useCatalogueSearch(query);
  const data = result.data;

  const fallbackItems = useMemo(
    () =>
      catalogue.flatMap(entry => {
        const item = fromPublicCatalogueCourse(entry);
        return item ? [item] : [];
      }),
    [catalogue]
  );
  const providerCount = useMemo(
    () =>
      new Set(
        catalogue
          .map(entry => entry.course.course_creator_uuid ?? entry.creatorName)
          .filter(Boolean)
      ).size,
    [catalogue]
  );

  const narrowed = activeFilterCount(filters);
  const unfiltered = !query.q && narrowed === 0;
  // The catalogue's own totals for the header, remembered from an unfiltered answer so
  // narrowing the list does not change them.
  const [totals, setTotals] = useState<Totals>({});
  const showFacet = data?.facets?.show;
  useEffect(() => {
    if (!unfiltered || !showFacet) return;
    setTotals({ courses: showFacet.courses, programmes: showFacet.programmes });
  }, [unfiltered, showFacet]);

  const fallback = result.unavailable;
  // Before the first answer (and in the server-rendered HTML) an unfiltered first page
  // lists the server's catalogue, so the page is crawlable and never blank.
  const serverFirstPage =
    !data && !result.error && unfiltered && page === 0 && fallbackItems.length > 0;
  const localList = fallback || serverFirstPage;

  const items: CatalogueItem[] = localList ? fallbackItems : (data?.content ?? []);
  const total = localList ? items.length : Number(data?.metadata?.totalElements ?? items.length);
  const totalPages = localList ? 1 : Math.max(1, data?.metadata?.totalPages ?? 1);
  const facets: CatalogueFacets | undefined = localList ? undefined : data?.facets;
  const loading = !localList && result.isLoading;
  const otherError = !fallback && result.error && !data ? result.error : null;
  const issue =
    fallback || search.searchUnavailable
      ? 'unavailable'
      : classifySearchError(result.error, query.q);

  const setFilter = (key: string, value: string | undefined) => patch({ [key]: value });
  const clearAll = () => {
    search.clear();
    patch({ show: undefined, category: undefined, level: undefined, price: undefined });
  };

  // An "All" row counts the list when its own group is not narrowing it.
  const allCount = (groupActive: boolean) => (facets && !groupActive ? total : undefined);
  const filterGroups: FilterGroup[] = [
    {
      title: 'Show',
      icon: Layers,
      // `show` counts ignore `show` itself, so every row keeps its count.
      items: SHOW_OPTIONS.map(option => ({
        label: option.label,
        count: facets?.show?.[option.value],
        active: show === option.value,
        onSelect: () => setFilter('show', option.value),
      })),
    },
    {
      title: 'Category',
      icon: Tag,
      items: [
        {
          label: 'All',
          count: allCount(Boolean(category)),
          active: !category,
          onSelect: () => setFilter('category', undefined),
        },
        ...(facets?.category ?? []).map(option => ({
          label: option.name,
          count: option.count,
          active: category === option.uuid,
          onSelect: () => setFilter('category', option.uuid),
        })),
      ],
    },
    {
      title: 'Level',
      icon: BarChart3,
      items: LEVEL_OPTIONS.map(option => ({
        label: option.label,
        count: option.value === 'any' ? allCount(level !== 'any') : facets?.level?.[option.value],
        active: level === option.value,
        onSelect: () => setFilter('level', option.value),
      })),
    },
    {
      title: 'Price',
      icon: Wallet,
      items: PRICE_OPTIONS.map(option => ({
        label: option.label,
        // Each facet group ignores its own selection, so free + paid is the list without a
        // price filter. Levels overlap (a programme spans several), so "Any level" cannot sum.
        count:
          option.value === 'any'
            ? facets?.price
              ? (facets.price.free ?? 0) + (facets.price.paid ?? 0)
              : undefined
            : facets?.price?.[option.value],
        active: price === option.value,
        onSelect: () => setFilter('price', option.value),
      })),
    },
  ];

  const catalogueTotal = (totals.courses ?? 0) + (totals.programmes ?? 0);
  const sidebar = (
    <MarketplaceSidebar
      heading='Filters'
      count={
        catalogueTotal > total
          ? `${total} of ${catalogueTotal} courses and programmes`
          : `${total} courses and programmes`
      }
      groups={filterGroups}
      footer={
        signedIn ? null : (
          <Button
            type='button'
            variant='outline'
            className='h-auto w-full py-2 whitespace-normal'
            onClick={() =>
              void signIn('keycloak', { redirectTo: `${window.location.origin}/dashboard` })
            }
          >
            <LogIn aria-hidden />
            Sign in to see your recommendations
          </Button>
        )
      }
    />
  );

  const courseCount =
    totals.courses ??
    showFacet?.courses ??
    (localList && fallbackItems.length > 0 ? fallbackItems.length : undefined);
  const programmeCount = totals.programmes ?? showFacet?.programmes;
  const first = total === 0 ? 0 : page * CATALOGUE_PAGE_SIZE + 1;
  const last = localList ? total : Math.min(total, page * CATALOGUE_PAGE_SIZE + items.length);

  let body: ReactNode;
  if (fallback && hasError) {
    body = (
      <SectionError
        title='Unable to load courses'
        error={{ message: 'Please refresh the page or try again later.' }}
      />
    );
  } else if (otherError) {
    body = (
      <SectionError
        title='Couldn’t load the catalogue'
        error={otherError}
        onRetry={() => void result.refetch()}
      />
    );
  } else if (loading) {
    body = (
      <div className={GRID} aria-hidden>
        {Array.from({ length: 6 }, (_, index) => (
          <CatalogueItemCardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (items.length === 0 && localList) {
    body = (
      <EmptyState
        variant='plain'
        className='border-border bg-muted/30 rounded-2xl border border-dashed'
        icon={BookOpen}
        title='No courses available'
        description='Our catalogue is being updated. Check back soon for new courses.'
      />
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        variant='plain'
        className='border-border bg-muted/30 rounded-2xl border border-dashed'
        icon={Search}
        title={query.q ? `Nothing matches “${query.q}”` : 'Nothing matches these filters'}
        description={
          query.q
            ? 'No course or programme matches. Try a shorter word, or clear the filters.'
            : 'Clear a filter to see more of the catalogue.'
        }
        action={
          <>
            {query.q ? (
              <Button variant='outline' size='sm' onClick={search.clear}>
                Clear search
              </Button>
            ) : null}
            {narrowed > 0 ? (
              <Button variant='outline' size='sm' onClick={clearAll}>
                Clear filters
              </Button>
            ) : null}
          </>
        }
      />
    );
  } else {
    body = (
      <>
        <ul className={GRID} aria-label='Courses and programmes'>
          {items.map(item => (
            <li key={`${item.type}-${item.uuid}`} className='min-w-0'>
              <CatalogueItemCard item={item} signedIn={signedIn} />
            </li>
          ))}
        </ul>
        <nav
          aria-label='Pages'
          className='flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row'
        >
          <span className='text-muted-foreground text-sm tabular-nums'>
            Showing {first}–{last} of {total}
          </span>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Button
              variant='ghost'
              size='sm'
              disabled={page <= 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className='tabular-nums'>
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant='ghost'
              size='sm'
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      </>
    );
  }

  return (
    <main className={cn(surfaceTheme.page, 'max-w-7xl px-4 pt-7 pb-14 sm:px-6 lg:px-6')}>
      <div className='flex w-full flex-col gap-5'>
        <PageHeader
          eyebrow='Catalogue'
          title='Courses and programmes'
          description='One search across every published course and programme.'
          actions={
            <>
              {courseCount !== undefined ? (
                <StatPill
                  icon={GraduationCap}
                  value={courseCount}
                  label={courseCount === 1 ? 'Course' : 'Courses'}
                />
              ) : null}
              {programmeCount !== undefined ? (
                <StatPill
                  icon={Layers}
                  value={programmeCount}
                  label={programmeCount === 1 ? 'Programme' : 'Programmes'}
                />
              ) : null}
              {providerCount > 0 ? (
                <StatPill
                  icon={Users}
                  value={providerCount}
                  label={providerCount === 1 ? 'Provider' : 'Providers'}
                />
              ) : null}
            </>
          }
        />

        <div
          className={cn(
            'grid items-start gap-5',
            !fallback && 'lg:grid-cols-[280px_minmax(0,1fr)]'
          )}
        >
          {fallback ? null : <div className='hidden lg:sticky lg:top-24 lg:block'>{sidebar}</div>}

          <section
            aria-label='Results'
            aria-busy={result.isFetching}
            className='flex min-w-0 flex-col gap-4'
          >
            <div
              role='group'
              aria-label='Search and sort'
              className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-3 p-4 lg:flex-row')}
            >
              <SearchQueryInput
                search={search}
                aria-label='Search courses and programmes'
                placeholder={
                  isMobile
                    ? 'Search courses and programmes'
                    : 'Search courses and programmes by title, skill or creator'
                }
                className='h-10'
                wrapperClassName='min-w-0'
              />
              {fallback ? null : (
                <div className='grid grid-cols-2 gap-2 lg:flex lg:w-56 lg:shrink-0'>
                  <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant='outline' className='h-10 lg:hidden'>
                        <SlidersHorizontal aria-hidden />
                        Filters
                        {narrowed > 0 ? (
                          <span className='bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full text-[0.7rem] font-semibold tabular-nums'>
                            <span className='sr-only'>active: </span>
                            {narrowed}
                          </span>
                        ) : null}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side='right' className='w-[88vw] max-w-sm overflow-y-auto p-4'>
                      <SheetHeader className='sr-only'>
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                          Narrow the courses and programmes you see.
                        </SheetDescription>
                      </SheetHeader>
                      {sidebar}
                    </SheetContent>
                  </Sheet>
                  <Select
                    value={sort}
                    onValueChange={value =>
                      setFilter('sort', value === 'relevance' ? undefined : value)
                    }
                  >
                    <SelectTrigger aria-label='Sort' className='h-10 w-full'>
                      <ArrowDownUp aria-hidden className='text-muted-foreground hidden size-4 lg:block' />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <SearchNotice
              issue={issue}
              onReset={() => {
                search.retrySearch();
                if (search.input) search.clear();
                else void result.refetch();
              }}
            />

            {loading || otherError || (fallback && hasError) ? null : (
              <p className='text-muted-foreground text-sm' aria-live='polite'>
                <span className='text-foreground font-semibold tabular-nums'>{total}</span>{' '}
                {resultNoun(localList ? 'courses' : show, total)}
              </p>
            )}

            {body}
          </section>
        </div>
      </div>
    </main>
  );
}
