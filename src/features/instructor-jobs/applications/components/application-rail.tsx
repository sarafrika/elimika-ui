import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { DetailRow, SectionCard } from '@/app/dashboard/admin/_components/ui';
import { canWithdraw } from '@/components/profile-job-marketplace/application-status';
import { estimatedJobTotal, jobPay } from '@/components/profile-job-marketplace/hired-jobs';
import { Button } from '@/components/ui/button';
import type { ClassMarketplaceJobApplication } from '@/services/client';

import { instructorCalendarHref } from '../../job-routes';
import { calendarSummary, scheduleLabel, whereLabel } from '../application-view';

export function ApplicationRail({
  application,
  onWithdraw,
}: {
  application: ClassMarketplaceJobApplication;
  onWithdraw: () => void;
}) {
  const job = application.job;
  const total = job ? estimatedJobTotal(job) : null;
  const teaches = job?.program_name || job?.course_name;
  const hired = application.status === 'hired';

  return (
    <aside className='flex flex-col gap-4 self-start' aria-label='About this job'>
      <SectionCard title='The job' bodyClassName='space-y-3'>
        <DetailRow
          label='Pay'
          value={job ? [jobPay(job), total].filter(Boolean).join(' · ') : '—'}
        />
        <DetailRow label='Schedule' value={scheduleLabel(job)} />
        <DetailRow label='Where' value={whereLabel(job)} />
        {teaches ? <DetailRow label='Teaches' value={teaches} /> : null}
      </SectionCard>

      <SectionCard title='Your calendar' bodyClassName='space-y-3'>
        <p className='text-muted-foreground text-sm'>{calendarSummary(application)}</p>
        <Button variant='outline' size='sm' asChild>
          <Link href={instructorCalendarHref()}>
            <CalendarDays aria-hidden className='size-4' />
            Open calendar
          </Link>
        </Button>
      </SectionCard>

      {canWithdraw(application.status) ? (
        <SectionCard bodyClassName='space-y-3'>
          <h2 className='text-foreground font-semibold'>Can’t take this job any more?</h2>
          <p className='text-muted-foreground text-sm'>
            {hired
              ? 'Withdrawing releases the blocked sessions and reopens the job to other instructors.'
              : 'Withdrawing releases the pencilled sessions. You can apply again while the job is open.'}
          </p>
          <Button
            variant='outline'
            className='text-destructive hover:text-destructive border-destructive/40'
            onClick={onWithdraw}
          >
            Withdraw application
          </Button>
        </SectionCard>
      ) : null}
    </aside>
  );
}
