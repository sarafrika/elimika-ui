'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Search,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
} from '@/app/dashboard/@admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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

  const {
    data: applicationsResponse,
    isLoading,
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery({
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

  const applicationsLoading = isLoading && !applicationsResponse;

  const kpis = [
    { label: 'Total', value: stats.total, icon: BriefcaseBusiness, tone: 'info' as const },
    { label: 'Pending', value: stats.pending, icon: Clock, tone: 'warning' as const },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'success' as const },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, tone: 'destructive' as const },
  ];

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='My Applications'
          description='Search, filter, and track every marketplace job application you have submitted.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {applicationsLoading
            ? kpis.map(kpi => <StatCardSkeleton key={kpi.label} />)
            : kpis.map(kpi => (
                <StatCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  tone={kpi.tone}
                />
              ))}
        </div>

        <SectionCard title='Applications' bodyClassName='space-y-4'>
          <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]'>
            <label className='relative block'>
              <span className='sr-only'>Search applications</span>
              <Input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder='Search by job title, note, or job id'
                className='h-10 pl-10'
              />
              <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            </label>

            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
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

            <Select value={sortBy} onValueChange={value => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className='h-10'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='newest'>Most Recent</SelectItem>
                <SelectItem value='oldest'>Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AsyncSection
            loading={applicationsLoading}
            error={applicationsError}
            empty={!filteredApplications.length}
            onRetry={() => refetchApplications()}
            skeleton={
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {[0, 1, 2].map(item => (
                  <Skeleton key={item} className='h-48 rounded-md' />
                ))}
              </div>
            }
            errorTitle='Couldn’t load your applications'
            emptyState={
              <EmptyState
                icon={BriefcaseBusiness}
                title='No applications yet'
                description='No applications match the current filters.'
                variant='compact'
              />
            }
          >
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredApplications.map(application => {
                const job = jobsByUuid.get(application.job_uuid ?? '');

                return (
                  <div
                    key={application.uuid}
                    className='flex h-full flex-col rounded-md border border-border/70 bg-card p-5 shadow-sm'
                  >
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='min-w-0 space-y-1'>
                        <h3 className='truncate text-base font-semibold tracking-tight'>
                          {job?.title ?? 'Unknown job'}
                        </h3>
                        <div className='flex flex-wrap gap-2 text-sm text-muted-foreground'>
                          <span>{job?.location_name || formatLabel(job?.location_type)}</span>
                        </div>
                      </div>

                      <StatusBadge status={application.status} label={formatLabel(application.status)} />
                    </div>

                    <div className='mt-4'>
                      <DetailGrid
                        columns={1}
                        items={[
                          { label: 'Application note', value: application.application_note || 'No note added.' },
                          { label: 'Review notes', value: application.review_notes || 'No review notes yet.' },
                        ]}
                      />
                    </div>

                    <div className='mt-auto flex flex-wrap items-center gap-2 pt-4'>
                      <Badge variant='outline' className='rounded-md'>
                        Applied {formatDate(application.created_date)}
                      </Badge>

                      {application.reviewed_at ? (
                        <Badge variant='outline' className='rounded-md'>
                          Reviewed {formatDate(application.reviewed_at)}
                        </Badge>
                      ) : null}

                      <div className='ml-auto flex flex-wrap gap-2'>
                        <Button asChild variant='outline' size='sm'>
                          <Link href='/dashboard/opportunities'>
                            View opportunities
                            <ArrowRight className='ml-2 size-4' />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AsyncSection>
        </SectionCard>
      </div>
    </div>
  );
}
