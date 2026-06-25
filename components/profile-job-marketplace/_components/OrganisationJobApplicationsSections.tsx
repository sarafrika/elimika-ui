'use client';

import { CheckCircle2, MapPin, Search, XCircle } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
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

export function JobApplicationsHeader({
  isJobLoading,
  jobTitle,
  isStatsLoading,
  stats,
}: {
  isJobLoading: boolean;
  jobTitle?: string | null;
  isStatsLoading: boolean;
  stats: ApplicationStats;
}) {
  return (
    <div className='flex flex-wrap items-start justify-between gap-4'>
      <div className='space-y-2'>
        <div>
          {isJobLoading ? (
            <Skeleton className='h-8 w-64 rounded-md' />
          ) : (
            <h1 className='text-2xl font-semibold tracking-tight'>
              {jobTitle ?? 'Job applications'}
            </h1>
          )}
          <p className='text-muted-foreground'>
            Review applicants, approve or reject submissions, then assign an approved instructor.
          </p>
        </div>
      </div>
      <ApplicationStatsBar isLoading={isStatsLoading} stats={stats} />
    </div>
  );
}

function ApplicationStatsBar({ isLoading, stats }: { isLoading: boolean; stats: ApplicationStats }) {
  if (isLoading) {
    return (
      <div className='flex flex-wrap gap-2'>
        {[0, 1, 2, 3, 4].map(item => (
          <Skeleton key={item} className='h-6 w-24 rounded-full' />
        ))}
      </div>
    );
  }

  return (
    <div className='flex flex-wrap gap-2'>
      <Badge className='bg-primary text-primary-foreground'>Total {stats.total}</Badge>
      <Badge className='bg-accent text-accent-foreground'>Pending {stats.pending}</Badge>
      <Badge variant='success'>Approved {stats.approved}</Badge>
      <Badge variant='destructive'>Rejected {stats.rejected}</Badge>
      <Badge variant='secondary'>Assigned {stats.assigned}</Badge>
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
          className='h-11 rounded-xl pl-10'
        />
        <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
      </label>
      <Select
        value={statusFilter}
        onValueChange={value => onStatusFilterChange(value as ApplicationStatusFilter)}
      >
        <SelectTrigger className='h-11 rounded-xl'>
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
  isApplicationsLoading,
  isInstructorsLoading,
  isReviewPending,
  isAssignPending,
  onApprove,
  onReject,
  onAssign,
}: {
  applications: ClassMarketplaceJobApplication[];
  instructorMap: Record<string, Instructor>;
  isApplicationsLoading: boolean;
  isInstructorsLoading: boolean;
  isReviewPending: boolean;
  isAssignPending: boolean;
  onApprove: (application: ClassMarketplaceJobApplication) => void;
  onReject: (application: ClassMarketplaceJobApplication) => void;
  onAssign: (application: ClassMarketplaceJobApplication) => void;
}) {
  if (isApplicationsLoading) return <ApplicationListSkeleton />;

  if (!applications.length) {
    return (
      <EmptyState
        icon={Search}
        title='No applicants found'
        description='No instructor applications match the selected filters.'
        variant='compact'
      />
    );
  }

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

        return (
          <Card key={application.uuid} className='rounded-2xl border bg-background/70 p-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full font-semibold'>
                  {initials}
                </div>
                <div className='space-y-1'>
                  <h3 className='text-lg font-semibold'>{displayName}</h3>
                  <div className='flex flex-col gap-2 text-sm text-muted-foreground'>
                    {instructor?.professional_headline ? (
                      <span className='inline-flex items-center gap-1'>
                        {instructor.professional_headline}
                      </span>
                    ) : null}
                    {instructor?.website ? (
                      <a
                        href={instructor.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 text-primary underline hover:text-primary/80'
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
              <Badge variant='secondary' className='rounded-full px-3 py-1'>
                {formatLabel(application.status)}
              </Badge>
            </div>

            <div className='mt-1 grid gap-3 sm:grid-cols-2'>
              <ApplicationNote label='Application note' value={application.application_note} />
              <ApplicationNote label='Review notes' value={application.review_notes} />
            </div>

            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline' className='rounded-full'>
                  Applied {formatDate(application.created_date)}
                </Badge>
                {application.reviewed_at ? (
                  <Badge variant='outline' className='rounded-full'>
                    Reviewed {formatDate(application.reviewed_at)}
                  </Badge>
                ) : null}
              </div>

              <div className='ml-auto flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  className='rounded-xl'
                  onClick={() => onApprove(application)}
                  disabled={isReviewPending || reviewDisabled}
                >
                  <CheckCircle2 className='mr-2 size-4' />
                  Approve
                </Button>
                <Button
                  variant='destructive'
                  className='rounded-xl'
                  onClick={() => onReject(application)}
                  disabled={isReviewPending || reviewDisabled}
                >
                  <XCircle className='mr-2 size-4' />
                  Reject
                </Button>
                <Button
                  className='rounded-xl'
                  onClick={() => onAssign(application)}
                  disabled={isAssignPending || application.status !== 'approved'}
                >
                  {isAssignPending ? <Spinner className='mr-2 size-4' /> : null}
                  Assign
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ApplicationNote({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className='rounded-xl border bg-background/80 p-3'>
      <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </div>
      <p className='mt-1 text-sm leading-6 text-foreground'>
        {value || (label === 'Application note' ? 'No application note provided.' : 'No review notes yet.')}
      </p>
    </div>
  );
}

function ApplicationListSkeleton() {
  return (
    <div className='space-y-3'>
      {[0, 1, 2].map(item => (
        <Skeleton key={item} className='h-56 rounded-2xl' />
      ))}
    </div>
  );
}

export function JobOverviewPanel({
  job,
  organisationUuid,
  isLoading,
}: {
  job: ClassMarketplaceJob | null;
  organisationUuid?: string | null;
  isLoading: boolean;
}) {
  if (isLoading) return <JobOverviewSkeleton />;

  return (
    <Card className='h-fit rounded-[18px] border border-border bg-card/95 p-4 shadow-sm'>
      <h2 className='text-lg font-semibold'>Job overview</h2>
      <div className='mt-4 space-y-3'>
        <OverviewTile label='Job title' value={job?.title ?? 'Not found'} />
        <OverviewTile label='Organisation' value={job?.organisation_uuid ?? organisationUuid ?? 'Not available'} />
        <div className='rounded-2xl border bg-background/70 p-3'>
          <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Location
          </div>
          <div className='mt-1 flex items-center gap-2 text-sm font-medium'>
            <MapPin className='size-4 text-primary' />
            {job?.location_name || formatLabel(job?.location_type)}
          </div>
        </div>
        <div className='rounded-2xl border bg-background/70 p-3'>
          <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Schedule
          </div>
          <div className='mt-1 text-sm font-medium'>{formatDate(job?.default_start_time)}</div>
          <div className='text-xs text-muted-foreground'>to {formatDate(job?.default_end_time)}</div>
        </div>
      </div>

      <div className='mt-4 flex flex-wrap gap-2'>
        <Button variant='outline' className='rounded-xl' asChild>
          <Link href='/dashboard/opportunities'>Back to opportunities</Link>
        </Button>
      </div>
    </Card>
  );
}

function OverviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border bg-background/70 p-3'>
      <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </div>
      <div className='mt-1 text-sm font-medium'>{value}</div>
    </div>
  );
}

function JobOverviewSkeleton() {
  return (
    <Card className='h-fit rounded-[18px] border border-border bg-card/95 p-4 shadow-sm'>
      <Skeleton className='h-6 w-32 rounded-md' />
      <div className='mt-4 space-y-3'>
        {[0, 1, 2, 3].map(item => (
          <Skeleton key={item} className='h-20 rounded-2xl' />
        ))}
      </div>
    </Card>
  );
}
