'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Info,
  MoreVertical,
  Pencil,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DetailRow, SectionCard, SectionCardSkeleton } from '@/app/dashboard/admin/_components/ui';
import { OrgPage } from '@/app/dashboard/organisation/_components/org-page';
import type { RateBasis } from '@/components/class-form';
import { AsyncSection } from '@/components/data/async-section';
import {
  JobApplicantsPanel,
  jobApplicationsQueryOptions,
} from '@/components/profile-job-marketplace/_components/JobApplicantsPanel';
import { JobMoneyRows } from '@/components/profile-job-marketplace/_components/MoneyRow';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate, formatDateOnly } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import type { ClassMarketplaceJob } from '@/services/client';
import { cancelJobMutation, getJobOptions } from '@/services/client/@tanstack/react-query.gen';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { editJobHref, JOB_TABS, type JobTab, jobApplicantHref, jobsHref } from '../lib/job-routes';
import {
  deliveryLabel,
  hiredApplicationFor,
  holdStateFor,
  type JobStage,
  jobSessionWindows,
  jobStage,
  nextStepCta,
  reminderSummary,
  scheduleSummary,
  serviceLabel,
} from '../lib/job-stage';
import { JobActivityTab } from './job-activity-tab';
import { HoldBadge, JobStageBadge } from './job-badges';
import { JobHoldsTab } from './job-holds-tab';
import { JobProgressSteps } from './job-progress-steps';
import {
  HiredInstructorRow,
  JobResourceList,
  JobSessionList,
  JobWhereContent,
  useJobResourceRows,
} from './job-sections';

function nextStepCopy(
  stage: JobStage,
  job: ClassMarketplaceJob,
  applicants: number,
  hiredName: string
) {
  switch (stage) {
    case 'open':
      return applicants > 0
        ? `${applicants} instructor${applicants === 1 ? '' : 's'} applied. Review them and hire one — the job then waits for you to create its class.`
        : 'Nobody has applied yet. Instructors see this job in the marketplace, and you’ll be notified as applications arrive.';
    case 'awaiting_class':
      return `${hiredName} is hired. Create the class to confirm the venue and equipment, publish the sessions and close out the other applicants.`;
    case 'class_created':
      return 'The class exists. Its sessions, venue and equipment are confirmed bookings.';
    default:
      return job.status === 'cancelled'
        ? 'This job was cancelled and its holds were released. Repost it to advertise the same course again.'
        : 'This job closed before a class was created, so its holds were released. Repost it with new dates.';
  }
}

export function JobDetailsPage({ jobUuid }: { jobUuid: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [now] = useState(() => Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);

  const requestedTab = searchParams.get('tab') as JobTab | null;
  const tab: JobTab = requestedTab && JOB_TABS.includes(requestedTab) ? requestedTab : 'overview';
  const changeTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'overview') params.delete('tab');
    else params.set('tab', next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

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
    job?.hired_instructor_uuid ??
    job?.assigned_instructor_uuid ??
    hiredApplication?.instructor_uuid ??
    null;

  const applicantIds = useMemo(
    () => applications.map(application => application.instructor_uuid ?? '').filter(Boolean),
    [applications]
  );
  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(
    hiredUuid && !applicantIds.includes(hiredUuid) ? [...applicantIds, hiredUuid] : applicantIds
  );
  const hiredInstructor = hiredUuid ? (instructorMap[hiredUuid] ?? null) : null;

  const { courseMap } = useCoursesByIds(job?.course_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(job?.program_uuid ? [job.program_uuid] : []);
  const course = job?.course_uuid ? courseMap[job.course_uuid] : undefined;
  const program = job?.program_uuid ? programMap[job.program_uuid] : undefined;

  const { rows: resourceRows, isLoading: resourcesLoading } = useJobResourceRows(job);
  const windows = useMemo(() => (job ? jobSessionWindows(job) : []), [job]);

  const cancelJob = useMutation({
    ...cancelJobMutation(),
    onSuccess: async () => {
      toast.success('Job cancelled. Its holds have been released.');
      setConfirmCancel(false);
      await invalidateJobApplicationWorkflowQueries(queryClient);
    },
    onError: error => toast.error(getErrorMessage(error, 'Unable to cancel this job.')),
  });

  const jobLoading = jobQuery.isLoading && !job;

  if (!jobLoading && !jobQuery.error && !job) {
    return (
      <OrgPage className='space-y-6'>
        <BackLink />
        <EmptyState
          variant='card'
          icon={BriefcaseBusiness}
          title='Job not found'
          description='This job no longer exists or isn’t visible to your organisation.'
          action={
            <Button asChild variant='outline'>
              <Link href={jobsHref()}>All jobs</Link>
            </Button>
          }
        />
      </OrgPage>
    );
  }

  const stage = job ? jobStage(job, now) : 'open';
  const hold = job ? holdStateFor(job, now) : null;
  const cta = job ? nextStepCta(job, now) : null;
  const canEdit = stage === 'open' || stage === 'awaiting_class';
  const applicantCount = Number(job?.application_count ?? applications.length);
  const hiredName = hiredInstructor?.full_name || 'The hired instructor';
  const venue = resourceRows.find(row => row.kind === 'VENUE') ?? null;

  return (
    <OrgPage className='space-y-5'>
      <BackLink />

      <div className='relative flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between'>
        <span
          aria-hidden
          className='from-primary to-primary/50 absolute top-0 -left-4 hidden h-8 w-1 rounded-full bg-gradient-to-b sm:block'
        />
        {job ? (
          <div className='min-w-0 space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <JobStageBadge job={job} now={now} />
              <Badge variant='outline'>{serviceLabel(job.service_type, job.session_format)}</Badge>
              <Badge variant='outline'>{deliveryLabel(job.location_type)}</Badge>
              <Badge variant='outline'>
                {job.class_visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </Badge>
            </div>
            <h1 className='text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
              {job.title || 'Untitled job'}
            </h1>
            <p className='text-muted-foreground text-sm'>
              Posted {formatDate(job.created_date)} · {job.branch_name || 'No branch'}
            </p>
          </div>
        ) : jobQuery.error ? (
          <h1 className='text-foreground text-2xl font-bold tracking-tight'>Job</h1>
        ) : (
          <div className='space-y-2'>
            <Skeleton className='h-5 w-64' />
            <Skeleton className='h-8 w-96 max-w-full' />
            <Skeleton className='h-4 w-56' />
          </div>
        )}
        {job && cta ? (
          <div className='flex flex-wrap items-center gap-2'>
            {canEdit ? (
              <Button asChild variant='outline'>
                <Link href={editJobHref(jobUuid)}>
                  <Pencil className='h-4 w-4' />
                  Edit job
                </Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href={cta.href}>
                {cta.label}
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' aria-label='More job actions'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    className='text-destructive'
                    onSelect={() => setConfirmCancel(true)}
                  >
                    <XCircle className='h-4 w-4' />
                    Cancel job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>

      {jobQuery.error ? (
        <AsyncSection
          error={jobQuery.error}
          onRetry={() => jobQuery.refetch()}
          errorTitle='Couldn’t load this job'
        >
          {null}
        </AsyncSection>
      ) : null}

      {job ? (
        <JobProgressSteps
          closed={stage === 'closed'}
          steps={[
            { title: 'Posted', detail: formatDate(job.created_date), done: true },
            {
              title: 'Applicants',
              detail: `${applicantCount} applied`,
              done: applicantCount > 0 || Boolean(hiredUuid),
            },
            {
              title: 'Hired',
              detail: hiredUuid ? hiredName : 'Nobody yet',
              done: Boolean(hiredUuid) || stage === 'awaiting_class' || stage === 'class_created',
            },
            {
              title: 'Class created',
              detail: job.filled_at ? formatDate(job.filled_at) : 'Not yet',
              done: stage === 'class_created',
            },
          ]}
        />
      ) : jobLoading ? (
        <Skeleton className='h-16 w-full rounded-md' />
      ) : null}

      <Tabs value={tab} onValueChange={changeTab} className='gap-4'>
        <div className='max-w-full overflow-x-auto'>
          <TabsList>
            <TabsTrigger value='overview' className='px-3'>
              Overview
            </TabsTrigger>
            <TabsTrigger value='applicants' className='px-3'>
              Applicants ({applicantCount})
            </TabsTrigger>
            <TabsTrigger value='holds' className='px-3'>
              Holds &amp; bookings
            </TabsTrigger>
            <TabsTrigger value='activity' className='px-3'>
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='overview'>
          {job && hold && cta ? (
            <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
              <div className='flex min-w-0 flex-col gap-5'>
                <SectionCard
                  title='Where it happens'
                  description={
                    job.location_type === 'ONLINE'
                      ? 'Online. The branch still owns the class and its students.'
                      : 'The training location is the branch pin, copied onto the job when it was saved.'
                  }
                >
                  <JobWhereContent
                    job={job}
                    venue={venue}
                    venueLoading={resourcesLoading && !venue}
                  />
                </SectionCard>

                <SectionCard
                  title='Schedule'
                  description={scheduleSummary(windows)}
                  actions={<HoldBadge hold={hold} label={hold.note} />}
                >
                  <JobSessionList
                    windows={windows}
                    hold={holdStateFor(job, now, { sessions: true })}
                  />
                  <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                    <DetailRow
                      label='Registration window'
                      value={
                        job.registration_period_start_date || job.registration_period_end_date
                          ? `${formatDateOnly(job.registration_period_start_date)} – ${formatDateOnly(job.registration_period_end_date)}`
                          : 'Not set'
                      }
                    />
                    <DetailRow label='Reminders' value={reminderSummary(job)} />
                  </div>
                </SectionCard>

                <SectionCard title='Offering'>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <DetailRow
                      label={job.program_uuid ? 'Program' : 'Course'}
                      value={program?.title ?? course?.name ?? job.title ?? '—'}
                    />
                    <DetailRow
                      label='Category'
                      value={(course?.category_names ?? []).join(' · ') || 'Not set'}
                    />
                    <DetailRow
                      label='Capacity'
                      value={
                        typeof job.max_participants === 'number'
                          ? `${job.max_participants} learners · waitlist ${job.allow_waitlist ? 'on' : 'off'}`
                          : 'Not specified'
                      }
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
                <SectionCard title='Next step' className='border-primary/30'>
                  <div className='flex flex-col gap-3'>
                    <p className='text-muted-foreground text-sm'>
                      {nextStepCopy(stage, job, applicantCount, hiredName)}
                    </p>
                    <Button asChild className='w-full'>
                      <Link href={cta.href}>{cta.label}</Link>
                    </Button>
                    {canEdit ? (
                      <p className='text-muted-foreground flex items-start gap-1.5 text-xs'>
                        <Info className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                        Need different hours or rooms? Edit the job. That releases these holds and
                        places new ones.
                      </p>
                    ) : null}
                  </div>
                </SectionCard>

                <SectionCard title='Venue & equipment'>
                  <JobResourceList
                    rows={resourceRows}
                    hold={hold}
                    isLoading={resourcesLoading}
                    online={job.location_type === 'ONLINE'}
                  />
                  {resourceRows.length > 0 ? (
                    <p className='text-muted-foreground mt-3 border-t pt-3 text-xs'>
                      {hold.key === 'confirmed'
                        ? 'These were confirmed when the class was created and now belong to the class.'
                        : hold.key === 'released'
                          ? 'This job has closed, so these holds were released.'
                          : 'Held for the job’s exact session windows. Creating the class confirms them; cancelling or letting the job expire releases them.'}
                    </p>
                  ) : null}
                </SectionCard>

                <SectionCard title='Pay'>
                  <JobMoneyRows
                    salePrice={job.sale_price}
                    instructorPay={job.instructor_pay}
                    rateBasis={job.rate_basis as RateBasis}
                  />
                </SectionCard>

                {hiredUuid ? (
                  <SectionCard title='Instructor'>
                    <HiredInstructorRow
                      instructor={hiredInstructor}
                      loading={instructorsLoading}
                      subtitle={
                        hiredApplication?.reviewed_at
                          ? `Hired ${formatDate(hiredApplication.reviewed_at)} · member of your organisation`
                          : 'Member of your organisation'
                      }
                    />
                  </SectionCard>
                ) : null}
              </div>
            </div>
          ) : jobLoading ? (
            <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
              <div className='flex flex-col gap-5'>
                <SectionCardSkeleton rows={5} />
                <SectionCardSkeleton rows={6} />
              </div>
              <div className='flex flex-col gap-5'>
                <SectionCardSkeleton rows={3} />
                <SectionCardSkeleton rows={3} />
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value='applicants'>
          <JobApplicantsPanel
            jobUuid={jobUuid}
            job={job}
            applicantHref={application => jobApplicantHref(jobUuid, application.uuid ?? '')}
          />
        </TabsContent>

        <TabsContent value='holds'>
          {job && hold ? (
            <JobHoldsTab
              job={job}
              hold={hold}
              resourceRows={resourceRows}
              instructor={hiredInstructor}
              instructorUuid={hiredUuid}
            />
          ) : jobLoading ? (
            <SectionCardSkeleton rows={4} />
          ) : null}
        </TabsContent>

        <TabsContent value='activity'>
          {job ? (
            <JobActivityTab
              job={job}
              applications={applications}
              applicationsLoading={applicationsQuery.isLoading && !applicationsQuery.data}
              applicationsError={applicationsQuery.error}
              instructorMap={instructorMap}
            />
          ) : jobLoading ? (
            <SectionCardSkeleton rows={4} />
          ) : null}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirmCancel}
        onOpenChange={open => !cancelJob.isPending && setConfirmCancel(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {job?.title ? `“${job.title}” ` : 'This job '}
              leaves the marketplace, its applicants are closed out, and the venue, equipment and
              instructor time it holds are released. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelJob.isPending}>Keep job</AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={cancelJob.isPending}
              onClick={() => cancelJob.mutate({ path: { jobUuid } })}
            >
              {cancelJob.isPending ? <Spinner className='h-4 w-4' /> : null}
              Cancel job
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OrgPage>
  );
}

function BackLink() {
  return (
    <Link
      href={jobsHref()}
      className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
    >
      <ArrowLeft className='h-4 w-4' />
      All jobs
    </Link>
  );
}
