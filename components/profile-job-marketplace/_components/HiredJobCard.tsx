import { ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  dayAndTime,
  deliveryLabel,
  isFuture,
  organisationOf,
  sessionsAre,
  shortDate,
} from '@/src/features/instructor-jobs/applications/application-view';
import { ReadinessChip } from '@/src/features/instructor-jobs/components/readiness-chip';
import { hiredJobHref, instructorClassHref } from '@/src/features/instructor-jobs/job-routes';
import { estimatedJobTotal, jobPay, sessionsPhrase } from '../hired-jobs';
import { isClassCreatedStatus } from '../application-status';
import type { HiredApplication } from '../use-hired-applications';
import { DetailRow, surfaceTheme } from '@/components/data-display';

const FORMAT_LABELS: Record<string, string> = { GROUP: 'Group', INDIVIDUAL: 'Private' };

function initialsOf(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

export type NextSession = { start: number | null; loading: boolean; failed: boolean };

function nextSessionText(application: HiredApplication, next: NextSession | undefined) {
  if (next?.loading) return 'Checking…';
  if (next?.start) return dayAndTime(next.start);
  const first = application.job?.first_session_start;
  if (isFuture(first)) return dayAndTime(first);
  return next?.failed ? 'See the class' : 'None in the next two months';
}

/** A hired job, either still waiting on its class or already staffed by it. */
export function HiredJobCard({
  application,
  nextSession,
}: {
  application: HiredApplication;
  nextSession?: NextSession;
}) {
  const job = application.job;
  const org = organisationOf(job);
  const orgName = job?.organisation_name?.trim() || 'Organisation';
  const classCreated = isClassCreatedStatus(application.status);
  const classUuid = job?.class_definition_uuid;
  const title = job?.title || 'Class job';
  const total = job ? estimatedJobTotal(job) : null;
  const schedule =
    [sessionsPhrase(job?.session_count, ''), FORMAT_LABELS[job?.session_format ?? '']]
      .filter(Boolean)
      .join(' · ') || 'To be confirmed';
  const pay = job ? [jobPay(job), total].filter(Boolean).join(' · ') : 'Not set';
  const hiredOn = shortDate(application.reviewed_at ?? application.updated_date);
  const visibleAction = classCreated ? 'Hire details' : 'View hire details';

  return (
    <article className={cn(surfaceTheme.card, 'flex h-full flex-col gap-4 p-5')}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
              {initialsOf(orgName)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-semibold'>{orgName}</p>
            <p className='text-muted-foreground truncate text-sm'>
              {job?.branch_name || deliveryLabel(job) || 'Location to be confirmed'}
            </p>
          </div>
        </div>
        <ReadinessChip
          label={classCreated ? 'Class created' : 'Class not created yet'}
          tone={classCreated ? 'success' : 'warning'}
        />
      </div>

      <h2 className='text-foreground text-lg leading-snug font-semibold break-words'>{title}</h2>

      <div className='grid gap-3 sm:grid-cols-3'>
        <DetailRow label='Schedule' value={schedule} />
        {classCreated ? (
          <DetailRow label='Next session' value={nextSessionText(application, nextSession)} />
        ) : (
          <DetailRow
            label='First session'
            value={dayAndTime(job?.first_session_start) ?? 'To be confirmed'}
          />
        )}
        <DetailRow label='Pay' value={pay} />
      </div>

      {classCreated ? null : (
        <div className='border-primary/30 bg-primary/5 text-foreground flex items-start gap-3 rounded-md border px-4 py-3 text-sm'>
          <Info aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
          <p>
            {hiredOn ? `Hired on ${hiredOn}. ` : ''}
            {org} is creating the class.{' '}
            {sessionsAre(job?.session_count, 'already blocked', 'Your')}, and you’ll be notified
            when the class is ready.
          </p>
        </div>
      )}

      <div className='mt-auto flex flex-wrap items-center justify-between gap-3'>
        {job?.contact_name || job?.contact_phone ? (
          <p className='text-muted-foreground text-sm'>
            Contact person:{' '}
            {job?.contact_name ? (
              <span className='text-foreground font-medium'>{job.contact_name}</span>
            ) : null}
            {job?.contact_name && job?.contact_phone ? ' · ' : null}
            {job?.contact_phone ? (
              <a
                href={`tel:${job.contact_phone.replace(/\s+/g, '')}`}
                className='text-primary underline-offset-4 hover:underline'
              >
                {job.contact_phone}
              </a>
            ) : null}
          </p>
        ) : (
          <span />
        )}
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link
              href={hiredJobHref(application.job_uuid)}
              aria-label={`${visibleAction} for ${title}`}
            >
              {visibleAction}
            </Link>
          </Button>
          {classCreated && classUuid ? (
            <Button size='sm' asChild>
              <Link href={instructorClassHref(classUuid)} aria-label={`Open class for ${title}`}>
                Open class
                <ArrowRight aria-hidden className='size-4' />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HiredJobCardSkeleton() {
  return (
    <div className={cn(surfaceTheme.card, 'space-y-4 p-5')} aria-hidden>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Skeleton className='size-9 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
        <Skeleton className='h-6 w-28 rounded-full' />
      </div>
      <Skeleton className='h-5 w-3/4' />
      <div className='grid gap-3 sm:grid-cols-3'>
        {[0, 1, 2].map(item => (
          <Skeleton key={item} className='h-14 w-full' />
        ))}
      </div>
      <Skeleton className='h-16 w-full' />
    </div>
  );
}
