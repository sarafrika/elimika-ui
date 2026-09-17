'use client';

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Info,
  MapPin,
  Plus,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { StatusBadge } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob, Instructor } from '@/services/client';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useOrganisationJobs } from '@/src/features/organisation/jobs/hooks/use-organisation-jobs';
import { jobHref, jobsHref, postJobHref } from '@/src/features/organisation/jobs/lib/job-routes';
import {
  deliveryLabel,
  hiredInstructorUuid,
  jobResourcesHoldState,
  jobSessionWindows,
  jobStage,
  jobTown,
  serviceLabel,
  sessionCountLabel,
} from '@/src/features/organisation/jobs/lib/job-stage';

export function PickJobStep({
  courseUuid,
  instructorUuid,
}: {
  courseUuid?: string | null;
  instructorUuid?: string | null;
}) {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [now] = useState(() => Date.now());
  const [selected, setSelected] = useState('');
  const { jobs, query } = useOrganisationJobs(organisationUuid);

  const forCourse = useMemo(
    () => (courseUuid ? jobs.filter(job => job.course_uuid === courseUuid) : jobs),
    [jobs, courseUuid]
  );
  const ready = useMemo(
    () => forCourse.filter(job => job.uuid && jobStage(job, now) === 'awaiting_class'),
    [forCourse, now]
  );
  const notReady = useMemo(
    () => forCourse.filter(job => job.uuid && jobStage(job, now) === 'open'),
    [forCourse, now]
  );
  const hiredIds = useMemo(
    () => ready.map(job => hiredInstructorUuid(job) ?? '').filter(Boolean),
    [ready]
  );
  const { instructorMap } = useInstructorsByIds(hiredIds);

  const loading = query.isLoading && !query.data;
  const selectedJob = ready.find(job => job.uuid === selected);

  return (
    <div className='flex flex-col gap-5'>
      {instructorUuid ? (
        <div className='border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-md border p-4 text-sm sm:flex-row sm:items-center'>
          <Info className='text-primary h-4 w-4 shrink-0' />
          <p className='flex-1'>
            Classes now start from a job. Post a job for this course or hire from an existing job.
          </p>
          <Button asChild size='sm'>
            <Link href={postJobHref(courseUuid)}>
              <Plus className='h-4 w-4' />
              Post a job
            </Link>
          </Button>
        </div>
      ) : null}

      <AsyncSection
        loading={loading}
        error={query.error}
        onRetry={() => query.refetch()}
        errorTitle='Couldn’t load your jobs'
        skeleton={
          <div className='grid gap-4 md:grid-cols-2'>
            {[0, 1].map(item => (
              <Skeleton key={item} className='h-48 rounded-xl' />
            ))}
          </div>
        }
        empty={ready.length === 0}
        emptyState={
          <div className='border-border/70 bg-card flex flex-col items-center gap-2.5 rounded-xl border px-6 py-9 text-center'>
            <div className='bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-lg'>
              <BriefcaseBusiness className='h-5 w-5' />
            </div>
            <p className='text-base font-semibold'>No jobs are ready for a class</p>
            <p className='text-muted-foreground max-w-md text-sm'>
              A class is created from a job once you've hired its instructor. Post a job for the
              course, or finish hiring on a job you've already posted.
            </p>
            <div className='mt-1 flex flex-wrap justify-center gap-2'>
              <Button asChild variant='outline'>
                <Link href={jobsHref()}>Go to Jobs</Link>
              </Button>
              <Button asChild>
                <Link href={postJobHref(courseUuid)}>
                  <Plus className='h-4 w-4' />
                  Post a job
                </Link>
              </Button>
            </div>
          </div>
        }
      >
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-baseline justify-between gap-2'>
            <h2 className='text-base font-semibold'>
              Ready for a class{' '}
              <span className='text-muted-foreground text-sm font-normal'>· {ready.length}</span>
            </h2>
            <p className='text-muted-foreground text-xs'>
              Hours, venue and equipment can't change here. They come from the job.
            </p>
          </div>
          <div
            role='radiogroup'
            aria-label='Jobs ready for a class'
            className='grid gap-4 md:grid-cols-2'
          >
            {ready.map(job => (
              <ReadyJobCard
                key={job.uuid}
                job={job}
                selected={job.uuid === selected}
                onSelect={() => setSelected(job.uuid ?? '')}
                instructorMap={instructorMap}
              />
            ))}
          </div>
        </div>
      </AsyncSection>

      {notReady.length > 0 ? (
        <div className='flex flex-col gap-2.5'>
          <h2 className='text-base font-semibold'>Not ready yet</h2>
          {notReady.map(job => (
            <NotReadyRow key={job.uuid} job={job} />
          ))}
        </div>
      ) : null}

      <div className='border-border/70 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <Info className='h-3.5 w-3.5 shrink-0' />
          <span>
            Need different hours, another venue or a new course?{' '}
            <Link
              href={postJobHref(courseUuid)}
              className='text-primary font-medium hover:underline'
            >
              Post a job
            </Link>
          </span>
        </p>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button asChild variant='outline'>
            <Link href={dashboardUrl('organisation', 'classes')}>Cancel</Link>
          </Button>
          <Button
            disabled={!selectedJob}
            onClick={() =>
              selectedJob?.uuid &&
              router.push(
                dashboardUrl(
                  'organisation',
                  `classes/new?job=${encodeURIComponent(selectedJob.uuid)}`
                )
              )
            }
          >
            Continue
            <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReadyJobCard({
  job,
  selected,
  onSelect,
  instructorMap,
}: {
  job: ClassMarketplaceJob;
  selected: boolean;
  onSelect: () => void;
  instructorMap: Record<string, Instructor>;
}) {
  const windows = useMemo(() => jobSessionWindows(job), [job]);
  const first = windows[0];
  const resourcesHold = jobResourcesHoldState(job);
  const hiredUuid = hiredInstructorUuid(job);
  const hiredName = hiredUuid ? instructorMap[hiredUuid]?.full_name : null;
  const online = job.location_type === 'ONLINE';
  const place = online ? 'Online' : jobTown(job);

  return (
    <button
      type='button'
      role='radio'
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'bg-card flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'border-border hover:border-primary/40'
      )}
    >
      <div className='flex items-start gap-2.5'>
        <span
          className={cn(
            'mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-primary' : 'border-muted-foreground/40'
          )}
        >
          {selected ? <span className='bg-primary h-2 w-2 rounded-full' /> : null}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-[15px] font-semibold'>{job.title || 'Untitled job'}</p>
          <div className='mt-1.5 flex flex-wrap gap-1.5'>
            <Badge variant='outline'>{serviceLabel(job.service_type, job.session_format)}</Badge>
            <Badge variant='outline'>{deliveryLabel(job.location_type)}</Badge>
            <StatusBadge tone='warning' label='Awaiting class' />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-1.5 text-sm'>
        <p className='flex items-center gap-2'>
          <MapPin className='text-primary h-4 w-4 shrink-0' />
          <span className='min-w-0 truncate'>
            <strong className='font-semibold'>{job.branch_name || 'No branch'}</strong>
            {place ? ` · ${place}` : ''}
          </span>
        </p>
        <p className='flex items-center gap-2'>
          <CalendarClock className='text-muted-foreground h-4 w-4 shrink-0' />
          <span>
            {first ? formatDate(first.start, { zone: first.timezone }) : 'No sessions'} ·{' '}
            {sessionCountLabel(windows.length)}
          </span>
        </p>
        <p className='flex items-center gap-2'>
          <UserCheck className='text-muted-foreground h-4 w-4 shrink-0' />
          <span>
            {hiredName ?? (hiredUuid ? 'Loading instructor…' : 'Hired instructor')}{' '}
            <span className='text-muted-foreground'>(hired)</span>
          </span>
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-1.5'>
        {(job.resources ?? []).map(resource => (
          <Badge key={resource.resource_uuid} variant='outline'>
            {resource.resource_name || 'Held resource'}
          </Badge>
        ))}
        <span className='text-muted-foreground text-xs'>
          {job.resources?.length
            ? resourcesHold.label.toLowerCase()
            : online
              ? 'Online — nothing held but instructor time'
              : 'No venue or equipment held'}
        </span>
      </div>
    </button>
  );
}

function NotReadyRow({ job }: { job: ClassMarketplaceJob }) {
  const windows = useMemo(() => jobSessionWindows(job), [job]);
  const first = windows[0];
  const applicants = Number(job.application_count ?? 0);
  return (
    <div className='bg-muted/30 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center'>
      <div className='min-w-0 flex-1'>
        <p className='font-semibold'>{job.title || 'Untitled job'}</p>
        <p className='text-muted-foreground mt-1 flex items-center gap-1.5 text-xs'>
          <MapPin className='h-3.5 w-3.5 shrink-0' />
          <span className='truncate'>
            {[
              job.branch_name || 'No branch',
              serviceLabel(job.service_type, job.session_format),
              first ? formatDate(first.start, { zone: first.timezone }) : null,
              sessionCountLabel(windows.length),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </p>
      </div>
      <StatusBadge
        tone='info'
        label={`Open · ${applicants} applicant${applicants === 1 ? '' : 's'}`}
      />
      <Link
        href={jobHref(job.uuid ?? '', 'applicants')}
        className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
      >
        Hire someone first
        <ArrowRight className='h-3.5 w-3.5' />
      </Link>
    </div>
  );
}
