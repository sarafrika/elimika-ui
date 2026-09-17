'use client';

import { BriefcaseBusiness, Layers } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { adminTheme } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { JobsSectionTabs } from '@/src/features/instructor-jobs/components/jobs-section-tabs';
import { BlockedWeek } from '@/src/features/instructor-jobs/hired/components/blocked-week';
import { useNextClassSessions } from '@/src/features/instructor-jobs/hired/use-next-class-sessions';
import { findWorkHref, hiredJobsHref } from '@/src/features/instructor-jobs/job-routes';
import { isClassCreatedStatus } from '../application-status';
import { useHiredApplications } from '../use-hired-applications';
import { HiredJobCard, HiredJobCardSkeleton } from './HiredJobCard';

export function HiredJobsPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const hires = useHiredApplications();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor' },
      { id: 'jobs', title: 'Jobs', url: findWorkHref() },
      { id: 'hired', title: 'Hired', url: hiredJobsHref(), isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  // Jobs still waiting on their class come first: those are the ones with something pending.
  const applications = useMemo(
    () =>
      [...hires.applications].sort(
        (a, b) => Number(isClassCreatedStatus(a.status)) - Number(isClassCreatedStatus(b.status))
      ),
    [hires.applications]
  );
  const classUuids = useMemo(
    () =>
      applications.flatMap(application =>
        isClassCreatedStatus(application.status) && application.job?.class_definition_uuid
          ? [application.job.class_definition_uuid]
          : []
      ),
    [applications]
  );
  const sessions = useNextClassSessions(classUuids);
  const empty = !hires.isPending && !hires.error && applications.length === 0;

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

        {empty ? null : (
          <BlockedWeek applications={applications} applicationsPending={hires.isPending} />
        )}

        <AsyncSection
          loading={hires.isPending}
          error={hires.error}
          errorTitle='Couldn’t load your hired jobs'
          onRetry={() => void hires.refetch()}
          skeleton={
            <div className='grid gap-4 lg:grid-cols-2'>
              <HiredJobCardSkeleton />
              <HiredJobCardSkeleton />
            </div>
          }
          empty={applications.length === 0}
          emptyState={
            <EmptyState
              icon={BriefcaseBusiness}
              title='No hired jobs yet'
              description='When an organisation hires you, the job shows up here and its sessions are blocked on your calendar.'
              action={
                <Button asChild>
                  <Link href={findWorkHref()}>Find work</Link>
                </Button>
              }
            />
          }
        >
          <ul className='grid gap-4 lg:grid-cols-2'>
            {applications.map(application => {
              const classUuid = application.job?.class_definition_uuid;
              return (
                <li key={application.job_uuid} className='h-full'>
                  <HiredJobCard
                    application={application}
                    nextSession={{
                      start: classUuid ? (sessions.nextByClass.get(classUuid) ?? null) : null,
                      loading: sessions.isPending,
                      failed: sessions.failed,
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </AsyncSection>
      </div>
    </div>
  );
}
