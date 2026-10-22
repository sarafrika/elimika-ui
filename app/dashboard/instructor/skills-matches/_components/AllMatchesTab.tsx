'use client';

import { AsyncSection } from '@/components/data/async-section';
import { statusLabel } from '@/components/profile-job-marketplace/application-status';
import { hiredJobData } from '@/components/profile-job-marketplace/hired-jobs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getJobMatchesOptions,
  listMyApplicationsOptions,
  searchApplyToTrainCatalogueOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { instructorApplyToTrainHref } from '@/src/features/apply-to-train/links';
import { toApplyItem } from '@/src/features/apply-to-train/types';
import { skillsMatchesHref } from '@/src/features/dashboard/lib/skills-matches-url';
import { applicationPageHref, jobPageHref } from '@/src/features/instructor-jobs/job-routes';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';

function OverviewSection({
  title,
  description,
  href,
  count,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle,
  children,
}: {
  title: string;
  description: string;
  href: string;
  count?: number;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  empty: boolean;
  emptyTitle: string;
  children: ReactNode;
}) {
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <CardTitle>
            <h2>{title}</h2>
          </CardTitle>
          {count !== undefined && !error && <Badge variant='secondary'>{count}</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <div className='flex-1'>
          <AsyncSection
            loading={loading}
            error={error}
            onRetry={onRetry}
            errorTitle={`Couldn’t load ${title.toLowerCase()}`}
            empty={empty}
            emptyTitle={emptyTitle}
            skeleton={
              <div className='space-y-3'>
                {[0, 1, 2].map(index => (
                  <Skeleton key={index} className='h-20 rounded-lg' />
                ))}
              </div>
            }
          >
            {children}
          </AsyncSection>
        </div>
        <Button asChild variant='outline' className='w-full'>
          <Link href={href}>
            View all <ArrowRight className='size-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

const previewClasses =
  'border-border hover:border-primary/50 hover:bg-muted/40 block space-y-1 rounded-lg border p-3 transition-colors';

const UNAVAILABLE_MATCHES = [
  { tab: 'projects', title: 'Projects', icon: FolderKanban },
  { tab: 'workshop', title: 'Workshop', icon: CalendarDays },
] as const;

export default function AllMatchesTab() {
  const profile = useUserProfile();
  const enabled = Boolean(profile?.uuid);

  const jobsQuery = useQuery({
    ...getJobMatchesOptions({ query: { limit: 3 } }),
    enabled,
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });
  const trainingQuery = useQuery({
    ...searchApplyToTrainCatalogueOptions({
      query: { show: 'all', fit: 'open', page: '0', size: '3' },
    }),
    enabled,
    staleTime: STALE_TIMES.live,
    retry: retryUnlessClientOrSearchError,
    select: hiredJobData,
  });
  const applicationsQuery = useQuery({
    ...listMyApplicationsOptions({ query: { pageable: { page: 0, size: 3 } } }),
    enabled,
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });

  const jobs = useMemo(
    () => (jobsQuery.data?.items ?? []).filter(job => job.uuid),
    [jobsQuery.data]
  );
  const trainingItems = useMemo(
    () =>
      (trainingQuery.data?.content ?? []).flatMap(hit => {
        const item = toApplyItem(hit);
        return item ? [item] : [];
      }),
    [trainingQuery.data]
  );
  const applications = useMemo(
    () => (applicationsQuery.data?.content ?? []).filter(application => application.uuid),
    [applicationsQuery.data]
  );

  return (
    <div className='space-y-5'>
      <p className='text-muted-foreground text-sm'>
        Explore suggested jobs, courses and programmes you can apply to train, and your
        applications.
      </p>
      <div className='grid items-stretch gap-4 xl:grid-cols-3'>
        <OverviewSection
          title='Jobs'
          description='Top job suggestions based on your profile and skills.'
          href={skillsMatchesHref('jobs')}
          loading={jobsQuery.isPending}
          error={jobsQuery.error}
          onRetry={() => void jobsQuery.refetch()}
          empty={jobs.length === 0}
          emptyTitle='No suggested jobs right now'
        >
          <div className='space-y-3'>
            {jobs.map(
              job =>
                job.uuid && (
                  <Link key={job.uuid} href={jobPageHref(job.uuid)} className={previewClasses}>
                    <p className='text-foreground font-medium'>{job.title || 'Class job'}</p>
                    {job.location_name && (
                      <p className='text-muted-foreground text-sm'>{job.location_name}</p>
                    )}
                    {job.match?.reasons?.[0] && (
                      <p className='text-muted-foreground text-sm'>{job.match.reasons[0]}</p>
                    )}
                  </Link>
                )
            )}
          </div>
        </OverviewSection>
        <OverviewSection
          title='Apply to Train'
          description='Courses and programmes accepting training applications.'
          href={skillsMatchesHref('apply-to-train')}
          count={
            trainingQuery.data
              ? Number(trainingQuery.data.metadata?.totalElements ?? trainingItems.length)
              : undefined
          }
          loading={trainingQuery.isPending}
          error={trainingQuery.error}
          onRetry={() => void trainingQuery.refetch()}
          empty={trainingItems.length === 0}
          emptyTitle='No training opportunities right now'
        >
          <div className='space-y-3'>
            {trainingItems.map(item => (
              <Link
                key={`${item.kind}:${item.uuid}`}
                href={instructorApplyToTrainHref(item)}
                className={previewClasses}
              >
                <p className='text-foreground font-medium'>{item.title}</p>
                <p className='text-muted-foreground text-sm'>
                  {item.kind === 'program' ? 'Programme' : 'Course'}
                  {item.creator ? ` · ${item.creator}` : ''}
                </p>
                {item.matchesSkills && <Badge variant='secondary'>Matches your skills</Badge>}
              </Link>
            ))}
          </div>
        </OverviewSection>
        <OverviewSection
          title='My Applications'
          description='Your job applications and their current status.'
          href={skillsMatchesHref('my-applications')}
          count={
            applicationsQuery.data
              ? Number(applicationsQuery.data.metadata?.totalElements ?? applications.length)
              : undefined
          }
          loading={applicationsQuery.isPending}
          error={applicationsQuery.error}
          onRetry={() => void applicationsQuery.refetch()}
          empty={applications.length === 0}
          emptyTitle='No job applications yet'
        >
          <div className='space-y-3'>
            {applications.map(
              application =>
                application.uuid && (
                  <Link
                    key={application.uuid}
                    href={applicationPageHref(application.uuid)}
                    className={previewClasses}
                  >
                    <p className='text-foreground font-medium'>
                      {application.job?.title || 'Job application'}
                    </p>
                    {application.job?.organisation_name && (
                      <p className='text-muted-foreground text-sm'>
                        {application.job.organisation_name}
                      </p>
                    )}
                    <Badge variant='outline'>{statusLabel(application.status)}</Badge>
                  </Link>
                )
            )}
          </div>
        </OverviewSection>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        {UNAVAILABLE_MATCHES.map(({ tab, title, icon: Icon }) => (
          <Card key={tab}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Icon className='text-muted-foreground size-4' />
                <h2>{title}</h2>
              </CardTitle>
              <CardDescription>Not yet available</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant='outline' size='sm'>
                <Link href={skillsMatchesHref(tab)}>View {title.toLowerCase()}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
