'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminTheme, SectionCardSkeleton } from '@/app/dashboard/admin/_components/ui';
import { hiredJobData, jobPay } from '@/components/profile-job-marketplace/hired-jobs';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { STALE_TIMES } from '@/lib/query-client';
import type { ClassMarketplaceJobApplication } from '@/services/client';
import {
  getJobApplicationOptions,
  listJobApplicationEventsOptions,
  listMyApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { myApplicationsQueryArgs } from '../../job-queries';
import {
  applicationPageHref,
  findWorkHref,
  jobPageHref,
  myApplicationsHref,
} from '../../job-routes';
import { deliveryLabel, longDate, organisationOf } from '../application-view';
import { ApplicationActivity } from './application-activity';
import { ApplicationProgress } from './application-progress';
import { ApplicationRail } from './application-rail';
import { ApplicationStageChip } from './application-stage';
import { WithdrawApplicationDialog } from './withdraw-application-dialog';

export function ApplicationDetailSkeleton() {
  return (
    <div className='flex flex-col gap-4' aria-hidden>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-2/3 max-w-lg' />
        <Skeleton className='h-4 w-1/2 max-w-md' />
      </div>
      <SectionCardSkeleton withHeader={false} rows={3} />
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <SectionCardSkeleton rows={5} />
        <SectionCardSkeleton rows={4} />
      </div>
    </div>
  );
}

/** One application, resolved through the instructor's own list so nobody reads another's. */
export function ApplicationDetailPage({ applicationUuid }: { applicationUuid: string }) {
  const profile = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const list = useQuery({
    ...listMyApplicationsOptions(myApplicationsQueryArgs),
    enabled: Boolean(profile?.uuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });
  const row = list.data?.content?.find(application => application.uuid === applicationUuid);
  const jobUuid = row?.job_uuid;
  const path = { jobUuid: jobUuid ?? '', applicationUuid };

  const detail = useQuery({
    ...getJobApplicationOptions({ path }),
    enabled: Boolean(jobUuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });
  const events = useQuery({
    ...listJobApplicationEventsOptions({ path }),
    enabled: Boolean(jobUuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });

  const application = useMemo<ClassMarketplaceJobApplication | undefined>(() => {
    if (!row) return undefined;
    if (!detail.data) return row;
    return { ...row, ...detail.data, job: detail.data.job ?? row.job };
  }, [row, detail.data]);

  const title = application?.job?.title || 'Application';

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard' },
      { id: 'jobs', title: 'Jobs', url: findWorkHref() },
      { id: 'applications', title: 'My applications', url: myApplicationsHref() },
      {
        id: 'application',
        title,
        url: applicationPageHref(applicationUuid),
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, title, applicationUuid]);

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' className='-ml-2 w-fit' asChild>
          <Link href={myApplicationsHref()}>
            <ArrowLeft aria-hidden className='size-4' />
            My applications
          </Link>
        </Button>

        <AsyncSection
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          errorTitle='Couldn’t load this application'
          skeleton={<ApplicationDetailSkeleton />}
          empty={!application}
          emptyState={
            <EmptyState
              icon={SearchX}
              title='Application not found'
              description='This application doesn’t exist, or it isn’t one of yours.'
              action={
                <Button asChild>
                  <Link href={myApplicationsHref()}>Back to my applications</Link>
                </Button>
              }
            />
          }
        >
          {application ? (
            <>
              <header className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0 space-y-2'>
                  <h1 className='text-foreground text-2xl font-bold tracking-tight break-words sm:text-3xl'>
                    {title}
                  </h1>
                  <p className='text-muted-foreground text-sm'>
                    {[
                      organisationOf(application.job),
                      deliveryLabel(application.job),
                      application.job ? jobPay(application.job) : null,
                      application.created_date
                        ? `applied ${longDate(application.created_date)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                  <ApplicationStageChip status={application.status} />
                  {jobUuid ? (
                    <Button variant='outline' asChild>
                      <Link href={jobPageHref(jobUuid)}>View job</Link>
                    </Button>
                  ) : null}
                </div>
              </header>

              <ApplicationProgress application={application} events={events.data ?? []} now={now} />

              <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
                <ApplicationActivity
                  events={events.data ?? []}
                  loading={Boolean(jobUuid) && events.isPending}
                  error={events.error}
                  onRetry={() => void events.refetch()}
                />
                <ApplicationRail
                  application={application}
                  onWithdraw={() => setWithdrawOpen(true)}
                />
              </div>
            </>
          ) : null}
        </AsyncSection>
      </div>

      <WithdrawApplicationDialog
        application={application ?? null}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </div>
  );
}
