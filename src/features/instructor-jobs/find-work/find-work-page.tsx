'use client';

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ComponentProps, useCallback, useDeferredValue, useMemo, useState } from 'react';

import {
  adminTheme,
  StatCard,
  StatCardSkeleton,
} from '@/app/dashboard/admin/_components/ui';
import { MarketplaceSidebar } from '@/components/profile-job-marketplace/_components/MarketplaceSidebar';
import { MarketplaceTabs } from '@/components/profile-job-marketplace/_components/MarketplaceTabs';
import type { FilterGroup } from '@/components/profile-job-marketplace/data';
import { PageHeader } from '@/components/dashboard';
import { AsyncSection, SectionError } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
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
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { statusLabel } from '@/components/profile-job-marketplace/application-status';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

import { ApplyDialog } from '../apply/apply-dialog';
import { JobsSectionTabs } from '../components/jobs-section-tabs';
import { useNow } from '../hooks/use-now';
import { myApplicationsHref } from '../job-routes';
import {
  BASIS_OPTIONS,
  type BasisFilter,
  DELIVERY_OPTIONS,
  type FindWorkFilters,
  FORMAT_OPTIONS,
  type FormatFilter,
  findWorkQuery,
  matchesBasis,
  matchesDelivery,
  matchesFormat,
  matchesReady,
  matchesStarts,
  parseFindWorkFilters,
  READY_OPTIONS,
  type ReadyFilter,
  readyGroupOf,
  SORT_OPTIONS,
  type SortOption,
  STARTS_OPTIONS,
  sortRows,
} from './find-work-filters';
import { FindWorkJobCard, FindWorkJobCardSkeleton } from './find-work-job-card';
import { type FindWorkRow, useFindWorkJobs } from './use-find-work-jobs';

const BASIS_ICONS = { all: BriefcaseBusiness, per_hour: Clock, per_session: CalendarDays, per_day: Layers };

const FIX_NOUNS: Record<string, string> = {
  rate: 'a rate',
  clash: 'a clash',
  training: 'course approval',
  verify: 'verification',
};

function joinOr(words: string[]) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function searchable(row: FindWorkRow) {
  return [
    row.job.title,
    row.organisation?.name,
    row.job.branch_name,
    row.job.location_name,
    row.contentTitle,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function FilterStatCard({
  active,
  onClick,
  ...card
}: ComponentProps<typeof StatCard> & { active?: boolean; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className='focus-visible:ring-ring/50 rounded-md text-left outline-none focus-visible:ring-[3px]'
    >
      <StatCard
        {...card}
        className={cn(
          'hover:border-primary/40 h-full transition-colors',
          active && 'border-primary ring-primary/30 ring-2'
        )}
      />
    </button>
  );
}

/** Instructor Find work: open jobs, what each needs before you can apply, and the apply dialog. */
export function FindWorkPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFindWorkFilters(searchParams), [searchParams]);
  const now = useNow();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [applyJob, setApplyJob] = useState<ClassMarketplaceJob | null>(null);

  const setFilters = useCallback(
    (patch: Partial<FindWorkFilters>) => {
      const query = findWorkQuery({ ...filters, ...patch });
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  const data = useFindWorkJobs(filters, now);
  const { rows, list, eligibility } = data;

  const base = useMemo(
    () =>
      rows.filter(
        row =>
          (!deferredSearch || searchable(row).includes(deferredSearch)) &&
          matchesFormat(filters.format, row.job) &&
          matchesStarts(filters.starts, row.facts, now)
      ),
    [rows, deferredSearch, filters.format, filters.starts, now]
  );
  const sidebarRows = useMemo(
    () =>
      base.filter(
        row =>
          matchesReady(filters.ready, row.readiness) && matchesDelivery(filters.delivery, row.job)
      ),
    [base, filters.ready, filters.delivery]
  );
  const listed = useMemo(
    () =>
      sortRows(
        sidebarRows.filter(row => matchesBasis(filters.basis, row.job)),
        filters.sort
      ),
    [sidebarRows, filters.basis, filters.sort]
  );

  const stats = useMemo(() => {
    const groups = rows.map(row => readyGroupOf(row.readiness));
    const fixStates = Array.from(
      new Set(rows.filter(row => readyGroupOf(row.readiness) === 'fix').map(row => row.readiness?.state ?? ''))
    );
    const appliedStages = Array.from(
      new Set(
        rows
          .filter(row => readyGroupOf(row.readiness) === 'applied')
          .map(row => statusLabel(row.application?.status ?? row.eligibility?.application_status))
      )
    );
    return {
      organisations: new Set(rows.map(row => row.job.organisation_uuid).filter(Boolean)).size,
      ready: groups.filter(group => group === 'ready').length,
      fix: groups.filter(group => group === 'fix').length,
      applied: groups.filter(group => group === 'applied').length,
      fixHint: capitalise(
        joinOr(fixStates.flatMap(state => (FIX_NOUNS[state] ? [FIX_NOUNS[state]] : [])))
      ),
      appliedHint: appliedStages.length > 2 ? `${appliedStages.length} stages` : appliedStages.join(' · '),
    };
  }, [rows]);

  const readinessKnown = !eligibility.loading && !data.loading;
  const openCount = list.hasNextPage ? (data.totalOpen ?? rows.length) : rows.length;
  const pickReady = (ready: ReadyFilter) =>
    setFilters({ ready: filters.ready === ready && ready !== 'all' ? 'all' : ready });

  const filterGroups: FilterGroup[] = [
    {
      title: 'Can you apply?',
      icon: CircleCheck,
      items: READY_OPTIONS.map(option => ({
        label: option.label,
        count: base.filter(
          row => matchesDelivery(filters.delivery, row.job) && matchesReady(option.value, row.readiness)
        ).length,
        active: filters.ready === option.value,
        onSelect: () => setFilters({ ready: option.value }),
      })),
    },
    {
      title: 'Delivery',
      icon: MapPin,
      items: DELIVERY_OPTIONS.map(option => ({
        label: option.label,
        count: base.filter(
          row => matchesReady(filters.ready, row.readiness) && matchesDelivery(option.value, row.job)
        ).length,
        active: filters.delivery === option.value,
        onSelect: () => setFilters({ delivery: option.value }),
      })),
    },
    {
      title: 'Starts',
      icon: CalendarDays,
      items: STARTS_OPTIONS.map(option => ({
        label: option.label,
        active: filters.starts === option.value,
        onSelect: () => setFilters({ starts: option.value }),
      })),
    },
  ];

  const sidebar = (
    <MarketplaceSidebar
      heading='Filters'
      count={`${sidebarRows.length} of ${rows.length} open job${rows.length === 1 ? '' : 's'}`}
      groups={filterGroups}
      footer={
        <Button asChild variant='outline' className='w-full'>
          <Link href={myApplicationsHref()}>
            <FileText aria-hidden />
            My applications
          </Link>
        </Button>
      }
    />
  );

  const basisTabs = BASIS_OPTIONS.map(option => ({
    id: option.value,
    label: option.label,
    icon: BASIS_ICONS[option.value],
    count: String(sidebarRows.filter(row => matchesBasis(option.value, row.job)).length),
  }));

  const contentValue = filters.program
    ? `program:${filters.program}`
    : filters.course
      ? `course:${filters.course}`
      : 'all';

  const applyRow = applyJob ? rows.find(row => row.job.uuid === applyJob.uuid) : undefined;
  const hasFilters =
    Boolean(deferredSearch) || findWorkQuery({ ...filters, sort: 'soonest' }) !== '';

  return (
    <main className={cn(adminTheme.page, 'pb-16')}>
      <div className={adminTheme.pageStack}>
        <PageHeader
          title='Jobs'
          description='Class jobs posted by organisations. Each one shows whether you can apply, and what to fix if you can’t yet.'
          actions={
            <Button asChild variant='outline'>
              <Link href={dashboardUrl('instructor', 'rate-card')}>
                <Layers aria-hidden />
                Rate cards
              </Link>
            </Button>
          }
        />
        <JobsSectionTabs />

        <section aria-label='Job summary' className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {data.loading ? (
            <StatCardSkeleton />
          ) : (
            <FilterStatCard
              label='Open jobs'
              value={openCount}
              hint={`From ${stats.organisations} organisation${stats.organisations === 1 ? '' : 's'}`}
              icon={BriefcaseBusiness}
              tone='info'
              onClick={() => setFilters({ ready: 'all' })}
            />
          )}
          {readinessKnown ? (
            <>
              <FilterStatCard
                label='Ready to apply'
                value={stats.ready}
                hint='Every check passes'
                icon={CircleCheck}
                tone='success'
                active={filters.ready === 'ready'}
                onClick={() => pickReady('ready')}
              />
              <FilterStatCard
                label='Need a fix'
                value={stats.fix}
                hint={stats.fixHint || 'Nothing to fix'}
                icon={CircleAlert}
                tone='warning'
                active={filters.ready === 'fix'}
                onClick={() => pickReady('fix')}
              />
              <FilterStatCard
                label='Applied'
                value={stats.applied}
                hint={stats.appliedHint || 'No live applications here'}
                icon={UserCheck}
                tone='neutral'
                active={filters.ready === 'applied'}
                onClick={() => pickReady('applied')}
              />
            </>
          ) : (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          )}
        </section>

        <div className='grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
          <div className='hidden xl:sticky xl:top-4 xl:block xl:self-start'>{sidebar}</div>

          <div className='flex min-w-0 flex-col gap-4'>
            <section
              aria-label='Search and sort jobs'
              className={cn(adminTheme.cardPadded, 'flex flex-col gap-3 p-4')}
            >
              <div className='flex gap-2'>
                <label className='relative block min-w-0 flex-1'>
                  <span className='sr-only'>Search jobs</span>
                  <Search
                    aria-hidden
                    className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
                  />
                  <Input
                    type='search'
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder='Search course, organisation, branch or town'
                    className='h-10 pl-10'
                  />
                </label>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' className='h-10 xl:hidden'>
                      <SlidersHorizontal aria-hidden />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='left' className='w-[88vw] max-w-sm overflow-y-auto p-4'>
                    <SheetHeader className='sr-only'>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>Narrow the open jobs you see.</SheetDescription>
                    </SheetHeader>
                    {sidebar}
                  </SheetContent>
                </Sheet>
              </div>

              <div className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_180px]'>
                <Select
                  value={filters.organisation ?? 'all'}
                  onValueChange={value =>
                    setFilters({ organisation: value === 'all' ? null : value })
                  }
                >
                  <SelectTrigger aria-label='Organisation' className='h-10 w-full'>
                    <Building2 aria-hidden className='text-muted-foreground size-4' />
                    <SelectValue placeholder='All organisations' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All organisations</SelectItem>
                    {data.organisationOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={contentValue}
                  onValueChange={value => {
                    const [kind, uuid] = value.split(':');
                    setFilters({
                      course: kind === 'course' ? (uuid ?? null) : null,
                      program: kind === 'program' ? (uuid ?? null) : null,
                    });
                  }}
                >
                  <SelectTrigger aria-label='Course' className='h-10 w-full'>
                    <GraduationCap aria-hidden className='text-muted-foreground size-4' />
                    <SelectValue placeholder='All courses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All courses</SelectItem>
                    {data.contentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.format}
                  onValueChange={value => setFilters({ format: value as FormatFilter })}
                >
                  <SelectTrigger aria-label='Private or group' className='h-10 w-full'>
                    <Users aria-hidden className='text-muted-foreground size-4' />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sort}
                  onValueChange={value => setFilters({ sort: value as SortOption })}
                >
                  <SelectTrigger aria-label='Sort jobs' className='h-10 w-full'>
                    <SlidersHorizontal aria-hidden className='text-muted-foreground size-4' />
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
            </section>

            <Tabs
              value={filters.basis}
              onValueChange={value => setFilters({ basis: value as BasisFilter })}
              className='gap-0'
            >
              <MarketplaceTabs tabs={basisTabs} label='Billing basis' />
              <TabsContent value={filters.basis} className='mt-4 flex flex-col gap-4'>
                <p className='text-muted-foreground text-sm' aria-live='polite'>
                  <span className='text-foreground font-semibold tabular-nums'>{listed.length}</span>{' '}
                  {listed.length === 1 ? 'job' : 'jobs'}
                  {list.hasNextPage ? ` of ${data.totalOpen ?? 'more'} open` : ''}
                </p>

                {eligibility.error ? (
                  <SectionError
                    title='Couldn’t check which jobs you can apply for'
                    error={eligibility.error}
                    onRetry={() => eligibility.refetch()}
                  />
                ) : null}

                <AsyncSection
                  loading={data.loading}
                  error={list.error}
                  onRetry={() => list.refetch()}
                  errorTitle='Couldn’t load open jobs'
                  skeleton={
                    <div className='flex flex-col gap-4'>
                      <FindWorkJobCardSkeleton />
                      <FindWorkJobCardSkeleton />
                      <FindWorkJobCardSkeleton />
                    </div>
                  }
                  empty={listed.length === 0}
                  emptyState={
                    <EmptyState
                      variant='compact'
                      icon={BriefcaseBusiness}
                      title={hasFilters ? 'No jobs match these filters' : 'No open jobs right now'}
                      description={
                        hasFilters
                          ? 'Clear a filter to see more jobs.'
                          : 'Organisations post class jobs here. Check back soon.'
                      }
                      action={
                        hasFilters ? (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setSearch('');
                              router.replace(pathname, { scroll: false });
                            }}
                          >
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  }
                >
                  <ul className='flex flex-col gap-4'>
                    {listed.map(row => (
                      <li key={row.job.uuid}>
                        <FindWorkJobCard row={row} now={now} onApply={setApplyJob} />
                      </li>
                    ))}
                  </ul>
                </AsyncSection>

                {list.hasNextPage ? (
                  <div className='flex justify-center'>
                    <Button
                      variant='outline'
                      onClick={() => list.fetchNextPage()}
                      disabled={list.isFetchingNextPage}
                    >
                      {list.isFetchingNextPage ? <Spinner /> : null}
                      {list.isFetchingNextPage ? 'Loading more jobs…' : 'Load more jobs'}
                    </Button>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ApplyDialog
        job={applyJob}
        open={Boolean(applyJob)}
        onOpenChange={open => {
          if (!open) setApplyJob(null);
        }}
        organisationName={applyRow?.organisation?.name}
        contentTitle={applyRow?.contentTitle ?? null}
        browseInPlace
      />
    </main>
  );
}
