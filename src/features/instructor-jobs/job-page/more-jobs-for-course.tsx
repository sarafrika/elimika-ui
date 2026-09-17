'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { getEffectiveJobStatus } from '@/components/profile-job-marketplace/job-expiration';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { listJobsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';

import { ReadinessChip } from '../components/readiness-chip';
import { ReadinessChipSkeleton } from '../find-work/find-work-job-card';
import { useJobsReadiness } from '../hooks/use-jobs-readiness';
import { jobFacts, payLabel, sessionDate, sessionsLabel } from '../job-facts';
import { jobPageHref } from '../job-routes';

const SHOWN = 6;

/** Other open jobs teaching the same course or program, each with its own readiness. */
export function MoreJobsForCourse({
  job,
  contentTitle,
  now,
}: {
  job: ClassMarketplaceJob;
  contentTitle: string | null;
  now: number;
}) {
  const query = useQuery({
    ...listJobsOptions({
      query: {
        status: 'open',
        ...(job.program_uuid
          ? { program_uuid: job.program_uuid }
          : { course_uuid: job.course_uuid ?? '' }),
        pageable: { page: 0, size: SHOWN + 1 },
      },
    }),
    enabled: Boolean(job.program_uuid || job.course_uuid),
    staleTime: STALE_TIMES.live,
  });

  const content = query.data?.data?.content;
  const others = useMemo(
    () =>
      (content ?? [])
        .filter(other => other.uuid && other.uuid !== job.uuid)
        .filter(other => getEffectiveJobStatus(other, now) === 'open')
        .slice(0, SHOWN),
    [content, job.uuid, now]
  );
  const idGroups = useMemo(() => [others.flatMap(other => other.uuid ?? [])], [others]);
  const contentTitleFor = useCallback(() => contentTitle, [contentTitle]);
  const { rows } = useJobsReadiness({
    jobs: others,
    idGroups,
    contentTitleFor,
    now,
    enabled: others.length > 0,
  });
  const { organisationMap } = useOrganisationsByIds(
    useMemo(() => others.flatMap(other => other.organisation_uuid ?? []), [others])
  );

  if (!query.isLoading && !query.error && others.length === 0) return null;

  return (
    <section aria-labelledby='more-jobs-title' className='flex flex-col gap-3'>
      <h2 id='more-jobs-title' className='text-foreground text-base font-semibold'>
        More jobs for this {job.program_uuid ? 'program' : 'course'}
      </h2>
      <AsyncSection
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => query.refetch()}
        errorTitle='Couldn’t load more jobs for this course'
        skeleton={
          <div className='grid gap-3 sm:grid-cols-2'>
            <Skeleton className='h-28 rounded-md' />
            <Skeleton className='h-28 rounded-md' />
          </div>
        }
      >
        <ul className='grid gap-3 sm:grid-cols-2'>
          {others.map(other => {
            const facts = jobFacts(other);
            const readiness = rows.get(other.uuid ?? '')?.readiness ?? null;
            const organisation = other.organisation_uuid
              ? organisationMap[other.organisation_uuid]?.name
              : null;
            const place =
              other.location_type === 'ONLINE' ? 'Online' : other.branch_name || 'In person';
            return (
              <li key={other.uuid}>
                <Link
                  href={jobPageHref(other.uuid ?? '')}
                  className='border-border/70 bg-card hover:border-primary/40 focus-visible:ring-ring/50 flex h-full flex-col gap-2 rounded-md border p-4 shadow-sm outline-none focus-visible:ring-[3px]'
                >
                  <span className='text-muted-foreground text-[13px]'>
                    {organisation ?? 'Organisation'} · {place}
                  </span>
                  <strong className='text-foreground text-sm'>
                    {sessionsLabel(facts)} · from {sessionDate(facts.first)}
                  </strong>
                  <div className='mt-auto flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-foreground text-sm font-semibold'>{payLabel(other)}</span>
                    {readiness ? <ReadinessChip {...readiness} /> : <ReadinessChipSkeleton />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </AsyncSection>
    </section>
  );
}
