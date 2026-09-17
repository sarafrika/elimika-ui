'use client';

import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminTheme } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { getJobOptions } from '@/services/client/@tanstack/react-query.gen';
import { findWorkHref, hiredJobsHref } from '@/src/features/instructor-jobs/job-routes';
import { hiredJobData } from '../hired-jobs';
import { useHiredApplications } from '../use-hired-applications';
import { HiredJobCard } from './HiredJobCard';
import { HiredJobListSkeleton } from './JobMarketplaceSkeletons';

export function HiredJobsPage() {
  const [page, setPage] = useState(0);
  const { replaceBreadcrumbs } = useBreadcrumb();
  const hires = useHiredApplications(page);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor' },
      { id: 'jobs', title: 'Jobs', url: findWorkHref() },
      { id: 'hired', title: 'Hired', url: hiredJobsHref(), isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const jobIds = useMemo(
    () =>
      hires.applications.flatMap(application =>
        application.job_uuid ? [application.job_uuid] : []
      ),
    [hires.applications]
  );
  // The jobs API has no bulk lookup. Limit detail requests to the six hires on this page;
  // organisation names use the shared batch lookup below.
  const jobs = useQueries({
    queries: jobIds.map(jobUuid => ({
      ...getJobOptions({ path: { jobUuid } }),
      staleTime: STALE_TIMES.entity,
      select: response => {
        const job = hiredJobData(response);
        if (!job) throw new Error('The hired job details are unavailable.');
        return job;
      },
    })),
    combine: results => ({
      data: results.flatMap(result => (result.data ? [result.data] : [])),
      isPending: results.some(result => result.isPending),
      isFetching: results.some(result => result.isFetching),
      error: results.find(result => result.error)?.error,
      refetch: () => Promise.all(results.map(result => result.refetch())),
    }),
  });
  const jobsById = useMemo(() => new Map(jobs.data.map(job => [job.uuid, job])), [jobs.data]);
  const organisationIds = useMemo(
    () => jobs.data.flatMap(job => (job.organisation_uuid ? [job.organisation_uuid] : [])),
    [jobs.data]
  );
  const { organisationMap } = useOrganisationsByIds(organisationIds);
  const loading = hires.isPending || jobs.isPending;
  const fetching = hires.isFetching || jobs.isFetching;

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <PageHeader
          title='Hired Jobs'
          description='View the jobs you have been hired for, including agreed pay, training schedules, and class details.'
        />
        <Button variant='ghost' size='sm' asChild className='text-muted-foreground w-fit'>
          <Link href='/dashboard/instructor/opportunities'>
            <ArrowLeft className='size-4' />
            Back to jobs
          </Link>
        </Button>
        <AsyncSection
          loading={loading}
          error={hires.error || jobs.error}
          errorTitle='Couldn’t load your hired jobs'
          onRetry={() => {
            void hires.refetch();
            void jobs.refetch();
          }}
          skeleton={<HiredJobListSkeleton />}
          empty={!hires.applications.length}
          emptyState={
            <EmptyState
              icon={BriefcaseBusiness}
              title={page === 0 ? 'No hired jobs yet' : 'No hired jobs on this page'}
              description='Jobs appear here when your application status is hired.'
            />
          }
        >
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {hires.applications.map(application => {
              const job = jobsById.get(application.job_uuid);
              if (!job) return null;
              return (
                <HiredJobCard
                  key={application.job_uuid}
                  application={application}
                  job={job}
                  organisationName={
                    job.organisation_uuid ? organisationMap[job.organisation_uuid]?.name : undefined
                  }
                />
              );
            })}
          </div>
        </AsyncSection>
        {(page > 0 || hires.hasNext) && (
          <nav
            aria-label='Hired jobs pagination'
            className='flex flex-wrap items-center justify-between gap-3'
          >
            <p className='text-muted-foreground text-sm' aria-live='polite'>
              Page {page + 1}
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                disabled={page === 0 || fetching}
                onClick={() => setPage(current => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                disabled={!hires.hasNext || fetching}
                onClick={() => setPage(current => current + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
