'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleAlert, CircleCheck, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { surfaceTheme } from '@/components/data-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { isForbidden, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getJobMatchesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { JobMatch, JobMatchSkill } from '@/services/client/types.gen';
import { useDiscoveryEvents } from '@/src/features/discovery/discovery-events';
import { DistanceBandBadge } from '@/src/features/near-me/near-me-control';
import { deliveryLabel } from '@/src/features/organisation/jobs/lib/job-stage';

import { payLabel } from '../job-facts';
import { jobPageHref } from '../job-routes';

const INITIAL_VISIBLE = 4;

function matchPercent(score: number | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

function SkillChips({
  required,
  matched,
}: {
  required: readonly JobMatchSkill[];
  matched: readonly JobMatchSkill[];
}) {
  if (required.length === 0) return null;
  const have = new Set(matched.map(skill => skill.skill_uuid));
  return (
    <div className='space-y-1'>
      <p className='text-muted-foreground text-xs'>
        You hold {matched.length} of {required.length} required skill
        {required.length === 1 ? '' : 's'}
      </p>
      <ul className='flex flex-wrap gap-1' aria-label='Required skills'>
        {required.map(skill => {
          const held = have.has(skill.skill_uuid);
          return (
            <li key={skill.skill_uuid}>
              <Badge
                variant={held ? 'secondary' : 'outline'}
                className={cn('gap-1 font-normal', !held && 'text-muted-foreground')}
              >
                {held ? (
                  <CircleCheck className='text-success size-3' aria-label='You have this skill' />
                ) : null}
                {skill.skill_name}
                {skill.is_mandatory === false ? ' (optional)' : ''}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * "Best matches" in Find work (`GET /classes/jobs/matches`): open jobs ranked for this
 * instructor, each with why it fits and whether they can apply. Ineligible jobs sink to
 * the bottom with their reason. Clicks and dismissals feed the ranking.
 */
export function BestMatches() {
  const track = useDiscoveryEvents();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const query = useQuery({
    ...getJobMatchesOptions({ query: { limit: 20 } }),
    staleTime: STALE_TIMES.live,
    retry: retryUnlessClientOrSearchError,
  });

  const list = query.data?.data;
  const recommendationId = list?.recommendation_id;
  const ranked = useMemo(() => {
    const items = (list?.items ?? []).map((job, position) => ({ job, position }));
    const eligible = items.filter(item => item.job.match?.eligibility?.eligible !== false);
    const ineligible = items.filter(item => item.job.match?.eligibility?.eligible === false);
    return [...eligible, ...ineligible].filter(
      item => item.job.uuid && !dismissed.has(item.job.uuid)
    );
  }, [list, dismissed]);

  if (isForbidden(query.error)) return null;

  const visible = expanded ? ranked : ranked.slice(0, INITIAL_VISIBLE);

  return (
    <section
      aria-labelledby='best-matches-heading'
      className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-3 p-4')}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2
            id='best-matches-heading'
            className='text-foreground flex items-center gap-2 text-base font-semibold'
          >
            <Sparkles aria-hidden className='text-primary size-4' />
            Best matches
          </h2>
          <p className='text-muted-foreground text-sm'>
            Jobs that fit your skills, courses, rates and schedule.
          </p>
        </div>
      </div>

      {query.isLoading ? (
        <div className='grid gap-3 md:grid-cols-2' role='status' aria-label='Loading best matches'>
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-32 w-full' />
        </div>
      ) : query.error ? (
        <div className='flex flex-wrap items-center gap-2 text-sm' role='alert'>
          <span className='text-destructive'>
            {getErrorMessage(query.error, 'Couldn’t load your best matches.')}
          </span>
          <Button variant='ghost' size='sm' onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState
          variant='plain'
          icon={Sparkles}
          title='No matches yet'
          description='Add skills to your profile and get approved to train courses to see jobs picked for you.'
        />
      ) : (
        <>
          <ol className='grid gap-3 md:grid-cols-2' aria-label='Best matching jobs'>
            {visible.map(({ job, position }) => (
              <li key={job.uuid}>
                <MatchCard
                  job={job}
                  onOpen={() =>
                    track({
                      recommendationId,
                      itemUuid: job.uuid,
                      itemType: 'job',
                      eventType: 'CLICK',
                      position,
                    })
                  }
                  onDismiss={() => {
                    track({
                      recommendationId,
                      itemUuid: job.uuid,
                      itemType: 'job',
                      eventType: 'DISMISS',
                      position,
                    });
                    setDismissed(previous => new Set(previous).add(job.uuid ?? ''));
                  }}
                />
              </li>
            ))}
          </ol>
          {ranked.length > INITIAL_VISIBLE ? (
            <div className='flex justify-center'>
              <Button variant='ghost' size='sm' onClick={() => setExpanded(value => !value)}>
                {expanded ? 'Show fewer' : `Show all ${ranked.length} matches`}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function MatchCard({
  job,
  onOpen,
  onDismiss,
}: {
  job: JobMatch;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const match = job.match;
  const eligibility = match?.eligibility;
  const eligible = eligibility?.eligible !== false;
  const percent = matchPercent(match?.score);
  const place =
    job.location_type === 'ONLINE'
      ? 'Online'
      : job.branch_name || job.location_name || deliveryLabel(job.location_type);

  return (
    <article
      className={cn(
        'border-border/70 bg-card flex h-full flex-col gap-2 rounded-md border p-3',
        !eligible && 'bg-muted/30'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <Link
            href={jobPageHref(job.uuid ?? '')}
            onClick={onOpen}
            className='text-foreground line-clamp-2 text-sm font-semibold hover:underline'
          >
            {job.title || 'Untitled job'}
          </Link>
          <p className='text-muted-foreground truncate text-xs'>
            {place} · {payLabel(job)}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          {percent !== null ? (
            <Badge variant='secondary' aria-label={`Match ${percent} percent`}>
              {percent}%
            </Badge>
          ) : null}
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={onDismiss}
            aria-label={`Not interested in ${job.title || 'this job'}`}
          >
            <X className='size-4' />
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-1.5'>
        {eligible ? (
          <Badge variant='outline' className='border-success/40 text-success gap-1 font-normal'>
            <CircleCheck className='size-3' aria-hidden />
            You can apply
          </Badge>
        ) : (
          <Badge variant='outline' className='border-warning/40 text-warning gap-1 font-normal'>
            <CircleAlert className='size-3' aria-hidden />
            Can’t apply yet
          </Badge>
        )}
        <DistanceBandBadge band={job.distance_band} />
      </div>
      {!eligible && eligibility?.reason ? (
        <p className='text-muted-foreground text-xs'>{eligibility.reason}</p>
      ) : null}

      {match?.reasons?.length ? (
        <ul className='text-muted-foreground list-disc space-y-0.5 pl-4 text-xs'>
          {match.reasons.slice(0, 3).map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <SkillChips required={match?.required_skills ?? []} matched={match?.matched_skills ?? []} />
    </article>
  );
}
