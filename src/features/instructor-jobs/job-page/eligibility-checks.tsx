'use client';

import { Check, Minus, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRateAmount, formatRateBasis } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobEligibility,
} from '@/services/client/types.gen';

import { applyToTrainHref, rateCardHref, verificationHref } from '../job-links';
import type { RateStanding } from '../job-readiness';

type CheckState = 'pass' | 'fail' | 'warn' | 'waiting';

const MARKS: Record<CheckState, { icon: ReactNode; tone: string; label: string }> = {
  pass: { icon: <Check className='size-3.5' />, tone: 'bg-success/10 text-success', label: 'Passed' },
  fail: { icon: <X className='size-3.5' />, tone: 'bg-destructive/10 text-destructive', label: 'Not met' },
  warn: { icon: '!', tone: 'bg-warning/10 text-warning', label: 'Needs attention' },
  waiting: { icon: <Minus className='size-3.5' />, tone: 'bg-muted text-muted-foreground', label: 'Not checked yet' },
};

function CheckRow({
  state,
  title,
  detail,
  action,
}: {
  state: CheckState;
  title: string;
  detail: ReactNode;
  action?: ReactNode;
}) {
  const mark = MARKS[state];
  return (
    <li className='border-border/60 flex items-start gap-3 border-b py-3.5 last:border-b-0'>
      <span
        aria-hidden
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
          mark.tone
        )}
      >
        {mark.icon}
      </span>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <p className='text-foreground text-sm font-semibold'>
          <span className='sr-only'>{mark.label}: </span>
          {title}
        </p>
        <p className='text-muted-foreground text-[13px]'>{detail}</p>
        {action ? <div className='mt-1'>{action}</div> : null}
      </div>
    </li>
  );
}

function ChecksSkeleton() {
  return (
    <ul aria-hidden>
      {[0, 1, 2, 3].map(row => (
        <li key={row} className='flex items-start gap-3 py-3.5'>
          <Skeleton className='size-6 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-3 w-56' />
          </div>
        </li>
      ))}
    </ul>
  );
}

const linkAction = (href: string, label: string) => (
  <Button asChild variant='outline' size='sm'>
    <Link href={href}>{label}</Link>
  </Button>
);

/** The four checks an application must pass, each with the action that fixes it. */
export function EligibilityChecks({
  job,
  eligibility,
  rate,
  loading,
  error,
  onRetry,
  sessionCount,
  clashCount,
  contentTitle,
  creatorName,
  onSeeClashes,
}: {
  job: ClassMarketplaceJob;
  eligibility: ClassMarketplaceJobEligibility | undefined;
  rate: RateStanding | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  sessionCount: number;
  clashCount: number;
  contentTitle: string | null;
  creatorName: string | null;
  onSeeClashes: () => void;
}) {
  const noun = job.program_uuid ? 'program' : 'course';
  const content = contentTitle ?? `this ${noun}`;
  const phrase = formatRateBasis(job.rate_basis).replace(' ', '-');
  const pay = typeof job.instructor_pay === 'number' ? formatRateAmount(job.instructor_pay) : null;
  const creator = creatorName ?? 'the course creator';

  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeleton={<ChecksSkeleton />}
      errorTitle='Couldn’t check whether you can apply'
    >
      {eligibility ? (
        <ul>
          {eligibility.instructor_verified === false ? (
            <CheckRow
              state='fail'
              title='Verified instructor'
              detail='An administrator has to verify your instructor profile before you can apply.'
              action={linkAction(verificationHref(), 'Check your profile')}
            />
          ) : (
            <CheckRow state='pass' title='Verified instructor' detail='Your instructor profile is verified.' />
          )}

          {eligibility.training_approved === false ? (
            <CheckRow
              state='fail'
              title={`Approved to train this ${noun}`}
              detail={`You haven’t been approved to train ${content} yet.`}
              action={linkAction(applyToTrainHref(job), `Apply to train this ${noun}`)}
            />
          ) : (
            <CheckRow
              state='pass'
              title={`Approved to train this ${noun}`}
              detail={`You’re approved to train ${content}.`}
            />
          )}

          <RateCheck
            job={job}
            rate={rate}
            phrase={phrase}
            pay={pay}
            creator={creator}
            trainingApproved={eligibility.training_approved !== false}
          />

          {eligibility.schedule_clear === false ? (
            <CheckRow
              state='fail'
              title='Fits your calendar'
              detail={`${clashCount || 'Some'} of ${sessionCount} sessions clash. Free those times, then apply.`}
              action={
                <Button variant='outline' size='sm' onClick={onSeeClashes}>
                  See the clashes
                </Button>
              }
            />
          ) : (
            <CheckRow
              state='pass'
              title='Fits your calendar'
              detail={`${sessionCount === 1 ? 'The session is' : `All ${sessionCount} sessions are`} free. Checked again when you apply.`}
            />
          )}
        </ul>
      ) : null}
    </AsyncSection>
  );
}

function RateCheck({
  job,
  rate,
  phrase,
  pay,
  creator,
  trainingApproved,
}: {
  job: ClassMarketplaceJob;
  rate: RateStanding | null;
  phrase: string;
  pay: string | null;
  creator: string;
  trainingApproved: boolean;
}) {
  const title = `Approved ${phrase} rate`;
  if (!trainingApproved) {
    return (
      <CheckRow
        state='waiting'
        title={title}
        detail='Checked once you’re approved to train this course.'
      />
    );
  }
  if (!rate || rate.kind === 'resolving') {
    return (
      <li className='flex items-start gap-3 py-3.5' aria-busy>
        <Skeleton className='size-6 rounded-full' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-3 w-56' />
        </div>
      </li>
    );
  }
  const scope = job.session_format === 'INDIVIDUAL' ? 'private' : 'group';
  const where = job.location_type === 'ONLINE' ? 'online' : 'in person';
  switch (rate.kind) {
    case 'ok':
      return (
        <CheckRow
          state='pass'
          title={title}
          detail={
            rate.approvedRate !== null && pay
              ? `Your rate of ${formatRateAmount(rate.approvedRate)} is within this job’s pay of ${pay}.`
              : 'Your approved rate fits this job’s pay.'
          }
        />
      );
    case 'above_pay':
      return (
        <CheckRow
          state='fail'
          title={title}
          detail={`Your rate of ${formatRateAmount(rate.approvedRate)} is above this job’s pay${pay ? ` of ${pay}` : ''}.`}
          action={linkAction(rateCardHref(job), 'Review your rate')}
        />
      );
    case 'awaiting':
      return (
        <CheckRow
          state='warn'
          title={title}
          detail={`Your ${phrase} rate is awaiting approval. You can apply once ${creator} approves it.`}
          action={linkAction(rateCardHref(job), 'View rate card')}
        />
      );
    case 'missing':
      return (
        <CheckRow
          state='warn'
          title={title}
          detail={`Your rate card has no ${phrase} rate for ${scope} classes ${where}.`}
          action={linkAction(rateCardHref(job), `Add a ${phrase} rate`)}
        />
      );
  }
}
