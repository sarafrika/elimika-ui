import { BadgeCheck, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date';
import { formatRateAmount, formatRateBasis } from '@/lib/rate-card';
import type { ClassMarketplaceJob, Organisation } from '@/services/client/types.gen';
import { deliveryLabel, serviceLabel } from '@/src/features/organisation/jobs/lib/job-stage';

import { ReadinessChip } from '../components/readiness-chip';
import {
  inDaysLabel,
  initialsOf,
  type JobFacts,
  sessionDate,
} from '../job-facts';

function Fact({ label, value, hint }: { label: string; value: ReactNode; hint: ReactNode }) {
  return (
    <div className='bg-card flex min-w-0 flex-col gap-0.5 px-3.5 py-3'>
      <dt className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</dt>
      <dd className='text-foreground truncate text-[17px] font-bold tracking-tight tabular-nums'>
        {value}
      </dd>
      <dd className='text-muted-foreground truncate text-xs'>{hint}</dd>
    </div>
  );
}

/** Shown above the hero once a job stops taking applications. */
export function ClosedBanner({ job, facts }: { job: ClassMarketplaceJob; facts: JobFacts }) {
  return (
    <p
      role='status'
      className='border-warning/40 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border px-3.5 py-3 text-sm'
    >
      <Clock aria-hidden className='text-warning mt-0.5 size-4 shrink-0' />
      <span>
        <strong>Applications are closed.</strong>{' '}
        {job.status === 'open' && facts.closesAt
          ? `The first session started on ${sessionDate(facts.first, 'ddd D MMM')}, so this job no longer takes applications.`
          : 'This job is no longer taking applications.'}
      </span>
    </p>
  );
}

/** Organisation, title and badges over the six facts an instructor weighs first. */
export function JobHero({
  job,
  facts,
  open,
  now,
  organisation,
  organisationLoading,
}: {
  job: ClassMarketplaceJob;
  facts: JobFacts;
  open: boolean;
  now: number;
  organisation: Organisation | undefined;
  organisationLoading: boolean;
}) {
  const verified = organisation?.admin_verified === true;
  const pay = typeof job.instructor_pay === 'number' ? job.instructor_pay : null;
  const hours = Math.round(facts.totalHours * 10) / 10;

  return (
    <section
      aria-labelledby='job-title'
      className='border-border/70 bg-card flex flex-col gap-5 rounded-md border p-4 shadow-sm sm:p-6'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <span
            aria-hidden
            className='bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold'
          >
            {initialsOf(organisation?.name)}
          </span>
          <div className='min-w-0'>
            {organisation ? (
              <p className='text-foreground flex items-center gap-1.5 text-[15px] font-semibold'>
                <span className='truncate'>{organisation.name}</span>
                {verified ? (
                  <BadgeCheck
                    role='img'
                    aria-label='Verified organisation'
                    className='text-success size-4 shrink-0'
                  />
                ) : null}
              </p>
            ) : organisationLoading ? (
              <Skeleton className='h-4 w-40' />
            ) : (
              <p className='text-foreground text-[15px] font-semibold'>Organisation</p>
            )}
            <p className='text-muted-foreground text-[13px]'>
              {[
                verified ? 'Verified organisation' : null,
                job.branch_name,
                job.created_date ? `posted ${formatDate(job.created_date)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <ReadinessChip label={open ? 'Open' : 'Closed'} tone={open ? 'success' : 'muted'} />
      </div>

      <div className='flex flex-col gap-2.5'>
        <h1
          id='job-title'
          className='text-foreground max-w-4xl text-2xl leading-tight font-bold tracking-tight sm:text-3xl'
        >
          {job.title || 'Untitled job'}
        </h1>
        <div className='flex flex-wrap gap-1.5'>
          {job.rate_basis ? (
            <Badge className='border-primary/30 bg-primary/10 text-primary rounded-md font-semibold'>
              Billed {formatRateBasis(job.rate_basis)}
            </Badge>
          ) : null}
          <Badge variant='outline' className='rounded-md'>
            {serviceLabel(job.service_type, job.session_format)}
          </Badge>
          <Badge variant='outline' className='rounded-md'>
            {deliveryLabel(job.location_type)}
          </Badge>
          <Badge variant='outline' className='rounded-md'>
            {job.class_visibility === 'PRIVATE' ? 'Private class' : 'Public class'}
          </Badge>
        </div>
      </div>

      <dl className='bg-border/70 grid grid-cols-2 gap-px overflow-hidden rounded-md border sm:grid-cols-3 xl:grid-cols-6'>
        <Fact
          label='Pay'
          value={pay === null ? '—' : formatRateAmount(pay)}
          hint={pay === null ? 'shown once you’re verified' : formatRateBasis(job.rate_basis)}
        />
        <Fact
          label='Estimated total'
          value={facts.estimatedTotal === null ? '—' : formatRateAmount(facts.estimatedTotal)}
          hint='for the posted schedule'
        />
        <Fact
          label='Sessions'
          value={`${facts.sessionCount}${facts.capped ? '+' : ''}`}
          hint={`${hours} hour${hours === 1 ? '' : 's'} in all`}
        />
        <Fact
          label='Starts'
          value={sessionDate(facts.first)}
          hint={facts.last ? `ends ${sessionDate(facts.last)}` : 'no sessions yet'}
        />
        <Fact
          label='Class size'
          value={
            job.session_format === 'INDIVIDUAL'
              ? '1 learner'
              : typeof job.max_participants === 'number'
                ? `Up to ${job.max_participants}`
                : 'Open'
          }
          hint={`waitlist ${job.allow_waitlist ? 'on' : 'off'}`}
        />
        <Fact
          label='Applications close'
          value={open ? sessionDate(facts.first) : 'Closed'}
          hint={
            open
              ? inDaysLabel(facts, now)
              : job.status === 'open'
                ? 'first session started'
                : 'no longer open'
          }
        />
      </dl>
    </section>
  );
}

export function JobHeroSkeleton() {
  return (
    <div className='border-border/70 bg-card flex flex-col gap-5 rounded-md border p-6 shadow-sm'>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-11 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-44' />
          <Skeleton className='h-3 w-64' />
        </div>
      </div>
      <Skeleton className='h-8 w-3/4' />
      <div className='flex gap-2'>
        <Skeleton className='h-5 w-28' />
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-5 w-20' />
      </div>
      <Skeleton className='h-20 w-full rounded-md' />
    </div>
  );
}
