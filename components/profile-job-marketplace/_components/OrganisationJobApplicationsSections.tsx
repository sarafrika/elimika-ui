'use client';

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  TriangleAlert,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import {
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
} from '@/app/dashboard/admin/_components/ui';
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
import { formatCurrency } from '@/lib/format-currency';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  Instructor,
} from '@/services/client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  isClassCreatedStatus,
  nextStepFor,
  statusLabel,
} from '../application-status';

export { APPLICATION_STATUSES };

export type ApplicationStatusFilter = 'ALL' | ApplicationStatus;

export type ApplicationStats = {
  total: number;
  inReview: number;
  hired: number;
  classCreated: number;
  closed: number;
};

function formatLabel(value?: string | null) {
  if (!value) return 'Not provided';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

export function ApplicationStatsCards({
  isLoading,
  stats,
}: {
  isLoading: boolean;
  stats: ApplicationStats;
}) {
  if (isLoading) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
        {[0, 1, 2, 3, 4].map(item => (
          <StatCardSkeleton key={item} />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total', value: stats.total, icon: Users, tone: 'info' as const },
    { label: 'In review', value: stats.inReview, icon: Clock, tone: 'warning' as const },
    { label: 'Hired', value: stats.hired, icon: CheckCircle2, tone: 'success' as const },
    {
      label: 'Class created',
      value: stats.classCreated,
      icon: BriefcaseBusiness,
      tone: 'success' as const,
    },
    { label: 'Closed', value: stats.closed, icon: XCircle, tone: 'destructive' as const },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
      {cards.map(card => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          tone={card.tone}
        />
      ))}
    </div>
  );
}

export function ApplicationsFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: ApplicationStatusFilter;
  onStatusFilterChange: (value: ApplicationStatusFilter) => void;
}) {
  return (
    <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]'>
      <label className='relative block'>
        <span className='sr-only'>Search applicants</span>
        <Input
          value={searchQuery}
          onChange={event => onSearchChange(event.target.value)}
          placeholder='Search by applicant name, profile, or note'
          className='h-10 pl-10'
        />
        <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
      </label>
      <Select
        value={statusFilter}
        onValueChange={value => onStatusFilterChange(value as ApplicationStatusFilter)}
      >
        <SelectTrigger className='h-10'>
          <SelectValue placeholder='All statuses' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='ALL'>All statuses</SelectItem>
          {APPLICATION_STATUSES.map(status => (
            <SelectItem key={status} value={status}>
              {statusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ApplicationsListSection({
  applications,
  instructorMap,
  isInstructorsLoading,
  jobInstructorPay,
  jobStatus,
  applicantHref,
}: {
  applications: ClassMarketplaceJobApplication[];
  instructorMap: Record<string, Instructor>;
  isInstructorsLoading: boolean;
  jobInstructorPay?: number | null;
  jobStatus?: string | null;
  applicantHref: (application: ClassMarketplaceJobApplication) => string;
}) {
  // A hire takes the job out of OPEN and every decision endpoint then refuses it, so the other
  // rows must stop offering a step the server would turn away.
  const hiredOnThisJob = applications.some(
    application =>
      (application.status as string) === 'hired' || isClassCreatedStatus(application.status)
  );
  const jobClosedToDecisions = hiredOnThisJob || (Boolean(jobStatus) && jobStatus !== 'open');
  const closedNote = hiredOnThisJob
    ? 'Another applicant was hired — no decision left here'
    : 'This job is no longer open to decisions';

  return (
    <div className='space-y-3'>
      {applications.map(application => {
        const instructor = application.instructor_uuid
          ? instructorMap[application.instructor_uuid]
          : null;
        const displayName =
          instructor?.full_name || `Instructor ${shortId(application.instructor_uuid)}`;
        const initials =
          displayName
            .split(/\s+/)
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?';
        // The cast carries the generated client, whose funnel still predates the backend's `hired`.
        const isHired = (application.status as string) === 'hired';
        const classCreated = isClassCreatedStatus(application.status);
        const nextStep = nextStepFor(application.status);
        const decisionsClosed = Boolean(nextStep) && jobClosedToDecisions;
        const forwardStep = decisionsClosed ? null : nextStep;
        const isVerified = application.instructor_admin_verified ?? instructor?.admin_verified;
        const trainingApproved = application.training_approved;
        const approvedRate = application.approved_rate;
        const notApprovedToTrain = trainingApproved === false;

        return (
          <div
            key={application.uuid}
            className='border-border/70 bg-card rounded-md border p-5 shadow-sm'
          >
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex items-start gap-3'>
                <div className='border-primary/30 bg-primary/10 text-primary flex size-11 items-center justify-center rounded-md border font-semibold'>
                  {initials}
                </div>
                <div className='space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-base font-semibold tracking-tight'>
                      <Link href={applicantHref(application)} className='hover:underline'>
                        {displayName}
                      </Link>
                    </h3>
                    {isVerified ? (
                      <StatusBadge status='verified' label='Verified' />
                    ) : isVerified === false ? (
                      <StatusBadge status='pending' label='Unverified' />
                    ) : null}
                  </div>
                  <div className='text-muted-foreground flex flex-col gap-1 text-sm'>
                    {instructor?.professional_headline ? (
                      <span>{instructor.professional_headline}</span>
                    ) : null}
                    {instructor?.website ? (
                      <a
                        href={instructor.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:text-primary/80 underline'
                      >
                        {instructor.website}
                      </a>
                    ) : null}
                    {!instructor && isInstructorsLoading ? (
                      <span>Loading instructor profile...</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <StatusBadge
                status={application.status}
                tone={isHired || classCreated ? 'success' : undefined}
                label={statusLabel(application.status)}
              />
            </div>

            {notApprovedToTrain && forwardStep ? (
              <div className='border-warning/60 bg-warning/10 text-foreground mt-3 flex items-center gap-2 rounded-md border p-3 text-sm'>
                <TriangleAlert className='text-warning size-4 shrink-0' />
                <span>
                  This instructor is not approved to train this course or program yet, so they
                  cannot be hired.
                </span>
              </div>
            ) : null}

            {typeof approvedRate === 'number' || typeof jobInstructorPay === 'number' ? (
              <div className='mt-3 flex flex-wrap items-center gap-2 text-sm'>
                <Badge variant='outline' className='rounded-md'>
                  Approved rate:{' '}
                  {typeof approvedRate === 'number'
                    ? `${formatCurrency(approvedRate)} / session`
                    : 'Not on rate card'}
                </Badge>
                <Badge variant='outline' className='rounded-md'>
                  Instructor pay:{' '}
                  {typeof jobInstructorPay === 'number'
                    ? `${formatCurrency(jobInstructorPay)} / session`
                    : 'Not specified'}
                </Badge>
                {typeof approvedRate === 'number' &&
                typeof jobInstructorPay === 'number' &&
                jobInstructorPay < approvedRate ? (
                  <Badge className='border-warning/60 bg-warning/10 text-warning rounded-md'>
                    Instructor pay is below the approved rate
                  </Badge>
                ) : null}
              </div>
            ) : null}

            <div className='mt-3 grid gap-3 sm:grid-cols-2'>
              <ApplicationNote label='Application note' value={application.application_note} />
              <ApplicationNote label='Review notes' value={application.review_notes} />
            </div>

            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline' className='rounded-md'>
                  Applied {formatDate(application.created_date)}
                </Badge>
                {application.reviewed_at ? (
                  <Badge variant='outline' className='rounded-md'>
                    Reviewed {formatDate(application.reviewed_at)}
                  </Badge>
                ) : null}
                {application.interview_at ? (
                  <Badge variant='outline' className='rounded-md'>
                    Interview {formatDate(application.interview_at)}
                  </Badge>
                ) : null}
              </div>

              {/* Decisions are taken on the applicant's own page; this board only says where
                  they stand and shows the way there. */}
              <div className='ml-auto flex flex-wrap items-center gap-3'>
                <span className='text-muted-foreground text-xs'>
                  {classCreated
                    ? 'This job’s class exists'
                    : isHired
                      ? 'Hired — create the class next'
                      : decisionsClosed
                        ? closedNote
                        : nextStep
                          ? `Next step: ${nextStep.label}`
                          : 'No further steps'}
                </span>
                <Button asChild variant='outline' size='sm'>
                  <Link href={applicantHref(application)}>
                    {forwardStep ? 'Review applicant' : 'Open applicant'}
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApplicationNote({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-3'>
      <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
      <p className='text-foreground mt-1 text-sm leading-6'>
        {value ||
          (label === 'Application note' ? 'No application note provided.' : 'No review notes yet.')}
      </p>
    </div>
  );
}

export function ApplicationListSkeleton() {
  return (
    <div className='space-y-3'>
      {[0, 1, 2].map(item => (
        <Skeleton key={item} className='h-52 rounded-md' />
      ))}
    </div>
  );
}

export function ApplicationsEmptyState() {
  return (
    <EmptyState
      icon={Search}
      title='No applicants found'
      description='No instructor applications match the selected filters.'
      variant='compact'
    />
  );
}

export function JobOverviewPanel({
  job,
  contentLabel,
  organisationUuid,
  isLoading,
}: {
  job: ClassMarketplaceJob | null;
  contentLabel?: string | null;
  organisationUuid?: string | null;
  isLoading: boolean;
}) {
  const { activeDomain } = useUserDomain();

  if (isLoading) return <JobOverviewSkeleton />;

  return (
    <SectionCard title='Job overview' className='h-fit'>
      <DetailGrid
        columns={1}
        items={[
          { label: 'Job title', value: job?.title ?? 'Not found' },
          {
            label: 'Sale price per session',
            value:
              typeof job?.sale_price === 'number'
                ? formatCurrency(job.sale_price)
                : 'Not specified',
          },
          {
            label: 'Instructor pay per session',
            value:
              typeof job?.instructor_pay === 'number'
                ? formatCurrency(job.instructor_pay)
                : 'Not specified',
          },
          {
            label: 'Margin per session',
            value:
              typeof job?.sale_price === 'number' && typeof job?.instructor_pay === 'number'
                ? formatCurrency(job.sale_price - job.instructor_pay)
                : 'Not available',
          },
          { label: 'Course / program', value: contentLabel ?? 'Not available' },
          {
            label: 'Organisation',
            value: job?.organisation_uuid ?? organisationUuid ?? 'Not available',
          },
          {
            label: 'Location',
            value: (
              <span className='inline-flex items-center gap-2'>
                <MapPin className='text-primary size-4' />
                {job?.location_name || formatLabel(job?.location_type)}
              </span>
            ),
          },
          {
            label: 'Schedule',
            value: (
              <div className='space-y-0.5'>
                <div>{formatDate(job?.default_start_time)}</div>
                <div className='text-muted-foreground text-xs'>
                  to {formatDate(job?.default_end_time)}
                </div>
              </div>
            ),
          },
        ]}
      />

      <div className='mt-4 flex flex-wrap gap-2'>
        <Button variant='outline' size='sm' asChild>
          <Link href={roleScopedDashboardPath(activeDomain, '/dashboard/opportunities')}>
            Back to opportunities
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}

function JobOverviewSkeleton() {
  return (
    <SectionCard title='Job overview' className='h-fit'>
      <div className='space-y-3'>
        {[0, 1, 2, 3, 4].map(item => (
          <Skeleton key={item} className='h-16 rounded-md' />
        ))}
      </div>
    </SectionCard>
  );
}
