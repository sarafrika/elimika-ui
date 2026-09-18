'use client';

import { Briefcase, Building2, CircleCheck, Clock, MapPin, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';

import { OrgPage } from '@/app/dashboard/organisation/_components/org-page';
import { useOrganisationBranches } from '@/components/class-form';
import { KpiCard, PageHeader } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate, formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob, Instructor } from '@/services/client';
import { useOrganisationJobs } from '../hooks/use-organisation-jobs';
import { jobHref, postJobHref } from '../lib/job-routes';
import {
  deliveryLabel,
  hiredInstructorUuid,
  type JobStage,
  jobResourcesHoldState,
  jobSessionWindows,
  jobStage,
  jobTown,
  nextStepCta,
  resourceHoldState,
  serviceLabel,
  sessionCountLabel,
} from '../lib/job-stage';
import { HoldBadge, JobStageBadge } from './job-badges';

type StageFilter = 'all' | JobStage;

const ALL_BRANCHES = 'all';

const STAGE_TABS: Array<{ value: StageFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'awaiting_class', label: 'Awaiting class' },
  { value: 'class_created', label: 'Class created' },
  { value: 'closed', label: 'Closed' },
];

const ROW_GRID =
  'lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-3';

export function JobsListPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [now] = useState(() => Date.now());
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const branchUuid = branchFilter === ALL_BRANCHES ? undefined : branchFilter;
  const { jobs: fetchedJobs, query: jobsQuery } = useOrganisationJobs(organisationUuid, branchUuid);
  const { branches } = useOrganisationBranches(organisationUuid);

  // The server filters by branch; this guards against a backend that ignores the parameter.
  const jobs = useMemo(
    () => (branchUuid ? fetchedJobs.filter(job => job.branch_uuid === branchUuid) : fetchedJobs),
    [fetchedJobs, branchUuid]
  );

  const courseIds = useMemo(() => jobs.map(job => job.course_uuid ?? '').filter(Boolean), [jobs]);
  const programIds = useMemo(() => jobs.map(job => job.program_uuid ?? '').filter(Boolean), [jobs]);
  const instructorIds = useMemo(
    () => jobs.map(job => hiredInstructorUuid(job) ?? '').filter(Boolean),
    [jobs]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);
  const { instructorMap } = useInstructorsByIds(instructorIds);

  const stageCounts = useMemo(() => {
    const counts: Record<StageFilter, number> = {
      all: jobs.length,
      open: 0,
      awaiting_class: 0,
      class_created: 0,
      closed: 0,
    };
    for (const job of jobs) counts[jobStage(job, now)] += 1;
    return counts;
  }, [jobs, now]);

  const rows = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return jobs
      .filter(job => stageFilter === 'all' || jobStage(job, now) === stageFilter)
      .filter(job => {
        if (!query) return true;
        const hired = hiredInstructorUuid(job);
        return [
          job.title,
          job.branch_name,
          job.location_name,
          job.course_uuid ? courseMap[job.course_uuid]?.name : null,
          job.program_uuid ? programMap[job.program_uuid]?.title : null,
          hired ? instructorMap[hired]?.full_name : null,
          ...(job.resources ?? []).map(resource => resource.resource_name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort(
        (a, b) => new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
      );
  }, [jobs, stageFilter, deferredSearch, now, courseMap, programMap, instructorMap]);

  const kpiLoading = jobsQuery.isLoading && !jobsQuery.data;
  const kpiValue = (value: number) => (kpiLoading ? <Skeleton className='h-7 w-10' /> : value);

  return (
    <OrgPage className='space-y-6'>
      <PageHeader
        title='Jobs'
        description='Every class job you have posted: where it runs, what it holds, who applied, and what needs doing next.'
        actions={
          <Button asChild>
            <Link href={postJobHref()}>
              <Plus className='h-4 w-4' />
              Post a job
            </Link>
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <KpiCard
          title='Open'
          value={kpiValue(stageCounts.open)}
          hint='Taking applications'
          icon={<Briefcase className='h-4 w-4' />}
        />
        <KpiCard
          title='Awaiting class'
          value={kpiValue(stageCounts.awaiting_class)}
          hint='Hired, class not created yet'
          variant='amber'
          icon={<Clock className='h-4 w-4' />}
        />
        <KpiCard
          title='Class created'
          value={kpiValue(stageCounts.class_created)}
          hint='Holds confirmed'
          variant='green'
          icon={<CircleCheck className='h-4 w-4' />}
        />
        <KpiCard
          title='Closed'
          value={kpiValue(stageCounts.closed)}
          hint='Expired or cancelled'
          className='border-l-muted-foreground/60'
          icon={<X className='text-muted-foreground h-4 w-4' />}
        />
      </div>

      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='max-w-full overflow-x-auto'>
          <Tabs value={stageFilter} onValueChange={value => setStageFilter(value as StageFilter)}>
            <TabsList>
              {STAGE_TABS.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className='px-3'>
                  {tab.label} ({stageCounts[tab.value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className='w-full sm:w-52' aria-label='Filter by branch'>
              <Building2 className='text-muted-foreground' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
              {branches
                .filter(branch => branch.uuid)
                .map(branch => (
                  <SelectItem key={branch.uuid} value={branch.uuid as string}>
                    {branch.branch_name || 'Untitled branch'}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className='relative w-full sm:w-64'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search jobs'
              aria-label='Search jobs'
              className='pl-9'
            />
          </div>
        </div>
      </div>

      <AsyncSection
        loading={jobsQuery.isLoading && !jobsQuery.data}
        error={jobsQuery.error}
        onRetry={() => jobsQuery.refetch()}
        errorTitle='Couldn’t load your jobs'
        skeleton={<JobRowsSkeleton />}
        empty={jobs.length === 0}
        emptyState={
          <EmptyState
            variant='card'
            icon={Briefcase}
            title={branchUuid ? 'No jobs at this branch yet' : 'No jobs yet'}
            description='Post a job for an approved course or program. Instructors apply, you hire, and the class is created from the job.'
            action={
              <Button asChild>
                <Link href={postJobHref()}>
                  <Plus className='h-4 w-4' />
                  Post a job
                </Link>
              </Button>
            }
          />
        }
      >
        <div className='border-border/70 bg-card overflow-hidden rounded-md border shadow-sm'>
          <div
            className={cn(
              'bg-muted/40 text-muted-foreground hidden border-b px-4 py-2.5 text-xs font-semibold',
              ROW_GRID
            )}
          >
            <div>Job</div>
            <div>Branch</div>
            <div>Schedule</div>
            <div>Venue &amp; equipment</div>
            <div>Applicants</div>
            <div>Status</div>
            <div className='text-right'>Next step</div>
          </div>
          {rows.length === 0 ? (
            <p className='text-muted-foreground px-4 py-10 text-center text-sm'>
              No jobs match these filters.
            </p>
          ) : (
            rows.map(job => (
              <JobRow key={job.uuid} job={job} now={now} instructorMap={instructorMap} />
            ))
          )}
        </div>
      </AsyncSection>
    </OrgPage>
  );
}

function CellLabel({ children }: { children: string }) {
  return (
    <p className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase lg:hidden'>
      {children}
    </p>
  );
}

function JobRow({
  job,
  now,
  instructorMap,
}: {
  job: ClassMarketplaceJob;
  now: number;
  instructorMap: Record<string, Instructor>;
}) {
  const stage = jobStage(job, now);
  const resourcesHold = jobResourcesHoldState(job);
  const windows = useMemo(() => jobSessionWindows(job), [job]);
  const first = windows[0];
  const cta = nextStepCta(job, now);
  const hiredUuid = hiredInstructorUuid(job);
  const hiredName = hiredUuid
    ? (instructorMap[hiredUuid]?.full_name ?? 'the hired instructor')
    : null;
  const applicants = Number(job.application_count ?? 0);
  const applicantNote =
    stage === 'awaiting_class' && hiredName
      ? `Hired ${hiredName}`
      : stage === 'class_created' && hiredName
        ? `${hiredName} teaching`
        : stage === 'closed'
          ? hiredName
            ? `Hired ${hiredName}`
            : 'Nobody hired'
          : applicants > 0
            ? `${applicants} applied`
            : 'No applicants yet';
  const town = jobTown(job);

  return (
    <div
      className={cn(
        'hover:bg-muted/30 flex flex-col gap-3 border-b px-4 py-4 text-sm last:border-b-0 lg:items-start',
        ROW_GRID
      )}
    >
      <div className='min-w-0'>
        <Link
          href={jobHref(job.uuid ?? '')}
          className='text-foreground font-semibold hover:underline'
        >
          {job.title || 'Untitled job'}
        </Link>
        <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
          <Badge variant='outline'>{serviceLabel(job.service_type, job.session_format)}</Badge>
          <Badge variant='outline'>{deliveryLabel(job.location_type)}</Badge>
          <span className='text-muted-foreground text-xs'>
            Posted {formatDate(job.created_date)}
          </span>
        </div>
      </div>

      <div className='min-w-0'>
        <CellLabel>Branch</CellLabel>
        {job.branch_uuid ? (
          <>
            <div className='flex items-center gap-1.5'>
              <MapPin className='text-primary h-3.5 w-3.5 shrink-0' />
              <span className='truncate font-medium'>{job.branch_name || 'Branch'}</span>
            </div>
            {town ? <p className='text-muted-foreground pl-5 text-xs'>{town}</p> : null}
          </>
        ) : (
          <>
            <Badge variant='secondary'>No branch</Badge>
            {job.location_name ? (
              <p className='text-muted-foreground mt-1 truncate text-xs'>{job.location_name}</p>
            ) : null}
          </>
        )}
      </div>

      <div className='min-w-0'>
        <CellLabel>Schedule</CellLabel>
        <p>{first ? formatDateTime(first.start, { zone: first.timezone }) : 'No sessions'}</p>
        <p className='text-muted-foreground text-xs'>{sessionCountLabel(windows.length)}</p>
      </div>

      <div className='min-w-0'>
        <CellLabel>Venue &amp; equipment</CellLabel>
        <div className='flex flex-col items-start gap-1'>
          {(job.resources ?? []).map(resource => {
            const hold = resourceHoldState(resource);
            return (
              <HoldBadge
                key={resource.resource_uuid}
                hold={hold}
                label={`${resource.resource_name || 'Resource'} · ${hold.label}`}
              />
            );
          })}
          <span className='text-muted-foreground text-xs'>{resourcesHold.note}</span>
        </div>
      </div>

      <div className='min-w-0'>
        <CellLabel>Applicants</CellLabel>
        <p className='font-semibold'>{applicants}</p>
        <p className='text-muted-foreground truncate text-xs'>{applicantNote}</p>
      </div>

      <div className='min-w-0'>
        <CellLabel>Status</CellLabel>
        <JobStageBadge job={job} now={now} />
      </div>

      <div className='flex flex-row flex-wrap items-center gap-3 lg:flex-col lg:items-end lg:gap-1.5'>
        <Button asChild size='sm' variant={stage === 'awaiting_class' ? 'default' : 'outline'}>
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
        <Link href={jobHref(job.uuid ?? '')} className='text-primary text-sm hover:underline'>
          View job
        </Link>
      </div>
    </div>
  );
}

function JobRowsSkeleton() {
  return (
    <div className='border-border/70 bg-card overflow-hidden rounded-md border shadow-sm'>
      <div className='bg-muted/40 hidden h-9 border-b lg:block' />
      {[0, 1, 2, 3, 4].map(row => (
        <div
          key={row}
          className={cn('flex flex-col gap-3 border-b px-4 py-4 last:border-b-0', ROW_GRID)}
        >
          <div className='space-y-2'>
            <Skeleton className='h-4 w-4/5' />
            <Skeleton className='h-5 w-3/5' />
          </div>
          <Skeleton className='h-4 w-24' />
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-16' />
          </div>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-10' />
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-8 w-28 lg:ml-auto' />
        </div>
      ))}
    </div>
  );
}
