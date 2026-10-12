'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, CalendarCheck, CalendarX, Users, Wallet } from 'lucide-react';
import Link from 'next/link';

import { SectionCard, SectionCardSkeleton } from '@/components/data-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { isForbidden } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { getJobCandidatesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { JobCandidate } from '@/services/client/types.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useDiscoveryEvents } from '@/src/features/discovery/discovery-events';

const instructorHref = (uuid: string) =>
  dashboardUrl('organisation', `instructors/${encodeURIComponent(uuid)}`);

function matchPercent(score: number | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

/**
 * "Suggested instructors" for an open job (`GET /classes/jobs/{jobUuid}/candidates`).
 * Staff only: the panel disappears entirely on a 403. Shows the name, town, verification
 * and the match summary only; rates and schedule clashes are never itemised.
 */
export function JobSuggestedInstructors({ jobUuid }: { jobUuid: string }) {
  const track = useDiscoveryEvents();
  const query = useQuery({
    ...getJobCandidatesOptions({ path: { jobUuid }, query: { limit: 10 } }),
    enabled: Boolean(jobUuid),
    staleTime: STALE_TIMES.entity,
  });

  if (isForbidden(query.error)) return null;

  const list = query.data?.data;
  const candidates = (list?.items ?? []).filter(
    (candidate): candidate is JobCandidate & { instructor_uuid: string } =>
      Boolean(candidate.instructor_uuid)
  );

  return (
    <SectionCard
      title='Suggested instructors'
      description='Instructors whose skills, location and availability fit this job.'
    >
      {query.isLoading ? (
        <SectionCardSkeleton rows={3} withHeader={false} />
      ) : query.error ? (
        <div className='flex flex-wrap items-center gap-2 text-sm' role='alert'>
          <span className='text-destructive'>
            {getErrorMessage(query.error, 'Couldn’t load suggestions.')}
          </span>
          <Button variant='ghost' size='sm' onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          variant='plain'
          icon={Users}
          title='No suggestions yet'
          description='No approved instructor matches this job right now.'
        />
      ) : (
        <ol className='divide-y' aria-label='Suggested instructors'>
          {candidates.map((candidate, position) => {
            const percent = matchPercent(candidate.match?.score);
            return (
              <li key={candidate.instructor_uuid} className='space-y-1.5 py-3 first:pt-0 last:pb-0'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <Link
                      href={instructorHref(candidate.instructor_uuid)}
                      className='text-foreground inline-flex items-center gap-1 text-sm font-medium hover:underline'
                      onClick={() =>
                        track({
                          recommendationId: list?.recommendation_id,
                          itemUuid: candidate.instructor_uuid,
                          itemType: 'instructor',
                          eventType: 'CLICK',
                          position,
                        })
                      }
                    >
                      <span className='truncate'>{candidate.display_name || 'Instructor'}</span>
                      {candidate.admin_verified ? (
                        <BadgeCheck className='text-primary size-4 shrink-0' aria-label='Verified' />
                      ) : null}
                    </Link>
                    {candidate.location_name ? (
                      <p className='text-muted-foreground truncate text-xs'>
                        {candidate.location_name}
                      </p>
                    ) : null}
                  </div>
                  {percent !== null ? (
                    <Badge variant='secondary' aria-label={`Match ${percent} percent`}>
                      {percent}% match
                    </Badge>
                  ) : null}
                </div>
                {candidate.match?.reasons?.length ? (
                  <ul className='text-muted-foreground list-disc space-y-0.5 pl-4 text-xs'>
                    {candidate.match.reasons.slice(0, 3).map(reason => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
                <div className='flex flex-wrap gap-1.5'>
                  {typeof candidate.match?.schedule_clear === 'boolean' ? (
                    <Badge variant='outline' className='gap-1 font-normal'>
                      {candidate.match.schedule_clear ? (
                        <CalendarCheck className='size-3' aria-hidden />
                      ) : (
                        <CalendarX className='size-3' aria-hidden />
                      )}
                      {candidate.match.schedule_clear ? 'Schedule clear' : 'Schedule busy'}
                    </Badge>
                  ) : null}
                  {typeof candidate.match?.rate_within_budget === 'boolean' ? (
                    <Badge variant='outline' className='gap-1 font-normal'>
                      <Wallet className='size-3' aria-hidden />
                      {candidate.match.rate_within_budget ? 'Within budget' : 'Above budget'}
                    </Badge>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
