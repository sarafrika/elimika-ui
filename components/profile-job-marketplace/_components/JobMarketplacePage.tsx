'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Globe2,
  GraduationCap,
  Layers,
  MapPin,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  useCoursesByIds,
  useOrganisationsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { useSearchIssue } from '@/hooks/use-search-query';
import { useUrlSearchQuery } from '@/hooks/use-url-search-query';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { formatDate, formatDateOnly } from '@/lib/date';
import { formatRate, RATE_BASES } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import { getJobOptions, listJobsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useTypeSearch } from '@/src/features/search/hooks/use-type-search';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { jobFacts, sessionsLabel, timesLabel } from '@/src/features/instructor-jobs/job-facts';
import {
  JobWhereDetails,
  OpenInMapsButton,
  whereSummary,
} from '@/src/features/instructor-jobs/job-page/where-panel';
import {
  deliveryLabel,
  scheduleSummary,
  serviceLabel,
} from '@/src/features/organisation/jobs/lib/job-stage';

import type { FilterGroup, JobMarketplaceRole } from '../data';
import { getJobMarketplaceRoleConfig } from '../data';
import { getEffectiveJobStatus } from '../job-expiration';
import { JobCard } from './JobMarketplaceCard';
import { JobListSkeleton, MarketplaceSidebarSkeleton } from './JobMarketplaceSkeletons';
import { MarketplaceSidebar } from './MarketplaceSidebar';
import { MarketplaceTabs } from './MarketplaceTabs';
import { DetailGrid, SectionCard, StatCard, StatCardSkeleton, StatusBadge, surfaceTheme } from '@/components/data-display';

type StatusFilter = 'all' | 'open' | 'awaiting_class' | 'filled' | 'cancelled' | 'expired';
type SortDirection = 'newest' | 'oldest';

const JOB_PAGE_SIZE = 50;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Awaiting class', value: 'awaiting_class' },
  { label: 'Filled', value: 'filled' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' },
];

/**
 * Students, parents and course creators only ever receive OPEN jobs from the API (other
 * statuses are visible to the posting organisation's staff and to admins), so their
 * marketplace offers no other status and no Filled count.
 */
const OPEN_ONLY_ROLES: readonly JobMarketplaceRole[] = ['student', 'parent', 'course_creator'];

const LOCATION_OPTIONS = ['IN_PERSON', 'ONLINE', 'HYBRID'] as const;

const BASIS_TABS = [
  { id: 'all', label: 'All', icon: BriefcaseBusiness },
  ...RATE_BASES.map(basis => ({
    id: basis.value as string,
    label: basis.label,
    icon: basis.value === 'per_hour' ? Clock : basis.value === 'per_session' ? CalendarDays : Layers,
  })),
];

const createdTime = (job: ClassMarketplaceJob) =>
  job.created_date ? new Date(job.created_date).getTime() : 0;

/** Read-only details for roles that browse jobs without applying. */
function JobDetailsSheet({
  job,
  organisationName,
  contentTitle,
  onOpenChange,
}: {
  job: ClassMarketplaceJob | null;
  organisationName: string | null;
  contentTitle: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const facts = useMemo(() => (job ? jobFacts(job) : null), [job]);

  return (
    <Sheet open={Boolean(job)} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex w-[min(98vw,650px)] max-w-none flex-col overflow-y-auto sm:max-w-none'
      >
        {job && facts ? (
          <div className='space-y-5 p-3 sm:p-6'>
            <SheetHeader className='space-y-3 pr-10 text-left'>
              <div className='flex flex-wrap items-center gap-2'>
                <StatusBadge status={job.status} />
                <Badge variant='outline' className='rounded-md'>
                  {serviceLabel(job.service_type, job.session_format)}
                </Badge>
                <Badge variant='outline' className='rounded-md'>
                  {deliveryLabel(job.location_type)}
                </Badge>
              </div>
              <SheetTitle className='text-2xl tracking-tight'>
                {job.title || 'Untitled job'}
              </SheetTitle>
              <SheetDescription>
                {organisationName ?? 'Organisation'} · {contentTitle ?? 'Course or program'}
              </SheetDescription>
            </SheetHeader>

            <DetailGrid
              columns={2}
              items={[
                {
                  label: 'Instructor pay',
                  value:
                    typeof job.instructor_pay === 'number'
                      ? formatRate(job.instructor_pay, job.rate_basis)
                      : 'Not shown',
                },
                { label: 'Posted', value: formatDate(job.created_date) },
                { label: 'Schedule', value: `${sessionsLabel(facts)} · ${timesLabel(facts)}` },
                {
                  label: 'Class size',
                  value:
                    typeof job.max_participants === 'number'
                      ? `Up to ${job.max_participants} · waitlist ${job.allow_waitlist ? 'on' : 'off'}`
                      : 'Not set',
                },
              ]}
            />

            <SectionCard
              title='Where it happens'
              description={whereSummary(job)}
              actions={<OpenInMapsButton job={job} />}
            >
              <JobWhereDetails job={job} />
            </SectionCard>

            <SectionCard title='Description' description={scheduleSummary(facts.windows)}>
              <p className='text-foreground text-sm leading-6 whitespace-pre-line'>
                {job.description || 'No description has been provided for this posting yet.'}
              </p>
            </SectionCard>

            <DetailGrid
              columns={2}
              items={[
                {
                  label: 'Registration',
                  value:
                    job.registration_period_start_date || job.registration_period_end_date
                      ? `${formatDateOnly(job.registration_period_start_date)} – ${formatDateOnly(job.registration_period_end_date)}`
                      : 'Not set',
                },
                {
                  label: 'Training period',
                  value:
                    job.academic_period_start_date || job.academic_period_end_date
                      ? `${formatDateOnly(job.academic_period_start_date)} – ${formatDateOnly(job.academic_period_end_date)}`
                      : 'Not set',
                },
              ]}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** The marketplace for roles that watch class jobs without applying: students, parents, creators, admins. */
export function JobMarketplacePage({ role }: { role: JobMarketplaceRole }) {
  const config = getJobMarketplaceRoleConfig(role);
  const openOnly = OPEN_ONLY_ROLES.includes(role);
  const statusOptions = openOnly
    ? STATUS_OPTIONS.filter(option => option.value === 'open')
    : STATUS_OPTIONS;
  // Free text is matched by the search index on the server (`q`); ?q= comes from links.
  const search = useUrlSearchQuery();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [formatFilter, setFormatFilter] = useState<'all' | 'INDIVIDUAL' | 'GROUP'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | (typeof LOCATION_OPTIONS)[number]>(
    'all'
  );
  const [basisTab, setBasisTab] = useState('all');
  const [organisationFilter, setOrganisationFilter] = useState('all');
  const [contentFilter, setContentFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('newest');
  // ?job= opens one posting directly, e.g. from the search palette.
  const linkedJob = useSearchParams().get('job');
  const [selectedJobUuid, setSelectedJobUuid] = useState<string | null>(linkedJob);
  const [now] = useState(() => Date.now());
  const serverStatus = openOnly ? 'open' : statusFilter !== 'all' ? statusFilter : undefined;

  const jobsQuery = useQuery({
    ...listJobsOptions({
      query: {
        pageable: { page: 0, size: JOB_PAGE_SIZE },
        // Filter on the server so closed postings can't crowd open ones out of the first page.
        ...(serverStatus ? { status: serverStatus } : {}),
        ...(search.q ? { q: search.q } : {}),
      },
    }),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientOrSearchError,
  });
  const searchIssue = useSearchIssue(search, jobsQuery.error);

  // One facet request counts delivery modes and formats across every matching job, not
  // just the loaded page. When search is down the counts are hidden rather than guessed.
  const facetQuery = useTypeSearch({
    type: 'marketplace_jobs',
    q: search.q,
    filters: serverStatus ? { status: serverStatus } : undefined,
    facets: 'location_type,session_format',
    size: 1,
    enabled: !searchIssue,
  });
  const facetCounts = facetQuery.isError ? undefined : facetQuery.facets;
  const content = jobsQuery.data?.data?.content;
  const jobs = useMemo(
    () => (content ?? []).map(job => ({ ...job, status: getEffectiveJobStatus(job, now) })),
    [content, now]
  );
  const jobsLoading = jobsQuery.isLoading && !jobsQuery.data;

  const { organisationMap } = useOrganisationsByIds(
    useMemo(() => jobs.flatMap(job => job.organisation_uuid ?? []), [jobs])
  );
  const { courseMap } = useCoursesByIds(
    useMemo(() => jobs.flatMap(job => (job.program_uuid ? [] : (job.course_uuid ?? []))), [jobs])
  );
  const { programMap } = useProgramsByIds(
    useMemo(() => jobs.flatMap(job => job.program_uuid ?? []), [jobs])
  );
  const organisationName = (job: ClassMarketplaceJob) =>
    (job.organisation_uuid && organisationMap[job.organisation_uuid]?.name) || null;
  const contentTitle = (job: ClassMarketplaceJob) =>
    (job.program_uuid
      ? programMap[job.program_uuid]?.title
      : job.course_uuid
        ? courseMap[job.course_uuid]?.name
        : null) ?? null;

  const organisationOptions = Array.from(
    new Set(jobs.flatMap(job => job.organisation_uuid ?? []))
  ).map(uuid => ({ value: uuid, label: organisationMap[uuid]?.name ?? 'Organisation' }));
  const contentOptions = Array.from(
    new Set(
      jobs.flatMap(job =>
        job.program_uuid
          ? [`program:${job.program_uuid}`]
          : job.course_uuid
            ? [`course:${job.course_uuid}`]
            : []
      )
    )
  ).map(value => {
    const [kind, uuid = ''] = value.split(':');
    return {
      value,
      label:
        kind === 'program'
          ? `Program: ${programMap[uuid]?.title ?? 'Training program'}`
          : `Course: ${courseMap[uuid]?.name ?? 'Course'}`,
    };
  });

  const beforeLocation = jobs.filter(job => {
    const contentKey = job.program_uuid
      ? `program:${job.program_uuid}`
      : `course:${job.course_uuid}`;
    return (
      (formatFilter === 'all' || job.session_format === formatFilter) &&
      (organisationFilter === 'all' || job.organisation_uuid === organisationFilter) &&
      (contentFilter === 'all' || contentKey === contentFilter) &&
      (statusFilter === 'all' || job.status === statusFilter)
    );
  });
  const filtered = beforeLocation.filter(
    job => locationFilter === 'all' || job.location_type === locationFilter
  );
  const listed = filtered
    .filter(job => basisTab === 'all' || job.rate_basis === basisTab)
    .sort((a, b) =>
      sortDirection === 'newest' ? createdTime(b) - createdTime(a) : createdTime(a) - createdTime(b)
    );

  const kpis = [
    {
      label: 'Open jobs',
      value: jobs.filter(job => job.status === 'open').length,
      icon: BriefcaseBusiness,
      tone: 'success' as const,
    },
    {
      label: 'Organisations',
      value: new Set(jobs.map(job => job.organisation_uuid).filter(Boolean)).size,
      icon: Building2,
      tone: 'info' as const,
    },
    ...(openOnly
      ? []
      : [
          {
            label: 'Filled',
            value: jobs.filter(job => job.status === 'filled').length,
            icon: CheckCircle2,
            tone: 'neutral' as const,
          },
        ]),
    {
      label: 'Online',
      value: jobs.filter(job => job.location_type === 'ONLINE').length,
      icon: Globe2,
      tone: 'warning' as const,
    },
  ];

  // The facet counts describe the server's matches; they only stand for this list while
  // no filter narrows it in the browser.
  const clientNarrowed =
    formatFilter !== 'all' || organisationFilter !== 'all' || contentFilter !== 'all';
  const locationCount = (option: (typeof LOCATION_OPTIONS)[number] | 'all') => {
    const counts = facetCounts?.location_type;
    if (!clientNarrowed && counts) {
      return option === 'all'
        ? Object.values(counts).reduce((sum, count) => sum + count, 0)
        : (counts[option] ?? 0);
    }
    if (!clientNarrowed && facetQuery.isError) return undefined;
    return option === 'all'
      ? beforeLocation.length
      : beforeLocation.filter(job => job.location_type === option).length;
  };

  const filterGroups: FilterGroup[] = [
    {
      title: 'Status',
      icon: Filter,
      items: statusOptions.map(option => ({
        label: option.label,
        count:
          option.value === statusFilter || statusFilter === 'all'
            ? beforeLocation.filter(job => option.value === 'all' || job.status === option.value)
                .length
            : undefined,
        active: statusFilter === option.value,
        onSelect: () => setStatusFilter(option.value),
      })),
    },
    {
      title: 'Location',
      icon: MapPin,
      items: [
        {
          label: 'Any location',
          count: locationCount('all'),
          active: locationFilter === 'all',
          onSelect: () => setLocationFilter('all'),
        },
        ...LOCATION_OPTIONS.map(option => ({
          label: deliveryLabel(option),
          count: locationCount(option),
          active: locationFilter === option,
          onSelect: () => setLocationFilter(option),
        })),
      ],
    },
  ];
  const sidebar = (
    <MarketplaceSidebar
      heading='Filters'
      count={`${filtered.length} job posting${filtered.length === 1 ? '' : 's'}`}
      groups={filterGroups}
    />
  );

  const listedSelection = jobs.find(job => job.uuid === selectedJobUuid) ?? null;
  // A linked job that is not on the loaded page is read on its own.
  const linkedJobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid: selectedJobUuid ?? '' } }),
    enabled: Boolean(selectedJobUuid) && !listedSelection && !jobsLoading,
    retry: retryUnlessClientOrSearchError,
  });
  const selectedJob = listedSelection ?? linkedJobQuery.data?.data ?? null;

  return (
    <main className={cn(surfaceTheme.pageWide, 'py-4 pb-16')}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader title='Opportunities' description={config.description} />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]'>
          {jobsLoading
            ? kpis.map(kpi => <StatCardSkeleton key={kpi.label} />)
            : kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
        </div>

        <div className='grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
          <div className='hidden xl:sticky xl:top-4 xl:block xl:self-start'>
            {jobsLoading ? <MarketplaceSidebarSkeleton /> : sidebar}
          </div>

          <div className='min-w-0 space-y-4'>
            <SectionCard
              title='Search'
              actions={
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' size='sm' className='xl:hidden'>
                      <SlidersHorizontal aria-hidden className='size-4' />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='left' className='w-[88vw] max-w-sm overflow-y-auto p-4'>
                    <SheetHeader className='sr-only'>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>Narrow the job postings you see.</SheetDescription>
                    </SheetHeader>
                    {jobsLoading ? <MarketplaceSidebarSkeleton /> : sidebar}
                  </SheetContent>
                </Sheet>
              }
              bodyClassName='space-y-3'
            >
              <SearchQueryInput
                search={search}
                aria-label='Search jobs'
                placeholder='Search job title, organisation, course, or location'
                className='h-10'
              />
              <SearchNotice issue={searchIssue} onReset={search.clear} />

              <div className='flex flex-wrap items-center gap-3'>
                <div className='min-w-[200px] flex-1'>
                  <Select value={organisationFilter} onValueChange={setOrganisationFilter}>
                    <SelectTrigger aria-label='Organisation' className='h-10 w-full'>
                      <Building2 aria-hidden className='text-muted-foreground size-4 shrink-0' />
                      <SelectValue placeholder='All organisations' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All organisations</SelectItem>
                      {organisationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='min-w-[200px] flex-1'>
                  <Select value={contentFilter} onValueChange={setContentFilter}>
                    <SelectTrigger aria-label='Course or program' className='h-10 w-full'>
                      <GraduationCap aria-hidden className='text-muted-foreground size-4 shrink-0' />
                      <SelectValue placeholder='All content' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All content</SelectItem>
                      {contentOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='min-w-[200px] flex-1'>
                  <Select
                    value={formatFilter}
                    onValueChange={value => setFormatFilter(value as typeof formatFilter)}
                  >
                    <SelectTrigger aria-label='Private or group' className='h-10 w-full'>
                      <Users aria-hidden className='text-muted-foreground size-4 shrink-0' />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Private or group</SelectItem>
                      <SelectItem value='INDIVIDUAL'>Private</SelectItem>
                      <SelectItem value='GROUP'>Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type='button'
                  variant='outline'
                  className='h-10 shrink-0 whitespace-nowrap'
                  onClick={() =>
                    setSortDirection(previous => (previous === 'newest' ? 'oldest' : 'newest'))
                  }
                >
                  {sortDirection === 'newest' ? (
                    <ArrowDownWideNarrow aria-hidden className='size-4 shrink-0' />
                  ) : (
                    <ArrowUpWideNarrow aria-hidden className='size-4 shrink-0' />
                  )}
                  {sortDirection === 'newest' ? 'Newest first' : 'Oldest first'}
                </Button>
              </div>
            </SectionCard>

            <Tabs value={basisTab} onValueChange={setBasisTab} className='gap-0'>
              <MarketplaceTabs
                label='Billing basis'
                tabs={BASIS_TABS.map(tab => ({
                  ...tab,
                  count: filtered.filter(job => tab.id === 'all' || job.rate_basis === tab.id)
                    .length,
                }))}
              />
              <TabsContent value={basisTab} className='mt-4 space-y-4'>
                <p className='text-muted-foreground text-sm'>
                  <span className='text-foreground font-semibold tabular-nums'>{listed.length}</span>{' '}
                  job posting{listed.length === 1 ? '' : 's'}
                </p>

                <AsyncSection
                  loading={jobsLoading}
                  error={searchIssue ? null : jobsQuery.error}
                  empty={listed.length === 0}
                  onRetry={() => jobsQuery.refetch()}
                  skeleton={<JobListSkeleton />}
                  errorTitle='Couldn’t load job postings'
                  emptyState={
                    <EmptyState
                      icon={BriefcaseBusiness}
                      title={search.q ? 'No job matches this search' : 'No class jobs found'}
                      description={
                        search.q ? 'Try another word, or clear the search.' : config.emptyStateLabel
                      }
                      action={
                        search.q ? (
                          <Button variant='outline' size='sm' onClick={search.clear}>
                            Clear search
                          </Button>
                        ) : undefined
                      }
                      variant='compact'
                    />
                  }
                >
                  <div className='grid gap-4 xl:grid-cols-[repeat(auto-fill,minmax(560px,1fr))]'>
                    {listed.map(job => (
                      <JobCard
                        key={job.uuid}
                        job={job}
                        organisationName={organisationName(job)}
                        contentTitle={contentTitle(job)}
                        onView={() => setSelectedJobUuid(job.uuid ?? null)}
                      />
                    ))}
                  </div>
                </AsyncSection>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <JobDetailsSheet
        job={selectedJob}
        organisationName={selectedJob ? organisationName(selectedJob) : null}
        contentTitle={selectedJob ? contentTitle(selectedJob) : null}
        onOpenChange={open => {
          if (!open) setSelectedJobUuid(null);
        }}
      />
    </main>
  );
}
