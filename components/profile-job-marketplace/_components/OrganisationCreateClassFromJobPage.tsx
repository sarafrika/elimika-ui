'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  Lock,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatusBadge,
} from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate, formatDateTimeWithZone } from '@/lib/date';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob } from '@/services/client';
import {
  createClassForJobMutation,
  getJobOptions,
  getJobQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';

type CreateClassFromJobPageProps = {
  jobUuid: string;
};

type JobWithPricing = ClassMarketplaceJob & {
  readonly sale_price?: number | null;
  readonly instructor_pay?: number | null;
  readonly program_uuid?: string | null;
};

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

function labelFor(value?: string | null) {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function OrganisationCreateClassFromJobPage({ jobUuid }: CreateClassFromJobPageProps) {
  const { activeDomain } = useUserDomain();
  const router = useRouter();
  const queryClient = useQueryClient();

  const jobOptions = { path: { jobUuid } };
  const jobQuery = useQuery({ ...getJobOptions(jobOptions), enabled: Boolean(jobUuid) });
  const job = (jobQuery.data?.data ?? null) as JobWithPricing | null;

  const instructorUuid = job?.assigned_instructor_uuid ?? null;
  const { instructorMap, isLoading: isInstructorLoading } = useInstructorsByIds(
    instructorUuid ? [instructorUuid] : []
  );
  const instructor = instructorUuid ? instructorMap[instructorUuid] : null;

  const programUuid = job?.program_uuid ?? null;
  const { courseMap } = useCoursesByIds(job?.course_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(programUuid ? [programUuid] : []);
  const offeringLabel = programUuid
    ? (programMap[programUuid]?.title ?? `Program ${shortId(programUuid)}`)
    : job?.course_uuid
      ? (courseMap[job.course_uuid]?.name ?? `Course ${shortId(job.course_uuid)}`)
      : 'Course or program';

  const applicationsHref = buildWorkspaceAliasPath(
    activeDomain,
    `/dashboard/opportunities/${jobUuid}`
  );

  const sessions = useMemo(() => job?.session_templates ?? [], [job?.session_templates]);

  const createClass = useMutation({
    ...createClassForJobMutation(),
    onSuccess: async response => {
      toast.success('Class created. The reserved venue and equipment are now booked.');
      await queryClient.invalidateQueries({ queryKey: getJobQueryKey(jobOptions) });
      await queryClient.invalidateQueries({ queryKey: [{ _id: 'listJobs' }] });
      const classUuid = response?.data?.uuid;
      router.push(
        buildWorkspaceAliasPath(
          activeDomain,
          classUuid ? `/dashboard/classes?highlight=${classUuid}` : '/dashboard/classes'
        )
      );
    },
    onError: error => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create the class for this job. The reserved times may no longer be free.'
      );
    },
  });

  const status = (job?.status as string | undefined) ?? null;
  const isReady = status === 'awaiting_class';
  const alreadyFilled = status === 'filled';

  const salePrice = typeof job?.sale_price === 'number' ? job.sale_price : null;
  const instructorPay = typeof job?.instructor_pay === 'number' ? job.instructor_pay : null;
  const margin = salePrice !== null && instructorPay !== null ? salePrice - instructorPay : null;

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' className='text-muted-foreground w-fit px-0' asChild>
          <Link href={applicationsHref}>
            <ArrowLeft className='mr-2 size-4' />
            Back to applicants
          </Link>
        </Button>

        <AdminPageHeader
          title={jobQuery.isLoading && !job ? 'Create the class' : `Create the class for ${job?.title ?? 'this job'}`}
          description='The offering, schedule, venue and pricing were fixed when this job was posted. Creating the class turns the reserved times into confirmed bookings.'
        />

        <AsyncSection
          loading={jobQuery.isLoading && !job}
          error={jobQuery.error}
          empty={!jobQuery.isLoading && !job}
          onRetry={() => jobQuery.refetch()}
          skeleton={<CreateClassSkeleton />}
          errorTitle='Couldn’t load this job'
          emptyState={
            <EmptyState
              icon={BriefcaseBusiness}
              title='Job not found'
              description='This class job no longer exists or is not visible to your organisation.'
              variant='card'
            />
          }
        >
          {alreadyFilled ? (
            <EmptyState
              icon={ShieldCheck}
              title='This job already has its class'
              description='The class was created and the reserved venue and equipment are booked.'
              action={
                <Button asChild variant='outline'>
                  <Link href={buildWorkspaceAliasPath(activeDomain, '/dashboard/classes')}>
                    View classes
                  </Link>
                </Button>
              }
              variant='card'
            />
          ) : !isReady ? (
            <EmptyState
              icon={UserRound}
              title='Assign an instructor first'
              description='A class can only be created once an approved applicant has been assigned to this job.'
              action={
                <Button asChild variant='outline'>
                  <Link href={applicationsHref}>Review applicants</Link>
                </Button>
              }
              variant='card'
            />
          ) : (
            <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
              <div className='space-y-4'>
                <SectionCard
                  title='Assigned instructor'
                  description='Chosen from the approved applicants for this job.'
                >
                  <div className='border-border/60 bg-muted/20 flex flex-wrap items-center gap-3 rounded-md border p-4'>
                    <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full'>
                      <UserRound className='size-5' />
                    </div>
                    <div className='min-w-0'>
                      <div className='text-foreground truncate text-sm font-medium'>
                        {instructor?.full_name ??
                          (isInstructorLoading
                            ? 'Loading instructor profile…'
                            : `Instructor ${shortId(instructorUuid)}`)}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {instructor?.professional_headline ?? 'Approved to deliver this offering'}
                      </div>
                    </div>
                    <div className='ml-auto'>
                      <StatusBadge status='assigned' label='Assigned' />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title='Reserved sessions'
                  description='These are the exact times held for this job. They cannot be changed here — cancel the job and repost to move them.'
                >
                  {sessions.length ? (
                    <div className='space-y-2'>
                      {sessions.map((session, index) => (
                        <div
                          key={session.uuid ?? `${session.start_time}-${index}`}
                          className='border-border/60 bg-muted/20 flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm'
                        >
                          <CalendarClock className='text-primary size-4 shrink-0' />
                          <span className='text-foreground'>
                            {formatDateTimeWithZone(session.start_time)}
                          </span>
                          <span className='text-muted-foreground'>to</span>
                          <span className='text-foreground'>
                            {formatDateTimeWithZone(session.end_time)}
                          </span>
                          {session.recurrence ? (
                            <Badge variant='outline' className='ml-auto rounded-md'>
                              Repeats
                            </Badge>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      This job has no session templates, so the class will be created without a
                      schedule.
                    </p>
                  )}
                </SectionCard>

                <SectionCard title='Locked from the posting'>
                  <DetailGrid
                    columns={2}
                    items={[
                      { label: 'Offering', value: offeringLabel },
                      { label: 'Visibility', value: labelFor(job?.class_visibility as string) },
                      { label: 'Session format', value: labelFor(job?.session_format as string) },
                      {
                        label: 'Location',
                        value: (
                          <span className='inline-flex items-center gap-2'>
                            <MapPin className='text-primary size-4' />
                            {job?.location_name || labelFor(job?.location_type as string)}
                          </span>
                        ),
                      },
                      {
                        label: 'Capacity',
                        value:
                          typeof job?.max_participants === 'number'
                            ? `${job.max_participants} learners`
                            : 'Not specified',
                      },
                      {
                        label: 'Academic period',
                        value: `${formatDate(job?.academic_period_start_date)} — ${formatDate(job?.academic_period_end_date)}`,
                      },
                    ]}
                  />
                </SectionCard>
              </div>

              <div className='space-y-4'>
                <SectionCard title='What this class earns' className='h-fit'>
                  <div className='space-y-3'>
                    <MoneyRow
                      label='Sold to learners at'
                      value={salePrice}
                      accent='border-l-primary'
                    />
                    <MoneyRow
                      label='Instructor is paid'
                      value={instructorPay}
                      accent='border-l-warning'
                    />
                    <MoneyRow
                      label='Your margin'
                      value={margin}
                      accent='border-l-success'
                      emphasis
                    />
                  </div>
                  <p className='text-muted-foreground mt-3 flex items-start gap-2 text-xs'>
                    <Lock className='mt-0.5 size-3 shrink-0' />
                    Both figures were declared when the job was posted and carry over to the class
                    unchanged.
                  </p>
                </SectionCard>

                <SectionCard title='Create the class' className='h-fit'>
                  <p className='text-muted-foreground text-sm'>
                    The venue and equipment held for this job are still only reserved. Creating the
                    class confirms those bookings and publishes the sessions to the instructor’s
                    timetable.
                  </p>
                  <Button
                    className='mt-4 w-full'
                    disabled={createClass.isPending}
                    onClick={() => createClass.mutate({ path: { jobUuid } })}
                  >
                    {createClass.isPending ? <Spinner className='mr-2 size-4' /> : null}
                    Create class
                  </Button>
                  <Button variant='outline' className='mt-2 w-full' asChild>
                    <Link href={applicationsHref}>Back to applicants</Link>
                  </Button>
                </SectionCard>
              </div>
            </div>
          )}
        </AsyncSection>
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  accent,
  emphasis,
}: {
  label: string;
  value: number | null;
  accent: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn('bg-muted/20 rounded-md border-l-4 px-3 py-2', accent)}>
      <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
      <div
        className={cn(
          'text-foreground mt-0.5 tabular-nums',
          emphasis ? 'text-lg font-semibold' : 'text-base font-medium'
        )}
      >
        {value === null ? 'Not specified' : `${formatCurrency(value)} / session`}
      </div>
    </div>
  );
}

function CreateClassSkeleton() {
  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
      <div className='space-y-4'>
        <Skeleton className='h-32 rounded-md' />
        <Skeleton className='h-56 rounded-md' />
        <Skeleton className='h-48 rounded-md' />
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-52 rounded-md' />
        <Skeleton className='h-44 rounded-md' />
      </div>
    </div>
  );
}
