'use client';

import { BriefcaseBusiness, CalendarDays, Clock, MapPin, Video, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { deliveryLabel } from '@/src/features/organisation/jobs/lib/job-stage';

import { ReadinessChip } from '../components/readiness-chip';
import {
  classFormatLabel,
  closesLabel,
  estimatedTotalLabel,
  jobWhereLabel,
  payLabel,
  sessionDate,
  sessionsLabel,
  timesLabel,
} from '../job-facts';
import { jobPageHref } from '../job-routes';
import { ReadinessCta, ReadinessFixNote } from './readiness-cta';
import type { FindWorkRow } from './use-find-work-jobs';

function Meta({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <p className='text-muted-foreground flex min-w-0 items-center gap-2 text-sm'>
      <Icon aria-hidden className='text-muted-foreground size-4 shrink-0' />
      <span className='min-w-0 truncate'>{children}</span>
    </p>
  );
}

export function ReadinessChipSkeleton() {
  return (
    <div role='status' className='shrink-0'>
      <Skeleton aria-hidden className='h-6.5 w-28 rounded-full' />
      <span className='sr-only'>Checking whether you can apply</span>
    </div>
  );
}

/** One open job in Find work: what it pays, when and where, and whether you can apply. */
export function FindWorkJobCard({
  row,
  now,
  onApply,
}: {
  row: FindWorkRow;
  now: number;
  onApply: (job: ClassMarketplaceJob) => void;
}) {
  const { job, facts, readiness, organisation, application } = row;
  const jobUuid = job.uuid ?? '';
  const online = job.location_type === 'ONLINE';
  const place = online ? 'Online' : job.branch_name || deliveryLabel(job.location_type);
  const closes = closesLabel(facts, now);

  return (
    <article className='border-border/70 bg-card flex gap-4 rounded-md border p-4 shadow-sm sm:p-5'>
      <div
        aria-hidden
        className='border-primary/30 bg-primary/10 text-primary hidden size-11 shrink-0 items-center justify-center rounded-md border sm:flex'
      >
        <BriefcaseBusiness className='size-5' />
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-3'>
        <div className='flex flex-wrap items-start justify-between gap-x-3 gap-y-2'>
          <div className='min-w-0'>
            <h3 className='text-foreground text-lg leading-snug font-semibold tracking-tight'>
              {job.title || 'Untitled job'}
            </h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {organisation?.name ?? 'Organisation'} · {place}
            </p>
          </div>
          {readiness ? <ReadinessChip {...readiness} /> : <ReadinessChipSkeleton />}
        </div>

        <div className='flex flex-wrap items-center gap-1.5'>
          <Badge className='border-primary/30 bg-primary/10 text-primary rounded-md px-2.5 py-0.5 text-[13px] font-semibold'>
            {payLabel(job)}
          </Badge>
          <Badge variant='outline' className='rounded-md'>
            {classFormatLabel(job)}
          </Badge>
          <Badge variant='outline' className='rounded-md'>
            {deliveryLabel(job.location_type)}
          </Badge>
        </div>

        <div className='grid gap-x-4 gap-y-2 sm:grid-cols-2'>
          <Meta icon={CalendarDays}>
            {facts.first ? `Starts ${sessionDate(facts.first)}` : 'No start date'} ·{' '}
            {sessionsLabel(facts)}
          </Meta>
          <Meta icon={Clock}>{timesLabel(facts)}</Meta>
          <Meta icon={online ? Video : MapPin}>{jobWhereLabel(job)}</Meta>
          <Meta icon={Wallet}>{estimatedTotalLabel(job, facts)}</Meta>
        </div>

        {job.description ? (
          <p className='text-muted-foreground line-clamp-2 text-sm leading-6'>{job.description}</p>
        ) : null}

        {readiness ? <ReadinessFixNote readiness={readiness} /> : null}

        <div className='border-border/60 flex flex-wrap items-center gap-2 border-t pt-3'>
          <Button asChild size='sm' variant='outline'>
            <Link href={jobPageHref(jobUuid)}>View job</Link>
          </Button>
          <ReadinessCta
            job={job}
            readiness={readiness}
            applicationUuid={application?.uuid}
            onApply={onApply}
          />
          {closes ? (
            <span className='text-muted-foreground ml-auto text-[13px]'>{closes}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function FindWorkJobCardSkeleton() {
  return (
    <div className='border-border/70 bg-card flex gap-4 rounded-md border p-5 shadow-sm'>
      <Skeleton className='hidden size-11 shrink-0 rounded-md sm:block' />
      <div className='min-w-0 flex-1 space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='w-full space-y-2'>
            <Skeleton className='h-5 w-2/3' />
            <Skeleton className='h-3.5 w-1/3' />
          </div>
          <ReadinessChipSkeleton />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-20' />
        </div>
        <div className='grid gap-2 sm:grid-cols-2'>
          <Skeleton className='h-4 w-4/5' />
          <Skeleton className='h-4 w-3/5' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-2/3' />
        </div>
        <Skeleton className='h-4 w-full' />
        <div className='flex gap-2 pt-1'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-20' />
        </div>
      </div>
    </div>
  );
}
