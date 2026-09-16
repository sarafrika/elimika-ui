'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CircleCheck,
  Lock,
  Pencil,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DetailRow, SectionCard, SectionCardSkeleton } from '@/app/dashboard/admin/_components/ui';
import type { RateBasis } from '@/components/class-form';
import { AsyncSection } from '@/components/data/async-section';
import { jobApplicationsQueryOptions } from '@/components/profile-job-marketplace/_components/JobApplicantsPanel';
import { JobMoneyRows } from '@/components/profile-job-marketplace/_components/MoneyRow';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import {
  createClassForJobMutation,
  getJobOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { HoldBadge } from '@/src/features/organisation/jobs/components/job-badges';
import {
  HiredInstructorRow,
  JobResourceList,
  JobSessionList,
  JobWhereContent,
  useJobResourceRows,
} from '@/src/features/organisation/jobs/components/job-sections';
import {
  editJobHref,
  jobHref,
  viewClassHref,
} from '@/src/features/organisation/jobs/lib/job-routes';
import {
  hiredApplicationFor,
  hiredInstructorUuid,
  holdStateFor,
  jobSessionWindows,
  type HoldState,
  scheduleSummary,
  serviceLabel,
} from '@/src/features/organisation/jobs/lib/job-stage';

const CONFIRMED: HoldState = {
  key: 'confirmed',
  label: 'Confirmed',
  note: 'Confirmed for the class',
};

function LockedTitle({ children }: { children: ReactNode }) {
  return (
    <span className='inline-flex items-center gap-2'>
      {children}
      <Lock className='text-muted-foreground h-3.5 w-3.5' />
    </span>
  );
}

export function ReviewCreateStep({
  jobUuid,
  onCreated,
}: {
  jobUuid: string;
  onCreated?: () => void;
}) {
  const queryClient = useQueryClient();
  const [now] = useState(() => Date.now());
  const [createdClassUuid, setCreatedClassUuid] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const jobQuery = useQuery({ ...getJobOptions({ path: { jobUuid } }), enabled: Boolean(jobUuid) });
  const job = jobQuery.data?.data ?? null;

  const applicationsQuery = useQuery({
    ...jobApplicationsQueryOptions(jobUuid),
    enabled: Boolean(jobUuid),
  });
  const applications = useMemo(
    () => applicationsQuery.data?.data?.content ?? [],
    [applicationsQuery.data]
  );
  const hiredApplication = hiredApplicationFor(job, applications);
  const hiredUuid =
    (job ? hiredInstructorUuid(job) : null) ?? hiredApplication?.instructor_uuid ?? null;
  const { instructorMap, isLoading: instructorLoading } = useInstructorsByIds(
    hiredUuid ? [hiredUuid] : []
  );
  const instructor = hiredUuid ? (instructorMap[hiredUuid] ?? null) : null;
  const instructorName = instructor?.full_name || 'the hired instructor';

  const { courseMap } = useCoursesByIds(job?.course_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(job?.program_uuid ? [job.program_uuid] : []);
  const offering =
    (job?.program_uuid && programMap[job.program_uuid]?.title) ||
    (job?.course_uuid && courseMap[job.course_uuid]?.name) ||
    job?.title ||
    'Course or program';

  const { rows: resourceRows, isLoading: resourcesLoading } = useJobResourceRows(job);
  const windows = useMemo(() => (job ? jobSessionWindows(job) : []), [job]);

  const createClass = useMutation({
    ...createClassForJobMutation(),
    onSuccess: async response => {
      setCreatedClassUuid(response?.data?.uuid ?? '');
      onCreated?.();
      toast.success('Class created.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await invalidateJobApplicationWorkflowQueries(queryClient);
    },
    onError: error => {
      const message = getErrorMessage(
        error,
        'Unable to create the class for this job. The held times may no longer be free.'
      );
      setCreateError(message);
      toast.error(message);
    },
  });

  const created = createdClassUuid !== null;
  const status = job?.status as string | undefined;
  const physical = job?.location_type !== 'ONLINE';
  const sessionHold = created ? CONFIRMED : job ? holdStateFor(job, now, { sessions: true }) : null;
  const resourceHold = created ? CONFIRMED : job ? holdStateFor(job, now) : null;
  const venue = resourceRows.find(row => row.kind === 'VENUE') ?? null;

  const renderBlocked = () => {
    if (!job) return null;
    if (status === 'filled') {
      return (
        <EmptyState
          variant='card'
          icon={ShieldCheck}
          title='This job already has its class'
          description='The class was created, the hired instructor is on it, and the venue and equipment are confirmed bookings.'
          action={
            <Button asChild variant='outline'>
              <Link href={viewClassHref(job.assigned_class_definition_uuid)}>View class</Link>
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        variant='card'
        icon={UserRound}
        title='Hire somebody first'
        description='Nobody has been hired for this job yet. Open an applicant and hire them — the hire makes them a member of your organisation and leaves this job ready for its class.'
        action={
          <Button asChild variant='outline'>
            <Link href={jobHref(jobUuid, 'applicants')}>Open the applicants</Link>
          </Button>
        }
      />
    );
  };

  return (
    <AsyncSection
      loading={jobQuery.isLoading && !job}
      error={jobQuery.error}
      onRetry={() => jobQuery.refetch()}
      errorTitle='Couldn’t load this job'
      empty={!jobQuery.isLoading && !job}
      emptyState={
        <EmptyState
          variant='card'
          icon={BriefcaseBusiness}
          title='Job not found'
          description='This job no longer exists or isn’t visible to your organisation.'
          action={
            <Button asChild variant='outline'>
              <Link href={dashboardUrl('organisation', 'classes/new')}>Pick another job</Link>
            </Button>
          }
        />
      }
      skeleton={
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='flex flex-col gap-5'>
            <SectionCardSkeleton rows={5} />
            <SectionCardSkeleton rows={4} />
          </div>
          <div className='flex flex-col gap-5'>
            <SectionCardSkeleton rows={2} />
            <SectionCardSkeleton rows={3} />
          </div>
        </div>
      }
    >
      {job && sessionHold && resourceHold ? (
        !created && status !== 'awaiting_class' ? (
          renderBlocked()
        ) : (
          <div className='flex flex-col gap-5'>
            {created ? (
              <div
                role='status'
                className='border-success/40 bg-success/10 text-foreground flex flex-col gap-3 rounded-md border p-4 text-sm sm:flex-row sm:items-center'
              >
                <CircleCheck className='text-success h-5 w-5 shrink-0' />
                <p className='flex-1'>
                  <strong className='font-semibold'>Class created.</strong> The venue, equipment and
                  instructor time are now confirmed bookings, and the sessions are on the
                  instructor's timetable.
                </p>
                <Button asChild size='sm'>
                  <Link href={viewClassHref(createdClassUuid)}>View class</Link>
                </Button>
              </div>
            ) : null}

            <div className='border-border/70 bg-muted/20 flex flex-wrap items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm'>
              <BriefcaseBusiness className='text-primary h-4 w-4 shrink-0' />
              <span className='min-w-0 flex-1'>
                From job: <strong className='font-semibold'>{job.title || 'Untitled job'}</strong> ·{' '}
                {serviceLabel(job.service_type, job.session_format)} · posted{' '}
                {formatDate(job.created_date)}
              </span>
              {created ? null : (
                <Link
                  href={dashboardUrl('organisation', 'classes/new')}
                  className='text-primary text-sm font-medium hover:underline'
                >
                  Change job
                </Link>
              )}
            </div>

            <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
              <div className='flex min-w-0 flex-col gap-5'>
                <SectionCard
                  title={<LockedTitle>Where it happens</LockedTitle>}
                  description={
                    physical
                      ? 'The branch pin and venue from the job.'
                      : 'Online. The branch still owns the class and its students.'
                  }
                >
                  <JobWhereContent
                    job={job}
                    venue={venue}
                    venueLoading={resourcesLoading && !venue}
                  />
                </SectionCard>

                <SectionCard
                  title={<LockedTitle>Sessions</LockedTitle>}
                  description={scheduleSummary(windows)}
                  actions={
                    <HoldBadge
                      hold={sessionHold}
                      label={created ? 'Confirmed for the class' : 'On hold for this job'}
                    />
                  }
                >
                  <JobSessionList windows={windows} hold={sessionHold} initialCount={4} />
                </SectionCard>

                {physical ? (
                  <SectionCard
                    title={<LockedTitle>Venue &amp; equipment</LockedTitle>}
                    description={
                      created
                        ? 'Confirmed for the class.'
                        : 'Held for these exact sessions since the job was posted.'
                    }
                  >
                    <JobResourceList
                      rows={resourceRows}
                      hold={resourceHold}
                      isLoading={resourcesLoading}
                    />
                  </SectionCard>
                ) : null}

                <SectionCard title={<LockedTitle>Locked from the posting</LockedTitle>}>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <DetailRow label='Offering' value={offering} />
                    <DetailRow
                      label='Capacity'
                      value={
                        typeof job.max_participants === 'number'
                          ? `${job.max_participants} learners${job.allow_waitlist ? ' · waitlist on' : ''}`
                          : 'Not specified'
                      }
                    />
                    <DetailRow
                      label='Visibility'
                      value={job.class_visibility === 'PRIVATE' ? 'Private' : 'Public'}
                    />
                    <DetailRow
                      label='Target groups'
                      value={
                        job.target_groups?.length
                          ? job.target_groups.join(', ')
                          : 'Open to all students'
                      }
                    />
                  </div>
                </SectionCard>
              </div>

              <div className='flex min-w-0 flex-col gap-5'>
                <SectionCard title='Hired instructor'>
                  <HiredInstructorRow
                    instructor={instructor}
                    loading={instructorLoading || (applicationsQuery.isLoading && !hiredUuid)}
                    subtitle='Member of your organisation'
                  />
                </SectionCard>

                <SectionCard title='What this class earns'>
                  <JobMoneyRows
                    salePrice={job.sale_price}
                    instructorPay={job.instructor_pay}
                    rateBasis={job.rate_basis as RateBasis}
                  />
                  <p className='text-muted-foreground mt-3 flex items-start gap-1.5 text-xs'>
                    <Lock className='mt-0.5 h-3 w-3 shrink-0' />
                    Declared when the job was posted and carried over unchanged.
                  </p>
                </SectionCard>

                {created ? null : (
                  <SectionCard title='Create the class' className='border-primary/30'>
                    <div className='flex flex-col gap-3'>
                      <p className='text-muted-foreground text-sm'>
                        Confirms the venue and equipment held for this job, puts the sessions on{' '}
                        {instructorName}'s timetable and closes out the other applicants.
                      </p>
                      {createError ? (
                        <div
                          role='alert'
                          className='border-destructive/50 bg-destructive/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'
                        >
                          <TriangleAlert className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
                          <span>{createError}</span>
                        </div>
                      ) : null}
                      <Button
                        className='w-full'
                        disabled={createClass.isPending}
                        onClick={() => {
                          setCreateError(null);
                          createClass.mutate({ path: { jobUuid } });
                        }}
                      >
                        {createClass.isPending ? <Spinner className='h-4 w-4' /> : null}
                        Create class
                      </Button>
                      <div className='flex flex-col gap-2 border-t pt-3'>
                        <p className='text-sm font-medium'>Need different hours or rooms?</p>
                        <p className='text-muted-foreground text-xs'>
                          Edit the job instead. That releases these holds and places new ones, so
                          nothing is left reserved by accident.
                        </p>
                        <Button asChild variant='outline' size='sm' className='self-start'>
                          <Link href={editJobHref(jobUuid)}>
                            <Pencil className='h-4 w-4' />
                            Edit job
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </div>
        )
      ) : null}
    </AsyncSection>
  );
}
