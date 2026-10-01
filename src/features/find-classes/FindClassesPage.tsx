'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  SearchX,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { EntityCombobox, type EntityOption } from '@/components/search/entity-combobox';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { SearchUnavailable } from '@/components/search/search-unavailable';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { useSearchState, useSearchStatePatch } from '@/hooks/use-search-state';
import { useUrlSearchQuery } from '@/hooks/use-url-search-query';
import { isSearchUnavailable, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { formatDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { classifySearchError } from '@/lib/search/query';
import { numberParam } from '@/lib/search-state';
import type {
  ClassDefinition,
  GetAllClassDefinitionsData,
  GetPublishedCoursesResponse,
} from '@/services/client';
import {
  getAllClassDefinitionsOptions,
  getPublishedCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useNearMe } from '@/src/features/near-me/near-me';
import { DistanceBandBadge, NearMeControl } from '@/src/features/near-me/near-me-control';
import {
  type ClassFilters,
  FORMAT_OPTIONS,
  hasClassFilters,
  LOCATION_OPTIONS,
  matchesClassFilters,
  parseClassFilters,
  toClassSearchParams,
} from './class-filters';

const PAGE_SIZE = 20;
const ANY = 'any';
const pageParam = numberParam(0);

type ClassesQuery = GetAllClassDefinitionsData['query'] & {
  searchParams?: Record<string, string>;
};

/** Where a learner enrols in a class of a course, per dashboard. */
function enrolHref(domain: 'student' | 'parent', courseUuid: string, classUuid: string) {
  const path =
    domain === 'parent'
      ? `all-courses/available-classes/${courseUuid}/enroll`
      : `courses/available-classes/${courseUuid}/enroll`;
  return `${dashboardUrl(domain, path)}?id=${encodeURIComponent(classUuid)}`;
}

const LOCATION_LABEL = Object.fromEntries(
  LOCATION_OPTIONS.map(option => [option.value, option.label])
) as Record<string, string>;
const FORMAT_LABEL = Object.fromEntries(
  FORMAT_OPTIONS.map(option => [option.value, option.label])
) as Record<string, string>;

/**
 * "Find classes" for learners: every class the caller may join, across all courses, from
 * `GET /classes` with `q`, near-me, filters and server paging. Text and near-me are served
 * by the classes search index; a class's distance comes back as a coarse band only.
 */
export function FindClassesPage({ domain }: { domain: 'student' | 'parent' }) {
  const params = useSearchParams();
  const patch = useSearchStatePatch();
  const search = useUrlSearchQuery();
  const nearMe = useNearMe();
  const [page, setPage] = useSearchState('page', pageParam);
  const filters = useMemo(() => parseClassFilters(key => params.get(key)), [params]);
  const setFilter = (key: keyof ClassFilters, value: string | undefined) =>
    patch({ [key]: value || undefined, page: undefined });

  const query: ClassesQuery = {
    ...(search.q ? { q: search.q } : {}),
    ...nearMe.params,
    pageable: { page, size: PAGE_SIZE },
    searchParams: toClassSearchParams(filters),
  };
  const classes = useQuery({
    ...getAllClassDefinitionsOptions({ query }),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.live,
    retry: retryUnlessClientOrSearchError,
  });

  // The plain listing (no q, no near) does not apply filters on the server: narrow the
  // page here too, which is a no-op where the server already filtered.
  const searchPath = Boolean(search.q) || nearMe.active;
  const rows = useMemo(
    () =>
      (classes.data?.data?.content ?? []).flatMap(item => {
        const definition = item.class_definition;
        if (!definition?.uuid || !matchesClassFilters(definition, filters)) return [];
        return [{ definition, band: item.distance_band }];
      }),
    [classes.data, filters]
  );
  const metadata = classes.data?.data?.metadata;
  const totalPages = metadata?.totalPages ?? 1;
  const total = Number(metadata?.totalElements ?? rows.length);

  const courseIds = useMemo(
    () => rows.flatMap(row => (row.definition.course_uuid ? [row.definition.course_uuid] : [])),
    [rows]
  );
  const courses = useCoursesByIds(filters.course ? [...courseIds, filters.course] : courseIds);

  const unavailable = search.searchUnavailable || isSearchUnavailable(classes.error);
  const issue = unavailable ? 'unavailable' : classifySearchError(classes.error, search.q);
  const filtered = hasClassFilters(filters);

  const clearAll = () => {
    search.clear();
    nearMe.clear();
    patch({
      course: undefined,
      location: undefined,
      format: undefined,
      from: undefined,
      organisation: undefined,
      page: undefined,
    });
  };

  return (
    <div className='space-y-6 px-4 py-6 sm:px-5 lg:px-6'>
      <PageHeader
        eyebrow='Classes'
        title='Find classes'
        description='Every class you can join, across all courses. Search by name, trainer or place, or look near you.'
      />

      <Card className='gap-4 p-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-start'>
          <SearchQueryInput
            search={search}
            placeholder='Search classes, courses, trainers or places'
            aria-label='Search classes'
          />
          <NearMeControl nearMe={nearMe} />
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          <div className='space-y-1.5'>
            <Label>Course</Label>
            <EntityCombobox
              value={filters.course ?? ''}
              onChange={value => setFilter('course', value)}
              selectedLabel={
                filters.course ? (courses.courseMap[filters.course]?.name ?? 'Selected course') : undefined
              }
              queryOptions={q =>
                getPublishedCoursesOptions({
                  query: { ...(q ? { q } : {}), pageable: { page: 0, size: 20 } },
                })
              }
              toOptions={(data: GetPublishedCoursesResponse) =>
                (data.data?.content ?? []).flatMap((course): EntityOption[] =>
                  course.uuid && course.name ? [{ value: course.uuid, label: course.name }] : []
                )
              }
              placeholder='Any course'
              searchPlaceholder='Search courses…'
              emptyText='No course matches'
              aria-label='Filter by course'
              className='w-full'
            />
          </div>
          <FilterSelect
            label='Location'
            value={filters.location}
            options={LOCATION_OPTIONS}
            onChange={value => setFilter('location', value)}
          />
          <FilterSelect
            label='Session format'
            value={filters.format}
            options={FORMAT_OPTIONS}
            onChange={value => setFilter('format', value)}
          />
          <div className='space-y-1.5'>
            <Label htmlFor='find-classes-from'>Starting from</Label>
            <Input
              id='find-classes-from'
              type='date'
              value={filters.from ?? ''}
              onChange={event => setFilter('from', event.target.value)}
            />
          </div>
        </div>

        {filtered ? (
          <div className='flex flex-wrap items-center gap-2'>
            {filters.organisation ? (
              <Badge variant='secondary' className='gap-1'>
                One organisation
                <button
                  type='button'
                  aria-label='Remove the organisation filter'
                  onClick={() => setFilter('organisation', undefined)}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            ) : null}
            <Button variant='ghost' size='sm' onClick={clearAll}>
              Clear all
            </Button>
          </div>
        ) : null}
      </Card>

      <SearchNotice issue={nearMe.active ? null : issue} onReset={search.clear} />

      <section className='space-y-3' aria-busy={classes.isFetching}>
        {nearMe.active && unavailable ? (
          <SearchUnavailable
            variant='card'
            description='Near-me search is unavailable right now. Clear it to see every class, or try again in a moment.'
            onClear={nearMe.clear}
            onRetry={() => void classes.refetch()}
          />
        ) : classes.isLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-36 w-full rounded-xl' />
          ))
        ) : classes.isError && !issue ? (
          <EmptyState
            variant='card'
            icon={SearchX}
            title='Could not load classes'
            description='Try again in a moment.'
            action={
              <Button variant='outline' size='sm' onClick={() => void classes.refetch()}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            variant='card'
            icon={SearchX}
            title={
              nearMe.active
                ? `No classes near ${nearMe.point?.label} within ${nearMe.radiusKm} km`
                : 'No classes match'
            }
            description={
              nearMe.active
                ? 'Only in-person and hybrid classes have a location. Try a wider radius, or clear near me to see online classes too.'
                : 'Try other words, or clear the filters.'
            }
            action={
              search.input || filtered || nearMe.active ? (
                <Button variant='outline' size='sm' onClick={clearAll}>
                  Clear search and filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className='text-muted-foreground text-sm' aria-live='polite'>
              {searchPath || !filtered
                ? `${total} ${total === 1 ? 'class' : 'classes'}`
                : `${rows.length} matching on this page`}
              {nearMe.active ? ', nearest first' : ''}
            </p>
            <ul className='space-y-3'>
              {rows.map(({ definition, band }) => (
                <li key={definition.uuid}>
                  <ClassRow
                    definition={definition}
                    band={nearMe.active ? band : undefined}
                    courseName={
                      definition.course_uuid
                        ? courses.courseMap[definition.course_uuid]?.name
                        : undefined
                    }
                    href={
                      definition.course_uuid && definition.uuid
                        ? enrolHref(domain, definition.course_uuid, definition.uuid)
                        : null
                    }
                  />
                </li>
              ))}
            </ul>
            {totalPages > 1 ? (
              <nav className='flex items-center justify-center gap-3 pt-2' aria-label='Pages'>
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
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className='space-y-1.5'>
      <Label>{label}</Label>
      <Select value={value ?? ANY} onValueChange={next => onChange(next === ANY ? undefined : next)}>
        <SelectTrigger className='w-full' aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ClassRow({
  definition,
  band,
  courseName,
  href,
}: {
  definition: ClassDefinition;
  band: string | undefined;
  courseName: string | undefined;
  href: string | null;
}) {
  const location = definition.location_type?.toUpperCase();
  const format = definition.session_format?.toUpperCase();
  const starts = definition.academic_period_start_date ?? definition.default_start_time;

  return (
    <Card className='gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0 space-y-2'>
        <div className='space-y-0.5'>
          <p className='text-foreground truncate font-semibold'>{definition.title}</p>
          {courseName ? (
            <p className='text-muted-foreground truncate text-sm'>{courseName}</p>
          ) : null}
        </div>
        <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
          <span className='inline-flex items-center gap-1'>
            <CalendarDays className='size-3.5' aria-hidden />
            Starts {formatDate(starts)}
          </span>
          {definition.location_name ? (
            <span className='inline-flex items-center gap-1'>
              <MapPin className='size-3.5' aria-hidden />
              {definition.location_name}
            </span>
          ) : null}
          {definition.max_participants ? (
            <span className='inline-flex items-center gap-1'>
              <Users className='size-3.5' aria-hidden />
              Up to {definition.max_participants}
            </span>
          ) : null}
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {location ? <Badge variant='outline'>{LOCATION_LABEL[location] ?? location}</Badge> : null}
          {format ? <Badge variant='outline'>{FORMAT_LABEL[format] ?? format}</Badge> : null}
          {typeof definition.sale_price === 'number' ? (
            <Badge variant='secondary'>
              {definition.sale_price === 0
                ? 'Free'
                : `KES ${definition.sale_price.toLocaleString()}`}
            </Badge>
          ) : null}
          <DistanceBandBadge band={band} />
        </div>
      </div>
      {href ? (
        <Button asChild size='sm' className='shrink-0'>
          <Link href={href}>
            View and enrol <ArrowRight className='size-4' />
          </Link>
        </Button>
      ) : (
        <span className='text-muted-foreground shrink-0 text-xs'>Enrol through its program</span>
      )}
    </Card>
  );
}
