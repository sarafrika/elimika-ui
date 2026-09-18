'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Mail, Phone, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import {
  adminTheme,
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
} from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
  useCoursesByIds,
  useOrganisationsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDateOnly, formatDateTimeWithZone } from '@/lib/date';
import { formatCurrency } from '@/lib/format-currency';
import { STALE_TIMES } from '@/lib/query-client';
import type { ClassMarketplaceJob } from '@/services/client';
import {
  getJobEligibilityOptions,
  getJobOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { ReadinessChip } from '@/src/features/instructor-jobs/components/readiness-chip';
import {
  findWorkHref,
  hiredJobHref,
  hiredJobsHref,
  instructorClassHref,
} from '@/src/features/instructor-jobs/job-routes';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { hiredJobData, isHiredApplication, jobLabel, jobPay } from '../hired-jobs';
import { jobPlaceLabel } from '../job-place';
import { HiredClassSchedule, PlannedJobSchedule } from './HiredJobSchedule';

export function HiredJobDetailsSkeleton() {
  return (
    <div className='flex flex-col gap-4' aria-hidden>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-2/3 max-w-lg' />
        <Skeleton className='h-4 w-1/2 max-w-md' />
      </div>
      <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-5'>
          <SectionCardSkeleton rows={6} />
          <SectionCardSkeleton rows={4} />
        </div>
        <SectionCardSkeleton rows={4} />
      </div>
    </div>
  );
}

export function HiredJobDetailsPage({ jobUuid }: { jobUuid: string }) {
  const profile = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const eligibility = useQuery({
    ...getJobEligibilityOptions({ path: { jobUuid } }),
    enabled: Boolean(profile?.uuid && jobUuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });
  const hired = isHiredApplication(eligibility.data?.application_status);
  const job = useQuery({
    ...getJobOptions({ path: { jobUuid } }),
    enabled: Boolean(profile?.uuid && jobUuid && hired),
    staleTime: STALE_TIMES.entity,
    select: hiredJobData,
  });

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor' },
      { id: 'jobs', title: 'Jobs', url: findWorkHref() },
      { id: 'hired', title: 'Hired', url: hiredJobsHref() },
      {
        id: 'hired-job',
        title: job.data?.title ?? 'Hire details',
        url: hiredJobHref(jobUuid),
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, job.data?.title, jobUuid]);

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' className='-ml-2 w-fit' asChild>
          <Link href={hiredJobsHref()}>
            <ArrowLeft aria-hidden className='size-4' />
            Hired
          </Link>
        </Button>
        <AsyncSection
          loading={eligibility.isPending || (hired && job.isPending)}
          error={eligibility.error || (hired && job.error)}
          errorTitle='Couldn’t load this hire'
          onRetry={() => {
            void eligibility.refetch();
            if (hired) void job.refetch();
          }}
          skeleton={<HiredJobDetailsSkeleton />}
          empty={!hired || !job.data}
          emptyState={
            <EmptyState
              icon={BriefcaseBusiness}
              title='Hired job not found'
              description='This job is unavailable or you have not been hired to train for it.'
              action={
                <Button asChild>
                  <Link href={hiredJobsHref()}>Back to hired jobs</Link>
                </Button>
              }
            />
          }
        >
          {hired && job.data && <HiredJobDetails job={job.data} />}
        </AsyncSection>
      </div>
    </div>
  );
}

function ContactPerson({ job }: { job: ClassMarketplaceJob }) {
  const name = job.contact_name?.trim();
  const phone = job.contact_phone?.trim();
  const email = job.contact_email?.trim();
  if (!name && !phone && !email) return null;

  return (
    <SectionCard
      title='Contact person'
      description='Who to reach at the branch about this class.'
      bodyClassName='space-y-2 text-sm'
    >
      {name ? (
        <p className='text-foreground flex items-center gap-2 font-medium'>
          <UserRound aria-hidden className='text-muted-foreground size-4' />
          {name}
        </p>
      ) : null}
      {phone ? (
        <p className='flex items-center gap-2'>
          <Phone aria-hidden className='text-muted-foreground size-4' />
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className='text-primary underline-offset-4 hover:underline'
          >
            {phone}
          </a>
        </p>
      ) : null}
      {email ? (
        <p className='flex items-center gap-2'>
          <Mail aria-hidden className='text-muted-foreground size-4' />
          <a
            href={`mailto:${email}`}
            className='text-primary break-all underline-offset-4 hover:underline'
          >
            {email}
          </a>
        </p>
      ) : null}
    </SectionCard>
  );
}

function HiredJobDetails({ job }: { job: ClassMarketplaceJob }) {
  const organisationIds = useMemo(
    () => (job.organisation_uuid ? [job.organisation_uuid] : []),
    [job.organisation_uuid]
  );
  const courseIds = useMemo(() => (job.course_uuid ? [job.course_uuid] : []), [job.course_uuid]);
  const programIds = useMemo(
    () => (job.program_uuid ? [job.program_uuid] : []),
    [job.program_uuid]
  );
  const organisations = useOrganisationsByIds(organisationIds);
  const courses = useCoursesByIds(courseIds);
  const programs = useProgramsByIds(programIds);
  const organisation = job.organisation_uuid
    ? organisations.organisationMap[job.organisation_uuid]
    : undefined;
  const course = job.course_uuid ? courses.courseMap[job.course_uuid] : undefined;
  const program = job.program_uuid ? programs.programMap[job.program_uuid] : undefined;
  const classUuid = job.assigned_class_definition_uuid;
  const meetingLink =
    job.meeting_link && /^https?:\/\//i.test(job.meeting_link) ? job.meeting_link : null;

  return (
    <>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-2'>
          <h1 className='text-foreground text-2xl font-bold tracking-tight break-words sm:text-3xl'>
            {job.title || 'Hire details'}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {[organisation?.name, jobLabel(job.location_type), jobPay(job)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <ReadinessChip
            label={classUuid ? 'Class created' : 'Class not created yet'}
            tone={classUuid ? 'success' : 'warning'}
          />
          {classUuid ? (
            <Button asChild>
              <Link href={instructorClassHref(classUuid)}>
                Open class
                <ArrowRight aria-hidden className='size-4' />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-5'>
          <SectionCard title='Job overview'>
            <p className='text-muted-foreground mb-5 text-sm leading-relaxed break-words whitespace-pre-wrap'>
              {job.description || 'No job description provided.'}
            </p>
            <DetailGrid
              items={[
                {
                  label: 'Organisation',
                  value:
                    organisation?.name ?? (organisations.isLoading ? 'Loading…' : 'Not available'),
                },
                {
                  label: job.program_uuid ? 'Training program' : 'Course',
                  value:
                    program?.title ??
                    course?.name ??
                    (courses.isLoading || programs.isLoading ? 'Loading…' : 'Not available'),
                },
                { label: 'Job status', value: jobLabel(job.status) },
                { label: 'Service type', value: jobLabel(job.service_type) },
                { label: 'Training starts', value: formatDateOnly(job.academic_period_start_date) },
                { label: 'Training ends', value: formatDateOnly(job.academic_period_end_date) },
                { label: 'Maximum participants', value: job.max_participants ?? 'Not set' },
                {
                  label: 'Target groups',
                  value: job.target_groups?.length ? job.target_groups.join(', ') : 'Not provided',
                },
                { label: 'Class visibility', value: jobLabel(job.class_visibility) },
                {
                  label: 'Waitlist',
                  value:
                    job.allow_waitlist == null
                      ? 'Not provided'
                      : job.allow_waitlist
                        ? 'Allowed'
                        : 'Not allowed',
                },
              ]}
            />
          </SectionCard>
          {classUuid ? (
            <HiredClassSchedule key={classUuid} classUuid={classUuid} />
          ) : (
            <PlannedJobSchedule job={job} />
          )}
          <SectionCard title='Location and delivery'>
            <DetailGrid
              items={[
                { label: 'Delivery mode', value: jobLabel(job.location_type) },
                { label: 'Venue / location', value: jobPlaceLabel(job, 'Not provided') },
                {
                  label: 'Session format',
                  value:
                    job.session_format === 'INDIVIDUAL'
                      ? 'Individual (one-to-one)'
                      : jobLabel(job.session_format),
                },
                {
                  label: 'Meeting link',
                  value: meetingLink ? (
                    <a
                      href={meetingLink}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary break-all underline'
                    >
                      Open online meeting
                    </a>
                  ) : (
                    'Not provided'
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>
        <aside className='space-y-5' aria-label='About this hire'>
          <ContactPerson job={job} />
          <SectionCard title='Agreed job rates' description='Rates set for this job.'>
            <div className='border-success/30 bg-success/10 mb-4 rounded-md border p-4'>
              <p className='text-muted-foreground text-sm'>Instructor pay</p>
              <p className='text-foreground mt-2 text-xl font-semibold'>{jobPay(job)}</p>
            </div>
            <DetailGrid
              columns={1}
              items={[
                { label: 'Rate basis', value: jobLabel(job.rate_basis) },
                { label: 'Session format', value: jobLabel(job.session_format) },
                { label: 'Delivery mode', value: jobLabel(job.location_type) },
                {
                  label: 'Learner training fee',
                  value:
                    typeof job.sale_price === 'number' ? formatCurrency(job.sale_price) : 'Not set',
                },
              ]}
            />
          </SectionCard>
          <SectionCard title='Class information'>
            <p className='text-muted-foreground text-sm'>
              {classUuid
                ? 'Your class has been created. Open it to access the teaching workspace.'
                : 'You have been hired. The organisation will create the class and confirm the sessions.'}
            </p>
            <DetailGrid
              columns={1}
              className='mt-4'
              items={[
                { label: 'Class created on', value: formatDateTimeWithZone(job.filled_at) },
                {
                  label: 'Registration opens',
                  value: formatDateOnly(job.registration_period_start_date),
                },
                {
                  label: 'Registration closes',
                  value: formatDateOnly(job.registration_period_end_date),
                },
                {
                  label: 'Reminder',
                  value:
                    job.class_reminder_minutes == null
                      ? 'Not set'
                      : `${job.class_reminder_minutes} minutes before class`,
                },
              ]}
            />
          </SectionCard>
        </aside>
      </div>
    </>
  );
}
