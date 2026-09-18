'use client';

import { BriefcaseBusiness, CalendarDays, MapPin } from 'lucide-react';

import { StatusBadge } from '@/app/dashboard/admin/_components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { formatRate } from '@/lib/rate-card';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { deliveryLabel, serviceLabel } from '@/src/features/organisation/jobs/lib/job-stage';

import { jobPlaceLabel } from '../job-place';

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
      {children}
    </Badge>
  );
}

/** A class job as read-only roles see it in the marketplace. */
export function JobCard({
  job,
  organisationName,
  contentTitle,
  onView,
}: {
  job: ClassMarketplaceJob;
  organisationName: string | null;
  contentTitle: string | null;
  onView: () => void;
}) {
  return (
    <article className='border-border/70 bg-card hover:border-border flex gap-4 rounded-md border p-5 shadow-sm transition hover:shadow-md'>
      <div
        aria-hidden
        className='border-primary/30 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-md border'
      >
        <BriefcaseBusiness className='size-5' />
      </div>

      <div className='min-w-0 flex-1 space-y-3'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h3 className='text-foreground truncate text-lg font-semibold tracking-tight'>
              {job.title || 'Untitled job'}
            </h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {organisationName ?? 'Organisation'} · {contentTitle ?? 'Course or program'}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {typeof job.instructor_pay === 'number' ? (
            <Badge className='border-primary/30 bg-primary/10 text-primary rounded-md px-2.5 py-0.5 text-xs font-semibold'>
              {formatRate(job.instructor_pay, job.rate_basis)}
            </Badge>
          ) : null}
          <MetaBadge>{job.class_visibility === 'PRIVATE' ? 'Private class' : 'Public class'}</MetaBadge>
          <MetaBadge>{serviceLabel(job.service_type, job.session_format)}</MetaBadge>
          <MetaBadge>{deliveryLabel(job.location_type)}</MetaBadge>
        </div>

        <div className='grid gap-2 sm:grid-cols-2'>
          <p className='text-muted-foreground flex items-center gap-2 text-sm'>
            <CalendarDays aria-hidden className='text-primary size-4' />
            <span>{formatDateTime(job.default_start_time, { fallback: 'Start not set' })}</span>
          </p>
          <p className='text-muted-foreground flex items-center gap-2 text-sm'>
            <MapPin aria-hidden className='text-primary size-4' />
            <span>{jobPlaceLabel(job, deliveryLabel(job.location_type))}</span>
          </p>
        </div>

        <p className='text-muted-foreground line-clamp-3 text-sm leading-6'>
          {job.description || 'No description has been provided for this posting yet.'}
        </p>

        <div className='pt-1'>
          <Button variant='outline' size='sm' onClick={onView}>
            View details
          </Button>
        </div>
      </div>
    </article>
  );
}
