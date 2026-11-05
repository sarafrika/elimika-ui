'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { StatCard } from '@/components/data-display/stat-tile';
import { EntityCombobox, type EntityOption } from '@/components/search/entity-combobox';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { SearchUnavailable } from '@/components/search/search-unavailable';
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
import { isSearchUnavailable } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { numberParam } from '@/lib/search-state';
import { classifySearchError } from '@/lib/search/query';
import { cn } from '@/lib/utils';
import type {
  ClassBatchSummary,
  ClassDefinitionResponse,
  GetPublishedCoursesResponse,
} from '@/services/client';
import {
  getClassesBatchOptions,
  getPublishedCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useNearMe } from '@/src/features/near-me/near-me';
import { NearMeControl } from '@/src/features/near-me/near-me-control';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  SearchX,
  Video,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { ClassCard } from './class-card';
import { classCardFacts } from './class-card-facts';
import { CLASS_VIEWS, classViewCounts, classViewPage, isClassView } from './class-views';
import { useClassCatalogue } from './use-class-catalogue';
import {
  type ClassFilters,
  FORMAT_OPTIONS,
  hasClassFilters,
  LOCATION_OPTIONS,
  parseClassFilters,
  toClassSearchParams,
} from './class-filters';

const PAGE_SIZE = 20;
const ANY = 'any';
const pageParam = numberParam(0);

/** Where a learner enrols in a class of a course, per dashboard. */
function enrolHref(domain: 'student' | 'parent', courseUuid: string, classUuid: string) {
  const path = `courses/available-classes/${courseUuid}/enroll`;
  return `${dashboardUrl(domain, path)}?id=${encodeURIComponent(classUuid)}`;
}

/** The course title the listing embeds on a row, once the API sends it. */
function rowCourseTitle(item: ClassDefinitionResponse): string | undefined {
  const value = 'course_title' in item ? item.course_title : undefined;
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * "Find classes" for learners: every class the caller may join, across all courses, from
 * `GET /classes` with `q`, near-me and filters, classified before UI pagination. Text and near-me are served
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

  const classes = useClassCatalogue({
    ...(search.q ? { q: search.q } : {}),
    ...nearMe.params,
    searchParams: toClassSearchParams(filters),
  });
  const rows = useMemo(
    () =>
      classes.rows.flatMap(item => {
        const definition = item.class_definition;
        if (!definition?.uuid) return [];
        return [{ definition, band: item.distance_band, courseTitle: rowCourseTitle(item) }];
      }),
    [classes.rows]
  );
  const cards = useMemo(() => {
    const now = new Date();
    return rows.map(row => ({
      ...row,
      facts: classCardFacts(
        row.definition,
        classes.sessionsByClass[row.definition.uuid ?? ''] ?? [],
        undefined,
        now
      ),
    }));
  }, [rows, classes.sessionsByClass]);
  const viewValue = params.get('view');
  const view = isClassView(viewValue) ? viewValue : 'open';
  const viewCounts = useMemo(() => classViewCounts(cards), [cards]);
  const result = useMemo(() => classViewPage(cards, view, page, PAGE_SIZE), [cards, view, page]);
  const total = cards.length;
  const totalPages = result.totalPages;
  const visible = result.items;
  const currentPage = result.page;
  const startingThisWeek = cards.filter(card => card.facts.startsThisWeek).length;

  // Counts use the complete catalogue; titles, seats and trainer details are only
  // enriched for the filtered page currently on screen.
  const embeddedTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    for (const row of visible) {
      const courseUuid = row.definition.course_uuid;
      if (courseUuid && row.courseTitle) titles[courseUuid] = row.courseTitle;
    }
    return titles;
  }, [visible]);
  const courseIds = useMemo(() => {
    if (classes.isLoading || classes.isError) return [];
    const ids = visible.flatMap(row =>
      row.definition.course_uuid && !row.courseTitle ? [row.definition.course_uuid] : []
    );
    if (filters.course && !embeddedTitles[filters.course]) ids.push(filters.course);
    return ids;
  }, [visible, filters.course, embeddedTitles, classes.isLoading, classes.isError]);
  const courses = useCoursesByIds(courseIds);
  const classUuids = useMemo(
    () => visible.flatMap(row => (row.definition.uuid ? [row.definition.uuid] : [])),
    [visible]
  );
  const summaries = useQuery({
    ...getClassesBatchOptions({ query: { uuids: classUuids } }),
    enabled: !classes.isLoading && !classes.isError && classUuids.length > 0,
    staleTime: STALE_TIMES.live,
  });
  const summaryByUuid = useMemo(() => {
    const map: Record<string, ClassBatchSummary> = {};
    if (summaries.data?.error || summaries.data?.success === false) return map;
    for (const summary of summaries.data?.data ?? []) if (summary.uuid) map[summary.uuid] = summary;
    return map;
  }, [summaries.data]);
  const statValue = (value: number) => (classes.isLoading ? '…' : classes.isError ? '—' : value);
  const courseLabel = (courseUuid: string) =>
    embeddedTitles[courseUuid] ?? courses.courseMap[courseUuid]?.name;

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
      view: undefined,
      page: undefined,
    });
  };

  return (
    <main className={cn(surfaceTheme.pageWide, 'py-4 pb-16')}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Find classes'
          title='Classes you can join'
          description='Every price is the full amount for the class — pay once with M-Pesa.'
        />

        <section aria-label='Summary' className={surfaceTheme.statGrid}>
          <StatCard
            label='Classes found'
            value={statValue(total)}
            hint='Across matching classes'
            icon={GraduationCap}
            tone='info'
          />
          <StatCard
            label='Starting this week'
            value={statValue(startingThisWeek)}
            hint='Across matching classes'
            icon={CalendarClock}
            tone='success'
          />
          <StatCard
            label='Closing soon'
            value={statValue(viewCounts.soon)}
            hint='Registration ends within 3 days'
            icon={Clock}
            tone='warning'
          />
          <StatCard
            label='Online'
            value={statValue(viewCounts.online)}
            hint='All open online classes'
            icon={Video}
            tone='neutral'
          />
        </section>

        <Card className={cn(surfaceTheme.cardPadded, 'gap-3 p-4')}>
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
                  filters.course ? (courseLabel(filters.course) ?? 'Selected course') : undefined
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
            <div className={surfaceTheme.cardGrid}>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className='h-[440px] w-full rounded-2xl' />
              ))}
            </div>
          ) : classes.isError ? (
            <EmptyState
              variant='card'
              icon={SearchX}
              title='Could not load classes'
              description={
                classes.error instanceof Error ? classes.error.message : 'Try again in a moment.'
              }
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
              <nav
                aria-label='Class views'
                className='thin-scrollbar flex gap-6 overflow-x-auto shadow-[inset_0_-1px_0_0_var(--color-border)]'
              >
                {CLASS_VIEWS.map(v => {
                  const active = v.id === view;
                  return (
                    <button
                      key={v.id}
                      type='button'
                      aria-pressed={active}
                      onClick={() =>
                        patch({ view: v.id === 'open' ? undefined : v.id, page: undefined })
                      }
                      className={cn(
                        'text-muted-foreground hover:text-foreground flex h-11 flex-none items-center gap-2 border-b-2 border-transparent text-sm font-medium',
                        active && 'border-primary text-primary font-semibold'
                      )}
                    >
                      {v.label}
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold tabular-nums',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {viewCounts[v.id]}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <p className='text-muted-foreground text-xs'>
                Counts include all matching classes. Each view shows its matches across all pages.
              </p>
              <p className='text-muted-foreground text-sm' aria-live='polite'>
                <span className='text-foreground font-semibold tabular-nums'>{visible.length}</span>{' '}
                {visible.length === 1 ? 'class' : 'classes'}
                {totalPages > 1 ? ` on this page of ${result.total}` : ''}
                {nearMe.active ? ', nearest first' : ''}
              </p>
              {visible.length === 0 ? (
                <EmptyState
                  variant='card'
                  icon={SearchX}
                  title={view === 'closed' ? 'No closed classes here' : 'No classes in this view'}
                  description='No classes match this view. Try another tab or change your filters.'
                  action={
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => patch({ view: undefined, page: undefined })}
                    >
                      Show all open
                    </Button>
                  }
                />
              ) : (
                <ul className={surfaceTheme.cardGrid}>
                  {visible.map(({ definition, band, courseTitle, facts }) => {
                    const summary = summaryByUuid[definition.uuid ?? ''];
                    return (
                      <li key={definition.uuid} className='min-w-0'>
                        <ClassCard
                          title={definition.title}
                          courseName={
                            courseTitle ??
                            summary?.course_title ??
                            (definition.course_uuid
                              ? courses.courseMap[definition.course_uuid]?.name
                              : undefined) ??
                            undefined
                          }
                          trainer={summary?.instructor?.display_name}
                          thumbnailUrl={definition.thumbnail_url ?? summary?.thumbnail_url}
                          locationType={definition.location_type}
                          facts={{
                            ...facts,
                            seatsLeft:
                              summary?.seats_remaining == null
                                ? facts.seatsLeft
                                : Number(summary.seats_remaining),
                            capacity:
                              Number(summary?.max_participants ?? facts.capacity ?? 0) || null,
                          }}
                          band={nearMe.active ? band : undefined}
                          href={
                            definition.course_uuid && definition.uuid
                              ? enrolHref(domain, definition.course_uuid, definition.uuid)
                              : null
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
              {totalPages > 1 ? (
                <nav className='flex items-center justify-center gap-3 pt-2' aria-label='Pages'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={currentPage <= 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft className='size-4' /> Previous
                  </Button>
                  <span className='text-muted-foreground text-sm tabular-nums'>
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next <ChevronRight className='size-4' />
                  </Button>
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
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
      <Select
        value={value ?? ANY}
        onValueChange={next => onChange(next === ANY ? undefined : next)}
      >
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
