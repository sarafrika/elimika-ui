import { CalendarClock, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';

import { SectionCard } from '@/app/dashboard/admin/_components/ui';
import { cn } from '@/lib/utils';
import type {
  ClassMarketplaceJobApplication,
  ClassMarketplaceJobApplicationEvent,
} from '@/services/client';

import { hiredJobHref, jobPageHref } from '../../job-routes';
import {
  applicationNote,
  isJobOpen,
  type NoteTone,
  type ProgressStep,
  progressSteps,
} from '../application-view';
import { trackerSegmentClass } from './application-stage';

const NOTE_TONES: Record<NoteTone, { box: string; icon: string }> = {
  info: { box: 'border-primary/30 bg-primary/5', icon: 'text-primary' },
  success: { box: 'border-success/30 bg-success/10', icon: 'text-success' },
  warning: { box: 'border-warning/30 bg-warning/10', icon: 'text-warning' },
  muted: { box: 'border-border/70 bg-muted/40', icon: 'text-muted-foreground' },
};

const STEP_STATE_TEXT: Record<ProgressStep['state'], string> = {
  done: 'completed',
  current: 'current stage',
  reached: 'reached',
  upcoming: 'not reached',
};

const linkClass = 'text-primary font-medium underline-offset-4 hover:underline';

export function ApplicationProgress({
  application,
  events,
  now,
}: {
  application: ClassMarketplaceJobApplication;
  events: ClassMarketplaceJobApplicationEvent[];
  now: number;
}) {
  const steps = progressSteps(application, events);
  const note = applicationNote(application, events, now);
  const tone = NOTE_TONES[note.tone];
  const status = application.status;
  const jobUuid = application.job_uuid;
  const Icon =
    note.tone === 'success' ? CheckCircle2 : status === 'interviewing' ? CalendarClock : Info;

  return (
    <SectionCard bodyClassName='space-y-5'>
      <ol aria-label='Application progress' className='grid gap-3 sm:grid-cols-5 sm:gap-2'>
        {steps.map(step => (
          <li
            key={step.key}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className='flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2'
          >
            <span
              aria-hidden
              className={cn(
                'h-1.5 w-8 shrink-0 rounded-full sm:w-auto',
                trackerSegmentClass[step.state]
              )}
            />
            <span className='flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-2 sm:flex-col sm:items-start sm:gap-1'>
              <span
                className={cn(
                  'text-sm font-semibold',
                  step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {step.label}
                <span className='sr-only'>, {STEP_STATE_TEXT[step.state]}</span>
              </span>
              {step.hint ? (
                <span className='text-muted-foreground text-xs'>{step.hint}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div
        className={cn(
          'text-foreground flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
          tone.box
        )}
      >
        <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', tone.icon)} />
        <p>
          <strong className='font-semibold'>{note.title}</strong> {note.body}
          {jobUuid && (status === 'hired' || status === 'assigned') ? (
            <>
              {' '}
              <Link href={hiredJobHref(jobUuid)} className={linkClass}>
                Hire details
              </Link>
            </>
          ) : null}
          {jobUuid && status === 'withdrawn' && isJobOpen(application.job) ? (
            <>
              {' '}
              <Link href={jobPageHref(jobUuid)} className={linkClass}>
                Apply again
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </SectionCard>
  );
}
