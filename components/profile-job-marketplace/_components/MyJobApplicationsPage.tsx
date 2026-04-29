'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Loader2,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClassMarketplaceJob } from '@/services/client';
import {
  listJobsOptions,
  listMyApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useBreadcrumb } from '../../../context/breadcrumb-provider';

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatLabel(value?: string | null) {
  if (!value) return 'Not provided';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

export function MyJobApplicationsPage() {
  const profile = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'approved' | 'rejected' | 'assigned'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'opportunities',
        title: 'Opportunities',
        url: '/dashboard/opportunities',
      },
      {
        id: 'applications',
        title: 'Applications',
        url: '/dashboard/opportunities/applications',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  // const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
  //   ...listJobsOptions({
  //     query: {
  //       pageable: {
  //         page: 0,
  //         size: PAGE_SIZE,
  //         sort: ['created_date,desc'],
  //       },
  //       ...(isOrganizationView && organisationUuid ? { organisation_uuid: organisationUuid } : {}),
  //     },
  //   }),
  //   enabled: true,
  // });
  const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
    ...listJobsOptions({ query: { pageable: {}, organisation_uuid: "ec237ec5-f13c-4248-bf70-8d0099cb3a15" } }),
    enabled: true,
  });

  const { data: applicationsResponse, isLoading } = useQuery({
    ...listMyApplicationsOptions({
      query: {
        pageable: {
          page: 0,
          size: 200,
          // sort: [sortBy === 'newest' ? 'created_date,desc' : 'created_date,asc'],
        },
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      },
    }),
    enabled: Boolean(profile?.uuid),
  });

  const applications = applicationsResponse?.data?.content ?? [];
  const jobs = jobsResponse?.data?.content ?? [];
  const jobsByUuid = useMemo(
    () => new Map(jobs.map((job: ClassMarketplaceJob) => [job.uuid ?? '', job] as const)),
    [jobs]
  );

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = [...applications].sort((left, right) => {
      const leftDate = left.created_date ? new Date(left.created_date).getTime() : 0;
      const rightDate = right.created_date ? new Date(right.created_date).getTime() : 0;
      return sortBy === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });

    return sorted.filter(application => {
      const job = jobsByUuid.get(application.job_uuid ?? '');
      const searchable = [
        job?.title,
        job?.description,
        job?.location_name,
        application.application_note,
        application.review_notes,
        application.status,
        application.job_uuid,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  }, [applications, jobsByUuid, searchQuery, sortBy]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter(application => application.status === 'pending').length,
      approved: applications.filter(application => application.status === 'approved').length,
      rejected: applications.filter(application => application.status === 'rejected').length,
    }),
    [applications]
  );

  if (isLoading && !applicationsResponse) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='text-muted-foreground size-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6 p-4 sm:p-6'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-semibold tracking-tight'>My Applications</h1>
        <p className='text-muted-foreground'>
          Search, filter, and track every marketplace job application you have submitted.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-4'>
        <Card className='rounded-2xl p-4 bg-transparent'>
          <div className='text-sm text-muted-foreground'>Total</div>
          <div className='mt-1 text-2xl font-semibold'>{stats.total}</div>
        </Card>
        <Card className='rounded-2xl p-4 bg-transparent'>
          <div className='text-sm text-muted-foreground'>Pending</div>
          <div className='mt-1 text-2xl font-semibold'>{stats.pending}</div>
        </Card>
        <Card className='rounded-2xl p-4 bg-transparent'>
          <div className='text-sm text-muted-foreground'>Approved</div>
          <div className='mt-1 text-2xl font-semibold'>{stats.approved}</div>
        </Card>
        <Card className='rounded-2xl p-4 bg-transparent'>
          <div className='text-sm text-muted-foreground'>Rejected</div>
          <div className='mt-1 text-2xl font-semibold'>{stats.rejected}</div>
        </Card>
      </div>

      <Card className='space-y-4 rounded-lg border-border border-1 bg-transparent p-4 shadow-sm'>
        <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]'>
          <label className='relative block'>
            <span className='sr-only'>Search applications</span>
            <Input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder='Search by job title, note, or job id'
              className='h-11 rounded-md pl-10'
            />
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          </label>

          <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className='h-11 rounded-md'>
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

          <Select value={sortBy} onValueChange={value => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className='h-11 rounded-md'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>Most Recent</SelectItem>
              <SelectItem value='oldest'>Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.length ? (
            filteredApplications.map(application => {
              const job = jobsByUuid.get(application.job_uuid ?? '');

              return (
                <Card
                  key={application.uuid}
                  className="h-full rounded-2xl border bg-background/70 p-4 flex flex-col"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">
                        {job?.title ?? 'Unknown job'}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>
                          {job?.location_name || formatLabel(job?.location_type)}
                        </span>
                        {job?.organisation_uuid ? (
                          <span>{job.organisation_uuid}</span>
                        ) : null}
                      </div>
                    </div>

                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {formatLabel(application.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Application note
                      </div>
                      <p className="mt-1 text-sm leading-6 text-foreground">
                        {application.application_note || 'No note added.'}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Review notes
                      </div>
                      <p className="mt-1 text-sm leading-6 text-foreground">
                        {application.review_notes || 'No review notes yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Push footer to bottom */}
                  <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                      Applied {formatDate(application.created_date)}
                    </Badge>

                    {application.reviewed_at ? (
                      <Badge variant="outline" className="rounded-full">
                        Reviewed {formatDate(application.reviewed_at)}
                      </Badge>
                    ) : null}

                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link href="/dashboard/opportunities">
                          View opportunities
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full rounded-2xl border-dashed p-10 text-center text-muted-foreground">
              No applications match the current filters.
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
