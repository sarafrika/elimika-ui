'use client';

import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, CalendarClock, Layers } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminTheme } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJobApplication } from '@/services/client';
import { listMyApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import {
  dayAndTime,
  isClosedApplication,
  isInProgressApplication,
  organisationOf,
  soonestInterview,
} from '@/src/features/instructor-jobs/applications/application-view';
import {
  ApplicationsList,
  ApplicationsListSkeleton,
} from '@/src/features/instructor-jobs/applications/components/applications-list';
import { WithdrawApplicationDialog } from '@/src/features/instructor-jobs/applications/components/withdraw-application-dialog';
import { JobsSectionTabs } from '@/src/features/instructor-jobs/components/jobs-section-tabs';
import { myApplicationsQueryArgs } from '@/src/features/instructor-jobs/job-queries';
import {
  applicationPageHref,
  findWorkHref,
  myApplicationsHref,
} from '@/src/features/instructor-jobs/job-routes';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { hiredJobData } from '../hired-jobs';

type Segment = 'in-progress' | 'closed';

const PAGE_SIZE = 10;

export function MyJobApplicationsPage() {
  const profile = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [segment, setSegment] = useState<Segment>('in-progress');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [withdrawing, setWithdrawing] = useState<ClassMarketplaceJobApplication | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard' },
      { id: 'jobs', title: 'Jobs', url: findWorkHref() },
      { id: 'applications', title: 'My applications', url: myApplicationsHref(), isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const applications = useQuery({
    ...listMyApplicationsOptions(myApplicationsQueryArgs),
    enabled: Boolean(profile?.uuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });

  const { inProgress, closed } = useMemo(() => {
    const rows = applications.data?.content ?? [];
    return {
      inProgress: rows.filter(row => isInProgressApplication(row.status)),
      closed: rows.filter(row => isClosedApplication(row.status)),
    };
  }, [applications.data]);

  const rows = segment === 'in-progress' ? inProgress : closed;
  const interview = useMemo(() => soonestInterview(inProgress, now), [inProgress, now]);
  const loaded = Boolean(applications.data);
  const truncated = Boolean(applications.data?.metadata?.hasNext);

  const segments: { id: Segment; label: string; count: number }[] = [
    { id: 'in-progress', label: 'In progress', count: inProgress.length },
    { id: 'closed', label: 'Closed', count: closed.length },
  ];

  const selectSegment = (next: Segment) => {
    setSegment(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <PageHeader
          title='Jobs'
          description='Class jobs posted by organisations. Check the fit before you apply, then follow each application through to the class.'
          actions={
            <Button variant='outline' asChild>
              <Link href={dashboardUrl('instructor', 'rate-card')}>
                <Layers className='size-4' />
                Rate cards
              </Link>
            </Button>
          }
        />
        <JobsSectionTabs />

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div
            role='group'
            aria-label='Application status'
            className='bg-muted inline-flex rounded-lg p-1'
          >
            {segments.map(item => {
              const active = item.id === segment;
              return (
                <Button
                  key={item.id}
                  variant='ghost'
                  size='sm'
                  aria-pressed={active}
                  onClick={() => selectSegment(item.id)}
                  className={cn(
                    'rounded-md px-3 font-normal',
                    active
                      ? 'bg-background text-foreground hover:bg-background font-medium shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                  {loaded ? <span className='tabular-nums'>({item.count})</span> : null}
                </Button>
              );
            })}
          </div>
          <p className='text-muted-foreground hidden text-sm sm:block'>
            Applied → Shortlisted → Interview → Offer → Hired
          </p>
        </div>

        {segment === 'in-progress' && interview?.uuid ? (
          <div className='border-primary/30 bg-primary/5 text-foreground flex items-start gap-3 rounded-md border px-4 py-3 text-sm'>
            <CalendarClock aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
            <p>
              <strong className='font-semibold'>
                Interview on {dayAndTime(interview.interview_at)}
              </strong>{' '}
              with {organisationOf(interview.job)} for {interview.job?.title || 'this job'}.{' '}
              <Link
                href={applicationPageHref(interview.uuid)}
                className='text-primary font-medium underline-offset-4 hover:underline'
              >
                See details
              </Link>
            </p>
          </div>
        ) : null}

        <section className={cn(adminTheme.card, 'overflow-hidden')}>
          <AsyncSection
            loading={applications.isPending}
            error={applications.error}
            onRetry={() => void applications.refetch()}
            errorTitle='Couldn’t load your applications'
            className='m-4'
            skeleton={<ApplicationsListSkeleton />}
            empty={rows.length === 0}
            emptyState={
              segment === 'in-progress' ? (
                <EmptyState
                  variant='plain'
                  icon={BriefcaseBusiness}
                  title='No applications in progress'
                  description='Jobs you apply for show up here while the organisation decides.'
                  action={
                    <Button asChild>
                      <Link href={findWorkHref()}>Find work</Link>
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  variant='plain'
                  icon={BriefcaseBusiness}
                  title='No closed applications'
                  description='Applications you withdrew or were not selected for show up here.'
                />
              )
            }
          >
            <ApplicationsList
              applications={rows.slice(0, visible)}
              now={now}
              onWithdraw={setWithdrawing}
            />
            {rows.length > visible ? (
              <div className='border-border/60 flex justify-center border-t px-4 py-3'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setVisible(count => count + PAGE_SIZE)}
                >
                  Show more ({rows.length - visible} left)
                </Button>
              </div>
            ) : null}
          </AsyncSection>
        </section>

        {truncated ? (
          <p className='text-muted-foreground text-sm'>
            Showing your {applications.data?.content?.length ?? 0} most recent applications.
          </p>
        ) : null}
      </div>

      <WithdrawApplicationDialog
        application={withdrawing}
        open={Boolean(withdrawing)}
        onOpenChange={open => {
          if (!open) setWithdrawing(null);
        }}
      />
    </div>
  );
}
