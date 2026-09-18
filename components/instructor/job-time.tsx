'use client';

import { Building2, CalendarClock, Lock } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type ApiDateInput, parseApiDate, resolveDisplayZone } from '@/lib/date';
import { JOB_TIME_LABELS, type JobTimeKind, jobTimeHref } from '@/lib/instructor-job-time';
import { cn } from '@/lib/utils';

export const JOB_TIME_STYLES: Record<JobTimeKind, string> = {
  hold: 'bg-job-hold border-warning/60 text-foreground',
  application: 'border-dashed border-primary/40 bg-primary/5 text-muted-foreground',
};

export function JobTimeLegend({
  kinds = ['hold', 'application'],
  className,
}: {
  kinds?: JobTimeKind[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-sm', className)}>
      {kinds.map(kind => (
        <div key={kind} className='flex items-center gap-1.5'>
          <span className={cn('h-3 w-3 shrink-0 rounded border', JOB_TIME_STYLES[kind])} />
          <span className='text-muted-foreground'>{JOB_TIME_LABELS[kind].legend}</span>
        </div>
      ))}
    </div>
  );
}

export type JobTimeDetail = {
  kind: JobTimeKind;
  title: string;
  start: ApiDateInput;
  end: ApiDateInput;
  organisationName?: string | null;
  jobUuid?: string | null;
  timeZone?: string | null;
};

function windowLabel(detail: JobTimeDetail) {
  const zone = resolveDisplayZone(detail.timeZone);
  const start = parseApiDate(detail.start)?.tz(zone);
  const end = parseApiDate(detail.end)?.tz(zone);
  if (!start) return 'Time not recorded';
  const range = end ? `${start.format('h:mm A')} – ${end.format('h:mm A')}` : start.format('h:mm A');
  return `${start.format('ddd D MMM YYYY')} · ${range}`;
}

const EXPLANATIONS: Record<JobTimeKind, string> = {
  hold: 'You were hired for this job. Its sessions stay held on your calendar until the organisation creates the class, so nothing else can be booked into this time. A hold cannot be edited or deleted here.',
  application:
    'You applied for this job. Nothing is blocked until the organisation hires you, so you can still take other work at this time.',
};

/** Read-only details for held or applied-for job time; it is never an editable calendar item. */
export function JobTimeDetailsDialog({
  detail,
  onClose,
}: {
  detail: JobTimeDetail | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(detail)} onOpenChange={open => (open ? undefined : onClose())}>
      <DialogContent className='sm:max-w-md'>
        {detail ? (
          <>
            <DialogHeader>
              <div className='flex items-center gap-2'>
                <Badge variant={detail.kind === 'hold' ? 'warning' : 'outline'}>
                  {JOB_TIME_LABELS[detail.kind].status}
                </Badge>
              </div>
              <DialogTitle>{detail.title}</DialogTitle>
              <DialogDescription>{EXPLANATIONS[detail.kind]}</DialogDescription>
            </DialogHeader>
            <div
              className={cn('space-y-2 rounded-md border p-3 text-sm', JOB_TIME_STYLES[detail.kind])}
            >
              <p className='flex items-center gap-2'>
                <CalendarClock className='text-muted-foreground h-4 w-4 shrink-0' />
                <span>{windowLabel(detail)}</span>
              </p>
              {detail.organisationName ? (
                <p className='flex items-center gap-2'>
                  <Building2 className='text-muted-foreground h-4 w-4 shrink-0' />
                  <span>{detail.organisationName}</span>
                </p>
              ) : null}
              {detail.kind === 'hold' ? (
                <p className='flex items-center gap-2'>
                  <Lock className='text-muted-foreground h-4 w-4 shrink-0' />
                  <span>Blocks bookings and new availability</span>
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={onClose}>
                Close
              </Button>
              <Button asChild>
                <Link href={jobTimeHref(detail.kind, detail.jobUuid)}>
                  {detail.kind === 'hold' ? 'View hired job' : 'View my applications'}
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
