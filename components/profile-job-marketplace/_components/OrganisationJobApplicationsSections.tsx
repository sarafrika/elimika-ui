'use client';

import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  TriangleAlert,
  UserRound,
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
} from '@/app/dashboard/@admin/_components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/format-currency';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  Instructor,
  StatusEnum12,
} from '@/services/client';

export type ApplicationStatusFilter = 'ALL' | StatusEnum12;

export type ApplicationStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  assigned: number;
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
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    date
  );
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
    { label: 'Pending', value: stats.pending, icon: Clock, tone: 'warning' as const },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'success' as const },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, tone: 'destructive' as const },
    { label: 'Assigned', value: stats.assigned, icon: BriefcaseBusiness, tone: 'neutral' as const },
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
          <SelectItem value='pending'>Pending</SelectItem>
          <SelectItem value='approved'>Approved</SelectItem>
          <SelectItem value='rejected'>Rejected</SelectItem>
          <SelectItem value='assigned'>Assigned</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ApplicationsListSection({
  applications,
  instructorMap,
  isInstructorsLoading,
  isReviewPending,
  isAssignPending,
  jobTrainingFee,
  onApprove,
  onReject,
  onAssign,
  onViewProfile,
}: {
  applications: ClassMarketplaceJobApplication[];
  instructorMap: Record<string, Instructor>;
  isInstructorsLoading: boolean;
  isReviewPending: boolean;
  isAssignPending: boolean;
  jobTrainingFee?: number | null;
  onApprove: (application: ClassMarketplaceJobApplication) => void;
  onReject: (application: ClassMarketplaceJobApplication) => void;
  onAssign: (application: ClassMarketplaceJobApplication) => void;
  onViewProfile: (application: ClassMarketplaceJobApplication) => void;
}) {
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
        const reviewDisabled = application.status !== 'pending';
        const isVerified = application.instructor_admin_verified ?? instructor?.admin_verified;
        const trainingApproved = application.training_approved;
        const approvedRate = application.approved_rate;
        const notApprovedToTrain = trainingApproved === false;

        return (
          <div key={application.uuid} className='rounded-md border border-border/70 bg-card p-5 shadow-sm'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex items-start gap-3'>
                <div className='flex size-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-semibold text-primary'>
                  {initials}
                </div>
                <div className='space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-base font-semibold tracking-tight'>{displayName}</h3>
                    {isVerified ? (
                      <StatusBadge status='verified' label='Verified' />
                    ) : isVerified === false ? (
                      <StatusBadge status='pending' label='Unverified' />
                    ) : null}
                  </div>
                  <div className='flex flex-col gap-1 text-sm text-muted-foreground'>
                    {instructor?.professional_headline ? (
                      <span>{instructor.professional_headline}</span>
                    ) : null}
                    {instructor?.website ? (
                      <a
                        href={instructor.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary underline hover:text-primary/80'
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
              <StatusBadge status={application.status} label={formatLabel(application.status)} />
            </div>

            {notApprovedToTrain ? (
              <div className='mt-3 flex items-center gap-2 rounded-md border border-amber-500/60 bg-amber-500/10 p-3 text-sm text-foreground'>
                <TriangleAlert className='size-4 shrink-0 text-amber-600' />
                <span>
                  This instructor is not approved to train this course or program yet, so they
                  cannot be approved or assigned.
                </span>
              </div>
            ) : null}

            {typeof approvedRate === 'number' || typeof jobTrainingFee === 'number' ? (
              <div className='mt-3 flex flex-wrap items-center gap-2 text-sm'>
                <Badge variant='outline' className='rounded-md'>
                  Approved rate:{' '}
                  {typeof approvedRate === 'number'
                    ? `${formatCurrency(approvedRate)} / session`
                    : 'Not on rate card'}
                </Badge>
                <Badge variant='outline' className='rounded-md'>
                  Job fee:{' '}
                  {typeof jobTrainingFee === 'number'
                    ? `${formatCurrency(jobTrainingFee)} / session`
                    : 'Not specified'}
                </Badge>
                {typeof approvedRate === 'number' &&
                typeof jobTrainingFee === 'number' &&
                approvedRate !== jobTrainingFee ? (
                  <Badge className='rounded-md border-amber-500/60 bg-amber-500/10 text-amber-700'>
                    Rate differs from job fee
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
              </div>

              <div className='ml-auto flex flex-wrap gap-2'>
                <Button variant='ghost' size='sm' onClick={() => onViewProfile(application)}>
                  <UserRound className='mr-2 size-4' />
                  View profile
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onApprove(application)}
                  disabled={isReviewPending || reviewDisabled || notApprovedToTrain}
                >
                  <CheckCircle2 className='mr-2 size-4' />
                  Approve
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => onReject(application)}
                  disabled={isReviewPending || reviewDisabled}
                >
                  <XCircle className='mr-2 size-4' />
                  Reject
                </Button>
                <Button
                  size='sm'
                  onClick={() => onAssign(application)}
                  disabled={
                    isAssignPending || application.status !== 'approved' || notApprovedToTrain
                  }
                >
                  {isAssignPending ? <Spinner className='mr-2 size-4' /> : null}
                  Assign
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
    <div className='rounded-md border border-border/60 bg-muted/20 p-3'>
      <div className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</div>
      <p className='mt-1 text-sm leading-6 text-foreground'>
        {value || (label === 'Application note' ? 'No application note provided.' : 'No review notes yet.')}
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
  if (isLoading) return <JobOverviewSkeleton />;

  return (
    <SectionCard title='Job overview' className='h-fit'>
      <DetailGrid
        columns={1}
        items={[
          { label: 'Job title', value: job?.title ?? 'Not found' },
          {
            label: 'Pay per session',
            value:
              typeof job?.training_fee === 'number'
                ? formatCurrency(job.training_fee)
                : 'Not specified',
          },
          { label: 'Course / program', value: contentLabel ?? 'Not available' },
          { label: 'Organisation', value: job?.organisation_uuid ?? organisationUuid ?? 'Not available' },
          {
            label: 'Location',
            value: (
              <span className='inline-flex items-center gap-2'>
                <MapPin className='size-4 text-primary' />
                {job?.location_name || formatLabel(job?.location_type)}
              </span>
            ),
          },
          {
            label: 'Schedule',
            value: (
              <div className='space-y-0.5'>
                <div>{formatDate(job?.default_start_time)}</div>
                <div className='text-xs text-muted-foreground'>
                  to {formatDate(job?.default_end_time)}
                </div>
              </div>
            ),
          },
        ]}
      />

      <div className='mt-4 flex flex-wrap gap-2'>
        <Button variant='outline' size='sm' asChild>
          <Link href='/dashboard/opportunities'>Back to opportunities</Link>
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
